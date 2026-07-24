# HANDOFF — Presidio PII gate on /validate (#79)

**Status:** Planned  
**Branch:** `docs/open-issue-handoffs`  
**Issue(s):** #79 (legacy #17)  
**Last updated:** 2026-07-24

## Bottom line
Block high-risk PII in `code_snippet` on `/validate` (email / card / phone at minimum) via a `PIIScannerService`; force HIGH/block when detected.

## Current state
- No `backend/app/services/pii.py` yet.
- Validate path runs LLM risk check only.
- Legacy #17 is the same capability; close when #79 ships.

## What shipped
| PR / commit | Delivers |
|-------------|---------|
| (pending) | |

## Hook points (files to touch)
- `backend/app/services/pii.py` (new)
- `backend/app/api/validate.py` — gate before/alongside validator
- `backend/pyproject.toml` — Presidio (or agreed detector) deps
- Tests: unit detector + integration PII → HIGH/block

## Open follow-ups
- [ ] Detector service + config
- [ ] Integrate into `/validate`
- [ ] Unit + integration tests
- [ ] Close #17 when done

## How to verify
```bash
cd backend && uv run pytest tests/ -k pii -v
```

## Done means
- [ ] Unit tests for detector
- [ ] Integration: PII snippet → block/HIGH
