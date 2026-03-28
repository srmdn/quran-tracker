import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { getCurrentMonthUserActivityRank, getUserActivityTotals } from "../lib/activity-calc.ts";
import { getUserTarget, getTodayTilawahTotal, getTodayMurojaahTotal } from "../lib/targets.ts";
import { getUserStreak, getActivityHeatmap } from "../lib/streak.ts";
import { getWibDateYmd } from "../lib/wib-date.ts";
import { ACTIVE_MEMBER_ROLES } from "../lib/roles.ts";
import { DashboardPage } from "../views/pages/DashboardPage.tsx";
import type { Env } from "../types.ts";

const dashboard = new Hono<Env>();

dashboard.use("*", authMiddleware, memberMiddleware, targetMiddleware);

export type RecentLogEntry = {
  type: "tilawah" | "murojaah";
  date_wib: string;
  juz_amount: number;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  repetition_count: number | null;
  created_at: string;
};

export type HeatmapCell = {
  date: string;
  state: "met" | "logged" | "empty" | "filler";
};

dashboard.get("/", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const todayWib = getWibDateYmd();
  const target = getUserTarget(user.id)!;
  const todayTilawah = getTodayTilawahTotal(user.id, todayWib);
  const todayMurojaah = getTodayMurojaahTotal(user.id, todayWib);
  const streak = getUserStreak(user.id);
  const activityTotals = getUserActivityTotals(user.id);
  const monthlyRank = getCurrentMonthUserActivityRank(user.id);
  const heatmapRaw = getActivityHeatmap(user.id, 90);

  // Build full 90-day heatmap grid (oldest → newest), padded to start on Sunday
  const metSet = new Set(heatmapRaw.filter((e) => e.met_target).map((e) => e.date));
  const loggedSet = new Set(heatmapRaw.map((e) => e.date));

  const [ty, tm, td] = todayWib.split("-").map(Number);
  const todayUtcMs = Date.UTC(ty!, tm! - 1, td!);

  const days90: HeatmapCell[] = [];
  for (let i = 89; i >= 0; i--) {
    const ms = todayUtcMs - i * 86400000;
    const ymd = new Date(ms).toISOString().slice(0, 10);
    days90.push({
      date: ymd,
      state: metSet.has(ymd) ? "met" : loggedSet.has(ymd) ? "logged" : "empty",
    });
  }

  // Pad front with filler cells so grid starts on Sunday
  const firstDow = new Date(days90[0]!.date + "T00:00:00Z").getDay();
  const heatmap: HeatmapCell[] = [
    ...Array.from({ length: firstDow }, () => ({ date: "", state: "filler" as const })),
    ...days90,
  ];

  // Recent logs (last 8 entries across both types)
  const recentLogs = db
    .prepare(
      `SELECT type, date_wib, juz_amount, end_surah, end_ayah, end_juz, repetition_count, created_at
       FROM (
         SELECT 'tilawah' AS type, date_wib, juz_amount, end_surah, end_ayah, end_juz,
                NULL AS repetition_count, created_at
         FROM tilawah_logs WHERE user_id = ?
         UNION ALL
         SELECT 'murojaah' AS type, date_wib, juz_amount, end_surah, end_ayah, end_juz,
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
      recentLogs={recentLogs}
      totalKhatam={khatamRow.cnt}
      totalActiveUsers={totalActiveUsers}
    />
  );
});

export { dashboard as dashboardRoutes };
