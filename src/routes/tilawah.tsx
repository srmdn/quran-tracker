import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, getWibYearMonth, getWibMonthRange, validateWibLogDate } from "../lib/wib-date.ts";
import { getUserMonthScore, notifyOvertakenUsers } from "../lib/overtaken-email.ts";
import { getUserTarget, getTodayTilawahTotal, TILAWAH_DAILY_CEILING_JUZ } from "../lib/targets.ts";
import { checkAndUpdateStreak, rebuildStreak } from "../lib/streak.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { parseLogSubmission } from "../lib/log-validate.ts";
import { sendKhatamEmail, sendStreakMilestoneEmail, isStreakMilestone } from "../lib/milestone-email.ts";
import { t } from "../lib/i18n.ts";
import { TilawahPage } from "../views/pages/TilawahPage.tsx";
import { EditLogPage } from "../views/pages/EditLogPage.tsx";
import type { Env } from "../types.ts";

const tilawah = new Hono<Env>();

tilawah.use("*", authMiddleware, memberMiddleware, targetMiddleware);

type TilawahLog = {
  id: number;
  date_wib: string;
  juz_amount: number;
  log_unit: string | null;
  log_amount: number | null;
  start_surah: number | null;
  start_ayah: number | null;
  start_juz: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  created_at: string;
  updated_at: string | null;
};

const LOG_SELECT = "id, date_wib, juz_amount, log_unit, log_amount, start_surah, start_ayah, start_juz, end_surah, end_ayah, end_juz, created_at, updated_at";

function redirectWith(kind: "success" | "error", message: string) {
  const q = new URLSearchParams({ [kind]: message });
  return `/tilawah?${q.toString()}`;
}

// Khatam (tilawah only) = log ending at An-Nas 114:6, recorded in khatam_events.
// Dedup: at most one event per user/type/day.
function recordKhatamIfCompleted(userId: number, dateWib: string, endSurah: number, endAyah: number): string | null {
  if (endSurah !== 114 || endAyah !== 6) return null;
  const alreadyToday = db
    .prepare("SELECT 1 FROM khatam_events WHERE user_id = ? AND type = 'tilawah' AND date_wib = ? LIMIT 1")
    .get(userId, dateWib);
  if (alreadyToday) return "khatamAlreadyToday";
  db.prepare("INSERT INTO khatam_events (user_id, type, date_wib) VALUES (?, 'tilawah', ?)")
    .run(userId, dateWib);
  return "khatamRecorded";
}

// Remove the day's khatam event when no qualifying log remains for that date.
function removeKhatamIfUnqualified(userId: number, dateWib: string, excludeLogId?: number) {
  const stillQualifies = db
    .prepare(
      "SELECT 1 FROM tilawah_logs WHERE user_id = ? AND date_wib = ? AND end_surah = 114 AND end_ayah = 6 AND id != ? LIMIT 1"
    )
    .get(userId, dateWib, excludeLogId ?? -1);
  if (!stillQualifies) {
    db.prepare("DELETE FROM khatam_events WHERE id = (SELECT id FROM khatam_events WHERE user_id = ? AND date_wib = ? AND type = 'tilawah' ORDER BY id DESC LIMIT 1)")
      .run(userId, dateWib);
  }
}

function editWindowOpen(dateWib: string): boolean {
  const cutoff = new Date(getWibDateYmd());
  cutoff.setDate(cutoff.getDate() - 6);
  return dateWib >= cutoff.toISOString().slice(0, 10);
}

tilawah.get("/", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const todayWib = getWibDateYmd();
  const target = getUserTarget(user.id)!;
  const todayTotal = getTodayTilawahTotal(user.id, todayWib);
  const allTimeTotals = getUserActivityTotals(user.id);

  const yearMonth = todayWib.slice(0, 7);
  const thisMonthJuz = (db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM tilawah_logs WHERE user_id = ? AND date_wib LIKE ?")
    .get(user.id, `${yearMonth}-%`) as { total: number }).total;

  const khatamCount = db
    .prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah'")
    .get(user.id) as { cnt: number };

  const lastLog = db
    .prepare(`SELECT ${LOG_SELECT} FROM tilawah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(user.id) as TilawahLog | null;

  const perPage = 15;
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const totalLogs = (db.prepare("SELECT COUNT(*) AS cnt FROM tilawah_logs WHERE user_id = ?").get(user.id) as { cnt: number }).cnt;
  const recentLogs = db
    .prepare(`SELECT ${LOG_SELECT} FROM tilawah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`)
    .all(user.id, perPage, (page - 1) * perPage) as TilawahLog[];

  // Juz coverage: count entries per end_juz
  type JuzCountRow = { end_juz: number; cnt: number };
  const coverageMonthRows = db
    .prepare("SELECT end_juz, COUNT(*) AS cnt FROM tilawah_logs WHERE user_id = ? AND end_juz IS NOT NULL AND date_wib LIKE ? GROUP BY end_juz")
    .all(user.id, `${yearMonth}-%`) as JuzCountRow[];
  const coverageAllTimeRows = db
    .prepare("SELECT end_juz, COUNT(*) AS cnt FROM tilawah_logs WHERE user_id = ? AND end_juz IS NOT NULL GROUP BY end_juz")
    .all(user.id) as JuzCountRow[];

  const juzCoverageMonth: Record<number, number> = {};
  for (const row of coverageMonthRows) juzCoverageMonth[row.end_juz] = row.cnt;
  const juzCoverageAllTime: Record<number, number> = {};
  for (const row of coverageAllTimeRows) juzCoverageAllTime[row.end_juz] = row.cnt;

  return c.html(
    <TilawahPage
      user={user}
      lang={lang}
      success={c.req.query("success")}
      error={c.req.query("error")}
      todayWib={todayWib}
      todayTotal={todayTotal}
      target={target}
      lastLog={lastLog}
      recentLogs={recentLogs}
      allTimeJuz={allTimeTotals.tilawahJuz}
      thisMonthJuz={thisMonthJuz}
      totalKhatam={khatamCount.cnt}
      page={page}
      totalLogs={totalLogs}
      perPage={perPage}
      juzCoverageMonth={juzCoverageMonth}
      juzCoverageAllTime={juzCoverageAllTime}
    />
  );
});

tilawah.post("/", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");

  const bucket = consumeRateLimit(`tilawah:${user.id}`, { max: 20, windowMs: 60_000 });
  if (!bucket.allowed) return c.redirect(redirectWith("error", t(lang, "tooManyRequests")));

  const body = await c.req.parseBody();

  // Validate date
  const inputDate = ((body.date_wib as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) return c.redirect(redirectWith("error", dateCheck.error || t(lang, "invalidDate")));

  // Parse + validate shared fields
  const parsed = parseLogSubmission(body as Record<string, string | File>, lang, { withRepetition: false });
  if (!parsed.ok) return c.redirect(redirectWith("error", parsed.error));
  const { juzAmount, logUnit, logAmount, startSurah, startAyah, startJuz, endSurah, endAyah, endJuz, endSurahName } = parsed.values;

  // Sanity ceiling for the LOG's date (covers backdated entries too)
  const dayTotal = getTodayTilawahTotal(user.id, dateCheck.date);
  if (dayTotal + juzAmount > TILAWAH_DAILY_CEILING_JUZ) {
    return c.redirect(redirectWith("error", t(lang, "dailyCeilingTilawah")));
  }

  // Capture score before insert for overtaken detection
  const { year: wy, month: wm } = getWibYearMonth();
  const { from: mFrom, to: mTo } = getWibMonthRange(wy, wm);
  const scoreBefore = getUserMonthScore(user.id, mFrom, mTo);

  // Insert log
  db.prepare(
    "INSERT INTO tilawah_logs (user_id, date_wib, juz_amount, start_surah, start_ayah, start_juz, end_surah, end_ayah, end_juz, log_unit, log_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, startSurah, startAyah, startJuz, endSurah, endAyah, endJuz, logUnit, logAmount);

  // Khatam detection — completed the mushaf at An-Nas (114:6)
  let khatamMsg = "";
  const khatamResult = recordKhatamIfCompleted(user.id, dateCheck.date, endSurah, endAyah);
  if (khatamResult === "khatamRecorded") {
    khatamMsg = ` ${t(lang, "khatamRecorded")}`;
    const khatamCount = (db.prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah'")
      .get(user.id) as { cnt: number }).cnt;
    sendKhatamEmail(user, khatamCount).catch(() => {});
  } else if (khatamResult === "khatamAlreadyToday") {
    khatamMsg = ` ${t(lang, "khatamAlreadyToday")}`;
  }

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
  return c.redirect(redirectWith("success", `${t(lang, "tilawahLogged")} ${amountLabel} — ${t(lang, "endedAtMsg")} ${endSurahName} ayah ${endAyah} (Juz ${endJuz}).${khatamMsg}`));
});

tilawah.get("/logs/:id/edit", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect(redirectWith("error", t(lang, "invalidLogId")));

  const log = db
    .prepare(`SELECT user_id, ${LOG_SELECT} FROM tilawah_logs WHERE id = ?`)
    .get(logId) as (TilawahLog & { user_id: number }) | null;

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
      logType="tilawah"
      log={log}
      backPath="/tilawah"
    />
  );
});

tilawah.post("/logs/:id/edit", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect(redirectWith("error", t(lang, "invalidLogId")));

  const log = db
    .prepare(`SELECT user_id, ${LOG_SELECT} FROM tilawah_logs WHERE id = ?`)
    .get(logId) as (TilawahLog & { user_id: number }) | null;

  if (!log || log.user_id !== user.id) {
    return c.redirect(redirectWith("error", t(lang, "logNotFound")));
  }
  if (!editWindowOpen(log.date_wib)) {
    return c.redirect(redirectWith("error", t(lang, "editWindowExpired")));
  }

  const bucket = consumeRateLimit(`tilawah:${user.id}`, { max: 20, windowMs: 60_000 });
  if (!bucket.allowed) return c.redirect(redirectWith("error", t(lang, "tooManyRequests")));

  const body = await c.req.parseBody();
  const parsed = parseLogSubmission(body as Record<string, string | File>, lang, { withRepetition: false });
  if (!parsed.ok) return c.redirect(redirectWith("error", parsed.error));
  const { juzAmount, logUnit, logAmount, startSurah, startAyah, startJuz, endSurah, endAyah, endJuz, endSurahName } = parsed.values;

  // Ceiling check excludes this log's own contribution (it is being replaced)
  const dayTotalOthers = getTodayTilawahTotal(user.id, log.date_wib) - log.juz_amount;
  if (dayTotalOthers + juzAmount > TILAWAH_DAILY_CEILING_JUZ) {
    return c.redirect(redirectWith("error", t(lang, "dailyCeilingTilawah")));
  }

  const wasCompletion = log.end_surah === 114 && log.end_ayah === 6;

  db.prepare(
    `UPDATE tilawah_logs SET juz_amount = ?, start_surah = ?, start_ayah = ?, start_juz = ?, end_surah = ?, end_ayah = ?, end_juz = ?, log_unit = ?, log_amount = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(juzAmount, startSurah, startAyah, startJuz, endSurah, endAyah, endJuz, logUnit, logAmount, logId);

  // Khatam re-evaluation for the log's date
  let khatamMsg = "";
  const khatamResult = recordKhatamIfCompleted(user.id, log.date_wib, endSurah, endAyah);
  if (khatamResult === "khatamRecorded") {
    khatamMsg = ` ${t(lang, "khatamRecorded")}`;
    const khatamCount = (db.prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah'")
      .get(user.id) as { cnt: number }).cnt;
    sendKhatamEmail(user, khatamCount).catch(() => {});
  }
  if (wasCompletion && !(endSurah === 114 && endAyah === 6)) {
    removeKhatamIfUnqualified(user.id, log.date_wib, logId);
  }

  return c.redirect(redirectWith("success", `${t(lang, "entryUpdated")} — ${t(lang, "endedAtMsg")} ${endSurahName} ayah ${endAyah} (Juz ${endJuz}).${khatamMsg}`));
});

tilawah.post("/logs/:id/delete", (c) => {
  const user = c.get("user");
  const lang = c.get("lang");
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect(redirectWith("error", t(lang, "invalidLogId")));

  const log = db
    .prepare("SELECT id, user_id, date_wib, end_surah, end_ayah FROM tilawah_logs WHERE id = ?")
    .get(logId) as { id: number; user_id: number; date_wib: string; end_surah: number | null; end_ayah: number | null } | null;

  if (!log || log.user_id !== user.id) {
    return c.redirect(redirectWith("error", t(lang, "logNotFound")));
  }

  // Only allow deletion within the last 7 days
  if (!editWindowOpen(log.date_wib)) {
    return c.redirect(redirectWith("error", t(lang, "entriesOlderThan7")));
  }

  db.prepare("DELETE FROM tilawah_logs WHERE id = ?").run(logId);

  // If this was a khatam-completing entry, drop the day's event if no other log qualifies
  if (log.end_surah === 114 && log.end_ayah === 6) {
    removeKhatamIfUnqualified(user.id, log.date_wib, logId);
  }

  rebuildStreak(user.id);

  return c.redirect(redirectWith("success", t(lang, "entryDeleted")));
});

export { tilawah as tilawahRoutes };
