"""
Shared blackboard for StadiumOS agents.
Acts as the central nervous system — all agents read from and write to this.
Integrates directly with Redis (using write-through caching) and falls back
gracefully to in-memory mode if Redis is down/offline.
"""

import asyncio
import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Optional

logger = logging.getLogger("stadiumos.blackboard")

# ── Sector grid configuration ──────────────────────────────────────────────
SECTOR_ROWS = ["A", "B", "C", "D"]
SECTOR_COLS = ["1", "2", "3", "4"]
ALL_SECTOR_IDS = [f"{r}{c}" for r in SECTOR_ROWS for c in SECTOR_COLS]  # A1..D4

# Nearest exit mapping for evacuation routing (static for demo)
EVACUATION_ROUTES: dict[str, str] = {
    "A1": "Exit-North-1", "A2": "Exit-North-2", "A3": "Exit-North-3", "A4": "Exit-North-4",
    "B1": "Exit-West-1",  "B2": "Exit-Center-1","B3": "Exit-Center-2","B4": "Exit-East-1",
    "C1": "Exit-West-2",  "C2": "Exit-Center-3","C3": "Exit-Center-4","C4": "Exit-East-2",
    "D1": "Exit-South-1", "D2": "Exit-South-2", "D3": "Exit-South-3", "D4": "Exit-South-4",
}

DEFAULT_CPS_THRESHOLD = 0.75
STORM_CPS_THRESHOLD   = 0.5625   # 25% reduction

MAX_LEDGER_SIZE = 100


def _default_sector(sector_id: str) -> dict:
    return {
        "sectorId":     sector_id,
        "cps":          0.0,
        "density":      0,
        "velocity":     0.0,
        "audioAnomaly": 0.0,
        "temperature":  22.0,   # degrees Celsius
        "status":       "normal",  # normal | warning | critical | evacuating
    }


class RedisSyncedDict(dict):
    """
    A dictionary wrapper that intercepts writes and updates to automatically
    sync key-value pairs back to Redis, enabling zero-code changes in agents.
    """
    def __init__(self, blackboard, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._blackboard = blackboard

    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        if self._blackboard._redis_available and self._blackboard._redis:
            try:
                self._blackboard._redis.hset("stadiumos:fraud_flags", key, str(value))
            except Exception as r_exc:
                logger.warning("Redis fraud flag set failed for %s: %s", key, r_exc)

    def update(self, *args, **kwargs):
        super().update(*args, **kwargs)
        if self._blackboard._redis_available and self._blackboard._redis:
            try:
                mapping = {k: str(v) for k, v in dict(*args, **kwargs).items()}
                self._blackboard._redis.hset("stadiumos:fraud_flags", mapping=mapping)
            except Exception as r_exc:
                logger.warning("Redis fraud flag update failed: %s", r_exc)


class Blackboard:
    """Thread-safe shared state for all StadiumOS agents with Redis caching."""

    def __init__(self):
        self._lock = asyncio.Lock()

        # ── Sector state ──────────────────────────────────────────────────
        self.sectors: dict[str, dict] = {
            sid: _default_sector(sid) for sid in ALL_SECTOR_IDS
        }

        # ── Storm / threshold state ────────────────────────────────────────
        self.storm_active: bool = False
        self.cps_threshold: float = DEFAULT_CPS_THRESHOLD

        # ── Agent decision ledger ─────────────────────────────────────────
        self.agent_ledger: list[dict] = []

        # ── Active alerts ─────────────────────────────────────────────────
        self.active_alerts: list[dict] = []

        # ── Fraud tracking (Redis-synced custom dict) ─────────────────────
        self.fraud_flags = RedisSyncedDict(self)

        # ── Network drop edge offline flag (PRD Section 5.1 addition) ─────
        self.edge_offline_mode: bool = False

        # ── Surge-trigger state (set by REST API, consumed by FlowMaster) ─
        self.surge_sectors: set[str] = set()

        # ── Fraud-trigger state (set by REST API, consumed by TicketSentinel)
        self.fraud_trigger_gates: list[str] = []

        # ── Redis connection startup ──────────────────────────────────────
        self._redis = None
        self._redis_available = False
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")

        try:
            import redis
            # 1.0s timeout to prevent blocking application lifespan in case local Redis is offline
            self._redis = redis.Redis.from_url(
                redis_url, socket_timeout=1.0, socket_connect_timeout=1.0, decode_responses=True
            )
            self._redis.ping()
            self._redis_available = True
            logger.info("Blackboard Redis Cache active at %s.", redis_url)
            
            # Initialise standard default parameters inside Redis
            self._redis.set("stadiumos:storm_active", "False")
            self._redis.set("stadiumos:cps_threshold", str(DEFAULT_CPS_THRESHOLD))
            self._redis.set("stadiumos:edge_offline_mode", "False")
        except Exception as exc:
            logger.warning(
                "Redis blackboard cache offline — running in local-only fallback mode. Reason: %s", exc
            )
            self._redis_available = False

        logger.info("Blackboard initialised with %d sectors.", len(self.sectors))

    # ── Sector helpers ────────────────────────────────────────────────────

    def get_sector(self, sector_id: str) -> Optional[dict]:
        """Return a copy of a sector's state, checking Redis first."""
        if self._redis_available and self._redis:
            try:
                data = self._redis.hgetall(f"stadiumos:sector:{sector_id}")
                if data:
                    return {
                        "sectorId":     data.get("sectorId", sector_id),
                        "cps":          float(data.get("cps", "0.0")),
                        "density":      float(data.get("density", "0.0")),
                        "velocity":     float(data.get("velocity", "0.0")),
                        "audioAnomaly": float(data.get("audioAnomaly", "0.0")),
                        "temperature":  float(data.get("temperature", "22.0")),
                        "status":       data.get("status", "normal"),
                    }
            except Exception as r_exc:
                logger.warning("Redis read failed for sector %s: %s", sector_id, r_exc)

        # Fallback
        sector = self.sectors.get(sector_id)
        return dict(sector) if sector else None

    async def update_sector(self, sector_id: str, data: dict) -> None:
        """Merge *data* into the sector and update its status label in Redis/RAM."""
        async with self._lock:
            if sector_id not in self.sectors:
                logger.warning("update_sector: unknown sector '%s'", sector_id)
                return
            self.sectors[sector_id].update(data)
            
            # Auto-set status based on CPS
            cps = self.sectors[sector_id].get("cps", 0.0)
            if cps >= 0.9:
                self.sectors[sector_id]["status"] = "critical"
            elif cps >= self.cps_threshold:
                self.sectors[sector_id]["status"] = "warning"
            else:
                self.sectors[sector_id]["status"] = "normal"

            # Redis sync
            if self._redis_available and self._redis:
                try:
                    mapping = {k: str(v) for k, v in self.sectors[sector_id].items()}
                    self._redis.hset(f"stadiumos:sector:{sector_id}", mapping=mapping)
                except Exception as r_exc:
                    logger.warning("Redis write failed for sector %s: %s", sector_id, r_exc)

    # ── Agent ledger ──────────────────────────────────────────────────────

    async def log_agent_action(
        self,
        agent: str,
        action: str,
        sector: Optional[str],
        message: str,
        reasoning: str,
    ) -> dict:
        """Append an entry to the agent decision ledger (capped at 100) in Redis/RAM."""
        entry = {
            "agent":     agent,
            "action":    action,
            "sector":    sector or "--",
            "message":   message,
            "reasoning": reasoning,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        async with self._lock:
            self.agent_ledger.append(entry)
            if len(self.agent_ledger) > MAX_LEDGER_SIZE:
                self.agent_ledger = self.agent_ledger[-MAX_LEDGER_SIZE:]

            # Redis sync
            if self._redis_available and self._redis:
                try:
                    self._redis.rpush("stadiumos:agent_ledger", json.dumps(entry))
                    self._redis.ltrim("stadiumos:agent_ledger", -MAX_LEDGER_SIZE, -1)
                except Exception as r_exc:
                    logger.warning("Redis log failed: %s", r_exc)
        return entry

    # ── Alerts ────────────────────────────────────────────────────────────

    async def add_alert(self, alert: dict) -> None:
        """Add an alert and keep the list bounded at 50 entries in Redis/RAM."""
        async with self._lock:
            self.active_alerts.append(alert)
            if len(self.active_alerts) > 50:
                self.active_alerts = self.active_alerts[-50:]

            # Redis sync
            if self._redis_available and self._redis:
                try:
                    self._redis.rpush("stadiumos:active_alerts", json.dumps(alert))
                    self._redis.ltrim("stadiumos:active_alerts", -50, -1)
                except Exception as r_exc:
                    logger.warning("Redis alert push failed: %s", r_exc)

    # ── Snapshot ─────────────────────────────────────────────────────────

    def get_snapshot(self) -> dict:
        """Return a full point-in-time snapshot of the blackboard from Redis or fallback RAM."""
        if self._redis_available and self._redis:
            try:
                sectors_list = []
                for sid in ALL_SECTOR_IDS:
                    s_data = self._redis.hgetall(f"stadiumos:sector:{sid}")
                    if s_data:
                        sectors_list.append({
                            "sectorId":     s_data.get("sectorId", sid),
                            "cps":          float(s_data.get("cps", "0.0")),
                            "density":      float(s_data.get("density", "0.0")),
                            "velocity":     float(s_data.get("velocity", "0.0")),
                            "audioAnomaly": float(s_data.get("audioAnomaly", "0.0")),
                            "temperature":  float(s_data.get("temperature", "22.0")),
                            "status":       s_data.get("status", "normal"),
                        })
                
                # Fetch alerts
                redis_alerts = self._redis.lrange("stadiumos:active_alerts", -50, -1)
                alerts_list = [json.loads(a) for a in redis_alerts] if redis_alerts else []
                
                # Fetch ledger
                redis_ledger = self._redis.lrange("stadiumos:agent_ledger", -MAX_LEDGER_SIZE, -1)
                ledger_list = [json.loads(l) for l in redis_ledger] if redis_ledger else []

                # Fetch fraud flags
                redis_fraud = self._redis.hgetall("stadiumos:fraud_flags")
                fraud_flags = {k: int(v) for k, v in redis_fraud.items()} if redis_fraud else dict(self.fraud_flags)

                # Fetch state metrics
                storm_active = self._redis.get("stadiumos:storm_active") == "True"
                cps_threshold = float(self._redis.get("stadiumos:cps_threshold") or DEFAULT_CPS_THRESHOLD)
                edge_offline_mode = self._redis.get("stadiumos:edge_offline_mode") == "True"

                return {
                    "sectors":           sectors_list if len(sectors_list) == 16 else list(self.sectors.values()),
                    "storm_active":      storm_active,
                    "cps_threshold":     cps_threshold,
                    "edge_offline_mode": edge_offline_mode,
                    "active_alerts":     alerts_list if alerts_list else list(self.active_alerts),
                    "fraud_flags":       fraud_flags,
                    "agent_ledger":      ledger_list[-20:] if ledger_list else list(self.agent_ledger[-20:]),
                    "timestamp":         datetime.now(timezone.utc).isoformat(),
                }
            except Exception as r_exc:
                logger.warning("Redis get_snapshot failed: %s. Falling back to RAM state.", r_exc)

        # Fallback local in-memory snapshot
        return {
            "sectors":           list(self.sectors.values()),
            "storm_active":      self.storm_active,
            "cps_threshold":     self.cps_threshold,
            "edge_offline_mode": self.edge_offline_mode,
            "active_alerts":     list(self.active_alerts),
            "fraud_flags":       dict(self.fraud_flags),
            "agent_ledger":      list(self.agent_ledger[-20:]),
            "timestamp":         datetime.now(timezone.utc).isoformat(),
        }

    # ── Storm helpers ──────────────────────────────────────────────────────

    async def activate_storm(self) -> None:
        async with self._lock:
            self.storm_active = True
            self.cps_threshold = STORM_CPS_THRESHOLD

            if self._redis_available and self._redis:
                try:
                    self._redis.set("stadiumos:storm_active", "True")
                    self._redis.set("stadiumos:cps_threshold", str(STORM_CPS_THRESHOLD))
                except Exception as r_exc:
                    logger.warning("Redis storm active set failed: %s", r_exc)
        logger.info("Storm ACTIVATED — CPS threshold → %.4f", STORM_CPS_THRESHOLD)

    async def deactivate_storm(self) -> None:
        async with self._lock:
            self.storm_active = False
            self.cps_threshold = DEFAULT_CPS_THRESHOLD

            if self._redis_available and self._redis:
                try:
                    self._redis.set("stadiumos:storm_active", "False")
                    self._redis.set("stadiumos:cps_threshold", str(DEFAULT_CPS_THRESHOLD))
                except Exception as r_exc:
                    logger.warning("Redis storm deactivate failed: %s", r_exc)
        logger.info("Storm DEACTIVATED — CPS threshold → %.4f", DEFAULT_CPS_THRESHOLD)

    # ── Edge Offline Mode Toggle (PRD Section 5.1) ─────────────────────────

    async def set_edge_offline(self, status: bool) -> None:
        async with self._lock:
            self.edge_offline_mode = status
            if self._redis_available and self._redis:
                try:
                    self._redis.set("stadiumos:edge_offline_mode", str(status))
                except Exception as r_exc:
                    logger.warning("Redis edge mode set failed: %s", r_exc)
        logger.info("Edge offline replication mode set to %s.", status)

    # ── Surge / fraud triggers (from REST API) ─────────────────────────────

    async def trigger_surge(self, sector_id: str) -> None:
        async with self._lock:
            self.surge_sectors.add(sector_id)

    async def trigger_fraud(self, gate_id: str) -> None:
        async with self._lock:
            self.fraud_trigger_gates.append(gate_id)

    async def pop_fraud_triggers(self) -> list[str]:
        async with self._lock:
            triggers = list(self.fraud_trigger_gates)
            self.fraud_trigger_gates.clear()
            return triggers

    async def pop_surge_sectors(self) -> set[str]:
        async with self._lock:
            surges = set(self.surge_sectors)
            self.surge_sectors.clear()
            return surges


# ── Singleton ─────────────────────────────────────────────────────────────
blackboard = Blackboard()
