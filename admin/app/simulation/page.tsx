'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { formatRelativeTime, uid } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';

const SECTOR_IDS = ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4'];
const GATES = ['Gate-A','Gate-B','Gate-C','Gate-D','Gate-E','Gate-F','Gate-G','Gate-H'];

interface ActivityEntry {
  id: string;
  action: string;
  color: string;
  timestamp: number;
}

const BASE_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : 'http://localhost:8000';

async function apiPost(path: string, body?: object) {
  try {
    await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    // Backend offline — mock behavior only
  }
}

export default function SimulationPage() {
  const [stormActive, setStormActive] = useState(false);
  const [networkDrop, setNetworkDrop] = useState(false);
  const [queuedScans, setQueuedScans] = useState(0);
  const [queuedLogs, setQueuedLogs] = useState(0);
  
  const [surgeSector, setSurgeSector] = useState('A1');
  const [fraudGate, setFraudGate] = useState('Gate-A');
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [simProgress, setSimProgress] = useState(73);
  const [sigma, setSigma] = useState(0.042);
  
  const [showDebriefModal, setShowDebriefModal] = useState(false);
  const [debriefContent, setDebriefContent] = useState('');
  const [debriefLoading, setDebriefLoading] = useState(false);

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const addActivity = (action: string, color: string) => {
    setActivity(prev => [
      { id: uid(), action, color, timestamp: Date.now() },
      ...prev,
    ].slice(0, 10));
  };

  // Poll Edge Offline Status and SQLite queue counts
  useEffect(() => {
    const fetchEdgeStatus = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/edge/offline`);
        const data = await res.json();
        setNetworkDrop(data.edge_offline_mode);
        setQueuedScans(data.pending_scans);
        setQueuedLogs(data.pending_logs);
      } catch {
        // Backend offline
      }
    };
    
    fetchEdgeStatus();
    const t = setInterval(fetchEdgeStatus, 2500);
    return () => clearInterval(t);
  }, []);

  // Animate progress bar and sigma drift
  useEffect(() => {
    progressRef.current = setInterval(() => {
      setSimProgress(p => {
        const next = p + (Math.random() - 0.3) * 2;
        return Math.min(99, Math.max(60, next));
      });
      setSigma(s => {
        const next = s + (Math.random() - 0.5) * 0.002;
        return Math.min(0.09, Math.max(0.01, parseFloat(next.toFixed(4))));
      });
    }, 2000);
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, []);

  const handleStormToggle = async () => {
    const next = !stormActive;
    setStormActive(next);
    await apiPost('/api/trigger/storm');
    addActivity(
      next ? '🌩️ STORM ACTIVATED — ClimaSync engaged, roof closure initiated' : '☀️ STORM CLEARED — All clear signal broadcast',
      next ? '#ff4444' : '#00ff88',
    );
  };

  const handleNetworkDropToggle = async () => {
    const next = !networkDrop;
    setNetworkDrop(next);
    
    try {
      await fetch(`${BASE_URL}/api/edge/offline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offline: next })
      });
      
      addActivity(
        next 
          ? '📴 NETWORK DROP INJECTED — Local scanners re-routing to SQLite Edge Cache' 
          : '🌐 CONNECTION RESTORED — Asynchronous SQLite sync queue flushing to cloud',
        next ? '#ff4444' : '#00ff88'
      );
    } catch {
      // Offline fallback
    }
  };

  const handleSurge = async () => {
    await apiPost('/api/trigger/surge', { sectorId: surgeSector });
    addActivity(`⚡ CROWD SURGE triggered in sector ${surgeSector} — CrowdIntelligence alerted`, '#ffaa00');
  };

  const handleFraud = async () => {
    await apiPost('/api/trigger/fraud', { gateId: fraudGate });
    addActivity(`🎫 FRAUD INJECT at ${fraudGate} — TicketSentinel scanning duplicates`, '#a855f7');
  };

  const handleRunSim = () => {
    addActivity('🔮 New pre-match simulation started — 500 scenarios queued', '#00d4ff');
    setSimProgress(5);
  };

  const handleGenerateDebrief = async () => {
    setDebriefLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/post-match/debrief`, {
        method: 'POST'
      });
      const data = await res.json();
      setDebriefContent(data.report);
      setShowDebriefModal(true);
    } catch {
      setDebriefContent(`# StadiumOS Operational Debrief Report 🏟️
**Operational Cycle:** Post-Match Analytics  
**Platform Status:** Local Fallback Compiled  

The connection to the central debrief engine timed out. Operational data was successfully cached in memory cache backups.`);
      setShowDebriefModal(true);
    }
    setDebriefLoading(false);
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header">
          <h1 className="page-title">Simulation Control</h1>
          <p className="page-subtitle">Digital twin control panel — trigger scenarios and monitor live response</p>
        </div>

        <div className="sim-layout">
          {/* ── Left: Trigger Controls ── */}
          <div>
            <div className="sim-section-title">🎛️ Trigger Controls</div>

            {/* Storm Toggle */}
            <div className="glass-card trigger-card">
              <div className="trigger-header">
                <span className="trigger-name">⛈️ STORM TOGGLE</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={stormActive}
                    onChange={handleStormToggle}
                    id="storm-toggle"
                  />
                  <span className="toggle-track" />
                  <span className="toggle-thumb" />
                </label>
              </div>
              <div className="trigger-desc">
                Simulates an incoming storm front. ClimaSync agent will engage weather response protocols, issue fan advisories, and coordinate roof closure if applicable.
              </div>
              <div className={`storm-status ${stormActive ? 'active' : 'clear'}`}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: stormActive ? 'var(--danger)' : 'var(--success)', display: 'inline-block' }} />
                {stormActive ? '⛈️ STORM ACTIVE' : '☀️ CLEAR'}
              </div>
            </div>

            {/* Network Drop Simulator */}
            <div className="glass-card trigger-card" style={{ marginTop: 16 }}>
              <div className="trigger-header">
                <span className="trigger-name">🌐 NETWORK DROP SIMULATOR</span>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={networkDrop}
                    onChange={handleNetworkDropToggle}
                    id="network-drop-toggle"
                  />
                  <span className="toggle-track" style={{ background: networkDrop ? 'var(--danger)' : undefined }} />
                  <span className="toggle-thumb" />
                </label>
              </div>
              <div className="trigger-desc">
                Simulates a stadium-wide telecommunications collapse. Edge nodes immediately switch to localized **SQLite Offline Replication** databases.
              </div>
              <div className={`storm-status ${networkDrop ? 'active' : 'clear'}`}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: networkDrop ? 'var(--danger)' : 'var(--success)', display: 'inline-block' }} />
                {networkDrop ? `📴 OFFLINE MODE (${queuedScans} scans, ${queuedLogs} logs in SQLite)` : '🟢 CENTRAL SYNC ACTIVE'}
              </div>
            </div>

            {/* Crowd Surge */}
            <div className="glass-card trigger-card" style={{ marginTop: 16 }}>
              <div className="trigger-header">
                <span className="trigger-name">⚡ CROWD SURGE</span>
              </div>
              <div className="trigger-desc">
                Injects a high-density crowd surge event into the selected sector. Triggers CrowdIntelligence rerouting and FlowMaster gate reallocation.
              </div>
              <select
                id="surge-sector-select"
                className="trigger-select"
                value={surgeSector}
                onChange={e => setSurgeSector(e.target.value)}
              >
                {SECTOR_IDS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button id="trigger-surge-btn" className="btn-trigger warning" onClick={handleSurge}>
                ⚡ Trigger Surge in {surgeSector}
              </button>
            </div>

            {/* Fraud Inject */}
            <div className="glass-card trigger-card" style={{ marginTop: 16 }}>
              <div className="trigger-header">
                <span className="trigger-name">🎫 FRAUD INJECT</span>
              </div>
              <div className="trigger-desc">
                Simulates a ticket fraud event at the selected gate. TicketSentinel will scan for duplicate entries and block access accordingly.
              </div>
              <select
                id="fraud-gate-select"
                className="trigger-select"
                value={fraudGate}
                onChange={e => setFraudGate(e.target.value)}
              >
                {GATES.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <button id="inject-fraud-btn" className="btn-trigger danger" onClick={handleFraud}>
                🎫 Inject Fraud at {fraudGate}
              </button>
            </div>
          </div>

          {/* ── Right: Digital Twin Status ── */}
          <div>
            <div className="sim-section-title">🔮 Digital Twin Status</div>
            <div className="glass-card twin-card">
              <div className="twin-stat">
                <div className="twin-stat-label">Pre-Match Simulations</div>
                <div className="twin-stat-value">500</div>
                <div className="twin-stat-sub">Scenarios processed this session</div>
                <div className="progress-bar-track" style={{ marginTop: 8 }}>
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${simProgress}%` }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{simProgress.toFixed(0)}% complete</span>
                  <span style={{ fontSize: 10, color: 'var(--primary)' }}>Running</span>
                </div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

              <div className="twin-stat">
                <div className="twin-stat-label">Baseline Simulation Variance</div>
                <div className="twin-stat-value" style={{ fontSize: 22 }}>σ = {sigma.toFixed(4)}</div>
                <div className="twin-stat-sub">Drifting within acceptable bounds (σ &lt; 0.10)</div>
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '16px 0' }} />

              <div className="twin-stat">
                <div className="twin-stat-label">Pre-Match Prediction Accuracy</div>
                <div className="twin-stat-value" style={{ color: 'var(--success)' }}>94.7%</div>
                <div className="twin-stat-sub">Above 90% threshold — all agents calibrated</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '16px 0' }}>
                {[
                  { label: 'Sectors Modeled', val: '16/16', color: 'var(--success)' },
                  { label: 'Agents Online',   val: '6/6',   color: 'var(--success)' },
                  { label: 'Scenarios/sec',   val: '142',   color: 'var(--primary)' },
                  { label: 'Anomalies Caught', val: '38',   color: 'var(--warning)' },
                ].map(stat => (
                  <div key={stat.label} style={{
                    background: 'var(--surface2)', borderRadius: 8,
                    padding: '12px 14px', border: '1px solid var(--border)',
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                      {stat.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: stat.color }}>{stat.val}</div>
                  </div>
                ))}
              </div>

              <button id="run-simulation-btn" className="btn-run-sim" onClick={handleRunSim}>
                🔮 Run New Simulation
              </button>
            </div>

            {/* Post-Match AI Debrief Report */}
            <div className="glass-card twin-card" style={{ marginTop: 20 }}>
              <div className="twin-stat">
                <div className="twin-stat-label">Continuous Intelligence Loop</div>
                <div className="twin-stat-value" style={{ fontSize: 20 }}>POST-MATCH FORENSICS</div>
                <div className="twin-stat-sub">Autonomously parse decision ledgers & sector hotspots</div>
              </div>
              <button 
                id="generate-debrief-btn" 
                className="btn-run-sim" 
                style={{ background: 'linear-gradient(135deg, #a855f7, #6b21a8)', marginTop: 12 }} 
                onClick={handleGenerateDebrief}
                disabled={debriefLoading}
              >
                {debriefLoading ? '⚡ Analysing Operations...' : '📊 Generate Operational Debrief'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Activity Log ── */}
        <div className="glass-card activity-log">
          <div className="sim-section-title">📜 Live Activity Log</div>
          {activity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              No activity yet. Trigger an event above to see it logged here.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activity.slice(0, 5).map(entry => (
                <div key={entry.id} className="timeline-entry">
                  <div className="timeline-dot" style={{ background: entry.color, boxShadow: `0 0 6px ${entry.color}` }} />
                  <div className="timeline-content">
                    <div className="timeline-action">{entry.action}</div>
                    <div className="timeline-time">{formatRelativeTime(entry.timestamp)}</div>
                  </div>
                </div>
              ))}
        </div>

        {/* Footer */}
        <Footer />
      </main>

      {/* Debrief Report Modal */}
      {showDebriefModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(5, 8, 16, 0.95)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 40, animation: 'fade-in 0.3s ease both'
        }}>
          <div className="glass-card" style={{
            width: '100%', maxWidth: 800, maxHeight: '80vh',
            display: 'flex', flexDirection: 'column', padding: 30, overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--primary)' }}>📊 Match Operational Analytics Report</h2>
              <button 
                onClick={() => setShowDebriefModal(false)}
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'white', padding: '6px 14px', borderRadius: 8, fontWeight: 700 }}
              >
                Close Report
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: 10, fontSize: 13, lineHeight: 1.6, color: '#cbd5e1', whiteSpace: 'pre-wrap' }}>
              {debriefContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
