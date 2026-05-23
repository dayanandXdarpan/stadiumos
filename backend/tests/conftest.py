import os
import sys
import pytest
import sqlite3
from unittest.mock import AsyncMock, MagicMock

# Force testing configuration
os.environ["REDIS_URL"] = "redis://localhost:6379"
os.environ["GEMINI_API_KEY"] = "mock-key"

# Ensure backend root is in import path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# ── Mock Redis Implementation ──────────────────────────────────────────────

class MockRedis:
    def __init__(self, *args, **kwargs):
        self.store = {}
        self.hashes = {}
        self.lists = {}

    def ping(self):
        return True

    def set(self, key, value):
        self.store[key] = str(value)
        return True

    def get(self, key):
        return self.store.get(key)

    def hset(self, name, key=None, value=None, mapping=None):
        if name not in self.hashes:
            self.hashes[name] = {}
        if mapping:
            for k, v in mapping.items():
                self.hashes[name][k] = str(v)
        elif key is not None:
            self.hashes[name][key] = str(value)
        return 1

    def hgetall(self, name):
        return self.hashes.get(name, {})

    def rpush(self, name, *values):
        if name not in self.lists:
            self.lists[name] = []
        for val in values:
            self.lists[name].append(str(val))
        return len(self.lists[name])

    def ltrim(self, name, start, end):
        if name in self.lists:
            lst = self.lists[name]
            # Convert negative indices
            s = start if start >= 0 else len(lst) + start
            e = end if end >= 0 else len(lst) + end
            self.lists[name] = lst[s : e + 1]
        return True

    def lrange(self, name, start, end):
        if name not in self.lists:
            return []
        lst = self.lists[name]
        s = start if start >= 0 else len(lst) + start
        e = end if end >= 0 else len(lst) + end
        return lst[s : e + 1]


# Inject MockRedis into sys.modules to intercept imports
import redis
redis.Redis = MagicMock()
redis.Redis.from_url = MagicMock()


# ── Global Pytest Fixtures ───────────────────────────────────────────────

@pytest.fixture(autouse=True)
def clean_db_env(monkeypatch, tmp_path):
    """Overrides DB_PATH in edge_sync to use a temporary SQLite file for every test."""
    test_db = tmp_path / "test_edge_sync.db"
    monkeypatch.setattr("state.edge_sync.DB_PATH", str(test_db))
    
    # Initialize the test database
    from state.edge_sync import init_db
    init_db()
    
    yield test_db
    
    # SQLite connection cleanup if any left open
    if test_db.exists():
        try:
            os.remove(test_db)
        except Exception:
            pass


@pytest.fixture
def clean_blackboard():
    """Returns a fresh instance of Blackboard with clean in-memory/mock-redis data."""
    mock_inst = MockRedis()
    redis.Redis.from_url.return_value = mock_inst
    redis.Redis.return_value = mock_inst
    
    from state.blackboard import Blackboard
    FreshBlackboard = Blackboard()
    
    # Populate default sectors
    for sector in FreshBlackboard.sectors.values():
        sector.update({
            "cps": 0.0,
            "density": 0,
            "velocity": 0.0,
            "audioAnomaly": 0.0,
            "temperature": 22.0,
            "status": "normal"
        })
    FreshBlackboard.storm_active = False
    FreshBlackboard.cps_threshold = 0.75
    FreshBlackboard.agent_ledger.clear()
    FreshBlackboard.active_alerts.clear()
    FreshBlackboard.fraud_flags.clear()
    FreshBlackboard.edge_offline_mode = False
    FreshBlackboard.surge_sectors.clear()
    FreshBlackboard.fraud_trigger_gates.clear()
    
    # Populate default sectors in mock redis to simulate complete synced state
    for sector_id in FreshBlackboard.sectors:
        mock_inst.hset(
            f"stadiumos:sector:{sector_id}",
            mapping={k: str(v) for k, v in FreshBlackboard.sectors[sector_id].items()}
        )
        
    return FreshBlackboard


@pytest.fixture
def mock_broadcast():
    """Mock asynchronous broadcast method."""
    return AsyncMock()
