import { Hono } from "hono";
import { authMiddleware, memberMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { getCurrentMonthUserActivityRank, getUserActivityTotals } from "../lib/activity-calc.ts";
import { getUserTarget, getTodayTilawahTotal, getTodayMurojaahTotal, upsertUserTarget } from "../lib/targets.ts";
import { getUserStreak, getYearActivityHeatmap, getFreezeCreditsLeft, isFrozen, applyFreeze } from "../lib/streak.ts";
import { getWibDateYmd, getWibYearMonth } from "../lib/wib-date.ts";
import { ACTIVE_MEMBER_ROLES } from "../lib/roles.ts";
import { DashboardPage } from "../views/pages/DashboardPage.tsx";
import type { Env } from "../types.ts";

const dashboard = new Hono<Env>();

dashboard.use("*", authMiddleware, memberMiddleware);

export type RecentLogEntry = {
  type: "tilawah" | "murojaah";
  date_wib: string;
  juz_amount: number;
  log_unit: string | null;
  log_amount: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  repetition_count: number | null;
  created_at: string;
};

export type HeatmapCell = {
  date: string;
  state: "met" | "logged" | "empty" | "filler" | "frozen";
  count: number;
};

dashboard.get("/", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const todayWib = getWibDateYmd();
  const target = getUserTarget(user.id);
  const todayTilawah = getTodayTilawahTotal(user.id, todayWib);
  const todayMurojaah = getTodayMurojaahTotal(user.id, todayWib);
  const streak = getUserStreak(user.id, todayWib);
  const activityTotals = getUserActivityTotals(user.id);
  const monthlyRank = getCurrentMonthUserActivityRank(user.id);

  // Freeze credits
  const { year: wy, month: wm } = getWibYearMonth();
  const yearMonth = `${wy}-${String(wm).padStart(2, "0")}`;
  const freezeCreditsLeft = getFreezeCreditsLeft(user.id, yearMonth);
  const todayFrozen = isFrozen(user.id, todayWib);
  const hasTodayLog = (todayTilawah > 0 || todayMurojaah > 0);

  // Annual heatmap: selected year from ?year= (clamped to available years), default current year
  const currentYear = parseInt(todayWib.slice(0, 4), 10);
  const earliestYearRow = db
    .prepare(
      `SELECT MIN(y) AS y FROM (
         SELECT substr(date_wib, 1, 4) AS y FROM tilawah_logs WHERE user_id = ?
         UNION ALL
         SELECT substr(date_wib, 1, 4) AS y FROM murojaah_logs WHERE user_id = ?
         UNION ALL
         SELECT substr(date_wib, 1, 4) AS y FROM streak_freezes WHERE user_id = ?
       )`
    )
    .get(user.id, user.id, user.id) as { y: string | null };
  const earliestYear = earliestYearRow.y ? parseInt(earliestYearRow.y, 10) : null;
  const minYear = earliestYear ?? currentYear;

  const yearOptions: number[] = [];
  for (let y = minYear; y <= currentYear; y++) yearOptions.push(y);

  const qYear = parseInt(c.req.query("year") || "", 10);
  const selectedYear = Number.isInteger(qYear) && qYear >= minYear && qYear <= currentYear ? qYear : currentYear;

  const heatmapRaw = getYearActivityHeatmap(user.id, selectedYear);

  // Build full calendar-year grid (Jan 1 -> Dec 31, oldest → newest), padded to start on Sunday
  const metSet = new Set(heatmapRaw.filter((e) => e.met_target).map((e) => e.date));
  const countByDate = new Map(heatmapRaw.map((e) => [e.date, e.total_juz]));
  const frozenSet = new Set(heatmapRaw.filter((e) => e.frozen).map((e) => e.date));

  const [yearUtc, monthUtc] = [selectedYear, 0];
  const yearStartMs = Date.UTC(yearUtc, monthUtc, 1);
  const yearEndMs = Date.UTC(yearUtc, 11, 31);
  const numYearDays = Math.round((yearEndMs - yearStartMs) / 86400000) + 1;
  const yearDays: HeatmapCell[] = [];
  for (let i = 0; i < numYearDays; i++) {
    const ms = yearStartMs + i * 86400000;
    const cellDate = new Date(ms);
    const ymd = cellDate.toISOString().slice(0, 10);
    const count = countByDate.get(ymd) ?? 0;
    const frozen = frozenSet.has(ymd);
    yearDays.push({
      date: ymd,
      state: metSet.has(ymd) ? "met" : count > 0 ? "logged" : frozen ? "frozen" : "empty",
      count,
    });
  }

  // Pad front with filler cells so grid starts on Sunday
  const firstDow = new Date(yearDays[0]!.date + "T00:00:00Z").getDay();
  const heatmap: HeatmapCell[] = [
    ...Array.from({ length: firstDow }, () => ({ date: "", state: "filler" as const, count: 0 })),
    ...yearDays,
  ];

  // Recent logs (last 8 entries across both types)
  const recentLogs = db
    .prepare(
      `SELECT type, date_wib, juz_amount, log_unit, log_amount, end_surah, end_ayah, end_juz, repetition_count, created_at
       FROM (
         SELECT 'tilawah' AS type, date_wib, juz_amount, log_unit, log_amount, end_surah, end_ayah, end_juz,
                NULL AS repetition_count, created_at
         FROM tilawah_logs WHERE user_id = ?
         UNION ALL
         SELECT 'murojaah' AS type, date_wib, juz_amount, log_unit, log_amount, end_surah, end_ayah, end_juz,
                repetition_count, created_at
         FROM murojaah_logs WHERE user_id = ?
       )
       ORDER BY created_at DESC
       LIMIT 8`
    )
    .all(user.id, user.id) as RecentLogEntry[];

  // Khatam count from khatam_events (position-verified)
  const khatamRow = db
    .prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah'")
    .get(user.id) as { cnt: number };

  // Total active (non-suspended) members for rank context
  const rolesSql = ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");
  const totalActiveUsers = (db
    .prepare(`SELECT COUNT(*) AS cnt FROM users WHERE role IN (${rolesSql}) AND suspended_at IS NULL`)
    .get() as { cnt: number }).cnt;

  return c.html(
    <DashboardPage
      user={user}
      lang={lang}
      todayWib={todayWib}
      target={target}
      todayTilawah={todayTilawah}
      todayMurojaah={todayMurojaah}
      streak={streak}
      activityTotals={activityTotals}
      monthlyRank={monthlyRank}
      heatmap={heatmap}
      heatmapYear={selectedYear}
      heatmapYears={yearOptions}
      recentLogs={recentLogs}
      totalKhatam={khatamRow.cnt}
      totalActiveUsers={totalActiveUsers}
      freezeCreditsLeft={freezeCreditsLeft}
      todayFrozen={todayFrozen}
      hasTodayLog={hasTodayLog}
      success={c.req.query("success")}
      error={c.req.query("error")}
    />
  );
});

dashboard.post("/set-target", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const body = await c.req.parseBody();

  // Each target: amount in the chosen unit + unit ('juz' | 'pages'), converted to juz.
  // Pages: 20 pages = 1 juz (Mushaf Madinah).
  function parseTarget(raw: string, unit: string): number {
    if (!/^(\d+(\.\d{1,2})?)$/.test(raw)) return NaN;
    const amount = parseFloat(raw);
    if (!Number.isFinite(amount) || amount <= 0) return NaN;
    if (unit === "pages") {
      if (amount > 600) return NaN;
      return amount / 20;
    }
    if (amount > 30) return NaN;
    return amount;
  }

  const tilawahUnit = (body.tilawah_unit as string) === "pages" ? "pages" : "juz";
  const murojaahUnit = (body.murojaah_unit as string) === "pages" ? "pages" : "juz";

  const tilawah = parseTarget(((body.tilawah_juz_daily as string) || "").trim(), tilawahUnit);
  const murojaah = parseTarget(((body.murojaah_juz_daily as string) || "").trim(), murojaahUnit);

  if (!Number.isFinite(tilawah) || tilawah <= 0) {
    return c.redirect(`/dashboard?error=${encodeURIComponent(t(lang, "dailyTilawahTargetError"))}`);
  }
  if (!Number.isFinite(murojaah) || murojaah <= 0) {
    return c.redirect(`/dashboard?error=${encodeURIComponent(t(lang, "dailyMurojaahTargetError"))}`);
  }

  upsertUserTarget(user.id, tilawah, murojaah, tilawahUnit, murojaahUnit);
  return c.redirect(`/dashboard?success=${encodeURIComponent(t(lang, "targetSaved"))}`);
});

import { t } from "../lib/i18n.ts";

dashboard.post("/freeze", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const todayWib = getWibDateYmd();
  const result = applyFreeze(user.id, todayWib);

  if (!result.ok) {
    const msgKey = result.error === "no_credits" ? "freezeNoCredits"
      : result.error === "already_frozen" ? "freezeAlready"
      : "freezeNoStreak";
    return c.redirect(`/dashboard?error=${encodeURIComponent(t(lang, msgKey))}`);
  }

  return c.redirect(`/dashboard?success=${encodeURIComponent(t(lang, "freezeApplied"))}`);
});

export { dashboard as dashboardRoutes };
