'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatRelativeTime } from '@/lib/utils';
import { useState, useMemo } from 'react';

const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;

export default function AlertsPage() {
  const { alerts, isConnected } = useWebSocket();
  const [filter, setFilter] = useState<typeof SEVERITY_FILTERS[number]>('ALL');
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    return alerts
      .filter(a => !dismissed.has(a.id) && (filter === 'ALL' || a.severity === filter))
      .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.timestamp - a.timestamp);
  }, [alerts, filter, dismissed]);

  const counts = useMemo(() => {
    const active = alerts.filter(a => !dismissed.has(a.id));
    return {
      ALL:      active.length,
      CRITICAL: active.filter(a => a.severity === 'CRITICAL').length,
      HIGH:     active.filter(a => a.severity === 'HIGH').length,
      MEDIUM:   active.filter(a => a.severity === 'MEDIUM').length,
      LOW:      active.filter(a => a.severity === 'LOW').length,
    };
  }, [alerts, dismissed]);

  const dismissAll = () => setDismissed(new Set(alerts.map(a => a.id)));
  const dismiss = (id: string) => setDismissed(prev => new Set([...prev, id]));

  const severityStyle: Record<string, { color: string; bg: string; border: string }> = {
    CRITICAL: { color: '#ff4444', bg: 'rgba(255,68,68,0.08)',   border: 'rgba(255,68,68,0.3)'   },
    HIGH:     { color: '#ffaa00', bg: 'rgba(255,170,0,0.08)',   border: 'rgba(255,170,0,0.3)'   },
    MEDIUM:   { color: '#00d4ff', bg: 'rgba(0,212,255,0.06)',   border: 'rgba(0,212,255,0.25)'  },
    LOW:      { color: '#00ff88', bg: 'rgba(0,255,136,0.06)',   border: 'rgba(0,255,136,0.25)'  },
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Alerts Center</h1>
            <p className="page-subtitle">
              Live threat intelligence — {counts.ALL} active alerts
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className={`connection-pill ${isConnected ? 'connected' : 'disconnected'}`}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: isConnected ? 'var(--success)' : 'var(--danger)',
                display: 'inline-block',
                animation: isConnected ? 'pulse-glow 2s infinite' : 'none',
              }} />
              {isConnected ? 'Live' : 'Mock'}
            </div>
            {counts.ALL > 0 && (
              <button
                id="dismiss-all-btn"
                onClick={dismissAll}
                style={{
                  padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  background: 'rgba(255,68,68,0.12)', color: 'var(--danger)',
                  border: '1px solid rgba(255,68,68,0.3)', cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                Dismiss All
              </button>
            )}
          </div>
        </div>

        {/* Severity Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(sev => {
            const s = severityStyle[sev];
            return (
              <div
                key={sev}
                className="glass-card"
                style={{
                  padding: '16px 20px', cursor: 'pointer',
                  border: `1px solid ${filter === sev ? s.color : 'var(--border)'}`,
                  background: filter === sev ? s.bg : undefined,
                  transition: 'all 0.2s ease',
                }}
                onClick={() => setFilter(prev => prev === sev ? 'ALL' : sev)}
              >
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: s.color, textTransform: 'uppercase', marginBottom: 8 }}>
                  {sev}
                </div>
                <div style={{ fontSize: 36, fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  {counts[sev]}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                  Active alerts
                </div>
              </div>
            );
          })}
        </div>

        {/* Filter Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Filter:
          </span>
          {SEVERITY_FILTERS.map(f => {
            const s = f === 'ALL' ? null : severityStyle[f];
            const isActive = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  border: `1px solid ${isActive && s ? s.color : 'var(--border)'}`,
                  background: isActive && s ? s.bg : 'var(--surface2)',
                  color: isActive && s ? s.color : 'var(--text-muted)',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                }}
              >
                {f} {f !== 'ALL' && `(${counts[f]})`}
              </button>
            );
          })}
        </div>

        {/* Alert List */}
        {filtered.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>
              {counts.ALL === 0 ? '✅' : '🔍'}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              {counts.ALL === 0 ? 'All Clear' : 'No alerts match this filter'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {counts.ALL === 0
                ? 'No active alerts. All systems are operating normally.'
                : `Try selecting a different severity level above.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((alert, i) => {
              const s = severityStyle[alert.severity] ?? severityStyle.LOW;
              return (
                <div
                  key={alert.id}
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    borderLeft: `3px solid ${s.color}`,
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                    animation: 'fade-in 0.3s ease both',
                    animationDelay: `${Math.min(i * 0.04, 0.4)}s`,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Severity icon */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                    background: s.bg, border: `1px solid ${s.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16,
                  }}>
                    {alert.severity === 'CRITICAL' ? '🚨' : alert.severity === 'HIGH' ? '⚠️' : alert.severity === 'MEDIUM' ? 'ℹ️' : '📋'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 4,
                        background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                        textTransform: 'uppercase', letterSpacing: 1,
                      }}>
                        {alert.severity}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {formatRelativeTime(alert.timestamp)}
                      </span>
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>
                      {alert.message}
                    </div>
                  </div>

                  {/* Dismiss */}
                  <button
                    onClick={() => dismiss(alert.id)}
                    title="Dismiss alert"
                    style={{
                      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                      background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                      color: 'var(--text-muted)', fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
