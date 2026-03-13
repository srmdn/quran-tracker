import { db } from "../db/connection.ts";
import { hasMetTargetToday, getUserTarget } from "./targets.ts";
import { getWibDateYmd } from "./wib-date.ts";

export type UserStreak = {
  current_streak: number;
  longest_streak: number;
  last_active_date: string | null;
};

export type HeatmapEntry = {
  date: string;
  met_target: boolean;
};

function ymdToEpochDay(ymd: string): number {
  const [year, month, day] = ymd.split("-").map(Number);
  return Math.floor(Date.UTC(year!, month! - 1, day!) / 86400000);
}

export function getUserStreak(userId: number): UserStreak {
  const row = db
    .prepare("SELECT current_streak, longest_streak, last_active_date FROM user_streaks WHERE user_id = ?")
    .get(userId) as UserStreak | null;
  return row ?? { current_streak: 0, longest_streak: 0, last_active_date: null };
}

// Returns the new streak value if it changed, 0 if no change (already counted today or target not met)
export function checkAndUpdateStreak(userId: number, todayWib: string): number {
  const target = getUserTarget(userId);
  if (!target) return 0;

  const metToday = hasMetTargetToday(userId, todayWib, target);
  if (!metToday) return 0;

  const existing = getUserStreak(userId);
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

// Full streak recalculation from history — call after deleting a log entry.
// Scans last 400 days of activity so it's bounded even for long-time users.
export function rebuildStreak(userId: number): void {
  const target = getUserTarget(userId);
  if (!target) return;

  const todayWib = getWibDateYmd();

  const dates = db
    .prepare(
      `SELECT DISTINCT date_wib FROM (
         SELECT date_wib FROM tilawah_logs WHERE user_id = ?
         UNION ALL
         SELECT date_wib FROM murojaah_logs WHERE user_id = ?
       )
       WHERE date_wib >= date(?, '-400 days')
       ORDER BY date_wib DESC`
    )
    .all(userId, userId, todayWib) as Array<{ date_wib: string }>;

  const metDates = dates
    .map((r) => r.date_wib)
    .filter((date) => hasMetTargetToday(userId, date, target));

  if (metDates.length === 0) {
    const existing = getUserStreak(userId);
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
    const existing = getUserStreak(userId);
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

  const existing = getUserStreak(userId);
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

export function getActivityHeatmap(userId: number, days = 90): HeatmapEntry[] {
  const target = getUserTarget(userId);

  // Get all dates with logs in range
  const rows = db.prepare(`
    SELECT date_wib, SUM(juz_amount) AS total
    FROM (
      SELECT date_wib, juz_amount FROM tilawah_logs WHERE user_id = ?
      UNION ALL
      SELECT date_wib, juz_amount FROM murojaah_logs WHERE user_id = ?
    )
    GROUP BY date_wib
    ORDER BY date_wib DESC
    LIMIT ?
  `).all(userId, userId, days * 2) as Array<{ date_wib: string; total: number }>;

  if (!target) {
    return rows.slice(0, days).map((r) => ({ date: r.date_wib, met_target: false }));
  }

  // For each date check if both targets were met
  const tilawahByDate = new Map<string, number>();
  const murojaahByDate = new Map<string, number>();

  const tilawahRows = db.prepare(
    "SELECT date_wib, SUM(juz_amount) AS total FROM tilawah_logs WHERE user_id = ? GROUP BY date_wib"
  ).all(userId) as Array<{ date_wib: string; total: number }>;

  const murojaahRows = db.prepare(
    "SELECT date_wib, SUM(juz_amount) AS total FROM murojaah_logs WHERE user_id = ? GROUP BY date_wib"
  ).all(userId) as Array<{ date_wib: string; total: number }>;

  for (const r of tilawahRows) tilawahByDate.set(r.date_wib, r.total);
  for (const r of murojaahRows) murojaahByDate.set(r.date_wib, r.total);

  const allDates = new Set([...tilawahByDate.keys(), ...murojaahByDate.keys()]);
  const sorted = [...allDates].sort().reverse().slice(0, days);

  return sorted.map((date) => {
    const t = tilawahByDate.get(date) ?? 0;
    const m = murojaahByDate.get(date) ?? 0;
    return {
      date,
      met_target: t >= target.tilawah_juz_daily && m >= target.murojaah_juz_daily,
    };
  });
}
