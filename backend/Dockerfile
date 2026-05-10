FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS dependencies
ENV UV_NO_DEV=1
WORKDIR /app
COPY pyproject.toml requirements.txt uv.lock ./
RUN uv sync --frozen --no-cache --python /usr/local/bin/python

FROM python:3.12-slim AS runner
WORKDIR /app
RUN addgroup --system aigent && adduser --system --group aigent
COPY --from=dependencies --chown=aigent:aigent /app/.venv ./.venv
ENV PATH="/app/.venv/bin:$PATH"
USER aigent
CMD ["uvicorn", "main:app", "--port", "80", "--host", "0.0.0.0"]
