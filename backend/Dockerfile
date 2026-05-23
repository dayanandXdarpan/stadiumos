# ── StadiumOS Backend Dockerfile ──────────────────────────────────────
# Multi-stage build: deps → runtime with non-root user for security.
# Cloud Run sets PORT=8080 automatically; we honour it at runtime.
# ───────────────────────────────────────────────────────────────────────

FROM python:3.11-slim AS builder

WORKDIR /app

# Install deps in a separate layer for caching
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Runtime stage ──────────────────────────────────────────────────────
FROM python:3.11-slim AS runtime

# Create non-root user (security best practice)
RUN groupadd --gid 1001 appgroup \
    && useradd --uid 1001 --gid appgroup --shell /bin/bash --create-home appuser

WORKDIR /app

# Copy installed packages from builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy application source
COPY --chown=appuser:appgroup . .

# Remove any committed secrets / databases that shouldn't be in the image
RUN rm -f .env edge_sync.db

USER appuser

# Cloud Run injects PORT env var (default 8080).
# We pass it through to uvicorn at container startup.
EXPOSE 8080

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --workers 1 --log-level info"]
