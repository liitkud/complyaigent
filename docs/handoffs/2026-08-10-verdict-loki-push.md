# HANDOFF — Verdict Loki / sink push (#77)

**Status:** Done  
**Branch:** `mvp/77-loki-sink`  
**Issue(s):** #77 (legacy #20)  
**Last updated:** 2026-08-10

## Bottom line

After every validate decision (and HITL resolve), ship the structured `verdict_event` to Grafana Loki when `LOKI_URL` is set; otherwise optional JSONL file via `VERDICT_SINK_PATH`; otherwise no-op (stdout structured log still emits).

## Current state

- Schema from #76 (`verdict_log.build_verdict_event` / `emit_verdict_log`) is the payload
- Sink is best-effort: failures are logged, validate/HITL responses still succeed
- CLI `pg` validate path benefits automatically via `POST /validate`

## What shipped

| Artifact | Role |
|----------|------|
| `backend/app/services/verdict_sink.py` | Loki push + file fallback + noop |
| `backend/app/services/verdict_log.py` | `emit_verdict_log` calls `safe_push_verdict` |
| `backend/app/api/validate.py` | HITL resolve emits `hitl_resolve` event |
| `backend/app/core/config.py` | `LOKI_URL`, `LOKI_JOB`, `VERDICT_SINK_PATH` |
| `backend/tests/test_verdict_sink.py` | mock Loki pass/fail + file + API hooks |
| `.env.example` | documented env knobs |

## Hook points (files to touch)

- `backend/app/services/verdict_sink.py` — transport
- `backend/app/api/validate.py` — emit sites

## Open follow-ups

- [ ] Promtail sidecar / compose wiring (owned with #78 E2E stack if desired)
- [ ] Persist HITL `verdict_event` onto activity `details` (parity with validate row)

## How to verify

```bash
cd backend && uv run pytest tests/test_verdict_sink.py tests/test_verdict_log.py -v
```

## Done means

- [x] Config via `LOKI_URL` (noop when unset)
- [x] Emit on validate completion + HITL resolve
- [x] Tests cover mock sink success and failure
