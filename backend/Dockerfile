FROM ghcr.io/astral-sh/uv:alpine AS dependencies
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
ENV UV_NO_DEV=1
WORKDIR /app
COPY pyproject.toml requirements.txt uv.lock .
RUN uv sync --frozen --no-cache

FROM python:alpine AS runner
WORKDIR /app
RUN addgroup -S aigent && adduser -S aigent -G aigent
COPY --from=dependencies --chown=aigent:aigent /app/.venv ./.venv
USER aigent
CMD ["/app/.venv/bin/uvicorn", "main:app", "--port", "80", "--host", "0.0.0.0"]