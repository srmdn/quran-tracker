import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, validateWibLogDate } from "../lib/wib-date.ts";
import { getUserTarget, getTodayMurojaahTotal } from "../lib/targets.ts";
import { checkAndUpdateStreak, rebuildStreak } from "../lib/streak.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { sendStreakMilestoneEmail, isStreakMilestone } from "../lib/milestone-email.ts";
import { SURAHS, getJuzForPosition } from "../data/quran-meta.ts";
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
  const todayWib = getWibDateYmd();
  const target = getUserTarget(user.id)!;
  const todayTotal = getTodayMurojaahTotal(user.id, todayWib);
  const allTimeTotals = getUserActivityTotals(user.id);

  const lastLog = db
    .prepare("SELECT id, date_wib, juz_amount, repetition_count, end_surah, end_ayah, end_juz, created_at FROM murojaah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 1")
    .get(user.id) as MurojaahLog | null;

  const recentLogs = db
    .prepare("SELECT id, date_wib, juz_amount, repetition_count, end_surah, end_ayah, end_juz, created_at FROM murojaah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 15")
    .all(user.id) as MurojaahLog[];

  return c.html(
    <MurojaahPage
      user={user}
      success={c.req.query("success")}
      error={c.req.query("error")}
      todayWib={todayWib}
      todayTotal={todayTotal}
      target={target}
      lastLog={lastLog}
      recentLogs={recentLogs}
      allTimeJuz={allTimeTotals.murojaahJuz}
    />
  );
});

murojaah.post("/", async (c) => {
  const user = c.get("user");

  const bucket = consumeRateLimit(`murojaah:${user.id}`, { max: 20, windowMs: 60_000 });
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

  // Validate repetition
  let repetitionCount: number | null = null;
  const repRaw = (body.repetition_count as string | undefined)?.trim();
  if (repRaw) {
    const parsed = parseInt(repRaw, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) return c.redirect(redirectWith("error", "Repetition count must be a positive integer."));
    repetitionCount = parsed;
  }

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
    "INSERT INTO murojaah_logs (user_id, date_wib, juz_amount, repetition_count, end_surah, end_ayah, end_juz) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, repetitionCount, endSurah, endAyah, endJuz);

  // Update streak
  const newStreak = checkAndUpdateStreak(user.id, getWibDateYmd());
  if (newStreak > 0 && isStreakMilestone(newStreak)) {
    sendStreakMilestoneEmail(user, newStreak).catch(() => {});
  }

  const repMsg = repetitionCount ? ` · ${repetitionCount}x repetition` : "";
  return c.redirect(redirectWith("success", `Murojaah logged: ${juzAmount} juz — ended at ${surahMeta.name} ayah ${endAyah} (Juz ${endJuz}).${repMsg}`));
});

murojaah.post("/logs/:id/delete", (c) => {
  const user = c.get("user");
  const logId = parseInt(c.req.param("id"), 10);
  if (!Number.isInteger(logId)) return c.redirect("/murojaah?error=Invalid+log+ID.");

  const log = db
    .prepare("SELECT id, user_id, date_wib FROM murojaah_logs WHERE id = ?")
    .get(logId) as { id: number; user_id: number; date_wib: string } | null;

  if (!log || log.user_id !== user.id) {
    return c.redirect("/murojaah?error=Log+not+found.");
  }

  const cutoff = new Date(getWibDateYmd());
  cutoff.setDate(cutoff.getDate() - 6);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  if (log.date_wib < cutoffStr) {
    return c.redirect("/murojaah?error=Entries+older+than+7+days+cannot+be+deleted.");
  }

  db.prepare("DELETE FROM murojaah_logs WHERE id = ?").run(logId);
  rebuildStreak(user.id);

  return c.redirect("/murojaah?success=Entry+deleted.");
});

export { murojaah as murojaahRoutes };
