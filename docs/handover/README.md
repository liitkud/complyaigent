# FerretOPS Handover

Handoff notes for engineers picking up **MVP** work. For the plan and checklists, see [docs/mvp/README.md](../mvp/README.md) and [docs/ROADMAP.md](../ROADMAP.md).

---

## System overview

```
  Compliance Officer ──upload──► Next.js Dashboard ──ingest/HITL──► FastAPI
                                                                      │
  Developer ──git push──► pg CLI ──local A1──► /validate (+ poll) ────┘
                                                                      │
                                                                 SQLModel DB
                                                                 Verdict logs
```

| Component | Path | Role |
|-----------|------|------|
| CLI (`pg`) | [`cli/`](../../cli/) | Pre-push hook: Gitleaks, regex/entropy, offload to `/validate` |
| Backend | [`backend/`](../../backend/) | Ingest pipeline, validate + HITL, rules/tasks DB |
| Frontend | [`frontend/`](../../frontend/) | Dashboard, upload, HITL card (falls back to mocks if API down) |

---

## Completed MVP milestone (`v0.1.0-mvp`)

| Item | Details |
|------|---------|
| CLI polls `/validate/{id}` after 202 | PR #64 |
| Lazy `ChatOpenAI` clients | PR #63 |
| Integration test payload schema | PR #62 |
| CLI Makefile `go fmt ./...` | PR #61 |
| Backend ruff/ty CI | PR #73 |
| Policy storage schema & versioning | PR #75 (`backend/app/models/task.py`, `services/pipeline.py`) |
| Structured verdict logging | PR #76, #77 (`backend/app/core/logging.py`, `services/logger.py`) |
| Live E2E / HITL flow | PR #78 (Live API proxy & HITL approval) |
| Presidio PII filter on `/validate` | PR #79 (`backend/app/services/pii.py`) |
| A1 regex safety gate (ReDoS check) | PR #80 (`backend/app/services/categorizer.py`) |
| Regulatory change simulator | Issue #13 (`backend/app/api/simulate.py`, `services/simulator.py`) |
| Ingestion token compaction & batch cache | Issue #14 (`backend/app/services/extractor.py`, `core/cache.py`) |
| Load testing baseline (<5s) | Issue #22 (`backend/scripts/run-load-test.sh`, `tests/load/`) |

---

## Current active & post-MVP priorities

1. **COPR release automation** — Fedora COPR package builds for CLI `pg` ([handoff](../handoffs/2026-08-21-copr-release-automation.md)).
2. **PR #88 reconciliation** — rebase and merge contributor connection refactor ([handoff](../handoffs/2026-08-21-pr88-regintel-connection-refactor.md)).
3. **Webhooks & vector clustering** — outgoing HITL alerts and distributed vector store support ([handoff](../handoffs/2026-08-21-webhooks-and-vector-clustering.md)).
4. **Production release promotion** — promote `dev` baseline to `main` for `v0.1.0` tag ([handoff](../handoffs/2026-08-21-prod-promotion-and-release.md)).

---

## Key files

**CLI:** `cli/cmd/scan.go`, `cli/internal/rules.go`  
**Backend:** `backend/main.py`, `app/api/validate.py`, `app/services/pipeline.py`, `app/services/validator.py`  
**Frontend:** `frontend/services/api.ts`, `frontend/components/hitl/`, `frontend/app/page.tsx`

---

## How to run (short)

See [ONBOARDING.md](../ONBOARDING.md). Quick path:

```bash
# backend
cd backend && uv sync && cp ../.env.example .env && uv run fastapi dev main.py

# frontend
cd frontend && pnpm install && pnpm dev

# CLI
cd cli && make build && make install
```

Or use root `docker-compose.yml` with `podman compose` when bringing up DB-backed stacks.

---

## Agent / contributor notes

- Default branch for work: `dev`
- Prefer small PRs mapped to MVP sub-issues
- `agy` is available on the `idea` host for implementation jobs; keep changes scoped to the issue

## Per-feature handoffs

Feature-level continuity lives in [`docs/handoffs/`](../handoffs/) using [`docs/handoffs/_TEMPLATE.md`](../handoffs/_TEMPLATE.md) (or central `feature-plan` skill). This page stays project-wide.
