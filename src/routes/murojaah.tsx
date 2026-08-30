import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, getWibYearMonth, getWibMonthRange, validateWibLogDate } from "../lib/wib-date.ts";
import { getUserMonthScore, notifyOvertakenUsers } from "../lib/overtaken-email.ts";
import { getUserTarget, getTodayMurojaahTotal, MUROJAAH_DAILY_CEILING_JUZ } from "../lib/targets.ts";
import { checkAndUpdateStreak, rebuildStreak } from "../lib/streak.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { parseLogSubmission } from "../lib/log-validate.ts";
import { sendStreakMilestoneEmail, isStreakMilestone } from "../lib/milestone-email.ts";
import { t } from "../lib/i18n.ts";
import { MurojaahPage } from "../views/pages/MurojaahPage.tsx";
import { EditLogPage } from "../views/pages/EditLogPage.tsx";
import type { Env } from "../types.ts";

const murojaah = new Hono<Env>();

murojaah.use("*", authMiddleware, memberMiddleware, targetMiddleware);

type MurojaahLog = {
  id: number;
  date_wib: string;
  juz_amount: number;
  log_unit: string | null;
  log_amount: number | null;
  repetition_count: number | null;
  start_surah: number | null;
  start_ayah: number | null;
  start_juz: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  created_at: string;
  updated_at: string | null;
};

const LOG_SELECT = "id, date_wib, juz_amount, log_unit, log_amount, repetition_count, start_surah, start_ayah, start_juz, end_surah, end_ayah, end_juz, created_at, updated_at";

function redirectWith(kind: "success" | "error", message: string) {
  const q = new URLSearchParams({ [kind]: message });
  return `/murojaah?${q.toString()}`;
}

function editWindowOpen(dateWib: string): boolean {
  const cutoff = new Date(getWibDateYmd());
  cutoff.setDate(cutoff.getDate() - 6);
  return dateWib >= cutoff.toISOString().slice(0, 10);
}

murojaah.get("/", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const todayWib = getWibDateYmd();
  const target = getUserTarget(user.id)!;
  const todayTotal = getTodayMurojaahTotal(user.id, todayWib);
  const allTimeTotals = getUserActivityTotals(user.id);

  const yearMonth = todayWib.slice(0, 7);
  const thisMonthJuz = (db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM murojaah_logs WHERE user_id = ? AND date_wib LIKE ?")
    .get(user.id, `${yearMonth}-%`) as { total: number }).total;

  const lastLog = db
    .prepare(`SELECT ${LOG_SELECT} FROM murojaah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(user.id) as MurojaahLog | null;

  const perPage = 15;
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const totalLogs = (db.prepare("SELECT COUNT(*) AS cnt FROM murojaah_logs WHERE user_id = ?").get(user.id) as { cnt: number }).cnt;
  const recentLogs = db
    .prepare(`SELECT ${LOG_SELECT} FROM murojaah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(user.id, perPage, (page - 1) * perPage) as MurojaahLog[];

  return c.html(
    <MurojaahPage
      user={user}
      lang={lang}
      success={c.req.query("success")}
      error={c.req.query("error")}
      todayWib={todayWib}
      todayTotal={todayTotal}
      target={target}
      lastLog={lastLog}
      recentLogs={recentLogs}
      allTimeJuz={allTimeTotals.murojaahJuz}
      thisMonthJuz={thisMonthJuz}
      page={page}
      totalLogs={totalLogs}
      perPage={perPage}
    />
  );
});

murojaah.post("/", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");

  const bucket = consumeRateLimit(`murojaah:${user.id}`, { max: 20, windowMs: 60_000 });
  if (!bucket.allowed) return c.redirect(redirectWith("error", t(lang, "tooManyRequests")));

  const body = await c.req.parseBody();

  // Validate date
  const inputDate = ((body.date_wib as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) return c.redirect(redirectWith("error", dateCheck.error || t(lang, "invalidDate")));

  // Parse + validate shared fields
  const parsed = parseLogSubmission(body as Record<string, string | File>, lang, { withRepetition: true });
  if (!parsed.ok) return c.redirect(redirectWith("error", parsed.error));
  const { juzAmount, logUnit, logAmount, startSurah, startAyah, startJuz, endSurah, endAyah, endJuz, endSurahName, repetitionCount } = parsed.values;

  // Sanity ceiling for the LOG's date (covers backdated entries too)
  const dayTotal = getTodayMurojaahTotal(user.id, dateCheck.date);
  if (dayTotal + juzAmount > MUROJAAH_DAILY_CEILING_JUZ) {
    return c.redirect(redirectWith("error", t(lang, "dailyCeilingMurojaah")));
  }

  // Capture score before insert for overtaken detection
  const { year: wy, month: wm } = getWibYearMonth();
  const { from: mFrom, to: mTo } = getWibMonthRange(wy, wm);
  const scoreBefore = getUserMonthScore(user.id, mFrom, mTo);

  // Insert log
  db.prepare(
    "INSERT INTO murojaah_logs (user_id, date_wib, juz_amount, repetition_count, start_surah, start_ayah, start_juz, end_surah, end_ayah, end_juz, log_unit, log_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, repetitionCount, startSurah, startAyah, startJuz, endSurah, endAyah, endJuz, logUnit, logAmount);

  // Notify overtaken users
  notifyOvertakenUsers(user, scoreBefore, mFrom, mTo).catch(() => {});

  // Update streak
  const newStreak = checkAndUpdateStreak(user.id, getWibDateYmd());
  if (newStreak > 0 && isStreakMilestone(newStreak)) {
    sendStreakMilestoneEmail(user, newStreak).catch(() => {});
  }

  const amountLabel = logUnit === "pages"
    ? `${logAmount} ${lang === "id" ? "halaman" : "pages"}`
    : `${logAmount} juz`;
  const repMsg = repetitionCount ? ` · ${repetitionCount}x ${t(lang, "repetitionSuffix")}` : "";
  return c.redirect(redirectWith("success", `${t(lang, "murojaahLogged")} ${amountLabel} — ${t(lang, "endedAtMsg")} ${endSurahName} ayah ${endAyah} (Juz ${endJuz}).${repMsg}`));
});

murojaah.get("/logs/:id/edit", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect(redirectWith("error", t(lang, "invalidLogId")));

  const log = db
    .prepare(`SELECT user_id, ${LOG_SELECT} FROM murojaah_logs WHERE id = ?`)
    .get(logId) as (MurojaahLog & { user_id: number }) | null;

  if (!log || log.user_id !== user.id) {
    return c.redirect(redirectWith("error", t(lang, "logNotFound")));
  }
  if (!editWindowOpen(log.date_wib)) {
    return c.redirect(redirectWith("error", t(lang, "editWindowExpired")));
  }

  return c.html(
    <EditLogPage
      user={user}
      lang={lang}
      logType="murojaah"
      log={log}
      backPath="/murojaah"
    />
  );
});

murojaah.post("/logs/:id/edit", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect(redirectWith("error", t(lang, "invalidLogId")));

  const log = db
    .prepare(`SELECT user_id, ${LOG_SELECT} FROM murojaah_logs WHERE id = ?`)
    .get(logId) as (MurojaahLog & { user_id: number }) | null;

  if (!log || log.user_id !== user.id) {
    return c.redirect(redirectWith("error", t(lang, "logNotFound")));
  }
  if (!editWindowOpen(log.date_wib)) {
    return c.redirect(redirectWith("error", t(lang, "editWindowExpired")));
  }

  const bucket = consumeRateLimit(`murojaah:${user.id}`, { max: 20, windowMs: 60_000 });
  if (!bucket.allowed) return c.redirect(redirectWith("error", t(lang, "tooManyRequests")));

  const body = await c.req.parseBody();
  const parsed = parseLogSubmission(body as Record<string, string | File>, lang, { withRepetition: true });
  if (!parsed.ok) return c.redirect(redirectWith("error", parsed.error));
  const { juzAmount, logUnit, logAmount, startSurah, startAyah, startJuz, endSurah, endAyah, endJuz, endSurahName, repetitionCount } = parsed.values;

  // Ceiling check excludes this log's own contribution (it is being replaced)
  const dayTotalOthers = getTodayMurojaahTotal(user.id, log.date_wib) - log.juz_amount;
  if (dayTotalOthers + juzAmount > MUROJAAH_DAILY_CEILING_JUZ) {
    return c.redirect(redirectWith("error", t(lang, "dailyCeilingMurojaah")));
  }

  db.prepare(
    `UPDATE murojaah_logs SET juz_amount = ?, repetition_count = ?, start_surah = ?, start_ayah = ?, start_juz = ?, end_surah = ?, end_ayah = ?, end_juz = ?, log_unit = ?, log_amount = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(juzAmount, repetitionCount, startSurah, startAyah, startJuz, endSurah, endAyah, endJuz, logUnit, logAmount, logId);

  const repMsg = repetitionCount ? ` · ${repetitionCount}x ${t(lang, "repetitionSuffix")}` : "";
  return c.redirect(redirectWith("success", `${t(lang, "entryUpdated")} — ${t(lang, "endedAtMsg")} ${endSurahName} ayah ${endAyah} (Juz ${endJuz}).${repMsg}`));
});

murojaah.post("/logs/:id/delete", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect(redirectWith("error", t(lang, "invalidLogId")));

  const log = db
    .prepare("SELECT id, user_id, date_wib FROM murojaah_logs WHERE id = ?")
    .get(logId) as { id: number; user_id: number; date_wib: string } | null;

  if (!log || log.user_id !== user.id) {
    return c.redirect(redirectWith("error", t(lang, "logNotFound")));
  }

  if (!editWindowOpen(log.date_wib)) {
    return c.redirect(redirectWith("error", t(lang, "entriesOlderThan7")));
  }

  db.prepare("DELETE FROM murojaah_logs WHERE id = ?").run(logId);
  rebuildStreak(user.id);

  return c.redirect(redirectWith("success", t(lang, "entryDeleted")));
});

export { murojaah as murojaahRoutes };
