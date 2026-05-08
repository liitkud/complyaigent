FROM python:3.12-slim

# Install uv.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Do not include development packages.
ENV UV_NO_DEV=1

# Copy the application into the container.
COPY . /app

# Install the application dependencies.
WORKDIR /app
RUN uv sync --frozen --no-cache

# Run the application.
CMD ["/app/.venv/bin/uvicorn", "main:app", "--port", "80", "--host", "0.0.0.0"]
