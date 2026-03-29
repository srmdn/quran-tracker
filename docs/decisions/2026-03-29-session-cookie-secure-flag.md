# Decision Record: Session Cookie Secure Flag

- Date: 2026-03-29
- Status: Implemented
- Owner: srmdn
- Related Issue/PR: Security Audit 2026-03-29

## Context

Session cookies in `src/routes/auth.ts` (email login line 59, Google OAuth line 127) set the
`secure` flag conditionally: `secure: process.env.NODE_ENV === "production"`.

The `.env` file does not set `NODE_ENV`, so `process.env.NODE_ENV` is `undefined` in production.
This means `secure` evaluates to `false` on the live deployment. Session cookies are set without
the Secure flag.

The Secure flag instructs browsers to only send the cookie over HTTPS connections. Without it,
a browser could transmit the session cookie over HTTP if a downgrade occurs. Cloudflare enforces
HTTPS at the edge, but the flag is a defense-in-depth measure independent of the CDN.

## Decision

Fix by setting `secure: true` unconditionally in both `setCookie` calls in `src/routes/auth.ts`.
Remove the `NODE_ENV` check entirely. If HTTP-only local development is ever needed, it can be
added as an explicit dev override, not the default.

Also add `NODE_ENV=production` to the `.env` file to make the environment explicit.

## Rationale

- The app only runs in one environment (production). There is no staging instance of this service.
- Conditional `secure` based on `NODE_ENV` is fragile; an unset env var silently disables
  security controls.
- Setting `secure: true` unconditionally has no downside since the app is always behind HTTPS.

## Consequences

- Positive: Session cookies have the Secure flag set in all cases.
- Positive: Defense-in-depth against HTTPS downgrade scenarios.
- Negative: None. Local development over plain HTTP is not used for this service.

## Risk Tier

Tier 2 (High): Changes to session cookie handling. Fix is a one-line change per setCookie call,
but must be verified in production to confirm sessions still work post-deploy.

## Follow-up Actions

- [x] Write decision record
- [x] Fix `secure` flag in `src/routes/auth.ts` (both setCookie calls) — commit f104b59
- [x] Add `NODE_ENV=production` to `.env`
- [x] Restart service and verified login still works
