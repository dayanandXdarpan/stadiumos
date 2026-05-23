"""
CrowdIntelligenceAgent — reads mock sensor data for all 16 sectors,
computes CPS, updates the blackboard, and broadcasts sector_update messages.
"""

import asyncio
import logging
import random
from datetime import datetime, timezone

logger = logging.getLogger("stadiumos.agents.crowd_intelligence")


class CrowdIntelligenceAgent:
    """
    Core sensing agent.  Runs every 3 seconds and:
      - Generates synthetic density / velocity / audio-anomaly readings
      - Computes Crowd Pressure Score (CPS)
      - Updates the shared blackboard
      - Broadcasts sector_update WebSocket messages
    """

    AGENT_NAME = "CrowdIntelligence"

    def __init__(self, blackboard, broadcast_fn):
        self.blackboard = blackboard
        self.broadcast = broadcast_fn
        self._prev_cps: dict[str, float] = {}

    # ── Sensor simulation ─────────────────────────────────────────────────

    def _generate_reading(self, sector_id: str, is_surge: bool) -> dict:
        """Produce one realistic (mock) sensor reading for a sector."""
        if is_surge:
            # Inject high-density surge
            density = random.randint(350, 500)
            velocity = random.uniform(1.2, 2.0)
            audio_anomaly = random.uniform(0.5, 0.95)
        else:
            density = random.randint(20, 200)
            velocity = random.uniform(0.1, 1.5)
            audio_anomaly = random.uniform(0.0, 0.8)

        # Occasional organic spikes (5 % chance)
        if random.random() < 0.05 and not is_surge:
            density = random.randint(350, 450)

        # CPS formula  ────────────────────────────────────────────────────
        # 40 % density  |  35 % velocity  |  25 % audio
        cps = (
            0.40 * (density / 500.0)
            + 0.35 * (velocity / 2.0)
            + 0.25 * audio_anomaly
        )
        cps = round(min(cps, 1.0), 4)

        return {
            "sectorId":     sector_id,
            "cps":          cps,
            "density":      density,
            "velocity":     round(velocity, 3),
            "audioAnomaly": round(audio_anomaly, 3),
            "temperature":  round(random.uniform(18.0, 32.0), 1),
            "timestamp":    datetime.now(timezone.utc).isoformat(),
        }

    # ── Main loop ─────────────────────────────────────────────────────────

    async def run(self) -> None:
        logger.info("[%s] Agent started.", self.AGENT_NAME)
        from state.blackboard import ALL_SECTOR_IDS  # avoid circular at module level

        while True:
            try:
                # Which sectors are in an active surge?
                surge_sectors = await self.blackboard.pop_surge_sectors()

                for sector_id in ALL_SECTOR_IDS:
                    is_surge = sector_id in surge_sectors
                    reading = self._generate_reading(sector_id, is_surge)

                    if self.blackboard.edge_offline_mode:
                        from state.edge_sync import save_sector_log_offline
                        save_sector_log_offline(
                            sector_id, reading["cps"], reading["density"], reading["velocity"]
                        )
                    else:
                        # Update blackboard
                        await self.blackboard.update_sector(sector_id, reading)

                        # Broadcast sector_update to all WebSocket clients
                        await self.broadcast({
                            "type": "sector_update",
                            "payload": {
                                "sectorId":     reading["sectorId"],
                                "cps":          reading["cps"],
                                "density":      reading["density"],
                                "velocity":     reading["velocity"],
                                "audioAnomaly": reading["audioAnomaly"],
                                "timestamp":    reading["timestamp"],
                            },
                        })

                    # Log to ledger only when CPS shifts significantly (> 0.05)
                    prev = self._prev_cps.get(sector_id, 0.0)
                    if abs(reading["cps"] - prev) > 0.05:
                        await self.blackboard.log_agent_action(
                            agent=self.AGENT_NAME,
                            action="CPS_UPDATE",
                            sector=sector_id,
                            message=(
                                f"Sector {sector_id} CPS changed from "
                                f"{prev:.3f} to {reading['cps']:.3f}."
                            ),
                            reasoning=(
                                f"density={reading['density']}, "
                                f"velocity={reading['velocity']}, "
                                f"audioAnomaly={reading['audioAnomaly']}"
                            ),
                        )
                        self._prev_cps[sector_id] = reading["cps"]

            except Exception:
                logger.exception("[%s] Error in sensor loop.", self.AGENT_NAME)

            await asyncio.sleep(3)
