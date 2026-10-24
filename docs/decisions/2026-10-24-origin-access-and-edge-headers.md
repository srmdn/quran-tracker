# Decision Record: Origin access and edge header policy

- Date: 2026-10-24
- Status: Proposed
- Owner: srmdn
- Related Issue/PR: Internal security audit, 2026-10-24

## Context

The application runs behind an edge proxy and CDN. The origin currently accepts
public traffic directly, and the application trusts a client-supplied forwarded
IP header for rate limiting. A direct client can rotate that header and defeat
login and enrollment limits, and can bypass edge filtering and caching rules.

The edge also replaces the origin security headers with a weaker policy. The
origin sends a strict CSP, `X-Frame-Options: DENY`, and a long HSTS lifetime.
The public response advertises `unsafe-eval`, broad script sources, and
`frame-ancestors 'self'`. The public policy is therefore weaker than the one the
application defines.

## Decision

Restrict origin HTTP and HTTPS access to the edge provider's address ranges, or
use authenticated origin pulls if the provider supports them. Keep an explicit,
minimal path for certificate validation. Only honor the forwarded client IP
header when the peer is a trusted edge address. Make the edge header policy
mirror the origin policy exactly, or remove the edge override so origin headers
pass through.

## Rationale

Rate limiting and edge protections are only meaningful if clients cannot reach
the origin directly. The application cannot safely distinguish a real edge
request from a direct request without a network trust boundary. Header
duplication at the edge creates a false sense of security because the effective
policy is the weaker one.

## Consequences

Positive: rate limits and edge filtering become effective, and the public
security policy matches the reviewed origin policy.

Negative: origin access changes need a maintenance window and a certificate
validation path. Edge address ranges can change and need periodic review.
Misconfiguration can take the site offline.

Operational: change the edge headers and origin access in separate steps. Verify
the origin and the public response with header inspection after each step. Keep
the previous edge rule text for rollback.

## Risk Tier

Tier 2. Requires a decision record, explicit human review, a maintenance window,
and a verified rollback path.

## Follow-up Actions

- [ ] Document the current origin access and header behavior.
- [ ] Restrict origin access to trusted edge ranges or authenticated pulls.
- [ ] Validate forwarded headers only from trusted peers.
- [ ] Mirror or remove the edge header override.
- [ ] Verify origin and public headers after each change.
- [ ] Record the rollback procedure for the edge rules.
