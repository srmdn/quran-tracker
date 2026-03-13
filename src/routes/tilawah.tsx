import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, validateWibLogDate } from "../lib/wib-date.ts";
import { getUserTarget, getTodayTilawahTotal } from "../lib/targets.ts";
import { checkAndUpdateStreak, rebuildStreak } from "../lib/streak.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { sendKhatamEmail, sendStreakMilestoneEmail, isStreakMilestone } from "../lib/milestone-email.ts";
import { SURAHS, getJuzForPosition } from "../data/quran-meta.ts";
import { TilawahPage } from "../views/pages/TilawahPage.tsx";
import type { Env } from "../types.ts";

const tilawah = new Hono<Env>();

tilawah.use("*", authMiddleware, memberMiddleware, targetMiddleware);

type TilawahLog = {
  id: number;
  date_wib: string;
  juz_amount: number;
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
  const todayWib = getWibDateYmd();
  const target = getUserTarget(user.id)!;
  const todayTotal = getTodayTilawahTotal(user.id, todayWib);
  const allTimeTotals = getUserActivityTotals(user.id);

  const khatamCount = db
    .prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah'")
    .get(user.id) as { cnt: number };

  const lastLog = db
    .prepare("SELECT id, date_wib, juz_amount, end_surah, end_ayah, end_juz, created_at FROM tilawah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(user.id) as TilawahLog | null;

  const perPage = 15;
  const page = Math.max(1, parseInt(c.req.query("page") || "1", 10));
  const totalLogs = (db.prepare("SELECT COUNT(*) AS cnt FROM tilawah_logs WHERE user_id = ?").get(user.id) as { cnt: number }).cnt;
  const recentLogs = db
    .prepare("SELECT id, date_wib, juz_amount, end_surah, end_ayah, end_juz, created_at FROM tilawah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(user.id, perPage, (page - 1) * perPage) as TilawahLog[];

  return c.html(
    <TilawahPage
      user={user}
      success={c.req.query("success")}
      error={c.req.query("error")}
      todayWib={todayWib}
      todayTotal={todayTotal}
      target={target}
      lastLog={lastLog}
      recentLogs={recentLogs}
      allTimeJuz={allTimeTotals.tilawahJuz}
      totalKhatam={khatamCount.cnt}
      page={page}
      totalLogs={totalLogs}
      perPage={perPage}
    />
  );
});

tilawah.post("/", async (c) => {
  const user = c.get("user");

  const bucket = consumeRateLimit(`tilawah:${user.id}`, { max: 20, windowMs: 60_000 });
  if (!bucket.allowed) return c.redirect(redirectWith("error", "Too many requests. Please wait a minute."));

  const body = await c.req.parseBody();

  // Validate juz amount
  const juzRaw = (body.juz_amount as string)?.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(juzRaw || "")) return c.redirect(redirectWith("error", "Invalid juz amount."));
  const juzAmount = Number(juzRaw);
  if (!Number.isFinite(juzAmount) || juzAmount <= 0) return c.redirect(redirectWith("error", "Invalid juz amount."));
  if (juzAmount > 30) return c.redirect(redirectWith("error", "Juz amount cannot exceed 30 (full Quran) per entry."));

  // Validate date
  const inputDate = ((body.date_wib as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) return c.redirect(redirectWith("error", dateCheck.error || "Invalid date."));

  // Validate position
  const endSurah = parseInt((body.end_surah as string) || "", 10);
  const endAyah = parseInt((body.end_ayah as string) || "", 10);

  const surahMeta = SURAHS.find((s) => s.number === endSurah);
  if (!surahMeta) return c.redirect(redirectWith("error", "Invalid surah selected."));
  if (!Number.isInteger(endAyah) || endAyah < 1 || endAyah > surahMeta.totalAyahs) {
    return c.redirect(redirectWith("error", `Ayah must be between 1 and ${surahMeta.totalAyahs} for ${surahMeta.name}.`));
  }

  // Compute juz from surah+ayah — never trust user input
  const endJuz = getJuzForPosition(endSurah, endAyah);

  // Insert log
  db.prepare(
    "INSERT INTO tilawah_logs (user_id, date_wib, juz_amount, end_surah, end_ayah, end_juz) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, endSurah, endAyah, endJuz);

  // Khatam detection — reached An-Nas (surah 114) ayah 6
  let khatamMsg = "";
  if (endSurah === 114 && endAyah === 6) {
    db.prepare("INSERT INTO khatam_events (user_id, type, date_wib) VALUES (?, 'tilawah', ?)")
      .run(user.id, dateCheck.date);
    khatamMsg = " 🎉 Khatam recorded!";
    const khatamCount = (db.prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah'")
      .get(user.id) as { cnt: number }).cnt;
    sendKhatamEmail(user, khatamCount).catch(() => {});
  }

  // Update streak
  const newStreak = checkAndUpdateStreak(user.id, getWibDateYmd());
  if (newStreak > 0 && isStreakMilestone(newStreak)) {
    sendStreakMilestoneEmail(user, newStreak).catch(() => {});
  }

  return c.redirect(redirectWith("success", `Tilawah logged: ${juzAmount} juz — ended at ${surahMeta.name} ayah ${endAyah} (Juz ${endJuz}).${khatamMsg}`));
});

tilawah.post("/logs/:id/delete", (c) => {
  const user = c.get("user");
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect(redirectWith("error", "Invalid log ID."));

  const log = db
    .prepare("SELECT id, user_id, date_wib, end_surah, end_ayah FROM tilawah_logs WHERE id = ?")
    .get(logId) as { id: number; user_id: number; date_wib: string; end_surah: number | null; end_ayah: number | null } | null;

  if (!log || log.user_id !== user.id) {
    return c.redirect(redirectWith("error", "Log not found."));
  }

  // Only allow deletion within the last 7 days
  const cutoff = new Date(getWibDateYmd());
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  if (log.date_wib < cutoffStr) {
    return c.redirect(redirectWith("error", "Entries older than 7 days cannot be deleted."));
  }

  db.prepare("DELETE FROM tilawah_logs WHERE id = ?").run(logId);

  // If this was a khatam entry, remove the corresponding khatam_event
  if (log.end_surah === 114 && log.end_ayah === 6) {
    db.prepare(
      "DELETE FROM khatam_events WHERE id = (SELECT id FROM khatam_events WHERE user_id = ? AND date_wib = ? AND type = 'tilawah' ORDER BY id DESC LIMIT 1)"
    ).run(user.id, log.date_wib);
  }

  rebuildStreak(user.id);

  return c.redirect(redirectWith("success", "Entry deleted."));
});

export { tilawah as tilawahRoutes };
