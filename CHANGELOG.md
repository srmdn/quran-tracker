# Changelog

All notable changes to this project are documented here.

---

## [Unreleased]

---

## [1.0.2] — 2026-04-03

### Features

- Streak now advances on any log activity, not only days where the daily target was fully met

### UI

- Replaced public leaderboard section on landing page with "Who Can Join" section
- How-to-join steps redesigned with large numbered indicators, no icons

---

## [1.0.1] — 2026-04-02

### Bug Fixes

- Suspended users no longer appear in the hafalan or activity leaderboard
- Users who have not set a daily target are excluded from both leaderboards

---

## [1.0.0] — 2026-03-31

First public release. Full-featured community Quran reading and memorization tracker.

### Core features
- Tilawah and murojaah daily logging with surah/ayah endpoint tracking
- Daily targets per user, per-entry cap of 30 juz, daily cap tied to target
- Monthly leaderboard: Tilawah×10 + Murojaah×7 + Khatam×300 scoring
- Khatam detection with 30-juz cycle boundary plausibility check and once-per-day dedup
- Juz/pages dual input mode (20 pages = 1 juz, Medina Mushaf standard)
- Streak tracking with milestone emails (7, 30, 100 days) and broken streak display
- Monthly leaderboard snapshots (archived, browsable by month)
- 1-year rolling activity graph on dashboard

### Auth and users
- Google OAuth 2.0 + email/password login
- Role system: pending, member, admin, super_admin
- Admin approval flow for new members
- Suspend/unsuspend without data loss
- Profile page: display name, avatar, password change

### Admin panel
- Member list with search, role filter, pagination
- Member detail: stats, khatam history, log history with pagination
- Dedicated edit user page
- Enrollment form submissions viewer
- Email log with resend for failed emails

### Email system
- Welcome, approval, rejection, role change, suspend/unsuspend emails
- Khatam congrats email
- Streak milestone email
- Overtaken notification (when a member's score is passed on the leaderboard)
- Daily reminder (skips users who met both targets; nudges users without a target)
- Monthly snapshot email with personal summary
- All sends logged to `email_log` table; failures visible in admin panel

### Landing page
- Public landing with live leaderboard preview (top 20), community stats
- About the Program section (scoring explanation, juz/pages system)
- Rotating Fastabiqul Khoirot verses
- i18n: English and Indonesian

### Security
- Login rate limiting (5 attempts, 30-minute lockout)
- Session invalidation on Google OAuth account binding
- Brute-force protection with per-IP counters
- Input validation and parameterized queries throughout
- `private/` directory for internal docs, excluded from repo

### Public enrollment
- `/enroll` form: collects name, DOB, gender, WhatsApp, address, program type, Quran level, wali info
- Rate limited (3 submissions/hour/IP)
- Admin review at `/admin/enrollments`

### Performance and infrastructure
- Tailwind compiled CSS (no Play CDN in production)
- Plus Jakarta Sans self-hosted (no Google Fonts dependency)
- WAL mode with tuned autocheckpoint
- PM2 and systemd deploy configs included
- Nginx reverse proxy example config included

---

## [0.1.0] — 2025 (private)

Initial private deployment. Imported and adapted from
[mgilank/Quran-Tahfiz-Tracker](https://github.com/mgilank/Quran-Tahfiz-Tracker).
Added tilawah/murojaah logging, email system, leaderboard scoring, and
community features for internal use.
