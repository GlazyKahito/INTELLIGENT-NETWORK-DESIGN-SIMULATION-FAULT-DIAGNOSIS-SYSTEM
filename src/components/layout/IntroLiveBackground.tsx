import React, { useEffect, useRef, useState } from 'react';
import { playSound } from '../../lib/sound';

interface NetworkNode {
  id: string;
  name: string;
  ip: string;
  type: 'router' | 'switch' | 'server' | 'firewall' | 'client';
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  driftRadius: number;
  angle: number;
  speed: number;
  color: string;
  glowColor: string;
  lastPulseTime: number;
}

interface NetworkConnection {
  from: string;
  to: string;
  bandwidth: string;
}

interface Packet {
  id: number;
  fromId: string;
  toId: string;
  progress: number; // 0 to 1
  speed: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ARP';
  color: string;
  size: number;
}

interface ClickPingWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export const IntroLiveBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; active: boolean; hoveredNodeId: string | null }>({
    x: -1000,
    y: -1000,
    active: false,
    hoveredNodeId: null,
  });

  const pingWavesRef = useRef<ClickPingWave[]>([]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string; sub: string } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      ctx.fillStyle = '#06090e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initTopology();
    };

    window.addEventListener('resize', handleResize);

    // Initial Node Layout Blueprint (Normalized 0 to 1 relative positions)
    const NODE_TEMPLATES = [
      { id: 'r1', name: 'CORE-RTR-01', ip: '10.0.0.1', type: 'router', nx: 0.28, ny: 0.28, color: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
      { id: 'r2', name: 'CORE-RTR-02', ip: '10.0.1.1', type: 'router', nx: 0.72, ny: 0.28, color: '#06b6d4', glow: 'rgba(6,182,212,0.4)' },
      { id: 'fw1', name: 'EDGE-FIREWALL', ip: '172.16.0.254', type: 'firewall', nx: 0.50, ny: 0.16, color: '#f43f5e', glow: 'rgba(244,63,94,0.4)' },
      { id: 'gw', name: 'INET-GATEWAY', ip: '203.0.113.1', type: 'router', nx: 0.50, ny: 0.06, color: '#38bdf8', glow: 'rgba(56,189,248,0.4)' },
      { id: 'sw1', name: 'DIST-SW-A', ip: '192.168.10.1', type: 'switch', nx: 0.18, ny: 0.56, color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
      { id: 'sw2', name: 'DIST-SW-B', ip: '192.168.20.1', type: 'switch', nx: 0.82, ny: 0.56, color: '#10b981', glow: 'rgba(16,185,129,0.4)' },
      { id: 'srv1', name: 'DNS-ROOT-SRV', ip: '8.8.8.8', type: 'server', nx: 0.38, ny: 0.72, color: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
      { id: 'srv2', name: 'DHCP-AUTH-CLUSTER', ip: '172.16.1.10', type: 'server', nx: 0.62, ny: 0.72, color: '#a855f7', glow: 'rgba(168,85,247,0.4)' },
      { id: 'pc1', name: 'ENG-LAB-WS01', ip: '192.168.10.45', type: 'client', nx: 0.09, ny: 0.82, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
      { id: 'pc2', name: 'ENG-LAB-WS02', ip: '192.168.10.46', type: 'client', nx: 0.22, ny: 0.88, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
      { id: 'pc3', name: 'NOC-MONITOR-01', ip: '192.168.20.100', type: 'client', nx: 0.78, ny: 0.88, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
      { id: 'pc4', name: 'TESTBED-CLIENT', ip: '192.168.20.101', type: 'client', nx: 0.91, ny: 0.82, color: '#10b981', glow: 'rgba(16,185,129,0.3)' },
    ];

    const CONNECTIONS: NetworkConnection[] = [
      { from: 'gw', to: 'fw1', bandwidth: '10 Gbps' },
      { from: 'fw1', to: 'r1', bandwidth: '1 Gbps' },
      { from: 'fw1', to: 'r2', bandwidth: '1 Gbps' },
      { from: 'r1', to: 'r2', bandwidth: '10 Gbps' },
      { from: 'r1', to: 'sw1', bandwidth: '1 Gbps' },
      { from: 'r2', to: 'sw2', bandwidth: '1 Gbps' },
      { from: 'r1', to: 'srv1', bandwidth: '1 Gbps' },
      { from: 'r2', to: 'srv2', bandwidth: '1 Gbps' },
      { from: 'sw1', to: 'pc1', bandwidth: '100 Mbps' },
      { from: 'sw1', to: 'pc2', bandwidth: '100 Mbps' },
      { from: 'sw2', to: 'pc3', bandwidth: '100 Mbps' },
      { from: 'sw2', to: 'pc4', bandwidth: '100 Mbps' },
      { from: 'srv1', to: 'srv2', bandwidth: '1 Gbps' },
      { from: 'sw1', to: 'srv1', bandwidth: '1 Gbps' },
      { from: 'sw2', to: 'srv2', bandwidth: '1 Gbps' },
    ];

    let nodes: NetworkNode[] = [];
    let packets: Packet[] = [];
    let packetSeq = 0;

    const initTopology = () => {
      nodes = NODE_TEMPLATES.map(t => {
        const baseX = t.nx * width;
        const baseY = t.ny * height;
        return {
          id: t.id,
          name: t.name,
          ip: t.ip,
          type: t.type as NetworkNode['type'],
          x: baseX,
          y: baseY,
          baseX,
          baseY,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          driftRadius: 16 + Math.random() * 20,
          angle: Math.random() * Math.PI * 2,
          speed: 0.008 + Math.random() * 0.006,
          color: t.color,
          glowColor: t.glow,
          lastPulseTime: 0,
        };
      });

      // Spawn initial packets
      packets = [];
      for (let i = 0; i < 18; i++) {
        spawnRandomPacket();
      }
    };

    const PROTOCOLS: Array<{ type: Packet['protocol']; color: string; size: number }> = [
      { type: 'TCP', color: '#06b6d4', size: 3.5 },
      { type: 'ICMP', color: '#10b981', size: 3.0 },
      { type: 'UDP', color: '#f59e0b', size: 2.8 },
      { type: 'ARP', color: '#a855f7', size: 2.6 },
    ];

    const spawnRandomPacket = () => {
      if (CONNECTIONS.length === 0) return;
      const conn = CONNECTIONS[Math.floor(Math.random() * CONNECTIONS.length)];
      const proto = PROTOCOLS[Math.floor(Math.random() * PROTOCOLS.length)];
      
      // Random direction (forward or reverse)
      const forward = Math.random() > 0.4;
      const fromId = forward ? conn.from : conn.to;
      const toId = forward ? conn.to : conn.from;

      packetSeq++;
      packets.push({
        id: packetSeq,
        fromId,
        toId,
        progress: Math.random() * 0.2, // start near beginning
        speed: 0.004 + Math.random() * 0.007,
        protocol: proto.type,
        color: proto.color,
        size: proto.size,
      });
    };

    initTopology();

    // Mouse Tracking
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      mouseRef.current.x = mouseX;
      mouseRef.current.y = mouseY;
      mouseRef.current.active = true;

      // Check hover on nodes
      let hovered: NetworkNode | null = null;
      for (const node of nodes) {
        const dx = node.x - mouseX;
        const dy = node.y - mouseY;
        if (dx * dx + dy * dy < 28 * 28) {
          hovered = node;
          break;
        }
      }

      if (hovered) {
        mouseRef.current.hoveredNodeId = hovered.id;
        setTooltip({
          x: hovered.x,
          y: hovered.y - 34,
          text: `${hovered.name} • ${hovered.ip}`,
          sub: `TYPE: ${hovered.type.toUpperCase()} | STATUS: ONLINE | RTT: 0.14ms`,
        });
      } else {
        mouseRef.current.hoveredNodeId = null;
        setTooltip(null);
      }
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
      mouseRef.current.hoveredNodeId = null;
      setTooltip(null);
    };

    // Click Shockwave Ping
    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      pingWavesRef.current.push({
        x: clickX,
        y: clickY,
        radius: 0,
        maxRadius: Math.max(width, height) * 0.65,
        alpha: 0.85,
      });

      // Sound chirp
      playSound('ping');

      // Spawn burst of packets from 3 nearest nodes
      const sorted = [...nodes].sort((a, b) => {
        const da = (a.x - clickX) ** 2 + (a.y - clickY) ** 2;
        const db = (b.x - clickX) ** 2 + (b.y - clickY) ** 2;
        return da - db;
      });

      sorted.slice(0, 4).forEach((node) => {
        node.lastPulseTime = performance.now();
        // find a connection from this node
        const related = CONNECTIONS.filter(c => c.from === node.id || c.to === node.id);
        if (related.length > 0) {
          const c = related[Math.floor(Math.random() * related.length)];
          const toId = c.from === node.id ? c.to : c.from;
          packetSeq++;
          packets.push({
            id: packetSeq,
            fromId: node.id,
            toId,
            progress: 0,
            speed: 0.012, // fast burst
            protocol: 'ICMP',
            color: '#10b981',
            size: 4,
          });
        }
      });
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);

    // Matrix Hex Waterfall Stream Data
    const HEX_CHARS = '0123456789ABCDEF';
    const hexStreams: Array<{ x: number; y: number; speed: number; chars: string[] }> = [];
    const streamCount = Math.floor(width / 90);
    for (let i = 0; i < streamCount; i++) {
      const chars: string[] = [];
      for (let j = 0; j < 14; j++) {
        chars.push(HEX_CHARS[Math.floor(Math.random() * 16)] + HEX_CHARS[Math.floor(Math.random() * 16)]);
      }
      hexStreams.push({
        x: (i * 90) + 20,
        y: Math.random() * height,
        speed: 0.35 + Math.random() * 0.45,
        chars,
      });
    }

    let lastTime = performance.now();

    // Render Loop
    const render = (time: number) => {
      const dt = Math.min(32, time - lastTime);
      lastTime = time;

      ctx.clearRect(0, 0, width, height);

      // 1. Dark Tech Blueprint Grid
      const gridSize = 45;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.022)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // 2. Hex Stream Data in Background
      ctx.font = '10px "JetBrains Mono", Menlo, Consolas, monospace';
      for (const stream of hexStreams) {
        stream.y += stream.speed;
        if (stream.y > height + 180) {
          stream.y = -180;
        }

        stream.chars.forEach((byte, idx) => {
          const charY = stream.y + idx * 14;
          if (charY >= 0 && charY <= height) {
            const alpha = Math.max(0.015, (0.08 - (idx / stream.chars.length) * 0.065));
            ctx.fillStyle = idx === 0 ? 'rgba(52, 211, 153, 0.25)' : `rgba(148, 163, 184, ${alpha})`;
            ctx.fillText(byte, stream.x, charY);
          }
        });
      }

      // 3. Update Node Drifting Positions
      nodes.forEach(node => {
        node.angle += node.speed;
        node.x = node.baseX + Math.cos(node.angle) * node.driftRadius;
        node.y = node.baseY + Math.sin(node.angle * 0.8) * node.driftRadius;
      });

      const nodeMap = new Map<string, NetworkNode>(nodes.map(n => [n.id, n]));

      // 4. Render Network Conduit Lines (Links)
      CONNECTIONS.forEach(conn => {
        const fromNode = nodeMap.get(conn.from);
        const toNode = nodeMap.get(conn.to);
        if (!fromNode || !toNode) return;

        // Base cable
        ctx.strokeStyle = 'rgba(30, 41, 59, 0.7)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();

        // Inner glowing fiber conduit
        const grad = ctx.createLinearGradient(fromNode.x, fromNode.y, toNode.x, toNode.y);
        grad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
        grad.addColorStop(0.5, 'rgba(16, 185, 129, 0.35)');
        grad.addColorStop(1, 'rgba(99, 102, 241, 0.25)');

        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
      });

      // 5. Update & Draw Packets with Trails
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.progress += p.speed;

        const from = nodeMap.get(p.fromId);
        const to = nodeMap.get(p.toId);

        if (!from || !to || p.progress >= 1) {
          // Packet reached destination
          if (to) {
            to.lastPulseTime = time;
          }
          packets.splice(i, 1);
          spawnRandomPacket();
          continue;
        }

        const currX = from.x + (to.x - from.x) * p.progress;
        const currY = from.y + (to.y - from.y) * p.progress;

        // Packet tail / trail
        const trailProgress = Math.max(0, p.progress - 0.08);
        const trailX = from.x + (to.x - from.x) * trailProgress;
        const trailY = from.y + (to.y - from.y) * trailProgress;

        const trailGrad = ctx.createLinearGradient(trailX, trailY, currX, currY);
        trailGrad.addColorStop(0, 'transparent');
        trailGrad.addColorStop(1, p.color);

        ctx.strokeStyle = trailGrad;
        ctx.lineWidth = p.size * 0.9;
        ctx.beginPath();
        ctx.moveTo(trailX, trailY);
        ctx.lineTo(currX, currY);
        ctx.stroke();

        // Packet Core Head (Glowing Particle)
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(currX, currY, p.size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }

      // 6. Interactive Mouse Diagnostic Probe Lines
      const mouse = mouseRef.current;
      if (mouse.active) {
        // Find 2 closest nodes
        const sorted = [...nodes].sort((a, b) => {
          const da = (a.x - mouse.x) ** 2 + (a.y - mouse.y) ** 2;
          const db = (b.x - mouse.x) ** 2 + (b.y - mouse.y) ** 2;
          return da - db;
        });

        const nearest = sorted.slice(0, 2);
        nearest.forEach((n, idx) => {
          const dist = Math.sqrt((n.x - mouse.x) ** 2 + (n.y - mouse.y) ** 2);
          if (dist < 340) {
            const alpha = (1 - dist / 340) * 0.45;
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
            ctx.setLineDash([]);

            // Packet pulse toward mouse
            const phase = ((time * 0.002 + idx * 0.5) % 1);
            const px = n.x + (mouse.x - n.x) * phase;
            const py = n.y + (mouse.y - n.y) * phase;
            ctx.fillStyle = '#34d399';
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Mouse reticle
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 14, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(52, 211, 153, 0.8)';
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // 7. Click Ping Waves (Expanding Radar Broadcast)
      for (let i = pingWavesRef.current.length - 1; i >= 0; i--) {
        const wave = pingWavesRef.current[i];
        wave.radius += 7;
        wave.alpha = Math.max(0, 0.85 * (1 - wave.radius / wave.maxRadius));

        if (wave.radius >= wave.maxRadius || wave.alpha <= 0.01) {
          pingWavesRef.current.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(6, 182, 212, ${wave.alpha})`;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Secondary harmonic echo wave
        if (wave.radius > 40) {
          ctx.strokeStyle = `rgba(16, 185, 129, ${wave.alpha * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(wave.x, wave.y, wave.radius - 35, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // 8. Render Nodes
      nodes.forEach(node => {
        const isHovered = mouse.hoveredNodeId === node.id;
        const timeSincePulse = time - node.lastPulseTime;
        const isPulsing = timeSincePulse < 600;

        // Arrival ring pulse
        if (isPulsing) {
          const pulseProgress = timeSincePulse / 600;
          const pulseRadius = 12 + pulseProgress * 22;
          const pulseAlpha = (1 - pulseProgress) * 0.7;
          ctx.strokeStyle = `rgba(16, 185, 129, ${pulseAlpha})`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Radial glow under node
        const glowRadius = isHovered ? 28 : 18;
        const glowGrad = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, glowRadius);
        glowGrad.addColorStop(0, node.glowColor);
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Node Outer Ring
        ctx.strokeStyle = isHovered ? '#ffffff' : node.color;
        ctx.lineWidth = isHovered ? 2.5 : 1.6;
        ctx.fillStyle = '#0a0f1d';
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? 10 : 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Node Center Core
        ctx.fillStyle = isHovered ? '#ffffff' : node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, isHovered ? 4.5 : 3, 0, Math.PI * 2);
        ctx.fill();

        // Text Labels (Node Name + IP)
        ctx.font = 'bold 9px "JetBrains Mono", Menlo, Consolas, monospace';
        ctx.fillStyle = isHovered ? '#38bdf8' : 'rgba(226, 232, 240, 0.75)';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + (isHovered ? 22 : 19));

        ctx.font = '8px "JetBrains Mono", Menlo, Consolas, monospace';
        ctx.fillStyle = 'rgba(100, 116, 139, 0.75)';
        ctx.fillText(node.ip, node.x, node.y + (isHovered ? 32 : 28));
      });

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto">
      <canvas
        ref={canvasRef}
        className="w-full h-full block cursor-crosshair"
      />

      {/* Interactive Tooltip when hovering over topology nodes in background */}
      {tooltip && (
        <div
          className="fixed pointer-events-none z-30 -translate-x-1/2 -translate-y-full px-3 py-1.5 rounded-lg bg-slate-950/95 border border-cyan-500/40 shadow-2xl backdrop-blur-md text-center animate-in fade-in zoom-in-95 duration-150"
          style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
        >
          <div className="text-[11px] font-mono font-bold text-cyan-300 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>{tooltip.text}</span>
          </div>
          <div className="text-[9px] font-mono text-slate-400 mt-0.5">
            {tooltip.sub}
          </div>
        </div>
      )}

      {/* Faint corner telemetry indicator */}
      <div className="absolute bottom-3 left-4 text-[10px] font-mono text-slate-400/80 pointer-events-none select-none flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        <span>LIVE TOPOLOGY MESH ACTIVE • CLICK TO SEND ARP PROBE • HOVER TO INSPECT</span>
      </div>
    </div>
  );
};
