import { Hono } from "hono";
import { authMiddleware, memberMiddleware, targetMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, validateWibLogDate } from "../lib/wib-date.ts";
import { getUserTarget, getTodayTilawahTotal } from "../lib/targets.ts";
import { checkAndUpdateStreak } from "../lib/streak.ts";
import { getUserActivityTotals } from "../lib/activity-calc.ts";
import { SURAHS } from "../data/quran-meta.ts";
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

  const recentLogs = db
    .prepare("SELECT id, date_wib, juz_amount, end_surah, end_ayah, end_juz, created_at FROM tilawah_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT 15")
    .all(user.id) as TilawahLog[];

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
  if (juzAmount > 3) return c.redirect(redirectWith("error", "Tilawah per day is limited to 3 juz."));

  // Validate date
  const inputDate = ((body.date_wib as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) return c.redirect(redirectWith("error", dateCheck.error || "Invalid date."));

  // Daily cap check
  const existing = db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM tilawah_logs WHERE user_id = ? AND date_wib = ?")
    .get(user.id, dateCheck.date) as { total: number };
  if (existing.total + juzAmount > 3) return c.redirect(redirectWith("error", "Tilawah daily total cannot exceed 3 juz."));

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
    "INSERT INTO tilawah_logs (user_id, date_wib, juz_amount, end_surah, end_ayah, end_juz) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, endSurah, endAyah, endJuz);

  // Khatam detection — reached An-Nas (surah 114) ayah 6
  let khatamMsg = "";
  if (endSurah === 114 && endAyah === 6) {
    db.prepare("INSERT INTO khatam_events (user_id, type, date_wib) VALUES (?, 'tilawah', ?)")
      .run(user.id, dateCheck.date);
    khatamMsg = " 🎉 Khatam recorded!";
  }

  // Update streak
  checkAndUpdateStreak(user.id, getWibDateYmd());

  return c.redirect(redirectWith("success", `Tilawah logged: ${juzAmount} juz — ended at ${surahMeta.name} ayah ${endAyah} (Juz ${endJuz}).${khatamMsg}`));
});

export { tilawah as tilawahRoutes };
