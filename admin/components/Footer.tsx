'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="footer-copyright">
            © {new Date().getFullYear()}{' '}
            <a
              href="https://www.dayananddarpan.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Dayanand Darpan
            </a>
            . All Rights Reserved.
          </span>
          <span className="footer-divider">|</span>
          <span className="footer-hackathon">
            Made for{' '}
            <strong className="glow-text">Build with AI (Agentic Premier League)</strong>
          </span>
        </div>
        <div className="footer-right">
          <Link href="/about" className="footer-nav-link">
            About
          </Link>
          <Link href="/privacy" className="footer-nav-link">
            Privacy Policy
          </Link>
          <span className="footer-status-pill">
            <span className="status-indicator-dot" />
            Agent Network Online
          </span>
        </div>
      </div>
    </footer>
  );
}
