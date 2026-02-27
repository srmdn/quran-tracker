import { db } from "../db/connection.ts";
import { getMonthlyActivityLeaderboard } from "./activity-calc.ts";
import { getPreviousWibYearMonth } from "./wib-date.ts";

export type MonthlySnapshotResult = {
  status: "created" | "skipped";
  year: number;
  month: number;
  rowsInserted: number;
  reason?: string;
};

function getExistingSnapshotCount(year: number, month: number): number {
  const row = db
    .prepare(
      "SELECT COUNT(*) as c FROM monthly_leaderboard_snapshots WHERE period_year = ? AND period_month = ?"
    )
    .get(year, month) as { c: number };
  return row.c;
}

export function createMonthlySnapshot(params: {
  year: number;
  month: number;
}): MonthlySnapshotResult {
  const { year, month } = params;

  const existing = getExistingSnapshotCount(year, month);
  if (existing > 0) {
    return {
      status: "skipped",
      year,
      month,
      rowsInserted: 0,
      reason: "Snapshot for this period already exists.",
    };
  }

  const leaderboard = getMonthlyActivityLeaderboard({ year, month, page: 1, perPage: 10000 });

  const insertSnapshot = db.prepare(
    `INSERT INTO monthly_leaderboard_snapshots (
      period_year, period_month, user_id, user_name_snapshot, role_snapshot,
      tilawah_juz, murojaah_juz, khatam_count, score, rank, is_top3, is_locked
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`
  );

  const tx = db.transaction((rows: typeof leaderboard.rows) => {
    for (const row of rows) {
      insertSnapshot.run(
        year,
        month,
        row.id,
        row.name,
        row.role,
        row.tilawah_juz,
        row.murojaah_juz,
        row.khatam_count,
        row.score,
        row.rank,
        row.rank <= 3 ? 1 : 0
      );
    }
  });

  tx(leaderboard.rows);

  return {
    status: "created",
    year,
    month,
    rowsInserted: leaderboard.rows.length,
  };
}

export function createPreviousMonthSnapshot(now = new Date()): MonthlySnapshotResult {
  const { year, month } = getPreviousWibYearMonth(now);
  return createMonthlySnapshot({ year, month });
}
