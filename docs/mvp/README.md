# MVP Plan: Continuous Compliance Gate

> [!IMPORTANT]
> **Date:** 2026-07-24  
> **Repo:** [liitkud/complyaigent](https://github.com/liitkud/complyaigent) (`dev`)  
> **Local:** `/home/kaoru/Projects/complyaigent`  
> **Status:** Complete (MVP Finalized)  
> **Epic:** [#74 MVP: Continuous Compliance Gate](https://github.com/liitkud/complyaigent/issues/74)

## Definition of Done

- [x] `docker compose up` (or documented uv/pnpm/go path) runs backend + frontend + DB
- [x] Officer uploads a sample policy → rules appear with **version metadata**
- [x] `pg init` + pre-push runs local A1 checks and successfully completes `/validate` poll flow
- [x] Dashboard HITL approve/reject works against the **live** API (not mock-only)
- [x] Every scan decision emits a **structured verdict log** (schema documented; Loki push if endpoint configured)
- [x] PII scan on validate path blocks obvious leaks (email / card / phone at minimum)
- [x] A1 regex rules are smoke-tested before serve (no unchecked ReDoS)
- [x] Handoff + onboarding docs match reality; CI green on `dev`

## Workstreams → issues

| # | Workstream | Primary paths | Pri |
|---|------------|---------------|-----|
| W1 | [#75](https://github.com/liitkud/complyaigent/issues/75) Policy storage schema & versioning | `backend/app/models/`, ingest API | P0 |
| W2 | [#76](https://github.com/liitkud/complyaigent/issues/76) Structured logging schema | `backend/app/core/logging.py`, `services/logger.py` | P0 |
| W3 | [#77](https://github.com/liitkud/complyaigent/issues/77) Verdict push (Loki or sink) | validate + logger | P0 |
| W4 | [#78](https://github.com/liitkud/complyaigent/issues/78) E2E happy-path / HITL live | `docker-compose.yml`, frontend API client, validate HITL | P0 |
| W5 | [#79](https://github.com/liitkud/complyaigent/issues/79) Presidio PII in `/validate` | `backend/app/services/pii.py`, `api/validate.py` | P0 |
| W6 | [#80](https://github.com/liitkud/complyaigent/issues/80) A1 regex validation gate | `categorizer.py` / rule publish path | P1 |
| W7 | [#81](https://github.com/liitkud/complyaigent/issues/81) MVP sample policy pack | `docs/mvp/fixtures/` or `data/` | P1 |
| W8 | [#82](https://github.com/liitkud/complyaigent/issues/82) Docs sync (handoff / onboarding / audit) | `docs/**` | P0 |

## Deferred (post-MVP)

- Load test / 5s rule ([#22](https://github.com/liitkud/complyaigent/issues/22))
- RAG fine-tune ([#14](https://github.com/liitkud/complyaigent/issues/14))
- Regulatory change simulator ([#13](https://github.com/liitkud/complyaigent/issues/13))

## References

- [Per-feature handoffs](../handoffs/) + skill `feature-plan`

- [Handover](../handover/README.md)
- [Onboarding](../ONBOARDING.md)
- [Audit (historical)](../audit/README.md)
- Spec: `specs/001-governance-bridge-api/plan.md`
