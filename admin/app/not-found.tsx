import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
      flexDirection: 'column',
      gap: 24,
      padding: 32,
    }}>
      <div style={{ fontSize: 72, lineHeight: 1 }}>🏟️</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 80, fontWeight: 900, color: '#00d4ff', lineHeight: 1, letterSpacing: -4 }}>404</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', marginTop: 12 }}>Page Not Found</div>
        <div style={{ fontSize: 14, color: '#64748b', marginTop: 8 }}>
          This sector doesn&apos;t exist in the stadium grid.
        </div>
      </div>
      <Link
        href="/"
        style={{
          padding: '12px 28px',
          borderRadius: 10,
          background: 'linear-gradient(135deg, #00d4ff, #0066ff)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          textDecoration: 'none',
          boxShadow: '0 0 24px rgba(0,212,255,0.35)',
          transition: 'all 0.2s ease',
        }}
      >
        Return to Command Center
      </Link>
    </div>
  );
}
