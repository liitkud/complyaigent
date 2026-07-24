# HANDOFF — Policy storage schema & versioning (#75)

**Status:** In progress  
**Branch:** `mvp/75-76-81-foundation`  
**Issue(s):** #75 (legacy #10)  
**Last updated:** 2026-07-24

## Bottom line
SQLModel Policy with version + content hash; ingest writes a version row; list/get API.

## Hook points
- `backend/app/models/policy.py`
- `backend/app/api/policies.py` / ingest wiring
- `backend/tests/integration/test_policies.py`

## How to verify
```bash
cd backend && uv run pytest tests/integration/test_policies.py -v
```

## Done means
- [ ] Policy model + table
- [ ] Ingest creates/updates version
- [ ] GET list/current works
