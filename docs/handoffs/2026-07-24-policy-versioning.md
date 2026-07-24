# HANDOFF — Policy storage schema & versioning (#75)

**Status:** Done  
**Branch:** `mvp/75-76-81-foundation`  
**Issue(s):** #75 (legacy #10)  
**Last updated:** 2026-07-24

## Bottom line
SQLModel Policy with version + content hash; ingest writes a version row; list/get API.

## Model
`Policy`: `id`, `name`, `source_url`, `version`, `hash`, `task_id`, `is_current`, `created_at`

## API
- `POST /ingest` → includes `policy_id`
- `GET /policies` → current versions (`current_only=true` default)
- `GET /policies/{id}`

## Version rules
- Same content hash → reuse Policy row (idempotent)
- Same name, new hash → bump `version`, flip previous `is_current=false`

## What shipped
| Artifact | Role |
|----------|------|
| `backend/app/models/policy.py` | table |
| `backend/app/api/policies.py` | list/get |
| `backend/app/api/ingest.py` | `_upsert_policy` |
| `backend/tests/integration/test_policies.py` | TDD coverage |

## Open follow-ups
- [ ] Alembic migrations instead of `create_all` for prod
- [ ] Disable/mock background ingest pipeline in unit tests (LLM noise)

## How to verify
```bash
cd backend && uv run pytest tests/integration/test_policies.py -v
```

## Done means
- [x] Policy model + table
- [x] Ingest creates/updates version
- [x] GET list/current works
