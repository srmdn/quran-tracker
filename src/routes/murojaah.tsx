import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, getWibYearMonth, getWibMonthRange, validateWibLogDate } from "../lib/wib-date.ts";
import { getUserMonthScore, notifyOvertakenUsers } from "../lib/overtaken-email.ts";
import { getUserTarget, getTodayMurojaahTotal } from "../lib/targets.ts";
import { checkAndUpdateStreak, rebuildStreak } from "../lib/streak.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { sendKhatamEmail, sendStreakMilestoneEmail, isStreakMilestone } from "../lib/milestone-email.ts";
import { SURAHS, getJuzForPosition } from "../data/quran-meta.ts";
import { t } from "../lib/i18n.ts";
import { MurojaahPage } from "../views/pages/MurojaahPage.tsx";
import type { Env } from "../types.ts";

const murojaah = new Hono<Env>();

murojaah.use("*", authMiddleware, memberMiddleware, targetMiddleware);

type MurojaahLog = {
  id: number;
  date_wib: string;
  juz_amount: number;
  repetition_count: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  created_at: string;
};

function redirectWith(kind: "success" | "error", message: string) {
  const q = new URLSearchParams({ [kind]: message });
  return `/murojaah?${q.toString()}`;
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
    .prepare("SELECT id, date_wib, juz_amount, repetition_count, end_surah, end_ayah, end_juz, created_at FROM murojaah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(user.id) as MurojaahLog | null;

  const perPage = 15;
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const totalLogs = (db.prepare("SELECT COUNT(*) AS cnt FROM murojaah_logs WHERE user_id = ?").get(user.id) as { cnt: number }).cnt;
  const recentLogs = db
    .prepare("SELECT id, date_wib, juz_amount, repetition_count, end_surah, end_ayah, end_juz, created_at FROM murojaah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
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

  // Validate juz amount
  const juzRaw = (body.juz_amount as string)?.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(juzRaw || "")) return c.redirect(redirectWith("error", t(lang, "invalidJuzAmount")));
  const juzAmount = Number(juzRaw);
  if (!Number.isFinite(juzAmount) || juzAmount <= 0) return c.redirect(redirectWith("error", t(lang, "invalidJuzAmount")));
  if (juzAmount > 30) return c.redirect(redirectWith("error", t(lang, "juzExceeds30")));

  // Validate date
  const inputDate = ((body.date_wib as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) return c.redirect(redirectWith("error", dateCheck.error || t(lang, "invalidDate")));

  // Validate repetition
  let repetitionCount: number | null = null;
  const repRaw = (body.repetition_count as string | undefined)?.trim();
  if (repRaw) {
    const parsed = parseInt(repRaw, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return c.redirect(redirectWith("error", "Repetition count must be a positive integer."));
    if (parsed > 100) return c.redirect(redirectWith("error", "Repetition count cannot exceed 100."));
    repetitionCount = parsed;
  }

  // Validate position
  const endSurah = parseInt((body.end_surah as string) || "", 10);
  const endAyah = parseInt((body.end_ayah as string) || "", 10);

  const surahMeta = SURAHS.find((s) => s.number === endSurah);
  if (!surahMeta) return c.redirect(redirectWith("error", t(lang, "invalidSurah")));
  if (!Number.isInteger(endAyah) || endAyah < 1 || endAyah > surahMeta.totalAyahs) {
    return c.redirect(redirectWith("error", `${t(lang, "ayahMustBeBetween")} ${surahMeta.totalAyahs} ${t(lang, "forSurah")} ${surahMeta.name}.`));
  }

  // Compute juz from surah+ayah — never trust user input
  const endJuz = getJuzForPosition(endSurah, endAyah);

  // Capture score before insert for overtaken detection
  const { year: wy, month: wm } = getWibYearMonth();
  const { from: mFrom, to: mTo } = getWibMonthRange(wy, wm);
  const scoreBefore = getUserMonthScore(user.id, mFrom, mTo);

  // Insert log
  db.prepare(
    "INSERT INTO murojaah_logs (user_id, date_wib, juz_amount, repetition_count, end_surah, end_ayah, end_juz) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, repetitionCount, endSurah, endAyah, endJuz);

  // Khatam detection — reached An-Nas (surah 114) ayah 6
  let khatamMsg = "";
  if (endSurah === 114 && endAyah === 6) {
    db.prepare("INSERT INTO khatam_events (user_id, type, date_wib) VALUES (?, 'murojaah', ?)")
      .run(user.id, dateCheck.date);
    khatamMsg = ` ${t(lang, "khatamRecorded")}`;
    const khatamCount = (db.prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'murojaah'")
      .get(user.id) as { cnt: number }).cnt;
    sendKhatamEmail(user, khatamCount).catch(() => {});
  }

  // Notify overtaken users
  notifyOvertakenUsers(user, scoreBefore, mFrom, mTo).catch(() => {});

  // Update streak
  const newStreak = checkAndUpdateStreak(user.id, getWibDateYmd());
  if (newStreak > 0 && isStreakMilestone(newStreak)) {
    sendStreakMilestoneEmail(user, newStreak).catch(() => {});
  }

  const repMsg = repetitionCount ? ` · ${repetitionCount}x ${t(lang, "repetitionSuffix")}` : "";
  return c.redirect(redirectWith("success", `${t(lang, "murojaahLogged")} ${juzAmount} juz — ${t(lang, "endedAtMsg")} ${surahMeta.name} ayah ${endAyah} (Juz ${endJuz}).${repMsg}${khatamMsg}`));
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

  const cutoff = new Date(getWibDateYmd());
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  if (log.date_wib < cutoffStr) {
    return c.redirect(redirectWith("error", t(lang, "entriesOlderThan7")));
  }

  db.prepare("DELETE FROM murojaah_logs WHERE id = ?").run(logId);
  rebuildStreak(user.id);

  return c.redirect(redirectWith("success", t(lang, "entryDeleted")));
});

export { murojaah as murojaahRoutes };
