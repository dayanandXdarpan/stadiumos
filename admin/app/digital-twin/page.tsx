'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getCPSTheme, getCPSStatus, getAgentStyle, formatRelativeTime } from '@/lib/utils';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Seating layout definitions
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEAT_COLS = 12;

function DigitalTwinContent() {
  const { sectorData, agentActions, isConnected } = useWebSocket();
  const searchParams = useSearchParams();

  // Selected state
  const [selectedSector, setSelectedSector] = useState<string>('C3');
  const [selectedSeat, setSelectedSeat] = useState<{ row: string; col: number } | null>({ row: 'C', col: 6 });
  const [showReroute, setShowReroute] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);

  // ── Orbit Camera Settings ──
  const [manualZoom, setManualZoom] = useState<number>(1.2);
  const [manualPitch, setManualPitch] = useState<number>(0.65);
  const [manualYaw, setManualYaw] = useState<number>(-0.45);

  // Canvas reference & camera coordinates
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Camera state for swoop transitions
  const cameraState = useRef({
    x: 0,
    y: -100,
    zoom: 1.2,
    pitch: 0.65, // isometric angle approx 0.6-0.7 rad
    yaw: -0.45,   // yaw angle

    // Target state for swooping
    targetX: 0,
    targetY: -100,
    targetZoom: 1.2,
    targetPitch: 0.65,
    targetYaw: -0.45,
  });

  const activeSectorInfo = sectorData.find(s => s.sectorId === selectedSector) || {
    sectorId: selectedSector,
    cps: 0.25,
    density: 0.3,
    velocity: 0.6,
    audio: 0.2,
  };

  const theme = getCPSTheme(activeSectorInfo.cps);

  // Parse initial query params to load default sector
  useEffect(() => {
    const sParam = searchParams.get('sector');
    if (sParam && ['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4'].includes(sParam)) {
      setSelectedSector(sParam);
      // Auto swoop to center of selected sector
      cameraState.current.targetX = 0;
      cameraState.current.targetY = -80;
      cameraState.current.targetZoom = 1.2;
      cameraState.current.targetPitch = 0.65;
      cameraState.current.targetYaw = -0.45;
      setManualZoom(1.2);
      setManualPitch(0.65);
      setManualYaw(-0.45);
      setSelectedSeat(null);
    }
  }, [searchParams]);

  // Trigger camera swoop to seat/view
  const swoopToSeat = (row: string, col: number) => {
    setSelectedSeat({ row, col });

    // Map row/col to canvas-space targets for a cool offset focus
    const rowIndex = ROWS.indexOf(row);
    const colIndex = col - 1;

    // Calculate normalized 3D grid centers
    const gridX = (colIndex - SEAT_COLS / 2) * 28;
    const gridY = (rowIndex - ROWS.length / 2) * 28;

    cameraState.current.targetX = -gridX * 0.75;
    cameraState.current.targetY = -gridY * 0.75 - 80;
    cameraState.current.targetZoom = 2.2;
    cameraState.current.targetPitch = 0.85; // steeper angle on swoop
    cameraState.current.targetYaw = -0.3;   // slightly tilted

    setManualZoom(2.2);
    setManualPitch(0.85);
    setManualYaw(-0.3);
  };

  const resetCamera = () => {
    cameraState.current.targetX = 0;
    cameraState.current.targetY = -80;
    cameraState.current.targetZoom = 1.25;
    cameraState.current.targetPitch = 0.65;
    cameraState.current.targetYaw = -0.45;

    setManualZoom(1.25);
    setManualPitch(0.65);
    setManualYaw(-0.45);
    setSelectedSeat(null);
  };

  // Pre-swoop to initial seat
  useEffect(() => {
    if (selectedSeat) {
      swoopToSeat(selectedSeat.row, selectedSeat.col);
    }
  }, []);

  // 3D Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Track active animations
    let time = 0;

    const render = () => {
      time += 0.02;

      // Interpolate camera coordinates smoothly (swooping ease-out)
      const cam = cameraState.current;
      cam.x += (cam.targetX - cam.x) * 0.08;
      cam.y += (cam.targetY - cam.y) * 0.08;
      cam.zoom += (cam.targetZoom - cam.zoom) * 0.08;
      cam.pitch += (cam.targetPitch - cam.pitch) * 0.08;
      cam.yaw += (cam.targetYaw - cam.yaw) * 0.08;

      // Clear with elegant dark space gradient
      const bgGrad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width * 0.7);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(1, '#05070c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Draw cyber grid gridlines in background
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.2)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < width; x += step) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += step) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      ctx.save();
      // Center and apply general camera zoom
      ctx.translate(width / 2, height / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(cam.x, cam.y);

      // ── Perspective / Isometric 3D Projection Math ──
      const project = (x: number, y: number, z: number) => {
        // Rotate around Z axis (Yaw)
        const cosY = Math.cos(cam.yaw);
        const sinY = Math.sin(cam.yaw);
        const rx = x * cosY - y * sinY;
        const ry = x * sinY + y * cosY;

        // Pitch rotation (tilt towards camera)
        const cosP = Math.cos(cam.pitch);
        const sinP = Math.sin(cam.pitch);
        const finalY = ry * cosP - z * sinP;
        const finalZ = ry * sinP + z * cosP;

        // Apply simple perspective compression based on finalZ
        const fov = 400;
        const scale = fov / (fov + finalZ);
        return {
          x: rx * scale,
          y: finalY * scale,
          depth: finalZ,
        };
      };

      // ── Step 1: Draw Stadium Concrete Stand Pedestal Base ──
      const bW = SEAT_COLS * 28 + 40;
      const bH = ROWS.length * 28 + 40;
      const pts = [
        project(-bW / 2, -bH / 2, -10),
        project(bW / 2, -bH / 2, -10),
        project(bW / 2, bH / 2, -10),
        project(-bW / 2, bH / 2, -10),
      ];

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // Pedestal glowing neon rim
      ctx.strokeStyle = theme.color + '33';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // ── Step 2: Draw Pedestrian Aisles (Real-time CPS Glow) ──
      const aisleX = 0;
      const aisleW = 32;
      const aislePts = [
        project(aisleX - aisleW / 2, -bH / 2 + 10, -8),
        project(aisleX + aisleW / 2, -bH / 2 + 10, -8),
        project(aisleX + aisleW / 2, bH / 2 - 10, -8),
        project(aisleX - aisleW / 2, bH / 2 - 10, -8),
      ];

      ctx.beginPath();
      ctx.moveTo(aislePts[0].x, aislePts[0].y);
      aislePts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();

      // Dynamic glowing paint based on live CPS
      ctx.fillStyle = theme.background;
      ctx.fill();
      ctx.strokeStyle = theme.color + '77';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Add floating particles/arrows in aisle (indicates flow)
      const numFlowDots = 8;
      ctx.fillStyle = theme.color;
      for (let i = 0; i < numFlowDots; i++) {
        const progress = ((time * 25 + i * (bH / numFlowDots)) % bH) - bH / 2;
        const dotP = project(0, progress, -7);
        const radius = activeSectorInfo.cps > 0.75 ? 2.5 : 1.5;

        ctx.beginPath();
        ctx.arc(dotP.x, dotP.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Step 3: Draw Seats (sorted back-to-front for correct overlap) ──
      const seatItems: Array<{
        row: string;
        col: number;
        rIdx: number;
        cIdx: number;
        x: number;
        y: number;
        proj: { x: number; y: number; depth: number };
      }> = [];

      ROWS.forEach((row, rIdx) => {
        for (let col = 1; col <= SEAT_COLS; col++) {
          const cIdx = col - 1;
          const aisleOffset = col <= 6 ? -20 : 20;
          const sx = (cIdx - SEAT_COLS / 2) * 26 + aisleOffset;
          const sy = (rIdx - ROWS.length / 2) * 26;
          const sz = rIdx * 5 - 15;

          seatItems.push({
            row,
            col,
            rIdx,
            cIdx,
            x: sx,
            y: sy,
            proj: project(sx, sy, sz),
          });
        }
      });

      // Sort back-to-front (highest depth drawn first)
      seatItems.sort((a, b) => b.proj.depth - a.proj.depth);

      // Render each seat
      seatItems.forEach(seat => {
        const isTarget = selectedSeat?.row === seat.row && selectedSeat?.col === seat.col;

        // Seat visual parameters
        const sW = 12;
        const sH = 10;
        const sZ = seat.rIdx * 5 - 15;

        // 3D seat box corners
        const pTL = project(seat.x - sW / 2, seat.y - sH / 2, sZ);
        const pTR = project(seat.x + sW / 2, seat.y - sH / 2, sZ);
        const pBR = project(seat.x + sW / 2, seat.y + sH / 2, sZ);
        const pBL = project(seat.x - sW / 2, seat.y + sH / 2, sZ);
        const pBack = project(seat.x, seat.y - sH / 2, sZ + 10); // seat backrest

        // Theme colors
        let seatFill = 'rgba(51, 65, 85, 0.45)';
        let seatBorder = 'rgba(100, 116, 139, 0.6)';
        let lineWidth = 1;

        if (isTarget) {
          seatFill = '#00d4ff';
          seatBorder = '#ffffff';
          lineWidth = 2.5;
        } else if (showHeatmap) {
          // Heatmap: fluctuate colors spatially around sectors average CPS
          const seatCpsOffset = Math.sin(seat.rIdx * 0.8 + seat.cIdx * 0.4) * 0.15;
          const seatCpsVal = Math.max(0.05, Math.min(0.98, activeSectorInfo.cps + seatCpsOffset));
          const seatTheme = getCPSTheme(seatCpsVal);
          seatFill = seatTheme.color + '66';
          seatBorder = seatTheme.color + 'bb';
        } else if (seat.col === 6 || seat.col === 7) {
          seatFill = activeSectorInfo.cps > 0.75 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(51, 65, 85, 0.45)';
        }

        // Draw seat bottom cushion
        ctx.beginPath();
        ctx.moveTo(pTL.x, pTL.y);
        ctx.lineTo(pTR.x, pTR.y);
        ctx.lineTo(pBR.x, pBR.y);
        ctx.lineTo(pBL.x, pBL.y);
        ctx.closePath();
        ctx.fillStyle = seatFill;
        ctx.fill();
        ctx.strokeStyle = seatBorder;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Draw backrest line
        ctx.beginPath();
        ctx.moveTo(pTL.x, pTL.y);
        ctx.lineTo(pBack.x, pBack.y);
        ctx.lineTo(pTR.x, pTR.y);
        ctx.strokeStyle = seatBorder;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // If targeted, draw beautiful hovering neon indicator ring
        if (isTarget) {
          const hoverZ = sZ + 18 + Math.sin(time * 6) * 3;
          const pRing = project(seat.x, seat.y, hoverZ);

          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pRing.x, pRing.y, 8, 0, Math.PI * 2);
          ctx.stroke();

          // Dotted line anchoring from float ring to seat
          const pAnchor = project(seat.x, seat.y, sZ);
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.45)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(pRing.x, pRing.y);
          ctx.lineTo(pAnchor.x, pAnchor.y);
          ctx.stroke();
          ctx.setLineDash([]); // reset
        }
      });

      // ── Step 4: FlowMaster Neon Reroute Overlay ──
      if (showReroute && activeSectorInfo.cps >= 0.6) {
        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();

        const startY = bH / 2 - 20;
        const endY = -bH / 2 + 20;

        let pathPts = [];
        for (let y = startY; y >= endY; y -= 15) {
          const lateralDeviation = y < 0 ? Math.sin((y / endY) * Math.PI) * 45 : 0;
          pathPts.push(project(lateralDeviation, y, -2));
        }

        if (pathPts.length) {
          ctx.moveTo(pathPts[0].x, pathPts[0].y);
          for (let i = 1; i < pathPts.length; i++) {
            ctx.lineTo(pathPts[i].x, pathPts[i].y);
          }
          ctx.stroke();
        }

        ctx.shadowBlur = 0;

        // Pulse routing arrows
        const arrowIdx = Math.floor((time * 20) % pathPts.length);
        if (pathPts[arrowIdx]) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(pathPts[arrowIdx].x, pathPts[arrowIdx].y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();

      // HUD overlay legends
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(16, height - 60, 230, 44);
      ctx.strokeStyle = 'rgba(255,255,255,0.1)';
      ctx.strokeRect(16, height - 60, 230, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`3D SECTOR RENDER ENGINE v1.4`, 24, height - 46);
      ctx.fillStyle = '#64748b';
      ctx.font = '9px sans-serif';
      ctx.fillText(`Orbit Mode | Cam Zoom: ${cam.zoom.toFixed(2)} | CPS: ${activeSectorInfo.cps.toFixed(2)}`, 24, height - 32);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    const handleResize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [selectedSector, selectedSeat, showReroute, showHeatmap, activeSectorInfo.cps]);

  // Handle Sector Click in HUD grid
  const handleSectorChange = (sId: string) => {
    setSelectedSector(sId);
    cameraState.current.targetX = 0;
    cameraState.current.targetY = -80;
    cameraState.current.targetZoom = 1.25;
    cameraState.current.targetPitch = 0.65;
    cameraState.current.targetYaw = -0.45;
    setManualZoom(1.25);
    setManualPitch(0.65);
    setManualYaw(-0.45);
    setSelectedSeat(null);
  };

  // Synchronize manual sliders to current camera coordinates
  const handleZoomSlider = (val: number) => {
    setManualZoom(val);
    cameraState.current.targetZoom = val;
  };

  const handlePitchSlider = (val: number) => {
    setManualPitch(val);
    cameraState.current.targetPitch = val;
  };

  const handleYawSlider = (val: number) => {
    setManualYaw(val);
    cameraState.current.targetYaw = val;
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-content flex-row" style={{ padding: 0 }}>
        {/* Left: Viewport Controls Panel */}
        <div style={{
          width: 330, borderRight: '1px solid var(--border)',
          background: 'rgba(10, 15, 30, 0.75)', display: 'flex',
          flexDirection: 'column', height: '100vh', overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
            <h1 className="page-title" style={{ fontSize: 20 }}>3D Seat Twin</h1>
            <p className="page-subtitle" style={{ marginTop: 2 }}>
              Dynamic venue seat mapping & real-time congestion tracing
            </p>
          </div>

          {/* Sector Selector */}
          <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
            <label className="control-label">
              Select Stadium Sector
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4'].map(s => {
                const sData = sectorData.find(sec => sec.sectorId === s) || { cps: 0.2 };
                const sTheme = getCPSTheme(sData.cps);
                const isActive = s === selectedSector;
                return (
                  <button
                    key={s}
                    onClick={() => handleSectorChange(s)}
                    style={{
                      padding: '8px 0', borderRadius: 6, fontSize: 12, fontWeight: 800,
                      background: isActive ? 'var(--primary)' : 'rgba(30,41,59,0.3)',
                      color: isActive ? '#05070c' : sTheme.color,
                      border: `1px solid ${isActive ? 'var(--primary)' : sTheme.border + '55'}`,
                      cursor: 'pointer', transition: 'all 0.2s ease',
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual 3D Camera Controls Sliders */}
          <div className="control-section">
            <span className="control-label">
              🔭 Manual 3D Orbit Controls
            </span>
            <div className="orbit-slider-wrap">
              {/* Zoom Slider */}
              <div className="orbit-row">
                <span className="orbit-name">Zoom</span>
                <input
                  type="range"
                  aria-label="3D Camera Zoom"
                  min="0.5"
                  max="3.5"
                  step="0.05"
                  value={manualZoom}
                  onChange={(e) => handleZoomSlider(parseFloat(e.target.value))}
                  className="orbit-slider"
                />
                <span className="orbit-slider-val">{manualZoom.toFixed(1)}x</span>
              </div>

              {/* Pitch Slider */}
              <div className="orbit-row">
                <span className="orbit-name">Pitch</span>
                <input
                  type="range"
                  aria-label="3D Camera Pitch"
                  min="0.1"
                  max="1.5"
                  step="0.02"
                  value={manualPitch}
                  onChange={(e) => handlePitchSlider(parseFloat(e.target.value))}
                  className="orbit-slider"
                />
                <span className="orbit-slider-val">{Math.round((manualPitch * 180) / Math.PI)}°</span>
              </div>

              {/* Yaw Slider */}
              <div className="orbit-row">
                <span className="orbit-name">Yaw</span>
                <input
                  type="range"
                  aria-label="3D Camera Yaw"
                  min="-3.14"
                  max="3.14"
                  step="0.02"
                  value={manualYaw}
                  onChange={(e) => handleYawSlider(parseFloat(e.target.value))}
                  className="orbit-slider"
                />
                <span className="orbit-slider-val">{Math.round((manualYaw * 180) / Math.PI)}°</span>
              </div>
            </div>
          </div>

          {/* Visual Overlays & Toggles */}
          <div className="control-section">
            <span className="control-label">Visual Telemetry Overlays</span>
            <div className="glass-toggle-row">
              <span className="glass-toggle-label">🌐 3D Spatial Heatmap Sensor</span>
              <label className="toggle-switch" style={{ width: 44, height: 24 }}>
                <input
                  type="checkbox"
                  aria-label="Toggle 3D Spatial Heatmap Sensor"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                />
                <span className="toggle-track" style={{ borderRadius: 12 }} />
                <span className="toggle-thumb" style={{ width: 18, height: 18, left: showHeatmap ? 22 : 3 }} />
              </label>
            </div>
            
            <div className="glass-toggle-row">
              <span className="glass-toggle-label">🌊 Neon FlowMaster Vector Path</span>
              <label className="toggle-switch" style={{ width: 44, height: 24 }}>
                <input
                  type="checkbox"
                  aria-label="Toggle Neon FlowMaster Vector Path"
                  checked={showReroute}
                  onChange={(e) => setShowReroute(e.target.checked)}
                />
                <span className="toggle-track" style={{ borderRadius: 12 }} />
                <span className="toggle-thumb" style={{ width: 18, height: 18, left: showReroute ? 22 : 3 }} />
              </label>
            </div>
          </div>

          {/* Dynamic Ticket Pathway Waypoint Details */}
          <div style={{ padding: 20, flex: 1 }}>
            <span className="control-label">
              📍 Ticket pathway Waypoints
            </span>

            {selectedSeat ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px 16px', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>SECTOR</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: theme.color }}>{selectedSector}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>ROW</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#00d4ff' }}>{selectedSeat.row}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>SEAT</div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#00d4ff' }}>{selectedSeat.col}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                    Assigned Entrance: <strong style={{ color: '#fff' }}>Gate 4 (East Ingress)</strong>
                  </div>
                </div>

                {/* Path Waypoint Nodes Checklist */}
                <div className="waypoint-guide">
                  <div className="waypoint-node">
                    <div className="waypoint-bullet success">1</div>
                    <div className="waypoint-body">
                      <div className="waypoint-title">Ingress Portal Authorized</div>
                      <div className="waypoint-desc">Proceed via turnstile scans at Gate 4. Volumetric ingress nominal.</div>
                    </div>
                  </div>

                  <div className="waypoint-node">
                    <div className="waypoint-bullet success">2</div>
                    <div className="waypoint-body">
                      <div className="waypoint-title">Concourse Lobby East</div>
                      <div className="waypoint-desc">Pass food plaza, turn left towards Aisle 2 corridor block.</div>
                    </div>
                  </div>

                  <div className="waypoint-node">
                    <div className="waypoint-bullet warning">3</div>
                    <div className="waypoint-body">
                      <div className="waypoint-title">Sector Walkway Entrance</div>
                      <div className="waypoint-desc">
                        {activeSectorInfo.cps >= 0.6 
                          ? 'Surge detected in walkways. FlowMaster glowing redirect vectors are lit.' 
                          : 'Aisle path clear. Enter tier stands smoothly.'}
                      </div>
                    </div>
                  </div>

                  <div className="waypoint-node">
                    <div className="waypoint-bullet" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>4</div>
                    <div className="waypoint-body">
                      <div className="waypoint-title">Seat Target Pinpoint</div>
                      <div className="waypoint-desc">Row {selectedSeat.row}, Seat {selectedSeat.col}. Welcome to your premier seat!</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: 12, background: 'rgba(255,255,255,0.01)', borderRadius: 8, border: '1px dashed rgba(255,255,255,0.1)' }}>
                Click a seat on the 3D model or select popular seats below to display dynamic route pathway guidance.
              </div>
            )}
          </div>

          {/* Popular Seats quick swoops */}
          <div style={{ padding: '16px 20px', background: 'rgba(5, 8, 16, 0.5)', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: 8 }}>
              DEMO: SWOOP TO POPULAR SEATS
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { r: 'A', c: 1 }, { r: 'C', c: 6 }, { r: 'E', c: 12 }, { r: 'H', c: 4 }
              ].map(s => (
                <button
                  key={`${s.r}-${s.c}`}
                  onClick={() => swoopToSeat(s.r, s.c)}
                  style={{
                    padding: '4px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border)', fontSize: 10, color: '#fff', cursor: 'pointer'
                  }}
                >
                  Seat {s.r}-{s.c}
                </button>
              ))}
            </div>
          </div>
          
          {/* Footer */}
          <div style={{ padding: '0 20px 20px' }}>
            <Footer />
          </div>
        </div>

        {/* Right Viewport (Renders 3D Canvas) */}
        <div style={{ flex: 1, height: '100vh', position: 'relative' }}>
          {/* Connection status overlay */}
          <div style={{
            position: 'absolute', top: 20, right: 20, zIndex: 10,
            display: 'flex', gap: 10, alignItems: 'center'
          }}>
            <div className={`connection-pill ${isConnected ? 'connected' : 'disconnected'}`}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isConnected ? 'var(--success)' : 'var(--danger)',
                display: 'inline-block',
                animation: isConnected ? 'pulse-glow 2s infinite' : 'none',
              }} />
              {isConnected ? 'Live WebSocket Connected' : 'Mock Mode Active'}
            </div>

            <button
              onClick={resetCamera}
              style={{
                background: 'rgba(15,23,42,0.8)', border: '1px solid var(--border)',
                color: 'white', padding: '6px 12px', borderRadius: 8, fontSize: 11,
                fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                backdropFilter: 'blur(8px)',
              }}
            >
              🔭 Reset View
            </button>
          </div>

          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
          />

          {/* Interactive floating label overlay */}
          {selectedSeat && (
            <div style={{
              position: 'absolute', bottom: 30, right: 30, zIndex: 10,
              background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(10px)',
              border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px',
              maxWidth: 280, animation: 'fade-in 0.3s ease both',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Seat Located Successfully</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                AI is monitoring Sector <strong style={{ color: theme.color }}>{selectedSector}</strong> aisles. Currently, pedestrian capacity is operating at <strong style={{ color: 'white' }}>{(activeSectorInfo.density * 100).toFixed(0)}%</strong>. 
                {activeSectorInfo.cps > 0.75 ? " Extreme crowd pressure detected—lateral re-route vectors have illuminated the aisles." : " All exit pathways are clear."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function DigitalTwinPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh', background: '#070b14', color: '#e2e8f0',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'system-ui, sans-serif'
      }}>
        <div className="spinner" style={{ width: 36, height: 36, borderTopColor: 'var(--primary)', borderWidth: 3 }} />
        <div style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: 'var(--text-muted)' }}>
          🛰️ Initializing 3D Seat Twin Viewport...
        </div>
      </div>
    }>
      <DigitalTwinContent />
    </Suspense>
  );
}
