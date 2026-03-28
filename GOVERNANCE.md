# Governance

## Purpose

Define how this project makes decisions and maintains accountability for changes and AI-related risk.

## Roles

- **Maintainer (srmdn):** merges code, enforces policy, manages releases, coordinates security incidents.
- **Contributors:** propose changes via issues or pull requests.

## Decision Model

- Routine changes: maintainer review and merge.
- Security fixes and breaking changes: maintainer documents rationale in a decision record before merging.
- Governance changes: documented in `docs/decisions/` with reasoning.

## Escalation

Write a decision record in `docs/decisions/` when:
- An AI feature is classified as Tier 2 or higher (see `docs/risk-assessment-rubric.md`)
- A security fix changes authentication, authorization, or data handling
- A breaking change affects the public-facing interface

## Transparency

Significant governance decisions are summarized in `CHANGELOG.md` or commit messages.
