# Build context must be the repo root (not backend/), since this installs
# the tradingagents package the backend depends on. On Railway/Render, set
# the Dockerfile path to backend/Dockerfile while keeping the build/root
# context at the repo root.
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app
COPY . .

# backend/requirements.txt starts with "-e .." which resolves to /app here,
# installing the tradingagents package the backend imports.
RUN pip install --no-cache-dir -r backend/requirements.txt

EXPOSE 8000
# Shell form so $PORT expands - Railway/Render inject it at runtime and it
# isn't always 8000.
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}
