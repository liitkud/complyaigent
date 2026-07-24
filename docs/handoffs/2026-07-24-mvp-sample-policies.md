# HANDOFF — MVP sample policy pack (#81)

**Status:** Done  
**Branch:** `mvp/75-76-81-foundation`  
**Issue(s):** #81  
**Last updated:** 2026-07-24

## Bottom line
Minimal Markdown policy fixtures for ingest/E2E — not a hackathon corpus.

## Current state
Two fixtures under `docs/mvp/fixtures/` with H1 title + `## Controls`.

## What shipped
| PR / commit | Delivers |
|-------------|---------|
| (this branch) | `data-classification.md`, `access-control.md` + `test_mvp_fixtures.py` |

## Hook points
- `docs/mvp/fixtures/`
- `backend/tests/test_mvp_fixtures.py`

## Open follow-ups
- [ ] Wire fixtures into #78 E2E runbook

## How to verify
```bash
cd backend && uv run pytest tests/test_mvp_fixtures.py -v
```

## Done means
- [x] ≥1 MD fixture with title + controls section
- [x] Tests green
