# Decision Record: Session and password lifecycle

- Date: 2026-10-24
- Status: Proposed
- Owner: srmdn
- Related Issue/PR: Internal security audit, 2026-10-24

## Context

Session expiry is stored as an ISO timestamp with a `T` separator, while SQLite
`datetime('now')` returns a space-separated timestamp. The comparison is a string
comparison, so a session expiring on the current date remains valid until the end
of that day. The same comparison is used when cleaning expired sessions.

Password changes and administrator password resets update the password hash but do
not revoke existing sessions. If an account is compromised, the attacker's
session survives the reset. Authenticated HTML also lacks a no-store cache
directive, so browser history may show member data after logout.

## Decision

Store session expiry in a format that compares correctly with SQLite datetime
values, or compare both sides with `strftime`. Add boundary tests at 23:59 and
00:01. Delete all other sessions when a password is changed or reset, and add a
"sign out all devices" action. Send `Cache-Control: no-store` on authenticated
HTML. Add `Secure` to the OAuth state cookie. A full password reset flow with
single-use tokens is deferred to the system phase.

## Rationale

The current behavior extends sessions by up to a day and leaves compromised
sessions alive after a password reset. Fixing the storage format and revocation
is small, testable, and independent of the redesign. A password reset feature
needs email token design and belongs with the account lifecycle work.

## Consequences

Positive: predictable session lifetime, effective password reset, and less
private data in browser history.

Negative: changing the expiry format may clear existing sessions, so users may
need to sign in again after deployment. Revoking all sessions on password change
may surprise users with multiple devices.

Operational: announce the re-login if sessions are cleared. Test OAuth, email
login, logout, password change, and admin reset. Keep a pre-deploy database
snapshot.

## Risk Tier

Tier 2. Requires a decision record, explicit human review of the security
impact, and tests for session and password paths.

## Follow-up Actions

- [ ] Normalize session expiry storage and comparison.
- [ ] Add boundary tests for expiry and cleanup.
- [ ] Revoke other sessions on password change and admin reset.
- [ ] Add a sign-out-all action.
- [ ] Add no-store to authenticated responses.
- [ ] Add Secure to the OAuth state cookie.
- [ ] Verify login, OAuth, logout, and password flows.
