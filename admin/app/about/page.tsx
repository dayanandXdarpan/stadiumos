'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useState, useEffect } from 'react';

const SYSTEM_AGENTS = [
  {
    name: 'CrowdIntelligence',
    code: 'CI',
    color: '#00d4ff',
    desc: 'Real-time telemetry parser that calculates Crowd Pressure Scores (CPS), thermal bottlenecks, and density parameters across 16 venue sectors.',
  },
  {
    name: 'FlowMaster',
    code: 'FM',
    color: '#3b82f6',
    desc: 'Automated entry-point coordinator adjusting turnstile loads and executing active lateral gate diversion paths to clear high-congestion zones.',
  },
  {
    name: 'TicketSentinel',
    code: 'TS',
    color: '#a855f7',
    desc: 'Secure ingress validator utilizing cryptographic ticket ledger tracking to detect high-velocity duplicate attempts and prevent access fraud.',
  },
  {
    name: 'ClimaSync',
    code: 'CS',
    color: '#14b8a6',
    desc: 'Localized microclimate regulator adjusting seating HVAC grids, fan mist arrays, and overhead stadium canopies based on live heat-map dynamics.',
  },
  {
    name: 'SocialSentinel',
    code: 'SS',
    color: '#ec4899',
    desc: 'Event sentiment listener scraping local geo-fenced social feeds and broadcast channels to flag infrastructure issues or emergency notices instantly.',
  },
  {
    name: 'EmergencyAgent',
    code: 'EA',
    color: '#ff4444',
    desc: 'Safety controller running predictive panic mitigation algorithms, triggering warning corridors, and organizing automatic supervisor dispatches.',
  },
];

export default function AboutPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">About StadiumOS</h1>
          <p className="page-subtitle">Multi-Agent Smart Arena Orchestration Layer</p>
        </div>

        {/* System Overview Card */}
        <div
          className="glass-card"
          style={{
            padding: '28px',
            marginBottom: '24px',
            animation: 'fade-in 0.5s ease both',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #00d4ff, #00ff88)',
            }}
          />
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: '#fff',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ⚡ Platform Architecture
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text)',
              lineHeight: 1.6,
              marginBottom: '16px',
            }}
          >
            StadiumOS is an adaptive, cyber-physical platform engineered to manage massive crowds and stadium assets dynamically. Driven by an autonomous swarm of six specialized AI agents, StadiumOS actively senses, reasons, and coordinates stadium flows, comfort levels, and safety metrics to deliver an optimized spectator experience.
          </p>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            By combining real-time sound levels, gate ingress telemetry, and predictive crowd models, the platform forms a live <strong>Digital Twin</strong> that models thousands of sensory data nodes per second, authorizing automated dispatches and safeguarding smart venue infrastructure.
          </p>
        </div>

        {/* Agents Grid */}
        <h3
          style={{
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1.2px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            marginBottom: '16px',
          }}
        >
          🤖 Active Autonomous Agents
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '16px',
            marginBottom: '32px',
          }}
        >
          {SYSTEM_AGENTS.map((agent, i) => (
            <div
              key={agent.code}
              className="glass-card"
              style={{
                padding: '20px',
                borderLeft: `3px solid ${agent.color}`,
                animation: 'fade-in 0.4s ease both',
                animationDelay: `${i * 0.05}s`,
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <strong style={{ fontSize: '15px', color: '#fff' }}>
                  {agent.name}
                </strong>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '20px',
                    background: `${agent.color}15`,
                    color: agent.color,
                    border: `1px solid ${agent.color}30`,
                  }}
                >
                  {agent.code} ACTIVE
                </span>
              </div>
              <p
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  lineHeight: 1.5,
                }}
              >
                {agent.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Architect & Hackathon Block */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px',
            marginBottom: '32px',
          }}
        >
          <div
            className="glass-card"
            style={{
              padding: '24px',
              animation: 'fade-in 0.5s ease both',
              animationDelay: '0.3s',
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                color: '#fff',
                fontWeight: 800,
                marginBottom: '10px',
              }}
            >
              👤 Lead Systems Architect
            </h4>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: '12px',
              }}
            >
              This deployment of StadiumOS was fully architected and optimized by{' '}
              <strong>Dayanand Darpan</strong>, a full-stack engineer and AI specialist.
            </p>
            <a
              href="https://www.dayananddarpan.in/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: '12px',
                color: 'var(--primary)',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Visit Portfolio Website →
            </a>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '24px',
              animation: 'fade-in 0.5s ease both',
              animationDelay: '0.4s',
            }}
          >
            <h4
              style={{
                fontSize: '14px',
                color: '#fff',
                fontWeight: 800,
                marginBottom: '10px',
              }}
            >
              🏆 Agentic Premier League
            </h4>
            <p
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
                marginBottom: '12px',
              }}
            >
              StadiumOS represents a premium submission for the{' '}
              <strong>Build with AI (Agentic Premier League)</strong> hackathon,
              leveraging cutting-edge multi-agent coordination paradigms.
            </p>
            <span
              style={{
                fontSize: '11px',
                background: 'rgba(0, 255, 136, 0.08)',
                border: '1px solid rgba(0, 255, 136, 0.25)',
                color: 'var(--success)',
                padding: '4px 12px',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'inline-block',
              }}
            >
              ⚡ Built with Gemini 3.5 Flash
            </span>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
