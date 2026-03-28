# Risk Assessment Rubric

Classify changes using the highest applicable tier before implementing.

## Tier 0: Low Risk

Examples:
- UI/copy changes
- Non-user-facing internal tooling
- Read-only query changes with no auth impact

Controls:
- Basic testing
- PR description notes AI assistance if used

## Tier 1: Moderate Risk

Examples:
- New user-facing pages or features
- Changes to scoring, leaderboard, or stats logic
- Input validation additions

Controls:
- Test coverage for the changed logic
- Human review of AI-generated output
- Documented limitations where relevant

## Tier 2: High Risk

Examples:
- Changes to authentication or session handling
- Changes to authorization (role checks, data ownership)
- Features processing sensitive user data (emails, passwords)
- Anti-cheat mechanisms with score consequences

Controls:
- Decision record in `docs/decisions/` before implementing
- Explicit human review of security impact
- Test coverage for auth/authz paths

## Tier 3: Critical Risk

Examples:
- Changes that could expose all user data
- Password/token handling changes
- Admin privilege escalation paths

Controls:
- Decision record required
- Full manual audit of the change path
- Test before and after, verify in staging before production
