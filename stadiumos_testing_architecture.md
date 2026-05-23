# StadiumOS Testing Architecture & Security Specifications

This document outlines the testing architecture, validation protocols, and integration systems implemented to elevate the **StadiumOS** platform to enterprise-grade stability, concurrency handling, and compliance.

---

## 🗺️ 1. Core Testing Methodology

StadiumOS leverages a **Decoupled Blackboard State & Active Agent Mocking** paradigm to ensure 100% test reliability, deterministic outcomes, and speed. Testing operates on three distinct layers:

```
┌────────────────────────────────────────────────────────┐
│                    FastAPI Client                      │
└──────────────────────────┬─────────────────────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Blackboard Layer                     │
│         (State manager & concurrency locks)            │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼ (Online Sync)            ▼ (Offline Mode)
┌──────────────────────────────┐  ┌──────────────────────┐
│          MockRedis           │  │   SQLite Temp DB     │
│   (Per-test isolation dict)  │  │ (Active Queue Cache) │
└──────────────────────────────┘  └──────────────────────┘
```

### 1.1 Concurrency & Thread-Safety
The `Blackboard` employs `asyncio.Lock` to guarantee thread-safe read/write operations during high-frequency telemetry updates from multi-agent worker threads. Automated tests validate:
- State integrity under rapid successive mutations.
- Safety-buffer reductions during weather anomalies (ClimaSync re-allocations).

### 1.2 Redis Sync Interception
To support zero-configuration local development and rapid testing, all Redis interactions are managed via a write-through layer. In testing, `conftest.py` intercepts calls to `redis.Redis.from_url` and dynamically injects an isolated `MockRedis` dictionary for each test case. This prevents cross-test state contamination, eliminates KeyErrors, and ensures database queries remain local and fast.

---

## 🧪 2. Automated Test Suite Layout

The testing suite resides under [backend/tests/](file:///C:/Users/deepa/Desktop/stadiumos/backend/tests/) and is managed using `pytest` and `pytest-asyncio`.

### 2.1 Test Configurations (`conftest.py`)
- **Isolated State Workspaces**: Every test run automatically configures temporary, dedicated SQLite databases (`test_edge_sync.db`), removing files post-test.
- **Asynchronous Mocks**: Provides global `mock_broadcast` fixtures to verify that WebSocket pushes are dispatched accurately upon state changes.

### 2.2 Blackboard Verification (`test_blackboard.py`)
- **CPS Boundary Transitions**: Asserts that sectors auto-transition based on Crowd Pressure Scores (CPS):
  - `CPS < 0.75` $\rightarrow$ `status: "normal"`
  - `0.75 <= CPS < 0.90` $\rightarrow$ `status: "warning"`
  - `CPS >= 0.90` $\rightarrow$ `status: "critical"`
- **Capacity Limits**: Verifies the decision ledger is strictly capped at `100` entries and active alerts are capped at `50` to prevent memory leaks under massive crowd loads.
- **Storm Safety Buffers**: Confirms that when weather storms are triggered, the CPS alert threshold reduces by **25%** (down to `0.5625`), immediately converting normal sectors with high congestion into active warning states.

### 2.3 Edge Offline Sync Verification (`test_edge_sync.py`)
- **SQLite Database Integrity**: Checks table schemas for `offline_scans` and `offline_sector_logs`.
- **Telemetry Queueing**: Asserts that when the perimeter network drops, sensor logs are queued in SQLite rather than dropping packets.
- **Counterfeit Ticket Detections**: Verifies that when double-scanned duplicate barcodes are recorded offline, the sync worker identifies the collision, flags the second scan as `FRAUD`, raises high-severity alerts, and registers security dispatches.

### 2.4 Endpoints Verification (`test_endpoints.py`)
- Uses `fastapi.testclient.TestClient` to verify every API contract.
- **Surge & Fraud Injections**: Validates edge case inputs, asserting `404 Not Found` for invalid sectors (e.g. `XYZ`) and invalid gate configurations.
- **NLP Fallback Routing**: Asserts that `ops_query` correctly routes intent mappings (like weather queries to `weather_status` and bottleneck lookups to `crowd_status`) when external Gemini API credentials are absent.
- **Debrief Report Compilation**: Confirms that the Post-Match Operational debrief successfully compiles complete Markdown forensics.

---

## 🔐 3. Security & GDPR Zero-PII Protections

StadiumOS’s testing architecture validates our **Privacy-First Data Isolation** model:
1. **No Biometric Caching**: CCTV edge nodes only transmit clean integer counts (`density` and `velocity`). Automated tests assert that raw stream inputs or identifying profiles are never compiled in central logs.
2. **Cryptographic Token Grids**: Location data checks confirm that telemetry records utilize temporary session hashes and coordinates are converted to coarse sector bounding boxes, fully anonymizing individual movements.
