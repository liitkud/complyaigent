# Access Control Policy

Minimal sample policy for MVP validation and HITL demos.

## Purpose
Limit system access to authorized roles and revoke it when roles change.

## Controls
- Grant production access by role, not by individual exception when avoidable.
- Require MFA for administrative and production accounts.
- Revoke access within one business day of role change or offboarding.
- Log privileged actions and retain logs for the audit window defined by compliance.
