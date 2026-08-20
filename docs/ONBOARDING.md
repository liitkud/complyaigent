# FerretOPS Developer Onboarding Guide

Welcome to **FerretOPS**! This guide will walk you through setting up your local environment for development and testing.

## 📁 Codebase Architecture

ComplyAIgent is composed of three primary components:
1. **Backend (`/backend`)**: A FastAPI service powering rule ingestion, classification pipelines (via LangChain), and policy validation logs. Powered by SQLModel/SQLAlchemy (configured with SQLite or PostgreSQL).
2. **Frontend (`/frontend`)**: A Next.js (App Router) dashboard to upload policies, track compliance history, and approve/reject medium-risk pushes paused by LangGraph.
3. **CLI (`/cli`)**: A Go command-line tool (`pg`) serving as a git pre-push hook. It executes fast, local-first scans (Gitleaks, regex, and entropy check) and offloads complex validation to the backend.

---

## 🛠️ Prerequisites

Ensure you have the following installed on your system:
* **Go** (v1.20 or newer)
* **Python** (v3.11 or newer) and **uv** (fast Python package installer/manager)
* **Node.js** (v18 or newer) and **npm** or **pnpm**
* **Docker** & **docker-compose** (optional, for local postgres/services container setup)

---

## 🚀 Setup Instructions

### 1. Backend Setup

The backend uses `uv` for python package management.

```bash
# Navigate to the backend directory
cd backend

# Sync dependencies and create a virtual environment
uv sync

# Copy the example environment file from the root
cp ../.env.example .env
```

Open `.env` and configure the settings. If you don't have active LLM keys, you can run integration tests or preview mock configurations.

To start the FastAPI dev server:
```bash
uv run fastapi dev main.py
```
By default, the server runs on `http://localhost:8000`. You can verify it by hitting `http://localhost:8000/health`.

### 2. Frontend Setup

The frontend is a Next.js client.

```bash
cd frontend

# Install packages
npm install  # or pnpm install

# Start the dev server
npm run dev
```
The client runs on `http://localhost:3000`. It communicates with the backend API on `http://localhost:8000`. If the backend is down, the frontend automatically falls back to static mock data so you can preview the UI.

### 3. CLI Setup

Build and install the Go CLI tool (`pg`):

```bash
cd cli

# Build the binary
make build

# Install the binary locally (adds to ~/.local/bin/pg)
make install
```
*Note: Make sure `~/.local/bin` is in your `$PATH`.*

To initialize ComplyAIgent in a repository:
```bash
# In the root of the repository you want to monitor
pg init
```
This will create a `.pg.yaml` configuration file and automatically configure a git pre-push hook at `.git/hooks/pre-push`.

---

## 🧪 Running Tests

An integration test suite is located in `/scripts` to test the end-to-end flow.

To run tests:
```bash
# From the project root
./scripts/integration-test.sh
```

For a local container smoke check, start the stack with cached images and run
the no-pull check:
```bash
CONTAINER_ENGINE=podman ./scripts/compose-smoke.sh
```
Use `CONTAINER_ENGINE=docker` to verify the Docker-compatible command path.
See [Local Compose Runtime Smoke](testing/compose-runtime-smoke.md).

> [!NOTE]
> LLM clients are lazy-loaded (PR #63), so missing API keys should no longer crash import/startup. You still need real or mock credentials for paths that *call* the LLM. See [Audit](audit/README.md) and [Handover](handover/README.md).
>
> **MVP context:** [docs/mvp/README.md](mvp/README.md) · [ROADMAP](ROADMAP.md)
