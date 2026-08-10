# HANDOFF — MVP: Continuous Compliance Gate

**Status:** In progress (implementation on open PRs; merge gate #86)  
**Branch:** `docs/mvp-handoffs` (planning); implementation on `mvp/<issue>-*`  
**Issue(s):** Epic [#74](https://github.com/liitkud/complyaigent/issues/74) · sub-issues #75–#82  
**Last updated:** 2026-08-10

## Bottom line

Ship a minimum viable continuous compliance gate: ingest → versioned policy → CLI A1 + `/validate` poll → live HITL → structured verdict logs (+ PII / A1 regex safety). Not a hackathon demo pack. Product name stays **ComplyAIgent**.

## Current state

- Epic + sub-issues exist; project board: ComplyAIgent Roadmap
- Project overview: `docs/mvp/README.md`, `docs/ROADMAP.md`, `docs/handover/README.md`
- Per-feature handoffs under this folder; **this file is the epic umbrella**
- Open MVP PRs: [#86](https://github.com/liitkud/complyaigent/pull/86) (foundation) · [#89](https://github.com/liitkud/complyaigent/pull/89) (Loki) · [#90](https://github.com/liitkud/complyaigent/pull/90) (PII) · [#91](https://github.com/liitkud/complyaigent/pull/91) (E2E)
- Still open without PR: [#80](https://github.com/liitkud/complyaigent/issues/80) A1 ReDoS; `pg init` full pre-push leg

## Workstreams → issues → child handoff

| Issue | Workstream | Child handoff | Delivery |
|-------|------------|---------------|----------|
| #75 | Policy storage schema & versioning | [policy-versioning](2026-07-24-policy-versioning.md) | [#86](https://github.com/liitkud/complyaigent/pull/86) open |
| #76 | Structured verdict logging schema | [verdict-log-schema](2026-07-24-verdict-log-schema.md) | [#86](https://github.com/liitkud/complyaigent/pull/86) open |
| #77 | Loki / sink push | [verdict-loki-push](2026-08-10-verdict-loki-push.md) | [#89](https://github.com/liitkud/complyaigent/pull/89) open |
| #78 | E2E + live HITL | [e2e-live-hitl](2026-07-24-e2e-live-hitl.md) | [#91](https://github.com/liitkud/complyaigent/pull/91) open |
| #79 | Presidio PII on `/validate` | [presidio-pii](2026-07-24-presidio-pii.md) | [#90](https://github.com/liitkud/complyaigent/pull/90) open |
| #80 | A1 regex validation / ReDoS | (create when starting) | Open — no PR |
| #81 | Sample policy pack | [mvp-sample-policies](2026-07-24-mvp-sample-policies.md) | [#86](https://github.com/liitkud/complyaigent/pull/86) open |
| #82 | Docs sync | DoD + onboarding + handoff index | This docs PR |

## Deferred (do not stuff into MVP)

#22 load test · #14 RAG tune · #13 regulatory simulator

## Hook points (orientation)

- Backend: `backend/app/api/validate.py`, `services/pipeline.py`, `models/`
- CLI: `cli/cmd/scan.go`
- Frontend: `frontend/services/api.ts`, HITL components
- Compose: `docker-compose.yml` · smoke: `scripts/e2e-smoke.sh`

## How to verify (epic-level)

See DoD checklist on #74 and `docs/mvp/README.md`.

## Done means

- [ ] All MVP sub-issues closed with their own handoff updated to Done
- [ ] Epic #74 DoD checkboxes complete **and** PRs merged to `dev`
