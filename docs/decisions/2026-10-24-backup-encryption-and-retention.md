# Decision Record: Backup encryption and retention

- Date: 2026-10-24
- Status: Proposed
- Owner: srmdn
- Related Issue/PR: Internal security audit, 2026-10-24

## Context

The daily backup archive contains the application environment file with OAuth
and SMTP secrets, the SQLite database with member names and email addresses, and
other operational data. Archives are written with mode 644 and are not encrypted
on either the source host or the off-host backup target. Only two daily copies
are retained.

The database copy is consistent because it uses the SQLite backup API, and the
archive has been verified by restoring the database and running an integrity
check. Encryption and retention are the remaining gaps.

## Decision

Encrypt every archive before it leaves the source host, using a modern
public-key or passphrase-based tool. Store the key outside the archive, outside
the source host, and in a location with a documented second custodian. Set
archive mode 600. Retain a tiered set of at least 7 daily, 4 weekly, and 3
monthly copies, or an equivalent policy approved by the owner. Rehearse a
restore into a scratch directory and record the elapsed time.

## Rationale

Backups are a high-value target because they concentrate secrets and personal
data. Encryption at rest limits the impact of a stolen archive or storage
snapshot. Two daily copies are too short for silent data problems discovered
after a few days. A tested restore is the only proof that the backup is useful.

## Consequences

Positive: reduced exposure of secrets and personal data, longer recovery window,
and a verified restore procedure.

Negative: key management adds operational work, key loss would make archives
unreadable, and encrypted archives may be slightly slower to create and restore.

Operational: keep the previous backup method available until the first encrypted
archive has passed a restore test. Document the key custody and recovery
procedure. Do not store the key in the repository or in the archive.

## Risk Tier

Tier 2. Requires a decision record, explicit owner approval, and a restore
rehearsal before the old retention is reduced.

## Follow-up Actions

- [ ] Choose the encryption tool and key custody model.
- [ ] Encrypt archives before upload and set mode 600.
- [ ] Implement the tiered retention policy.
- [ ] Perform a restore rehearsal and record the result.
- [ ] Document key recovery and the second custodian.
- [ ] Keep a pre-deploy snapshot for each release.
