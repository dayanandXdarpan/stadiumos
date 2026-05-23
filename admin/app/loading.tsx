// Shared loading skeleton — shown by Next.js App Router during page transitions
export default function Loading() {
  return (
    <div className="app-shell">
      {/* Skeleton sidebar */}
      <aside className="sidebar" style={{ opacity: 0.4 }}>
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">S</div>
            <div className="logo-text">
              <span className="logo-name">StadiumOS</span>
              <span className="logo-sub">Loading…</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Skeleton main */}
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ height: 60, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse-glow 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              style={{ height: 120, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animationDelay: `${i * 0.1}s`, animation: 'pulse-glow 1.5s infinite' }}
            />
          ))}
        </div>
        <div style={{ height: 200, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse-glow 1.5s infinite' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 20 }}>
          <div style={{ height: 280, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse-glow 1.5s infinite' }} />
          <div style={{ height: 280, borderRadius: 12, background: 'rgba(255,255,255,0.04)', animation: 'pulse-glow 1.5s infinite' }} />
        </div>
      </main>
    </div>
  );
}
