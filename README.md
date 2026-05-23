<p align="center">
  <img src="docs/assets/hero_banner.png" alt="StadiumOS Hero Banner" width="100%" />
</p>

<h1 align="center">🏟️ StadiumOS</h1>

<p align="center">
  <strong>AI-Agent Powered Adaptive Stadium Intelligence Platform</strong><br/>
  <em>A cooperative multi-agent swarm system for real-time crowd safety, fan engagement, and operational intelligence.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/StadiumOS-v1.0.0-blueviolet?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgMThjLTQuNDIgMC04LTMuNTgtOC04czMuNTgtOCA4LTggOCAzLjU4IDggOC0zLjU4IDgtOCA4eiIvPjwvc3ZnPg==" alt="StadiumOS" />
  <img src="https://img.shields.io/badge/Build_With_AI-Agentic_Premier_League-00D4FF?style=for-the-badge" alt="Agentic Premier League" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Next.js-16.2-000000?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Flutter-3.x-02569B?style=flat-square&logo=flutter" alt="Flutter" />
  <img src="https://img.shields.io/badge/Python-3.11-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Dart-3.x-0175C2?style=flat-square&logo=dart&logoColor=white" alt="Dart" />
  <img src="https://img.shields.io/badge/Redis-7-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Gemini_AI-1.5_Flash-4285F4?style=flat-square&logo=google&logoColor=white" alt="Gemini" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Cloud_Run-Deploy-4285F4?style=flat-square&logo=google-cloud&logoColor=white" alt="Cloud Run" />
</p>

<p align="center">
  <a href="#-overview">Overview</a> •
  <a href="#-showcase">Showcase</a> •
  <a href="#-system-architecture">Architecture</a> •
  <a href="#-ai-agent-swarm">AI Agents</a> •
  <a href="#-features">Features</a> •
  <a href="#-quick-start">Quick Start</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-deployment">Deployment</a> •
  <a href="#-contributing">Contributing</a>
</p>

<br/>

---

<br/>

## 📖 Overview

**StadiumOS** is a production-grade, AI-driven stadium management platform that employs a **cooperative multi-agent swarm** architecture to orchestrate real-time crowd safety, intelligent rerouting, fraud detection, weather adaptation, sentiment analysis, and emergency response — all unified through a **Blackboard shared-state system** powered by Redis.

<table>
  <tr>
    <td width="33%" align="center">
      <h3>🖥️ Admin Dashboard</h3>
      <p>Next.js 16 command center with 3D Digital Twin, NLP OpsCommander, and live agent telemetry</p>
    </td>
    <td width="33%" align="center">
      <h3>⚙️ Backend Brain</h3>
      <p>FastAPI server running 6 autonomous AI agents on async tick loops with WebSocket broadcast</p>
    </td>
    <td width="33%" align="center">
      <h3>📱 Fan App</h3>
      <p>Flutter mobile experience with AR navigation, QR scanning, live alerts, and 3D seat visualization</p>
    </td>
  </tr>
</table>

> **🏆 Built for**: [Build with AI — Agentic Premier League 2026](https://www.dayananddarpan.in/)
>
> 🌐 **Live Deployed App**: [StadiumOS Live Platform](https://stadiumosapl-28214196375.europe-west1.run.app/)
>
> ### 🖥️ Live Deployed Page Directory
> * 🏠 **Command Center (Home)**: [stadiumosapl-28214196375.europe-west1.run.app/](https://stadiumosapl-28214196375.europe-west1.run.app/)
> * 🔐 **Operator Login**: [/login](https://stadiumosapl-28214196375.europe-west1.run.app/login)
> * 🔮 **3D Digital Twin**: [/digital-twin](https://stadiumosapl-28214196375.europe-west1.run.app/digital-twin)
> * 🗺️ **Crowd Heatmap**: [/crowd-map](https://stadiumosapl-28214196375.europe-west1.run.app/crowd-map)
> * 🚨 **Active Alerts**: [/alerts](https://stadiumosapl-28214196375.europe-west1.run.app/alerts)
> * 🤖 **Agent Decision Ledger**: [/agent-ledger](https://stadiumosapl-28214196375.europe-west1.run.app/agent-ledger)
> * 💬 **Ops Commander NLP**: [/ops-commander](https://stadiumosapl-28214196375.europe-west1.run.app/ops-commander)
> * 👁️ **Supervisor Console (HITL)**: [/supervisor](https://stadiumosapl-28214196375.europe-west1.run.app/supervisor)
> * 🎛️ **Scenario Simulation**: [/simulation](https://stadiumosapl-28214196375.europe-west1.run.app/simulation)
> * 📖 **FastAPI Swagger Docs**: [/docs](https://stadiumosapl-28214196375.europe-west1.run.app/docs)
> * ℹ️ **About Platform**: [/about](https://stadiumosapl-28214196375.europe-west1.run.app/about)
> * 🔒 **Privacy & Compliance**: [/privacy](https://stadiumosapl-28214196375.europe-west1.run.app/privacy)

<br/>

---

<br/>

## 🎬 Showcase

<table>
  <tr>
    <td width="60%">
      <img src="docs/assets/admin_dashboard.png" alt="Admin Dashboard — Command Center" width="100%" />
      <p align="center"><strong>Admin Dashboard</strong> — Real-time command center with 16-sector CPS heatmap, agent activity feed, and system status</p>
    </td>
    <td width="40%">
      <img src="docs/assets/fan_app_mockup.png" alt="Fan App — 3D Seat View & AR Navigation" width="100%" />
      <p align="center"><strong>Fan App</strong> — 3D seat map, AR navigation, and live alerts with cyberpunk UI</p>
    </td>
  </tr>
</table>

<br/>

---

<br/>

## 🏗️ System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph "🔵 Client Tier"
        ADMIN["🖥️ Admin Dashboard<br/><small>Next.js 16 · Port 3000</small><br/><small>3D Digital Twin · OpsCommander · Agent Ledger</small>"]
        SUPERVISOR["📋 Supervisor View<br/><small>/supervisor route</small><br/><small>HITL approval · Dispatch monitoring</small>"]
        FAN["📱 Fan App<br/><small>Flutter 3.x · Dart</small><br/><small>AR Nav · QR Scanner · 3D Seats</small>"]
    end

    subgraph "🟢 Service Tier — FastAPI Brain"
        API["⚙️ FastAPI Server<br/><small>Port 8000 · Python 3.11</small>"]
        WS["🔌 WebSocket Hub<br/><small>/ws endpoint</small>"]
        AGENTS["🤖 Agent Swarm<br/><small>6 Autonomous Agents</small><br/><small>3s tick loops</small>"]
        BB["📋 Blackboard<br/><small>Shared State Singleton</small>"]
    end

    subgraph "🔴 Data Tier"
        REDIS[("⚡ Redis 7<br/><small>Write-Through Cache</small><br/><small>CPS State · Sessions</small>")]
        SQLITE[("💾 SQLite<br/><small>Edge Offline DB</small><br/><small>Offline Resilience</small>")]
        FIRESTORE[("🔥 Firestore<br/><small>Cloud Persistence</small><br/><small>Match Reports · Ledger</small>")]
    end

    subgraph "☁️ External Services"
        PUBSUB["📡 Pub/Sub<br/><small>Event Ingestion</small>"]
        GEMINI["🧠 Gemini 1.5 Flash<br/><small>NLP · Debrief Gen</small>"]
        FCM["🔔 FCM<br/><small>Push Notifications</small>"]
        CLOUDRUN["☁️ Cloud Run<br/><small>Production Hosting</small>"]
    end

    ADMIN -->|"REST + WS"| API
    SUPERVISOR -->|"REST + WS"| API
    FAN -->|"REST + WS"| WS
    API --> BB
    AGENTS --> BB
    BB -->|"Write-Through"| REDIS
    BB -->|"Offline Queue"| SQLITE
    API -->|"Persist"| FIRESTORE
    PUBSUB -->|"Stream"| API
    API -->|"LLM Calls"| GEMINI
    FAN -->|"Push"| FCM
    WS -->|"Broadcast"| ADMIN
    WS -->|"Broadcast"| FAN
    CLOUDRUN -.->|"Hosts"| API

    style ADMIN fill:#7c3aed,stroke:#5b21b6,color:#fff
    style SUPERVISOR fill:#6d28d9,stroke:#5b21b6,color:#fff
    style FAN fill:#0891b2,stroke:#0e7490,color:#fff
    style API fill:#059669,stroke:#047857,color:#fff
    style WS fill:#059669,stroke:#047857,color:#fff
    style AGENTS fill:#ec4899,stroke:#db2777,color:#fff
    style BB fill:#f59e0b,stroke:#d97706,color:#fff
    style REDIS fill:#dc2626,stroke:#b91c1c,color:#fff
    style SQLITE fill:#2563eb,stroke:#1d4ed8,color:#fff
    style FIRESTORE fill:#ea580c,stroke:#c2410c,color:#fff
    style PUBSUB fill:#4285f4,stroke:#1a73e8,color:#fff
    style GEMINI fill:#4285f4,stroke:#1a73e8,color:#fff
    style FCM fill:#ea580c,stroke:#c2410c,color:#fff
    style CLOUDRUN fill:#4285f4,stroke:#1a73e8,color:#fff
```

### Data Flow Pipeline

```mermaid
graph LR
    A["📡 YOLOv8 Edge<br/><small>CCTV Frames</small>"] -->|"Integer counts only<br/><small>Frames discarded</small>"| B["⚙️ FastAPI WS<br/><small>/api/spatial/update</small>"]
    B -->|"CPS Calculation<br/><small>< 100ms</small>"| C["⚡ Redis<br/><small>Write-Through</small>"]
    C -->|"State Read"| D["🤖 Gemini Swarm<br/><small>LangChain Agents</small>"]
    D -->|"Decisions"| E["📋 Blackboard<br/><small>16-Sector Grid</small>"]
    E -->|"WS Broadcast"| F["🖥️ Dashboard<br/><small>3D Digital Twin</small>"]
    E -->|"WS Broadcast"| G["📱 Fan App<br/><small>AR + Alerts</small>"]

    style A fill:#64748b,stroke:#475569,color:#fff
    style B fill:#059669,stroke:#047857,color:#fff
    style C fill:#dc2626,stroke:#b91c1c,color:#fff
    style D fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style E fill:#f59e0b,stroke:#d97706,color:#fff
    style F fill:#7c3aed,stroke:#5b21b6,color:#fff
    style G fill:#0891b2,stroke:#0e7490,color:#fff
```

### CPS (Crowd Pressure Score) State Machine

```mermaid
stateDiagram-v2
    [*] --> CLEAR: CPS < 0.50
    CLEAR --> CAUTION: CPS ≥ 0.50
    CAUTION --> WARNING: CPS ≥ 0.75
    WARNING --> CRITICAL: CPS ≥ 0.90
    CRITICAL --> WARNING: CPS < 0.90
    WARNING --> CAUTION: CPS < 0.75
    CAUTION --> CLEAR: CPS < 0.50

    CLEAR: 🟢 CLEAR
    CAUTION: 🟡 CAUTION
    WARNING: 🟠 WARNING
    CRITICAL: 🔴 CRITICAL

    note right of WARNING
        FlowMaster reroutes traffic
        to 2 lowest-CPS sectors
    end note

    note right of CRITICAL
        EmergencyAgent triggers
        evacuation protocol
    end note
```

<br/>

---

<br/>

## 🤖 AI Agent Swarm

<p align="center">
  <img src="docs/assets/agent_swarm.png" alt="AI Agent Swarm Visualization" width="60%" />
</p>

StadiumOS employs **6 autonomous AI agents** running on asynchronous tick loops, coordinated via a shared Blackboard state pattern:

```mermaid
graph TB
    subgraph "🧠 Blackboard — Central Shared State"
        BB["📋 16-Sector Grid (A1–D4)<br/>CPS · Density · Velocity · Audio<br/>Alerts · Fraud Flags · Ledger"]
    end

    subgraph "🤖 Agent Swarm (asyncio tasks)"
        A1["🔍 CrowdIntelligence<br/><small>⏱️ 3s tick</small><br/><small>Sensor ingestion · CPS calc</small>"]
        A2["🚦 FlowMaster<br/><small>⏱️ 3s tick</small><br/><small>Traffic rerouting · 15s cooldown</small>"]
        A3["🎫 TicketSentinel<br/><small>⏱️ 2s tick</small><br/><small>Fraud detection · 8 gates</small>"]
        A4["🌩️ ClimaSync<br/><small>⏱️ 3s tick</small><br/><small>Weather adaptation · 25% buffer</small>"]
        A5["💬 SocialSentinel<br/><small>⏱️ 15s tick</small><br/><small>NLP sentiment · 5 clusters</small>"]
        A6["🚨 EmergencyAgent<br/><small>⏱️ 3s tick</small><br/><small>Evacuation · 60s cooldown</small>"]
    end

    A1 -->|"Read/Write"| BB
    A2 -->|"Read/Write"| BB
    A3 -->|"Read/Write"| BB
    A4 -->|"Read/Write"| BB
    A5 -->|"Read/Write"| BB
    A6 -->|"Read/Write"| BB

    style BB fill:#f59e0b,stroke:#d97706,color:#000
    style A1 fill:#3b82f6,stroke:#2563eb,color:#fff
    style A2 fill:#22c55e,stroke:#16a34a,color:#fff
    style A3 fill:#ef4444,stroke:#dc2626,color:#fff
    style A4 fill:#06b6d4,stroke:#0891b2,color:#fff
    style A5 fill:#a855f7,stroke:#9333ea,color:#fff
    style A6 fill:#f97316,stroke:#ea580c,color:#fff
```

### Agent Details

<table>
  <thead>
    <tr>
      <th>Agent</th>
      <th>Tick</th>
      <th>CPS Formula / Logic</th>
      <th>Key Behavior</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>🔍 CrowdIntelligence</strong></td>
      <td align="center"><code>3s</code></td>
      <td><code>0.4×(density/500) + 0.35×(velocity/2) + 0.25×audioAnomaly</code></td>
      <td>Generates synthetic sensor data, computes CPS per sector, broadcasts <code>sector_update</code> via WebSocket. Supports edge offline mode (saves to SQLite).</td>
    </tr>
    <tr>
      <td><strong>🚦 FlowMaster</strong></td>
      <td align="center"><code>3s</code></td>
      <td>Monitors CPS > threshold</td>
      <td>Identifies 2 lowest-CPS alternative sectors and issues <code>REROUTE</code> commands. 15-second cooldown per sector. Handles explicit surge triggers from REST API.</td>
    </tr>
    <tr>
      <td><strong>🎫 TicketSentinel</strong></td>
      <td align="center"><code>2s</code></td>
      <td>Duplicate barcode scan detection</td>
      <td>Simulates 3–8 barcode scans per gate across 8 gates (A–H). 5% chance of duplicate injection. Flags <code>FRAUD</code> via scan-log matching. Supports offline mode.</td>
    </tr>
    <tr>
      <td><strong>🌩️ ClimaSync</strong></td>
      <td align="center"><code>3s</code></td>
      <td>Storm → CPS threshold × 0.75</td>
      <td>Monitors <code>storm_active</code> flag. On storm: reduces CPS threshold by 25% (0.75 → 0.5625). Simulates weather polling with 5% chance of auto-triggering storm.</td>
    </tr>
    <tr>
      <td><strong>💬 SocialSentinel</strong></td>
      <td align="center"><code>15s</code></td>
      <td>Sentiment score < -0.4 triggers alert</td>
      <td>NLP sentiment analysis across 5 stadium clusters (North/South/East/West/Center). 10% chance of negative spike per tick.</td>
    </tr>
    <tr>
      <td><strong>🚨 EmergencyAgent</strong></td>
      <td align="center"><code>3s</code></td>
      <td>CPS ≥ 0.90 → Evacuation</td>
      <td>Computes nearest-exit evacuation routes (16 exits mapped to sectors). 60-second cooldown per sector. Broadcasts <code>EMERGENCY</code> alerts.</td>
    </tr>
  </tbody>
</table>

<details>
<summary><strong>📐 Key Constants & Thresholds</strong></summary>

<br/>

| Parameter | Value | Description |
|:---|:---:|:---|
| CPS Threshold (default) | `0.75` | Warning level trigger |
| CPS Threshold (storm) | `0.5625` | 25% safety buffer reduction |
| Critical CPS (evacuation) | `0.90` | Emergency evacuation trigger |
| Sentiment Threshold | `-0.40` | Negative sentiment alert |
| Max Ledger Entries | `100` | Agent decision log cap |
| Max Active Alerts | `50` | Alert buffer cap |
| Sector Grid | `4×4 (A1–D4)` | 16 spatial sectors |
| Gates | `8 (A–H)` | Perimeter entry points |
| Barcode Pool | `500` | Simulated ticket barcodes |

</details>

<br/>

---

<br/>

## ✨ Features

### 🖥️ Admin Dashboard — Next.js 16

<table>
  <thead>
    <tr>
      <th>Page / Route</th>
      <th>Capabilities</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong><code>/</code> — Command Center</strong></td>
      <td>Real-time 16-sector grid with CPS heatmap, live agent activity feed, system status indicators, quick trigger controls (storm/surge/fraud)</td>
    </tr>
    <tr>
      <td><strong><code>/digital-twin</code></strong></td>
      <td>WebGL-equivalent 3D Digital Twin with 8×12 seat grid, CPS color sync (Green→Yellow→Orange→Red), cubic swoop camera, cyan detour trails</td>
    </tr>
    <tr>
      <td><strong><code>/ops-commander</code></strong></td>
      <td>NLP query bar powered by Gemini 1.5 Flash — natural language stadium control ("What's the crowd status at Gate B?")</td>
    </tr>
    <tr>
      <td><strong><code>/agent-ledger</code></strong></td>
      <td>Forensic audit trail of all agent decisions with timestamps, reasoning chains, and zone context</td>
    </tr>
    <tr>
      <td><strong><code>/crowd-map</code></strong></td>
      <td>Live crowd density visualization across all 16 sectors with real-time WebSocket updates</td>
    </tr>
    <tr>
      <td><strong><code>/alerts</code></strong></td>
      <td>Active alert management panel with severity filtering (CRITICAL/WARNING/INFO)</td>
    </tr>
    <tr>
      <td><strong><code>/simulation</code></strong></td>
      <td>Simulation control panel for triggering test scenarios (surges, storms, fraud events)</td>
    </tr>
    <tr>
      <td><strong><code>/supervisor</code></strong></td>
      <td>Supervisor tablet view with HITL (Human-in-the-Loop) approval for agent detours, 60s dispatch timeout monitoring</td>
    </tr>
    <tr>
      <td><strong><code>/login</code></strong></td>
      <td>Token-based authentication</td>
    </tr>
    <tr>
      <td><strong><code>/about</code>, <code>/privacy</code></strong></td>
      <td>Informational and compliance pages</td>
    </tr>
  </tbody>
</table>

> 🎨 **Design**: Dark glassmorphism theme with CSS custom properties, backdrop blur, purple/indigo accent gradients, custom animations.

### 📱 Fan App — Flutter 3.x

<table>
  <thead>
    <tr>
      <th>Screen / Route</th>
      <th>Capabilities</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong><code>/</code> — Login</strong></td>
      <td>Dual-role auth (Fan/Staff), QR code scanner with camera + laser sweep HUD, AI Welcome Concierge modal with weather-aware routing, particle animation background</td>
    </tr>
    <tr>
      <td><strong><code>/seat-view</code></strong></td>
      <td>Full 3D Digital Twin seat map via <code>CustomPainter</code> (8×12 grid, perspective projection, gesture-based rotation/zoom), CPS-based danger tinting, FlowMaster reroute overlays, camera swoop animation</td>
    </tr>
    <tr>
      <td><strong><code>/ar</code></strong></td>
      <td>AR camera navigation with 3-stage self-healing video fallback (local → CDN → procedural 3D wireframe), floating neon holographic directional arrow, real-time WebSocket rerouting with haptic feedback</td>
    </tr>
    <tr>
      <td><strong><code>/alerts</code></strong></td>
      <td>Live alert feed with real-time WebSocket updates, type-based coloring (CRITICAL/WARNING/INFO/REROUTE), discount CTA on reroute alerts</td>
    </tr>
    <tr>
      <td><strong><code>/staff-home</code></strong></td>
      <td>Staff responder console with animated radar scanner (<code>CustomPainter</code>), GPS coordinates simulation, emergency dispatch queue with Accept→Responding→Resolved workflow, offline SQLite ticket validation</td>
    </tr>
  </tbody>
</table>

> 🎨 **Design**: Cyberpunk/sci-fi dark theme (`#0A0F1E` background), electric blue (`#00D4FF`) primary accent, glassmorphism via `BackdropFilter`, extensive `CustomPainter` usage for all visualizations (no 3D libraries), haptic feedback throughout.

### ⚙️ Backend Brain — FastAPI + Multi-Agent System

<table>
  <thead>
    <tr>
      <th>Capability</th>
      <th>Details</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>🧠 Blackboard Architecture</strong></td>
      <td>Singleton shared-state pattern with <code>asyncio.Lock</code> thread safety. All 6 agents read/write to this central nervous system.</td>
    </tr>
    <tr>
      <td><strong>⚡ Redis Write-Through</strong></td>
      <td>Every state mutation syncs to Redis via <code>RedisSyncedDict</code>. Graceful fallback to in-memory if Redis is unavailable.</td>
    </tr>
    <tr>
      <td><strong>🔌 WebSocket Hub</strong></td>
      <td>Fan-out broadcasting to all connected clients. Full <code>init</code> snapshot on connect. Heartbeat pings every 30s. Message types: <code>sector_update</code>, <code>agent_action</code>, <code>alert</code>, <code>edge_status</code>.</td>
    </tr>
    <tr>
      <td><strong>💾 Edge Offline Resilience</strong></td>
      <td>SQLite-backed offline mode. <code>EdgeSyncWorker</code> polls every 8s, auto-flushes pending scans/telemetry on reconnect. Detects duplicate barcodes during sync.</td>
    </tr>
    <tr>
      <td><strong>🤖 AI/LLM Integration</strong></td>
      <td>Gemini 1.5 Flash for NLP OpsCommander queries and post-match debrief generation. Rule-based fallbacks when API key is absent.</td>
    </tr>
    <tr>
      <td><strong>📡 Pub/Sub Ingestion</strong></td>
      <td>Optional Google Cloud Pub/Sub subscriber for <code>sensor_batch</code> messages from edge devices.</td>
    </tr>
  </tbody>
</table>

<br/>

---

<br/>

## 📂 Project Structure

```
stadiumos/
├── 🖥️ admin/                              # Next.js 16 Admin Dashboard
│   ├── app/
│   │   ├── page.tsx                       # Command center — live sector grid
│   │   ├── digital-twin/                  # 3D Digital Twin visualization
│   │   ├── ops-commander/                 # NLP query interface (Gemini)
│   │   ├── agent-ledger/                  # Agent decision audit trail
│   │   ├── crowd-map/                     # Crowd density heatmap
│   │   ├── alerts/                        # Alert management panel
│   │   ├── simulation/                    # Scenario trigger controls
│   │   ├── supervisor/                    # HITL supervisor view
│   │   ├── login/                         # Authentication
│   │   ├── about/ & privacy/             # Info & compliance pages
│   │   ├── globals.css                    # Design system (38KB)
│   │   ├── layout.tsx                     # Root layout
│   │   ├── loading.tsx                    # Loading states
│   │   ├── error.tsx                      # Error boundary
│   │   └── not-found.tsx                  # 404 page
│   ├── components/
│   │   ├── Sidebar.tsx                    # Navigation sidebar
│   │   └── Footer.tsx                     # App footer
│   ├── hooks/
│   │   └── useWebSocket.ts               # WebSocket custom hook
│   ├── lib/
│   │   └── utils.ts                       # Shared utilities
│   ├── Dockerfile                         # Production container
│   ├── cloudbuild.yaml                    # GCP Cloud Build config
│   └── package.json                       # Next.js 16 + React 19
│
├── ⚙️ backend/                             # FastAPI Python Backend
│   ├── main.py                            # Entry point (792 lines)
│   ├── agents/                            # 🤖 Autonomous AI Agents
│   │   ├── crowd_intelligence.py          # CPS sensor ingestion
│   │   ├── flow_master.py                 # Traffic rerouting
│   │   ├── ticket_sentinel.py             # Fraud detection
│   │   ├── clima_sync.py                  # Weather adaptation
│   │   ├── social_sentinel.py             # Sentiment analysis
│   │   └── emergency_agent.py             # Evacuation protocol
│   ├── state/
│   │   ├── blackboard.py                  # Central shared state (361 lines)
│   │   └── edge_sync.py                   # SQLite offline resilience
│   ├── gcp/
│   │   ├── firestore_client.py            # Firestore read/write
│   │   └── pubsub_subscriber.py           # Pub/Sub streaming
│   ├── simulator/
│   │   └── mock_ingestor.py               # Mock data generator CLI
│   ├── tests/
│   │   ├── conftest.py                    # MockRedis + fixtures
│   │   ├── test_blackboard.py             # State transition tests
│   │   ├── test_edge_sync.py              # Offline sync tests
│   │   └── test_endpoints.py              # API integration tests
│   ├── Dockerfile                         # Python 3.11-slim container
│   ├── cloudbuild.yaml                    # GCP deployment pipeline
│   └── requirements.txt                   # Python dependencies
│
├── 📱 fan-app/                             # Flutter Mobile App
│   ├── lib/
│   │   ├── main.dart                      # App entry + routing (5 routes)
│   │   ├── screens/
│   │   │   ├── login_screen.dart          # QR scanner + AI concierge (1,101 lines)
│   │   │   ├── seat_view_screen.dart      # 3D Digital Twin (908 lines)
│   │   │   ├── ar_nav_screen.dart         # AR camera navigation (836 lines)
│   │   │   ├── staff_home_screen.dart     # Staff command console (686 lines)
│   │   │   └── alert_screen.dart          # Live alerts feed (318 lines)
│   │   ├── services/
│   │   │   ├── websocket_service.dart     # WS singleton + auto-reconnect
│   │   │   └── fcm_service.dart           # Firebase push notifications
│   │   └── widgets/
│   │       ├── glass_container.dart       # Glassmorphism widget
│   │       └── alert_card.dart            # Alert display card
│   ├── assets/images/                     # Static assets
│   ├── android/                           # Android platform config
│   └── pubspec.yaml                       # Flutter dependencies
│
├── 📐 Documentation
│   ├── stadiumos_architecture_spec.md     # Architecture spec v2.0
│   ├── stadiumosprd.md                    # Product Requirements Document
│   ├── stadiumos_testing_architecture.md  # Testing strategy
│   ├── post_match_debrief.md              # AI debrief feature spec
│   └── CONTRIBUTING.md                    # Contribution guidelines
│
├── 🔧 Configuration
│   ├── docker-compose.yml                 # Multi-service orchestration
│   ├── Makefile                           # Developer shortcuts
│   ├── .env.example                       # Environment template
│   └── .gitignore                         # Comprehensive ignore rules
│
└── 🔄 CI/CD
    └── .github/
        ├── workflows/ci.yml               # GitHub Actions pipeline
        ├── pull_request_template.md        # PR checklist template
        └── ISSUE_TEMPLATE/
            ├── bug_report.md              # Bug report template
            └── feature_request.md         # Feature request template
```

<br/>

---

<br/>

## 🔐 Security Architecture

```mermaid
graph TB
    subgraph "🛡️ Security Layers"
        A["🌐 Client Request"] --> B["🌍 CORS Middleware<br/><small>Origin whitelist from env</small>"]
        B --> C["⏱️ Rate Limiter<br/><small>slowapi · 20 req/min on /api/query</small>"]
        C --> D["🔐 Bearer Token Auth<br/><small>API_TOKEN env var</small>"]
        D --> E["👤 RBAC Authorization<br/><small>4 Operational Roles</small>"]
        E --> F["⚙️ Route Handler"]
    end

    subgraph "👤 RBAC Roles"
        R1["🔴 Super Admin<br/><small>Global access · Next.js desktop</small><br/><small>3D Twin · OpsCommander · Ledger</small>"]
        R2["🟠 Zone Supervisor<br/><small>Regional access · iPad/tablet</small><br/><small>HITL approval · Dispatch monitoring</small>"]
        R3["🟡 Field Responder<br/><small>Task-based · Flutter staff mode</small><br/><small>PostGIS GPS · Offline ticket scan</small>"]
        R4["🟢 General Fan<br/><small>Personal access · Flutter fan mode</small><br/><small>QR onboard · AR guide · 3D seats</small>"]
    end

    subgraph "🔒 Zero-PII Privacy"
        P1["📹 YOLOv8 Edge Processing<br/><small>Only integer counts transmitted</small><br/><small>CCTV frames discarded immediately</small>"]
        P2["👤 Session Hash Tokens<br/><small>No personal data linked</small><br/><small>Coarse bounding-box aggregation</small>"]
    end

    E --> R1
    E --> R2
    E --> R3
    E --> R4

    style A fill:#64748b,stroke:#475569,color:#fff
    style B fill:#3b82f6,stroke:#2563eb,color:#fff
    style C fill:#f59e0b,stroke:#d97706,color:#fff
    style D fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style E fill:#06b6d4,stroke:#0891b2,color:#fff
    style F fill:#22c55e,stroke:#16a34a,color:#fff
    style R1 fill:#ef4444,stroke:#dc2626,color:#fff
    style R2 fill:#f97316,stroke:#ea580c,color:#fff
    style R3 fill:#eab308,stroke:#ca8a04,color:#000
    style R4 fill:#22c55e,stroke:#16a34a,color:#fff
    style P1 fill:#475569,stroke:#334155,color:#fff
    style P2 fill:#475569,stroke:#334155,color:#fff
```

<br/>

---

<br/>

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|:---|:---|:---|
| **Python** | ≥ 3.11 | Backend runtime |
| **Node.js** | ≥ 20.x | Admin dashboard |
| **Flutter SDK** | ≥ 3.x | Fan mobile app |
| **Redis** | ≥ 7.x | State caching *(optional — graceful fallback)* |
| **Docker** | ≥ 20.x | Containerization *(optional)* |

### Option 1 — Local Development

```bash
# 1. Clone the repository
git clone https://github.com/dayanandXdarpan/stadiumos.git
cd stadiumos

# 2. Set up environment
cp .env.example backend/.env
# Edit backend/.env — at minimum set GEMINI_API_KEY for AI features
```

<details>
<summary><strong>🐍 Start Backend (Terminal 1)</strong></summary>

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# → API running at http://localhost:8000
# → WebSocket at ws://localhost:8000/ws
# → Health check: http://localhost:8000/health
```

</details>

<details>
<summary><strong>🖥️ Start Admin Dashboard (Terminal 2)</strong></summary>

```bash
cd admin
npm install
npm run dev

# → Dashboard at http://localhost:3000
# → Supervisor at http://localhost:3000/supervisor
```

</details>

<details>
<summary><strong>📱 Start Fan App (Terminal 3)</strong></summary>

```bash
cd fan-app
flutter pub get
flutter run

# → Mobile app launches on emulator/device
```

</details>

### Option 2 — Docker Compose

```bash
# Start all services (backend + admin + Redis)
docker-compose up --build

# With mock data ingestor:
docker-compose --profile ingestor up --build

# Services:
# Backend API  → http://localhost:8000
# Admin Panel  → http://localhost:3000
# Redis        → localhost:6379
```

### Option 3 — Makefile Shortcuts

```bash
make install          # Install all dependencies (backend + admin)
make dev              # Start backend + admin concurrently
make dev-backend      # Start Python backend only (port 8000)
make dev-admin        # Start Next.js admin only (port 3000)
make test-backend     # Run backend pytest suite
make docker-up        # Start services via docker-compose
make docker-down      # Stop all docker-compose services
make clean            # Remove build artifacts
```

### Default Credentials

| Access | Token / Credential |
|:---|:---|
| API Bearer Token | `stadiumos-demo-token` |
| API Token Env Var | `API_TOKEN` in `.env` |

> **📝 Note**: If `API_TOKEN` is set to an empty string, authentication is completely disabled for development convenience.

<br/>

---

<br/>

## 📡 API Reference

All endpoints are served from the FastAPI backend at `http://localhost:8000`.

### Authentication

Protected endpoints require the `Authorization: Bearer <token>` header:

```http
Authorization: Bearer stadiumos-demo-token
```

### Endpoints

<details>
<summary><strong>💚 Health Check</strong></summary>

| Method | Path | Auth | Description |
|:---|:---|:---:|:---|
| `GET` | `/health` | ❌ | Returns `{status, service, version, timestamp}` |

</details>

<details>
<summary><strong>📊 State & Telemetry</strong> — Read-Only</summary>

| Method | Path | Auth | Description |
|:---|:---|:---:|:---|
| `GET` | `/api/state` | ❌ | Full blackboard snapshot — all 16 sectors, storm status, alerts, fraud flags, recent ledger |
| `GET` | `/api/sectors` | ❌ | All 16 sector CPS values with density, velocity, status, threshold |
| `GET` | `/api/agents/ledger` | ❌ | Last 100 agent decision entries with count & timestamp |
| `GET` | `/api/edge/offline` | ❌ | Edge offline queue metrics — pending scans & logs counts |

</details>

<details>
<summary><strong>🎯 Triggers</strong> — Mutation Endpoints (Auth Required)</summary>

| Method | Path | Body | Description |
|:---|:---|:---|:---|
| `POST` | `/api/trigger/storm` | — | Toggle storm on/off — adjusts CPS threshold by 25% |
| `POST` | `/api/trigger/surge` | `{sectorId: "A1"}` | Inject crowd surge into a specific sector (A1–D4) |
| `POST` | `/api/trigger/fraud` | `{gateId: "Gate-A"}` | Inject ticket fraud event at a gate (Gate-A to Gate-H) |
| `POST` | `/api/edge/offline` | `{offline: true}` | Toggle simulated network drop / edge offline mode |

</details>

<details>
<summary><strong>🤖 AI Endpoints</strong></summary>

| Method | Path | Body | Auth | Description |
|:---|:---|:---|:---:|:---|
| `POST` | `/api/query` | `{query: "crowd status?"}` | ❌ | NLP OpsCommander — natural language query (Gemini or rule-based fallback). Rate limited: 20/min. |
| `POST` | `/api/post-match/debrief` | — | ✅ | Generate AI post-match operational report (Gemini or rule-based) |

</details>

<details>
<summary><strong>🔌 WebSocket</strong></summary>

| Protocol | Path | Description |
|:---|:---|:---|
| `WS` | `/ws` | Real-time bidirectional connection |

**On Connect**: Sends full `init` snapshot of blackboard state.

**Server Broadcast Message Types**:

| Type | Description |
|:---|:---|
| `sector_update` | Real-time CPS/density/velocity per sector (every 3s) |
| `agent_action` | Agent decisions — REROUTE, FRAUD_DETECTED, STORM_RESPONSE, etc. |
| `alert` | SURGE, FRAUD, STORM, EMERGENCY, SENTIMENT alerts with severity |
| `edge_status` | Offline mode status with pending queue counts |
| `ping` | Heartbeat keepalive (every 30s) |

</details>

<br/>

---

<br/>

## 🐳 Docker & Deployment

### Docker Compose Services

```mermaid
graph LR
    subgraph "Docker Network"
        REDIS["⚡ Redis 7-Alpine<br/><small>Port 6379</small><br/><small>Health check: redis-cli ping</small>"]
        BACKEND["⚙️ Backend<br/><small>Port 8000→8080</small><br/><small>FastAPI + Agent Swarm</small>"]
        ADMIN_D["🖥️ Admin Dashboard<br/><small>Port 3000→8080</small><br/><small>Next.js Production Build</small>"]
        INGESTOR["📡 Mock Ingestor<br/><small>Profile: ingestor</small><br/><small>Pub/Sub simulator</small>"]
    end

    BACKEND -->|"REDIS_URL"| REDIS
    ADMIN_D -->|"depends_on"| BACKEND
    INGESTOR -->|"depends_on"| BACKEND

    style REDIS fill:#dc2626,stroke:#b91c1c,color:#fff
    style BACKEND fill:#059669,stroke:#047857,color:#fff
    style ADMIN_D fill:#7c3aed,stroke:#5b21b6,color:#fff
    style INGESTOR fill:#6366f1,stroke:#4f46e5,color:#fff
```

### Google Cloud Run Deployment

StadiumOS uses **Cloud Build** (`cloudbuild.yaml`) for automated deployment:

```bash
# Backend deployment pipeline (3 steps):
# 1. Docker build → 2. Push to Artifact Registry → 3. Deploy to Cloud Run

gcloud builds submit --config backend/cloudbuild.yaml backend/
# → Deploys to us-central1, 1Gi RAM, 1 CPU, 1-10 instances
# → Gemini API key injected via Secret Manager

gcloud builds submit --config admin/cloudbuild.yaml admin/
# → Deploys admin dashboard to Cloud Run
```

<br/>

---

<br/>

## 🔑 Environment Variables

```bash
cp .env.example backend/.env
```

<details>
<summary><strong>View all environment variables</strong></summary>

<br/>

| Variable | Default | Description |
|:---|:---|:---|
| **GCP** | | |
| `GOOGLE_APPLICATION_CREDENTIALS` | `./service-account.json` | GCP service account path |
| `GCP_PROJECT_ID` | `stadiumos-demo` | GCP project identifier |
| **Pub/Sub** | | |
| `PUBSUB_TOPIC` | `stadium-events` | Event ingestion topic |
| `PUBSUB_SUBSCRIPTION` | `stadium-events-sub` | Subscription name |
| **Firestore** | | |
| `FIRESTORE_COLLECTION` | `stadium-state` | State persistence collection |
| `FIRESTORE_LEDGER_COLLECTION` | `agent-ledger` | Agent audit log collection |
| **Redis** | | |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| **AI / LLM** | | |
| `GEMINI_API_KEY` | — | **Required** for AI features |
| `LANGCHAIN_TRACING_V2` | `false` | LangChain observability |
| **App Config** | | |
| `PORT` | `8000` | Server port |
| `EDGE_MODE` | `false` | Edge deployment mode |
| `CORS_ORIGINS` | `http://localhost:3000,...` | Allowed CORS origins |
| `API_TOKEN` | `stadiumos-demo-token` | Bearer token (empty = disabled) |
| **Agent Tuning** | | |
| `CPS_THRESHOLD` | `0.75` | Crowd Pressure Score warning level |
| `CPS_STORM_MULTIPLIER` | `0.75` | Storm safety buffer (25% reduction) |
| `AGENT_TICK_INTERVAL` | `3` | Agent loop interval (seconds) |
| `SENTIMENT_TICK_INTERVAL` | `15` | Sentiment analysis interval |
| `SIMULATION_COUNT` | `500` | Simulation barcode pool size |
| **Push Notifications** | | |
| `FCM_SERVER_KEY` | — | Firebase Cloud Messaging key |

</details>

<br/>

---

<br/>

## 🧪 Testing

### Test Architecture

```mermaid
graph TB
    A["🧪 Test Suite"] --> B["📋 conftest.py<br/><small>MockRedis · clean_blackboard fixture<br/>Temp SQLite DBs · mock_broadcast</small>"]

    B --> C["test_blackboard.py<br/><small>6 async tests</small><br/><small>CPS transitions · Ledger capping<br/>Storm lifecycle · Fraud flags</small>"]
    B --> D["test_edge_sync.py<br/><small>4 tests</small><br/><small>DB init · Offline save<br/>Sync worker · Fraud collision</small>"]
    B --> E["test_endpoints.py<br/><small>8 tests</small><br/><small>Health · State/Sectors · Triggers<br/>NLP fallback · Debrief gen</small>"]

    style A fill:#8b5cf6,stroke:#7c3aed,color:#fff
    style B fill:#f59e0b,stroke:#d97706,color:#fff
    style C fill:#22c55e,stroke:#16a34a,color:#fff
    style D fill:#3b82f6,stroke:#2563eb,color:#fff
    style E fill:#ef4444,stroke:#dc2626,color:#fff
```

### Running Tests

```bash
cd backend
python -m pytest tests/ -v --tb=short

# With coverage report
python -m pytest tests/ --cov=. --cov-report=html
```

<details>
<summary><strong>📋 Key Test Scenarios</strong></summary>

<br/>

| Test File | Scenarios Covered |
|:---|:---|
| `test_blackboard.py` | Sector initialization, CPS state transitions (CLEAR→CAUTION→WARNING→CRITICAL), ledger capping at 100 entries, alerts capping at 50, storm lifecycle (threshold 0.75→0.5625), fraud flag management |
| `test_edge_sync.py` | SQLite schema integrity, offline telemetry queuing, sync worker online/offline modes, counterfeit ticket detection (double-scanned barcodes flagged as FRAUD) |
| `test_endpoints.py` | Health check, GET state/sectors/ledger, POST storm/surge/fraud triggers, edge offline toggle, NLP query keyword routing fallback, post-match debrief Markdown compilation |

### GDPR / Privacy Testing

- ✅ Validates no biometric data caching
- ✅ Cryptographic session token verification
- ✅ Coarse bounding-box anonymization compliance

</details>

<br/>

---

<br/>

## 🛠️ Tech Stack

<details>
<summary><strong>🐍 Backend (Python)</strong></summary>

<br/>

| Technology | Version | Purpose |
|:---|:---:|:---|
| FastAPI | 0.111.1 | ASGI web framework |
| Uvicorn | 0.29.0 | ASGI server |
| Python | 3.11 | Language runtime |
| Redis | 5.0.4 | Write-through state cache |
| Google Generative AI | 0.7.2 | Gemini 1.5 Flash integration |
| LangChain | 1.0.7 | Agent chain orchestration |
| Pydantic | 2.7.1 | Data validation |
| websockets | 12.0 | Real-time communication |
| slowapi | 0.1.9 | API rate limiting |
| Firestore | 2.16.1 | Cloud persistence |
| Pub/Sub | 2.21.1 | Event stream ingestion |

</details>

<details>
<summary><strong>🖥️ Admin Dashboard (TypeScript)</strong></summary>

<br/>

| Technology | Version | Purpose |
|:---|:---:|:---|
| Next.js | 16.2.6 | React framework (App Router) |
| React | 19.2.4 | UI library |
| TypeScript | 5.x | Type-safe JavaScript |
| CSS Custom Properties | — | Design system (38KB globals.css) |

</details>

<details>
<summary><strong>📱 Fan App (Dart)</strong></summary>

<br/>

| Technology | Version | Purpose |
|:---|:---:|:---|
| Flutter | 3.x | Cross-platform mobile framework |
| Dart | ≥ 3.0 | Language runtime |
| firebase_messaging | 15.0.0 | Push notifications (FCM) |
| firebase_core | 3.1.0 | Firebase SDK |
| web_socket_channel | 3.0.0 | WebSocket communication |
| camera | 0.11.0 | QR code scanning |
| video_player | 2.8.2 | AR video backgrounds |
| flutter_animate | 4.5.0 | Animation library |
| permission_handler | 11.3.0 | Runtime permissions |
| google_fonts | — | Inter + Roboto Mono typography |

</details>

<details>
<summary><strong>☁️ Infrastructure</strong></summary>

<br/>

| Technology | Purpose |
|:---|:---|
| Docker + Docker Compose | Multi-service containerization |
| Google Cloud Run | Production serverless hosting |
| Google Cloud Build | CI/CD deployment pipeline |
| GitHub Actions | Lint, test, build automation |
| Redis 7 Alpine | State caching with persistence |
| SQLite | Edge offline resilience |
| Firebase / FCM | Push notification delivery |
| Firestore | Cloud document persistence |
| Pub/Sub | Event stream ingestion |

</details>

<br/>

---

<br/>

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

### Quick Start

```bash
# Fork → Clone → Branch → Commit → PR
git checkout -b feat/your-feature-name
git commit -m "feat: add crowd heatmap overlay"
git push origin feat/your-feature-name
```

### Branch Naming

| Prefix | Purpose |
|:---|:---|
| `feat/` | New features |
| `bugfix/` | Bug fixes |
| `docs/` | Documentation |
| `refactor/` | Code restructuring |

<details>
<summary><strong>📏 Code Quality Standards</strong></summary>

<br/>

| Layer | Standards |
|:---|:---|
| **Next.js** | Strict TypeScript (avoid `any`), CSS Custom Variables, `useMemo`/`useCallback` for render loops |
| **Flutter** | Follow `analysis_options.yaml`, dispose all controllers/streams, robust `CustomPainter` fallbacks |
| **FastAPI** | Pydantic schemas for all endpoints, asyncio tasks in lifespans, locked Blackboard read/writes |

### Zero-PII Compliance Checklist

- [ ] Edge-only CCTV frames — YOLOv8 discards raw video
- [ ] Session hash tokens for fans — no personal data linked
- [ ] No biometric data caching
- [ ] Coarse bounding-box aggregation only

</details>

<br/>

---

<br/>

## 📊 Roadmap

### ✅ Completed

- [x] 6-agent cooperative swarm with Blackboard architecture
- [x] 16-sector CPS (Crowd Pressure Score) monitoring system
- [x] 3D Digital Twin with real-time CPS color sync
- [x] NLP OpsCommander powered by Gemini 1.5 Flash
- [x] AR camera navigation with 3-stage self-healing fallback
- [x] QR scanner with AI Welcome Concierge
- [x] Flutter fan app with 3D seat view + live alerts
- [x] Staff responder console with radar + dispatch workflow
- [x] WebSocket real-time broadcast hub
- [x] Redis write-through state caching
- [x] SQLite edge offline resilience
- [x] Post-match AI debrief generation
- [x] Docker containerization + Cloud Run deployment
- [x] Zero-PII privacy architecture
- [x] Comprehensive test suite (Blackboard, Edge Sync, API)
- [x] GitHub CI/CD + PR/Issue templates

### 🔮 Planned

- [ ] PostgreSQL + PostGIS production database
- [ ] Real YOLOv8 edge device integration
- [ ] Pub/Sub live sensor stream pipeline
- [ ] Payment gateway for in-seat ordering
- [ ] Multi-language support (i18n)
- [ ] iOS build + App Store deployment
- [ ] WCAG 2.1 AA accessibility audit
- [ ] k6 load testing for 100K concurrent users
- [ ] Prometheus + Grafana observability stack

<br/>

---

<br/>

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

<br/>

---

<br/>

## 👥 Team

<p align="center">
  <img src="https://img.shields.io/badge/Built_with-❤️-red?style=for-the-badge" alt="Built with love" />
</p>

<p align="center">
  Built by <strong>Dayanand & Darpan</strong><br/>
  🌐 <a href="https://www.dayananddarpan.in/">dayananddarpan.in</a>
</p>

<p align="center">
  <strong>🏆 Built with AI — Agentic Premier League 2026</strong>
</p>

<br/>

---

<p align="center">
  <sub>⭐ Star this repo if you found it useful! ⭐</sub>
</p>
