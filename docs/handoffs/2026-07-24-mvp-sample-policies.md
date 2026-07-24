# HANDOFF — MVP sample policy pack (#81)

**Status:** In progress  
**Branch:** `mvp/75-76-81-foundation`  
**Issue(s):** #81  
**Last updated:** 2026-07-24

## Bottom line
Minimal Markdown policy fixtures for ingest/E2E — not a hackathon corpus.

## Current state
Starting TDD: tests require fixtures under `docs/mvp/fixtures/`.

## What shipped
| PR / commit | Delivers |
|-------------|---------|
| (pending) | |

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
- [ ] ≥1 MD fixture with title + controls section
- [ ] Tests green
