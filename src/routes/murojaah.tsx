import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, validateWibLogDate } from "../lib/wib-date.ts";
import { getUserTarget, getTodayMurojaahTotal } from "../lib/targets.ts";
import { checkAndUpdateStreak } from "../lib/streak.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { SURAHS } from "../data/quran-meta.ts";
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
  if (juzAmount > 5) return c.redirect(redirectWith("error", "Murojaah per day is limited to 5 juz."));

  // Validate date
  const inputDate = ((body.date_wib as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) return c.redirect(redirectWith("error", dateCheck.error || "Invalid date."));

  // Daily cap check
  const existing = db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM murojaah_logs WHERE user_id = ? AND date_wib = ?")
    .get(user.id, dateCheck.date) as { total: number };
  if (existing.total + juzAmount > 5) return c.redirect(redirectWith("error", "Murojaah daily total cannot exceed 5 juz."));

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
  const endJuz = parseInt((body.end_juz as string) || "", 10);

  const surahMeta = SURAHS.find((s) => s.number === endSurah);
  if (!surahMeta) return c.redirect(redirectWith("error", "Invalid surah selected."));
  if (!Number.isInteger(endAyah) || endAyah < 1 || endAyah > surahMeta.totalAyahs) {
    return c.redirect(redirectWith("error", `Ayah must be between 1 and ${surahMeta.totalAyahs} for ${surahMeta.name}.`));
  }
  if (!Number.isInteger(endJuz) || endJuz < 1 || endJuz > 30) {
    return c.redirect(redirectWith("error", "Juz must be between 1 and 30."));
  }

  // Insert log
  db.prepare(
    "INSERT INTO murojaah_logs (user_id, date_wib, juz_amount, repetition_count, end_surah, end_ayah, end_juz) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, repetitionCount, endSurah, endAyah, endJuz);

  // Update streak
  checkAndUpdateStreak(user.id, getWibDateYmd());

  const repMsg = repetitionCount ? ` · ${repetitionCount}x repetition` : "";
  return c.redirect(redirectWith("success", `Murojaah logged: ${juzAmount} juz — ended at ${surahMeta.name} ayah ${endAyah} (Juz ${endJuz}).${repMsg}`));
});

export { murojaah as murojaahRoutes };
