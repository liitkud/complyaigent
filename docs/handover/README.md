# ComplyAIgent Handover

Handoff notes for engineers picking up **MVP** work. For the plan and checklists, see [docs/mvp/README.md](../mvp/README.md) and [docs/ROADMAP.md](../ROADMAP.md).

Product name: **ComplyAIgent** (no FerretOps rename).

---

## System overview

```
  Compliance Officer ──upload──► Next.js Dashboard ──ingest/HITL──► FastAPI
                                                                      │
  Developer ──git push──► pg CLI ──local A1──► /validate (+ poll) ────┘
                                                                      │
                                                                 SQLModel DB
                                                                 Verdict logs
                                                                 (optional Loki)
```

| Component | Path | Role |
|-----------|------|------|
| CLI (`pg`) | [`cli/`](../../cli/) | Pre-push hook: Gitleaks, regex/entropy, offload to `/validate` |
| Backend | [`backend/`](../../backend/) | Ingest pipeline, validate + HITL, rules/tasks DB |
| Frontend | [`frontend/`](../../frontend/) | Dashboard, upload, HITL card (falls back to mocks if API down) |

---

## What’s already fixed on `dev` (do not re-open as blockers)

| Item | PR / notes |
|------|------------|
| CLI polls `/validate/{id}` after 202 | #64 |
| Lazy `ChatOpenAI` clients | #63 |
| Integration test payload schema | #62 |
| CLI Makefile `go fmt ./...` | #61 |
| Backend ruff/ty CI | #73 |

---

## MVP delivery (open PRs — not on `dev` until merged)

Merge [#86](https://github.com/liitkud/complyaigent/pull/86) first.

| Area | PR | Notes |
|------|-----|-------|
| Policy versioning + fixtures + verdict schema | [#86](https://github.com/liitkud/complyaigent/pull/86) | #75 #76 #81 — merge gate |
| Loki / file verdict sink | [#89](https://github.com/liitkud/complyaigent/pull/89) | #77 — blocked on #86 |
| Presidio / regex PII on `/validate` | [#90](https://github.com/liitkud/complyaigent/pull/90) | #79 — blocked on #86 |
| Compose + live HITL + `e2e-smoke.sh` | [#91](https://github.com/liitkud/complyaigent/pull/91) | #78 — blocked on #86 |

Still open without a PR: A1 ReDoS gate ([#80](https://github.com/liitkud/complyaigent/issues/80)); full `pg init` pre-push leg in happy-path smoke.

Deferred: load test (#22), RAG tune (#14), reg simulator (#13).

---

## Key files

**CLI:** `cli/cmd/scan.go`, `cli/internal/rules.go`  
**Backend:** `backend/main.py`, `app/api/validate.py`, `app/services/pipeline.py`, `app/services/validator.py`  
**Frontend:** `frontend/services/api.ts`, `frontend/components/hitl/`, `frontend/app/page.tsx`  
**MVP stack:** `docker-compose.yml`, `scripts/e2e-smoke.sh`, `docs/mvp/e2e-happy-path.md`

---

## How to run (short)

See [ONBOARDING.md](../ONBOARDING.md). Quick path:

```bash
# Prefer full stack
podman compose up --build
./scripts/e2e-smoke.sh

# Or without containers
cd backend && uv sync && cp ../.env.example .env && uv run fastapi dev main.py
cd frontend && pnpm install && NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm dev
cd cli && make build && make install
```

---

## Agent / contributor notes

- Default branch for work: `dev`
- Branch MVP features from the foundation tip (`mvp/75-76-81-foundation` / PR #86), not bare `dev`, until #86 merges
- Prefer small PRs mapped to MVP sub-issues
- `agy` is available on the `idea` host for implementation jobs; keep changes scoped to the issue

## Per-feature handoffs

Feature-level continuity lives in [`docs/handoffs/`](../handoffs/) (see skill `feature-plan`). This page stays project-wide.
