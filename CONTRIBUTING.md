# Contributing to StadiumOS 🏟️

First off, thank you for helping construct the future of smart venue infrastructure! StadiumOS integrates high-throughput ingestion, multi-agent AI, and real-time 3D spatial twins. 

To maintain a production-grade, secure, and resilient codebase, please follow this guide.

---

## 🛠️ Local Environment Calibration

Ensure you have the core dependencies established before contributing:
- **FastAPI Core**: Python 3.11+, virtual environment configured, and uvicorn running on port 8000.
- **Admin Dashboard**: Node.js 20+ and Next.js 16 (with Turbopack).
- **Mobile Fan Client**: Flutter SDK v3.x.
- **Persistence**: Local Redis and PostgreSQL (with PostGIS extensions) or Supabase.

---

## 🌿 Branching & Commit Guidelines

We enforce a structured, industry-standard git workflow:

### Branch Naming Conventions
- `feat/` for new features (e.g. `feat/supervisor-tablet-view`)
- `bugfix/` for bug repairs (e.g. `bugfix/websocket-payload-parser`)
- `docs/` for document updates (e.g. `docs/update-installation-guide`)
- `refactor/` for code restructuring (e.g. `refactor/custom-painter-optimization`)

### Semantic Commit Messages
Keep commits atomic and descriptive, prefixing them with appropriate tags:
- `feat: add 3D seat mapping swoop animations`
- `fix: resolve camera check exceptions under Android emulators`
- `refactor: optimize Blackboard Redis hashes`
- `docs: update PRD operational metrics`

---

## 🤖 Code Style & Quality Standards

### Next.js (TypeScript)
- Maintain rigorous **TypeScript typings**. Avoid using `any` unless mapping generic websocket raw JSON envelopes.
- Keep standard **CSS Custom Variables** in `globals.css` rather than writing ad-hoc inline styles.
- Components must remain modular and utilize React's `useMemo` or `useCallback` inside render loop animations (like canvas rendering).

### Flutter (Dart)
- Follow standard **linter definitions** in `analysis_options.yaml`.
- Dispose of all `AnimationControllers`, `Streams`, and `VideoPlayerControllers` cleanly to avoid memory leaks.
- Ensure all Canvas `CustomPainters` have robust fallbacks (such as wireframe grid tunnels) to allow emulator operations when live sensors or video assets are missing.

### FastAPI (Python)
- Document all REST/WebSocket endpoints using **Pydantic schemas**.
- Run asyncio tasks cleanly inside FastAPI lifespans. Always lock asynchronous Blackboard read/writes.

---

## 🔐 Zero-PII Privacy Compliance

Every contribution *must* comply with the Zero-PII Security Architecture:
1. **Edge-only frames**: Edge CCTV feeds running YOLOv8 count densities locally and immediately discard frames. Never transmit video feeds or facial biometrics downstream.
2. **Session Hash Tokens**: Fans generate randomized session hashes. No raw user coordinates are linked to personal names.

*Review **[stadiumos_architecture_spec.md](file:///c:/Users/deepa/Desktop/stadiumos/stadiumos_architecture_spec.md)** for detailed spatial tables and GDPR bounding box compliance specifications.*
