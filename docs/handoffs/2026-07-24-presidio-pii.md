# HANDOFF — Presidio PII gate on /validate (#79)

**Status:** In progress (PR open; awaits merge after foundation #86)  
**Branch:** `mvp/79-presidio`  
**Issue(s):** #79 (legacy #17)  
**Last updated:** 2026-08-10

## Bottom line

Block high-risk PII in `code_snippet` on `/validate` (email / card / phone at minimum) via `PIIScannerService`; force HIGH/block when detected. Prefer Microsoft Presidio when installed; otherwise use built-in regex + Luhn.

## Current state

- `backend/app/services/pii.py` — scanner with Presidio-or-regex backend
- `POST /validate` short-circuits to HIGH before the LLM when PII is found
- Optional deps: `uv sync --extra pii` then `uv run python -m spacy download en_core_web_sm`
- Default `uv sync` stays light (regex path); CI does not need spaCy models
- Tests: `DATABASE_URL=sqlite:///./test.db uv run pytest` — 27 passed locally

## What shipped

| PR / commit | Delivers |
|-------------|---------|
| (this branch) | PII gate + unit/integration tests + optional Presidio extra |

## Hook points (files to touch)

- `backend/app/services/pii.py`
- `backend/app/api/validate.py`
- `backend/pyproject.toml` — `[project.optional-dependencies].pii`
- `backend/tests/test_pii_scanner.py`, `tests/integration/test_pii_validate.py`, `tests/fixtures/pii_snippets.py`

## Open follow-ups

- [ ] Close #17 when #79 merges
- [ ] Optional: make Presidio the default in compose once image budget allows

## How to verify

```bash
cd backend && uv sync && DATABASE_URL=sqlite:///./test.db uv run pytest tests/ -k pii -v
```

## Done means

- [x] Unit tests for detector
- [x] Integration: PII snippet → block/HIGH
- [ ] PR merged to `dev` (depends on foundation #86)
