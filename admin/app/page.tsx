'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getCPSColor, getCPSStatus, getCPSTheme, getAgentStyle, formatRelativeTime } from '@/lib/utils';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function OverviewPage() {
  const router = useRouter();
  const { sectorData, agentActions, alerts, isConnected } = useWebSocket();

  // Hydration safety
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // ── Operator Active Session Tracking ──
  const startTime = useRef(Date.now());
  const [sessionTime, setSessionTime] = useState('0h 0m');

  useEffect(() => {
    const t = setInterval(() => {
      const elapsedMs = Date.now() - startTime.current;
      const mins = Math.floor(elapsedMs / 60000) % 60;
      const hrs = Math.floor(elapsedMs / 3600000);
      setSessionTime(`${hrs}h ${mins}m`);
    }, 10000);
    return () => clearInterval(t);
  }, []);

  // ── CPS Historical Tracking ──
  const [cpsHistory, setCpsHistory] = useState<number[]>([]);
  const maxHistoryPoints = 15;

  const avgCPS = useMemo(() => {
    if (!sectorData.length) return 0;
    return (sectorData.reduce((s, d) => s + d.cps, 0) / sectorData.length);
  }, [sectorData]);

  // Keep a rolling history of average CPS scores
  useEffect(() => {
    if (avgCPS > 0) {
      setCpsHistory(prev => {
        const next = [...prev, avgCPS];
        if (next.length > maxHistoryPoints) {
          next.shift();
        }
        return next;
      });
    }
  }, [avgCPS]);

  // Generate SVG coordinates for custom line chart
  const chartWidth = 560;
  const chartHeight = 110;
  const padding = 15;

  const svgCoords = useMemo(() => {
    if (cpsHistory.length < 2) return { line: '', area: '', points: [] };
    
    const points = cpsHistory.map((val, idx) => {
      const x = padding + (idx / (cpsHistory.length - 1)) * (chartWidth - padding * 2);
      // Invert Y coordinate since SVG (0,0) is top-left
      const y = chartHeight - padding - (val * (chartHeight - padding * 2));
      return { x, y, val };
    });

    const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(chartHeight - padding).toFixed(1)} L ${points[0].x.toFixed(1)} ${(chartHeight - padding).toFixed(1)} Z`;

    return { line: linePath, area: areaPath, points };
  }, [cpsHistory]);

  // ── SVG Interactive Tooltip State ──
  const [hoverPoint, setHoverPoint] = useState<{ x: number; y: number; val: number; index: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgCoords.points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find closest point by X coordinate matching
    let closest = svgCoords.points[0];
    let closestIndex = 0;
    let minDiff = Math.abs(closest.x - mouseX);

    svgCoords.points.forEach((p, idx) => {
      const diff = Math.abs(p.x - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closest = p;
        closestIndex = idx;
      }
    });

    setHoverPoint({ ...closest, index: closestIndex });
  };

  const handleMouseLeave = () => {
    setHoverPoint(null);
  };

  // ── Live Crowd Audio Roar calculation ──
  const avgAudio = useMemo(() => {
    if (!sectorData.length) return 0;
    return sectorData.reduce((s, d) => s + d.audio, 0) / sectorData.length;
  }, [sectorData]);

  const soundBars = 20;

  const criticalCount = useMemo(() =>
    alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length,
    [alerts]
  );

  const recentActions = agentActions.slice(0, 5);
  const tickerAlerts  = alerts.slice(0, 10);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Overview Dashboard</h1>
            <p className="page-subtitle">Real-time stadium intelligence — all systems monitored</p>
          </div>

          {/* Premium Active Operator Profile Card */}
          <div className="operator-profile-card">
            <div className="operator-avatar">DO</div>
            <div className="operator-info">
              <span className="operator-name">Operator Deepak</span>
              <span className="operator-session">
                <span className="operator-active-dot" /> Live CC · {sessionTime} active
              </span>
            </div>
          </div>
        </div>

        {/* ── KPI Cards ── */}
        <div className="kpi-grid">
          <KPICard
            label="Active Sectors"
            value="16"
            sub="All sectors monitored"
            icon="🏟️"
            color="#00d4ff"
            delay={0}
          />
          <KPICard
            label="Critical Alerts"
            value={String(criticalCount)}
            sub="Active CRITICAL / HIGH"
            icon="🚨"
            color="#ff4444"
            delay={0.1}
          />
          <KPICard
            label="Active Agents"
            value="6/6"
            sub={<span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff88', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
              All online
            </span>}
            icon="🤖"
            color="#00ff88"
            delay={0.2}
          />
          <KPICard
            label="Avg CPS"
            value={avgCPS.toFixed(2)}
            sub="Crowd Pressure Score avg"
            icon="📊"
            color={getCPSColor(avgCPS)}
            delay={0.3}
          />
        </div>

        {/* ── Live SVG Analytics Dashboard Panel ── */}
        <div className="analytics-panel">
          {/* SVG Trend Line Chart */}
          <div className="glass-card chart-container">
            <div className="chart-header">
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  📈 Crowd Pressure Trend (CPS)
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Live venue-wide historical moving average
                </p>
              </div>
              <div className="chart-value-display">
                <span className="chart-value-main" style={{ color: getCPSColor(avgCPS) }}>{avgCPS.toFixed(2)}</span>
                <span className="chart-value-unit">Avg Score</span>
              </div>
            </div>

            <div className="chart-svg-wrap">
              {cpsHistory.length < 2 ? (
                <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                  🛰️ Initializing telemetric data nodes... (Waiting for WebSocket stream)
                </div>
              ) : (
                <svg
                  width="100%"
                  height={chartHeight}
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  preserveAspectRatio="none"
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                  style={{ overflow: 'visible', cursor: 'crosshair' }}
                >
                  <defs>
                    <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#00d4ff" stopOpacity="0.0" />
                    </linearGradient>
                    <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0.25, 0.5, 0.75].map((level, idx) => {
                    const y = chartHeight - padding - (level * (chartHeight - padding * 2));
                    return (
                      <line
                        key={idx}
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.05)"
                        strokeDasharray="4, 4"
                      />
                    );
                  })}

                  {/* Filled Gradient Path */}
                  <path d={svgCoords.area} fill="url(#chart-area-grad)" />

                  {/* Line Path */}
                  <path
                    d={svgCoords.line}
                    fill="none"
                    stroke="#00d4ff"
                    strokeWidth="2.5"
                    filter="url(#glow-filter)"
                  />

                  {/* Coordinate Data Points */}
                  {svgCoords.points.map((pt, idx) => (
                    <circle
                      key={idx}
                      cx={pt.x}
                      cy={pt.y}
                      r={hoverPoint?.index === idx ? 6 : 3.5}
                      fill={hoverPoint?.index === idx ? '#fff' : '#00d4ff'}
                      stroke={hoverPoint?.index === idx ? 'var(--primary)' : 'rgba(15,23,42,0.95)'}
                      strokeWidth="1.5"
                      style={{ transition: 'r 0.15s, fill 0.15s' }}
                    />
                  ))}

                  {/* Hover interactive vertical guide line */}
                  {hoverPoint && (
                    <>
                      <line
                        x1={hoverPoint.x}
                        y1={padding}
                        x2={hoverPoint.x}
                        y2={chartHeight - padding}
                        stroke="rgba(0, 212, 255, 0.35)"
                        strokeWidth="1"
                        strokeDasharray="2, 2"
                      />
                      <circle cx={hoverPoint.x} cy={hoverPoint.y} r="8" fill="none" stroke="rgba(0, 212, 255, 0.5)" strokeWidth="2" />
                    </>
                  )}
                </svg>
              )}

              {/* Tooltip Overlay */}
              {hoverPoint && (
                <div
                  className="chart-tooltip"
                  style={{
                    left: `${Math.min(chartWidth - 140, Math.max(10, hoverPoint.x - 60))}px`,
                    top: `${Math.min(chartHeight - 45, Math.max(5, hoverPoint.y - 45))}px`,
                    opacity: 1,
                  }}
                >
                  <div>CPS Score: <strong style={{ color: getCPSColor(hoverPoint.val) }}>{hoverPoint.val.toFixed(2)}</strong></div>
                  <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>Sample: {maxHistoryPoints - hoverPoint.index}s ago</div>
                </div>
              )}
            </div>
          </div>

          {/* Sound/Audio Spectrum Panel */}
          <div className="glass-card audio-spectrum-card">
            <div className="audio-header">
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  🔊 Ambient Venue Sound Roar
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Microphone array decibel frequency analyzer
                </p>
              </div>
              <div className="audio-db-level">
                {String((45 + avgAudio * 60).toFixed(0))} <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>dB</span>
              </div>
            </div>

            <div className="audio-bars-container">
              {mounted ? (
                Array.from({ length: soundBars }).map((_, idx) => {
                  // Calculate pseudo audio amplitudes using cosine mapping + dynamic average audio multiplier
                  const baseAmpl = Math.abs(Math.cos(idx * 0.4)) * 0.7;
                  // Add fluctuating noise based on actual socket feedback
                  const fluctuatingScale = Math.max(0.1, baseAmpl + (avgAudio - 0.5) * 0.4);
                  // Animate bars at organic varying tempos
                  const animDuration = 0.5 + Math.random() * 0.7;
                  return (
                    <div
                      key={idx}
                      className="audio-bar"
                      style={{
                        height: '100%',
                        animationDuration: `${animDuration.toFixed(2)}s`,
                        transform: `scaleY(${Math.max(0.08, fluctuatingScale)})`,
                      }}
                    />
                  );
                })
              ) : (
                Array.from({ length: soundBars }).map((_, idx) => (
                  <div
                    key={idx}
                    className="audio-bar"
                    style={{
                      height: '100%',
                      transform: 'scaleY(0.1)',
                    }}
                  />
                ))
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-muted)', marginTop: 8, fontWeight: 600 }}>
              <span>64 Hz (Bass)</span>
              <span>1024 Hz (Mid)</span>
              <span>16384 Hz (Treble)</span>
            </div>
          </div>
        </div>

        {/* ── Overview Grid ── */}
        <div className="overview-grid">
          {/* Mini Crowd Map */}
          <div className="glass-card mini-crowd-map">
            <div className="section-title">
              🗺️ Mini Crowd Map
              <span style={{ fontSize: 11, color: isConnected ? 'var(--success)' : 'var(--text-muted)', marginLeft: 'auto', fontWeight: 600 }}>
                {isConnected ? '● Live WebSocket Connected' : '○ Offline Mode'}
              </span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 14 }}>
              Click any sector below to immediately locate it in the 3D twin seat map.
            </div>
            <div className="mini-grid">
              {sectorData.map(sector => {
                const theme = getCPSTheme(sector.cps);
                return (
                  <div
                    key={sector.sectorId}
                    className="mini-sector"
                    style={{
                      '--sector-border': theme.border,
                      '--sector-color':  theme.color,
                      background: theme.background,
                      cursor: 'pointer',
                    } as React.CSSProperties}
                    onClick={() => router.push(`/digital-twin?sector=${sector.sectorId}`)}
                  >
                    <span className="mini-sector-id">{sector.sectorId}</span>
                    <span className="mini-sector-cps">{sector.cps.toFixed(2)}</span>
                    <span className="mini-cps-badge">{getCPSStatus(sector.cps)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Agent Actions */}
          <div className="glass-card agent-panel">
            <div className="section-title">📋 Recent Agent Actions</div>
            <div className="agent-actions-list">
              {recentActions.map(action => {
                const style = getAgentStyle(action.agent);
                return (
                  <div key={action.id} className="action-entry">
                    <div className="action-header">
                      <span
                        className="agent-badge"
                        style={{ background: style.bg, color: style.color }}
                      >
                        {action.agent}
                      </span>
                      <span className="action-type-badge">{action.actionType}</span>
                      <span className="action-sector">{action.sector}</span>
                    </div>
                    <div className="action-message">{action.message}</div>
                    <div className="action-time">{formatRelativeTime(action.timestamp)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Alert Ticker ── */}
        <div className="alert-ticker-wrap">
          <div className="ticker-label">⚡ ALERTS</div>
          <div className="ticker-track">
            {[...tickerAlerts, ...tickerAlerts].map((alert, i) => (
              <span key={`${alert.id}-${i}`} className="ticker-item">
                <span className={`ticker-severity severity-${alert.severity.toLowerCase()}`}>
                  {alert.severity}
                </span>
                {alert.message}
                <span style={{ color: 'rgba(100,116,139,0.5)', fontSize: 10 }}>
                  {formatRelativeTime(alert.timestamp)}
                </span>
                <span style={{ color: 'rgba(0,212,255,0.3)', margin: '0 8px' }}>◆</span>
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}

function KPICard({
  label, value, sub, icon, color, delay,
}: {
  label: string;
  value: string;
  sub: React.ReactNode;
  icon: string;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="glass-card kpi-card"
      style={{ '--primary-color': color, animationDelay: `${delay}s` } as React.CSSProperties}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={{ color }}>{value}</div>
      <div className="kpi-sub">{sub}</div>
      <div className="kpi-icon">{icon}</div>
    </div>
  );
}
