#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

echo "=== ComplyAIgent 5s SLA Load Test Runner ==="
echo "Backend directory: ${BACKEND_DIR}"

# Set deterministic mock environment variables for test execution
export PYTHONPATH="${PYTHONPATH:-}:.:${BACKEND_DIR}"
export DATABASE_URL="${DATABASE_URL:-sqlite://}"
export LLM_API_KEY="${LLM_API_KEY:-test-only}"
export LLM_ENDPOINT="${LLM_ENDPOINT:-http://127.0.0.1:9/v1}"
export CHAT_MODEL="${CHAT_MODEL:-test-only}"

cd "${BACKEND_DIR}"

echo "Executing asynchronous concurrent load tests (50 concurrent /validate and /reg requests)..."
uv run python -m pytest tests/load/ -v -s

echo "=== Load Test Benchmark PASSED: All 50 concurrent requests met < 5.0s SLA ==="
