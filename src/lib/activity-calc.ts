import { db } from "../db/connection.ts";
import { ACTIVE_MEMBER_ROLES } from "./roles.ts";
import { getWibMonthRange, getWibYearMonth } from "./wib-date.ts";

export const TILAWAH_POINT_PER_JUZ = 10;
export const MUROJAAH_POINT_PER_JUZ = 7;
export const KHATAM_BONUS_POINT = 300;

export type ActivityTotals = {
  tilawahJuz: number;
  murojaahJuz: number;
  totalJuz: number;
  totalKhatam: number;
  progressToNextKhatam: number;
};

export type MonthlyActivityRow = {
  id: number;
  name: string;
  avatar_url: string | null;
  role: string;
  tilawah_juz: number;
  murojaah_juz: number;
  khatam_count: number;
  score: number;
  rank: number;
};

export type UserMonthlyActivityRank = {
  rank: number;
  score: number;
  tilawahJuz: number;
  murojaahJuz: number;
  khatamCount: number;
} | null;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// Khatam is position-verified only (tilawah log ending at An-Nas 114:6),
// recorded in khatam_events. Murojaah never counts as khatam.
function getTilawahKhatamCount(userId: number, range?: { from: string; to: string }): number {
  const row = range
    ? db
        .prepare(
          "SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah' AND date_wib BETWEEN ? AND ?"
        )
        .get(userId, range.from, range.to) as { cnt: number }
    : db
        .prepare("SELECT COUNT(*) AS cnt FROM khatam_events WHERE user_id = ? AND type = 'tilawah'")
        .get(userId) as { cnt: number };
  return row.cnt;
}

// Progress to next khatam = tilawah logged after the most recent khatam event.
// Compare by date_wib, not created_at: backfilled khatam events carry an
// INSERT timestamp far later than the real khatam date, which would zero out
// legitimate progress.
function getTilawahProgressSinceLastKhatam(userId: number, tilawahJuz: number): number {
  const last = db
    .prepare(
      "SELECT date_wib FROM khatam_events WHERE user_id = ? AND type = 'tilawah' ORDER BY date_wib DESC, created_at DESC LIMIT 1"
    )
    .get(userId) as { date_wib: string } | null;
  if (!last) return tilawahJuz;
  const row = db
    .prepare("SELECT COALESCE(SUM(juz_amount), 0) AS total FROM tilawah_logs WHERE user_id = ? AND date_wib > ?")
    .get(userId, last.date_wib) as { total: number };
  return round2(row.total || 0);
}

function calcScore(tilawahJuz: number, murojaahJuz: number, khatamCount: number): number {
  // Score is stored/displayed as integer points.
  const raw =
    tilawahJuz * TILAWAH_POINT_PER_JUZ +
    murojaahJuz * MUROJAAH_POINT_PER_JUZ +
    khatamCount * KHATAM_BONUS_POINT;
  return Math.round(raw);
}

function activeRolesSqlList(): string {
  return ACTIVE_MEMBER_ROLES.map((r) => `'${r}'`).join(", ");
}

function getSum(
  table: "tilawah_logs" | "murojaah_logs",
  userId: number,
  range?: { from: string; to: string }
): number {
  if (!range) {
    const row = db
      .prepare(`SELECT COALESCE(SUM(juz_amount), 0) AS total FROM ${table} WHERE user_id = ?`)
      .get(userId) as { total: number };
    return round2(row.total || 0);
  }

  const row = db
    .prepare(
      `SELECT COALESCE(SUM(juz_amount), 0) AS total
       FROM ${table}
       WHERE user_id = ? AND date_wib BETWEEN ? AND ?`
    )
    .get(userId, range.from, range.to) as { total: number };

  return round2(row.total || 0);
}

export function getUserActivityTotals(userId: number): ActivityTotals {
  const tilawahJuz = getSum("tilawah_logs", userId);
  const murojaahJuz = getSum("murojaah_logs", userId);
  const totalKhatam = getTilawahKhatamCount(userId);

  return {
    tilawahJuz,
    murojaahJuz,
    totalJuz: round2(tilawahJuz + murojaahJuz),
    totalKhatam,
    progressToNextKhatam: getTilawahProgressSinceLastKhatam(userId, tilawahJuz),
  };
}

export function getCurrentMonthActivityLeaderboard(params?: {
  page?: number;
  perPage?: number;
}): { year: number; month: number; total: number; rows: MonthlyActivityRow[] } {
  const { year, month } = getWibYearMonth();
  return getMonthlyActivityLeaderboard({ year, month, ...params });
}

export function getMonthlyActivityLeaderboard(params: {
  year: number;
  month: number;
  page?: number;
  perPage?: number;
}): { year: number; month: number; total: number; rows: MonthlyActivityRow[] } {
  const { year, month, page = 1, perPage = 20 } = params;
  const range = getWibMonthRange(year, month);
  const rolesSql = activeRolesSqlList();

  const users = db
    .prepare(
      `SELECT
         u.id,
         u.name,
         u.avatar_url,
         u.role,
         COALESCE(t.tilawah_juz, 0) AS tilawah_juz,
         COALESCE(m.murojaah_juz, 0) AS murojaah_juz,
         COALESCE(k.khatam_cnt, 0) AS khatam_cnt
       FROM users u
       LEFT JOIN (
         SELECT user_id, SUM(juz_amount) AS tilawah_juz
         FROM tilawah_logs
         WHERE date_wib BETWEEN ? AND ?
         GROUP BY user_id
       ) t ON t.user_id = u.id
       LEFT JOIN (
         SELECT user_id, SUM(juz_amount) AS murojaah_juz
         FROM murojaah_logs
         WHERE date_wib BETWEEN ? AND ?
         GROUP BY user_id
       ) m ON m.user_id = u.id
       LEFT JOIN (
         SELECT user_id, COUNT(*) AS khatam_cnt
         FROM khatam_events
         WHERE type = 'tilawah' AND date_wib BETWEEN ? AND ?
         GROUP BY user_id
       ) k ON k.user_id = u.id
       WHERE u.role IN (${rolesSql}) AND u.suspended_at IS NULL AND EXISTS (SELECT 1 FROM user_targets ut WHERE ut.user_id = u.id)`
     )
    .all(range.from, range.to, range.from, range.to, range.from, range.to) as Array<{
    id: number;
    name: string;
    avatar_url: string | null;
    role: string;
    tilawah_juz: number;
    murojaah_juz: number;
    khatam_cnt: number;
  }>;

  const ranked = users
    .map((u) => {
      const tilawah = round2(u.tilawah_juz || 0);
      const murojaah = round2(u.murojaah_juz || 0);
      const khatam = u.khatam_cnt || 0;
      const score = calcScore(tilawah, murojaah, khatam);
      return {
        id: u.id,
        name: u.name,
        avatar_url: u.avatar_url,
        role: u.role,
        tilawah_juz: tilawah,
        murojaah_juz: murojaah,
        khatam_count: khatam,
        score,
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.tilawah_juz - a.tilawah_juz ||
        b.murojaah_juz - a.murojaah_juz ||
        a.name.localeCompare(b.name)
    )
    .map((row, idx) => ({ ...row, rank: idx + 1 }));

  const start = (page - 1) * perPage;
  const end = start + perPage;

  return {
    year,
    month,
    total: ranked.length,
    rows: ranked.slice(start, end),
  };
}

export function getCurrentMonthUserActivityRank(userId: number): UserMonthlyActivityRank {
  const { year, month } = getWibYearMonth();
  return getMonthlyUserActivityRank(userId, year, month);
}

export function getMonthlyUserActivityRank(
  userId: number,
  year: number,
  month: number
): UserMonthlyActivityRank {
  const leaderboard = getMonthlyActivityLeaderboard({ year, month, page: 1, perPage: 10000 });
  const row = leaderboard.rows.find((r) => r.id === userId);
  if (!row) return null;

  return {
    rank: row.rank,
    score: row.score,
    tilawahJuz: row.tilawah_juz,
    murojaahJuz: row.murojaah_juz,
    khatamCount: row.khatam_count,
  };
}
