#!/bin/bash
set -e

# purpose: MUST rule - one integration test for core user journey
echo "Starting integration tests..."

# Ensure we are in the project root
cd "$(dirname "$0")/.."

# Set mock env vars
export PYTHONPATH=$PYTHONPATH:.:backend
export DATABASE_URL="sqlite:///./test.db"
export SUPABASE_URL="http://localhost:54321"
export SUPABASE_KEY="test" # pragma: allowlist secret
export GEMINI_API_KEY="test" # pragma: allowlist secret

# Run pytest
cd backend && uv run pytest tests/integration

echo "Integration tests passed!"
