# HANDOFF — E2E happy path + live HITL (#78)

**Status:** Planned  
**Branch:** `docs/open-issue-handoffs`  
**Issue(s):** #78  
**Last updated:** 2026-07-24

## Bottom line
Documented cold-start path: compose/uv up → ingest sample policy → push/scan → pending HITL → approve/reject against the **live** API (mocks only as fallback).

## Current state
- Sample fixtures: `docs/mvp/fixtures/` (#81, PR #86).
- HITL endpoints exist on backend (`PATCH /validate/{id}`); frontend may still be mock-leaning — confirm `frontend/services/api.ts`.
- No committed smoke checklist/runbook for the full path yet.

## What shipped
| PR / commit | Delivers |
|-------------|---------|
| (pending) | |

## Hook points (files to touch)
- `docker-compose.yml`
- `frontend/services/api.ts` + HITL UI components
- `docs/ONBOARDING.md`, `docs/mvp/` runbook
- Wire fixtures from #81 into the runbook

## Open follow-ups
- [ ] Runbook (cold start → HITL)
- [ ] Live HITL card against backend
- [ ] Smoke script or checklist in-repo

## How to verify
```bash
# follow runbook once written; smoke script when present
```

## Done means
- [ ] Runbook in docs
- [ ] HITL card works with backend up
- [ ] Smoke script or checklist committed
