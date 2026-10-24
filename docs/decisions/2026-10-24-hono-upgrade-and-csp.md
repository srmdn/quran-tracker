# Decision Record: Hono upgrade and CSP hardening

- Date: 2026-10-24
- Status: Proposed
- Owner: srmdn
- Related Issue/PR: Internal security audit, 2026-10-24

## Context

The application pins Hono 4.12.18. The current release is 4.13.13 and clears the
runtime advisories reported by `bun audit`, including issues in JSX escaping,
`serveStatic`, `parseBody`, query parsing, cookie handling, and CORS. The app does
not use every affected API, but the version gap is a maintenance and defense in
depth risk.

The current Content Security Policy requires `'unsafe-inline'` because pages use
inline scripts. Removing inline scripts and adopting a nonce or hash is a larger
change and should not be combined with the dependency upgrade.

## Decision

Upgrade Hono to 4.13.13 in a dedicated security release. Update the lockfile,
run typecheck, unit tests, and the route smoke suite, and add the runtime audit
gate to CI in the same change. Keep the current CSP structure for this release.
Plan a separate change to move inline scripts to external files and adopt a
nonce or hash based CSP.

## Rationale

The upgrade is low-risk and independently verifiable. Bundling it with redesign
markup would make regressions harder to attribute. The CSP change needs a
template-wide refactor and should be reviewed on its own.

## Consequences

Positive: current framework security fixes, a repeatable audit gate, and a
smaller future CSP change.

Negative: the lockfile changes, and the dev-only Tailwind and PostCSS findings
remain until that toolchain is updated. The current CSP still allows inline
scripts.

Operational: deploy as a code-only release, with no CSS or markup changes.
Verify public, member, and admin routes plus one log write.

## Risk Tier

Tier 2. Requires a decision record, explicit human review, and tests for the
affected rendering and request paths.

## Follow-up Actions

- [ ] Upgrade `hono` to 4.13.13 and update `bun.lock`.
- [ ] Add `bun run audit:runtime` to CI and make it required.
- [ ] Run typecheck, tests, and the route smoke suite.
- [ ] Verify public, member, and admin routes plus one log write.
- [ ] Plan the CSP nonce or hash change separately.
- [ ] Review the dev-only Tailwind and PostCSS findings separately.
