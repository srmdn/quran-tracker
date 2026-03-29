# Decision Record: Login Brute-Force Protection

- Date: 2026-03-29
- Status: Implemented
- Owner: srmdn
- Related Issue/PR: Security Audit 2026-03-29

## Context

The email/password login endpoint (`POST /auth/email/login` in `src/routes/auth.ts`) has no
rate limiting. An attacker can make unlimited login attempts against any account without any
throttling or lockout.

The enrollment form (`POST /enroll`) does have rate limiting (3 attempts/hour/IP via the
in-memory `consumeRateLimit` in `src/lib/rate-limit.ts`), but this was never applied to the
login route.

The app uses Bun's `password.verify` (bcrypt) which is inherently slow, providing some
protection, but no automated lockout or account-based throttling exists.

## Decision

Add rate limiting to `POST /auth/email/login` using the existing `consumeRateLimit` helper.
Rate limit by IP address (same approach as enrollment): 10 attempts per 15 minutes per IP.

IP is extracted from `cf-connecting-ip` (Cloudflare header, trusted since traffic comes through
Cloudflare) with fallback to `x-forwarded-for`.

Return a generic "Too many login attempts" error message on rate limit hit. Do not reveal
remaining attempts.

## Rationale

- Bcrypt slowness is not sufficient protection alone; volume attacks at scale still work.
- The existing `consumeRateLimit` helper is already in use and sufficient for this case.
- 10/15min is permissive enough for legitimate use (a user who misremembers their password)
  while blocking automated attacks.
- Account-level lockout (lockout per email) was considered but rejected: it enables
  targeted denial-of-service against specific users. IP-based limiting is preferred.

## Consequences

- Positive: Automated credential stuffing and brute force attacks are rate-limited.
- Positive: Uses existing infrastructure, no new dependencies.
- Negative: IP-based limiting can affect users behind shared NAT (e.g., a school network).
  Accepted given this is a small internal community (max ~50 users).
- Negative: In-memory rate limiter resets on service restart. Accepted for now; the restart
  window is short and this service rarely restarts.

## Risk Tier

Tier 2 (High): Change to authentication handling. Must be tested end-to-end: valid login still
works, excess attempts are correctly blocked with the right error message.

## Follow-up Actions

- [x] Write decision record
- [x] Add rate limiting to `POST /auth/email/login` in `src/routes/auth.ts` — commit f104b59
- [x] Verified valid login still works after change
- [x] Rate limit logic confirmed (10/15min/IP via consumeRateLimit)
