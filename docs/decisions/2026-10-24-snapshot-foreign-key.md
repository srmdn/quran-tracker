# Decision Record: Snapshot foreign key and member deletion

- Date: 2026-10-24
- Status: Proposed
- Owner: srmdn
- Related Issue/PR: Internal security audit, 2026-10-24

## Context

Monthly leaderboard snapshots reference `users(id)` without `ON DELETE`
behavior. Deleting a member who appears in any snapshot raises a foreign key
constraint and returns a server error. The snapshot already stores the member
name and role at the time of the snapshot, so the historical row does not need a
live user reference.

There is no soft-delete or anonymization path. Deleting a member currently
removes their logs and streak history, which may not be the desired policy for
community history.

## Decision

Rebuild the snapshot table with `ON DELETE SET NULL` and a nullable `user_id`,
preserving the name and role snapshot columns. In the security release, block
member deletion when snapshots exist and return a clear message. Perform the
table rebuild as the first schema change in the system phase, with a verified
backup and a decision record. Evaluate a soft-delete or anonymize option before
enabling hard deletion again.

## Rationale

Historical leaderboard rows should survive member deletion, and a server error is
not an acceptable admin experience. Splitting the fix lets the security release
avoid a schema migration while still removing the 500. The table rebuild needs a
migration runner and a restore plan.

## Consequences

Positive: member deletion no longer breaks the admin page, and historical
snapshots remain readable.

Negative: the schema change requires a table rebuild in SQLite and a short
maintenance window. Nullable user references require the leaderboard query to
continue using the snapshot name.

Operational: take a database snapshot before the rebuild, verify row counts, run
`PRAGMA foreign_key_check` and `PRAGMA integrity_check`, and keep the old table
until the new one is verified.

## Risk Tier

Tier 2. Requires a decision record, a verified backup, a migration plan, and
tests for deletion with and without snapshots.

## Follow-up Actions

- [ ] Block deletion with a clear message in the security release.
- [ ] Add a migration runner and schema version.
- [ ] Rebuild the snapshot table with `ON DELETE SET NULL`.
- [ ] Verify historical snapshots and leaderboard queries.
- [ ] Decide on soft delete or anonymization before re-enabling hard deletion.
