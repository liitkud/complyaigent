# HANDOFF — Structured verdict logging schema (#76)

**Status:** Done  
**Branch:** `mvp/75-76-81-foundation`  
**Issue(s):** #76 (legacy #4)  
**Last updated:** 2026-07-24

## Bottom line
Canonical JSON verdict event shape for every scan/validate decision. Loki push is #77.

## Schema
Required keys on `verdict_event`:

| Key | Notes |
|-----|--------|
| `action` | e.g. `risk_validation` |
| `verdict` | allow/block/HITL band (`LOW`/`MID`/`HIGH`) |
| `repo` | optional repo slug; empty string if unset |
| `timestamp` | ISO-8601 |
| `policy_id` / `policyId` | both set for consumers |
| `validation_id` | activity log id |
| `rule_id` | rule UUID string |

## What shipped
| Artifact | Role |
|----------|------|
| `backend/app/services/verdict_log.py` | `REQUIRED_VERDICT_KEYS`, `build_verdict_event`, `emit_verdict_log` |
| `backend/app/api/validate.py` | returns + persists `verdict_event` |
| `backend/tests/test_verdict_log.py` | schema + validate path |

## Open follow-ups
- [x] #77 Loki/promtail shipper — see `2026-08-10-verdict-loki-push.md`
- [ ] Align activity DB session with FastAPI `get_session` (dual-engine smell)

## How to verify
```bash
cd backend && uv run pytest tests/test_verdict_log.py -v
```

## Done means
- [x] Required keys present on validate path
- [x] Schema documented in this handoff + code constants
