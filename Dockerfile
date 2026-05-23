# ══════════════════════════════════════════════════════════════════════════
# StadiumOS — Unified Dockerfile (Backend + Admin in one container)
# ══════════════════════════════════════════════════════════════════════════
# Combines FastAPI backend + Next.js admin dashboard behind nginx.
# Cloud Run gets a single container exposing one port ($PORT / 8080).
#
#   /api/* /ws /health  →  FastAPI  (internal :8000)
#   /*                  →  Next.js  (internal :3000)
#   nginx reverse proxy →  :$PORT   (external :8080)
# ══════════════════════════════════════════════════════════════════════════

# ── Stage 1: Install Node.js deps for admin ──────────────────────────────
FROM node:20-alpine AS admin-deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY admin/package*.json ./
RUN npm ci

# ── Stage 2: Build Next.js admin ─────────────────────────────────────────
FROM node:20-alpine AS admin-builder
WORKDIR /app
COPY --from=admin-deps /app/node_modules ./node_modules
COPY admin/ .

# Build-time env vars (overridable via --build-arg)
ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_WS_URL=
ARG NEXT_PUBLIC_API_TOKEN=stadiumos-demo-token

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_TOKEN=$NEXT_PUBLIC_API_TOKEN
ENV NEXT_TELEMETRY_DISABLED=1

RUN mkdir -p public
RUN npm run build

# ── Stage 3: Install Python deps for backend ─────────────────────────────
FROM python:3.11-slim AS backend-builder
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

# ── Stage 4: Final runtime — nginx + python + node ───────────────────────
FROM python:3.11-slim AS runtime

# Install Node.js 20 + nginx + curl (for health checks)
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        gnupg \
        nginx \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Create app directories
RUN mkdir -p /app/backend /app/admin

# ── Copy Python packages from builder ────────────────────────────────────
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages \
     /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# ── Copy backend source ─────────────────────────────────────────────────
WORKDIR /app/backend
COPY backend/ .
# Remove dev artifacts that shouldn't be in the image
RUN rm -f .env edge_sync.db .dockerignore

# ── Copy admin build ────────────────────────────────────────────────────
WORKDIR /app/admin
COPY --from=admin-builder /app/package.json ./package.json
COPY --from=admin-builder /app/node_modules ./node_modules
COPY --from=admin-builder /app/.next ./.next
COPY --from=admin-builder /app/public ./public

# ── Copy nginx config + startup script ───────────────────────────────────
COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /app/start.sh
# Strip Windows CRLF line endings that break /bin/sh
RUN sed -i 's/\r$//' /app/start.sh /etc/nginx/nginx.conf \
    && chmod +x /app/start.sh

# Nginx needs write access to these
RUN mkdir -p /var/lib/nginx/body /var/lib/nginx/proxy \
    && chown -R www-data:www-data /var/lib/nginx /var/log/nginx

WORKDIR /app

# Cloud Run expected port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["/app/start.sh"]
