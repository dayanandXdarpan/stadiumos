name: "🐛 Bug Report"
description: "Report a system error, agent reasoning conflict, or frontend render crash."
title: "[BUG] <Short summary of anomaly>"
labels: ["bug", "triage"]
body:
  - type: markdown
    attributes:
      value: |
        Thanks for helping stabilize StadiumOS! Please provide as much technical context as possible.
  - type: textarea
    id: description
    attributes:
      label: Anomaly Description
      description: What is the current behavior and how does it deviate from the PRD requirements?
      placeholder: e.g. "AR directional arrow fails to rotate right when FlowMaster triggers detours."
    validations:
      required: true
  - type: dropdown
    id: component
    attributes:
      label: Affected System Component
      options:
        - "🤖 Multi-Agent swarms (FastAPI / LangChain)"
        - "🔮 Next.js 3D Digital Twin command center"
        - "📋 Next.js Supervisor Tablet view (/supervisor)"
        - "🛡️ Flutter Mobile App (Staff / GPS Mode)"
        - "📱 Flutter Mobile App (Fan / AR Mode)"
        - "🗄️ Database layers (Redis / Postgres PostGIS / SQLiteEdge)"
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: Steps to Reproduce
      description: Outline the precise steps to trigger the bug using the simulator controls.
      placeholder: |
        1. Open the /simulation page in the admin panel.
        2. Click 'Trigger Surge' on sector C3.
        3. Observe if the Flutter client vibrates and rotates the neon arrow.
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: System Logs
      description: Attach logs from uvicorn, Redis caches, Prisma migrations, or mobile logcat.
      placeholder: "e.g. 2026-05-23 | uvicorn | ERROR | WS connection closed unexpectedly..."
  - type: checkboxes
    id: env
    attributes:
      label: Environment Info
      options:
        - label: "Windows OS / PowerShell console"
          required: false
        - label: "Node.js v20+ & Next.js v16"
          required: false
        - label: "Flutter SDK v3.x"
          required: false
        - label: "Docker-compose running Redis/PostgreSQL"
          required: false
