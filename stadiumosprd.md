# Product Requirements Document (PRD) — StadiumOS
**AI-Agent Powered Adaptive Stadium Intelligence Platform**  
**Document Version:** 2.0.0  
**Target Event:** Build with AI – Agentic Premier League  
**Classification:** Smart Infrastructure • Crowd Intelligence • Multi-Agent Systems • GIS Maps

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
StadiumOS transforms large-scale public venues from static, reactive zones into adaptive, intelligent ecosystems. By utilizing a collaborative swarm of autonomous AI agents, the platform dynamically calculates crowd movements, intercepts counterfeits, coordinates field volunteers, and guides attendees through active bottlenecks in real time.

### 1.2 Core Value Proposition
StadiumOS bridges the gap in traditional arena logistics by establishing a **Collective Intelligence Infrastructure**. The platform coordinates high-throughput sensor ingestion, real-time Redis blackboard state caches, PostgreSQL + PostGIS database mapping, and highly visual, role-based frontends (Next.js & Flutter) to ensure seamless stadium safety and traffic efficiency.

---

## 2. The Four Operational Roles

StadiumOS partitions capabilities across four distinct venue interfaces, ensuring tailored access permissions and optimized system interaction:

### 2.1 Role 1: Super Admin / Command Center Operator
- **Access Level**: Global (Full System Access).
- **Interface**: Next.js Desktop Command Center.
- **Capabilities**:
  - Global overview of all 16 sectors and ingress metrics.
  - Interactive **3D Digital Twin Command stand** with camera swoop animations and dynamic real-time glowing aisles showing localized CPS.
  - Complete access to the **Agent Log Ledger** to monitor swarm reasoning.
  - Generates manual overrides via the NLP OpsCommander bar (e.g. triggering evacuations) and toggles storm/surge simulations.

### 2.2 Role 2: Zone Sector Supervisor / Team Leader
- **Access Level**: Regional (Restricted Stand Blocks, e.g. Sectors B & C).
- **Interface**: iPad / Tablet Command View (`/supervisor`).
- **Capabilities**:
  - Monitors assigned turnstiles, gates, and concessions.
  - **Human-in-the-Loop (HITL) Decider**: Approves or denies active agent detours before they publish.
  - Monitors field volunteers, displaying automated warning alerts if responder dispatches breach 60-second timeouts.

### 2.3 Role 3: Field Volunteer / Security Responder
- **Access Level**: Localized (Task-based).
- **Interface**: Flutter Mobile App (Staff Mode - `/staff-home`).
- **Capabilities**:
  - Constant background location telemetry pings to PostGIS database (visualized via a scanning radar radar).
  - Listens for proximity dispatches (e.g., *"Congestion at Gate 4 - 12m away"*) with distinct phone vibration warnings.
  - Validates turnstile tickets offline using local SQLite edge caches during complete network drops.

### 2.4 Role 4: General Fan / Attendee
- **Access Level**: Personal.
- **Interface**: Flutter Mobile App (Fan Mode - `/seat-view` / `/ar`).
- **Capabilities**:
  - Authenticates using **QR Smart Onboarding** which triggers personalized welcomer concierges mapping rain-sheltered routes.
  - Accesses **3D Seating Locator Map** to swoop in and view ticket seat boundaries.
  - Navigates using **Camera AR Guide** (with CDN video loop & 100% offline wireframe fallback), spinning detour arrows Right on surges.

---

## 3. Key Visual Innovations Specifications

### 3.1 3D Digital Seating Stand Twin
- **WebGL-Equivalent HTML5 Canvas Engine**: Interactive 3D Stand renders 8 rows × 12 columns of seats separated by a central pedestrian corridor.
- **WebSocket CPS Sync**: Corridors glow Green (Safe), Yellow (Caution), Orange (Warning), Red (Critical) as CPS updates arrive every 3 seconds.
- **EaseOut Cubic Swoop**: Tapping a seat interpolates zoom, pitch, and yaw camera coordinates to focus directly on the seat.
- **Detour Pipeline**: Pulsing cyan trails overlay pathways when detours are engaged.

### 3.2 "Agentic Onboarding" QR Scanner
- **Validator**: Pulses a scanning laser over live/simulated camera overlays.
- **AI Concierge**: Cross-references meteorological APIs on ticket scan, greeting Deepak by name and displaying custom weather alerts and dual route actions.

### 3.3 Live AR "Ghost Route" Guide (3-Stage Fallback)
The mobile AR navigation guides fans with floating neon arrows overlaying:
1. **Stage 1 (Local)**: Loops a local asset (`assets/videos/hallway.mp4`).
2. **Stage 2 (Network)**: Streams a futuristic tunnel loop from a public CDN URL.
3. **Stage 3 (3D Wireframe Tunnel — 100% Offline)**: Renders a local moving scrolling vector corridor if completely offline.
* **Detour Sync**: WebSocket `REROUTE` updates trigger two intense phone vibration pulses and smoothly rotate the AR arrow **90° to the Right**.

---

## 4. Systems Integration & Database Schema

### 4.1 Database Layer (PostgreSQL + PostGIS & SQLite)
- **Central Storage**: PostgreSQL tracks zones, users, tickets, agent logs, and alerts. Uses PostGIS extensions to compute spatial proximity dispatches for available volunteers.
- **Edge Storage**: Scanners utilize SQLite offline replication tables, caching validations locally and flushing downstream upon internet reconnect.

*For detailed tables and GeoJSON coordinate feature collections, review the **[StadiumOS System Architecture Specification](file:///c:/Users/deepa/Desktop/stadiumos/stadiumos_architecture_spec.md)**.*

---

## 5. Security & GDPR Zero-PII Compliance

### 5.1 CCTV Gate Anonymization
- **YOLOv8 Edge Ingestion**: Turnstile edge nodes process video frames locally, extracting integer counts (e.g. `count: 142`) and immediately discard video files.
- **Zero biometrics transfer**: No raw facial data, biometric metadata, or video packets are ever piped to, processed by, or cached within central databases or Gemini LLMs.

### 5.2 Decoupled Location Telemetry
Fans generate temporary cryptographic session hashes. Location paths are aggregated into spatial grid boxes to map crowd *densities*, never *individual paths*.
