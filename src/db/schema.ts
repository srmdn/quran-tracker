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
  const userColNames = userColumns.map((c) => c.name);
  if (!userColNames.includes("password_hash")) {
    db.exec("ALTER TABLE users ADD COLUMN password_hash TEXT");
  }
  if (!userColNames.includes("suspended_at")) {
    db.exec("ALTER TABLE users ADD COLUMN suspended_at TEXT DEFAULT NULL");
  }

  // Position columns on tilawah_logs
  const tilawahColumns = db
    .prepare("PRAGMA table_info(tilawah_logs)")
    .all() as Array<{ name: string }>;
  const tilawahColNames = tilawahColumns.map((c) => c.name);
  if (!tilawahColNames.includes("end_surah"))  db.exec("ALTER TABLE tilawah_logs ADD COLUMN end_surah INTEGER");
  if (!tilawahColNames.includes("end_ayah"))   db.exec("ALTER TABLE tilawah_logs ADD COLUMN end_ayah INTEGER");
  if (!tilawahColNames.includes("end_juz"))    db.exec("ALTER TABLE tilawah_logs ADD COLUMN end_juz INTEGER");
  if (!tilawahColNames.includes("log_unit"))    db.exec("ALTER TABLE tilawah_logs ADD COLUMN log_unit TEXT NOT NULL DEFAULT 'juz'");
  if (!tilawahColNames.includes("log_amount"))  db.exec("ALTER TABLE tilawah_logs ADD COLUMN log_amount INTEGER");
  if (!tilawahColNames.includes("start_surah")) db.exec("ALTER TABLE tilawah_logs ADD COLUMN start_surah INTEGER");
  if (!tilawahColNames.includes("start_ayah"))  db.exec("ALTER TABLE tilawah_logs ADD COLUMN start_ayah INTEGER");
  if (!tilawahColNames.includes("start_juz"))   db.exec("ALTER TABLE tilawah_logs ADD COLUMN start_juz INTEGER");

  // Position columns on murojaah_logs
  const murojaahColumns = db
    .prepare("PRAGMA table_info(murojaah_logs)")
    .all() as Array<{ name: string }>;
  const murojaahColNames = murojaahColumns.map((c) => c.name);
  if (!murojaahColNames.includes("end_surah"))  db.exec("ALTER TABLE murojaah_logs ADD COLUMN end_surah INTEGER");
  if (!murojaahColNames.includes("end_ayah"))   db.exec("ALTER TABLE murojaah_logs ADD COLUMN end_ayah INTEGER");
  if (!murojaahColNames.includes("end_juz"))    db.exec("ALTER TABLE murojaah_logs ADD COLUMN end_juz INTEGER");
  if (!murojaahColNames.includes("log_unit"))    db.exec("ALTER TABLE murojaah_logs ADD COLUMN log_unit TEXT NOT NULL DEFAULT 'juz'");
  if (!murojaahColNames.includes("log_amount"))  db.exec("ALTER TABLE murojaah_logs ADD COLUMN log_amount INTEGER");
  if (!murojaahColNames.includes("start_surah")) db.exec("ALTER TABLE murojaah_logs ADD COLUMN start_surah INTEGER");
  if (!murojaahColNames.includes("start_ayah"))  db.exec("ALTER TABLE murojaah_logs ADD COLUMN start_ayah INTEGER");
  if (!murojaahColNames.includes("start_juz"))   db.exec("ALTER TABLE murojaah_logs ADD COLUMN start_juz INTEGER");

  // user_targets
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_targets (
      user_id               INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      tilawah_juz_daily     REAL NOT NULL CHECK (tilawah_juz_daily > 0),
      murojaah_juz_daily    REAL NOT NULL CHECK (murojaah_juz_daily > 0),
      created_at            TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // user_streaks
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_streaks (
      user_id           INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      current_streak    INTEGER NOT NULL DEFAULT 0,
      longest_streak    INTEGER NOT NULL DEFAULT 0,
      last_active_date  TEXT,
      updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // email_log — record of every email send attempt
  db.exec(`
    CREATE TABLE IF NOT EXISTS email_log (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      email_type  TEXT NOT NULL,
      recipient   TEXT NOT NULL,
      subject     TEXT NOT NULL,
      status      TEXT NOT NULL CHECK (status IN ('sent', 'failed')),
      error       TEXT,
      sent_at     TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_email_log_sent_at ON email_log(sent_at);
    CREATE INDEX IF NOT EXISTS idx_email_log_status ON email_log(status);
  `);

  // enrollments — public enrollment form submissions
  db.exec(`
    CREATE TABLE IF NOT EXISTS enrollments (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name       TEXT NOT NULL,
      date_of_birth   TEXT NOT NULL,
      gender          TEXT NOT NULL CHECK (gender IN ('male', 'female')),
      whatsapp        TEXT NOT NULL,
      address         TEXT NOT NULL,
      program_type    TEXT NOT NULL,
      quran_level     TEXT NOT NULL,
      wali_name       TEXT NOT NULL,
      wali_contact    TEXT NOT NULL,
      notes           TEXT,
      submitted_at    TEXT NOT NULL DEFAULT (datetime('now')),
      ip_address      TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_enrollments_submitted ON enrollments(submitted_at);
  `);

  // Additive migration: status column on enrollments
  const enrollmentColumns = db
    .prepare("PRAGMA table_info(enrollments)")
    .all() as Array<{ name: string }>;
  if (!enrollmentColumns.map((c) => c.name).includes("status")) {
    db.exec("ALTER TABLE enrollments ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
  }

  // streak_freezes — user-applied streak freeze credits
  db.exec(`
    CREATE TABLE IF NOT EXISTS streak_freezes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date_wib   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, date_wib)
    );

    CREATE INDEX IF NOT EXISTS idx_streak_freezes_user ON streak_freezes(user_id, date_wib);
  `);

  // khatam_events — position-verified khatam (end_surah=114, end_ayah=6)
  db.exec(`
    CREATE TABLE IF NOT EXISTS khatam_events (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type        TEXT NOT NULL CHECK (type IN ('tilawah', 'murojaah')),
      date_wib    TEXT NOT NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_khatam_events_user ON khatam_events(user_id);
    CREATE INDEX IF NOT EXISTS idx_khatam_events_date ON khatam_events(user_id, date_wib);
  `);
}
