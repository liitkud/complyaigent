FROM python:3.12-slim AS runner
WORKDIR /app

# Install curl + runtime deps
RUN apt-get update && apt-get install -y \
    curl libpq5 libssl3 ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
    && mv /root/.local/bin/uv /usr/local/bin/uv

ENV HOME=/app
ENV UV_CACHE_DIR=/app/.uv_cache
ENV UV_PYTHON_INSTALL_DIR=/app/.uv_python

RUN addgroup --system aigent && adduser --system --group aigent \
    && chown -R aigent:aigent /app

# Copy project files
COPY pyproject.toml uv.lock ./
COPY --chown=aigent:aigent . /app/

USER aigent

# Create fresh venv as the non-root user
# We explicitly use the system python to prevent uv from downloading another one
ENV UV_PYTHON=/usr/local/bin/python
RUN uv sync --frozen --no-dev --no-cache

ENV PATH="/app/.venv/bin:$PATH"
CMD ["uv", "run", "uvicorn", "main:app", "--port", "80", "--host", "0.0.0.0"]
