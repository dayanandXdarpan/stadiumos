# ══════════════════════════════════════════════════════════════════════════
# StadiumOS — Developer Makefile
# Usage: make <target>
# ══════════════════════════════════════════════════════════════════════════

.PHONY: help dev-backend dev-admin dev docker-up docker-down test-backend \
        install-backend install-admin install build-admin deploy-backend \
        deploy-admin logs clean

# ── Default: show help ─────────────────────────────────────────────────────
help:
	@echo ""
	@echo "  StadiumOS Developer Commands"
	@echo "  ════════════════════════════"
	@echo "  make install          Install all dependencies"
	@echo "  make dev              Start backend + admin in parallel (requires tmux/honcho)"
	@echo "  make dev-backend      Start Python backend only (port 8000)"
	@echo "  make dev-admin        Start Next.js admin only (port 3000)"
	@echo "  make docker-up        Start all services via docker-compose"
	@echo "  make docker-down      Stop all docker-compose services"
	@echo "  make test-backend     Run backend pytest suite"
	@echo "  make build-admin      Build Next.js production bundle"
	@echo "  make deploy-backend   Submit Cloud Build for backend service"
	@echo "  make deploy-admin     Submit Cloud Build for admin dashboard"
	@echo "  make logs             Tail docker-compose logs"
	@echo "  make clean            Remove .next, __pycache__, .venv artifacts"
	@echo ""

# ── Installation ───────────────────────────────────────────────────────────
install: install-backend install-admin
	@echo "✅  All dependencies installed."

install-backend:
	@echo "📦  Installing backend Python dependencies..."
	cd backend && pip install -r requirements.txt

install-admin:
	@echo "📦  Installing admin Node.js dependencies..."
	cd admin && npm ci

# ── Development ────────────────────────────────────────────────────────────
dev-backend:
	@echo "🚀  Starting StadiumOS backend on http://localhost:8000 ..."
	cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload --log-level info

dev-admin:
	@echo "🚀  Starting StadiumOS admin on http://localhost:3000 ..."
	cd admin && npm run dev

# Requires 'concurrently' (npm i -g concurrently) or run in separate terminals
dev:
	@echo "🚀  Starting backend + admin concurrently..."
	@command -v concurrently >/dev/null 2>&1 && \
		concurrently -n backend,admin -c cyan,magenta \
		  "cd backend && uvicorn main:app --host 0.0.0.0 --port 8000 --reload" \
		  "cd admin && npm run dev" \
	|| (echo "⚠️  Run 'make dev-backend' and 'make dev-admin' in separate terminals." && exit 1)

# ── Testing ────────────────────────────────────────────────────────────────
test-backend:
	@echo "🧪  Running backend tests..."
	cd backend && python -m pytest tests/ -v --tb=short

# ── Build ──────────────────────────────────────────────────────────────────
build-admin:
	@echo "🔨  Building Next.js admin for production..."
	cd admin && npm run build

# ── Docker ────────────────────────────────────────────────────────────────
docker-up:
	@echo "🐳  Starting StadiumOS via docker-compose..."
	docker compose up -d redis backend

docker-down:
	@echo "🛑  Stopping all docker-compose services..."
	docker compose down

logs:
	docker compose logs -f

# ── Cloud Run Deployment ───────────────────────────────────────────────────
# Set GCP_PROJECT before deploying: export GCP_PROJECT=your-project-id
deploy-backend:
	@echo "☁️   Deploying backend to Cloud Run..."
	gcloud builds submit ./backend \
	  --config=backend/cloudbuild.yaml \
	  --project=$(GCP_PROJECT)

deploy-admin:
	@echo "☁️   Deploying admin to Cloud Run..."
	gcloud builds submit ./admin \
	  --config=admin/cloudbuild.yaml \
	  --project=$(GCP_PROJECT) \
	  --substitutions=_BACKEND_URL=$(BACKEND_URL),_BACKEND_WS_URL=$(BACKEND_WS_URL),_API_TOKEN=$(API_TOKEN)

# ── Clean ─────────────────────────────────────────────────────────────────
clean:
	@echo "🧹  Cleaning build artifacts..."
	rm -rf admin/.next admin/node_modules
	find backend -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find backend -name "*.pyc" -delete 2>/dev/null || true
	@echo "✅  Clean complete."
