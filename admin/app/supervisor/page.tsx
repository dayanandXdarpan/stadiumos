'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import { getCPSTheme, formatRelativeTime } from '@/lib/utils';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function SupervisorTabletPage() {
  const { sectorData, alerts, isConnected } = useWebSocket();
  
  // Supervisor constraints: Sector B & C focus
  const regionalSectors = ['B1', 'B2', 'B3', 'B4', 'C1', 'C2', 'C3', 'C4'];
  const [assignedZone, setAssignedZone] = useState('North Stand (Zone B/C)');
  
  // Human-in-the-Loop approvals state
  const [pendingHITL, setPendingHITL] = useState([
    {
      id: 'hitl-1',
      agent: 'FlowMaster',
      action: 'GATE_REROUTE',
      details: 'Divert 40% traffic from Sector C3 (CPS 0.82) to Sector B2.',
      timestamp: Date.now() - 5000,
    },
    {
      id: 'hitl-2',
      agent: 'EmergencyAgent',
      action: 'CORRIDOR_CLEARING',
      details: 'Deploy mechanical partition at Corridor B3 exit gates.',
      timestamp: Date.now() - 45000,
    }
  ]);
  
  // Volunteer dispatches & escalation tracker
  const [escalations, setEscalations] = useState([
    {
      id: 'esc-1',
      staff: 'Officer Deepak (Volunteer)',
      location: 'Gate 4 Concourse',
      task: 'Disperse lateral bottleneck queue',
      status: 'Escalated — Response Timeout (60s exceeded)',
      time: Date.now() - 120000,
      severity: 'HIGH'
    },
    {
      id: 'esc-2',
      staff: 'Officer Sarah (Volunteer)',
      location: 'Block C Aisle 2',
      task: 'Clear pathway structural block',
      status: 'Responding...',
      time: Date.now() - 20000,
      severity: 'MEDIUM'
    }
  ]);

  const handleApprove = (id: string) => {
    setPendingHITL(prev => prev.filter(item => item.id !== id));
  };

  const handleReject = (id: string) => {
    setPendingHITL(prev => prev.filter(item => item.id !== id));
  };

  const handleEscalationResolve = (id: string) => {
    setEscalations(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#070b14', color: '#e2e8f0',
      fontFamily: 'system-ui, sans-serif', padding: 20
    }}>
      {/* Tablet Header Bar */}
      <header style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 24px', background: 'rgba(17, 24, 39, 0.8)',
        borderRadius: 14, border: '1px solid rgba(255,255,255,0.06)',
        marginBottom: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: '#ffaa00',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 'bold', color: '#070b14'
          }}>
            T
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
              Supervisor iPad View
            </h1>
            <span style={{ fontSize: 11, color: '#64748b', fontWeight: 'bold' }}>
              Jurisdiction: {assignedZone}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span className={`connection-pill ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '● Connected' : '○ Offline Mode'}
          </span>
          <Link 
            href="/"
            style={{
              textDecoration: 'none', color: '#64748b', background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 8,
              fontSize: 12, fontWeight: 700, transition: 'all 0.2s'
            }}
          >
            ← Back to Global CC
          </Link>
        </div>
      </header>

      {/* Main Grid View */}
      <div style={{
        display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 20
      }}>
        
        {/* Left: Jurisdiction Status & HITL Approval console */}
        <div>
          {/* Sector Overview in Jurisdiction */}
          <div style={{
            background: 'rgba(17,24,39,0.5)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)', padding: 20, marginBottom: 20
          }}>
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2, color: '#ffaa00', margin: '0 0 16px 0', display: 'flex', justifyContent: 'space-between' }}>
              <span>Regional Sector Matrix</span>
              <span style={{ fontSize: 11, color: '#64748b' }}>Sectors Assigned: {regionalSectors.length}</span>
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {regionalSectors.map(sId => {
                const data = sectorData.find(sec => sec.sectorId === sId) || { cps: 0.2, density: 0.1 };
                const theme = getCPSTheme(data.cps);
                return (
                  <div 
                    key={sId}
                    style={{
                      background: 'rgba(10,15,30,0.6)', border: `1px solid ${theme.border}44`,
                      borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column',
                      gap: 4, position: 'relative', overflow: 'hidden'
                    }}
                  >
                    {/* CPS indicator background fill */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 4, background: theme.color
                    }} />
                    <span style={{ fontSize: 16, fontWeight: 900, color: theme.color }}>{sId}</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                      <span>CPS:</span>
                      <strong style={{ color: '#fff' }}>{data.cps.toFixed(2)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#64748b' }}>
                      <span>Cap:</span>
                      <strong style={{ color: '#fff' }}>{(data.density * 100).toFixed(0)}%</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Human-In-The-Loop approvals console */}
          <div style={{
            background: 'rgba(17,24,39,0.5)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)', padding: 20
          }}>
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2, color: '#00d4ff', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🤖 Human-in-the-Loop (HITL) Dispatch approvals</span>
              <span style={{
                background: 'rgba(0, 212, 255, 0.12)', border: '1px solid rgba(0, 212, 255, 0.3)',
                color: '#00d4ff', fontSize: 10, padding: '2px 8px', borderRadius: 20
              }}>
                {pendingHITL.length} Required
              </span>
            </h2>

            {pendingHITL.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: 13, background: 'rgba(255,255,255,0.01)', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.05)' }}>
                All agent actions authorized. Swarm operating autonomously.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingHITL.map(hitl => (
                  <div 
                    key={hitl.id}
                    style={{
                      background: 'rgba(5, 8, 16, 0.4)', borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.04)', padding: 16
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, background: 'rgba(255,170,0,0.12)', border: '1px solid rgba(255,170,0,0.3)', color: '#ffaa00', padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                        {hitl.agent}: {hitl.action}
                      </span>
                      <span style={{ fontSize: 10, color: '#64748b' }}>
                        Requested {formatRelativeTime(hitl.timestamp)}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: '#cbd5e1', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      {hitl.details}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={() => handleApprove(hitl.id)}
                        style={{
                          background: 'linear-gradient(135deg, #00ff88, #00aa55)', border: 'none',
                          color: '#070b14', padding: '8px 16px', borderRadius: 8, fontWeight: 700,
                          fontSize: 12, cursor: 'pointer'
                        }}
                      >
                        ✓ Authorize Dispatch
                      </button>
                      <button 
                        onClick={() => handleReject(hitl.id)}
                        style={{
                          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                          color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 700,
                          fontSize: 12, cursor: 'pointer'
                        }}
                      >
                        ✕ Deny Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Escalations & Local Turnstile Telemetry */}
        <div>
          {/* Volunteer Escalation Alerts Panel */}
          <div style={{
            background: 'rgba(17,24,39,0.5)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)', padding: 20, marginBottom: 20
          }}>
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2, color: '#ff4444', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>⚠️ Local Staff Escalations</span>
              <span style={{
                background: 'rgba(255, 68, 68, 0.12)', border: '1px solid rgba(255, 68, 68, 0.3)',
                color: '#ff4444', fontSize: 10, padding: '2px 8px', borderRadius: 20
              }}>
                {escalations.length} Active
              </span>
            </h2>

            {escalations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: '#64748b', fontSize: 12 }}>
                All field volunteers responding within response time targets.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {escalations.map(esc => (
                  <div 
                    key={esc.id}
                    style={{
                      background: 'rgba(5, 8, 16, 0.3)', borderRadius: 12,
                      border: `1px solid ${esc.severity === 'HIGH' ? 'rgba(255,68,68,0.2)' : 'rgba(255,170,0,0.15)'}`,
                      padding: 14
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <strong style={{ fontSize: 12, color: '#fff' }}>{esc.staff}</strong>
                      <span style={{ fontSize: 10, color: esc.severity === 'HIGH' ? '#ff4444' : '#ffaa00', fontWeight: 'bold' }}>
                        {esc.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>
                      📍 Target: <strong>{esc.location}</strong>
                    </div>
                    <div style={{ fontSize: 12, color: '#cbd5e1', marginBottom: 12 }}>
                      Task: {esc.task}
                    </div>
                    
                    <button 
                      onClick={() => handleEscalationResolve(esc.id)}
                      style={{
                        background: 'rgba(255, 68, 68, 0.15)', border: '1px solid rgba(255, 68, 68, 0.3)',
                        color: '#ff4444', padding: '6px 12px', borderRadius: 6, fontSize: 11,
                        fontWeight: 'bold', cursor: 'pointer', width: '100%'
                      }}
                    >
                      ⚠️ Escalated — Dispatch Supervisor Override
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Regional Gates & Turnstile Telemetry */}
          <div style={{
            background: 'rgba(17,24,39,0.5)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.05)', padding: 20
          }}>
            <h2 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 1.2, color: '#fff', margin: '0 0 16px 0' }}>
              🎫 Regional Turnstile Ingress
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { gate: 'Gate B (Block B)', rate: '14 scans/min', load: '94%', active: true, color: '#00ff88' },
                { gate: 'Gate C (Block C)', rate: '4 scans/min', load: '18%', active: false, color: '#ffa400' },
                { gate: 'Gate G (Bypass Entrance)', rate: '38 scans/min', load: '82%', active: true, color: '#00ff88' }
              ].map(gate => (
                <div 
                  key={gate.gate}
                  style={{
                    background: 'rgba(10,15,30,0.5)', padding: 12, borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.04)', display: 'flex',
                    justifyContent: 'space-between', alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{gate.gate}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 2 }}>Flow Rate: {gate.rate}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: gate.color }}>{gate.load} Cap</div>
                    <div style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>
                      {gate.active ? '● Live Ingress Ingestor' : '○ Standby Mode'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 24 }}>
          <Footer />
        </div>
      </div>
    </div>
  );
}
