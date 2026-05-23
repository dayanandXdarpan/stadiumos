#!/bin/sh
# ── StadiumOS — Unified Startup Script ──────────────────────────────────
# Launches FastAPI backend, Next.js admin, and nginx reverse proxy
# inside a single Cloud Run container.
# ────────────────────────────────────────────────────────────────────────

echo "╔══════════════════════════════════════════════════╗"
echo "║          StadiumOS — Starting Services           ║"
echo "╚══════════════════════════════════════════════════╝"

# ── Substitute PORT into nginx config ────────────────────────────────────
export PORT="${PORT:-8080}"
sed -i "s/listen 8080;/listen ${PORT};/" /etc/nginx/nginx.conf
echo "[nginx]   Configured to listen on port ${PORT}"

# ── Start FastAPI backend (background) ───────────────────────────────────
echo "[backend] Starting FastAPI on :8000 ..."
cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info &
BACKEND_PID=$!

# ── Start Next.js admin (background) ────────────────────────────────────
echo "[admin]   Starting Next.js on :3000 ..."
cd /app/admin
PORT=3000 HOSTNAME=0.0.0.0 node_modules/.bin/next start -p 3000 &
ADMIN_PID=$!

# ── Wait for backends to be ready ────────────────────────────────────────
echo "[startup] Waiting for services to become healthy ..."
RETRIES=0
MAX_RETRIES=30

# Wait for FastAPI
while [ "$RETRIES" -lt "$MAX_RETRIES" ]; do
    if curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1; then
        echo "[backend] ✓ Healthy"
        break
    fi
    RETRIES=$((RETRIES + 1))
    sleep 1
done
if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "[startup] ✗ Backend failed to start after ${MAX_RETRIES}s"
fi

# Wait for Next.js
RETRIES=0
while [ "$RETRIES" -lt "$MAX_RETRIES" ]; do
    if curl -sf http://127.0.0.1:3000 > /dev/null 2>&1; then
        echo "[admin]   ✓ Healthy"
        break
    fi
    RETRIES=$((RETRIES + 1))
    sleep 1
done
if [ "$RETRIES" -ge "$MAX_RETRIES" ]; then
    echo "[startup] ✗ Admin failed to start after ${MAX_RETRIES}s"
fi

# ── Start nginx in foreground (Cloud Run needs a foreground process) ─────
echo "[nginx]   Starting reverse proxy on :${PORT} ..."
echo "╔══════════════════════════════════════════════════╗"
echo "║          StadiumOS — All Services Running        ║"
echo "║   API:    http://localhost:${PORT}/api/state       ║"
echo "║   Admin:  http://localhost:${PORT}/                ║"
echo "║   WS:     ws://localhost:${PORT}/ws                ║"
echo "║   Health: http://localhost:${PORT}/health           ║"
echo "╚══════════════════════════════════════════════════╝"

# Graceful shutdown — POSIX sh uses TERM/INT (not SIGTERM/SIGINT)
cleanup() {
    echo "[shutdown] Stopping ..."
    kill "$BACKEND_PID" "$ADMIN_PID" 2>/dev/null || true
    nginx -s quit 2>/dev/null || true
    exit 0
}
trap cleanup TERM INT

# nginx in foreground — this keeps the container alive
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait for any process to exit
wait $NGINX_PID
