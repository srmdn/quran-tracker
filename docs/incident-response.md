# Incident Response

## What Is an Incident

Any event where a security issue, data exposure, or critical bug causes or could cause harm to users or the service.

## Severity Levels

- **Sev 1:** Active data exposure, authentication bypass, or service unavailable
- **Sev 2:** Potential data exposure, privilege escalation, or significant user impact
- **Sev 3:** Limited impact, near miss, or minor data integrity issue

## Response Process

1. Detect and record the incident (timestamp, description, affected scope).
2. Contain: disable the affected feature, roll back, or apply a temporary guard.
3. Triage severity and determine affected users.
4. Mitigate: apply the fix in staging, verify, promote to production.
5. Recover: confirm the issue is resolved, restore service if needed.
6. Post-incident: write a brief record capturing root cause and corrective actions.

## Post-Incident Record

Save in `docs/decisions/` using the decision record template. Capture:
- Root cause
- How it was detected
- Immediate fix applied
- Long-term preventive actions
- Any user communication needed

## Contacts

- Maintainer: see `SECURITY.md` for the current contact
- Service: your deployed instance (systemd: `quran-tracker` or equivalent)
- DB: `data/ngaji.db` relative to the project root
