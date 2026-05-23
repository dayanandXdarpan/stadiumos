'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getCPSTheme, getCPSStatus, formatRelativeTime } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function CrowdMapPage() {
  const { sectorData, isConnected } = useWebSocket();
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [elapsed, setElapsed] = useState<string>('0.0s');

  // Track last update time
  useEffect(() => {
    if (sectorData.length) setLastUpdated(Date.now());
  }, [sectorData]);

  // Elapsed counter
  useEffect(() => {
    const t = setInterval(() => {
      const diff = (Date.now() - lastUpdated) / 1000;
      setElapsed(diff.toFixed(1) + 's');
    }, 100);
    return () => clearInterval(t);
  }, [lastUpdated]);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="crowd-map-header">
          <div>
            <h1 className="page-title">Crowd Map</h1>
            <p className="page-subtitle" style={{ marginTop: 4 }}>
              Real-time sector density monitoring — 16 sectors active
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Last updated: <strong style={{ color: 'var(--text)' }}>{elapsed} ago</strong>
            </span>
            <div className={`connection-pill ${isConnected ? 'connected' : 'disconnected'}`}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: isConnected ? 'var(--success)' : 'var(--danger)',
                display: 'inline-block',
                animation: isConnected ? 'pulse-glow 2s infinite' : 'none',
              }} />
              {isConnected ? 'Live WebSocket' : 'Mock Data'}
            </div>
          </div>
        </div>

        <div className="sector-grid">
          {sectorData.map(sector => {
            const theme = getCPSTheme(sector.cps);
            const isCritical = sector.cps >= 0.75;

            return (
              <div
                key={sector.sectorId}
                className={`glass-card sector-card ${isCritical ? 'critical-pulse' : ''}`}
                style={{
                  border: `1px solid ${theme.border}`,
                  background: `linear-gradient(135deg, ${theme.background}, rgba(17,24,39,0.85))`,
                }}
              >
                <span className="sector-card-id">{sector.sectorId}</span>
                <span
                  className="sector-card-status"
                  style={{
                    background: `${theme.background}`,
                    color: theme.color,
                    border: `1px solid ${theme.border}44`,
                  }}
                >
                  {getCPSStatus(sector.cps)}
                </span>

                <div className="sector-cps-main">
                  <div className="sector-cps-number" style={{ color: theme.color }}>
                    {sector.cps.toFixed(2)}
                  </div>
                  <div className="sector-cps-label">Crowd Pressure Score</div>
                </div>

                <div className="sector-bars">
                  <MetricBar label="Density"  value={sector.density}  color={theme.color} />
                  <MetricBar label="Velocity" value={sector.velocity} color="#3b82f6" />
                  <MetricBar label="Audio"    value={sector.audio}    color="#a855f7" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{
          display: 'flex', gap: 20, marginTop: 24, padding: '14px 20px',
          background: 'rgba(17,24,39,0.6)', borderRadius: 8, border: '1px solid var(--border)',
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>
            CPS Legend:
          </span>
          {[
            { range: '0.0–0.4', label: 'SAFE',     color: '#00ff88' },
            { range: '0.4–0.6', label: 'CAUTION',  color: '#ffaa00' },
            { range: '0.6–0.75', label: 'WARNING', color: '#ff6400' },
            { range: '0.75+',   label: 'CRITICAL', color: '#ff4444' },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, display: 'inline-block' }} />
              <strong style={{ color: l.color }}>{l.label}</strong>
              <span style={{ color: 'var(--text-muted)' }}>{l.range}</span>
            </span>
          ))}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="sector-bar-row">
      <span className="sector-bar-label">{label}</span>
      <div className="sector-bar-track">
        <div
          className="sector-bar-fill"
          style={{ width: `${(value * 100).toFixed(0)}%`, background: color }}
        />
      </div>
      <span className="sector-bar-val">{(value * 100).toFixed(0)}%</span>
    </div>
  );
}
