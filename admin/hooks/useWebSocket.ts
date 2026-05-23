'use client';

import { useEffect, useState } from 'react';
import {
  SectorData,
  AgentAction,
  AlertItem,
  uid,
  generateMockSectors,
  generateMockAction,
  generateMockAlert,
  generateInitialLedger,
  generateInitialAlerts,
} from '@/lib/utils';

export interface WebSocketState {
  sectorData:   SectorData[];
  agentActions: AgentAction[];
  alerts:       AlertItem[];
  isConnected:  boolean;
}

const WS_URL         = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws')
  : 'ws://localhost:8000/ws';
const RECONNECT_DELAY = 3000;
const MAX_ACTIONS     = 100;
const MAX_ALERTS      = 50;
const MOCK_INTERVAL   = 3000;

export function useWebSocket(): WebSocketState {
  const [sectorData,   setSectorData]   = useState<SectorData[]>([]);
  const [agentActions, setAgentActions] = useState<AgentAction[]>([]);
  const [alerts,       setAlerts]       = useState<AlertItem[]>([]);
  const [isConnected,  setIsConnected]  = useState(false);

  useEffect(() => {
    // ── All logic is local to this effect ──────────────────────
    // This prevents React StrictMode double-invocation from
    // triggering an infinite reconnect/re-render loop.
    let mounted      = true;
    let ws: WebSocket | null = null;
    let mockTimer:   ReturnType<typeof setInterval>  | null = null;
    let reconnTimer: ReturnType<typeof setTimeout>   | null = null;

    // ── Mock data ticker ────────────────────────────────────────
    const stopMock = () => {
      if (mockTimer) { clearInterval(mockTimer); mockTimer = null; }
    };

    const startMock = () => {
      if (mockTimer) return; // already running — guard against double-start
      mockTimer = setInterval(() => {
        if (!mounted) return;
        setSectorData(prev =>
          prev.map(s => ({
            ...s,
            cps:      parseFloat(Math.max(0, Math.min(1, s.cps      + (Math.random() - 0.5) * 0.06)).toFixed(2)),
            density:  parseFloat(Math.max(0, Math.min(1, s.density  + (Math.random() - 0.5) * 0.05)).toFixed(2)),
            velocity: parseFloat(Math.max(0, Math.min(1, s.velocity + (Math.random() - 0.5) * 0.04)).toFixed(2)),
            audio:    parseFloat(Math.max(0, Math.min(1, s.audio    + (Math.random() - 0.5) * 0.05)).toFixed(2)),
            timestamp: Date.now(),
          }))
        );
        if (Math.random() > 0.35) {
          setAgentActions(prev => [generateMockAction(), ...prev].slice(0, MAX_ACTIONS));
        }
        if (Math.random() > 0.7) {
          setAlerts(prev => [generateMockAlert(), ...prev].slice(0, MAX_ALERTS));
        }
      }, MOCK_INTERVAL);
    };

    // ── WebSocket ───────────────────────────────────────────────
    const connect = () => {
      if (!mounted) return;
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          if (!mounted) { ws?.close(); return; }
          setIsConnected(true);
          stopMock(); // real data replaces mock
        };

        ws.onmessage = (event) => {
          if (!mounted) return;
          try {
            const msg = JSON.parse(event.data as string);

            if (msg.type === 'init') {
              const snap = msg.payload;
              if (Array.isArray(snap?.sectors) && snap.sectors.length) {
                setSectorData(
                  snap.sectors.map((s: Record<string, unknown>) => ({
                    sectorId:  s.sectorId  as string,
                    cps:       (s.cps      as number) ?? 0,
                    density:   (s.density  as number) ?? 0,
                    velocity:  (s.velocity as number) ?? 0,
                    audio:     (s.audioAnomaly as number) ?? (s.audio as number) ?? 0,
                    timestamp: Date.now(),
                  }))
                );
              }
              if (Array.isArray(snap?.agent_ledger) && snap.agent_ledger.length) {
                setAgentActions(
                  snap.agent_ledger
                    .slice(-MAX_ACTIONS)
                    .reverse()
                    .map((a: Record<string, unknown>) => ({
                      id:         uid(),
                      agent:      (a.agent     as string) ?? 'Unknown',
                      actionType: (a.action    as string) ?? (a.actionType as string) ?? 'ACTION',
                      sector:     (a.sector    as string) ?? '--',
                      message:    (a.message   as string) ?? '',
                      reasoning:  (a.reasoning as string) ?? '',
                      timestamp:  typeof a.timestamp === 'string'
                        ? new Date(a.timestamp as string).getTime()
                        : (a.timestamp as number) ?? Date.now(),
                    }))
                );
              }

            } else if (msg.type === 'sector_update') {
              const p = msg.payload ?? {};
              const patch: SectorData = {
                sectorId:  p.sectorId,
                cps:       p.cps       ?? 0,
                density:   p.density   ?? 0,
                velocity:  p.velocity  ?? 0,
                audio:     p.audioAnomaly ?? p.audio ?? 0,
                timestamp: Date.now(),
              };
              setSectorData(prev => {
                const idx = prev.findIndex(s => s.sectorId === patch.sectorId);
                if (idx === -1) return [...prev, patch];
                const next = [...prev];
                next[idx] = patch;
                return next;
              });

            } else if (msg.type === 'agent_action') {
              const p = msg.payload ?? {};
              setAgentActions(prev => [{
                id:         uid(),
                agent:      p.agent      ?? 'Unknown',
                actionType: p.action     ?? p.actionType ?? 'ACTION',
                sector:     p.sector     ?? '--',
                message:    p.message    ?? '',
                reasoning:  p.reasoning  ?? '',
                timestamp:  typeof p.timestamp === 'string'
                  ? new Date(p.timestamp as string).getTime()
                  : p.timestamp ?? Date.now(),
              } as AgentAction, ...prev].slice(0, MAX_ACTIONS));

            } else if (msg.type === 'alert') {
              const p = msg.payload ?? {};
              setAlerts(prev => [{
                id:        uid(),
                severity:  p.severity ?? 'LOW',
                message:   p.message  ?? '',
                timestamp: typeof p.timestamp === 'string'
                  ? new Date(p.timestamp as string).getTime()
                  : p.timestamp ?? Date.now(),
              } as AlertItem, ...prev].slice(0, MAX_ALERTS));
            }

          } catch { /* ignore malformed messages */ }
        };

        ws.onerror = () => { /* handled in onclose */ };

        ws.onclose = () => {
          if (!mounted) return;
          setIsConnected(false);
          ws = null;
          startMock();
          reconnTimer = setTimeout(() => { if (mounted) connect(); }, RECONNECT_DELAY);
        };

      } catch {
        // WebSocket unavailable (SSR guard)
        startMock();
      }
    };

    // ── Bootstrap: seed mock data once, then attempt WS ────────
    setSectorData(generateMockSectors());
    setAgentActions(generateInitialLedger(12));
    setAlerts(generateInitialAlerts(10));
    startMock();
    connect();

    return () => {
      mounted = false;
      ws?.close();
      if (reconnTimer) clearTimeout(reconnTimer);
      stopMock();
    };
  }, []); // ← empty array: run exactly once, never re-run

  return { sectorData, agentActions, alerts, isConnected };
}
