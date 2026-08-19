#!/usr/bin/env bash
set -euo pipefail

# Check an already-running local compose stack. This script never pulls,
# builds, starts, stops, or contacts a remote service.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-${ROOT_DIR}/docker/docker-compose.build.yml}"
CONTAINER_ENGINE="${CONTAINER_ENGINE:-podman}"

case "${CONTAINER_ENGINE}" in
  podman|docker) ;;
  *)
    printf 'unsupported CONTAINER_ENGINE: %s\n' "${CONTAINER_ENGINE}" >&2
    exit 2
    ;;
esac

compose() {
  "${CONTAINER_ENGINE}" compose -f "${COMPOSE_FILE}" "$@"
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    printf 'missing command: %s\n' "$1" >&2
    exit 2
  }
}

require_command "${CONTAINER_ENGINE}"
require_command curl

printf 'compose file: %s\n' "${COMPOSE_FILE}"
printf 'container engine: %s\n' "${CONTAINER_ENGINE}"

printf 'Postgres readiness: '
compose exec -T postgres pg_isready -U comply -d complyaigent

database_url="$(compose exec -T backend printenv DATABASE_URL)"
case "${database_url}" in
  postgresql://*@postgres:5432/*) ;;
  *)
    printf 'backend DATABASE_URL is not an explicit self-hosted Postgres URL: %s\n' "${database_url}" >&2
    exit 1
    ;;
esac
printf 'DATABASE_URL: explicit self-hosted Postgres (%s)\n' "${database_url#postgresql://*@}"

printf 'backend /health: '
health_response="$(curl --fail --silent --show-error --max-time 5 -w $'\n%{http_code}' http://127.0.0.1:8000/health)"
health="${health_response%$'\n'*}"
health_status="${health_response##*$'\n'}"
if [[ "${health_status}" != 200 || "${health}" != *'"status":"healthy"'* ]]; then
  printf 'unexpected response: HTTP %s %s\n' "${health_status}" "${health}" >&2
  exit 1
fi
printf 'HTTP 200 (%s)\n' "${health}"

printf 'frontend HTTP: '
frontend_status="$(curl --fail --silent --show-error --max-time 5 -o /dev/null -w '%{http_code}' http://127.0.0.1:3000)"
if [[ "${frontend_status}" != 200 ]]; then
  printf 'unexpected frontend status: HTTP %s\n' "${frontend_status}" >&2
  exit 1
fi
printf 'HTTP 200\n'

printf 'compose smoke passed\n'
