import { db } from "../db/connection.ts";
import { getUserTarget } from "./targets.ts";
import { getWibDateYmd } from "./wib-date.ts";

export type UserStreak = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

export type HeatmapEntry = {
  date: string;
  met_target: boolean;
  total_juz: number;
  frozen: boolean;
};

function ymdToEpochDay(ymd: string): number {
  const [year, month, day] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(year!, month! - 1, day!) / 86400000);
}

export function getUserStreak(userId: number, todayWib?: string): UserStreak {
  const row = db
    .prepare("SELECT current_streak, longest_streak, last_active_date FROM user_streaks WHERE user_id = ?")
    .get(userId) as UserStreak | null;
  const stored = row ?? { current_streak: 0, longest_streak: 0, last_active_date: null };

  // Return effective streak: if the last active date is more than 1 day in the past
  // (gap > 2 = missed 2+ consecutive days), the streak is broken — show 0.
  if (todayWib && stored.last_active_date && stored.current_streak > 0) {
    const gap = ymdToEpochDay(todayWib) - ymdToEpochDay(stored.last_active_date);
    if (gap >= 2) {
      return { ...stored, current_streak: 0 };
    }
  }

  return stored;
}

// Returns true if the streak is currently active (last active date is within 1 day of today)
export function isStreakActive(lastActiveDate: string | null, todayWib: string): boolean {
  if (!lastActiveDate) return false;
  return ymdToEpochDay(todayWib) - ymdToEpochDay(lastActiveDate) < 2;
}

// Returns the new streak value if it changed, 0 if no change (already counted today or no activity)
export function checkAndUpdateStreak(userId: number, todayWib: string): number {
  const target = getUserTarget(userId);
  if (!target) return 0;

  const hasActivity = db.prepare(`
    SELECT 1 FROM (
      SELECT date_wib FROM tilawah_logs WHERE user_id = ? AND date_wib = ?
      UNION ALL
      SELECT date_wib FROM murojaah_logs WHERE user_id = ? AND date_wib = ?
    ) LIMIT 1
  `).get(userId, todayWib, userId, todayWib);
  if (!hasActivity) return 0;

  const existing = getUserStreak(userId, todayWib);
  const todayEpoch = ymdToEpochDay(todayWib);

  let newCurrent = existing.current_streak;

  if (existing.last_active_date === todayWib) {
    // Already counted today — no change needed
    return 0;
  } else if (existing.last_active_date) {
    const lastEpoch = ymdToEpochDay(existing.last_active_date);
    const gap = todayEpoch - lastEpoch;

    if (gap <= 2) {
      // Consecutive or 1-day grace period — extend streak
      newCurrent = existing.current_streak + 1;
    } else {
      // Gap > 1 day — streak broken, restart
      newCurrent = 1;
    }
  } else {
    // First ever active day
    newCurrent = 1;
  }

  const newLongest = Math.max(newCurrent, existing.longest_streak);

  db.prepare(`
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      current_streak   = excluded.current_streak,
      longest_streak   = excluded.longest_streak,
      last_active_date = excluded.last_active_date,
      updated_at       = datetime('now')
  `).run(userId, newCurrent, newLongest, todayWib);

  return newCurrent;
}

export const FREEZE_CREDITS_PER_MONTH = 2;

export function getFreezeCreditsLeft(userId: number, yearMonth: string): number {
  const used = (db
    .prepare("SELECT COUNT(*) AS cnt FROM streak_freezes WHERE user_id = ? AND date_wib LIKE ?")
    .get(userId, `${yearMonth}-%`) as { cnt: number }).cnt;
  return Math.max(0, FREEZE_CREDITS_PER_MONTH - used);
}

export function isFrozen(userId: number, dateWib: string): boolean {
  return !!db.prepare("SELECT 1 FROM streak_freezes WHERE user_id = ? AND date_wib = ?").get(userId, dateWib);
}

export function applyFreeze(userId: number, dateWib: string): { ok: boolean; error?: string } {
  const yearMonth = dateWib.slice(0, 7);
  const creditsLeft = getFreezeCreditsLeft(userId, yearMonth);
  if (creditsLeft <= 0) return { ok: false, error: "no_credits" };

  const alreadyFrozen = isFrozen(userId, dateWib);
  if (alreadyFrozen) return { ok: false, error: "already_frozen" };

  const streak = getUserStreak(userId, dateWib);
  if (streak.current_streak === 0) return { ok: false, error: "no_streak" };

  db.prepare("INSERT OR IGNORE INTO streak_freezes (user_id, date_wib) VALUES (?, ?)").run(userId, dateWib);

  // Extend streak to cover today if consecutive
  const todayEpoch = ymdToEpochDay(dateWib);
  let newCurrent = streak.current_streak;
  if (streak.last_active_date && streak.last_active_date !== dateWib) {
    const gap = todayEpoch - ymdToEpochDay(streak.last_active_date);
    if (gap <= 2) newCurrent = streak.current_streak + 1;
  }
  const newLongest = Math.max(newCurrent, streak.longest_streak);

  db.prepare(`
    INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      current_streak   = excluded.current_streak,
      longest_streak   = excluded.longest_streak,
      last_active_date = excluded.last_active_date,
      updated_at       = datetime('now')
  `).run(userId, newCurrent, newLongest, dateWib);

  return { ok: true };
}

// Full streak recalculation from history — call after deleting a log entry.
// Scans last 400 days of activity so it's bounded even for long-time users.
export function rebuildStreak(userId: number): void {
  const target = getUserTarget(userId);
  if (!target) return;

  const todayWib = getWibDateYmd();

  const activityDates = db
    .prepare(
      `SELECT DISTINCT date_wib FROM (
         SELECT date_wib FROM tilawah_logs WHERE user_id = ?
         UNION ALL
         SELECT date_wib FROM murojaah_logs WHERE user_id = ?
         UNION ALL
         SELECT date_wib FROM streak_freezes WHERE user_id = ?
       )
       WHERE date_wib >= date(?, '-400 days')
       ORDER BY date_wib DESC`
    )
    .all(userId, userId, userId, todayWib) as Array<{ date_wib: string }>;

  const dates = activityDates;

  const metDates = dates.map((r) => r.date_wib);

  if (metDates.length === 0) {
    const existing = getUserStreak(userId, todayWib);
    db.prepare(
      `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
       VALUES (?, 0, ?, NULL, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         current_streak   = 0,
         last_active_date = NULL,
         updated_at       = datetime('now')`
    ).run(userId, existing.longest_streak);
    return;
  }

  const todayEpoch = ymdToEpochDay(todayWib);
  const mostRecentEpoch = ymdToEpochDay(metDates[0]!);

  // If last active day is too far in the past, streak is 0
  if (todayEpoch - mostRecentEpoch > 2) {
    const existing = getUserStreak(userId, todayWib);
    db.prepare(
      `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
       VALUES (?, 0, ?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET
         current_streak   = 0,
         last_active_date = excluded.last_active_date,
         updated_at       = datetime('now')`
    ).run(userId, existing.longest_streak, metDates[0]);
    return;
  }

  // Walk back through met dates counting consecutive days (with 1-day grace)
  let streak = 1;
  for (let i = 1; i < metDates.length; i++) {
    const gap = ymdToEpochDay(metDates[i - 1]!) - ymdToEpochDay(metDates[i]!);
    if (gap <= 2) {
      streak++;
    } else {
      break;
    }
  }

  const existing = getUserStreak(userId, todayWib);
  const newLongest = Math.max(streak, existing.longest_streak);

  db.prepare(
    `INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_active_date, updated_at)
     VALUES (?, ?, ?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET
       current_streak   = excluded.current_streak,
       longest_streak   = excluded.longest_streak,
       last_active_date = excluded.last_active_date,
       updated_at       = datetime('now')`
  ).run(userId, streak, newLongest, metDates[0]);
}

export function getActivityHeatmap(userId: number, days = 365): HeatmapEntry[] {
  const todayWib = getWibDateYmd();
  const target = getUserTarget(userId);

  const [ty, tm, td] = todayWib.split("-").map(Number);
  const startMs = Date.UTC(ty!, tm! - 1, td!) - (days - 1) * 86400000;
  const startDate = new Date(startMs).toISOString().slice(0, 10);

  const tilawahRows = db
    .prepare(
      `SELECT date_wib, SUM(juz_amount) AS total
       FROM tilawah_logs
       WHERE user_id = ? AND date_wib BETWEEN ? AND ?
       GROUP BY date_wib`
    )
    .all(userId, startDate, todayWib) as Array<{ date_wib: string; total: number }>;

  const murojaahRows = db
    .prepare(
      `SELECT date_wib, SUM(juz_amount) AS total
       FROM murojaah_logs
       WHERE user_id = ? AND date_wib BETWEEN ? AND ?
       GROUP BY date_wib`
    )
    .all(userId, startDate, todayWib) as Array<{ date_wib: string; total: number }>;

  const freezeRows = db
    .prepare("SELECT date_wib FROM streak_freezes WHERE user_id = ? AND date_wib BETWEEN ? AND ?")
    .all(userId, startDate, todayWib) as Array<{ date_wib: string }>;

  const tilawahByDate = new Map<string, number>();
  const murojaahByDate = new Map<string, number>();
  const frozenDates = new Set<string>();

  for (const r of tilawahRows) tilawahByDate.set(r.date_wib, r.total);
  for (const r of murojaahRows) murojaahByDate.set(r.date_wib, r.total);
  for (const r of freezeRows) frozenDates.add(r.date_wib);

  const allDates = new Set([...tilawahByDate.keys(), ...murojaahByDate.keys(), ...frozenDates]);

  return [...allDates].sort().map((date) => {
    const t = tilawahByDate.get(date) ?? 0;
    const m = murojaahByDate.get(date) ?? 0;
    return {
      date,
      total_juz: Math.round((t + m) * 100) / 100,
      met_target: target ? t >= target.tilawah_juz_daily && m >= target.murojaah_juz_daily : false,
      frozen: frozenDates.has(date) && t === 0 && m === 0,
    };
  });
}
