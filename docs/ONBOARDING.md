# Developer Onboarding Guide

Welcome to **ComplyAIgent**. This guide walks you through local setup for development and testing.

Product name stays **ComplyAIgent** (no FerretOps rename).

## Codebase architecture

ComplyAIgent has three primary components:

1. **Backend (`/backend`)**: FastAPI — rule ingestion, classification (LangChain), validate + HITL, verdict logs. SQLModel/SQLAlchemy (SQLite or PostgreSQL).
2. **Frontend (`/frontend`)**: Next.js (App Router) dashboard — policy upload, compliance history, HITL approve/reject against the live API.
3. **CLI (`/cli`)**: Go tool (`pg`) as a git pre-push hook — local A1 scans (Gitleaks, regex, entropy), then `/validate` + poll on the backend.

---

## Prerequisites

* **Go** (v1.20 or newer)
* **Python** (v3.11 or newer) and **uv**
* **Node.js** (v18 or newer) and **pnpm** (prefer over npm)
* **Podman** (preferred) or Docker & Compose — for the full MVP stack

---

## Setup instructions

### 0. Full stack via Compose (MVP E2E)

Compose and smoke land on open PR [#91](https://github.com/liitkud/complyaigent/pull/91) (`#78`). Prefer Podman.

```bash
# from repo root
podman compose up --build
# or: docker compose up --build

# API smoke (HITL approve, no LLM key required)
./scripts/e2e-smoke.sh
```

Details: [docs/mvp/e2e-happy-path.md](mvp/e2e-happy-path.md) · DoD: [docs/mvp/README.md](mvp/README.md).

### 1. Backend setup

```bash
cd backend
uv sync
cp ../.env.example .env
uv run fastapi dev main.py
```

Server: `http://localhost:8000`. Health: `http://localhost:8000/health`.

LLM clients are lazy-loaded (PR #63). Missing API keys do not crash import. Paths that call the LLM still need credentials. HITL smoke does not need an LLM key (`COMPLYAIGENT_E2E_HITL_MID` marker).

Optional PII extra (open PR [#90](https://github.com/liitkud/complyaigent/pull/90)): `uv sync --extra pii`.

### 2. Frontend setup

```bash
cd frontend
pnpm install
NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm dev
```

UI: `http://localhost:3000`. HITL approve/reject uses the live API when the backend is up (PR [#91](https://github.com/liitkud/complyaigent/pull/91)). Metrics may still fall back to mocks if the API is down.

### 3. CLI setup

```bash
cd cli
make build
make install
```

Ensure `~/.local/bin` is on `$PATH`. Then in a monitored repo:

```bash
pg init
```

Creates `.pg.yaml` and installs `.git/hooks/pre-push`. Full `pg init` → pre-push → `/validate` poll is still an open DoD item (not asserted by `e2e-smoke.sh`).

---

## Running tests

```bash
# From the project root
./scripts/integration-test.sh

# MVP live HITL smoke (backend must be up — compose or uv)
./scripts/e2e-smoke.sh

# Backend unit/integration (example)
cd backend && DATABASE_URL=sqlite:///./test.db uv run pytest -q
```

> [!NOTE]
> **MVP context:** [docs/mvp/README.md](mvp/README.md) · [ROADMAP](ROADMAP.md) · [Handover](handover/README.md) · [Handoffs](handoffs/)
>
> Open MVP PRs (merge #86 first): [#86](https://github.com/liitkud/complyaigent/pull/86) · [#89](https://github.com/liitkud/complyaigent/pull/89) · [#90](https://github.com/liitkud/complyaigent/pull/90) · [#91](https://github.com/liitkud/complyaigent/pull/91)
