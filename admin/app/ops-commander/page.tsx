'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { getCPSColor, getCPSStatus } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  data?: QueryResult;
  timestamp: number;
}

interface QueryResult {
  type: 'table' | 'text';
  columns?: string[];
  rows?: (string | number)[][];
  text?: string;
}

const EXAMPLE_QUERIES = [
  'Show all sectors with CPS above 0.75',
  'Which gate has the highest fraud rate?',
  'What is the current storm status?',
  'Recommend evacuation route for sector C3',
];

const API_URL = typeof window !== 'undefined'
  ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/query`
  : 'http://localhost:8000/api/query';

// Mock AI responses when backend is not available
function getMockResponse(query: string): QueryResult {
  const q = query.toLowerCase();

  if (q.includes('cps') || q.includes('sector')) {
    const rows: [string, string, string][] = [
      ['B3', '0.87', 'CRITICAL'],
      ['A2', '0.78', 'CRITICAL'],
      ['D1', '0.76', 'CRITICAL'],
      ['C4', '0.71', 'WARNING'],
    ];
    return {
      type: 'table',
      columns: ['Sector', 'CPS', 'Status'],
      rows: rows.map(r => [
        r[0],
        r[1],
        r[2],
      ]),
    };
  }

  if (q.includes('gate') || q.includes('fraud')) {
    return {
      type: 'table',
      columns: ['Gate', 'Fraud Incidents', 'Risk Level'],
      rows: [
        ['Gate-H', 7,  'HIGH'   ],
        ['Gate-B', 4,  'MEDIUM' ],
        ['Gate-A', 2,  'LOW'    ],
        ['Gate-E', 1,  'LOW'    ],
      ],
    };
  }

  if (q.includes('storm')) {
    return {
      type: 'text',
      text: 'STORM STATUS: Clear. No active storm front detected within a 50km radius. Wind speed: 12 mph SW. Humidity: 68%. ClimaSync agent confidence: 97.3%. Next weather check scheduled in 8 minutes.',
    };
  }

  if (q.includes('evacuation') || q.includes('route')) {
    return {
      type: 'text',
      text: 'EVACUATION ROUTE — Sector C3: Primary route via Corridor East-B → Gate-F (capacity: 1,200/min). Secondary route via Corridor South → Gate-D (capacity: 800/min). Estimated full evacuation time: 4.2 minutes. FlowMaster has pre-staged personnel at Gate-F.',
    };
  }

  return {
    type: 'text',
    text: `Processed query: "${query}". OpsCommander AI has analyzed the current stadium state. All systems nominal. 16 sectors monitored, 5 agents active. For specific data queries, try: CPS levels, gate fraud, storm status, or evacuation routes.`,
  };
}

export default function OpsCommanderPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendQuery = async (query: string) => {
    if (!query.trim() || loading) return;
    const userMsg: Message = {
      id: Math.random().toString(36).slice(2),
      type: 'user',
      content: query,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      const aiMsg: Message = {
        id: Math.random().toString(36).slice(2),
        type: 'ai',
        content: query,
        data: data.result ?? { type: 'text', text: JSON.stringify(data) },
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      // Backend not available — use mock
      await new Promise(r => setTimeout(r, 800));
      const aiMsg: Message = {
        id: Math.random().toString(36).slice(2),
        type: 'ai',
        content: query,
        data: getMockResponse(query),
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendQuery(input);
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '28px 32px' }}>
        <div className="page-header" style={{ marginBottom: 20 }}>
          <h1 className="page-title">Ops Commander</h1>
          <p className="page-subtitle">Natural language stadium intelligence interface — powered by AI</p>
        </div>

        <div className="ops-layout glass-card" style={{ flex: 1, padding: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="ops-messages">
            {messages.length === 0 ? (
              <div className="ops-empty-state">
                <div className="ops-empty-icon">🤖</div>
                <div className="ops-empty-text">
                  Ask OpsCommander anything about your stadium.<br />
                  Get real-time AI-powered insights instantly.
                </div>
                <div className="example-chips">
                  {EXAMPLE_QUERIES.map(q => (
                    <button key={q} className="example-chip" onClick={() => sendQuery(q)}>
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map(msg => (
                  <div key={msg.id}>
                    {msg.type === 'user' ? (
                      <div className="user-bubble">{msg.content}</div>
                    ) : (
                      <div className="ai-response">
                        <div className="glass-card ai-response-card">
                          <div className="ai-response-status">
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--success)', display: 'inline-block', animation: 'pulse-glow 2s infinite' }} />
                            Processed by OpsCommander AI
                          </div>
                          {msg.data?.type === 'table' && msg.data.columns && (
                            <table className="response-table">
                              <thead>
                                <tr>
                                  {msg.data.columns.map(col => (
                                    <th key={col}>{col}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {msg.data.rows?.map((row, i) => (
                                  <tr key={i}>
                                    {row.map((cell, j) => (
                                      <td key={j}>
                                        {msg.data?.columns?.[j] === 'Status' || msg.data?.columns?.[j] === 'Risk Level'
                                          ? <StatusBadge value={String(cell)} />
                                          : msg.data?.columns?.[j] === 'CPS'
                                            ? <span style={{ color: getCPSColor(parseFloat(String(cell))), fontWeight: 700 }}>{cell}</span>
                                            : cell
                                        }
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                          {msg.data?.type === 'text' && (
                            <p className="response-text">{msg.data.text}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="ai-response">
                    <div className="glass-card ai-response-card" style={{ padding: '18px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
                        <span className="spinner" style={{ borderTopColor: 'var(--primary)', borderColor: 'rgba(0,212,255,0.2)' }} />
                        OpsCommander is analyzing…
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input bar — always at bottom */}
          <form className="ops-input-bar" onSubmit={handleSubmit}>
            <input
              id="ops-query-input"
              className="ops-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about sectors, agents, alerts, fraud, evacuation routes…"
              disabled={loading}
              autoComplete="off"
            />
            <button id="ops-send-btn" type="submit" className="btn-primary" disabled={loading || !input.trim()}>
              {loading ? <span className="spinner" /> : 'Send ↵'}
            </button>
          </form>

          {/* Quick chips below input when there are messages */}
          {messages.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {EXAMPLE_QUERIES.map(q => (
                <button key={q} className="example-chip" style={{ fontSize: 11, padding: '5px 12px' }} onClick={() => sendQuery(q)}>
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    CRITICAL: 'var(--danger)',
    WARNING:  '#ff6400',
    CAUTION:  'var(--warning)',
    SAFE:     'var(--success)',
    HIGH:     'var(--danger)',
    MEDIUM:   'var(--warning)',
    LOW:      'var(--success)',
  };
  const color = colorMap[value] ?? 'var(--text-muted)';
  return (
    <span style={{
      color, fontWeight: 700, fontSize: 11,
      padding: '2px 8px', borderRadius: 4,
      background: `${color}22`,
      border: `1px solid ${color}44`,
    }}>{value}</span>
  );
}
