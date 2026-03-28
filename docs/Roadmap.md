# Quran Tracker: Improvement Roadmap

This document tracks planned improvements, organized by topic. Items are discussed and agreed before implementation.

**Status legend:** Discussed | In progress | Done | Deferred | Decision needed

---

## 1. User Input Limits

### 1.1 Daily cap tied to user target (planned)

**Current behavior:**
- Tilawah and murojaah have no daily total cap beyond the arbitrary 30 juz per-entry guard.
- Rate limit is 20 submissions per 60 seconds (abuse guard only).

**Proposed change:**
- Once a user's daily total reaches their target (set in `/setup`), block further submissions for that day.
- Target is self-set and can be updated anytime in `/setup` — so the cap is self-governed.
- Primary benefit: UX guard against accidental double-logging, not a strict anti-cheat measure.

**Rules:**
- Check: `todayTotal + newJuzAmount > target` on POST to `/tilawah` and `/murojaah`.
- If exceeded: reject with a clear error message ("You have reached your daily target").
- If user wants to log more: they must update their target in `/setup` first.

**Fields involved:**
- `getTodayTilawahTotal(userId, date)` — already exists
- `getTodayMurojaahTotal(userId, date)` — already exists
- `getUserTarget(userId)` — already exists

**Status:** Discussed, not yet implemented.

---

### 1.2 Repetition count upper bound (planned)

**Current behavior:**
- `repetition_count` only validates that it is a positive integer. No upper limit.

**Proposed change:**
- Add a reasonable upper bound (e.g., max 100 repetitions).

**Status:** Identified, not yet discussed in detail.

---

## 2. Dashboard Improvements

### 2.1 Quick-log shortcut buttons
- Add prominent "Log Tilawah" and "Log Murojaah" buttons directly on the dashboard.
- Saves navigation steps, especially on mobile.
- **Status:** Discussed, not yet implemented.

### 2.2 Target met state — visual feedback
- When today's target is met, show a clear "Done for today" badge or message alongside the green bar.
- Makes completion feel more satisfying and unambiguous.
- **Status:** Discussed, not yet implemented.

### 2.3 Heatmap month labels
- Add month name labels above the 90-day heatmap columns (GitHub-style).
- Currently the grid has no time orientation.
- **Status:** Discussed, not yet implemented.

### 2.4 Recent logs "see all" link
- The recent logs section shows 8 entries with no link to full history.
- Add a "See all" link to `/tilawah` and `/murojaah` history pages.
- **Status:** Discussed, not yet implemented.

### 2.5 Monthly score context: out of N users
- Stats row shows rank and score as raw numbers with no total user count.
- Show as "3 of 12" instead of just "#3" for more meaningful context.
- **Status:** Discussed, not yet implemented.

### 2.6 Longest streak as a stat
- Longest streak is currently a secondary note, only shown when it exceeds current streak.
- Promote it to a proper stat card in the stats row.
- **Status:** Discussed, not yet implemented.

---

## 3. Leaderboard Improvements

### 3.1 Month navigation for activity leaderboard
- `/activity/leaderboard` shows only the current month with no way to browse previous months.
- Historical snapshots exist in `monthly_leaderboard_snapshots` but have no UI.
- Add prev/next month navigation (or a month selector dropdown).
- **Status:** Discussed, not yet implemented.

### 3.2 Top 3 podium visual polish
- Current top 3 cards are flat, identical in style with only emoji medals to distinguish them.
- Improve to a proper elevated podium: 1st place raised, distinct borders/colors per rank.
- Reference: the old `/leaderboard` podium has a better visual hierarchy.
- **Status:** Discussed, not yet implemented.

### 3.3 Score formula — collapsible explanation
- The formula `Tilawah×10 + Murojaah×7 + Khatam×300` is shown as plain subtitle text.
- A small collapsible section or tooltip would be cleaner and more discoverable.
- **Status:** Discussed, not yet implemented.

### 3.4 "Your rank" sticky indicator
- If a user is ranked #15, they have to scroll to find themselves in the table.
- Add a sticky banner or "jump to my rank" link so users can quickly locate themselves.
- **Status:** Discussed, not yet implemented.

### 3.5 Old `/leaderboard` — keep for now
- The old hafalan-based leaderboard is hidden from nav but still accessible.
- Decision: keep it as-is for now. It will eventually move to the santri subdomain (section 6).
- **Status:** Decision made, no action needed yet.

---

## 4. Tilawah and Murojaah Page Improvements

> Most improvements apply to both pages. Murojaah-specific notes are marked.

### 4.1 Pre-populate surah from last log
- The surah dropdown always starts blank even when a last position is shown above the form.
- Pre-select `lastLog.end_surah` so users don't have to find it manually every day.
- **Note (murojaah):** Especially useful here since users often review the same section repeatedly.
- **Status:** Discussed, not yet implemented.

### 4.2 Ayah field — dynamic max hint
- The ayah input has no indication of how many ayahs the selected surah has.
- Show "max: N" dynamically when a surah is selected, to prevent invalid submissions before they happen.
- Requires a small JS snippet to read surah ayah counts from a data attribute.
- **Status:** Discussed, not yet implemented.

### 4.3 Form disabled when daily target is met
- Currently the form is fully open even after the user has met today's target.
- After implementing roadmap 1.1, visually disable or replace the form with a "You've reached your target for today" message.
- UX should match the backend rule.
- **Status:** Depends on 1.1, not yet implemented.

### 4.4 Delete button — clearer UI
- Delete is a small red text link, easy to miss or accidentally tap on mobile.
- Replace with a small trash icon button with slightly more visual weight.
- **Status:** Discussed, not yet implemented.

### 4.5 Log history — show submission time
- Log rows show `date_wib` only. Multiple entries on the same day look identical.
- Show `created_at` time alongside the date so entries are distinguishable.
- **Note (murojaah):** More important here since users legitimately log the same section multiple times.
- **Status:** Discussed, not yet implemented.

### 4.6 Monthly summary in stats column
- Stats column shows all-time totals only.
- Add a "this month" stat card for a more motivating near-term view, consistent with leaderboard scoring.
- **Status:** Discussed, not yet implemented.

### 4.7 Repetition count — helper text (murojaah only)
- The repetition count field has no explanation. New users may not understand what it means.
- Add a small helper text: "how many times you reviewed this section in one session".
- **Status:** Discussed, not yet implemented.

### 4.8 Repetition count — consider future scoring (murojaah only)
- Currently repetition count is decorative — it does not affect leaderboard score.
- Score is `murojaah_juz × 7` only.
- Decision deferred: should repetition count influence scoring in future? If yes, anti-cheat on this field becomes more critical.
- **Status:** Open question, no action yet.

---

## 5. Tilawah Anti-Cheat

### 5.1 Khatam requires cumulative juz to be plausible
- Currently juz amount and ending position are independent — a user can log 0.1 juz but set end position to An-Nas 114:6 and receive a khatam + 300 leaderboard points.
- Fix: only record a khatam event if the user's cumulative tilawah total (all-time juz mod 30) is within a reasonable threshold of 30 (e.g., >= 25 juz into the current cycle).
- **Status:** Discussed, not yet implemented.

### 5.2 Daily cap tied to target (see roadmap 1.1)
- Limits how much a user can log per day without updating their target.
- Already covers the most basic inflation vector.
- **Status:** Tracked under section 1.1.

### 5.3 Position continuity — soft warning
- No check that today's claimed position is plausible relative to the last log.
- Hard block is too strict (users miss logging days legitimately).
- Implement a soft warning: "Your last position was Juz X — you're now claiming Juz Y. Continue?" shown client-side before submit.
- **Status:** Discussed, not yet implemented.

---

## 6. Murojaah Anti-Cheat

### 6.1 Murojaah is inherently repetitive — position continuity does NOT apply
- Unlike tilawah, reviewing the same juz or surah repeatedly on consecutive days is expected and valid.
- No soft position continuity warning needed here.
- **Status:** Decision made, no action needed.

### 6.2 Daily cap (see roadmap 1.1)
- The main guard against daily juz inflation.
- Same as tilawah — once implemented, covers the core vector.
- **Status:** Tracked under section 1.1.

### 6.3 Repetition count upper bound (see roadmap 1.2)
- No upper limit currently. Should be capped at a reasonable value (e.g., max 10 or 20 per session).
- More important if repetition count ever influences scoring (see 4.8).
- **Status:** Tracked under section 1.2, limit value to be decided.

### 6.4 Juz amount vs. position independence
- Same gap as tilawah: juz amount and ending position are independent fields.
- For murojaah there is no khatam equivalent, so the score impact is limited to `juz_amount × 7`.
- Lower priority than tilawah 5.1 but worth noting.
- **Status:** Identified, low priority.

---

## 7. Admin Page Improvements

### 7.1 Edit user — move to dedicated page
- Currently edit form appears inline on `/admin?edit=ID`, pushing the page down and losing scroll position.
- Move to `/admin/members/:id/edit` as a dedicated page, consistent with the existing member detail page.
- **Status:** Done — `/admin/members/:id/edit` page created; inline edit removed from admin list; Edit button added to member detail page; success redirects to detail page, errors stay on edit page.

### 7.2 Create user — field length limits
- Name and email inputs have no `maxlength` attribute and no server-side length validation.
- Add reasonable limits (e.g., name max 100 chars, email max 254 chars).
- **Status:** Done — `maxlength` added to name (100) and email (254) inputs.

### 7.3 "Make Admin" — add confirmation step
- Clicking "Make Admin" immediately promotes a member and sends a role change email with no confirmation.
- Add a confirmation dialog before executing the role change.
- **Status:** Done — confirmation dialog added via `onsubmit`.

### 7.4 "Remove" — replace native confirm() dialog
- Delete confirmation uses a browser `confirm()` dialog, inconsistent with the rest of the app UI.
- Replace with an inline confirmation or a styled modal.
- **Status:** Done — inline two-step confirmation: Remove → "Sure? [Delete] [Cancel]".

### 7.5 Members list — pagination
- All members load at once with no pagination.
- Fine now, but will degrade as the community grows. Add pagination or at minimum a search/filter.
- **Status:** Done — client-side pagination (20 per page) with Prev/Next controls.

### 7.6 Members list — show joined date
- List shows name, email, and role only. No joined date visible.
- Add `created_at` (joined date) to each row for better context when reviewing members.
- **Status:** Done — joined date shown below email in each member row.

### 7.7 Members list — search and filter by role
- No way to search by name or filter by role in the members list.
- The leaderboard has this — the admin page should too.
- **Status:** Done — client-side search (name/email) and role filter dropdown added.

### 7.8 Pending approval — show registration date and auth method
- Pending user rows show only name and email.
- Add registration date and how they signed up (Google or email/password) to help verify legitimacy.
- **Status:** Done — registration date and auth method (Google / Email/Password) shown below email.

### 7.9 Bug: delete failure messages use ?success= param
- `"Cannot delete a super admin account."` and `"User not found."` are passed as `?success=` query params instead of `?error=`.
- Fix to use `?error=` so they render with the correct styling.
- **Status:** Done — all three delete failure redirects fixed to use `?error=`.

### 7.10 Suspend user (new feature)
- Admin can suspend a user without deleting them or their data.
- Suspended users cannot log in or submit data, but their history is preserved.
- Requires a new `suspended` role or a `suspended_at` flag on the `users` table.
- Admin can unsuspend at any time.
- Useful for handling cheating cases or inactive accounts without permanent deletion.
- **Status:** Done — `suspended_at` column on users table; super_admin can suspend/unsuspend non-admin members; suspended users see a /suspended page; suspended badge + filter in admin panel.

---

## 8. Profile Page (new feature)

There is currently no profile page. The desktop dropdown only has a logout button.

### 8.1 Create /profile route and page
- New page at `/profile` accessible to all authenticated members.
- Link it from the desktop dropdown and mobile menu (replace the bare logout with a proper user menu).
- **Status:** Discussed, not yet implemented.

### 8.2 Display name — editable for all users
- All users (Google and email/password) can update their display name.
- Simple `POST /profile/name` endpoint, updates `users.name`.
- **Status:** Discussed, not yet implemented.

### 8.3 Password change — only for email/password users
- Only shown if `user.password_hash` is set (manually created accounts).
- Google OAuth users have no password — show "Signed in with Google" badge instead.
- **Status:** Discussed, not yet implemented.

### 8.4 Auth method indicator
- Show a read-only badge: "Google" or "Email/Password" so users know how their account is authenticated.
- **Status:** Discussed, not yet implemented.

### 8.5 Account info — read-only fields
- Email: read-only, tied to auth, cannot be changed by user.
- Role: read-only display.
- Joined date: read-only display.
- **Status:** Discussed, not yet implemented.

### 8.6 Avatar — why it's not showing for some users
- The header already renders `avatar_url` correctly via `background-image`.
- Avatar is `null` for manually-created users (no Google login) — fallback to initials is working as intended.
- Google OAuth users get avatar synced on every login automatically.
- Fix: allow users with no `avatar_url` to set a custom avatar URL on the profile page (link to any image URL, e.g. Gravatar). No file upload needed.
- **Status:** Discussed, not yet implemented.

---

## 9. Landing Page Improvements

Overall the landing page is well built. Only minor items below.

### 9.1 Leaderboard — clarify partial month context
- The "live data" badge exists but doesn't communicate that data is a partial month in progress.
- Add a small "as of today" note or similar next to the month label.
- **Status:** Done — subtitle now reads "Monthly rankings · March 2026 · as of 28 Mar".

### 9.2 Leaderboard — increase row limit or add "view full" link
- Currently capped at top 10 (`perPage: 10`).
- Visitors may not find their ustaz or friend in the list.
- Either increase to 20 or add a "View full leaderboard" link (points to `/activity/leaderboard`, requires login).
- **Status:** Done — increased to 20 rows + "View full leaderboard" link added.

### 9.3 Stats — label as all-time
- The three stat cards (members, tilawah juz, murojaah juz) are all-time totals but have no "all time" label.
- A visitor could mistake them for monthly figures.
- **Status:** Done — labels already read "Juz Tilawah (all-time)" / "(total)" in ID. No change needed.

### 9.4 Add "about the program" section
- The page explains what the tracker does but nothing about Markaz Talaqqi itself or the 2-year program.
- Low priority if the landing is primarily for existing community members, but worth adding for outsiders.
- **Status:** Discussed, low priority, not yet implemented.

### 9.5 "Join note" text is duplicated
- `landingJoinNote` i18n key is used in both the hero section and the CTA banner.
- Minor — consider using slightly different wording for each instance.
- **Status:** Done — CTA banner now uses separate `landingCtaJoinNote` key with distinct wording.

---

## 10. Setup Page Improvements

### 10.1 "juz/hari" label hardcoded in Indonesian
- The unit suffix inside the input field says "juz/hari" regardless of language setting.
- Should use an i18n key so it renders correctly in English ("juz/day") and Indonesian ("juz/hari").
- **Status:** Done — replaced with `juzPerDay` i18n key.

### 10.2 Add example target hint for new users
- No guidance on what a reasonable starting target looks like.
- Add a small hint below the field: e.g. "Most santri start with 1-2 juz/day".
- **Status:** Done — hint text added below both target inputs.

---

## 11. Activity Page

### 11.1 Deprecate legacy logging page
- **Decision:** Remove. Redirect `/activity` to `/tilawah`.
- `ActivityPage.tsx` deleted. POST handlers for `/activity/tilawah` and `/activity/murojaah` removed.
- `/activity/leaderboard` kept — it is the main authenticated leaderboard.
- **Status:** Done.

---

## 12. Login Page Improvements

### 12.1 Add link back to landing page
- No way back to `/landing` from the login page.
- Users who aren't members yet have no way to learn about the program.
- Add a simple "← Back to home" link.
- **Status:** Done — link added below the login card.

### 12.2 New member note — add contact guidance
- The "new member" note informs users that registration requires admin approval but gives no next step.
- Add a contact hint: who to reach out to and how (e.g. WhatsApp, email).
- **Status:** Done — `newMemberNote` updated to include "Contact your ustadz to register."

---

## 13. Pending Page Improvements

### 13.1 Add contact guidance
- Page shows name, email, status, and a sign out button — nothing else.
- User has no idea what to do while waiting or who to contact.
- Add a contact hint (WhatsApp or email of the admin/ustaz).
- **Status:** Done — contact guidance box added below status card.

### 13.2 Add expected wait time note
- No indication of how long approval typically takes.
- A simple line like "Approval is usually done within 1-2 days" sets expectations.
- **Status:** Done — wait time note added inside the guidance box.

---

## 14. Admin Member Detail Page Improvements

### 14.1 Log history — add pagination
- Capped at last 30 entries with no pagination.
- For active members this will quickly become insufficient.
- **Status:** Done — limit raised to 100; client-side pagination at 20 per page added.

### 14.2 Stats row — missing murojaah all-time juz
- Stats row shows tilawah all-time juz but not murojaah all-time juz.
- **Status:** Done — Murojaah all-time card added; grid expanded to 6 columns.

### 14.3 Quick action buttons from detail page
- Admin has to navigate back to the member list to edit or suspend a user.
- Add Edit and Suspend buttons directly on the member detail page.
- Depends on admin edit page move (roadmap 7.1) and suspend feature (roadmap 7.10).
- **Status:** Done — Edit link and Suspend/Unsuspend button in top action bar; suspended banner on member header.

### 14.4 Khatam history
- Only a khatam count is shown, not when each khatam occurred.
- Show a small list of khatam dates from `khatam_events` for full context.
- **Status:** Done — khatam history section with type badge and date chips, shown above activity log.

---

## 15. App Security

Governance baseline applied (2026-03-28): `SECURITY.md`, `GOVERNANCE.md`, `docs/risk-assessment-rubric.md`, `docs/incident-response.md`, `docs/decisions/` template, attribution check scripts.

Security findings to be scoped in a dedicated session. Each finding must be classified with the risk rubric before implementation. Tier 2+ items require a decision record in `docs/decisions/`.

**Status:** Governance baseline done. Security audit pending.

---

## 16. Enrollment Form (quran.markaztalaqqi.com)

**Scope:** Option A — collect data and display in admin panel. Status workflow can come later.

**Form fields (agreed):**
- Full name
- Date of birth
- Gender
- WhatsApp number
- Address
- Program type
- Current Quran level
- Wali (guardian) info
- Motivation / notes

**Technical plan:**
- Public route: `GET/POST /enroll`
- New table: `enrollments` in SQLite
- Admin panel: `GET /admin/enrollments` — list and view submissions
- No auth required for submission (public form)
- Rate limiting on `POST /enroll` to prevent spam

**Status:** Discussed, design agreed, not yet started.

---

## 17. Santri Subdomain (santri.markaztalaqqi.com)

- Separate subdomain for memorization (hafalan) tracking
- Specific to santri (students) in the 2-year program
- Linked to enrollment data from item 3 above

**Status:** Planned (notes.md item #2), not yet scoped in detail.

---

## 19. Email System

### What currently exists

**Infrastructure:**
- Custom TLS SMTP client (`src/lib/smtp.ts`) — no external library, connects on port 465.
- Config via `.env`: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_FROM_NAME`.

**Automated jobs (systemd timers):**
- `quran-daily-reminder.timer` — fires 20:00 WIB daily (`src/jobs/daily-reminder.ts`).
- `quran-monthly-snapshot.timer` — fires 1st of month 08:00 WIB (`src/jobs/monthly-snapshot.ts`).

**Email types and wiring status (verified by code audit 2026-03-28):**

| # | Type | File | Wired? | Trigger |
|---|---|---|---|---|
| 1 | Daily reminder | `reminder-email.ts` | Yes (systemd job) | Timer, skips users who met both targets |
| 2 | Monthly snapshot | `monthly-email.ts` | Yes (systemd job + admin button) | Timer or manual admin panel |
| 3 | Welcome (new member) | `welcome-email.ts` | Yes | Google OAuth callback only (`isNew`) |
| 4 | Admin new-member alert | `welcome-email.ts` | Yes | Google OAuth callback only (`isNew`) |
| 5 | Approval | `welcome-email.ts` | Yes | Admin `POST /admin/users/:id/approve` |
| 6 | Rejection | `welcome-email.ts` | Yes | Admin `POST /admin/users/:id/reject` |
| 7 | Role change | `welcome-email.ts` | Yes | Admin role update and edit endpoints |
| 8 | Khatam | `milestone-email.ts` | Yes | `POST /tilawah` when endSurah=114 endAyah=6 |
| 9 | Streak milestone | `milestone-email.ts` | Yes | `POST /tilawah` and `POST /murojaah` after streak update |

**Known gaps identified:**

- **Welcome + admin alert not sent for manual (email/password) registrations** — `sendWelcomeEmail` and `sendNewMemberAlertToAdmins` are only called in the Google OAuth callback. Manual user creation by admin (`POST /admin/users/create`) sends no notification to the created user.
- **No suspended/unsuspended email** — users are not notified when their account is suspended or unsuspended.
- **No email opt-out** — users cannot unsubscribe from any email type.
- **No email log** — no record of what was sent, when, and whether it succeeded or failed.
- **Admin panel test coverage incomplete** — only 2 of 9 email types have test buttons (daily reminder, monthly snapshot). Approval/khatam/streak/role-change have no test send.
- **Daily reminder time is fixed** — 20:00 WIB for everyone, not per-user configurable.
- **Murojaah khatam detection missing** — `POST /murojaah` does not insert into `khatam_events` and does not fire `sendKhatamEmail`. Murojaah reaching An-Nas is silently ignored.

---

### 19.1 Email log table

Add an `email_log` table to record every email send attempt.

**Schema:**
```sql
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
```

**Scope:**
- All `sendSmtpMail` calls are fire-and-forget. The log should be written after each attempt (success or failure) inside the individual send functions or in a wrapper.
- Admin panel: `GET /admin/email-log` — table view with type, recipient, status, date. Paginated. Filterable by status and type.
- The log does not need to store email body content.

**Status:** Discussed, not yet started.

---

### 19.2 Fix: welcome email + admin alert for manual registrations

When admin creates a user via `POST /admin/users/create`, if the created user has an email address:
- Send them a welcome/registration confirmation email.
- Send the new-member alert to all other admins.

Currently this only fires for Google OAuth sign-ups.

**Status:** Discussed, not yet started.

---

### 19.3 Fix: suspended/unsuspended email notifications

When a super_admin suspends or unsuspends a member, send them a brief notification email.
- Suspension email: account has been suspended, contact admin.
- Unsuspension email: account has been reinstated, link to app.

**Status:** Discussed, not yet started.

---

### 19.4 Fix: murojaah khatam detection

`POST /murojaah` currently does not check for khatam (endSurah=114, endAyah=6). It should:
- Insert a row into `khatam_events` with `type = 'murojaah'` when An-Nas is reached.
- Fire `sendKhatamEmail` with the updated murojaah khatam count.
- Mirror the same pattern already used in `POST /tilawah`.

**Status:** Discussed, not yet started.

---

### 19.5 Admin panel: more email test buttons

Add test send buttons for: Approval, Khatam (#1), Streak milestone (7 days).
These cover the most important transactional emails that currently have no test path from the UI.

**Status:** Discussed, not yet started.

---

## 18. Open Source Preparation

- Strip internal/operational references from code and docs
- Sanitize `.env.example`
- Write a public-facing README

**Status:** Planned (notes.md item #4), deferred.
