# Quran Activity Tracker -- MVP Specification (Current Stack)

**Project Name:** Quran Activity Tracker  
**Domain:** quran.markaztalaqi.com  
**Scope:** Internal system (publicly viewable leaderboard)  
**Implementation Base:** Existing Bun + Hono + SQLite codebase

---

## 1. Core Objectives

The MVP must:

1. Allow registered users to log:
   - Tilawah
   - Murojaah
2. Automatically calculate:
   - Total juz
   - Total khatam
3. Generate:
   - Monthly leaderboard
   - Top 3 ranking
4. Send:
   - Monthly leaderboard email notification
5. Support:
   - Role-based access control
6. Be deployable via:
   - Docker on VPS
   - Reverse proxied by Nginx (FastPanel)

---

## 2. Current Architecture Decision (Locked for MVP)

MVP implementation uses current project stack:

- Runtime: **Bun**
- Framework: **Hono** (SSR)
- Database: **SQLite** (`bun:sqlite`)
- Auth/session: **Secure cookie session**
- UI: Existing server-rendered pages

Deferred (post-MVP):

- Backend rewrite to Go
- Migration to PostgreSQL

---

## 3. User Roles

There are 4 active roles:

1. `super_admin`
2. `santri`
3. `alumni`
4. `asatidz`

Rules:

- All active roles participate equally in leaderboard scoring.
- `super_admin` can manage users and activity logs.
- `super_admin` cannot remove or demote own `super_admin` role (protected action).

---

## 4. Authentication Strategy (Implemented in Current MVP)

MVP now supports **hybrid authentication**:

- Google OAuth + session (existing flow)
- Email/password + session (new fallback flow)

Minimum behavior:

- Unique email enforced
- Role stored as enum/text in DB
- Session-based authentication with secure cookies
- Password hash storage for email/password login (server-side verification)

---

## 5. Activity Tracking

### A. Tilawah Log

Each log includes:

- `user_id`
- `date` (WIB timezone date)
- `juz_amount` (decimal allowed)
- `created_at`

Restrictions:

- Max `3 juz` per day
- Cannot backdate more than `1 day` (WIB)

### B. Murojaah Log

Each log includes:

- `user_id`
- `date` (WIB timezone date)
- `juz_amount`
- `repetition_count` (optional integer)
- `created_at`

Restrictions:

- Max `5 juz` per day
- Cannot backdate more than `1 day` (WIB)

---

## 6. Khatam Calculation (Automatic)

Khatam is NOT manually input.

Formula:

`total_tilawah_juz / 30 = total_khatam`

System stores/displays:

- `total_juz`
- `total_khatam` (derived)
- `progress_to_next_khatam`

---

## 7. Leaderboard System

Leaderboard characteristics:

- Monthly (Gregorian month)
- WIB timezone based
- Includes all active users (`santri`, `alumni`, `asatidz`, `super_admin`)
- Publicly viewable (read-only)

Scoring:

- `1 juz tilawah = 10 points`
- `1 juz murojaah = 7 points`
- `1 khatam = 300 bonus points`

Final formula:

`score = (tilawah_juz * 10) + (murojaah_juz * 7) + (khatam_count * 300)`

---

## 8. Monthly Snapshot System

On day 1 of each month at `00:05 WIB`, system must:

1. Calculate previous month ranking
2. Store immutable snapshot in `monthly_leaderboard_snapshots`
3. Trigger monthly notification email

Snapshot job must be idempotent (safe if retried).

---

## 9. Email Notification System

Triggered monthly after snapshot generation.

Email content includes:

- Period label (weekly/monthly/yearly)
- Generated time (WIB)
- Top 3 users
- Their scores
- Recipient personal summary (rank, score, tilawah, murojaah, khatam)
- CTA link to full leaderboard
- Encouragement message

Recipients:

- All registered active users

---

## 10. Anti-Cheat Mechanisms

- Daily input limit checks
- Max juz validation
- Backdate restriction (1 day)
- Server-side validation only
- Rate limit on activity submission endpoints

---

## 11. Public vs Private Access

Public:

- View current monthly leaderboard
- View historical snapshots

Private (login required):

- Log tilawah/murojaah
- View dashboard
- View personal rank
- Admin management actions (super_admin only)

---

## 12. Database Tables (MVP on SQLite)

Required tables for this MVP:

- `users` (extended role model)
- `sessions` (existing)
- `tilawah_logs`
- `murojaah_logs`
- `monthly_leaderboard_snapshots`

No `khatam_logs` table (khatam is derived).

---

## 13. Dashboard (Simple)

Displays:

- Total tilawah juz (all time)
- Total murojaah juz (all time)
- Total khatam
- Current month score
- Current month rank
- Progress bar to next khatam

---

## 14. Deployment Requirements (Current Stack)

- Dockerfile for Bun app
- SQLite persisted via mounted volume (`/app/data`)
- Nginx reverse proxy via FastPanel
- Environment variable configuration
- Monthly cron runner for snapshot + email task

Note:

- SQLite DB file must not be publicly exposed.

---

## 15. Backup Requirements

- Daily SQLite backup (`.db` + WAL-safe procedure)
- Monthly snapshot backup export
- Stored locally on VPS (and optional offsite copy)

---

## 16. Out of Scope (MVP)

- Gamification badges
- Halaqah groups
- Target goals
- Advanced charts/analytics
- Hijri-based ranking
- Mobile app
- Full PostgreSQL migration
- Go backend rewrite

---

## 17. MVP Completion Criteria

MVP is complete when:

- Users can log tilawah and murojaah with validation rules
- Users can log in with Google OAuth or email/password
- System auto-calculates khatam and monthly score
- Monthly leaderboard and top 3 are accurate
- Monthly snapshot job works and is immutable
- Email notification sends after snapshot
- Super admin can manage users and logs safely
- System is deployed and accessible at quran.markaztalaqi.com
