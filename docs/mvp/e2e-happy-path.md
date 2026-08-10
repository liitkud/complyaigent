# E2E happy path + live HITL (#78)

Cold start → ingest sample policy → pending HITL → approve/reject on the **live** API.

## Quick start (compose)

Prefer Podman (project default). Docker Compose v2 also works.

```bash
cp -n .env.example .env   # optional; compose has safe defaults
podman compose up --build
# or: docker compose up --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend  | http://localhost:8000/health |
| Postgres | localhost:5432 (`comply` / see compose) |

Then run the smoke script (no LLM key required):

```bash
./scripts/e2e-smoke.sh
```

Open the dashboard → **HITL Pending Approvals**. After smoke approve, the card should show no pending rows (Refresh).

## Dev path without containers

```bash
# terminal 1 — API (SQLite by default from .env.example)
cd backend && cp -n ../.env.example .env && uv sync && uv run fastapi dev main.py

# terminal 2 — UI
cd frontend && pnpm install && NEXT_PUBLIC_API_URL=http://localhost:8000 pnpm dev
```

Smoke against the local API:

```bash
API_URL=http://localhost:8000 ./scripts/e2e-smoke.sh
```

## Manual checklist

1. [ ] `GET /health` → `{"status":"healthy"}`
2. [ ] Upload `docs/mvp/fixtures/access-control.md` from the dashboard (or `POST /ingest`)
3. [ ] Seed a pending MID (smoke uses marker `COMPLYAIGENT_E2E_HITL_MID` in `code_snippet`; no LLM)
4. [ ] Dashboard HITL card lists the pending row from `GET /validate`
5. [ ] Approve or Reject → `PATCH /validate/{id}` → status updates; row leaves the card
6. [ ] (Optional) `pg init` + pre-push in a sample repo — needs CLI + live rules; not required for HITL smoke

## Deterministic MID (no LLM)

Include this token in `code_snippet` when calling `POST /validate`:

```text
COMPLYAIGENT_E2E_HITL_MID
```

Backend returns `verdict=MID`, `status=pending` so HITL can be exercised offline.

## Dependencies / stubs

| Workstream | Status for this path |
|------------|----------------------|
| #75/#76/#81 foundation | Required — [#86](https://github.com/liitkud/complyaigent/pull/86) (open; merge gate) |
| #77 Loki verdict sink | Optional — [#89](https://github.com/liitkud/complyaigent/pull/89); smoke does not assert Loki push |
| #79 Presidio on `/validate` | Optional — [#90](https://github.com/liitkud/complyaigent/pull/90); PII block not asserted here |
| This E2E / HITL path | [#91](https://github.com/liitkud/complyaigent/pull/91) (open; blocked on #86) |
| Full ingest→rules LLM pipeline | Optional — smoke tolerates ingest still processing |

## Related files

- `docker-compose.yml` — postgres + backend + frontend
- `scripts/e2e-smoke.sh` — API smoke
- `frontend/components/hitl/HITLApprovalCard.tsx` — live-only approve/reject
- `backend/app/api/validate.py` — `GET/PATCH /validate`
- Fixtures: `docs/mvp/fixtures/`
