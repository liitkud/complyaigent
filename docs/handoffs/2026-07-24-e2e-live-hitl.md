# HANDOFF — E2E happy path + live HITL (#78)

**Status:** In progress (implementation on `mvp/78-e2e-hitl`)  
**Branch:** `mvp/78-e2e-hitl`  
**Issue(s):** #78  
**Last updated:** 2026-08-10

## Bottom line
Documented cold-start path: compose/uv up → ingest sample policy → pending HITL → approve/reject against the **live** API (mocks only as metrics fallback). Smoke script committed.

## Current state
- Root `docker-compose.yml` brings up postgres + backend + frontend (local build).
- HITL card is live-only (`getValidations({ liveOnly: true })`); approve/reject call `PATCH /validate/{id}`.
- Deterministic MID via `COMPLYAIGENT_E2E_HITL_MID` marker (no LLM).
- ActivityLog HITL reads/writes use `logger.engine` consistently.
- Runbook: `docs/mvp/e2e-happy-path.md`. Smoke: `./scripts/e2e-smoke.sh`.

## What shipped
| PR / commit | Delivers |
|-------------|---------|
| (this PR) | Compose path, live HITL, smoke + runbook |

## Hook points (files to touch)
- `docker-compose.yml`
- `frontend/services/api.ts` + `frontend/components/hitl/HITLApprovalCard.tsx`
- `backend/app/api/validate.py`, `backend/app/services/validator.py`
- `scripts/e2e-smoke.sh`, `docs/mvp/e2e-happy-path.md`

## Open follow-ups
- [ ] Merge #77 if Loki push should be asserted in smoke
- [ ] Merge #79 if PII block should be part of happy path
- [ ] Optional: CLI `pg` pre-push leg once rules exist without LLM

## How to verify
```bash
podman compose up --build
./scripts/e2e-smoke.sh
# Dashboard http://localhost:3000 — HITL card against live API
cd backend && uv run pytest tests/integration/test_hitl_live.py -q
```

## Done means
- [x] Runbook in docs
- [x] HITL card works with backend up
- [x] Smoke script or checklist committed
