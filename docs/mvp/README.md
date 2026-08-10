# MVP Plan: Continuous Compliance Gate

> [!IMPORTANT]
> **Date:** 2026-08-10 (DoD sync vs open PRs)  
> **Repo:** [liitkud/complyaigent](https://github.com/liitkud/complyaigent) (`dev`)  
> **Local:** `/home/kaoru/Projects/complyaigent`  
> **Status:** MVP implementation on open PRs; not all merged to `dev` yet  
> **Epic:** [#74 MVP: Continuous Compliance Gate](https://github.com/liitkud/complyaigent/issues/74)  
> **Product name:** ComplyAIgent (no FerretOps rename)

## Open MVP PRs (merge gate)

Merge **[#86](https://github.com/liitkud/complyaigent/pull/86)** (foundation) first. Dependents stack on that tip.

| PR | Workstreams | State |
|----|-------------|-------|
| [#86](https://github.com/liitkud/complyaigent/pull/86) | #75 policy versioning · #76 verdict schema · #81 fixtures | Open — merge gate |
| [#89](https://github.com/liitkud/complyaigent/pull/89) | #77 Loki / sink push | Open — blocked on #86 |
| [#90](https://github.com/liitkud/complyaigent/pull/90) | #79 Presidio / regex PII | Open — blocked on #86 |
| [#91](https://github.com/liitkud/complyaigent/pull/91) | #78 E2E compose + live HITL | Open — blocked on #86 |

Docs sync for this checklist: workstream [#82](https://github.com/liitkud/complyaigent/issues/82).

## Definition of Done

Checkbox = **delivered on an open MVP PR tip** (code/docs exist). Not the same as **merged to `dev`**.

- [x] `docker compose up` (or documented uv/pnpm/go path) runs backend + frontend + DB — [e2e-happy-path.md](e2e-happy-path.md) · [#91](https://github.com/liitkud/complyaigent/pull/91) (open; blocked on merge)
- [x] Officer uploads a sample policy → rules appear with **version metadata** — [#86](https://github.com/liitkud/complyaigent/pull/86) `#75`/`#81` (open; merge gate)
- [ ] `pg init` + pre-push runs local A1 checks and successfully completes `/validate` poll flow — **open** (optional leg in #78 runbook; not asserted by `e2e-smoke.sh`)
- [x] Dashboard HITL approve/reject works against the **live** API (not mock-only) — [#91](https://github.com/liitkud/complyaigent/pull/91) · `./scripts/e2e-smoke.sh` (open; blocked on merge)
- [x] Every scan decision emits a **structured verdict log** (schema documented; Loki push if endpoint configured) — schema [#86](https://github.com/liitkud/complyaigent/pull/86) `#76`; Loki/sink [#89](https://github.com/liitkud/complyaigent/pull/89) (both open)
- [x] PII scan on validate path blocks obvious leaks (email / card / phone at minimum) — [#90](https://github.com/liitkud/complyaigent/pull/90) (open; blocked on #86)
- [ ] A1 regex rules are smoke-tested before serve (no unchecked ReDoS) — **open** ([#80](https://github.com/liitkud/complyaigent/issues/80); no PR yet)
- [x] Handoff + onboarding docs match reality — this sync (#82); **CI green on `dev` still blocked** until #86–#91 merge (and CI `py_check` baseline)

## Workstreams → issues

| # | Workstream | Primary paths | Pri | Delivery |
|---|------------|---------------|-----|----------|
| W1 | [#75](https://github.com/liitkud/complyaigent/issues/75) Policy storage schema & versioning | `backend/app/models/`, ingest API | P0 | [#86](https://github.com/liitkud/complyaigent/pull/86) open |
| W2 | [#76](https://github.com/liitkud/complyaigent/issues/76) Structured logging schema | `backend/app/services/verdict_log.py` | P0 | [#86](https://github.com/liitkud/complyaigent/pull/86) open |
| W3 | [#77](https://github.com/liitkud/complyaigent/issues/77) Verdict push (Loki or sink) | validate + `verdict_sink` | P0 | [#89](https://github.com/liitkud/complyaigent/pull/89) open |
| W4 | [#78](https://github.com/liitkud/complyaigent/issues/78) E2E happy-path / HITL live | `docker-compose.yml`, frontend HITL, smoke | P0 | [#91](https://github.com/liitkud/complyaigent/pull/91) open |
| W5 | [#79](https://github.com/liitkud/complyaigent/issues/79) Presidio PII in `/validate` | `backend/app/services/pii.py` | P0 | [#90](https://github.com/liitkud/complyaigent/pull/90) open |
| W6 | [#80](https://github.com/liitkud/complyaigent/issues/80) A1 regex validation gate | `categorizer.py` / rule publish path | P1 | Open (no PR) |
| W7 | [#81](https://github.com/liitkud/complyaigent/issues/81) MVP sample policy pack | `docs/mvp/fixtures/` | P1 | [#86](https://github.com/liitkud/complyaigent/pull/86) open |
| W8 | [#82](https://github.com/liitkud/complyaigent/issues/82) Docs sync (handoff / onboarding / audit) | `docs/**` | P0 | This PR |

## Deferred (post-MVP)

- Load test / 5s rule ([#22](https://github.com/liitkud/complyaigent/issues/22))
- RAG fine-tune ([#14](https://github.com/liitkud/complyaigent/issues/14))
- Regulatory change simulator ([#13](https://github.com/liitkud/complyaigent/issues/13))

## References

- [Per-feature handoffs](../handoffs/) + skill `feature-plan`
- [E2E happy path + live HITL](e2e-happy-path.md) (#78 / [#91](https://github.com/liitkud/complyaigent/pull/91))
- [Handover](../handover/README.md)
- [Onboarding](../ONBOARDING.md)
- [Audit (historical)](../audit/README.md)
- Spec: `specs/001-governance-bridge-api/plan.md`
