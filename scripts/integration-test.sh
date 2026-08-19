#!/bin/bash
set -euo pipefail

# purpose: MUST rule - one integration test for core user journey
echo "Starting integration tests..."

# Ensure we are in the project root
cd "$(dirname "$0")/.."

# Set mock env vars
export PYTHONPATH="${PYTHONPATH:-}:.:backend"
export DATABASE_URL="sqlite://"
export LLM_API_KEY="test-only"
export LLM_ENDPOINT="http://127.0.0.1:9/v1"
export CHAT_MODEL="test-only"

# Run pytest
cd backend && uv run pytest tests/integration

echo "Integration tests passed!"
