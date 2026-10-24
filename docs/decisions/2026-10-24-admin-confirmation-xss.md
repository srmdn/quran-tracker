# Decision Record: Admin confirmation XSS remediation

- Date: 2026-10-24
- Status: Proposed
- Owner: srmdn
- Related Issue/PR: Internal security audit, 2026-10-24

## Context

The admin member list builds inline `onsubmit` confirmation handlers by
interpolating a member-controlled display name into a JavaScript string. HTML
escaping protects the attribute but not the JavaScript context, because the
browser decodes character references before the event handler is compiled. A
crafted display name can therefore execute script in an administrator's
session when the administrator submits a row action for that member.

The session cookie is HttpOnly, but same-origin requests from the injected
script can still perform administrative actions, including creating another
administrator. This is an admin privilege escalation path.

## Decision

Remove all user-controlled values from inline JavaScript. Confirmation handlers
will read the display name from a `data-` attribute and use `addEventListener`,
or use a shared helper that reads `textContent`. Display names will be validated
at every write boundary: letters, spaces, apostrophes, hyphens, and dots are
allowed; CR, LF, and control characters are rejected; the existing 100-character
limit is enforced on the server. A regression test will cover the JavaScript
context, not only HTML escaping.

## Rationale

The root cause is the JavaScript context, so escaping the HTML attribute is not
sufficient. Moving user data out of inline handlers fixes the class of issue and
keeps the confirmation behavior. A stricter display-name policy adds defense in
depth without blocking normal names. A CSP nonce or hash is a useful later
control, but the current pages rely on inline scripts and should not be changed
in the same release.

## Consequences

Positive: removes the stored XSS path, makes admin confirmations testable, and
reduces the chance of a repeat in future admin screens.

Negative: the confirmation helper changes, some unusual display names may be
rejected, and a regression test must be maintained.

Operational: deploy as part of the security release, after a verified backup.
Do not publish exploit details until the fix is live.

## Risk Tier

Tier 3. Requires a decision record, explicit human review of the security
impact, a regression test, and verification in a staging environment before
production. Treat this as the first fix in the security release.

## Follow-up Actions

- [ ] Add the display-name validator and use it in profile and admin writes.
- [ ] Replace inline confirmation handlers with data attributes and listeners.
- [ ] Add a regression test for a name that escapes the JavaScript string.
- [ ] Verify the admin member list and all row actions at mobile and desktop widths.
- [ ] Deploy separately from the redesign.
- [ ] After deployment, document the fix in the changelog without a live payload.
