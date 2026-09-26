import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  Monitor, 
  Cpu, 
  Router as RouterIcon, 
  Server, 
  Terminal as TerminalIcon, 
  Activity, 
  CheckCircle2, 
  Wrench, 
  RotateCcw, 
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Radio,
  Sliders,
  Sparkles,
  Star,
  Play,
  Volume2,
  X,
  Compass,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../../../lib/sound';

export interface MissionScenario {
  id: string;
  title: string;
  category: string;
  alertText: string;
  symptom: string;
  targetStationId: string;
  expectedFixDesc: string;
}

export const MISSIONS: MissionScenario[] = [
  {
    id: 'm1-router-shutdown',
    title: 'Mission 01: The Shutdown Gateway',
    category: 'Layer 2 / Interface',
    alertText: 'CRITICAL ALERT: ROUTER R1 G0/0 INTERFACE SHUTDOWN',
    symptom: 'Hosts cannot reach gateway 192.168.1.1. Ping returns "Request timed out".',
    targetStationId: 'st-router',
    expectedFixDesc: 'Execute "no shutdown" on GigabitEthernet0/0 interface on Router R1.',
  },
  {
    id: 'm2-rogue-ip',
    title: 'Mission 02: The Rogue IP Collision',
    category: 'Layer 3 / IP Conflict',
    alertText: 'WARNING: DUPLICATE IP CONFLICT ON 192.168.1.10',
    symptom: 'PC2 was accidentally configured with the same IP as PC1 (192.168.1.10).',
    targetStationId: 'st-pc2',
    expectedFixDesc: 'Reassign PC2 IP address to unique address 192.168.1.11.',
  },
  {
    id: 'm3-severed-cable',
    title: 'Mission 03: The Unseated Trunk Cable',
    category: 'Layer 1 / Physical',
    alertText: 'PHYSICAL LINK DOWN: SWITCH <-> ROUTER TRUNK DISCONNECTED',
    symptom: 'Switch SW1 Gi0/1 link LED is unlit. Packets cannot traverse between LAN and Router.',
    targetStationId: 'st-switch',
    expectedFixDesc: 'Re-seat and lock Cat6 patch cable on Gi0/1 uplink port.',
  },
  {
    id: 'm4-dead-dns',
    title: 'Mission 04: The Dead DNS Resolver',
    category: 'Layer 7 / Application',
    alertText: 'SERVICE OUTAGE: DNS DAEMON (NAMED) TERMINATED',
    symptom: 'IP ping to 192.168.2.10 works, but domain name lookup "server.local" fails.',
    targetStationId: 'st-server',
    expectedFixDesc: 'Restart systemd DNS resolution daemon (named) on Enterprise Server.',
  },
  {
    id: 'm5-subnet-drift',
    title: 'Mission 05: The Subnet Boundary Drift',
    category: 'Layer 3 / Subnetting',
    alertText: 'ROUTING FAILURE: PC1 SUBNET MASK CONFIGURED AS /16',
    symptom: 'PC1 mask is 255.255.0.0; it assumes remote server is on local link and skips gateway.',
    targetStationId: 'st-pc',
    expectedFixDesc: 'Correct PC1 subnet mask to 255.255.255.0 (/24).',
  },
];

interface Station {
  id: string;
  name: string;
  type: 'pc' | 'pc2' | 'switch' | 'router' | 'server' | 'terminal' | 'monitor';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  statusText: string;
}

export const NOCRoomGame: React.FC<{ onProceedToConclusion: () => void }> = ({ onProceedToConclusion }) => {
  // Active mission state
  const [selectedMissionIdx, setSelectedMissionIdx] = useState(0);
  const activeMission = MISSIONS[selectedMissionIdx];

  // Player Position in the room (Canvas coordinates 0..800 x 0..480)
  const [player, setPlayer] = useState<{ x: number; y: number; dir: 'up' | 'down' | 'left' | 'right' }>({ 
    x: 400, 
    y: 360, 
    dir: 'up' 
  });
  const [nearStation, setNearStation] = useState<Station | null>(null);
  const [activeStationModal, setActiveStationModal] = useState<Station | null>(null);

  // Mission progression
  const [missionState, setMissionState] = useState<'hunting' | 'repaired' | 'verified'>('hunting');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showToolScanner, setShowToolScanner] = useState(false);
  const [scannerLogs, setScannerLogs] = useState<string[]>([
    'HANDHELD SCANNER: Ready.',
    'Click "Ping Gateway" or "Scan Network" to inspect.',
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Record<string, boolean>>({});
  const rackLedCycle = useRef(0);

  // Interactive NOC Room Stations
  const stations: Station[] = [
    {
      id: 'st-monitor',
      name: 'NOC Wall Overview Display',
      type: 'monitor',
      x: 290,
      y: 25,
      width: 220,
      height: 55,
      color: '#06b6d4',
      statusText: activeMission.alertText,
    },
    {
      id: 'st-terminal',
      name: 'Central Diagnostic Console',
      type: 'terminal',
      x: 90,
      y: 70,
      width: 80,
      height: 65,
      color: '#10b981',
      statusText: 'Terminal Ready. Execute Layer 3/4 network diagnosis commands.',
    },
    {
      id: 'st-pc',
      name: 'Workstation PC1 (Lab Host)',
      type: 'pc',
      x: 75,
      y: 280,
      width: 75,
      height: 75,
      color: '#3b82f6',
      statusText: activeMission.id === 'm5-subnet-drift' && missionState === 'hunting'
        ? 'FAULT: Subnet Mask is set to 255.255.0.0 (/16)!'
        : 'Host IP: 192.168.1.10 | Subnet: 255.255.255.0 | Gateway: 192.168.1.1',
    },
    {
      id: 'st-pc2',
      name: 'Faculty Workstation PC2',
      type: 'pc2',
      x: 75,
      y: 380,
      width: 75,
      height: 70,
      color: '#38bdf8',
      statusText: activeMission.id === 'm2-rogue-ip' && missionState === 'hunting'
        ? 'FAULT: Duplicate IP 192.168.1.10 assigned!'
        : 'Host IP: 192.168.1.11 | Subnet: 255.255.255.0 | Gateway: 192.168.1.1',
    },
    {
      id: 'st-switch',
      name: 'Distribution Switch Rack (SW1)',
      type: 'switch',
      x: 270,
      y: 190,
      width: 85,
      height: 85,
      color: '#8b5cf6',
      statusText: activeMission.id === 'm3-severed-cable' && missionState === 'hunting'
        ? 'FAULT: Gi0/1 Trunk Cable disconnected / link unseated!'
        : 'Catalyst 2960 Switch: 24 Ports active | CAM Table operational',
    },
    {
      id: 'st-router',
      name: 'Core Gateway Router (R1)',
      type: 'router',
      x: 450,
      y: 190,
      width: 85,
      height: 85,
      color: '#f59e0b',
      statusText: activeMission.id === 'm1-router-shutdown' && missionState === 'hunting'
        ? 'FAULT: GigabitEthernet0/0 interface is administratively SHUTDOWN!'
        : 'Cisco 2911: Gi0/0 (192.168.1.1) UP | Gi0/1 (192.168.2.1) UP',
    },
    {
      id: 'st-server',
      name: 'Enterprise Server Rack',
      type: 'server',
      x: 640,
      y: 240,
      width: 95,
      height: 110,
      color: '#10b981',
      statusText: activeMission.id === 'm4-dead-dns' && missionState === 'hunting'
        ? 'FAULT: Named DNS service is inactive (dead)!'
        : 'Enterprise Server: HTTP (Port 80) & DNS (Port 53) listening.',
    },
  ];

  // Timer loop
  useEffect(() => {
    if (missionState === 'verified') return;
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [missionState]);

  // Keyboard navigation & interaction
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keysPressed.current[key] = true;

      // Interaction key [E] or Space
      if ((key === 'e' || key === ' ') && nearStation) {
        e.preventDefault();
        playSound('click');
        setActiveStationModal(nearStation);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [nearStation]);

  // 60 FPS Movement Loop
  useEffect(() => {
    let animId: number;

    const updateMovement = () => {
      const speed = 4.2;
      let dx = 0;
      let dy = 0;
      let newDir: 'up' | 'down' | 'left' | 'right' = player.dir;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) {
        dy -= speed;
        newDir = 'up';
      }
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) {
        dy += speed;
        newDir = 'down';
      }
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) {
        dx -= speed;
        newDir = 'left';
      }
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) {
        dx += speed;
        newDir = 'right';
      }

      if (dx !== 0 || dy !== 0) {
        setPlayer(prev => {
          const nextX = Math.max(25, Math.min(775, prev.x + dx));
          const nextY = Math.max(30, Math.min(450, prev.y + dy));
          return { x: nextX, y: nextY, dir: newDir };
        });
      }

      animId = requestAnimationFrame(updateMovement);
    };

    animId = requestAnimationFrame(updateMovement);
    return () => cancelAnimationFrame(animId);
  }, [player.dir]);

  // Proximity detection with stations
  useEffect(() => {
    let detected: Station | null = null;
    for (const st of stations) {
      const centerX = st.x + st.width / 2;
      const centerY = st.y + st.height / 2;
      const dist = Math.hypot(player.x - centerX, player.y - centerY);
      if (dist < 75) {
        detected = st;
        break;
      }
    }
    setNearStation(detected);
  }, [player]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    rackLedCycle.current += 0.08;

    // Clear background
    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Raised Floor Grid with glowing conduits
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 36) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Glowing Underfloor Cable Conduits
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(130, 100);
    ctx.lineTo(130, 310);
    ctx.lineTo(310, 230);
    ctx.lineTo(490, 230);
    ctx.lineTo(690, 290);
    ctx.stroke();

    // Render Each Station
    stations.forEach(st => {
      const isTargetFault = st.id === activeMission.targetStationId && missionState === 'hunting';
      const isNear = nearStation?.id === st.id;

      // Glow effect if near
      if (isNear) {
        ctx.shadowColor = isTargetFault ? '#f43f5e' : '#10b981';
        ctx.shadowBlur = 20;
      } else {
        ctx.shadowBlur = 0;
      }

      // Station Body
      ctx.fillStyle = isTargetFault ? '#220e17' : '#0c1322';
      ctx.strokeStyle = isTargetFault ? '#f43f5e' : st.color;
      ctx.lineWidth = isNear ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(st.x, st.y, st.width, st.height, 10);
      ctx.fill();
      ctx.stroke();

      // Station Interior Graphics based on type
      if (st.type === 'switch' || st.type === 'router' || st.type === 'server') {
        // Rack Units Slots & Blinking LEDs
        const rowCount = st.type === 'server' ? 6 : 4;
        for (let r = 0; r < rowCount; r++) {
          const rowY = st.y + 12 + r * 14;
          ctx.fillStyle = '#060a12';
          ctx.fillRect(st.x + 8, rowY, st.width - 16, 10);

          // LED Lights
          const ledOn = Math.sin(rackLedCycle.current + r) > 0;
          ctx.fillStyle = isTargetFault && r === 0 ? '#f43f5e' : ledOn ? '#10b981' : '#06b6d4';
          ctx.beginPath();
          ctx.arc(st.x + 14, rowY + 5, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = ledOn ? '#34d399' : '#0284c7';
          ctx.beginPath();
          ctx.arc(st.x + 22, rowY + 5, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      } else if (st.type === 'monitor') {
        // Sinusoidal Waveform on Wall Display
        ctx.strokeStyle = isTargetFault ? '#f43f5e' : '#06b6d4';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let mx = 0; mx < st.width - 20; mx += 4) {
          const waveY = st.y + 28 + Math.sin(rackLedCycle.current * 2 + mx * 0.1) * 7;
          if (mx === 0) ctx.moveTo(st.x + 10 + mx, waveY);
          else ctx.lineTo(st.x + 10 + mx, waveY);
        }
        ctx.stroke();
      }

      // Station Label Text
      ctx.fillStyle = '#f1f5f9';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(st.name.slice(0, 16), st.x + st.width / 2, st.y + st.height - 6);

      // Fault Warning Icon
      if (isTargetFault) {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(st.x + st.width - 8, st.y + 8, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.shadowBlur = 0;

    // Render Ambient Spotlight around player
    const radGrd = ctx.createRadialGradient(player.x, player.y, 10, player.x, player.y, 90);
    radGrd.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
    radGrd.addColorStop(1, 'rgba(16, 185, 129, 0)');
    ctx.fillStyle = radGrd;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 90, 0, Math.PI * 2);
    ctx.fill();

    // Render Player Avatar (Network Engineer)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
    ctx.fill();

    // Directional Facing Goggles
    ctx.fillStyle = '#060a12';
    const eyeOffset = {
      up: { x: 0, y: -5 },
      down: { x: 0, y: 5 },
      left: { x: -5, y: 0 },
      right: { x: 5, y: 0 },
    }[player.dir];

    ctx.beginPath();
    ctx.arc(player.x + eyeOffset.x, player.y + eyeOffset.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }, [player, nearStation, missionState, activeMission]);

  // Station action repair logic
  const handleRepairActiveStation = () => {
    playSound('repair');
    setMissionState('repaired');
  };

  // Run NOC Sweep to verify network restoration
  const handleVerifyMissionSweep = () => {
    playSound('success');
    confetti({
      particleCount: 90,
      spread: 80,
      origin: { y: 0.65 },
    });
    setMissionState('verified');
  };

  const handleNextMission = () => {
    playSound('click');
    const nextIdx = (selectedMissionIdx + 1) % MISSIONS.length;
    setSelectedMissionIdx(nextIdx);
    setMissionState('hunting');
    setElapsedTime(0);
    setPlayer({ x: 400, y: 360, dir: 'up' });
    setActiveStationModal(null);
  };

  // Star calculation
  const stars = elapsedTime <= 45 ? 3 : elapsedTime <= 90 ? 2 : 1;

  return (
    <section className="py-10 bg-[#070a12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
              <Gamepad2 className="w-4 h-4" />
              <span>Interactive Gamified Simulation // NOC Room 2.0</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              Network Ops: Fault Hunt
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Investigate the virtual Network Operations Center. Walk up to hardware stations, diagnose faults, and verify uptime.
            </p>
          </div>

          {/* Quick HUD Metrics & Controls */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300">
              Elapsed: <span className="text-emerald-400 font-bold">{elapsedTime}s</span>
            </div>

            <button
              onClick={() => setShowToolScanner(!showToolScanner)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                showToolScanner
                  ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Pocket Scanner</span>
            </button>

            {missionState === 'verified' && (
              <button
                onClick={() => {
                  playSound('success');
                  onProceedToConclusion();
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                View Lab Completion Report →
              </button>
            )}
          </div>
        </div>

        {/* Mission Briefing Selector Banner */}
        <div className="p-4 sm:p-5 bg-[#0d1322] border border-slate-800 rounded-2xl shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Select Mission:</span>
              <select
                value={selectedMissionIdx}
                onChange={e => {
                  playSound('click');
                  setSelectedMissionIdx(parseInt(e.target.value, 10));
                  setMissionState('hunting');
                  setElapsedTime(0);
                  setActiveStationModal(null);
                }}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:outline-none focus:border-emerald-500 cursor-pointer font-sans font-semibold"
              >
                {MISSIONS.map((m, i) => (
                  <option key={m.id} value={i}>
                    {m.title} ({m.category})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Objective Status: </span>
              <span className={
                missionState === 'verified'
                  ? 'text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30'
                  : missionState === 'repaired'
                  ? 'text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/30'
                  : 'text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30 animate-pulse'
              }>
                {missionState === 'verified' ? 'MISSION COMPLETE' : missionState === 'repaired' ? 'FIX APPLIED — VERIFY AT NOC MONITOR' : 'FAULT ACTIVE — HUNT REQUIRED'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-black/50 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 flex items-start gap-2">
            <Activity className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <span className="text-amber-300 font-bold">{activeMission.alertText}</span>
              <div className="text-slate-400 mt-0.5">{activeMission.symptom}</div>
            </div>
          </div>
        </div>

        {/* Handheld Pocket Scanner Drawer (if toggled) */}
        {showToolScanner && (
          <div className="p-4 rounded-2xl bg-[#0b101d] border border-emerald-500/40 font-mono text-xs space-y-2 animate-in fade-in shadow-2xl">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Radio className="w-4 h-4" />
                <span>HANDHELD WI-FI PACKET SCANNER (PORTABLE HUD)</span>
              </span>
              <button
                onClick={() => setShowToolScanner(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={() => {
                  playSound('click');
                  setScannerLogs(prev => [
                    `[PING 192.168.1.1] ${missionState === 'repaired' || activeMission.id !== 'm1-router-shutdown' ? 'Reply from 192.168.1.1: bytes=32 time=1ms TTL=64' : 'Request timed out (Gateway unreachable)'}`,
                    ...prev.slice(0, 3)
                  ]);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded border border-slate-800"
              >
                Ping Gateway (192.168.1.1)
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  setScannerLogs(prev => [
                    `[PING 192.168.2.10] ${missionState === 'repaired' || missionState === 'verified' ? 'Reply from 192.168.2.10: bytes=32 time=2ms TTL=63' : 'Destination host unreachable / packet loss 100%'}`,
                    ...prev.slice(0, 3)
                  ]);
                }}
                className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 rounded border border-slate-800"
              >
                Ping Server (192.168.2.10)
              </button>
            </div>

            <div className="p-2.5 bg-black/60 rounded-lg border border-slate-800 space-y-1 text-[11px] text-slate-300">
              {scannerLogs.map((log, i) => (
                <div key={i} className={log.includes('timed out') || log.includes('unreachable') ? 'text-rose-400' : 'text-emerald-300'}>
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2D NOC Floor Canvas */}
        <div className="relative rounded-3xl border border-slate-800 overflow-hidden shadow-2xl bg-[#080c16]">
          <canvas
            ref={canvasRef}
            width={800}
            height={480}
            className="w-full h-auto block select-none"
          />

          {/* Proximity Interaction Floating Prompt */}
          {nearStation && !activeStationModal && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-5 py-2.5 bg-[#0d1322]/95 border-2 border-emerald-500 text-emerald-300 rounded-2xl font-mono text-xs flex items-center gap-3 shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-bounce z-20">
              <span className="font-bold text-slate-100">STATION: {nearStation.name}</span>
              <button
                onClick={() => {
                  playSound('click');
                  setActiveStationModal(nearStation);
                }}
                className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold uppercase text-[11px] transition-all cursor-pointer shadow-md"
              >
                Press [E] or Click to Inspect
              </button>
            </div>
          )}

          {/* Movement Keys Guide Overlay */}
          <div className="absolute top-4 left-4 p-3 rounded-2xl bg-black/70 backdrop-blur-md border border-slate-800 text-[10px] font-mono text-slate-400 hidden sm:block shadow-lg">
            <div className="font-bold text-slate-200 mb-1 flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>NOC Controls:</span>
            </div>
            <div>[W] / [↑] Walk North</div>
            <div>[S] / [↓] Walk South</div>
            <div>[A] / [←] Walk West</div>
            <div>[D] / [→] Walk East</div>
            <div className="text-emerald-400 font-semibold mt-0.5">[E] / [Space] Interact</div>
          </div>
        </div>

        {/* Mobile On-Screen Virtual D-Pad */}
        <div className="sm:hidden flex items-center justify-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <button
            onPointerDown={() => { keysPressed.current['arrowleft'] = true; }}
            onPointerUp={() => { keysPressed.current['arrowleft'] = false; }}
            className="p-3.5 bg-slate-800 rounded-xl text-slate-200 active:bg-emerald-500 active:text-slate-950"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col gap-2">
            <button
              onPointerDown={() => { keysPressed.current['arrowup'] = true; }}
              onPointerUp={() => { keysPressed.current['arrowup'] = false; }}
              className="p-3.5 bg-slate-800 rounded-xl text-slate-200 active:bg-emerald-500 active:text-slate-950"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => { keysPressed.current['arrowdown'] = true; }}
              onPointerUp={() => { keysPressed.current['arrowdown'] = false; }}
              className="p-3.5 bg-slate-800 rounded-xl text-slate-200 active:bg-emerald-500 active:text-slate-950"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
          <button
            onPointerDown={() => { keysPressed.current['arrowright'] = true; }}
            onPointerUp={() => { keysPressed.current['arrowright'] = false; }}
            className="p-3.5 bg-slate-800 rounded-xl text-slate-200 active:bg-emerald-500 active:text-slate-950"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Station Inspector Modal */}
        {activeStationModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="max-w-lg w-full bg-[#0d1322] border border-slate-700/80 rounded-3xl p-6 space-y-4 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-slate-100 uppercase tracking-wider">
                  Hardware Inspector // {activeStationModal.name}
                </span>
                <button
                  onClick={() => setActiveStationModal(null)}
                  className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              {/* Station Specific Hardware Diagnostics */}
              <div className="p-4 bg-black/60 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-slate-500 text-[10px] uppercase font-bold">
                  Telemetry & Port Status:
                </div>
                <div className="text-sm font-semibold text-slate-200">
                  {activeStationModal.statusText}
                </div>
              </div>

              {/* Station Specific Action Prompts */}
              {activeStationModal.id === activeMission.targetStationId && missionState === 'hunting' ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                    <span className="font-bold">FAULT IDENTIFIED: </span>
                    {activeMission.expectedFixDesc}
                  </div>

                  <button
                    onClick={() => {
                      handleRepairActiveStation();
                      setActiveStationModal(null);
                    }}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>APPLY HARDWARE / CONFIG FIX</span>
                  </button>
                </div>
              ) : activeStationModal.type === 'monitor' && missionState === 'repaired' ? (
                <div className="space-y-3 pt-2">
                  <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-300 text-xs">
                    Hardware fix detected. Ready to execute global NOC connectivity sweep.
                  </div>

                  <button
                    onClick={() => {
                      handleVerifyMissionSweep();
                      setActiveStationModal(null);
                    }}
                    className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 cursor-pointer text-xs"
                  >
                    <Zap className="w-4 h-4" />
                    <span>RUN GLOBAL NOC SWEEP (VERIFY RESTORATION)</span>
                  </button>
                </div>
              ) : activeStationModal.type === 'terminal' ? (
                <div className="space-y-3">
                  <p className="text-slate-400 text-xs">
                    Central Console connected to all subnets. Use the handheld scanner or main diagnostic module for full CLI output.
                  </p>
                  <button
                    onClick={() => {
                      setActiveStationModal(null);
                      setShowToolScanner(true);
                    }}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Open Handheld Scanner Console
                  </button>
                </div>
              ) : (
                <div className="space-y-3 pt-1">
                  <div className="text-emerald-400 text-xs flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Station operating within nominal parameters.</span>
                  </div>
                  <button
                    onClick={() => setActiveStationModal(null)}
                    className="w-full py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 cursor-pointer"
                  >
                    Close Inspector
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mission Complete Victory Card */}
        {missionState === 'verified' && (
          <div className="p-6 rounded-3xl bg-[#0e1728] border-2 border-emerald-500/50 text-emerald-300 space-y-4 font-mono text-xs shadow-2xl animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span>MISSION ACCOMPLISHED: {activeMission.title}</span>
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  Completed in {elapsedTime} seconds. All network interfaces and routes restored.
                </div>
              </div>

              {/* Star Rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3].map(st => (
                  <Star
                    key={st}
                    className={`w-6 h-6 ${st <= stars ? 'text-amber-400 fill-amber-400' : 'text-slate-700'}`}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 pt-2">
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800">CONNECTIVITY: <span className="text-emerald-400 font-bold">✓ 100% PASS</span></div>
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800">GATEWAY RTT: <span className="text-emerald-400 font-bold">✓ &lt;1ms</span></div>
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800">INTER-VLAN ROUTING: <span className="text-emerald-400 font-bold">✓ NOMINAL</span></div>
              <div className="p-3 bg-black/40 rounded-xl border border-slate-800">PACKET DELIVERY: <span className="text-emerald-400 font-bold">✓ 0% LOSS</span></div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={handleNextMission}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Next Mission Scenario</span>
              </button>

              <button
                onClick={() => {
                  playSound('success');
                  onProceedToConclusion();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                <span>Proceed to Completion Certificate →</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
