"""
ClimaSyncAgent — monitors storm activation flag and adjusts CPS thresholds.
Also simulates background weather polling every 30 seconds.
"""

import asyncio
import logging
import random
from datetime import datetime, timezone

logger = logging.getLogger("stadiumos.agents.clima_sync")


class ClimaSyncAgent:
    """
    Weather-response agent.  Responsibilities:
      - Watches blackboard.storm_active flag (set by REST /trigger/storm)
      - Lowers CPS threshold by 25 % during storm; restores on deactivation
      - Simulates background weather polling with occasional auto-storm events
    """

    AGENT_NAME = "ClimaSync"

    def __init__(self, blackboard, broadcast_fn):
        self.blackboard = blackboard
        self.broadcast = broadcast_fn
        self._storm_was_active: bool = False

    # ── Storm response ────────────────────────────────────────────────────

    async def _on_storm_activated(self) -> None:
        timestamp = datetime.now(timezone.utc).isoformat()
        message = (
            "Storm detected. CPS thresholds reduced by 25 % across all open sectors. "
            "Shelter routing activated. Fan advisory issued via PA system."
        )
        reasoning = (
            f"blackboard.storm_active=True → cps_threshold reduced from "
            f"0.75 to {self.blackboard.cps_threshold:.4f}."
        )

        await self.blackboard.log_agent_action(
            agent=self.AGENT_NAME,
            action="STORM_RESPONSE",
            sector=None,
            message=message,
            reasoning=reasoning,
        )

        await self.broadcast({
            "type": "agent_action",
            "payload": {
                "agent":     self.AGENT_NAME,
                "action":    "STORM_RESPONSE",
                "sector":    None,
                "message":   message,
                "reasoning": reasoning,
                "timestamp": timestamp,
            },
        })

        alert = {
            "alertType":       "STORM",
            "severity":        "HIGH",
            "message":         "Severe weather event active. All outdoor concourses operating at reduced capacity.",
            "affectedSectors": list(self.blackboard.sectors.keys()),
            "timestamp":       timestamp,
        }
        await self.blackboard.add_alert(alert)
        await self.broadcast({"type": "alert", "payload": alert})
        logger.info("[%s] STORM ACTIVATED — threshold → %.4f.", self.AGENT_NAME, self.blackboard.cps_threshold)

    async def _on_storm_deactivated(self) -> None:
        timestamp = datetime.now(timezone.utc).isoformat()
        message = (
            "Storm event cleared. CPS thresholds restored to normal (0.75). "
            "Shelter routing deactivated. Normal operations resumed."
        )
        reasoning = (
            "blackboard.storm_active transitioned False → thresholds restored to 0.75."
        )

        await self.blackboard.log_agent_action(
            agent=self.AGENT_NAME,
            action="STORM_RECOVERY",
            sector=None,
            message=message,
            reasoning=reasoning,
        )

        await self.broadcast({
            "type": "agent_action",
            "payload": {
                "agent":     self.AGENT_NAME,
                "action":    "STORM_RECOVERY",
                "sector":    None,
                "message":   message,
                "reasoning": reasoning,
                "timestamp": timestamp,
            },
        })

        alert = {
            "alertType":       "STORM",
            "severity":        "LOW",
            "message":         "Weather cleared. Stadium returning to full operational capacity.",
            "affectedSectors": list(self.blackboard.sectors.keys()),
            "timestamp":       timestamp,
        }
        await self.blackboard.add_alert(alert)
        await self.broadcast({"type": "alert", "payload": alert})
        logger.info("[%s] STORM DEACTIVATED — threshold → %.4f.", self.AGENT_NAME, self.blackboard.cps_threshold)

    # ── Main loop ─────────────────────────────────────────────────────────

    async def run(self) -> None:
        logger.info("[%s] Agent started.", self.AGENT_NAME)
        poll_tick = 0

        while True:
            try:
                current_storm = self.blackboard.storm_active

                if current_storm and not self._storm_was_active:
                    # Storm just turned on
                    await self.blackboard.activate_storm()
                    await self._on_storm_activated()
                    self._storm_was_active = True

                elif not current_storm and self._storm_was_active:
                    # Storm just cleared
                    await self.blackboard.deactivate_storm()
                    await self._on_storm_deactivated()
                    self._storm_was_active = False

                # Background weather polling every ~30 s (10 ticks × 3 s sleep)
                poll_tick += 1
                if poll_tick >= 10:
                    poll_tick = 0
                    await self._poll_weather()

            except Exception:
                logger.exception("[%s] Error in monitoring loop.", self.AGENT_NAME)

            await asyncio.sleep(3)

    # ── Simulated weather polling ──────────────────────────────────────────

    async def _poll_weather(self) -> None:
        """Simulate an external weather API call every 30 seconds."""
        conditions = ["CLEAR", "CLOUDY", "DRIZZLE", "HEAVY_RAIN", "STORM"]
        weights    = [0.50,    0.25,    0.12,      0.08,        0.05]
        condition  = random.choices(conditions, weights=weights, k=1)[0]
        wind_speed = round(random.uniform(0, 30), 1)

        logger.debug("[%s] Weather poll → condition=%s, wind=%.1f km/h.",
                     self.AGENT_NAME, condition, wind_speed)

        # Auto-trigger storm from simulated weather (rare)
        if condition == "STORM" and not self.blackboard.storm_active:
            logger.info("[%s] Auto-activating storm from weather poll.", self.AGENT_NAME)
            self.blackboard.storm_active = True
