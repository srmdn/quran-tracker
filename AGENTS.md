# AGENTS.md

Collaboration rules for AI tools working in this repository.

## Operating Rules

1. Humans own all final decisions and commits. Commit messages are human-authored: no AI branding or co-author trailers. Run `scripts/check-commit-attribution.sh` before push.
2. Keep changes small, traceable, and reversible. Stage only intended files.
3. No em dashes (`—`) in any written output: commit messages, docs, or code comments.
4. Repo is PUBLIC: no server IPs, internal paths, or infrastructure references in code, docs, or commits.
5. Security findings follow `docs/risk-assessment-rubric.md`; Tier 2+ requires a decision record in `docs/decisions/` before fixing.
6. Before every commit: `bunx tsc --noEmit` plus a `bun run dev` smoke test. No automated test suite yet; run `bun test` if one is added.

## Stack

- Bun (not Node): `bun:sqlite`, `Bun.serve()`. Bun auto-loads `.env`; no dotenv.
- Hono with JSX SSR. Use `hono/jsx` types (`FC`, `Child`), not React. Route files that render JSX must use a `.tsx` extension.
- SQLite at `data/ngaji.db` (gitignored, created on start). WAL + foreign keys. Prepared statements only; `.get()` returns `unknown`, always cast: `.get(...) as Type | null`.
- TailwindCSS v3 compiled from `src/input.css` (theme tokens in `tailwind.config.js`). Production runs under PM2 (`ecosystem.config.cjs`); no hot reload, restarts required.
- Email (SMTP) is optional and degrades gracefully when env vars are absent.

## Commands

```sh
bun install
bun run dev               # dev server (no hot reload)
bun run start             # production entrypoint
bun run build:css         # regenerate public/tailwind.css from src/input.css
bun run snapshot:monthly  # monthly leaderboard snapshot (SNAPSHOT_YEAR/SNAPSHOT_MONTH override)
bunx tsc --noEmit         # typecheck
```

Environment variables: see README.md and `.env.example`.

## Tailwind Artifact (intentional exception)

`public/tailwind.css` is generated but tracked in git. After changing Tailwind classes, markup, or `src/input.css`, run `bun run build:css` and include the artifact in the change. Never hand-edit it.

## Architecture

`src/index.tsx` initializes the DB, cleans expired sessions, mounts all routes, starts `Bun.serve()`. Middleware chain: `langMiddleware` (en/id) -> `authMiddleware` (session cookie resolves `User` into `c.get("user")`, typed via `Env` in `src/types.ts`) -> `memberMiddleware` (blocks pending/suspended) -> `targetMiddleware` (redirects to `/setup` without a target); `adminMiddleware` guards `/admin`. Routes render pages from `src/views/pages/` via `c.html(...)`.

Active data model: `tilawah_logs`, `murojaah_logs` (daily juz entries keyed by WIB date, optional start/end surah+ayah); `user_targets` (daily targets, also enforced as hard cap on log POSTs); `user_streaks` + `streak_freezes` (2 credits/month); `khatam_events` (log ends at An-Nas 114:6 + lifetime 30-juz cycle crossing + once per user/type/day); `monthly_leaderboard_snapshots` (trigger-locked); `email_log`; `enrollments`. `progress_entries`/`progress_log` are legacy with no active code path; dropping them is a pending decision.

Score = tilawah x 10 + murojaah x 7 + khatam x 300. The monthly leaderboard computes khatam as `floor(monthly tilawah / 30)` and does not read `khatam_events`; current month is live, past months come from snapshots. All day boundaries are WIB (`src/lib/wib-date.ts`); backdating is limited to 1 day, deletion within 7 days. Auth: Google OAuth + email/password; first Google signup becomes `super_admin`; new users start `pending`; sessions expire after 7 days.

## Key Files

| Concern | File |
|---|---|
| Entry point | `src/index.tsx` |
| DB connection + schema | `src/db/connection.ts`, `src/db/schema.ts` |
| Session + user upsert | `src/lib/session.ts` |
| Targets, streaks, scoring | `src/lib/targets.ts`, `src/lib/streak.ts`, `src/lib/activity-calc.ts` |
| WIB dates, i18n, Quran meta | `src/lib/wib-date.ts`, `src/lib/i18n.ts`, `src/data/quran-meta.ts` |
| Log + khatam detection | `src/routes/tilawah.tsx`, `src/routes/murojaah.tsx` |
| Leaderboard + snapshots | `src/routes/activity.tsx`, `src/lib/monthly-snapshot.ts` |
| Auth + middleware | `src/routes/auth.ts`, `src/middleware/auth.ts` |
| Shared types + `Env` | `src/types.ts` |

## Local State

- `.local/` (gitignored): agent/session state; continuity handoff at `.local/HANDOFF.md`.
- `local-state/` (gitignored): operational state (verification logs, DB backups, run assets).
- `data/` and `.env` are the app runtime paths. Do not relocate or track any of the four in git.
