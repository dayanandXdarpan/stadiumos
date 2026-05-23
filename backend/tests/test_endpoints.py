import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

# Mock agent runs to prevent infinite loops during backend lifespan tests
@pytest.fixture(autouse=True)
def mock_agent_runs():
    with patch("agents.crowd_intelligence.CrowdIntelligenceAgent.run", new_callable=AsyncMock), \
         patch("agents.flow_master.FlowMasterAgent.run", new_callable=AsyncMock), \
         patch("agents.ticket_sentinel.TicketSentinelAgent.run", new_callable=AsyncMock), \
         patch("agents.clima_sync.ClimaSyncAgent.run", new_callable=AsyncMock), \
         patch("agents.social_sentinel.SocialSentinelAgent.run", new_callable=AsyncMock), \
         patch("agents.emergency_agent.EmergencyAgent.run", new_callable=AsyncMock), \
         patch("state.edge_sync.sync_worker", new_callable=AsyncMock):
        yield

@pytest.fixture
def client(clean_blackboard):
    # Patch the global blackboard inside main.py to use the clean_blackboard fixture
    with patch("main.blackboard", clean_blackboard), \
         patch("state.blackboard.blackboard", clean_blackboard):
        from main import app
        # Use TestClient as a context manager to fire lifespan events
        with TestClient(app) as test_client:
            yield test_client

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["service"] == "stadiumos-backend"

def test_get_state(client):
    response = client.get("/api/state")
    assert response.status_code == 200
    data = response.json()
    assert "sectors" in data
    assert len(data["sectors"]) == 16
    assert data["storm_active"] is False

def test_get_sectors(client):
    response = client.get("/api/sectors")
    assert response.status_code == 200
    data = response.json()
    assert "sectors" in data
    assert len(data["sectors"]) == 16
    assert "threshold" in data

def test_get_ledger(client):
    response = client.get("/api/agents/ledger")
    assert response.status_code == 200
    data = response.json()
    assert "ledger" in data
    assert "count" in data

def test_trigger_storm(client):
    # 1. Trigger ON
    response = client.post("/api/trigger/storm")
    assert response.status_code == 200
    assert response.json()["storm_active"] is True
    
    # 2. Trigger OFF
    response = client.post("/api/trigger/storm")
    assert response.status_code == 200
    assert response.json()["storm_active"] is False

def test_trigger_surge(client):
    # Success case
    response = client.post("/api/trigger/surge", json={"sectorId": "B3"})
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["sectorId"] == "B3"
    
    # Error case (Unknown sector)
    response = client.post("/api/trigger/surge", json={"sectorId": "XYZ"})
    assert response.status_code == 404

def test_trigger_fraud(client):
    # Success case (bare gate letter or formatted)
    response = client.post("/api/trigger/fraud", json={"gateId": "c"})
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["gateId"] == "Gate-C"
    
    # Error case (Unknown gate)
    response = client.post("/api/trigger/fraud", json={"gateId": "Gate-Z"})
    assert response.status_code == 404

def test_edge_offline_toggle(client):
    # 1. Toggle Offline ON
    response = client.post("/api/edge/offline", json={"offline": True})
    assert response.status_code == 200
    assert response.json()["edge_offline_mode"] is True
    
    # Verify via GET status
    status_resp = client.get("/api/edge/offline")
    assert status_resp.status_code == 200
    assert status_resp.json()["edge_offline_mode"] is True
    
    # 2. Toggle Offline OFF
    response = client.post("/api/edge/offline", json={"offline": False})
    assert response.status_code == 200
    assert response.json()["edge_offline_mode"] is False

def test_opscommander_nlp_query_fallback(client):
    # Send a weather keyword query
    response = client.post("/api/query", json={"query": "Is there a storm warning?"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "weather_status"
    assert "storm" in data["answer"].lower()
    
    # Send a crowd bottleneck query
    response = client.post("/api/query", json={"query": "Where is the congestion?"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "crowd_status"
    assert "hot_sectors" in data["data"]

def test_post_match_debrief_compilation(client):
    response = client.post("/api/post-match/debrief")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "report" in data
    assert "# StadiumOS Operational Debrief Report" in data["report"]
