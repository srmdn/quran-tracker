# Decision Record: CSRF protection for state-changing requests

- Date: 2026-10-24
- Status: Proposed
- Owner: srmdn
- Related Issue/PR: Internal security audit, 2026-10-24

## Context

All state-changing routes are POST requests without CSRF tokens. The session
cookie uses `SameSite=Lax`, which blocks cookies on cross-site POSTs from
unrelated sites. However, same-site sibling hosts are treated as same-site by
the browser, so a compromised sibling host can submit authenticated POSTs to
this application. Administrative actions such as role changes, suspension, and
deletion are the highest-impact targets.

The application also needs to keep the Google OAuth callback working, which
relies on top-level navigation and is compatible with `SameSite=Lax`.

## Decision

Add a per-session CSRF token to every state-changing form and validate the
`Origin` and `Referer` headers on every POST as a second layer. Keep
`SameSite=Lax` for OAuth compatibility. Reject requests with a missing or
mismatched token, or with an untrusted origin, using a clear 403 response rather
than a redirect. Add tests for same-origin, cross-origin, same-site sibling, and
missing-token requests.

## Rationale

Tokens are required because `SameSite` does not separate sibling hosts on the
same registrable domain. Origin validation catches mistakes in form wiring and
adds protection for routes that may later accept JSON. Keeping `Lax` avoids
breaking the OAuth callback. A double-submit cookie is not preferred because the
application already has a server-side session store and can bind the token to
the session.

## Consequences

Positive: closes the same-site CSRF gap and makes destructive admin actions
explicitly authorized.

Negative: every form needs a hidden token, error handling changes, and cached
forms may fail after a session rotation.

Operational: deploy with the security release, verify login, OAuth, member log
creation, and admin actions. Document the 403 behavior for users who leave a form
open across a session change.

## Risk Tier

Tier 2. Requires a decision record, explicit human review of the security
impact, and tests for authentication and authorization paths.

## Follow-up Actions

- [ ] Add token generation and validation bound to the session.
- [ ] Add Origin and Referer validation for all POST routes.
- [ ] Add hidden tokens to every form.
- [ ] Add same-origin, cross-origin, same-site sibling, and missing-token tests.
- [ ] Verify OAuth login and all member and admin POST flows.
