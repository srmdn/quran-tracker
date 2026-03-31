# Quran Tracker

Log your daily Tilawah and Murojaah, visualize your year of activity, build streaks, and compete with your community on the monthly leaderboard.

![Quran Tracker](https://imgmu.id/f/c503a71.png)

## Features

- **Tilawah and Murojaah logging** — log by juz or pages (20 pages = 1 juz), with surah/ayah endpoint tracking and full history
- **Daily targets** — set a daily juz target; the app caps entries at your target and shows a progress bar
- **Streaks** — active and broken streaks tracked per user; milestone emails at 7, 30, and 100 days
- **Khatam tracking** — khatam events recorded with plausibility checks (must cross a 30-juz boundary, once per day)
- **Monthly leaderboard** — scored as Tilawah×10 + Murojaah×7 + Khatam×300; archived by month with podium cards
- **1-year activity graph** — GitHub-style rolling activity heatmap on the dashboard
- **Email system** — welcome, approval, khatam, streak milestones, overtaken alerts, daily reminders, monthly snapshots; all logged in the admin panel
- **Enrollment form** — public `/enroll` route for prospective members; submissions reviewed in the admin panel
- **Profile page** — display name, avatar, password change (email/password users)
- **Admin panel** — approve/reject/suspend members, manage roles, view email log with resend for failures
- **Bilingual** — English and Indonesian (i18n toggle)
- **Google OAuth + email/password** — two auth methods; new accounts require admin approval

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Hono](https://hono.dev) (JSX SSR) |
| Database | SQLite via `bun:sqlite` |
| Styling | TailwindCSS (compiled) |
| Auth | Google OAuth 2.0 + email/password |

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) v1.0+
- A Google Cloud project with OAuth 2.0 credentials
- An SMTP account for email (optional; app works without it)

### 1. Clone and install

```bash
git clone https://github.com/srmdn/quran-tracker.git
cd quran-tracker
bun install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APP_URL=http://localhost:3000
PORT=3000
APP_NAME=Qur'an Tracker
ORG_NAME=Your Organization

# SMTP (optional — emails are skipped if not configured)
SMTP_HOST=your-smtp-host.com
SMTP_PORT=465
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Your App <noreply@example.com>
SMTP_FROM_NAME=Your App
SMTP_REJECT_UNAUTHORIZED=true
```

Set the authorized redirect URI in your Google Cloud Console to:

```
http://localhost:3000/auth/google/callback
```

### 3. Run

```bash
# Development (hot reload)
bun run dev

# Production
bun run start
```

The app will be available at `http://localhost:3000`.

> **No build step required.** Bun executes TypeScript directly. `bun run start` is the production command.

## Deploying to Production

### Environment variables for production

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APP_URL=https://your-domain.com
PORT=3000
NODE_ENV=production
APP_NAME=Qur'an Tracker
ORG_NAME=Your Organization
SMTP_HOST=your-smtp-host.com
SMTP_PORT=465
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=Your App <noreply@example.com>
SMTP_FROM_NAME=Your App
SMTP_REJECT_UNAUTHORIZED=true
```

Update the authorized redirect URI in Google Cloud Console to match your domain:

```
https://your-domain.com/auth/google/callback
```

### PM2 (Linux VPS)

Use the included `ecosystem.config.cjs` to avoid Bun/PM2 compatibility issues:

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Common PM2 commands:

```bash
pm2 status          # Check running processes
pm2 logs ngaji      # Tail logs
pm2 restart ngaji   # Restart
pm2 stop ngaji      # Stop
```

### Nginx (reverse proxy)

A sample config is provided in `nginx.conf.example`. Copy and adapt it:

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/quran-tracker
# Edit: replace your-domain.com, adjust PORT if needed
sudo ln -s /etc/nginx/sites-available/quran-tracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Docker

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
EXPOSE 3000
CMD ["bun", "run", "start"]
```

```bash
docker build -t quran-tracker .
docker run -d -p 3000:3000 --env-file .env -v $(pwd)/data:/app/data quran-tracker
```

> Mount the `data/` directory as a volume so the SQLite database persists across container restarts.

### Scheduled jobs

```bash
# Daily reminder emails (run via cron or systemd timer at your preferred time)
bun run src/jobs/daily-reminder.ts

# Monthly snapshot + email (run on the 1st of each month)
bun run snapshot:monthly

# Optional: override the month
SNAPSHOT_YEAR=2026 SNAPSHOT_MONTH=1 bun run snapshot:monthly
```

## User Roles

| Role | Description |
|---|---|
| `pending` | Newly registered; can only see the waiting page until approved |
| `member` | Approved community member; can log and view the leaderboard |
| `santri` | Active student in a formal program; same access as member |
| `alumni` | Former student; same access as member |
| `asatidz` | Teacher/ustadz; same access as member |
| `admin` | Can approve/reject users and manage roles |
| `super_admin` | Full access: suspend/unsuspend, delete users, all admin actions |

The **first user** to sign in is automatically granted the `admin` role.

Suspended users (any role) are blocked from logging in and shown a suspension notice. Their data is preserved and the account can be reinstated at any time.

## Project Structure

```
src/
├── index.tsx              # Entry point, route mounting
├── types.ts               # Shared TypeScript types
├── config.ts              # App-wide constants from env
├── data/
│   └── quran-meta.ts      # Static: 114 surahs, 30 juz boundaries
├── db/
│   ├── connection.ts      # SQLite connection (WAL mode)
│   └── schema.ts          # Table definitions and initialization
├── lib/                   # Business logic and utilities
│   ├── streak.ts          # Streak calculation
│   ├── targets.ts         # Daily cap logic
│   ├── format-juz.ts      # Juz/pages display formatting
│   ├── i18n.ts            # EN/ID translations
│   ├── roles.ts           # Role constants and helpers
│   ├── rate-limit.ts      # IP-based rate limiting
│   ├── wib-date.ts        # WIB (UTC+7) date helpers
│   ├── email-log.ts       # sendTrackedEmail wrapper
│   ├── smtp.ts            # Raw SMTP client (TLS, port 465)
│   └── *-email.ts         # Per-type email senders
├── middleware/
│   └── auth.ts            # authMiddleware, memberMiddleware, adminMiddleware
├── routes/                # Hono route handlers
│   ├── auth.ts            # Google OAuth + email/password login
│   ├── dashboard.tsx      # Personal stats and activity graph
│   ├── tilawah.tsx        # Tilawah logging and history
│   ├── murojaah.tsx       # Murojaah logging and history
│   ├── activity.tsx       # Monthly leaderboard (authenticated)
│   ├── landing.tsx        # Public landing page
│   ├── enroll.tsx         # Public enrollment form
│   ├── profile.tsx        # Profile and settings
│   ├── setup.tsx          # Daily target setup
│   └── admin.tsx          # Admin panel
└── views/
    ├── components/        # Shared UI components
    └── pages/             # Full page JSX components
data/
└── ngaji.db               # SQLite database (auto-created on first run)
```

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Accounts: auth method, role, avatar, `suspended_at` |
| `sessions` | Session tokens with 7-day TTL |
| `tilawah_logs` | Daily tilawah entries: surah/ayah endpoint, juz amount, log unit |
| `murojaah_logs` | Daily murojaah entries: same fields + repetition count |
| `user_targets` | Daily juz targets per user |
| `user_streaks` | Current and longest streak per user |
| `khatam_events` | Khatam records (tilawah and murojaah), one per day per type |
| `monthly_leaderboard_snapshots` | Archived monthly rankings, insert-only |
| `email_log` | Every email send attempt: type, recipient, status, error |
| `enrollments` | Public enrollment form submissions |

## Attribution

This repository is a modified fork of the original project by **mgilank**:

- Original source: https://github.com/mgilank/Quran-Tahfiz-Tracker
- Fork: https://github.com/srmdn/quran-tracker

The original project tracks hafalan (memorization) progress surah by surah. This fork pivots to daily tilawah and murojaah logging with community leaderboard, streaks, and email notifications.
