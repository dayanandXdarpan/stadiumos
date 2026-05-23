'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'admin' | 'supervisor'>('admin');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (role === 'supervisor') {
        router.push('/supervisor');
      } else {
        router.push('/');
      }
    }, 900);
  };

  return (
    <div className="login-bg">
      {/* Stadium silhouette SVG background */}
      <svg className="login-stadium-bg" viewBox="0 0 1440 400" preserveAspectRatio="xMidYMax meet" fill="none">
        <ellipse cx="720" cy="380" rx="680" ry="220" fill="white" fillOpacity="0.5" />
        <ellipse cx="720" cy="380" rx="500" ry="150" fill="#0a0f1e" />
        {/* Left stands */}
        <path d="M40 380 L180 200 L280 200 L200 380 Z" fill="white" fillOpacity="0.6" />
        <path d="M180 200 L230 120 L300 120 L280 200 Z" fill="white" fillOpacity="0.4" />
        {/* Right stands */}
        <path d="M1400 380 L1260 200 L1160 200 L1240 380 Z" fill="white" fillOpacity="0.6" />
        <path d="M1260 200 L1210 120 L1140 120 L1160 200 Z" fill="white" fillOpacity="0.4" />
        {/* Top stands */}
        <path d="M300 120 L370 60 L1070 60 L1140 120 Z" fill="white" fillOpacity="0.35" />
        <path d="M370 60 L400 20 L1040 20 L1070 60 Z" fill="white" fillOpacity="0.2" />
        {/* Pitch */}
        <ellipse cx="720" cy="340" rx="340" ry="110" fill="white" fillOpacity="0.08" />
        <ellipse cx="720" cy="340" rx="240" ry="70"  fill="white" fillOpacity="0.06" />
        {/* Center circle */}
        <circle cx="720" cy="340" r="55" stroke="white" strokeWidth="2" strokeOpacity="0.12" fill="none" />
        {/* Center line */}
        <line x1="380" y1="340" x2="1060" y2="340" stroke="white" strokeWidth="1.5" strokeOpacity="0.1" />
        {/* Goal boxes */}
        <rect x="380" y="310" width="80" height="60" stroke="white" strokeWidth="1.5" strokeOpacity="0.1" fill="none" />
        <rect x="980" y="310" width="80" height="60" stroke="white" strokeWidth="1.5" strokeOpacity="0.1" fill="none" />
      </svg>

      <div className="login-card glass-card">
        <div className="login-logo">
          <div className="login-logo-icon">S</div>
          <div className="login-wordmark">
            Stadium<span>OS</span>
          </div>
          <div className="login-subtitle">AI-Agent Powered Stadium Intelligence</div>
        </div>

        {/* Segmented Role Selection Selector */}
        <div style={{
          display: 'flex', background: 'rgba(0,0,0,0.3)', borderRadius: 10,
          padding: 4, margin: '0 0 20px 0', border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <button
            type="button"
            onClick={() => setRole('admin')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 12, fontWeight: 800,
              background: role === 'admin' ? 'var(--primary)' : 'transparent',
              color: role === 'admin' ? '#070b14' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Super Admin (Global)
          </button>
          <button
            type="button"
            onClick={() => setRole('supervisor')}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 12, fontWeight: 800,
              background: role === 'supervisor' ? '#ffaa00' : 'transparent',
              color: role === 'supervisor' ? '#070b14' : 'var(--text-muted)',
              border: 'none', cursor: 'pointer', transition: 'all 0.2s'
            }}
          >
            Supervisor (Tablet)
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder={role === 'admin' ? 'admin@stadiumos.ai' : 'supervisor@stadiumos.ai'}
              defaultValue={role === 'admin' ? 'admin@stadiumos.ai' : 'supervisor@stadiumos.ai'}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="••••••••••••"
              defaultValue="supersecret"
              required
            />
          </div>

          <button
            id="login-btn"
            type="submit"
            className="login-btn"
            style={{
              background: role === 'supervisor' ? 'linear-gradient(135deg, #ffaa00, #d97706)' : undefined,
              boxShadow: role === 'supervisor' ? '0 4px 20px rgba(255, 170, 0, 0.15)' : undefined
            }}
            disabled={loading}
          >
            {loading
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                  <span className="spinner" /> Authenticating…
                </span>
              : role === 'admin' ? 'Login to Command Center' : 'Access Supervisor Tablet'
            }
          </button>
        </form>

        <div className="login-footer">
          For enterprise SSO integration, contact your IT administrator.<br />
          <span style={{ color: 'rgba(100,116,139,0.5)', fontSize: 10, marginTop: 6, display: 'block' }}>
            StadiumOS v2.4 · Secured · 256-bit encrypted
          </span>
        </div>
      </div>
    </div>
  );
}
