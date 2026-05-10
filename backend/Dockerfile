FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS dependencies
ENV UV_NO_DEV=1
WORKDIR /app
COPY pyproject.toml requirements.txt uv.lock ./
RUN uv sync --frozen --no-cache

FROM python:3.12-slim AS runner
WORKDIR /app
RUN addgroup --system aigent && adduser --system --group aigent
COPY --from=dependencies --chown=aigent:aigent /app/.venv ./.venv
USER aigent
CMD ["/app/.venv/bin/uvicorn", "main:app", "--port", "80", "--host", "0.0.0.0"]
