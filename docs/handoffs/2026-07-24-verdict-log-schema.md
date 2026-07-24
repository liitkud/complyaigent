# HANDOFF — Structured verdict logging schema (#76)

**Status:** In progress  
**Branch:** `mvp/75-76-81-foundation`  
**Issue(s):** #76 (legacy #4)  
**Last updated:** 2026-07-24

## Bottom line
Canonical JSON verdict event shape for every scan/validate decision. Loki push is #77.

## Hook points
- `backend/app/services/verdict_log.py`
- `backend/app/api/validate.py`
- `backend/tests/test_verdict_log.py`

## How to verify
```bash
cd backend && uv run pytest tests/test_verdict_log.py tests/integration/test_observability.py -v
```

## Done means
- [ ] Required keys present on validate path
- [ ] Schema documented in this handoff + code constants
