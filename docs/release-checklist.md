# Release Checklist

Use this checklist for every production release. Keep one release to one purpose.
Security fixes, redesign stages, and data changes do not share a deploy.

## Approval

- [ ] The owner approved the exact scope and target.
- [ ] The change has a decision record if it is Tier 2 or Tier 3.
- [ ] The rollback position is identified.
- [ ] The maintenance window is agreed.

## Verification

- [ ] The working tree contains only intended changes.
- [ ] `bunx tsc --noEmit` passes.
- [ ] `bun test` passes.
- [ ] CI passes.
- [ ] `bun run audit:runtime` has no production findings.
- [ ] `bun run build:css` leaves `public/tailwind.css` unchanged.
- [ ] The changed pages were checked at 390, 768, and 1440 px.
- [ ] The automated accessibility check has no critical or serious findings on changed pages.
- [ ] The commit message follows the repository rules and has no AI attribution.

## Recovery position

- [ ] A fresh database backup was taken and verified.
- [ ] The previous code or release is available.
- [ ] The previous unit and environment configuration are available if changed.
- [ ] The restore path has been tested or rehearsed.
- [ ] The backup age and retention are acceptable for the change.

## Deploy

- [ ] Announce the start of the window.
- [ ] Take the pre-deploy database snapshot.
- [ ] Deploy only the target service.
- [ ] Run the smoke checks: health, public page, login, member page, admin page.
- [ ] Perform one safe write against a scratch database, not production data.
- [ ] Check application and proxy error logs for new 5xx responses.
- [ ] Verify database integrity and expected row counts.

## After deploy

- [ ] Watch for 24 hours.
- [ ] Review errors, 5xx responses, job failures, and backup age.
- [ ] Record the release, commit, artifact hash, and rollback target.
- [ ] Update the changelog and tag if this is a versioned release.
- [ ] Announce completion.

## Rollback

- Code-only change: restore the previous code or release, restart the service,
  and repeat the smoke checks.
- Data change: restore the pre-deploy snapshot only after confirming that the
  migration cannot be reversed safely. Never run a destructive down migration
  without a verified snapshot.
- Edge or DNS change: revert the exact rule, then verify both the origin and the
  public response.
- Backup change: keep the previous backup method available until the new archive
  has passed a restore test.

Roll back first and diagnose later if a release causes a login failure, more than
one unexpected restart, missing data, or a persistent 5xx response.
