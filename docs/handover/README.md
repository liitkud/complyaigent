# ComplyAIgent Handover

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

## What’s already fixed (do not re-open as blockers)

| Item | PR / notes |
|------|------------|
| CLI polls `/validate/{id}` after 202 | #64 |
| Lazy `ChatOpenAI` clients | #63 |
| Integration test payload schema | #62 |
| CLI Makefile `go fmt ./...` | #61 |
| Backend ruff/ty CI | #73 |

---

## Current MVP priorities

1. **Policy versioning** — durable policy metadata + history ([#10](https://github.com/liitkud/complyaigent/issues/10) / MVP sub-issue).
2. **Structured verdict logging** — schema + emit on every decision ([#4](https://github.com/liitkud/complyaigent/issues/4), [#20](https://github.com/liitkud/complyaigent/issues/20)).
3. **Live E2E / HITL** — dashboard against real API; compose path documented.
4. **PII gate** — Presidio (or equivalent) on validate ([#17](https://github.com/liitkud/complyaigent/issues/17)).
5. **A1 regex safety** — validate generated patterns before serving to CLI (see audit §6).

Deferred: load test (#22), RAG tune (#14), reg simulator (#13).

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

Or use root `docker-compose.yml` when bringing up DB-backed stacks.

---

## Agent / contributor notes

- Default branch for work: `dev`
- Prefer small PRs mapped to MVP sub-issues
- `agy` is available on the `idea` host for implementation jobs; keep changes scoped to the issue

## Per-feature handoffs

Feature-level continuity lives in [`docs/handoffs/`](../handoffs/) (see skill `feature-plan`). This page stays project-wide.
