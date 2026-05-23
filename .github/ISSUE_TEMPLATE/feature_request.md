name: "💡 Feature Request"
description: "Propose a new AI agent, a 3D stadium layout coordinate, or a new GIS pathfinding path."
title: "[FEAT] <Short summary of request>"
labels: ["enhancement", "feature"]
body:
  - type: textarea
    id: overview
    attributes:
      label: Feature Overview
      description: Explain the visual, logistical, or database enhancement you'd like to introduce.
      placeholder: e.g. "Add a commercial vendor agent to nudge fans with real-time concessions discounts..."
    validations:
      required: true
  - type: textarea
    id: problem
    attributes:
      label: Operational Problem Solved
      description: What operational gap or smart arena bottleneck does this feature address?
      placeholder: "e.g. Traditional concessions lines back up during half-time, chokepoints form."
    validations:
      required: true
  - type: textarea
    id: specs
    attributes:
      label: Technical & Swarm Specifications
      description: How will this feature integrate with the Redis Blackboard, PostgreSQL schemas, and Next.js / Flutter canvases?
      placeholder: "e.g. CommercialAgent monitors sector density; if high, sends a Voucher to nearby Attendees..."
    validations:
      required: true
  - type: checkboxes
    id: rules
    attributes:
      label: Compliance Checks
      options:
        - label: "Conforms to StadiumOS Zero-PII security rules"
          required: true
        - label: "Functions correctly under SQLite edge-mode network drops"
          required: true
