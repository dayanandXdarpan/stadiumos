"""
TicketSentinelAgent — simulates gate barcode scanning with fraud (duplicate)
detection.  Also handles explicit fraud triggers from the REST API.
"""

import asyncio
import logging
import random
import string
from datetime import datetime, timezone

logger = logging.getLogger("stadiumos.agents.ticket_sentinel")

GATES = [f"Gate-{ch}" for ch in "ABCDEFGH"]   # Gate-A … Gate-H
BARCODE_POOL_SIZE = 500                          # pool of "valid" barcodes to draw from


def _random_barcode(length: int = 10) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


class TicketSentinelAgent:
    """
    Ticket-fraud detection agent.  Runs every 2 seconds and:
      - Generates mock barcode scans across 8 gates
      - Injects a duplicate barcode ~5 % of the time
      - Broadcasts FRAUD alerts when duplicates are detected
    """

    AGENT_NAME = "TicketSentinel"

    def __init__(self, blackboard, broadcast_fn):
        self.blackboard = blackboard
        self.broadcast = broadcast_fn

        # gate -> set of barcodes seen this session
        self.gate_scan_log: dict[str, list[str]] = {g: [] for g in GATES}

        # Shared barcode pool so duplicates are realistic
        self._barcode_pool: list[str] = [_random_barcode() for _ in range(BARCODE_POOL_SIZE)]

    # ── Fraud detection helpers ───────────────────────────────────────────

    async def _process_scan(self, gate_id: str, barcode: str) -> None:
        already_seen = barcode in self.gate_scan_log[gate_id]

        self.gate_scan_log[gate_id].append(barcode)
        # Keep log bounded
        if len(self.gate_scan_log[gate_id]) > 200:
            self.gate_scan_log[gate_id] = self.gate_scan_log[gate_id][-200:]

        if already_seen:
            await self._raise_fraud_alert(gate_id, barcode)

    async def _raise_fraud_alert(self, gate_id: str, barcode: str) -> None:
        # Update fraud counter
        async with asyncio.Lock():
            self.blackboard.fraud_flags[gate_id] = (
                self.blackboard.fraud_flags.get(gate_id, 0) + 1
            )

        timestamp = datetime.now(timezone.utc).isoformat()
        message = (
            f"Duplicate barcode '{barcode}' detected at {gate_id}. "
            f"Possible ticket cloning or resale fraud. Gate locked pending review."
        )
        reasoning = (
            f"Barcode already registered in gate_scan_log for {gate_id}. "
            f"Total fraud flags at gate: {self.blackboard.fraud_flags.get(gate_id, 1)}."
        )

        await self.blackboard.log_agent_action(
            agent=self.AGENT_NAME,
            action="FRAUD_DETECTED",
            sector=None,
            message=message,
            reasoning=reasoning,
        )

        await self.broadcast({
            "type": "agent_action",
            "payload": {
                "agent":     self.AGENT_NAME,
                "action":    "FRAUD_DETECTED",
                "sector":    None,
                "message":   message,
                "reasoning": reasoning,
                "timestamp": timestamp,
            },
        })

        alert = {
            "alertType":       "FRAUD",
            "severity":        "HIGH",
            "message":         f"Ticket fraud detected at {gate_id} — barcode {barcode}.",
            "affectedSectors": [gate_id],
            "timestamp":       timestamp,
        }
        await self.blackboard.add_alert(alert)
        await self.broadcast({"type": "alert", "payload": alert})

        logger.warning("[%s] FRAUD at %s — barcode %s.", self.AGENT_NAME, gate_id, barcode)

    # ── Main loop ─────────────────────────────────────────────────────────

    async def run(self) -> None:
        logger.info("[%s] Agent started.", self.AGENT_NAME)

        while True:
            try:
                # Check for API-triggered fraud events
                triggered_gates = await self.blackboard.pop_fraud_triggers()
                for gate_id in triggered_gates:
                    if gate_id in self.gate_scan_log:
                        # Pick a barcode that's already been scanned (guaranteed dup)
                        if self.gate_scan_log[gate_id]:
                            barcode = random.choice(self.gate_scan_log[gate_id])
                        else:
                            barcode = _random_barcode()
                            self.gate_scan_log[gate_id].append(barcode)
                        await self._raise_fraud_alert(gate_id, barcode)
                    else:
                        logger.warning("[%s] Unknown gate '%s' in fraud trigger.", self.AGENT_NAME, gate_id)

                # Simulate organic scans across all gates
                for gate_id in GATES:
                    # 3-8 scans per gate per tick
                    num_scans = random.randint(3, 8)
                    for _ in range(num_scans):
                        if random.random() < 0.05 and self.gate_scan_log[gate_id]:
                            # 5 % chance: inject a duplicate
                            barcode = random.choice(self.gate_scan_log[gate_id])
                        else:
                            barcode = random.choice(self._barcode_pool)
                        
                        if self.blackboard.edge_offline_mode:
                            from state.edge_sync import save_scan_offline
                            save_scan_offline(gate_id, barcode, "PENDING")
                        else:
                            await self._process_scan(gate_id, barcode)

            except Exception:
                logger.exception("[%s] Error in scan loop.", self.AGENT_NAME)

            await asyncio.sleep(2)
