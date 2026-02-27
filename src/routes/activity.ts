import { Hono } from "hono";
import { authMiddleware, memberMiddleware } from "../middleware/auth.ts";
import { db } from "../db/connection.ts";
import { consumeRateLimit } from "../lib/rate-limit.ts";
import { getWibDateYmd, validateWibLogDate } from "../lib/wib-date.ts";
import type { Env } from "../types.ts";

const activity = new Hono<Env>();

activity.use("*", authMiddleware, memberMiddleware);

function redirectWith(kind: "success" | "error", message: string) {
  const q = new URLSearchParams({ [kind]: message });
  return `/progress?${q.toString()}`;
}

function parseJuzAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function rateLimitOrError(userId: number, action: "tilawah" | "murojaah"): string | null {
  const bucket = consumeRateLimit(`activity:${action}:${userId}`, {
    max: 20,
    windowMs: 60_000,
  });
  if (!bucket.allowed) {
    return "Too many requests. Please wait a minute and try again.";
  }
  return null;
}

activity.post("/tilawah", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();

  const limited = rateLimitOrError(user.id, "tilawah");
  if (limited) return c.redirect(redirectWith("error", limited));

  const juzAmount = parseJuzAmount((body.juz_amount as string) || undefined);
  if (!juzAmount) {
    return c.redirect(redirectWith("error", "Invalid juz amount. Use a positive number (up to 2 decimals)."));
  }
  if (juzAmount > 3) {
    return c.redirect(redirectWith("error", "Tilawah per day is limited to 3 juz."));
  }

  const inputDate = ((body.date_wib as string) || (body.date as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) {
    return c.redirect(redirectWith("error", dateCheck.error || "Invalid date."));
  }

  const existing = db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM tilawah_logs WHERE user_id = ? AND date_wib = ?")
    .get(user.id, dateCheck.date) as { total: number };

  if (existing.total + juzAmount > 3) {
    return c.redirect(redirectWith("error", "Tilawah daily total cannot exceed 3 juz."));
  }

  db.prepare("INSERT INTO tilawah_logs (user_id, date_wib, juz_amount) VALUES (?, ?, ?)")
    .run(user.id, dateCheck.date, juzAmount);

  return c.redirect(redirectWith("success", `Tilawah logged: ${juzAmount} juz on ${dateCheck.date} (WIB).`));
});

activity.post("/murojaah", async (c) => {
  const user = c.get("user");
  const body = await c.req.parseBody();

  const limited = rateLimitOrError(user.id, "murojaah");
  if (limited) return c.redirect(redirectWith("error", limited));

  const juzAmount = parseJuzAmount((body.juz_amount as string) || undefined);
  if (!juzAmount) {
    return c.redirect(redirectWith("error", "Invalid juz amount. Use a positive number (up to 2 decimals)."));
  }
  if (juzAmount > 5) {
    return c.redirect(redirectWith("error", "Murojaah per day is limited to 5 juz."));
  }

  const inputDate = ((body.date_wib as string) || (body.date as string) || getWibDateYmd()).trim();
  const dateCheck = validateWibLogDate(inputDate);
  if (!dateCheck.ok || !dateCheck.date) {
    return c.redirect(redirectWith("error", dateCheck.error || "Invalid date."));
  }

  let repetitionCount: number | null = null;
  const repetitionRaw = (body.repetition_count as string | undefined)?.trim();
  if (repetitionRaw) {
    const parsed = parseInt(repetitionRaw, 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return c.redirect(redirectWith("error", "Repetition count must be a positive integer."));
    }
    repetitionCount = parsed;
  }

  const existing = db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM murojaah_logs WHERE user_id = ? AND date_wib = ?")
    .get(user.id, dateCheck.date) as { total: number };

  if (existing.total + juzAmount > 5) {
    return c.redirect(redirectWith("error", "Murojaah daily total cannot exceed 5 juz."));
  }

  db.prepare(
    "INSERT INTO murojaah_logs (user_id, date_wib, juz_amount, repetition_count) VALUES (?, ?, ?, ?)"
  ).run(user.id, dateCheck.date, juzAmount, repetitionCount);

  return c.redirect(
    redirectWith(
      "success",
      `Murojaah logged: ${juzAmount} juz on ${dateCheck.date} (WIB).${repetitionCount ? ` Repetition: ${repetitionCount}x.` : ""}`
    )
  );
});

export { activity as activityRoutes };
