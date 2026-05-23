'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getAgentStyle, formatRelativeTime } from '@/lib/utils';
import { useState, useMemo } from 'react';

const ALL_AGENTS = [
  'CrowdIntelligence',
  'FlowMaster',
  'TicketSentinel',
  'ClimaSync',
  'SocialSentinel',
  'EmergencyAgent',
];

export default function AgentLedgerPage() {
  const { agentActions, isConnected } = useWebSocket();
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  
  // Post-Match AI Debrief States
  const [debriefOpen, setDebriefOpen] = useState(false);
  const [debriefLoading, setDebriefLoading] = useState(false);
  const [debriefReport, setDebriefReport] = useState<string | null>(null);
  const [loadingPhase, setLoadingPhase] = useState<string>('');

  const toggleFilter = (agent: string) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(agent)) next.delete(agent);
      else next.add(agent);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (activeFilters.size === 0) return agentActions;
    return agentActions.filter(a => activeFilters.has(a.agent));
  }, [agentActions, activeFilters]);

  // Generative AI Debrief compilation handler
  const generateDebrief = async () => {
    setDebriefOpen(true);
    setDebriefLoading(true);
    setDebriefReport(null);

    const phases = [
      'Ingesting multi-agent blackboard registers...',
      'Aggregating 16 sector spatial CPS metrics...',
      'Parsing perimeter threat barcode records (TicketSentinel)...',
      'Synthesizing meteorological ClimaSync adjustments...',
      'Engaging Google Gemini 1.5 Flash operational analyst...',
      'Compiling executive match operational report...'
    ];

    let currentPhaseIdx = 0;
    setLoadingPhase(phases[currentPhaseIdx]);
    const interval = setInterval(() => {
      currentPhaseIdx = (currentPhaseIdx + 1) % phases.length;
      setLoadingPhase(phases[currentPhaseIdx]);
    }, 2000);

    try {
      const res = await fetch('http://localhost:8000/api/post-match/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      clearInterval(interval);
      if (data.status === 'ok') {
        setDebriefReport(data.report);
      } else {
        setDebriefReport('### Compilation Error\nFailed to compile debrief report from blackboard ledger logs.');
      }
    } catch (err) {
      clearInterval(interval);
      setDebriefReport(
        '### Ingestion Timeout\n\n' +
        '**StadiumOS Central Core Ingestion is currently unreachable.**\n\n' +
        '> [!WARNING]\n' +
        '> Unable to reach FastAPI backend service on `http://localhost:8000/api/post-match/debrief`.\n\n' +
        '**Resolution Steps:**\n' +
        '1. Ensure the StadiumOS FastAPI backend service is running locally on port 8000.\n' +
        '2. Verify that no networking firewall or proxy blocks cross-origin fetches.\n' +
        '3. Try manual override telemetry updates in the simulation console.'
      );
    } finally {
      setDebriefLoading(false);
    }
  };

  // High-performance React Markdown parsing compiler
  const parseMarkdown = (md: string): React.ReactNode[] => {
    const lines = md.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();

      // Empty space
      if (!trimmed) {
        return <div key={idx} style={{ height: 10 }} />;
      }

      // Headers (H1, H2, H3)
      if (trimmed.startsWith('# ')) {
        return (
          <h1
            key={idx}
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: '#fff',
              background: 'linear-gradient(90deg, var(--primary), var(--success))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginTop: 22,
              marginBottom: 12,
              borderBottom: '1px solid rgba(0, 212, 255, 0.18)',
              paddingBottom: 6,
              letterSpacing: '-0.3px',
            }}
          >
            {trimmed.slice(2)}
          </h1>
        );
      }

      if (trimmed.startsWith('## ')) {
        return (
          <h2
            key={idx}
            style={{
              fontSize: 14.5,
              fontWeight: 800,
              color: 'var(--primary)',
              marginTop: 18,
              marginBottom: 10,
              letterSpacing: '0.2px',
            }}
          >
            {trimmed.slice(3)}
          </h2>
        );
      }

      if (trimmed.startsWith('### ')) {
        return (
          <h3
            key={idx}
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: 'var(--success)',
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            {trimmed.slice(4)}
          </h3>
        );
      }

      // Horizontal lines
      if (trimmed === '---') {
        return (
          <hr
            key={idx}
            style={{
              border: 'none',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              margin: '14px 0',
            }}
          />
        );
      }

      // Blockquotes and Alerts
      if (trimmed.startsWith('> ') || trimmed.startsWith('*> ') || trimmed.startsWith('**> ')) {
        const quoteContent = trimmed.replace(/^([>* \s])*/, '');
        let bg = 'rgba(0, 212, 255, 0.04)';
        let borderLeftColor = 'var(--primary)';
        let textColor = '#cbd5e1';

        if (trimmed.includes('[!WARNING]')) {
          bg = 'rgba(255, 68, 68, 0.06)';
          borderLeftColor = 'var(--danger)';
          textColor = '#fca5a5';
        } else if (trimmed.includes('[!TIP]')) {
          bg = 'rgba(0, 255, 136, 0.05)';
          borderLeftColor = 'var(--success)';
          textColor = '#a7f3d0';
        }

        return (
          <blockquote
            key={idx}
            style={{
              background: bg,
              borderLeft: `3px solid ${borderLeftColor}`,
              padding: '10px 14px',
              borderRadius: '0 8px 8px 0',
              margin: '10px 0',
              fontSize: 12,
              fontStyle: 'italic',
              color: textColor,
              lineHeight: 1.5,
            }}
          >
            {renderTextWithBold(quoteContent)}
          </blockquote>
        );
      }

      // List Elements
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li
            key={idx}
            style={{
              fontSize: 12.5,
              color: 'var(--text)',
              marginLeft: 14,
              marginBottom: 6,
              lineHeight: 1.5,
            }}
          >
            {renderTextWithBold(trimmed.slice(2))}
          </li>
        );
      }

      // Standard paragraphs
      return (
        <p
          key={idx}
          style={{
            fontSize: 12.5,
            color: 'var(--text)',
            lineHeight: 1.6,
            marginBottom: 8,
          }}
        >
          {renderTextWithBold(trimmed)}
        </p>
      );
    });
  };

  // Render text segment replacing **bold** and `code` markers
  const renderTextWithBold = (text: string): React.ReactNode[] => {
    const parts = text.split('**');
    return parts.flatMap((part, i) => {
      const isBold = i % 2 === 1;
      const codeParts = part.split('`');
      
      const elements = codeParts.map((subPart, j) => {
        const isCode = j % 2 === 1;
        if (isCode) {
          return (
            <code
              key={`code-${i}-${j}`}
              style={{
                background: 'rgba(0, 0, 0, 0.45)',
                padding: '2px 5px',
                borderRadius: 4,
                fontFamily: 'monospace',
                color: 'var(--success)',
                fontSize: 11,
                border: '1px solid rgba(0, 255, 136, 0.15)',
              }}
            >
              {subPart}
            </code>
          );
        }
        return subPart;
      });

      if (isBold) {
        return <strong key={`bold-${i}`} style={{ color: '#fff', fontWeight: 750 }}>{elements}</strong>;
      }
      return elements;
    });
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="page-title">Agent Ledger</h1>
            <p className="page-subtitle">Real-time AI agent decision log — {agentActions.length} entries</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={generateDebrief}
              style={{
                background: 'linear-gradient(135deg, var(--primary), #0066ff)',
                color: '#05070c',
                fontWeight: 800,
                fontSize: 12,
                padding: '8px 18px',
                borderRadius: 8,
                boxShadow: '0 0 16px rgba(0, 212, 255, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
              onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
              onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
            >
              ✨ Generate AI Debrief
            </button>
            <div className={`connection-pill ${isConnected ? 'connected' : 'disconnected'}`} style={{ height: 32 }}>
              <span style={{
                width: 7, height: 7, borderRadius: '50%',
                background: isConnected ? 'var(--success)' : 'var(--danger)',
                display: 'inline-block',
              }} />
              {isConnected ? 'Live' : 'Mock'}
            </div>
        </div>

        {/* Filter Bar */}
        <div className="ledger-filter-bar">
          <span className="filter-label">Filter:</span>
          <button
            className={`filter-pill ${activeFilters.size === 0 ? 'active' : ''}`}
            onClick={() => setActiveFilters(new Set())}
          >
            All Agents
          </button>
          {ALL_AGENTS.map(agent => {
            const style = getAgentStyle(agent);
            const isActive = activeFilters.has(agent);
            return (
              <button
                key={agent}
                className={`filter-pill ${isActive ? 'active' : ''}`}
                style={{
                  '--pill-color': style.color,
                  borderColor: isActive ? style.color : undefined,
                  color: isActive ? style.color : undefined,
                  background: isActive ? style.bg : undefined,
                } as React.CSSProperties}
                onClick={() => toggleFilter(agent)}
              >
                {agent}
              </button>
            );
          })}
        </div>

        {/* Ledger entries */}
        <div className="ledger-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              No entries match the current filter.
            </div>
          ) : filtered.map((action, i) => {
            const style = getAgentStyle(action.agent);
            return (
              <div
                key={action.id}
                className="glass-card ledger-entry"
                style={{
                  '--entry-color': style.color,
                  animationDelay: `${Math.min(i * 0.04, 0.5)}s`,
                } as React.CSSProperties}
              >
                <div className="ledger-entry-header">
                  <span
                    className="agent-badge"
                    style={{ background: style.bg, color: style.color }}
                  >
                    {action.agent}
                  </span>
                  <span className="action-type-badge">{action.actionType}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px',
                    background: 'rgba(0,212,255,0.08)', color: 'var(--primary)',
                    borderRadius: 4, border: '1px solid rgba(0,212,255,0.2)',
                  }}>
                    {action.sector}
                  </span>
                  <span className="ledger-time" style={{ marginLeft: 'auto' }}>
                    {formatRelativeTime(action.timestamp)}
                  </span>
                </div>
                <div className="ledger-message">{action.message}</div>
                <div className="ledger-reasoning">
                  💭 <em>{action.reasoning}</em>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Visual Post-Match AI Debrief Modal Sheet ── */}
        {debriefOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(5, 7, 12, 0.82)',
              backdropFilter: 'blur(10px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              animation: 'fade-in 0.3s ease both',
            }}
          >
            <div
              className="glass-card"
              style={{
                width: '100%',
                maxWidth: 820,
                height: '82vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(0, 212, 255, 0.25)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
                borderRadius: 16,
                position: 'relative',
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '18px 24px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(15, 23, 42, 0.55)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 20 }}>🏟️</span>
                  <div>
                    <h2 style={{ fontSize: 15, fontWeight: 900, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      Post-Match AI Operational Debrief
                      <span style={{ fontSize: 9, background: 'rgba(0, 255, 136, 0.12)', border: '1px solid rgba(0, 255, 136, 0.3)', color: 'var(--success)', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                        Forensic Audit
                      </span>
                    </h2>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', margin: 0, marginTop: 1.5 }}>
                      Compiled by StadiumOS Swarm Intelligence System
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setDebriefOpen(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 68, 68, 0.2)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                >
                  ✕
                </button>
              </div>

              {/* Main Content Area */}
              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '24px 30px',
                  background: 'rgba(10, 15, 28, 0.4)',
                }}
              >
                {debriefLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 20 }}>
                    {/* Glowing outer spin indicator */}
                    <div style={{ position: 'relative', width: 74, height: 74 }}>
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          border: '3px solid transparent',
                          borderTopColor: 'var(--primary)',
                          animation: 'spin 1.2s linear infinite',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          right: 8,
                          bottom: 8,
                          borderRadius: '50%',
                          border: '2px solid transparent',
                          borderBottomColor: 'var(--success)',
                          animation: 'spin 2s linear infinite reverse',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          top: 22,
                          left: 22,
                          right: 22,
                          bottom: 22,
                          borderRadius: '50%',
                          background: 'rgba(0, 212, 255, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                        }}
                      >
                        🤖
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h3 style={{ fontSize: 13.5, fontWeight: 700, color: 'white', margin: 0 }}>Compiling Match Operations Report</h3>
                      <p style={{ fontSize: 11.5, color: 'var(--primary)', marginTop: 6, fontStyle: 'italic', height: 18 }}>
                        {loadingPhase}
                      </p>
                    </div>
                  </div>
                ) : debriefReport ? (
                  <div style={{ animation: 'fade-in 0.4s ease both' }}>
                    {parseMarkdown(debriefReport)}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                    No report loaded.
                  </div>
                )}
              </div>

              {/* Footer Controls */}
              {!debriefLoading && debriefReport && (
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    background: 'rgba(15, 23, 42, 0.75)',
                  }}
                >
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(debriefReport);
                      alert('Copied report to clipboard!');
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontWeight: 600,
                      fontSize: 11.5,
                      padding: '8px 16px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                    onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
                  >
                    📋 Copy to Clipboard
                  </button>

                  <button
                    onClick={() => setDebriefOpen(false)}
                    style={{
                      background: 'linear-gradient(135deg, var(--primary), #0066ff)',
                      color: '#05070c',
                      fontWeight: 800,
                      fontSize: 11.5,
                      padding: '8px 20px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      border: 'none',
                      transition: 'all 0.2s',
                      boxShadow: '0 0 12px rgba(0, 212, 255, 0.3)',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.filter = 'brightness(1.15)')}
                    onMouseOut={(e) => (e.currentTarget.style.filter = 'none')}
                  >
                    Close Report
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
