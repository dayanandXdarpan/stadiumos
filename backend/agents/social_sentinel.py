"""
SocialSentinelAgent — simulates NLP sentiment analysis on mock social media
feeds and raises alerts when negative spikes are detected near sector clusters.
"""

import asyncio
import logging
import random
from datetime import datetime, timezone

logger = logging.getLogger("stadiumos.agents.social_sentinel")

# Sector clusters representing geographic areas of the stadium
SECTOR_CLUSTERS = {
    "North Stand":  ["A1", "A2", "A3", "A4"],
    "West Stand":   ["B1", "C1"],
    "East Stand":   ["B4", "C4"],
    "South Stand":  ["D1", "D2", "D3", "D4"],
    "Center Bowl":  ["B2", "B3", "C2", "C3"],
}

SENTIMENT_THRESHOLD = -0.4   # below this → alert


class SocialSentinelAgent:
    """
    Social-media intelligence agent.  Runs every 15 seconds and:
      - Generates synthetic sentiment scores per sector cluster
      - Raises SENTIMENT alerts when scores drop below -0.4
      - Logs context-aware advisory messages
    """

    AGENT_NAME = "SocialSentinel"

    NEGATIVE_MESSAGES = [
        "Negative sentiment spike detected near {cluster} area. Potential queue frustration 10-15 min pre-sensor.",
        "Social feed analysis shows frustration signals near {cluster}. Queue build-up likely.",
        "Crowd dissatisfaction trending in {cluster}. Concession delays reported on social media.",
        "Elevated complaint volume near {cluster}. Fan experience intervention recommended.",
        "Sentiment analysis: {cluster} showing distress signals. Probable cause: long wait times or access issues.",
    ]

    def __init__(self, blackboard, broadcast_fn):
        self.blackboard = blackboard
        self.broadcast = broadcast_fn

    def _simulate_sentiment(self) -> dict[str, float]:
        """Return a sentiment score [-1, +1] per cluster."""
        scores: dict[str, float] = {}
        for cluster in SECTOR_CLUSTERS:
            # Base sentiment is mildly positive, with rare negative dips
            base = random.uniform(-0.2, 0.6)
            # 10 % chance of a significant negative event
            if random.random() < 0.10:
                base = random.uniform(-0.85, SENTIMENT_THRESHOLD - 0.01)
            scores[cluster] = round(base, 3)
        return scores

    async def run(self) -> None:
        logger.info("[%s] Agent started.", self.AGENT_NAME)

        while True:
            try:
                sentiments = self._simulate_sentiment()

                for cluster, score in sentiments.items():
                    if score < SENTIMENT_THRESHOLD:
                        affected = SECTOR_CLUSTERS.get(cluster, [])
                        timestamp = datetime.now(timezone.utc).isoformat()

                        msg_template = random.choice(self.NEGATIVE_MESSAGES)
                        message = msg_template.format(cluster=cluster)
                        reasoning = (
                            f"Synthetic NLP sentiment score for {cluster}: {score:.3f} "
                            f"(threshold: {SENTIMENT_THRESHOLD}). "
                            f"Affected sectors: {', '.join(affected)}."
                        )

                        await self.blackboard.log_agent_action(
                            agent=self.AGENT_NAME,
                            action="SENTIMENT_ALERT",
                            sector=affected[0] if affected else None,
                            message=message,
                            reasoning=reasoning,
                        )

                        await self.broadcast({
                            "type": "agent_action",
                            "payload": {
                                "agent":     self.AGENT_NAME,
                                "action":    "SENTIMENT_ALERT",
                                "sector":    affected[0] if affected else None,
                                "message":   message,
                                "reasoning": reasoning,
                                "timestamp": timestamp,
                            },
                        })

                        alert = {
                            "alertType":       "SENTIMENT",
                            "severity":        "MEDIUM",
                            "message":         message,
                            "affectedSectors": affected,
                            "timestamp":       timestamp,
                        }
                        await self.blackboard.add_alert(alert)
                        await self.broadcast({"type": "alert", "payload": alert})

                        logger.info("[%s] SENTIMENT_ALERT — %s (score %.3f).",
                                    self.AGENT_NAME, cluster, score)

            except Exception:
                logger.exception("[%s] Error in sentiment loop.", self.AGENT_NAME)

            await asyncio.sleep(15)
