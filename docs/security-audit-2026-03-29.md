# Security Audit: Quran Tracker

- Date: 2026-03-29
- Auditor: srmdn (assisted by Claude Code)
- Scope: Full source audit of `src/` directory
- Method: Static code review of all route handlers, middleware, session/auth logic, and DB queries

---

## Summary

| Finding | File | Tier | Status |
|---------|------|------|--------|
| Session cookie Secure flag not set | auth.ts:59,127 | 2 | Decision record written |
| No brute-force protection on login | auth.ts:34 | 2 | Decision record written |
| userId param not validated as integer (admin) | admin.tsx:57,67 | 1 | Fix inline |
| Error details exposed in redirect URLs | admin.tsx:283+ | 1 | Fix inline |
| Float coercion bypass in target setup | setup.tsx:25-26 | 1 | Fix inline |
| Session not invalidated on OAuth account binding | session.ts:61-68 | 1 | Accept (see note) |
| ACTIVE_MEMBER_ROLES string interpolation | dashboard.tsx:95-97 | 0 | Accept (hardcoded, safe) |
| No audit log for admin actions | admin.tsx | 0 | Defer |
| In-memory rate limiter unbounded growth | rate-limit.ts | 0 | Accept (small instance) |

---

## Tier 2 Findings

### 1. Session cookie Secure flag not set

**File**: `src/routes/auth.ts`, lines 59 and 127

**Issue**: `secure: process.env.NODE_ENV === "production"` — `NODE_ENV` is not set in `.env`,
so this evaluates to `false`. Session cookies are issued without the Secure flag in production.

**Impact**: Browsers may transmit the session cookie over HTTP in downgrade scenarios. Defense-
in-depth is missing even though Cloudflare enforces HTTPS at the edge.

**Fix**: Set `secure: true` unconditionally in both `setCookie` calls. Add `NODE_ENV=production`
to `.env` for operational clarity.

**Decision record**: `docs/decisions/2026-03-29-session-cookie-secure-flag.md`

---

### 2. No brute-force protection on email/password login

**File**: `src/routes/auth.ts`, `POST /auth/email/login`

**Issue**: No rate limiting on the login endpoint. Unlimited credential attempts allowed.
The enrollment form has rate limiting but login does not.

**Impact**: Automated credential stuffing and brute-force attacks against known emails.

**Fix**: Apply `consumeRateLimit` at 10 attempts per 15 minutes per `cf-connecting-ip`.

**Decision record**: `docs/decisions/2026-03-29-login-brute-force-protection.md`

---

## Tier 1 Findings

### 3. userId param not validated as integer in admin approve/reject

**File**: `src/routes/admin.tsx`, lines 57 and 67

**Issue**: `c.req.param("id")` is used directly as a query parameter without `parseInt()`.
Queries are parameterized (no SQL injection risk), but passing non-numeric strings (e.g., `"abc"`)
silently matches no rows rather than returning an explicit error.

**Fix**: Parse and validate: `const userId = parseInt(c.req.param("id"), 10); if (!Number.isFinite(userId)) return c.redirect(...)`.

---

### 4. Error details exposed in admin redirect URLs

**File**: `src/routes/admin.tsx`, lines 283-284, 300-302, and several others

**Issue**: Exception messages are appended to redirect URLs:
```typescript
return c.redirect(`/admin?error=Failed to send test reminder: ${err.message}`);
```
These appear in browser history, server access logs, and Cloudflare logs. SMTP errors may
expose internal infrastructure details (host names, ports, auth failure reasons).

**Fix**: Log the full error server-side (`console.error`). Show a generic message in the
redirect: e.g., `?error=Email+failed+to+send.+Check+server+logs.`

---

### 5. Float coercion in target setup

**File**: `src/routes/setup.tsx`, lines 25-26

**Issue**: `parseFloat("1.5abc")` returns `1.5` — a value with a trailing non-numeric string
passes the `Number.isFinite()` check. Users can set targets like `"0.5xyz"` which parse to
`0.5` without triggering validation.

**Fix**: Validate with a regex before parsing: `/^\d+(\.\d{1,2})?$/`.

---

### 6. Session not invalidated when OAuth binds to existing manual account

**File**: `src/lib/session.ts`, lines 61-68

**Issue**: When a user signs in with Google and their Google email matches an existing manual
account, the manual account is linked to the Google identity (`UPDATE users SET google_id = ?`).
Any existing sessions for that manual account remain valid and are not deleted.

**Impact**: If a manual account was created by an admin for a user who has not yet set their
password, and someone else controls that Google identity, they could take over the account.
In practice, admin-created accounts use email addresses belonging to the intended user, so
this scenario is unlikely. Accepted as low practical risk.

**Mitigation if desired**: Call `DELETE FROM sessions WHERE user_id = ?` on
`existingByEmail.id` before binding the Google identity.

---

## Tier 0 Findings (Accepted / Deferred)

### 7. ACTIVE_MEMBER_ROLES string interpolation

**File**: `src/routes/dashboard.tsx`, lines 95-97

**Issue**: Role values are interpolated into a SQL string. The values are from a hardcoded
TypeScript `const` (`ACTIVE_MEMBER_ROLES`), not user input. No SQL injection risk.
Flagged as a pattern concern only.

**Decision**: Accept. The values are fully controlled constants. No action needed.

---

### 8. No audit log for admin actions

**File**: `src/routes/admin.tsx`, all admin POST routes

**Issue**: Approve, reject, suspend, unsuspend, role changes, and delete are not logged with
who performed them or when. No forensic trail for unauthorized admin access.

**Decision**: Defer. The community is small and admin accounts are few. Not worth the schema
change at this time.

---

### 9. In-memory rate limiter has no entry expiry

**File**: `src/lib/rate-limit.ts`

**Issue**: The `buckets` Map grows indefinitely. Expired entries are only evicted when the
same key is re-used. On a busy server with many unique IPs, this leaks memory.

**Decision**: Accept for this deployment. The service handles a small community. Restarts
periodically reclaim memory. Add a periodic cleanup if memory growth becomes observable.

---

## Not Applicable

- **CSRF**: Session cookies use `SameSite=Lax`. This prevents cross-site POST requests from
  including the cookie in modern browsers, which is the primary CSRF attack vector. The app
  has no endpoints that accept cross-origin POSTs by design. CSRF tokens are not required.

- **SQL injection**: All queries use parameterized statements (`db.prepare(...).run(params)`).
  No raw string interpolation of user input occurs. The `ACTIVE_MEMBER_ROLES` interpolation
  (#7 above) uses hardcoded values only.

- **XSS**: JSX auto-escapes all values by default. No `dangerouslySetInnerHTML` usage found.
  Query parameters passed as JSX props (`success`, `error`) are safe through JSX rendering.

- **IDOR**: All data-fetching queries filter by `user.id` from the server-side session.
  No user-controlled ID parameters are used to fetch other users' private data outside admin
  routes, which are protected by `adminMiddleware`.

---

## Actions Required Before Closing Audit

- [x] Fix: Session cookie Secure flag (Tier 2) — `src/routes/auth.ts` (commit f104b59)
- [x] Fix: Login rate limiting (Tier 2) — `src/routes/auth.ts` (commit f104b59)
- [x] Fix: userId parseInt validation — `src/routes/admin.tsx` lines 57, 67 (commit f104b59)
- [x] Fix: Error message disclosure — `src/routes/admin.tsx` multiple locations (commit f104b59)
- [x] Fix: Float coercion in setup — `src/routes/setup.tsx` lines 25-26 (commit f104b59)
- [x] Fix: Session invalidation on OAuth binding — `src/lib/session.ts` (commit 8fa797e)
- [x] Update `quran-tracker.md` memory: task 15 marked complete

**Audit closed: 2026-03-29. All Tier 1 and Tier 2 findings resolved.**
