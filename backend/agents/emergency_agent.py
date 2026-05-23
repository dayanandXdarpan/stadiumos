"""
EmergencyAgent — monitors for critical CPS (> 0.9) and computes
pre-configured evacuation routes to the nearest exits.
"""

import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger("stadiumos.agents.emergency_agent")

# Minimum time between evacuation alerts for the same sector (seconds)
EVACUATION_COOLDOWN = 60


class EmergencyAgent:
    """
    Life-safety agent.  Runs every 3 seconds and:
      - Checks all sectors for CPS > 0.9 (critical threshold)
      - Computes the nearest-exit evacuation route (static routing table)
      - Logs EVACUATION_ROUTE action and broadcasts EMERGENCY alert
    """

    AGENT_NAME = "EmergencyAgent"
    CRITICAL_CPS = 0.9

    def __init__(self, blackboard, broadcast_fn):
        self.blackboard = blackboard
        self.broadcast = broadcast_fn
        self._last_evacuated: dict[str, float] = {}  # sector_id -> monotonic timestamp

    def _get_evacuation_route(self, sector_id: str) -> str:
        """Return the nearest exit for a sector (static lookup)."""
        from state.blackboard import EVACUATION_ROUTES
        return EVACUATION_ROUTES.get(sector_id, "Exit-General")

    async def _handle_critical_sector(self, sector: dict) -> None:
        import time
        sector_id = sector["sectorId"]
        cps = sector["cps"]

        # Cooldown guard
        now = time.monotonic()
        if now - self._last_evacuated.get(sector_id, 0.0) < EVACUATION_COOLDOWN:
            return
        self._last_evacuated[sector_id] = now

        exit_route = self._get_evacuation_route(sector_id)
        timestamp = datetime.now(timezone.utc).isoformat()

        message = (
            f"CRITICAL crowd density in sector {sector_id}. "
            f"Immediate evacuation via {exit_route} recommended. "
            f"All staff to sector perimeter positions."
        )
        reasoning = (
            f"CPS={cps:.4f} exceeds CRITICAL threshold ({self.CRITICAL_CPS}). "
            f"Nearest designated exit: {exit_route}. "
            f"Static evacuation routing applied."
        )

        await self.blackboard.log_agent_action(
            agent=self.AGENT_NAME,
            action="EVACUATION_ROUTE",
            sector=sector_id,
            message=message,
            reasoning=reasoning,
        )

        await self.broadcast({
            "type": "agent_action",
            "payload": {
                "agent":     self.AGENT_NAME,
                "action":    "EVACUATION_ROUTE",
                "sector":    sector_id,
                "message":   message,
                "reasoning": reasoning,
                "timestamp": timestamp,
            },
        })

        alert = {
            "alertType":       "EMERGENCY",
            "severity":        "CRITICAL",
            "message":         message,
            "affectedSectors": [sector_id],
            "timestamp":       timestamp,
        }
        await self.blackboard.add_alert(alert)
        await self.broadcast({"type": "alert", "payload": alert})

        logger.critical("[%s] EVACUATION — sector %s (CPS %.4f) → %s.",
                        self.AGENT_NAME, sector_id, cps, exit_route)

    # ── Main loop ─────────────────────────────────────────────────────────

    async def run(self) -> None:
        logger.info("[%s] Agent started.", self.AGENT_NAME)

        while True:
            try:
                sectors = list(self.blackboard.sectors.values())
                for sector in sectors:
                    if sector["cps"] >= self.CRITICAL_CPS:
                        await self._handle_critical_sector(sector)

            except Exception:
                logger.exception("[%s] Error in emergency monitor.", self.AGENT_NAME)

            await asyncio.sleep(3)
