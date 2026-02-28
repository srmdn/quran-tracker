# Merge Implementation Plan (Keep Existing Features + Add MVP)

## 1. Goal and Non-Negotiables

This plan extends the current Quran Tahfiz Tracker without removing existing behavior.

Non-negotiables:

- Keep existing login flow (Google OAuth + pending approval) working.
- Keep existing hafalan tracking (surah/ayah), existing leaderboard, dashboard, and admin pages.
- Add Tilawah + Murojaah MVP capabilities as a parallel module.
- Use current stack (Bun + Hono + SQLite) for MVP delivery.

---

## 2. Scope Split

### Existing features (must remain)

- Auth: Google sign-in + sessions + pending/member/admin access behavior
- Hafalan:
  - Progress entries by surah/ayah
  - Progress log history
  - Existing memorization leaderboard
  - Existing dashboard statistics
- Admin:
  - Pending approval flow
  - Role changes already available in current app

### New MVP features (to add)

- Tilawah logging with validation rules
- Murojaah logging with validation rules
- Monthly score engine (WIB) + Top 3
- Monthly immutable snapshot
- Monthly email notification
- Public monthly leaderboard + historical snapshots
- Role model alignment for pesantren operations

---

## 3. Delivery Strategy

Use additive modules and migrations:

1. Add new tables and services first.
2. Add new routes/pages next.
3. Keep old routes/pages unchanged.
4. Introduce role migration compatibility layer (so old roles do not break while new roles are introduced).

No big-bang rewrite.

---

## 4. Phase Plan

## Phase 0 -- Baseline Freeze and Safety

Deliverables:

- Tag/backup current working baseline
- Document current route map and schema snapshot
- Add migration guard checklist

Acceptance:

- Existing app behavior unchanged after baseline capture

## Phase 1 -- Database Additions (No UI Changes Yet)

Deliverables:

- New tables:
  - `tilawah_logs`
  - `murojaah_logs`
  - `monthly_leaderboard_snapshots`
- Add indexes for:
  - `(user_id, date)` on both log tables
  - monthly lookup and rank lookup on snapshots
- Add immutable snapshot constraint strategy (logical lock)

Acceptance:

- App boots successfully with migrations
- Existing hafalan data and queries remain intact

## Phase 2 -- Role Model Expansion (Backward Compatible)

Deliverables:

- Introduce target roles:
  - `super_admin`, `santri`, `alumni`, `asatidz`
- Compatibility rules from existing roles:
  - `admin` -> `super_admin` (or mapped admin-capable role per final policy)
  - `member` -> `santri` (default)
  - `pending` remains pending flow until approved
- Protect self-demotion for `super_admin`

Acceptance:

- Existing users can still log in
- Admin-level access still works
- No lockout for current administrator account

## Phase 3 -- Tilawah and Murojaah Write APIs

Deliverables:

- Authenticated endpoints for adding logs
- Server-side validation:
  - Tilawah max 3 juz/day
  - Murojaah max 5 juz/day
  - Backdate max 1 day (WIB)
  - Decimal amount validation
- Rate limit middleware on write endpoints

Acceptance:

- Invalid requests rejected with clear error messages
- Valid logs persisted correctly

## Phase 4 -- Calculation Engine (Monthly + All-Time)

Deliverables:

- Shared service functions for:
  - total tilawah juz
  - total murojaah juz
  - total khatam (derived from tilawah)
  - progress to next khatam
  - monthly score formula
- WIB month boundary handling

Acceptance:

- Formula outputs match spec
- Month transitions produce correct totals/ranks

## Phase 5 -- UI Integration (Additive)

Deliverables:

- New activity page(s) for Tilawah/Murojaah logging
- Dashboard extension:
  - all-time tilawah
  - all-time murojaah
  - total khatam
  - current month score/rank
  - progress to next khatam
- New monthly leaderboard page and top 3 view
- Historical snapshot page (public)

Acceptance:

- Existing hafalan pages still work unchanged
- New pages accessible by authorized users

## Phase 6 -- Monthly Snapshot Job

Deliverables:

- Scheduled job (00:05 WIB, day 1):
  - compute previous month leaderboard
  - persist immutable snapshot
  - idempotency check to prevent duplicate month snapshots

Acceptance:

- Re-running same month job does not duplicate records
- Snapshot records are read-only in app layer

## Phase 7 -- Email Notification

Deliverables:

- Email adapter abstraction (provider via env vars)
- Monthly leaderboard email template
- Trigger from snapshot job after success

Acceptance:

- Emails sent to active users
- Failures logged without corrupting snapshot state

## Phase 8 -- Deployment and Ops

Deliverables:

- Docker runtime update (if needed)
- Cron integration on VPS for monthly job
- Backup scripts:
  - daily SQLite backup
  - monthly snapshot export

Acceptance:

- Production deploy with no regression on existing features
- Backup files generated and restorable

---

## 5. API and UI Order of Work (Recommended)

1. Schema + migration
2. Role compatibility
3. Write endpoints
4. Calculation service
5. Read endpoints
6. UI pages
7. Snapshot job
8. Email integration
9. Hardening and tests

---

## 6. Testing Plan

Minimum tests per phase:

- Unit tests:
  - validation limits
  - score formula
  - khatam derivation
  - WIB date boundaries
- Integration tests:
  - role-based access
  - activity create/read
  - monthly snapshot idempotency
- Regression checks:
  - existing hafalan flow unchanged
  - existing login/approval flow unchanged

---

## 7. Risks and Controls

Risk: role migration breaks existing users  
Control: compatibility mapping + rollback SQL + first-admin protection

Risk: timezone bugs at month boundaries  
Control: central WIB utility and boundary tests

Risk: snapshot duplication  
Control: unique key per month-year + idempotent job logic

Risk: mixed leaderboard confusion (hafalan vs monthly activity)  
Control: explicit labels in UI:
- "Hafalan Leaderboard" (existing)
- "Monthly Activity Leaderboard" (new)

---

## 8. Definition of Done

Done means:

- Existing system functions exactly as before.
- New Tilawah/Murojaah features work end-to-end.
- Monthly leaderboard/snapshot/email workflows run successfully.
- Admin/super_admin management and protections are enforced.
- Deployment and backup procedures are documented and tested.

---

## 9. Implementation Progress Log

This section is append-only. Completed work is described here after each finished phase/task.

### 2026-02-28 -- Phase 1 Completed (Database Additions)

- Added new SQLite tables:
  - `tilawah_logs`
  - `murojaah_logs`
  - `monthly_leaderboard_snapshots`
- Added indexes for lookup performance on user/date and period/rank dimensions.
- Added immutable snapshot protection with DB triggers that block update/delete when snapshot rows are locked.
- Verified schema initialization runs without SQL errors.

### 2026-02-28 -- Phase 2 Completed (Role Expansion, Backward Compatible)

- Introduced new role model compatibility while preserving existing users and flows.
- Added central role helper utilities to avoid hardcoded role checks across files.
- Updated middleware/admin/leaderboard/header logic to recognize both legacy and new roles safely.
- Preserved pending approval behavior and admin protections during migration stage.

### 2026-02-28 -- Phase 3 Completed (Tilawah/Murojaah Write APIs)

- Added authenticated write endpoints:
  - `POST /activity/tilawah`
  - `POST /activity/murojaah`
- Implemented server-side validation for:
  - per-day maximums (tilawah 3 juz, murojaah 5 juz)
  - date format and backdate/future constraints (WIB)
  - numeric and repetition field correctness
- Added lightweight per-user rate limiting for activity write endpoints.
- Mounted new activity route without altering existing hafalan routes.

### 2026-02-28 -- Phase 4 Completed (Calculation Engine Services)

- Added WIB month utility helpers for current year/month and month range boundaries.
- Added activity calculation service functions for:
  - all-time totals (tilawah, murojaah, total juz)
  - derived khatam and progress to next khatam
  - monthly leaderboard scoring and ranking
- Implemented scoring formula:
  - `tilawah*10 + murojaah*7 + khatam*300`
- Verified calculation module runs successfully against initialized schema.

### 2026-02-28 -- Phase 5 Completed (UI Integration, Additive)

- Added dedicated Activity Tracker UI page at `/activity` with:
  - Tilawah and Murojaah logging forms
  - all-time and monthly summary cards
  - next khatam progress bar
  - recent activity log list
- Added monthly activity leaderboard UI at `/activity/leaderboard` with:
  - top 3 cards
  - full ranking table (score, tilawah, murojaah, khatam)
- Extended dashboard with additive activity summary widgets:
  - all-time tilawah/murojaah/khatam
  - current month activity rank and score
  - progress to next khatam
- Updated top navigation to include Activity while preserving all existing hafalan pages/routes.

### 2026-02-28 -- Phase 6 Completed (Monthly Snapshot Job + Idempotency)

- Added transactional snapshot service:
  - `src/lib/monthly-snapshot.ts`
  - creates monthly immutable rows in `monthly_leaderboard_snapshots`
- Implemented idempotency rule:
  - if snapshot rows already exist for a period, job returns `skipped` without modifying data
- Added previous-month snapshot helper (WIB-aware month selection).
- Added runnable job entrypoint for cron:
  - `src/jobs/monthly-snapshot.ts`
  - package script: `bun run snapshot:monthly`
  - supports optional env override:
    - `SNAPSHOT_YEAR=YYYY`
    - `SNAPSHOT_MONTH=MM`
- Added manual admin trigger endpoint and UI button:
  - `POST /admin/snapshots/run`
  - useful for verification before cron deployment.

### 2026-02-28 -- Phase 7 Completed (Monthly Email Notification)

- Added SMTP sender implementation for SSL SMTP (`465`) using env config:
  - `src/lib/smtp.ts`
- Added monthly email orchestration:
  - `src/lib/monthly-email.ts`
  - sends monthly leaderboard summary (month + top 3 + encouragement)
  - recipients: all active user emails
- Integrated email trigger after snapshot creation in:
  - `src/jobs/monthly-snapshot.ts`
  - `POST /admin/snapshots/run` flow
- Failure behavior:
  - snapshot creation remains committed even when email fails
  - failures are logged and surfaced in job/admin status text

### 2026-02-28 -- Admin CRUD Enhancement Completed

- Extended Admin panel user management to cover fuller CRUD behavior:
  - Create user (manual account bootstrap)
  - Edit user (name, email, role)
  - Delete user (with safety rules)
- Added super-admin safeguards and authority checks:
  - only `super_admin` can perform create/edit/delete
  - super-admin self-demotion is blocked
  - deleting a `super_admin` account is blocked
- Improved OAuth linking behavior for manually created users:
  - if Google login matches an existing email, the existing account is linked and reused
  - avoids duplicate-account conflicts for pre-created users

### 2026-02-28 -- Hybrid Authentication Implemented

- Added email/password login flow while keeping Google OAuth active.
- Login page now supports both:
  - Sign in with Google
  - Sign in with Email + Password
- Added password hash support in `users` schema (`password_hash` migration).
- Added super-admin password management in admin panel:
  - set password at user creation
  - update/reset password for existing users
- Retained role-based access and pending approval behavior for both auth methods.

### 2026-02-28 -- Branding and Email UX Rebrand Completed

- Rebranded app identity to Markaz Talaqqi:
  - app naming constants updated
  - login/dashboard/leaderboard wording updated
- Upgraded snapshot email format:
  - branded HTML template + plain text fallback
  - improved subject format:
    - `Markaz Talaqqi | <Period Type> | <Period Label>`
  - added CTA button to full leaderboard
  - added recipient personal summary and generated timestamp (WIB)
- Sanitized `.env.example` SMTP placeholders to generic values.
