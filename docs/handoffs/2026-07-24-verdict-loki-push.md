# HANDOFF — Push verdicts to Loki (#77)

**Status:** Planned  
**Branch:** `docs/open-issue-handoffs`  
**Issue(s):** #77 (legacy #20)  
**Last updated:** 2026-07-24

## Bottom line
Ship every `verdict_event` to Grafana Loki when configured; otherwise keep a durable local/structured fallback so dev stays green without Loki.

## Current state
- Schema lives in `backend/app/services/verdict_log.py` (#76 on `mvp/75-76-81-foundation` / PR #86 — do not re-invent keys).
- Validate emits `verdict_event` to app logger; **no** Loki HTTP push yet.
- Legacy #20 is the same intent; close it when #77 ships.

## What shipped
| PR / commit | Delivers |
|-------------|---------|
| (pending) | |

## Hook points (files to touch)
- `backend/app/services/verdict_log.py` / logger — push after `emit_verdict_log`
- `backend/app/core/config.py` — `LOKI_URL` (or equiv) + enable flag
- `backend/app/api/validate.py` — HITL resolve path should also emit
- CLI / `pg` completion path if it logs verdicts independently

## Open follow-ups
- [ ] Config + no-op when unset
- [ ] Emit on validate completion + HITL approve/reject
- [ ] Tests with mocked Loki (or file sink)
- [ ] Close #20 when done

## How to verify
```bash
cd backend && uv run pytest tests/ -k loki -v
# with LOKI_URL set: trigger /validate and confirm push (or mock)
```

## Done means
- [ ] Config flag/URL
- [ ] Emit on CLI-driven validate completion + HITL resolve
- [ ] No-op / file fallback when Loki unset
