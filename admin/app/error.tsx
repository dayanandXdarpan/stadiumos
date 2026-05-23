'use client';

// Root error boundary — shown by Next.js App Router on unhandled errors
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="app-shell">
      <main
        className="main-content"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 24,
          height: '100vh',
        }}
      >
        <div
          className="glass-card"
          style={{ padding: '40px 48px', textAlign: 'center', maxWidth: 480 }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>
            {error?.message || 'An unexpected error occurred in the StadiumOS dashboard.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={reset}
              className="btn-primary"
              style={{ padding: '10px 24px', fontSize: 13 }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border)',
                color: 'var(--text-muted)',
                padding: '10px 24px',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Go to Overview
            </button>
          </div>
          {error?.digest && (
            <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 16, opacity: 0.5 }}>
              Error ID: {error.digest}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
