'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content">
        {/* Page Header */}
        <div className="page-header">
          <h1 className="page-title">Spectator Privacy Policy</h1>
          <p className="page-subtitle">StadiumOS Privacy-by-Design Safeguards</p>
        </div>

        {/* Introduction */}
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
              background: 'linear-gradient(90deg, #ec4899, #a855f7)',
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
            🛡️ Privacy & Safety Safeguards
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text)',
              lineHeight: 1.6,
              marginBottom: '16px',
            }}
          >
            StadiumOS is designed from the ground up to respect spectator privacy. Our multi-agent coordination system operates purely on anonymized crowd dynamics, crowd flow counts, and regional volume densities.
          </p>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
            }}
          >
            By design, the platform excludes all methods of biometric facial recognition, active cellular triangulation, or personal data mining. We process environmental metrics to ensure safety, not to track individuals.
          </p>
        </div>

        {/* Privacy Principles */}
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
          🔑 Core Privacy Principles
        </h3>
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
              padding: '22px',
              animation: 'fade-in 0.5s ease both',
              animationDelay: '0.1s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>👤</div>
            <h4
              style={{
                fontSize: '15px',
                color: '#fff',
                fontWeight: 800,
                marginBottom: '8px',
              }}
            >
              Anonymization by Design
            </h4>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              Our thermal imaging cameras and density scanners convert incoming feeds directly into coordinate values and headcount counts. Video frames are fully processed at the edge, meaning zero visual footages are streamed or stored.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '22px',
              animation: 'fade-in 0.5s ease both',
              animationDelay: '0.2s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>💾</div>
            <h4
              style={{
                fontSize: '15px',
                color: '#fff',
                fontWeight: 800,
                marginBottom: '8px',
              }}
            >
              Zero Storage Persistence
            </h4>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              Spectator seat microclimate indexes, turnstile ingress rate speeds, and sound spectrum levels are ingested as volatile streams. These data channels are purged immediately once analyzed by the agent network.
            </p>
          </div>

          <div
            className="glass-card"
            style={{
              padding: '22px',
              animation: 'fade-in 0.5s ease both',
              animationDelay: '0.3s',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🤖</div>
            <h4
              style={{
                fontSize: '15px',
                color: '#fff',
                fontWeight: 800,
                marginBottom: '8px',
              }}
            >
              Human-in-the-Loop Controls
            </h4>
            <p
              style={{
                fontSize: '12.5px',
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}
            >
              High-impact decisions, such as partition deployment, gate rerouting, or volunteer escalations, are never finalized solely by automated logic. These actions require manual supervisor authorization to execute.
            </p>
          </div>
        </div>

        {/* Specific Data Ingestions */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            marginBottom: '32px',
            animation: 'fade-in 0.5s ease both',
            animationDelay: '0.4s',
          }}
        >
          <h4
            style={{
              fontSize: '15px',
              color: '#fff',
              fontWeight: 800,
              marginBottom: '14px',
            }}
          >
            📊 Ingested Environmental Data Channels
          </h4>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '13px',
              color: 'var(--text)',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  Data Type
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  Sensor Source
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    color: 'var(--text-muted)',
                    fontWeight: 700,
                  }}
                >
                  Privacy Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>
                  Decibel Sound Level
                </td>
                <td style={{ padding: '12px' }}>Acoustic microphones</td>
                <td style={{ padding: '12px', color: 'var(--success)' }}>
                  Fully Anonymized
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>
                  Thermal Silhouettes
                </td>
                <td style={{ padding: '12px' }}>Overhead sector cameras</td>
                <td style={{ padding: '12px', color: 'var(--success)' }}>
                  Processed at Edge
                </td>
              </tr>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <td style={{ padding: '12px', fontWeight: 600 }}>
                  Ingress Scan Counts
                </td>
                <td style={{ padding: '12px' }}>RFID and barcode scanners</td>
                <td style={{ padding: '12px', color: 'var(--success)' }}>
                  Aggregated Metrics
                </td>
              </tr>
              <tr>
                <td style={{ padding: '12px', fontWeight: 600 }}>
                  Geo-fenced Sentiments
                </td>
                <td style={{ padding: '12px' }}>Public social media APIs</td>
                <td style={{ padding: '12px', color: 'var(--success)' }}>
                  Public Data Only
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <Footer />
      </main>
    </div>
  );
}
