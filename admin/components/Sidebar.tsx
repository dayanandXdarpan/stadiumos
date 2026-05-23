'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/',              icon: '⚡', label: 'Overview'      },
  { href: '/crowd-map',     icon: '🗺️', label: 'Crowd Map'     },
  { href: '/digital-twin',  icon: '🔮', label: 'Digital Twin'  },
  { href: '/agent-ledger',  icon: '📋', label: 'Agent Ledger'  },
  { href: '/alerts',        icon: '🚨', label: 'Alerts'        },
  { href: '/ops-commander', icon: '🤖', label: 'Ops Commander' },
  { href: '/simulation',    icon: '🎛️', label: 'Simulation'    },
];

const AGENTS = [
  { name: 'CI', color: '#00d4ff', title: 'CrowdIntelligence' },
  { name: 'FM', color: '#3b82f6', title: 'FlowMaster'        },
  { name: 'TS', color: '#a855f7', title: 'TicketSentinel'    },
  { name: 'CS', color: '#14b8a6', title: 'ClimaSync'         },
  { name: 'SS', color: '#ec4899', title: 'SocialSentinel'    },
  { name: 'EA', color: '#ff4444', title: 'EmergencyAgent'    },
];

interface SidebarProps {
  isConnected?: boolean;
}

export default function Sidebar({ isConnected }: SidebarProps) {
  const pathname = usePathname();

  // Exact match for root, prefix match for all others
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const agentOnline = isConnected !== false; // default to showing online if not passed

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-mark">
          <div className="logo-icon">S</div>
          <div className="logo-text">
            <span className="logo-name">StadiumOS</span>
            <span className="logo-sub">Command Center</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-link ${isActive(item.href) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-status">
        <div className="status-title">System Status</div>
        <div className="status-label">
          <div
            className="status-dot"
            style={{
              background: agentOnline ? 'var(--success)' : 'var(--danger)',
              animation: agentOnline ? 'pulse-glow 2s infinite' : 'pulse-danger 2s infinite',
            }}
          />
          {agentOnline ? 'All Systems Operational' : 'Backend Offline — Mock Mode'}
        </div>
        <div className="agent-dots">
          {AGENTS.map(a => (
            <div key={a.name} className="agent-dot-item" title={a.title}>
              <div
                className="dot"
                style={{
                  background: agentOnline ? a.color : '#64748b',
                  boxShadow: agentOnline ? `0 0 4px 2px ${a.color}55` : 'none',
                }}
              />
              {a.name}
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
