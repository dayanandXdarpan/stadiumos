import pytest
import sqlite3
import asyncio
from unittest.mock import AsyncMock
from state.edge_sync import (
    init_db,
    save_scan_offline,
    save_sector_log_offline,
    get_pending_counts,
    sync_worker,
    DB_PATH
)

def test_db_initialization(clean_db_env):
    # init_db is run in clean_db_env, check if tables exist
    conn = sqlite3.connect(str(clean_db_env))
    cursor = conn.cursor()
    
    # Check offline_scans table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_scans'")
    assert cursor.fetchone() is not None
    
    # Check offline_sector_logs table
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='offline_sector_logs'")
    assert cursor.fetchone() is not None
    
    conn.close()

def test_save_offline_data(clean_db_env):
    # Initially 0 pending
    counts = get_pending_counts()
    assert counts["scans"] == 0
    assert counts["logs"] == 0
    
    # Save a scan
    save_scan_offline(gate_id="Gate-C", barcode="TCK-12345")
    # Save sector logs
    save_sector_log_offline(sector_id="B3", cps=0.65, density=300.0, velocity=1.1)
    
    # Check counts
    counts = get_pending_counts()
    assert counts["scans"] == 1
    assert counts["logs"] == 1
    
    # Check SQLite direct entries
    conn = sqlite3.connect(str(clean_db_env))
    cursor = conn.cursor()
    
    cursor.execute("SELECT gate_id, barcode, status FROM offline_scans")
    scan = cursor.fetchone()
    assert scan == ("Gate-C", "TCK-12345", "PENDING")
    
    cursor.execute("SELECT sector_id, cps, density, velocity, status FROM offline_sector_logs")
    log = cursor.fetchone()
    assert log == ("B3", 0.65, 300.0, 1.1, "PENDING")
    
    conn.close()

@pytest.mark.asyncio
async def test_sync_worker_offline_mode(clean_db_env, clean_blackboard, mock_broadcast):
    bb = clean_blackboard
    bb.edge_offline_mode = True
    
    save_scan_offline(gate_id="Gate-A", barcode="TCK-999")
    
    # Create sync worker task but run only briefly
    worker_task = asyncio.create_task(sync_worker(bb, mock_broadcast))
    
    # Allow task to iterate once
    await asyncio.sleep(0.5)
    worker_task.cancel()
    
    # Under offline mode, counts should still be pending (sync paused)
    counts = get_pending_counts()
    assert counts["scans"] == 1
    
    # Mock broadcast should be triggered with edge_status offline = True
    mock_broadcast.assert_called()
    last_call_arg = mock_broadcast.call_args[0][0]
    assert last_call_arg["type"] == "edge_status"
    assert last_call_arg["payload"]["offline"] is True
    assert last_call_arg["payload"]["pending_scans"] == 1

@pytest.mark.asyncio
async def test_sync_worker_online_sync_and_fraud_collision(clean_db_env, clean_blackboard, mock_broadcast):
    bb = clean_blackboard
    bb.edge_offline_mode = False
    
    # Ingest 2 identical scans offline (representing barcode fraud collision)
    save_scan_offline(gate_id="Gate-B", barcode="BAD-TICKET")
    save_scan_offline(gate_id="Gate-B", barcode="BAD-TICKET")
    
    # Ingest a valid telemetry reading offline
    save_sector_log_offline(sector_id="C4", cps=0.82, density=420.0, velocity=0.6)
    
    # Run sync worker in background
    worker_task = asyncio.create_task(sync_worker(bb, mock_broadcast))
    
    # Allow sync to finish
    await asyncio.sleep(1.0)
    worker_task.cancel()
    
    # Counts should now be 0 (all processed)
    counts = get_pending_counts()
    assert counts["scans"] == 0
    assert counts["logs"] == 0
    
    # Telemetry should be synced back to the blackboard
    sector = bb.get_sector("C4")
    assert sector["cps"] == 0.82
    assert sector["density"] == 420.0
    
    # A fraud alert must be generated for the second duplicate barcode scan
    assert len(bb.active_alerts) > 0
    fraud_alerts = [a for a in bb.active_alerts if "fraud" in a["message"].lower()]
    assert len(fraud_alerts) > 0
    assert "Gate-B" in fraud_alerts[0]["affectedSectors"]
    
    # Sync complete ledger entry should be created
    ledger_entries = [l for l in bb.agent_ledger if l["action"] == "EDGE_SYNC_COMPLETE"]
    assert len(ledger_entries) > 0
