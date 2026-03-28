# AI Policy

## Scope

Applies to:
- AI features shipped by this project
- AI-assisted development workflows used by contributors

## Core Principles

- Human accountability: humans remain responsible for shipped outcomes.
- Transparency: disclose material AI usage in PRs and docs.
- Safety by design: evaluate risks before release.
- Privacy and security: minimize data exposure to third-party providers.
- Auditability: keep records for significant decisions and incidents.

## Minimum Requirements

1. Risk classification is required before shipping AI functionality.
2. High-risk changes require a decision record in `docs/decisions/`.
3. AI-generated code must be human-reviewed before committing.
4. User data (logs, emails, names) must not be pasted into external AI tools.
5. Incidents must be handled using `docs/incident-response.md`.

## Prohibited Practices

- Shipping unreviewed AI-generated code.
- Pasting real user data into AI tool prompts.
- AI co-author trailers or branding in commit history.
