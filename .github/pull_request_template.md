## 🏟️ StadiumOS Pull Request Template

### Description
Provide a concise summary of the changes introduced by this PR. Mention if it updates agent reasoning models, Web/Mobile visual canvas components, GIS boundaries, or database schemas.

Fixes # (issue)

### Type of Change
- [ ] 🤖 Agent swarm logic update (LangChain / Gemini Flash / ClimaSync)
- [ ] 🔮 Frontend 3D Twin upgrade (Canvas 3D / CustomPainter / Radar)
- [ ] 📱 Mobile client enhancement (QR auth / video-loops / Haptics)
- [ ] 🗄️ Database migration (Prisma / PostGIS spatial matrices / SQLiteEdge)
- [ ] 🔐 Security update (Zero-PII YOLOv8 anonymization rules)
- [ ] 📚 Documentation / README / PRD update

---

### 🎨 Visual & Telemetry Verification (Required for Frontend / AR changes)
- [ ] Next.js 3D seats grid rendering verified under dynamic WebSocket CPS updates.
- [ ] Flutter CustomPainter radar sweeps and location-beacons verified under simulated patrol tracks.
- [ ] AR Directional Arrow correctly rotates 90° right upon intercepting `REROUTE` WebSocket payloads.
- [ ] Glassmorphic AI Fan Assistant greets "Deepak" by name and prompts correct dual action routes.

### 🧪 Integration & Swarm Testing
- [ ] Multi-Agent Blackboard state transitions validated via local Redis clusters.
- [ ] Mock simulator scenario scripts successfully inject Storm/Surge REST commands.
- [ ] Local SQLite edge turnstile scans validate offline and successfully flush downstream upon network reconnect.

### 🔐 Zero-PII Compliance Checklist
- [ ] Raw CCTV video frames are verified to discard immediately at the edge.
- [ ] YOLOv8 counts do not contain biometric signatures or face hashes.
- [ ] Fan location traces utilize randomized cryptographic session tokens.

---

### Screenshots / Videos (If applicable)
*Please attach screenshots or loop recordings of the 3D Command dashboard, Supervisor tablet, or Mobile AR guides.*
