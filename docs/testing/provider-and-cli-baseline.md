# Provider and CLI Baseline

**Measured:** 2026-08-20

This is a no-secret baseline. It records behavior, not credential values.

## LLM Providers

The probe used each provider's OpenAI-compatible `/v1/models` endpoint and one
minimal completion request with a two-token limit. Do not run completion probes
inside loops.

| Provider | Models endpoint | Completion | Meaning |
|---|---:|---:|---|
| Groq | HTTP 200 | HTTP 200 | Credential and selected endpoint worked |
| Cerebras | HTTP 200 | HTTP 402 | Credential worked, but inference is not available on the current plan |

HTTP 200 from a models endpoint does not prove that inference is enabled.
Treat Cerebras as unavailable until its account plan changes. The first live
test should use Groq through the backend's current `LLM_API_KEY` and
`LLM_ENDPOINT` settings.

## CLI

Commands run from `cli/`:

```bash
gofmt -l .
go test -count=1 ./...
go test -race -count=1 ./...
go vet ./...
go build -o /tmp/complyaigent-pg .
/tmp/complyaigent-pg --help
make check-quality
```

Observed:

- Formatting, tests, race tests, vet, and build completed successfully.
- All Go test packages reported `[no test files]`; this is not meaningful test coverage.
- The binary printed its command list, then rejected `--help` as an unknown command.
- `make check-quality` failed at `cli/Makefile:17` because a stray backtick is executed after `go mod tidy`.

## Required Follow-up

- Add real CLI unit tests and a nonzero test-count guard.
- Add a valid `help` command or document that only the listed subcommands are supported.
- Remove the stray Makefile backtick.
- Keep live provider probes bounded and manual; use mocks for normal CI.

## Database Runtime

Local checks used disposable resources only:

- SQLite schema initialization passed.
- SQLite-backed backend `/health` returned `{"status":"healthy"}`.
- Rootless Podman PostgreSQL 16 accepted `pg_isready` and a SQL query.
- PostgreSQL schema initialization passed.
- PostgreSQL-backed backend `/health` returned `{"status":"healthy"}`.

The application currently creates a synchronous SQLModel engine. Use a
`postgresql://` URL for the current implementation, not
`postgresql+asyncpg://`. The latter requires an async engine/driver change.

The existing `scripts/integration-test.sh` is not isolated from `.env`: its
validation tests reached the configured Groq endpoint. With the current local
credential value, those requests returned HTTP 401. The suite also exposed a
detached `ActivityLog` instance failure. Future tests must inject a fake
validator and use a test database explicitly.

## Self-hosted Compose

The development stack was started with rootless Podman after qualifying the
pgvector image and forcing the backend to use the local Postgres service:

```bash
POSTGRES_USER=comply \
POSTGRES_PASSWORD=complyaigent2026 \
POSTGRES_DB=complyaigent \
podman compose -f docker/docker-compose.build.yml up -d
```

Observed:

- `docker_postgres_1` became healthy.
- `docker_backend_1` initialized the database and returned HTTP 200 from `/health`.
- `docker_frontend_1` returned HTTP 200 from `http://127.0.0.1:3000`.

Podman failed before this fix because `pgvector/pgvector:pg16` was an
unqualified image name and short-name resolution required an interactive
prompt. Compose files now use `docker.io/pgvector/pgvector:pg16` explicitly.

The frontend development container also failed once because Next.js 16
inferred `/app/app` as the Turbopack workspace root. `frontend/next.config.ts`
now sets `turbopack.root` to the project directory. After rebuilding the
frontend service, both the frontend and backend returned HTTP 200.

## Failure Modes Covered

| Failure | Expected behavior | Verification |
|---|---|---|
| Image-only PDF | Task becomes `failed` with an explicit extraction reason | `backend/tests/test_extractor.py` and live fixture upload |
| Unsupported upload extension | API returns HTTP 415 | `backend/tests/integration/test_ingestion.py` |
| Duplicate policy bytes | Existing task ID is returned | `backend/tests/test_policy_versioning.py` |
| Revised policy | New task keeps policy ID and previous-version lineage | `backend/tests/test_policy_versioning.py` |
| Categorizer transient failure | Worker retries, bounded to three attempts | `backend/tests/test_retry_failures.py` |
| Categorizer exhaustion / zero rules | Task becomes `failed`, never successful empty ingestion | `backend/tests/test_retry_failures.py` |
| Email, phone, or Luhn-valid card in validation input | PII gate returns HIGH and skips the LLM validator | `backend/tests/integration/test_validation.py` |
| MID validation | Only pending entries appear in HITL; approve/reject persists status | `backend/tests/integration/test_validation.py`, `frontend/tests/e2e/hitl.spec.ts` |
| Backend unavailable | Dashboard shows an error and no fabricated metrics/approval state | `frontend/tests/e2e/local-runtime.spec.ts` |
| Existing Postgres schema lacks new metadata columns | Additive startup migration repairs the local schema | `backend/app/core/db.py`, live `/regulation` check |
| Podman short-name resolution | Compose uses explicit registry-qualified images | `scripts/compose-smoke.sh` |
| LLM credential or plan failure | Test suite uses fakes; live provider probes remain bounded and separate | Provider probe baseline above |

Known residual warnings are dependency/configuration warnings, not test
failures: the backend reports an unsupported `asyncio_mode` pytest option and
the frontend runtime reports Node's `module.register()` deprecation warning.
