# Local Compose Runtime Smoke

This check is local-only. It does not pull images, build images, start or stop
containers, or call cloud services. Start the development stack separately
with images that are already available on the machine.

The tested compose file is `docker/docker-compose.build.yml`. It runs:

- PostgreSQL at `127.0.0.1:5432`.
- The backend at `127.0.0.1:8000`.
- The frontend at `127.0.0.1:3000`.

## Run the smoke check

Use rootless Podman:

```bash
CONTAINER_ENGINE=podman ./scripts/compose-smoke.sh
```

Use the Docker-compatible command path:

```bash
CONTAINER_ENGINE=docker ./scripts/compose-smoke.sh
```

On this host, `docker` is a compatibility wrapper for Podman and both commands
use `podman-compose`.

The script checks all of the following within bounded command timeouts:

- PostgreSQL accepts connections with `pg_isready`.
- The backend returns `{"status":"healthy"}` from `/health`.
- The frontend returns HTTP 200.
- The backend has an explicit self-hosted URL in the form
  `postgresql://...@postgres:5432/...`, rather than SQLite or a hosted database.

The script assumes the stack is already running. It intentionally uses no
`up`, `build`, `pull`, or `down` command.

## Start the local stack

Only run this when the required images are already cached, or when image
access is explicitly allowed:

```bash
POSTGRES_USER=comply \
POSTGRES_PASSWORD=complyaigent2026 \
POSTGRES_DB=complyaigent \
podman compose -f docker/docker-compose.build.yml up -d
```

The compose file uses the fully qualified image
`docker.io/pgvector/pgvector:pg16`; this avoids Podman's interactive
short-name resolution prompt. The backend environment overrides the `.env`
value with the local service URL:
`postgresql://comply:complyaigent2026@postgres:5432/complyaigent`.

## Release workflow boundary

The smoke procedure does not invoke GitHub Actions or any release command. The
existing `.github/workflows/release.yml` is still deployment-capable: it logs
into GHCR, pushes backend and frontend images, and creates GitHub releases for
version tags. Treat that workflow as out of bounds for local verification and
do not run it from this branch. Disabling it requires a separate workflow-owned
change; no deployment workflow was invoked during this baseline.
