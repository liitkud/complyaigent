# HANDOFF — MVP: Continuous Compliance Gate

**Status:** Done  
**Branch:** `dev`  
**Issue(s):** Epic [#74](https://github.com/liitkud/complyaigent/issues/74) (Closed) · sub-issues #75–#81 (Closed)  
**Release:** `v0.1.0-mvp`  
**Last updated:** 2026-08-21

## Bottom line

Ship a minimum viable continuous compliance gate: ingest → versioned policy → CLI A1 + `/validate` poll → live HITL → structured verdict logs (+ PII / A1 regex safety). Not a hackathon demo pack.

## Current state

- Epic + sub-issues exist; project board: ComplyAIgent Roadmap
- Project overview: `docs/mvp/README.md`, `docs/ROADMAP.md`, `docs/handover/README.md`
- Per-feature handoffs under this folder; **this file is the epic umbrella**
- Child handoffs should be added as each sub-issue starts (same template)

## Workstreams → issues → expected child handoff

| Issue | Workstream | Child handoff (create when starting) |
|-------|------------|--------------------------------------|
| #75 | Policy storage schema & versioning | `docs/handoffs/YYYY-MM-DD-policy-versioning.md` |
| #76 | Structured verdict logging schema | `…-verdict-log-schema.md` |
| #77 | Loki / sink push | `…-verdict-loki-push.md` |
| #78 | E2E + live HITL | `…-e2e-live-hitl.md` |
| #79 | Presidio PII on `/validate` | `…-presidio-pii.md` |
| #80 | A1 regex validation / ReDoS | `…-a1-regex-guard.md` |
| #81 | Sample policy pack | `…-mvp-sample-policies.md` |
| #82 | Docs sync | Done via #83 |

## Deferred (do not stuff into MVP)

#22 load test · #14 RAG tune · #13 regulatory simulator

## Hook points (orientation)

- Backend: `backend/app/api/validate.py`, `services/pipeline.py`, `models/`
- CLI: `cli/cmd/scan.go`
- Frontend: `frontend/services/api.ts`, HITL components
- Compose: `docker-compose.yml`

## How to verify (epic-level)

See DoD checklist on #74 and `docs/mvp/README.md`.

## Done means

- [x] All MVP sub-issues closed with their own handoff updated to Done
- [x] Epic #74 DoD checkboxes complete
- [x] Signed release tag `v0.1.0-mvp` pushed to origin
- [x] All tests green (55 pytest tests, Next.js build, CLI test suite)
