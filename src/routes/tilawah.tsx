import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, getWibYearMonth, getWibMonthRange, validateWibLogDate } from "../lib/wib-date.ts";
import { getUserMonthScore, notifyOvertakenUsers } from "../lib/overtaken-email.ts";
import { getUserTarget, getTodayTilawahTotal } from "../lib/targets.ts";
import { checkAndUpdateStreak, rebuildStreak } from "../lib/streak.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { sendKhatamEmail, sendStreakMilestoneEmail, isStreakMilestone } from "../lib/milestone-email.ts";
import { SURAHS, getJuzForPosition } from "../data/quran-meta.ts";
import { t } from "../lib/i18n.ts";
import { TilawahPage } from "../views/pages/TilawahPage.tsx";
import type { Env } from "../types.ts";

const tilawah = new Hono<Env>();

tilawah.use("*", authMiddleware, memberMiddleware, targetMiddleware);

type TilawahLog = {
  id: number;
  date_wib: string;
  juz_amount: number;
  log_unit: string | null;
  log_amount: number | null;
  end_surah: number | null;
  end_ayah: number | null;
  end_juz: number | null;
  created_at: string;
};

function redirectWith(kind: "success" | "error", message: string) {
  const q = new URLSearchParams({ [kind]: message });
  return `/tilawah?${q.toString()}`;
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
    .prepare("SELECT id, date_wib, juz_amount, log_unit, log_amount, end_surah, end_ayah, end_juz, created_at FROM tilawah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(user.id) as TilawahLog | null;

  const perPage = 15;
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const totalLogs = (db.prepare("SELECT COUNT(*) AS cnt FROM tilawah_logs WHERE user_id = ?").get(user.id) as { cnt: number }).cnt;
  const recentLogs = db
    .prepare("SELECT id, date_wib, juz_amount, log_unit, log_amount, end_surah, end_ayah, end_juz, created_at FROM tilawah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(user.id, perPage, (page - 1) * perPage) as TilawahLog[];

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
    />
  );
});

tilawah.post("/", async (c) => {
  const user = c.get("user");
  const lang = c.get("lang");

  const bucket = consumeRateLimit(`tilawah:${user.id}`, { max: 20, windowMs: 60_000 });
  if (!bucket.allowed) return c.redirect(redirectWith("error", t(lang, "tooManyRequests")));

  const body = await c.req.parseBody();

  // Parse input mode (juz or pages)
  const inputMode = (body.input_mode as string) === "pages" ? "pages" : "juz";
  const amountRaw = (body.amount as string)?.trim();

  if (!/^\d+$/.test(amountRaw || "")) {
    return c.redirect(redirectWith("error", t(lang, inputMode === "pages" ? "invalidPagesAmount" : "invalidJuzAmount")));
  }
  const amountInt = parseInt(amountRaw, 10);
  if (amountInt <= 0) {
    return c.redirect(redirectWith("error", t(lang, inputMode === "pages" ? "invalidPagesAmount" : "invalidJuzAmount")));
  }

  let juzAmount: number;
  let logUnit: "juz" | "pages";
  let logAmount: number;

  if (inputMode === "pages") {
    if (amountInt > 30) return c.redirect(redirectWith("error", t(lang, "pagesExceed30")));
    juzAmount = amountInt / 20;
    logUnit = "pages";
    logAmount = amountInt;
  } else {
    if (amountInt > 30) return c.redirect(redirectWith("error", t(lang, "juzExceeds30")));
    juzAmount = amountInt;
    logUnit = "juz";
    logAmount = amountInt;
  }

  // Daily cap check
  const target = getUserTarget(user.id);
  if (target) {
    const todayWibPost = getWibDateYmd();
    const todayTotalPost = getTodayTilawahTotal(user.id, todayWibPost);
    if (todayTotalPost + juzAmount > target.tilawah_juz_daily) {
      return c.redirect(redirectWith("error", t(lang, "dailyCapReached")));
    }
  }

  // Validate date
  const inputDate = ((body.date_wib as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) return c.redirect(redirectWith("error", dateCheck.error || t(lang, "invalidDate")));

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

  // Capture pre-insert tilawah total for khatam plausibility check
  const preTilawahTotal = getUserActivityTotals(user.id).tilawahJuz;

  // Capture score before insert for overtaken detection
  const { year: wy, month: wm } = getWibYearMonth();
  const { from: mFrom, to: mTo } = getWibMonthRange(wy, wm);
  const scoreBefore = getUserMonthScore(user.id, mFrom, mTo);

  // Insert log
  db.prepare(
    "INSERT INTO tilawah_logs (user_id, date_wib, juz_amount, end_surah, end_ayah, end_juz, log_unit, log_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, endSurah, endAyah, endJuz, logUnit, logAmount);

  // Khatam detection — reached An-Nas (surah 114) ayah 6
  let khatamMsg = "";
  if (endSurah === 114 && endAyah === 6) {
    // Plausibility: this log must cross a 30-juz cycle boundary
    const cyclesBefore = Math.floor(preTilawahTotal / 30);
    const cyclesAfter = Math.floor((preTilawahTotal + juzAmount) / 30);
    if (cyclesAfter <= cyclesBefore) {
      khatamMsg = ` ${t(lang, "khatamNotPlausible")}`;
    } else {
      // Once per day dedup
      const alreadyToday = db
        .prepare("SELECT 1 FROM khatam_events WHERE user_id = ? AND type = 'tilawah' AND date_wib = ? LIMIT 1")
        .get(user.id, dateCheck.date);
      if (!alreadyToday) {
        db.prepare("INSERT INTO khatam_events (user_id, type, date_wib) VALUES (?, 'tilawah', ?)")
          .run(user.id, dateCheck.date);
        khatamMsg = ` ${t(lang, "khatamRecorded")}`;
        const khatamCount = (db.prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah'")
          .get(user.id) as { cnt: number }).cnt;
        sendKhatamEmail(user, khatamCount).catch(() => {});
      } else {
        khatamMsg = ` ${t(lang, "khatamAlreadyToday")}`;
      }
    }
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
  return c.redirect(redirectWith("success", `${t(lang, "tilawahLogged")} ${amountLabel} — ${t(lang, "endedAtMsg")} ${surahMeta.name} ayah ${endAyah} (Juz ${endJuz}).${khatamMsg}`));
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
  const cutoff = new Date(getWibDateYmd());
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  if (log.date_wib < cutoffStr) {
    return c.redirect(redirectWith("error", t(lang, "entriesOlderThan7")));
  }

  db.prepare("DELETE FROM tilawah_logs WHERE id = ?").run(logId);

  // If this was a khatam entry, remove the corresponding khatam_event
  if (log.end_surah === 114 && log.end_ayah === 6) {
    db.prepare(
      "DELETE FROM khatam_events WHERE id = (SELECT id FROM khatam_events WHERE user_id = ? AND date_wib = ? AND type = 'tilawah' ORDER BY id DESC LIMIT 1)"
    ).run(user.id, log.date_wib);
  }

  rebuildStreak(user.id);

  return c.redirect(redirectWith("success", t(lang, "entryDeleted")));
});

export { tilawah as tilawahRoutes };
