import pytest
from state.blackboard import Blackboard, DEFAULT_CPS_THRESHOLD, STORM_CPS_THRESHOLD

@pytest.mark.asyncio
async def test_blackboard_initialization(clean_blackboard):
    bb = clean_blackboard
    assert len(bb.sectors) == 16
    assert bb.storm_active is False
    assert bb.cps_threshold == DEFAULT_CPS_THRESHOLD
    assert bb.edge_offline_mode is False

@pytest.mark.asyncio
async def test_blackboard_update_sector(clean_blackboard):
    bb = clean_blackboard
    
    # 1. Normal state
    await bb.update_sector("A1", {"cps": 0.3, "density": 100})
    sector = bb.get_sector("A1")
    assert sector["status"] == "normal"
    assert sector["cps"] == 0.3
    
    # 2. Warning state (CPS > threshold)
    await bb.update_sector("A1", {"cps": 0.8, "density": 400})
    sector = bb.get_sector("A1")
    assert sector["status"] == "warning"
    
    # 3. Critical state (CPS >= 0.9)
    await bb.update_sector("A1", {"cps": 0.92, "density": 480})
    sector = bb.get_sector("A1")
    assert sector["status"] == "critical"

@pytest.mark.asyncio
async def test_blackboard_log_agent_action(clean_blackboard):
    bb = clean_blackboard
    
    entry = await bb.log_agent_action(
        agent="FlowMaster",
        action="REROUTE",
        sector="B3",
        message="Diverting ingress traffic",
        reasoning="Sector B3 over threshold"
    )
    
    assert entry["agent"] == "FlowMaster"
    assert entry["action"] == "REROUTE"
    assert entry["sector"] == "B3"
    assert "timestamp" in entry
    
    # Check capping logic
    for i in range(120):
        await bb.log_agent_action(
            agent="AgentX",
            action="PING",
            sector=None,
            message=f"Ping {i}",
            reasoning="Test cap"
        )
    
    snapshot = bb.get_snapshot()
    # Snapshot returns up to 20, but the list length should be capped at 100 internally
    assert len(bb.agent_ledger) == 100
    assert bb.agent_ledger[-1]["message"] == "Ping 119"

@pytest.mark.asyncio
async def test_blackboard_add_alert(clean_blackboard):
    bb = clean_blackboard
    
    alert = {
        "alertType": "CROWD_PRESSURE",
        "severity": "CRITICAL",
        "message": "Sector C3 crowd limit exceeded.",
        "timestamp": "2026-05-23T14:00:00Z"
    }
    
    await bb.add_alert(alert)
    assert len(bb.active_alerts) == 1
    assert bb.active_alerts[0]["message"] == "Sector C3 crowd limit exceeded."
    
    # Cap at 50 alerts check
    for i in range(60):
        await bb.add_alert({"message": f"Alert {i}"})
    assert len(bb.active_alerts) == 50

@pytest.mark.asyncio
async def test_blackboard_storm_lifecycle(clean_blackboard):
    bb = clean_blackboard
    
    await bb.activate_storm()
    assert bb.storm_active is True
    assert bb.cps_threshold == STORM_CPS_THRESHOLD
    
    await bb.deactivate_storm()
    assert bb.storm_active is False
    assert bb.cps_threshold == DEFAULT_CPS_THRESHOLD

@pytest.mark.asyncio
async def test_redis_synced_dict(clean_blackboard):
    bb = clean_blackboard
    
    # Set item
    bb.fraud_flags["Gate-A"] = 3
    assert bb.fraud_flags["Gate-A"] == 3
    
    # Redis check
    snapshot = bb.get_snapshot()
    assert snapshot["fraud_flags"]["Gate-A"] == 3
    
    # Update mapping
    bb.fraud_flags.update({"Gate-B": 5, "Gate-C": 1})
    assert bb.fraud_flags["Gate-B"] == 5
    assert bb.fraud_flags["Gate-C"] == 1

@pytest.mark.asyncio
async def test_triggers_and_offline_mode(clean_blackboard):
    bb = clean_blackboard
    
    # Surge triggers
    await bb.trigger_surge("C2")
    await bb.trigger_surge("D4")
    surges = await bb.pop_surge_sectors()
    assert "C2" in surges
    assert "D4" in surges
    
    # Pop clears the set
    empty_surges = await bb.pop_surge_sectors()
    assert len(empty_surges) == 0
    
    # Fraud triggers
    await bb.trigger_fraud("Gate-E")
    triggers = await bb.pop_fraud_triggers()
    assert triggers == ["Gate-E"]
    
    # Edge offline toggle
    await bb.set_edge_offline(True)
    assert bb.edge_offline_mode is True
