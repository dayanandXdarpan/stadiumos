// ============================================================
// lib/utils.ts — StadiumOS Shared Utilities
// ============================================================

export type CPSStatus = 'SAFE' | 'CAUTION' | 'WARNING' | 'CRITICAL';

export interface CPSTheme {
  color: string;
  border: string;
  background: string;
  status: CPSStatus;
}

/**
 * Returns color/border/bg styling based on CPS value
 */
export function getCPSTheme(cps: number): CPSTheme {
  if (cps < 0.4) {
    return {
      color: '#00ff88',
      border: '#00ff88',
      background: 'rgba(0, 255, 136, 0.07)',
      status: 'SAFE',
    };
  } else if (cps < 0.6) {
    return {
      color: '#ffaa00',
      border: '#ffaa00',
      background: 'rgba(255, 170, 0, 0.08)',
      status: 'CAUTION',
    };
  } else if (cps < 0.75) {
    return {
      color: '#ff6400',
      border: '#ff6400',
      background: 'rgba(255, 100, 0, 0.08)',
      status: 'WARNING',
    };
  } else {
    return {
      color: '#ff4444',
      border: '#ff4444',
      background: 'rgba(255, 68, 68, 0.12)',
      status: 'CRITICAL',
    };
  }
}

export function getCPSColor(cps: number): string {
  return getCPSTheme(cps).color;
}

export function getCPSStatus(cps: number): CPSStatus {
  return getCPSTheme(cps).status;
}

export interface AgentStyle {
  color: string;
  bg: string;
}

const AGENT_STYLES: Record<string, AgentStyle> = {
  CrowdIntelligence: { color: '#00d4ff', bg: 'rgba(0,212,255,0.15)' },
  FlowMaster:        { color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  TicketSentinel:    { color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  ClimaSync:         { color: '#14b8a6', bg: 'rgba(20,184,166,0.15)' },
  SocialSentinel:    { color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
  EmergencyAgent:    { color: '#ff4444', bg: 'rgba(255,68,68,0.15)'  },
};

export function getAgentStyle(agent: string): AgentStyle {
  return AGENT_STYLES[agent] ?? { color: '#64748b', bg: 'rgba(100,116,139,0.15)' };
}

export function getAgentColor(agent: string): string {
  return getAgentStyle(agent).color;
}

/**
 * Returns relative time string (e.g., "2s ago", "5m ago")
 */
export function formatRelativeTime(timestamp: number | string | Date): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = Math.max(0, now - date.getTime());

  if (diff < 60_000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/** Generate a unique id using the Web Crypto API (collision-safe) */
export function uid(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

// ── Sector ID helpers ────────────────────────────────────────
const ROWS = ['A', 'B', 'C', 'D'];
const COLS = [1, 2, 3, 4];

export function getAllSectorIds(): string[] {
  return ROWS.flatMap(r => COLS.map(c => `${r}${c}`));
}

// ── Mock data generators ─────────────────────────────────────
export interface SectorData {
  sectorId: string;
  cps: number;
  density: number;
  velocity: number;
  audio: number;
  timestamp: number;
}

export interface AgentAction {
  id: string;
  agent: string;
  actionType: string;
  sector: string;
  message: string;
  reasoning: string;
  timestamp: number;
}

export interface AlertItem {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  message: string;
  timestamp: number;
}

const AGENT_NAMES = Object.keys(AGENT_STYLES);
const ACTION_TYPES: Record<string, string[]> = {
  CrowdIntelligence: ['CROWD_SURGE_DETECTED', 'DENSITY_ALERT', 'REROUTE'],
  FlowMaster:        ['GATE_REROUTE', 'FLOW_OPTIMIZED', 'CONGESTION_CLEARED'],
  TicketSentinel:    ['FRAUD_DETECTED', 'DUPLICATE_SCAN', 'TICKET_BLOCKED'],
  ClimaSync:         ['STORM_RESPONSE', 'WIND_WARNING', 'HEAT_ADVISORY'],
  SocialSentinel:    ['SENTIMENT_SHIFT', 'VIRAL_INCIDENT', 'SECURITY_FLAGGED'],
  EmergencyAgent:    ['EVACUATION_INITIATED', 'MEDICAL_DISPATCH', 'EMERGENCY_RESPONSE'],
};
const MESSAGES: Record<string, string[]> = {
  CrowdIntelligence: [
    'Crowd surge detected in sector — triggering preemptive rerouting.',
    'Density threshold exceeded, AI recommending lateral dispersal.',
    'CPS spike recorded, alerting FlowMaster for gate management.',
  ],
  FlowMaster: [
    'Gate-C rerouted to Gate-E due to congestion buildup.',
    'Flow optimized: 23% reduction in bottleneck probability.',
    'Cross-sector dispersal initiated, 3 gates reallocated.',
  ],
  TicketSentinel: [
    'Duplicate ticket scan at Gate-B — seat 14F. Access revoked.',
    'Fraud ring detected: 7 tickets share same serial prefix.',
    'High-frequency scans from Gate-A flagged for investigation.',
  ],
  ClimaSync: [
    'Storm front incoming in 38 minutes. Recommending roof closure.',
    'Wind speed 42mph at deck level — advisory issued to security.',
    'Humidity spike detected — heat exhaustion risk elevated.',
  ],
  SocialSentinel: [
    'Negative sentiment surge on social media around sector C2.',
    'Viral incident detected — security dispatched to area B3.',
    'Fan behavior pattern shift — de-escalation protocol activated.',
  ],
  EmergencyAgent: [
    'Medical emergency at Row 14, Sector A2 — medics dispatched.',
    'Evacuation route C→D corridor activated for drill simulation.',
    'Emergency response triggered: structural anomaly in West Stand.',
  ],
};

export function generateMockSectors(): SectorData[] {
  return getAllSectorIds().map(sectorId => ({
    sectorId,
    cps:      parseFloat((Math.random() * 0.95).toFixed(2)),
    density:  parseFloat((Math.random()).toFixed(2)),
    velocity: parseFloat((Math.random()).toFixed(2)),
    audio:    parseFloat((Math.random()).toFixed(2)),
    timestamp: Date.now(),
  }));
}

export function generateMockAction(): AgentAction {
  const agent = AGENT_NAMES[Math.floor(Math.random() * AGENT_NAMES.length)];
  const types = ACTION_TYPES[agent] || ['ACTION'];
  const msgs  = MESSAGES[agent] || ['Agent action executed.'];
  const rows = ROWS;
  const sectorId = `${rows[Math.floor(Math.random() * rows.length)]}${Math.ceil(Math.random() * 4)}`;

  return {
    id:         uid(),
    agent,
    actionType: types[Math.floor(Math.random() * types.length)],
    sector:     sectorId,
    message:    msgs[Math.floor(Math.random() * msgs.length)],
    reasoning: `Confidence: ${(Math.random() * 30 + 70).toFixed(1)}%. Historical patterns match current observation. Threshold breach confirmed across ${Math.ceil(Math.random() * 3)} sensors.`,
    timestamp:  Date.now(),
  };
}

export function generateMockAlert(): AlertItem {
  const severities: AlertItem['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const texts = [
    'Crowd density critical in Sector B3 — manual intervention required',
    'Ticket fraud detected at Gate-H — 4 incidents in 2 minutes',
    'Storm front approaching — wind advisory active for open stands',
    'Unusual crowd flow detected near emergency exit C2',
    'Audio anomaly in Sector A4 — potential crowd distress signal',
    'CPS threshold breach in D1 — evacuation pre-check initiated',
  ];
  return {
    id:       uid(),
    severity: severities[Math.floor(Math.random() * severities.length)],
    message:  texts[Math.floor(Math.random() * texts.length)],
    timestamp: Date.now(),
  };
}

export function generateInitialLedger(count = 12): AgentAction[] {
  return Array.from({ length: count }, () => ({
    ...generateMockAction(),
    timestamp: Date.now() - Math.floor(Math.random() * 600_000),
  })).sort((a, b) => b.timestamp - a.timestamp);
}

export function generateInitialAlerts(count = 10): AlertItem[] {
  return Array.from({ length: count }, () => ({
    ...generateMockAlert(),
    timestamp: Date.now() - Math.floor(Math.random() * 300_000),
  })).sort((a, b) => b.timestamp - a.timestamp);
}
