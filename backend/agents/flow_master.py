"""
FlowMasterAgent — monitors sector CPS and triggers rerouting when thresholds
are exceeded.  Also handles explicit surge triggers from the REST API.
"""

import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger("stadiumos.agents.flow_master")


class FlowMasterAgent:
    """
    Traffic-routing agent.  Runs every 3 seconds and:
      - Checks all sectors against the current CPS threshold
      - When a sector is over-threshold, selects 2 low-CPS alternatives
      - Logs a REROUTE action and broadcasts an agent_action + alert message
    """

    AGENT_NAME = "FlowMaster"
    COOLDOWN_SECONDS = 15   # don't re-alert the same sector within this window

    def __init__(self, blackboard, broadcast_fn):
        self.blackboard = blackboard
        self.broadcast = broadcast_fn
        self._last_alerted: dict[str, float] = {}  # sector_id -> epoch timestamp

    # ── Rerouting logic ───────────────────────────────────────────────────

    def _pick_alternatives(self, hot_sector: str, all_sectors: list[dict]) -> list[str]:
        """Return the 2 sectors with the lowest CPS (excluding the hot sector)."""
        candidates = [
            s for s in all_sectors if s["sectorId"] != hot_sector
        ]
        candidates.sort(key=lambda s: s["cps"])
        return [s["sectorId"] for s in candidates[:2]]

    async def _handle_hot_sector(self, sector: dict, threshold: float) -> None:
        sector_id = sector["sectorId"]
        cps = sector["cps"]

        # Cooldown guard — avoid alert spam
        import time
        now = time.monotonic()
        if now - self._last_alerted.get(sector_id, 0.0) < self.COOLDOWN_SECONDS:
            return
        self._last_alerted[sector_id] = now

        # Pick alternatives from current snapshot
        all_sectors = list(self.blackboard.sectors.values())
        alternatives = self._pick_alternatives(sector_id, all_sectors)
        alt_str = " and ".join(alternatives)

        severity = "CRITICAL" if cps >= 0.9 else "HIGH"
        timestamp = datetime.now(timezone.utc).isoformat()

        message = (
            f"Diverting traffic from sector {sector_id} to {alt_str}. "
            f"Crowd flow re-routed via concourse junctions."
        )
        reasoning = (
            f"CPS at {sector_id} is {cps:.4f}, threshold is {threshold:.4f}. "
            f"Sectors {alt_str} have lowest current crowd pressure."
        )

        # Log to blackboard ledger
        await self.blackboard.log_agent_action(
            agent=self.AGENT_NAME,
            action="REROUTE",
            sector=sector_id,
            message=message,
            reasoning=reasoning,
        )

        # Broadcast agent_action
        await self.broadcast({
            "type": "agent_action",
            "payload": {
                "agent":     self.AGENT_NAME,
                "action":    "REROUTE",
                "sector":    sector_id,
                "message":   message,
                "reasoning": reasoning,
                "timestamp": timestamp,
            },
        })

        # Broadcast alert
        alert = {
            "alertType":       "SURGE",
            "severity":        severity,
            "message":         f"Crowd surge detected in sector {sector_id} (CPS {cps:.3f}).",
            "affectedSectors": [sector_id],
            "timestamp":       timestamp,
        }
        await self.blackboard.add_alert(alert)
        await self.broadcast({"type": "alert", "payload": alert})

        logger.info("[%s] REROUTE — sector %s (CPS %.4f → %s / %s).",
                    self.AGENT_NAME, sector_id, cps, *alternatives)

    # ── Main loop ─────────────────────────────────────────────────────────

    async def run(self) -> None:
        logger.info("[%s] Agent started.", self.AGENT_NAME)

        while True:
            try:
                threshold = self.blackboard.cps_threshold
                sectors   = list(self.blackboard.sectors.values())

                for sector in sectors:
                    if sector["cps"] > threshold:
                        await self._handle_hot_sector(sector, threshold)

            except Exception:
                logger.exception("[%s] Error in monitoring loop.", self.AGENT_NAME)

            await asyncio.sleep(3)

    # ── Explicit API trigger ──────────────────────────────────────────────

    async def handle_surge_trigger(self, sector_id: str) -> None:
        """Called directly by the REST endpoint to force a surge event."""
        sector = self.blackboard.get_sector(sector_id)
        if not sector:
            logger.warning("[%s] Surge trigger — unknown sector '%s'.", self.AGENT_NAME, sector_id)
            return

        # Temporarily inflate CPS so rerouting fires immediately
        sector["cps"] = max(sector["cps"], 0.85)
        await self._handle_hot_sector(sector, self.blackboard.cps_threshold)
