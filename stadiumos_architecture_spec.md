# StadiumOS System Architecture & Spatial Data Specifications
**Document Version:** 2.0.0  
**Classification:** Smart Arena Infrastructure • GIS Mapping • Database Schema • Zero-PII Security

---

## 🗺️ 1. Dynamic Stadium Map: GeoJSON Coordinate Feature Matrix

To enable instant spatial and boundary routing computations by the **CrowdIntelligence** and **FlowMaster** agents without blocking the rendering thread, the physical arena coordinates are decoupled into a standardized **GeoJSON Bounding Box Feature Matrix**. 

The Next.js frontends and mobile CustomPainters translate these spatial polygons into isometric/perspective matrices, while the backend database performs instant spatial boundary queries.

```json
{
  "type": "FeatureCollection",
  "crs": {
    "type": "name",
    "properties": {
      "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
    }
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "zone_id": "Sector_A1",
        "gate": "Gate_A",
        "max_capacity": 500,
        "concourse_exit": "Exit-North-1"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [[0.0, 0.0], [5.0, 0.0], [5.0, 5.0], [0.0, 5.0], [0.0, 0.0]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "zone_id": "Sector_A2",
        "gate": "Gate_A",
        "max_capacity": 500,
        "concourse_exit": "Exit-North-2"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [[5.0, 0.0], [10.0, 0.0], [10.0, 5.0], [5.0, 5.0], [5.0, 0.0]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "zone_id": "Sector_B3",
        "gate": "Gate_4",
        "max_capacity": 450,
        "concourse_exit": "Exit-Center-2"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [[10.0, 5.0], [15.0, 5.0], [15.0, 10.0], [10.0, 10.0], [10.0, 5.0]]
        ]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "zone_id": "Sector_C3",
        "gate": "Gate_G",
        "max_capacity": 600,
        "concourse_exit": "Exit-Center-4"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [[10.0, 10.0], [15.0, 10.0], [15.0, 15.0], [10.0, 15.0], [10.0, 10.0]]
        ]
      }
    }
  ]
}
```

---

## 🗄️ 2. Database Schema (Prisma ORM / PostgreSQL + PostGIS)

This database structure forms the relational core of StadiumOS. It manages live spatial telemetry, active volunteer dispatches, ticket validations, and forensic audit ledgers.

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// ── 1. STADIUM SECTOR MATRIX & LIVE CONGESTION ──
model Zone {
  id                 String   @id @default(uuid())
  name               String   @unique // e.g., "Sector_B3", "Sector_C3"
  maxCapacity        Int
  currentDensity     Float    @default(0.0)  // Ingestion score: 0.0 to 1.0
  currentVelocity    Float    @default(1.0)  // Pedestrian flow velocity: m/s
  audioAnomaly       Float    @default(0.0)  // Noise anomaly score: 0.0 to 1.0
  crowdPressureScore Float    @default(0.0)  // CPS: 0.4*Density + 0.35*Velocity + 0.25*Audio
  status             String   @default("CLEAR") // CLEAR, CAUTION, WARNING, CRITICAL
  updatedAt          DateTime @updatedAt
  alerts             Alert[]
}

// ── 2. LIVE ROLE-BASED ACCESS CONTROL (RBAC) ──
enum UserRole {
  SUPER_ADMIN      // Command Center Operator (Global view)
  ZONE_SUPERVISOR  // Regional Manager (iPad/Tablet view)
  FIELD_RESPONDER  // Proximity Volunteer (Mobile Staff Mode)
  FAN              // Attendee (Mobile Fan Mode + AR Pathfinding)
}

model User {
  id            String    @id @default(uuid())
  name          String
  email         String    @unique
  role          UserRole  @default(FAN)
  ticketId      String?   @unique
  ticket        Ticket?   @relation(fields: [ticketId], references: [id])
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())

  // Real-time Spatial Tracking (Used for Field Responders & GIS routing)
  lastLocationX Float?    // PostGIS Longitude coordinate
  lastLocationY Float?    // PostGIS Latitude coordinate
  status        String    @default("AVAILABLE") // AVAILABLE, DISPATCHED, RESPONDING, OFFLINE
}

// ── 3. TICKET VALIDATION & COLLISION FRAUD TRACKING ──
model Ticket {
  id           String    @id @default(uuid())
  barcode      String    @unique
  holderName   String
  assignedSeat String    // e.g., "Block C, Row A, Seat 12"
  assignedGate String    // e.g., "Gate-G"
  isValidated  Boolean   @default(false)
  isFraudulent Boolean   @default(false)
  scannedAt    DateTime?
  scanGate     String?
  user         User?
}

// ── 4. MULTI-AGENT BLACKBOARD FORENSIC LEDGER ──
model AgentLog {
  id          String   @id @default(uuid())
  agentName   String   // e.g., "FlowMasterAgent", "TicketSentinelAgent"
  zoneId      String?
  actionTaken String   // e.g., "REROUTE", "TICKET_BLOCKED"
  reasoning   String   @db.Text
  timestamp   DateTime @default(now())
}

model Alert {
  id        String   @id @default(uuid())
  zoneId    String
  zone      Zone     @relation(fields: [zoneId], references: [id])
  severity  String   // WARNING, CRITICAL
  message   String
  createdAt DateTime @default(now())
}
```

---

## 🔐 3. Privacy-First Security Architecture (Zero-PII Bounding Box)

StadiumOS operates on a strict **Zero-PII Localized Data Pipeline** ensuring full compliance with spatial privacy metrics (GDPR / CCPA) during high-density crowd tracking:

### 📹 3.1 Edge Frame Anonymization
- **Computer Vision Pipeline**: Closed-circuit television (CCTV) streams and spatial edge cameras run **YOLOv8** pedestrian models locally on containerized gate edge nodes.
- **Data Scrubbing**: The model extracts an integer representing density metrics (e.g. `count: 142`, `velocity: 0.8`) and immediately discards the raw video frames. 
- **Zero biometrics transfer**: No raw facial data, biometric metadata, or video packets are ever piped to, processed by, or cached within the central cloud PostgreSQL database or Gemini LLM swarms.

### 📱 3.2 Anonymized Fan Location Pings
- **Temporary Session Tokens**: Attendees running the Flutter Mobile Client generate randomized, high-frequency cryptographic session tokens instead of logging raw personal details.
- **Bounding Box Aggregation**: The background PostgreSQL database aggregates coordinate points inside spatial grids to compute density vectors. Individual telemetry traces are decoupled, ensuring the system maps *how many devices are in a corridor*, never *who owns them*.

---

## 🔄 4. Synchronized Data Handshake Lifecycles

```
 [ INGESTION ]                [ BRAIN / AGENTS ]                 [ VISUAL CLOSE ]

  YOLOv8 Edge                                                     Operator HUD
  Camera Nodes                                                    (Next.js Dashboard)
       │                                                                ▲
       ▼                                                                │ (WS push)
  FastAPI WS  ──► [ Redis In-Memory ] ──► Gemini Swarm ──► DB Sync ─────┘
  (/api/spatial)    (CPS calculations)      (LangChain)    (PostgreSQL)
                                                                        │
                                                                        ▼
                                                                  Attendee App
                                                                  (AR neon guide)
```

### 1. The Fast-Ingestion Handshake
When edge cameras detect density changes, they issue a high-concurrency websocket payload to `ws://stadiumos/api/spatial/update`. The FastAPI backend calculates the localized sector CPS, updating the blackboard cache immediately inside an in-memory **Redis Cluster** to keep frame rates under 100ms.

### 2. The Multi-Agent Decision Loop
Every 3 seconds, specialized agents (using Gemini 1.5 Flash via LangChain) inspect the Redis state matrix. If any sector crosses `CPS > 0.75`:
- **FlowMaster Agent** queries PostgreSQL for the three nearest `FIELD_RESPONDER` volunteer profiles marked `status: "AVAILABLE"`.
- Updates volunteer user states to `DISPATCHED`.
- Pushes dynamic haptic notifications to the respective mobile consoles.

### 3. Closing the Visual Loop
Next.js Command Centers and Flutter mobile AR clients maintain active WebSocket subscriptions. Database state transitions push instantly—rendering a sector in glowing neon **Red** on the supervisor iPad console, while spinning the AR arrow **Right** on the fan's mobile device to map the detour route.
