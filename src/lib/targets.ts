import { db } from "../db/connection.ts";

// Sanity ceilings per WIB day (anti-abuse bound, not a target).
// Targets are goals; logging above target is allowed up to these limits.
export const TILAWAH_DAILY_CEILING_JUZ = 30;
export const MUROJAAH_DAILY_CEILING_JUZ = 60;

export type UserTarget = {
  user_id: number;
  tilawah_juz_daily: number;
  murojaah_juz_daily: number;
};

export function getUserTarget(userId: number): UserTarget | null {
  return db
    .prepare("SELECT user_id, tilawah_juz_daily, murojaah_juz_daily FROM user_targets WHERE user_id = ?")
    .get(userId) as UserTarget | null;
}

export function upsertUserTarget(
  userId: number,
  tilawahJuzDaily: number,
  murojaahJuzDaily: number
): void {
  db.prepare(`
    INSERT INTO user_targets (user_id, tilawah_juz_daily, murojaah_juz_daily, updated_at)
    VALUES (?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      tilawah_juz_daily = excluded.tilawah_juz_daily,
      murojaah_juz_daily = excluded.murojaah_juz_daily,
      updated_at = datetime('now')
  `).run(userId, tilawahJuzDaily, murojaahJuzDaily);
}

export function getTodayTilawahTotal(userId: number, todayWib: string): number {
  const row = db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM tilawah_logs WHERE user_id = ? AND date_wib = ?")
    .get(userId, todayWib) as { total: number };
  return row.total;
}

export function getTodayMurojaahTotal(userId: number, todayWib: string): number {
  const row = db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM murojaah_logs WHERE user_id = ? AND date_wib = ?")
    .get(userId, todayWib) as { total: number };
  return row.total;
}

export function hasMetTargetToday(
  userId: number,
  todayWib: string,
  target: UserTarget
): boolean {
  const tilawah = getTodayTilawahTotal(userId, todayWib);
  const murojaah = getTodayMurojaahTotal(userId, todayWib);
  return tilawah >= target.tilawah_juz_daily && murojaah >= target.murojaah_juz_daily;
}
