'use client';

import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { getCPSTheme, getCPSStatus, getAgentStyle, formatRelativeTime } from '@/lib/utils';
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

// Seating layout definitions
const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEAT_COLS = 12;

// Isometric 3D Projection Math for reverse click/hover tests
const getSeatCanvasCoords = (
  seatX: number,
  seatY: number,
  seatZ: number,
  cam: { x: number; y: number; zoom: number; pitch: number; yaw: number },
  w: number,
  h: number
) => {
  // Rotate around Z axis (Yaw)
  const cosY = Math.cos(cam.yaw);
  const sinY = Math.sin(cam.yaw);
  const rx = seatX * cosY - seatY * sinY;
  const ry = seatX * sinY + seatY * cosY;

  // Pitch rotation (tilt towards camera)
  const cosP = Math.cos(cam.pitch);
  const sinP = Math.sin(cam.pitch);
  const finalY = ry * cosP - seatZ * sinP;
  const finalZ = ry * sinP + seatZ * cosP;

  // Apply simple perspective compression
  const fov = 400;
  const scale = fov / (fov + finalZ);
  
  const px = rx * scale;
  const py = finalY * scale;

  return {
    x: w / 2 + cam.zoom * (cam.x + px),
    y: h / 2 + cam.zoom * (cam.y + py),
  };
};

function DigitalTwinContent() {
  const { sectorData, agentActions, isConnected } = useWebSocket();
  const searchParams = useSearchParams();

  // Selected state
  const [selectedSector, setSelectedSector] = useState<string>('C3');
  const [selectedSeat, setSelectedSeat] = useState<{ row: string; col: number } | null>({ row: 'C', col: 6 });
  const [hoveredSeat, setHoveredSeat] = useState<{ row: string; col: number } | null>(null);
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
      cameraState.current.targetZoom = 1.25;
      cameraState.current.targetPitch = 0.65;
      cameraState.current.targetYaw = -0.45;
      setManualZoom(1.25);
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

      // ── Step 0.5: Glowing Radial Halo behind stadium base ──
      const baseCenter = project(0, 0, -10);
      const haloGrad = ctx.createRadialGradient(baseCenter.x, baseCenter.y, 0, baseCenter.x, baseCenter.y, 250);
      haloGrad.addColorStop(0, theme.color + '22');
      haloGrad.addColorStop(0.5, theme.color + '0a');
      haloGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(baseCenter.x, baseCenter.y, 250, 0, Math.PI * 2);
      ctx.fill();

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

      // ── Step 1.5: Neon wireframe perimeter border ──
      const corners = [
        { x: -bW / 2, y: -bH / 2 },
        { x: bW / 2, y: -bH / 2 },
        { x: bW / 2, y: bH / 2 },
        { x: -bW / 2, y: bH / 2 },
      ];
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.12)';
      ctx.lineWidth = 1;
      corners.forEach(c => {
        const pBot = project(c.x, c.y, -10);
        const pTop = project(c.x, c.y, 30);
        ctx.beginPath();
        ctx.moveTo(pBot.x, pBot.y);
        ctx.lineTo(pTop.x, pTop.y);
        ctx.stroke();
      });
      const pTopLoop = corners.map(c => project(c.x, c.y, 30));
      ctx.beginPath();
      ctx.moveTo(pTopLoop[0].x, pTopLoop[0].y);
      pTopLoop.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.18)';
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

      // ── Step 2.5: Draw Tiered Risers (Stepped Platforms) under rows ──
      for (let rIdx = 0; rIdx < ROWS.length; rIdx++) {
        const zMax = rIdx * 5 - 15;
        const zMin = -15; // pedestal base level
        const sy = (rIdx - ROWS.length / 2) * 26;
        const yMin = sy - 12;
        const yMax = sy + 12;

        // Left block platforms
        const xMinL = -186;
        const xMaxL = -26;
        
        const pTopLeftBackL = project(xMinL, yMin, zMax);
        const pTopRightBackL = project(xMaxL, yMin, zMax);
        const pTopRightFrontL = project(xMaxL, yMax, zMax);
        const pTopLeftFrontL = project(xMinL, yMax, zMax);
        const pBotRightFrontL = project(xMaxL, yMax, zMin);
        const pBotLeftFrontL = project(xMinL, yMax, zMin);

        // Fill Top Left
        ctx.beginPath();
        ctx.moveTo(pTopLeftBackL.x, pTopLeftBackL.y);
        ctx.lineTo(pTopRightBackL.x, pTopRightBackL.y);
        ctx.lineTo(pTopRightFrontL.x, pTopRightFrontL.y);
        ctx.lineTo(pTopLeftFrontL.x, pTopLeftFrontL.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(21, 32, 54, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.stroke();

        // Fill Front Left
        ctx.beginPath();
        ctx.moveTo(pTopLeftFrontL.x, pTopLeftFrontL.y);
        ctx.lineTo(pTopRightFrontL.x, pTopRightFrontL.y);
        ctx.lineTo(pBotRightFrontL.x, pBotRightFrontL.y);
        ctx.lineTo(pBotLeftFrontL.x, pBotLeftFrontL.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(10, 17, 31, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.stroke();

        // Glow line L
        ctx.beginPath();
        ctx.moveTo(pTopLeftFrontL.x, pTopLeftFrontL.y);
        ctx.lineTo(pTopRightFrontL.x, pTopRightFrontL.y);
        ctx.strokeStyle = theme.color + '44';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Right block platforms
        const xMinR = 26;
        const xMaxR = 186;

        const pTopLeftBackR = project(xMinR, yMin, zMax);
        const pTopRightBackR = project(xMaxR, yMin, zMax);
        const pTopRightFrontR = project(xMaxR, yMax, zMax);
        const pTopLeftFrontR = project(xMinR, yMax, zMax);
        const pBotRightFrontR = project(xMaxR, yMax, zMin);
        const pBotLeftFrontR = project(xMinR, yMax, zMin);

        // Fill Top Right
        ctx.beginPath();
        ctx.moveTo(pTopLeftBackR.x, pTopLeftBackR.y);
        ctx.lineTo(pTopRightBackR.x, pTopRightBackR.y);
        ctx.lineTo(pTopRightFrontR.x, pTopRightFrontR.y);
        ctx.lineTo(pTopLeftFrontR.x, pTopLeftFrontR.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(21, 32, 54, 0.85)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.stroke();

        // Fill Front Right
        ctx.beginPath();
        ctx.moveTo(pTopLeftFrontR.x, pTopLeftFrontR.y);
        ctx.lineTo(pTopRightFrontR.x, pTopRightFrontR.y);
        ctx.lineTo(pBotRightFrontR.x, pBotRightFrontR.y);
        ctx.lineTo(pBotLeftFrontR.x, pBotLeftFrontR.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(10, 17, 31, 0.9)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
        ctx.stroke();

        // Glow line R
        ctx.beginPath();
        ctx.moveTo(pTopLeftFrontR.x, pTopLeftFrontR.y);
        ctx.lineTo(pTopRightFrontR.x, pTopRightFrontR.y);
        ctx.strokeStyle = theme.color + '44';
        ctx.lineWidth = 1.5;
        ctx.stroke();
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
        const isHovered = hoveredSeat?.row === seat.row && hoveredSeat?.col === seat.col;

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
        } else if (isHovered) {
          seatFill = 'rgba(0, 212, 255, 0.45)';
          seatBorder = '#00d4ff';
          lineWidth = 1.8;
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

        // Draw shadow under seat cushion (parallax shadow)
        const pShTL = project(seat.x - sW / 2 - 1, seat.y - sH / 2 + 1, sZ - 3);
        const pShTR = project(seat.x + sW / 2 + 1, seat.y - sH / 2 + 1, sZ - 3);
        const pShBR = project(seat.x + sW / 2 + 1, seat.y + sH / 2 + 2, sZ - 3);
        const pShBL = project(seat.x - sW / 2 - 1, seat.y + sH / 2 + 2, sZ - 3);

        ctx.beginPath();
        ctx.moveTo(pShTL.x, pShTL.y);
        ctx.lineTo(pShTR.x, pShTR.y);
        ctx.lineTo(pShBR.x, pShBR.y);
        ctx.lineTo(pShBL.x, pShBL.y);
        ctx.closePath();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.42)';
        ctx.fill();

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

        // If hovered, draw subtle hover halo ring
        if (isHovered && !isTarget) {
          const hoverZ = sZ + 4 + Math.sin(time * 8) * 1.5;
          const pRing = project(seat.x, seat.y, hoverZ);
          ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(pRing.x, pRing.y, 6, 0, Math.PI * 2);
          ctx.stroke();
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

      // ── Step 5: Floating holographic data labels above selected seat ──
      if (selectedSeat) {
        const seatObj = seatItems.find(s => s.row === selectedSeat.row && s.col === selectedSeat.col);
        if (seatObj) {
          const sZ = seatObj.rIdx * 5 - 15;
          const pHolo = project(seatObj.x, seatObj.y, sZ + 32);

          // Holo box container
          ctx.fillStyle = 'rgba(10, 15, 30, 0.88)';
          ctx.strokeStyle = '#00ff88';
          ctx.lineWidth = 1.5;
          
          const boxW = 105;
          const boxH = 46;
          const bx = pHolo.x - boxW / 2;
          const by = pHolo.y - boxH - 10;

          // Draw pointer line to seat
          const pAnchor = project(seatObj.x, seatObj.y, sZ + 18 + Math.sin(time * 6) * 3);
          ctx.beginPath();
          ctx.moveTo(pHolo.x, pHolo.y);
          ctx.lineTo(pAnchor.x, pAnchor.y);
          ctx.strokeStyle = 'rgba(0, 255, 136, 0.55)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Draw label background with glow
          ctx.shadowColor = 'rgba(0, 255, 136, 0.3)';
          ctx.shadowBlur = 8;
          ctx.fillRect(bx, by, boxW, boxH);
          ctx.strokeRect(bx, by, boxW, boxH);
          ctx.shadowBlur = 0; // reset

          // Text content inside holo label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px monospace';
          ctx.fillText(`SEAT ${selectedSeat.row}-${selectedSeat.col}`, bx + 8, by + 14);

          const seatCpsOffset = Math.sin(seatObj.rIdx * 0.8 + seatObj.cIdx * 0.4) * 0.15;
          const seatCpsVal = Math.max(0.05, Math.min(0.98, activeSectorInfo.cps + seatCpsOffset));
          
          ctx.fillStyle = '#8e9eab';
          ctx.font = '7px sans-serif';
          ctx.fillText(`CPS: `, bx + 8, by + 26);
          
          ctx.fillStyle = getCPSTheme(seatCpsVal).color;
          ctx.font = 'bold 8px monospace';
          ctx.fillText(`${seatCpsVal.toFixed(2)}`, bx + 28, by + 26);

          ctx.fillStyle = seatCpsVal > 0.75 ? '#ff4444' : '#00ff88';
          ctx.font = 'bold 7px sans-serif';
          ctx.fillText(seatCpsVal > 0.75 ? 'ALERT: CRITICAL' : 'STATUS: SAFE', bx + 8, by + 37);
        }
      }

      // ── Step 6: Animated scanning grid lines (cyberpunk HUD) ──
      const scanY = Math.sin(time * 1.5) * (bH / 2);
      const scanPts = [
        project(-bW / 2, scanY, 10),
        project(bW / 2, scanY, 10),
      ];
      ctx.beginPath();
      ctx.moveTo(scanPts[0].x, scanPts[0].y);
      ctx.lineTo(scanPts[1].x, scanPts[1].y);
      ctx.strokeStyle = 'rgba(0, 212, 255, 0.28)';
      ctx.shadowColor = '#00d4ff';
      ctx.shadowBlur = 6;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // ── Step 7: Pulsing radar-sweep arc from center ──
      const sweepAngle = (time * 1.0) % (Math.PI * 2);
      const sweepCenter = project(0, 0, 0);
      ctx.save();
      ctx.translate(sweepCenter.x, sweepCenter.y);
      const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 160);
      sweepGrad.addColorStop(0, theme.color + '12');
      sweepGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = sweepGrad;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, 160, sweepAngle - 0.35, sweepAngle);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.restore();

      // HUD overlay legends
      ctx.fillStyle = 'rgba(10, 15, 30, 0.75)';
      ctx.fillRect(16, height - 60, 230, 44);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeRect(16, height - 60, 230, 44);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`3D SECTOR RENDER ENGINE v1.5`, 24, height - 46);
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
  }, [selectedSector, selectedSeat, hoveredSeat, showReroute, showHeatmap, activeSectorInfo.cps]);

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

  // Handle seat clicks and mousemove tests on canvas
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cam = cameraState.current;

    // Find the closest seat
    let closestSeat: { row: string; col: number; sx: number; sy: number; sz: number } | null = null;
    let minDistance = Infinity;

    const seatsList: Array<{ row: string; col: number; sx: number; sy: number; sz: number }> = [];
    ROWS.forEach((row, rIdx) => {
      for (let col = 1; col <= SEAT_COLS; col++) {
        const cIdx = col - 1;
        const aisleOffset = col <= 6 ? -20 : 20;
        const sx = (cIdx - SEAT_COLS / 2) * 26 + aisleOffset;
        const sy = (rIdx - ROWS.length / 2) * 26;
        const sz = rIdx * 5 - 15;
        seatsList.push({ row, col, sx, sy, sz });
      }
    });

    for (const seat of seatsList) {
      const coords = getSeatCanvasCoords(seat.sx, seat.sy, seat.sz, cam, width, height);
      const dx = mouseX - coords.x;
      const dy = mouseY - coords.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestSeat = seat;
      }
    }

    if (closestSeat && minDistance < 18) {
      swoopToSeat(closestSeat.row, closestSeat.col);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const cam = cameraState.current;

    let closestSeat: { row: string; col: number; sx: number; sy: number; sz: number } | null = null;
    let minDistance = Infinity;

    const seatsList: Array<{ row: string; col: number; sx: number; sy: number; sz: number }> = [];
    ROWS.forEach((row, rIdx) => {
      for (let col = 1; col <= SEAT_COLS; col++) {
        const cIdx = col - 1;
        const aisleOffset = col <= 6 ? -20 : 20;
        const sx = (cIdx - SEAT_COLS / 2) * 26 + aisleOffset;
        const sy = (rIdx - ROWS.length / 2) * 26;
        const sz = rIdx * 5 - 15;
        seatsList.push({ row, col, sx, sy, sz });
      }
    });

    for (const seat of seatsList) {
      const coords = getSeatCanvasCoords(seat.sx, seat.sy, seat.sz, cam, width, height);
      const dx = mouseX - coords.x;
      const dy = mouseY - coords.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
        closestSeat = seat;
      }
    }

    if (closestSeat && minDistance < 18) {
      setHoveredSeat({ row: closestSeat.row, col: closestSeat.col });
    } else {
      setHoveredSeat(null);
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredSeat(null);
  };

  // Helper colors for Telemetry cards
  const getKpiColor = (type: 'density' | 'velocity' | 'audio' | 'cps', val: number) => {
    if (type === 'density' || type === 'cps') {
      if (val < 0.4) return '#00ff88';
      if (val < 0.75) return '#ffaa00';
      return '#ff3366';
    }
    if (type === 'velocity') {
      if (val > 0.6) return '#00ff88';
      if (val > 0.3) return '#ffaa00';
      return '#ff3366';
    }
    // audio
    if (val < 0.5) return '#00ff88';
    if (val < 0.8) return '#ffaa00';
    return '#ff3366';
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
          {/* Premium Header Bar */}
          <div className="dt-header-bar">
            <div className="dt-header-title">
              <div className="dt-icon">🛰️</div>
              <span>Digital Twin Center</span>
            </div>
            <div className="dt-header-sub">
              <span className="dt-live-dot" />
              <span>3D Sector Control & Telemetry</span>
            </div>
          </div>

          {/* Sector Selector Section */}
          <div className="dt-section-divider">
            <div className="dt-section-title">
              <span>Select Stadium Sector</span>
            </div>
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

          {/* Live Sector Telemetry Panel */}
          <div className="dt-section-divider">
            <div className="dt-section-title">
              <span>Sector Live Telemetry</span>
            </div>
            <div className="dt-telemetry-grid">
              {/* Density KPI */}
              <div className="dt-kpi-mini" style={{ '--kpi-color': getKpiColor('density', activeSectorInfo.density) } as React.CSSProperties}>
                <div className="dt-kpi-label">Density</div>
                <div className="dt-kpi-value">{(activeSectorInfo.density * 100).toFixed(0)}%</div>
                <div className="dt-kpi-bar-track">
                  <div className="dt-kpi-bar-fill" style={{ width: `${activeSectorInfo.density * 100}%`, background: getKpiColor('density', activeSectorInfo.density) }} />
                </div>
              </div>
              
              {/* Velocity KPI */}
              <div className="dt-kpi-mini" style={{ '--kpi-color': getKpiColor('velocity', activeSectorInfo.velocity) } as React.CSSProperties}>
                <div className="dt-kpi-label">Velocity</div>
                <div className="dt-kpi-value">{(activeSectorInfo.velocity * 2.2).toFixed(1)} m/s</div>
                <div className="dt-kpi-bar-track">
                  <div className="dt-kpi-bar-fill" style={{ width: `${activeSectorInfo.velocity * 100}%`, background: getKpiColor('velocity', activeSectorInfo.velocity) }} />
                </div>
              </div>

              {/* Audio level KPI */}
              <div className="dt-kpi-mini" style={{ '--kpi-color': getKpiColor('audio', activeSectorInfo.audio) } as React.CSSProperties}>
                <div className="dt-kpi-label">Audio Level</div>
                <div className="dt-kpi-value">{(50 + activeSectorInfo.audio * 60).toFixed(0)} dB</div>
                <div className="dt-kpi-bar-track">
                  <div className="dt-kpi-bar-fill" style={{ width: `${activeSectorInfo.audio * 100}%`, background: getKpiColor('audio', activeSectorInfo.audio) }} />
                </div>
              </div>

              {/* CPS KPI */}
              <div className="dt-kpi-mini" style={{ '--kpi-color': getKpiColor('cps', activeSectorInfo.cps) } as React.CSSProperties}>
                <div className="dt-kpi-label">CPS Score</div>
                <div className="dt-kpi-value">{activeSectorInfo.cps.toFixed(2)}</div>
                <div className="dt-kpi-bar-track">
                  <div className="dt-kpi-bar-fill" style={{ width: `${activeSectorInfo.cps * 100}%`, background: getKpiColor('cps', activeSectorInfo.cps) }} />
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Seat Grid Picker */}
          <div className="dt-section-divider">
            <div className="dt-section-title">
              <span>Interactive Seat Picker</span>
            </div>
            <div className="dt-seat-grid">
              <div className="dt-seat-grid-row-label"></div>
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="dt-seat-col-label">{i + 1}</div>
              ))}
              {ROWS.map(row => (
                <React.Fragment key={row}>
                  <div className="dt-seat-grid-row-label">{row}</div>
                  {Array.from({ length: 12 }).map((_, i) => {
                    const col = i + 1;
                    const isActive = selectedSeat?.row === row && selectedSeat?.col === col;
                    
                    // Heatmap coloring based on mock index values
                    const rIdx = ROWS.indexOf(row);
                    const seatCpsOffset = Math.sin(rIdx * 0.8 + i * 0.4) * 0.15;
                    const seatCpsVal = Math.max(0.05, Math.min(0.98, activeSectorInfo.cps + seatCpsOffset));
                    const sTheme = getCPSTheme(seatCpsVal);
                    
                    return (
                      <button
                        key={col}
                        className={`dt-seat-dot ${isActive ? 'active' : ''}`}
                        style={{ background: sTheme.color + '33', borderColor: sTheme.color + '88' }}
                        onClick={() => swoopToSeat(row, col)}
                        title={`Seat ${row}-${col} (CPS: ${seatCpsVal.toFixed(2)})`}
                      />
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Manual 3D Camera Controls Sliders */}
          <div className="dt-section-divider">
            <div className="dt-section-title">
              <span>🔭 Manual 3D Orbit Controls</span>
            </div>
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
          <div className="dt-section-divider">
            <div className="dt-section-title">
              <span>Telemetry Layer Overlays</span>
            </div>
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
            
            <div className="glass-toggle-row" style={{ marginTop: 10 }}>
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
          <div className="dt-section-divider" style={{ flex: 1 }}>
            <div className="dt-section-title">
              <span>📍 Ticket pathway Waypoints</span>
            </div>

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

        {/* Right Viewport (Renders 3D Canvas + HUD Overlays) */}
        <div className="dt-canvas-wrap">
          {/* Premium HUD bar */}
          <div className="dt-viewport-hud">
            <div className="dt-hud-left">
              <div className="dt-hud-sector-badge">
                <span 
                  className="badge-dot" 
                  style={{ 
                    background: theme.color, 
                    boxShadow: `0 0 8px ${theme.color}`,
                    animation: 'pulse-glow 1.5s infinite'
                  }} 
                />
                SECTOR {selectedSector}
              </div>
              <div className="dt-hud-sector-badge">
                <span 
                  className="badge-dot" 
                  style={{ 
                    background: isConnected ? 'var(--success)' : '#e2e8f0',
                    boxShadow: isConnected ? '0 0 8px var(--success)' : 'none'
                  }} 
                />
                {isConnected ? 'LIVE FEED' : 'MOCK MODEL'}
              </div>
            </div>

            <button
              onClick={resetCamera}
              className="dt-reset-btn"
              style={{
                background: 'rgba(15,23,42,0.85)', border: '1px solid var(--border)',
                color: 'white', padding: '6px 14px', borderRadius: 8, fontSize: 11,
                fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 0 10px rgba(0, 212, 255, 0.1)'
              }}
            >
              🔭 Reset View
            </button>
          </div>

          {/* Vignette Overlay */}
          <div className="dt-vignette" />
          
          {/* Cyberpunk Scan lines */}
          <div className="dt-scan-lines" />

          {/* HUD Targeting Reticle */}
          <div className="dt-crosshair">
            <div className="dt-crosshair-ring" />
          </div>

          {/* Stadium Minimap Location Indicator */}
          <div className="dt-minimap">
            <div className="dt-minimap-label">Stad-Map</div>
            <div className="dt-minimap-grid">
              {['A1','A2','A3','A4','B1','B2','B3','B4','C1','C2','C3','C4','D1','D2','D3','D4'].map(s => (
                <div
                  key={s}
                  className={`dt-minimap-cell ${s === selectedSector ? 'mm-active' : ''}`}
                  style={{
                    background: s === selectedSector ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                  }}
                  title={`Sector ${s}`}
                />
              ))}
            </div>
          </div>

          {/* The 3D Canvas */}
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
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
