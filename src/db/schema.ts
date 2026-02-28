import { db } from "./connection.ts";

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      google_id   TEXT NOT NULL UNIQUE,
      email       TEXT NOT NULL UNIQUE,
      name        TEXT NOT NULL,
      avatar_url  TEXT,
      role        TEXT NOT NULL DEFAULT 'pending',
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at  TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

    CREATE TABLE IF NOT EXISTS progress_entries (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      surah_number INTEGER NOT NULL,
      last_ayah    INTEGER NOT NULL,
      completed    INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at   TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, surah_number)
    );

    CREATE INDEX IF NOT EXISTS idx_progress_user ON progress_entries(user_id);

    CREATE TABLE IF NOT EXISTS progress_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      surah_number INTEGER NOT NULL,
      ayah_from    INTEGER NOT NULL,
      ayah_to      INTEGER NOT NULL,
      logged_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_progress_log_user ON progress_log(user_id);
    CREATE INDEX IF NOT EXISTS idx_progress_log_time ON progress_log(logged_at);

    CREATE TABLE IF NOT EXISTS tilawah_logs (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date_wib     TEXT NOT NULL,
      juz_amount   REAL NOT NULL CHECK (juz_amount > 0),
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tilawah_user_date ON tilawah_logs(user_id, date_wib);
    CREATE INDEX IF NOT EXISTS idx_tilawah_date ON tilawah_logs(date_wib);

    CREATE TABLE IF NOT EXISTS murojaah_logs (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id           INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date_wib          TEXT NOT NULL,
      juz_amount        REAL NOT NULL CHECK (juz_amount > 0),
      repetition_count  INTEGER CHECK (repetition_count IS NULL OR repetition_count > 0),
      created_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_murojaah_user_date ON murojaah_logs(user_id, date_wib);
    CREATE INDEX IF NOT EXISTS idx_murojaah_date ON murojaah_logs(date_wib);

    CREATE TABLE IF NOT EXISTS monthly_leaderboard_snapshots (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      period_year            INTEGER NOT NULL,
      period_month           INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
      user_id                INTEGER NOT NULL REFERENCES users(id),
      user_name_snapshot     TEXT NOT NULL,
      role_snapshot          TEXT NOT NULL,
      tilawah_juz            REAL NOT NULL DEFAULT 0,
      murojaah_juz           REAL NOT NULL DEFAULT 0,
      khatam_count           INTEGER NOT NULL DEFAULT 0,
      score                  INTEGER NOT NULL DEFAULT 0,
      rank                   INTEGER NOT NULL,
      is_top3                INTEGER NOT NULL DEFAULT 0 CHECK (is_top3 IN (0, 1)),
      is_locked              INTEGER NOT NULL DEFAULT 1 CHECK (is_locked IN (0, 1)),
      created_at             TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(period_year, period_month, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_period_rank
      ON monthly_leaderboard_snapshots(period_year, period_month, rank);
    CREATE INDEX IF NOT EXISTS idx_monthly_snapshots_user
      ON monthly_leaderboard_snapshots(user_id);

    CREATE TRIGGER IF NOT EXISTS trg_monthly_snapshots_prevent_update
    BEFORE UPDATE ON monthly_leaderboard_snapshots
    FOR EACH ROW
    WHEN OLD.is_locked = 1
    BEGIN
      SELECT RAISE(ABORT, 'snapshot row is locked');
    END;

    CREATE TRIGGER IF NOT EXISTS trg_monthly_snapshots_prevent_delete
    BEFORE DELETE ON monthly_leaderboard_snapshots
    FOR EACH ROW
    WHEN OLD.is_locked = 1
    BEGIN
      SELECT RAISE(ABORT, 'snapshot row is locked');
    END;
  `);

  const userColumns = db
    .prepare("PRAGMA table_info(users)")
    .all() as Array<{ name: string }>;
  const hasPasswordHash = userColumns.some((c) => c.name === "password_hash");
  if (!hasPasswordHash) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
  }
}
