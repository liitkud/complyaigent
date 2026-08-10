# HANDOFF — A1 regex validation / ReDoS guard

**Status:** Done  
**Branch:** `mvp/80-a1-redos`  
**Issue(s):** [#80](https://github.com/liitkud/complyaigent/issues/80)  
**Owner / next reader:** MVP epic #74  
**Last updated:** 2026-08-10

## Bottom line

Before A1 regex rules are published or served to the CLI, they must compile, pass
their `test_pass` / `test_fail` self-tests, and clear a ReDoS smoke gate (static
nested-quantifier heuristics + timed adversarial search). Invalid patterns are
demoted; catastrophic ones are quarantined and never returned from `/reg`.

## Current state

- Guard module: `backend/app/services/a1_regex_guard.py`
- Wired at categorizer output, ingest publish (`pipeline.py`), and serve
  (`api/manifest.py` `/reg` + `/regulation/{id}`)
- Legacy unstamped A1 rows are fail-closed: validated on serve

## What shipped

| PR / commit | Delivers |
|-------------|---------|
| (this branch) | A1 ReDoS / self-test gate (#80) |

## Hook points (files to touch)

- `backend/app/services/a1_regex_guard.py` — validation API
- `backend/app/services/categorizer.py` — stamp / demote after LLM classify
- `backend/app/services/pipeline.py` — re-check before persist
- `backend/app/api/manifest.py` — filter A1 before CLI fetch

## Open follow-ups

- [ ] Optional: persist quarantine queue UI for officers
- [ ] Optional: replace timed fork smoke with `google-re2` if dependency budget allows

## How to verify

```bash
cd backend && uv sync
uv run ruff check .
uv run pytest tests/test_a1_regex_guard.py tests/integration/test_a1_regex_serve.py -q
```

## Done means

- [x] Unsafe / invalid regex not served to CLI
- [x] Tests for reject + quarantine + safe paths
- [x] Guard on categorizer / publish / serve
