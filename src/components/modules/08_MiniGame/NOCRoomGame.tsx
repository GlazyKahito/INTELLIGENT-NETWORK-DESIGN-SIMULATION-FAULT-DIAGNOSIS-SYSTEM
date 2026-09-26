import React, { useState, useEffect, useRef } from 'react';
import { 
  Gamepad2, 
  Monitor, 
  Cpu, 
  Router as RouterIcon, 
  Server, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  Wrench, 
  RotateCcw, 
  Award,
  Zap,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../../../lib/sound';

interface Station {
  id: string;
  name: string;
  type: 'pc' | 'switch' | 'router' | 'server' | 'terminal' | 'monitor';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  isFaulty?: boolean;
  statusText: string;
}

export const NOCRoomGame: React.FC<{ onProceedToConclusion: () => void }> = ({ onProceedToConclusion }) => {
  // Player Position in the room (Canvas coordinates 0..800 x 0..480)
  const [player, setPlayer] = useState<{ x: number; y: number }>({ x: 400, y: 360 });
  const [nearStation, setNearStation] = useState<Station | null>(null);
  const [activeStationModal, setActiveStationModal] = useState<Station | null>(null);

  // Mission Game State
  const [missionState, setMissionState] = useState<'briefing' | 'hunting' | 'repaired' | 'verified'>('hunting');
  const [faultIndex, setFaultIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'NOC-CONSOLE-01: SYSTEM MONITORING IN SERVICE',
    'ALERT: Packet loss detected across VLAN 10 trunk.',
  ]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const keysPressed = useRef<Record<string, boolean>>({});

  // Stations in the NOC room
  const [stations, setStations] = useState<Station[]>([
    {
      id: 'st-monitor',
      name: 'NOC Wall Operations Display',
      type: 'monitor',
      x: 300,
      y: 30,
      width: 200,
      height: 50,
      color: '#06b6d4',
      statusText: 'ALERT: SERVER 192.168.2.10 UNREACHABLE (100% LOSS)',
    },
    {
      id: 'st-terminal',
      name: 'Central Diagnostic Console',
      type: 'terminal',
      x: 100,
      y: 80,
      width: 70,
      height: 60,
      color: '#10b981',
      statusText: 'Terminal Ready. Type commands or inspect live telemetry.',
    },
    {
      id: 'st-pc',
      name: 'Engineering Workstation PC1',
      type: 'pc',
      x: 80,
      y: 280,
      width: 70,
      height: 70,
      color: '#3b82f6',
      statusText: 'Host IP: 192.168.1.10 | Gateway: 192.168.1.1',
    },
    {
      id: 'st-switch',
      name: 'Distribution Switch Rack (SW1)',
      type: 'switch',
      x: 270,
      y: 200,
      width: 80,
      height: 80,
      color: '#8b5cf6',
      statusText: '24 FastEthernet Ports | CAM Table Operational',
    },
    {
      id: 'st-router',
      name: 'Core Gateway Router (R1)',
      type: 'router',
      x: 450,
      y: 200,
      width: 80,
      height: 80,
      color: '#f59e0b',
      isFaulty: true, // The fault station for this mission!
      statusText: 'FAULT: GigabitEthernet0/0 is administratively SHUTDOWN!',
    },
    {
      id: 'st-server',
      name: 'Enterprise Server Rack',
      type: 'server',
      x: 640,
      y: 260,
      width: 90,
      height: 100,
      color: '#10b981',
      statusText: 'Web & DNS Daemon (192.168.2.10) awaiting traffic.',
    },
  ]);

  // Timer loop
  useEffect(() => {
    if (missionState === 'verified') return;
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [missionState]);

  // Keyboard listeners (WASD / Arrows)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      // Interaction key [E] or Space
      if ((e.key.toLowerCase() === 'e' || e.key === ' ') && nearStation) {
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

  // Movement loop running at 60fps
  useEffect(() => {
    let animId: number;

    const updateMovement = () => {
      const speed = 4;
      let dx = 0;
      let dy = 0;

      if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= speed;
      if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += speed;
      if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= speed;
      if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += speed;

      if (dx !== 0 || dy !== 0) {
        setPlayer(prev => {
          const nextX = Math.max(25, Math.min(775, prev.x + dx));
          const nextY = Math.max(30, Math.min(450, prev.y + dy));
          return { x: nextX, y: nextY };
        });
      }

      animId = requestAnimationFrame(updateMovement);
    };

    animId = requestAnimationFrame(updateMovement);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Proximity detection
  useEffect(() => {
    let detected: Station | null = null;
    for (const st of stations) {
      const centerX = st.x + st.width / 2;
      const centerY = st.y + st.height / 2;
      const dist = Math.hypot(player.x - centerX, player.y - centerY);
      if (dist < 70) {
        detected = st;
        break;
      }
    }
    setNearStation(detected);
  }, [player, stations]);

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear background
    ctx.fillStyle = '#080c16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid Floor
    ctx.strokeStyle = '#131b2e';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Overhead Cable Trays connecting Switch to Router to Server
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(310, 240);
    ctx.lineTo(490, 240);
    ctx.lineTo(685, 310);
    ctx.stroke();

    // Render Stations
    stations.forEach(st => {
      // Glow if near
      if (nearStation?.id === st.id) {
        ctx.shadowColor = st.isFaulty ? '#f43f5e' : '#10b981';
        ctx.shadowBlur = 18;
      } else {
        ctx.shadowBlur = 0;
      }

      // Base
      ctx.fillStyle = st.isFaulty ? '#2a111a' : '#0d1322';
      ctx.strokeStyle = st.isFaulty ? '#f43f5e' : st.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(st.x, st.y, st.width, st.height, 8);
      ctx.fill();
      ctx.stroke();

      // Station Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(st.name.slice(0, 18), st.x + st.width / 2, st.y + st.height / 2 + 3);

      // Fault indicator LED
      if (st.isFaulty) {
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(st.x + st.width - 10, st.y + 10, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Reset shadow
    ctx.shadowBlur = 0;

    // Render Player Avatar (Network Technician with glowing badge)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(player.x, player.y, 14, 0, Math.PI * 2);
    ctx.fill();

    // Player Direction Indicator
    ctx.fillStyle = '#05070d';
    ctx.beginPath();
    ctx.arc(player.x, player.y - 4, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }, [player, nearStation, stations]);

  const handleRepairStation = (stationId: string) => {
    playSound('repair');
    setStations(prev =>
      prev.map(s => (s.id === stationId ? { ...s, isFaulty: false, statusText: 'Interface GigabitEthernet0/0 enabled. UP.' } : s))
    );
    setMissionState('repaired');
    setTerminalLogs(prev => [
      'ROUTER-R1: "no shutdown" command issued on Gi0/0.',
      'INTERFACE STATUS: GigabitEthernet0/0 changed state to UP.',
      ...prev,
    ]);
  };

  const handleVerifyMission = () => {
    playSound('success');
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    setMissionState('verified');
    setTerminalLogs(prev => [
      'NOC-PING: 4 packets sent, 4 received, 0% loss.',
      'MISSION COMPLETE: All network systems nominal.',
      ...prev,
    ]);
  };

  return (
    <section className="py-10 bg-[#070a12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
              <span>Interactive Gamified Simulation // 2D Virtual NOC</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              Network Ops: Fault Hunt
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Navigate the Network Operations Center. Investigate device stations with WASD / Touch, isolate faulty hardware, and restore uptime.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl font-mono text-xs text-slate-300">
              Elapsed Time: <span className="text-emerald-400 font-bold">{elapsedTime}s</span>
            </div>
            {missionState === 'verified' && (
              <button
                onClick={() => {
                  playSound('success');
                  onProceedToConclusion();
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                View Lab Completion Report →
              </button>
            )}
          </div>
        </div>

        {/* Mission Alert Banner */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-2 text-amber-300">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="font-bold">CRITICAL NOC MISSION: </span>
            <span>Server 192.168.2.10 is unreachable. Walk to stations and inspect hardware.</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Status: </span>
            <span className={
              missionState === 'verified'
                ? 'text-emerald-400 font-bold'
                : missionState === 'repaired'
                ? 'text-cyan-400 font-bold'
                : 'text-rose-400 font-bold'
            }>
              {missionState.toUpperCase()}
            </span>
          </div>
        </div>

        {/* 2D Canvas & Controls Layout */}
        <div className="relative rounded-2xl border border-slate-800 overflow-hidden shadow-2xl bg-[#080c16]">
          <canvas
            ref={canvasRef}
            width={800}
            height={480}
            className="w-full h-auto block select-none"
          />

          {/* Proximity Interaction Prompt Floating Overlay */}
          {nearStation && !activeStationModal && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-slate-900/90 border border-emerald-500 text-emerald-300 rounded-xl font-mono text-xs flex items-center gap-2 shadow-2xl animate-bounce">
              <span className="font-bold">NEAR: {nearStation.name}</span>
              <button
                onClick={() => {
                  playSound('click');
                  setActiveStationModal(nearStation);
                }}
                className="px-2 py-0.5 bg-emerald-500 text-slate-950 rounded font-bold uppercase text-[11px]"
              >
                Press [E] or Click to Inspect
              </button>
            </div>
          )}

          {/* Desktop Keyboard Keys Guide */}
          <div className="absolute top-4 left-4 p-2.5 rounded-xl bg-black/60 border border-slate-800 text-[10px] font-mono text-slate-400 hidden sm:block">
            <div className="font-bold text-slate-300 mb-1">Movement Controls:</div>
            <div>[W] / [↑] Forward</div>
            <div>[A] / [←] Left</div>
            <div>[S] / [↓] Backward</div>
            <div>[D] / [→] Right</div>
            <div>[E] / [Space] Interact</div>
          </div>
        </div>

        {/* Mobile On-Screen Virtual D-Pad / Joystick */}
        <div className="sm:hidden flex items-center justify-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
          <button
            onPointerDown={() => { keysPressed.current['arrowleft'] = true; }}
            onPointerUp={() => { keysPressed.current['arrowleft'] = false; }}
            className="p-3 bg-slate-800 rounded-xl text-slate-200 active:bg-emerald-500 active:text-slate-950"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col gap-2">
            <button
              onPointerDown={() => { keysPressed.current['arrowup'] = true; }}
              onPointerUp={() => { keysPressed.current['arrowup'] = false; }}
              className="p-3 bg-slate-800 rounded-xl text-slate-200 active:bg-emerald-500 active:text-slate-950"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <button
              onPointerDown={() => { keysPressed.current['arrowdown'] = true; }}
              onPointerUp={() => { keysPressed.current['arrowdown'] = false; }}
              className="p-3 bg-slate-800 rounded-xl text-slate-200 active:bg-emerald-500 active:text-slate-950"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
          </div>
          <button
            onPointerDown={() => { keysPressed.current['arrowright'] = true; }}
            onPointerUp={() => { keysPressed.current['arrowright'] = false; }}
            className="p-3 bg-slate-800 rounded-xl text-slate-200 active:bg-emerald-500 active:text-slate-950"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Station Inspection Modal */}
        {activeStationModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="max-w-md w-full bg-[#0d1322] border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl font-mono text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="font-bold text-slate-100 uppercase">
                  Station Inspector // {activeStationModal.name}
                </span>
                <button
                  onClick={() => setActiveStationModal(null)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-black/50 rounded-xl border border-slate-800 text-slate-300">
                <div className="text-slate-500 mb-1">Hardware Status Diagnostics:</div>
                <div className={activeStationModal.isFaulty ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                  {activeStationModal.statusText}
                </div>
              </div>

              {activeStationModal.isFaulty ? (
                <button
                  onClick={() => {
                    handleRepairStation(activeStationModal.id);
                    setActiveStationModal(null);
                  }}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>REPAIR HARDWARE & ENABLE INTERFACE</span>
                </button>
              ) : activeStationModal.type === 'monitor' && missionState === 'repaired' ? (
                <button
                  onClick={() => {
                    handleVerifyMission();
                    setActiveStationModal(null);
                  }}
                  className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>RUN NOC CONNECTIVITY SWEEP (VERIFY)</span>
                </button>
              ) : (
                <button
                  onClick={() => setActiveStationModal(null)}
                  className="w-full py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
                >
                  Close Station Inspector
                </button>
              )}
            </div>
          </div>
        )}

        {/* Mission Complete Card */}
        {missionState === 'verified' && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3 font-mono text-xs animate-in fade-in">
            <div className="flex items-center gap-2 text-base font-bold text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <span>MISSION ACCOMPLISHED: NETWORK RESTORED</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300 pt-2">
              <div className="p-3 bg-black/40 rounded-xl">CONNECTIVITY: <span className="text-emerald-400 font-bold">✓ PASS</span></div>
              <div className="p-3 bg-black/40 rounded-xl">DEFAULT GATEWAY: <span className="text-emerald-400 font-bold">✓ UP</span></div>
              <div className="p-3 bg-black/40 rounded-xl">INTER-VLAN ROUTING: <span className="text-emerald-400 font-bold">✓ NOMINAL</span></div>
              <div className="p-3 bg-black/40 rounded-xl">PACKET DELIVERY: <span className="text-emerald-400 font-bold">✓ 100%</span></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
