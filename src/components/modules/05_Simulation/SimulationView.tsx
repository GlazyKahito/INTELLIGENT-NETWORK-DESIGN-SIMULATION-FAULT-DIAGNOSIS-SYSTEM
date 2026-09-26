import React, { useState, useEffect, useRef } from 'react';
import { ScrambleText, SplitText, CountUp } from '@/components/motion/TextFX';
import { 
  Play, 
  RotateCcw, 
  Search, 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Send, 
  Zap, 
  ShieldCheck, 
  Terminal,
  Monitor,
  Laptop,
  Cpu,
  Router as RouterIcon,
  Server,
  ArrowRight,
  Gauge,
  Pause,
  Sliders
} from 'lucide-react';
import { NetworkDevice, NetworkLink, SimulatedPacket, NetworkProtocol } from '../../../types/network';
import { findNetworkPath } from '../../../lib/network/routing';
import { PacketInspectorModal } from './PacketInspectorModal';
import { playSound } from '../../../lib/sound';

interface SimulationViewProps {
  devices: NetworkDevice[];
  links: NetworkLink[];
  onOpenDiagnostics: () => void;
}

export const SimulationView: React.FC<SimulationViewProps> = ({
  devices,
  links,
  onOpenDiagnostics,
}) => {
  const hostDevices = devices.filter(d => d.type !== 'switch');
  const [sourceId, setSourceId] = useState<string>(hostDevices[0]?.id || 'dev-pc1');
  const [targetId, setTargetId] = useState<string>(hostDevices[hostDevices.length - 1]?.id || 'dev-server');
  const [protocol, setProtocol] = useState<NetworkProtocol>('ICMP');
  const [speed, setSpeed] = useState<number>(700); // ms per hop

  // Simulation execution state
  const [isSimulating, setIsSimulating] = useState(false);
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [currentPacket, setCurrentPacket] = useState<SimulatedPacket | null>(null);
  const [inspectedPacket, setInspectedPacket] = useState<SimulatedPacket | null>(null);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [stats, setStats] = useState({ sent: 0, received: 0, lost: 0, latency: 0 });
  const [currentHop, setCurrentHop] = useState(0);

  const handleStartSimulation = () => {
    if (isSimulating) return;

    const src = devices.find(d => d.id === sourceId);
    const tgt = devices.find(d => d.id === targetId);
    if (!src || !tgt) return;

    playSound('packet');
    setIsSimulating(true);
    setCurrentHop(0);

    // Resolve path using routing engine
    const route = findNetworkPath(sourceId, targetId, devices, links);

    const newPacket: SimulatedPacket = {
      id: `pkt-${Date.now().toString(36)}`,
      sourceDeviceId: sourceId,
      targetDeviceId: targetId,
      protocol,
      l2: {
        sourceMac: src.interfaces[0]?.macAddress || '00:1A:2B:3C:4D:01',
        destMac: '00:E0:F9:11:22:01',
        etherType: '0x0800 (IPv4)',
      },
      l3: {
        sourceIP: src.interfaces[0]?.ipAddress || '192.168.1.10',
        destIP: tgt.interfaces[0]?.ipAddress || '192.168.2.10',
        protocol,
        ttl: 64,
        totalLength: protocol === 'TCP' ? 60 : 32,
        identification: Math.floor(Math.random() * 65535),
        flags: { df: true, mf: false },
      },
      l4: protocol === 'TCP' ? {
        sourcePort: 49210,
        destPort: 80,
        seqNumber: 100,
        ackNumber: 101,
        flags: { syn: true, ack: false, fin: false, rst: false, psh: false, urg: false },
        windowSize: 64240,
        checksum: '0x4A1E',
      } : protocol === 'UDP' ? {
        sourcePort: 58102,
        destPort: 53,
        length: 32,
        checksum: '0x9B2C',
      } : undefined,
      payload: 'abcdefghijklmnopqrstuvwabcdefghi',
      status: 'transmitting',
      timestamp: Date.now(),
      currentHopIndex: 0,
      path: route.path,
    };

    setCurrentPacket(newPacket);
    setStats(prev => ({ ...prev, sent: prev.sent + 1 }));

    // Animate across path hops
    const totalHops = route.path.length;
    let hopIndex = 0;

    const stepInterval = setInterval(() => {
      hopIndex++;
      if (hopIndex < totalHops) {
        playSound('packet');
        setCurrentHop(hopIndex);
        setCurrentPacket(prev => prev ? { ...prev, currentHopIndex: hopIndex } : null);
      } else {
        clearInterval(stepInterval);
        setIsSimulating(false);

        if (route.success) {
          playSound('success');
          const rtt = Math.max(1, (route.path.length - 1) * 2);
          setStats(prev => ({
            ...prev,
            received: prev.received + 1,
            latency: rtt,
          }));
          setCurrentPacket(prev => prev ? { ...prev, status: 'received' } : null);
          setSimulationLog(prev => [
            `[PASS] ${protocol} frame received at ${tgt.name} (${rtt}ms RTT, TTL=${route.ttl})`,
            ...prev.slice(0, 5),
          ]);
        } else {
          playSound('alert');
          setStats(prev => ({
            ...prev,
            lost: prev.lost + 1,
            latency: 0,
          }));
          setCurrentPacket(prev => prev ? { ...prev, status: 'dropped', dropReason: route.failureReason } : null);
          setSimulationLog(prev => [
            `[DROP] Packet dropped at hop ${hopIndex}: ${route.failureReason}`,
            ...prev.slice(0, 5),
          ]);
        }
      }
    }, speed);
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'pc': return Monitor;
      case 'laptop': return Laptop;
      case 'switch': return Cpu;
      case 'router': return RouterIcon;
      case 'server': return Server;
      default: return Monitor;
    }
  };

  // Calculate packet dot position on canvas
  let packetPos = { x: -100, y: -100 };
  if (currentPacket && currentPacket.path.length > 0) {
    const currentDev = devices.find(d => d.id === currentPacket.path[currentHop]);
    if (currentDev) {
      packetPos = { x: currentDev.x + 56, y: currentDev.y + 44 };
    }
  }

  return (
    <section className="py-10 bg-[#0c0b09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
              <ScrambleText text={"Simulation Engine // Real-Time Packet Stream"} />
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              <SplitText text={"Network Packet Simulation & Traffic Analyzer"} />
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Simulate ICMP Echo Requests, TCP handshakes, or UDP datagrams. Inspect headers at each hop.
            </p>
          </div>

          <button
            onClick={() => {
              playSound('click');
              onOpenDiagnostics();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold transition-all shrink-0 cursor-pointer shadow-sm"
          >
            <Terminal className="w-4 h-4" />
            <span>Open Diagnostic Engine →</span>
          </button>
        </div>

        {/* Controller Bar */}
        <div className="p-5 bg-[#151412] border border-slate-800 rounded-3xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Source select */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 font-semibold">Source:</span>
              <select
                value={sourceId}
                onChange={e => setSourceId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans text-xs cursor-pointer"
              >
                {hostDevices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.interfaces[0]?.ipAddress || 'no-ip'})
                  </option>
                ))}
              </select>
            </div>

            {/* Target select */}
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-slate-400 font-semibold">Destination:</span>
              <select
                value={targetId}
                onChange={e => setTargetId(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans text-xs cursor-pointer"
              >
                {hostDevices.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.interfaces[0]?.ipAddress || 'no-ip'})
                  </option>
                ))}
              </select>
            </div>

            {/* Protocol select */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              {(['ICMP', 'TCP', 'UDP'] as NetworkProtocol[]).map(p => (
                <button
                  key={p}
                  onClick={() => {
                    playSound('click');
                    setProtocol(p);
                  }}
                  className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                    protocol === p ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Speed select */}
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono bg-slate-950 p-1 rounded-xl border border-slate-800 text-slate-400">
              <span className="px-2 text-[10px] text-slate-500">Speed:</span>
              <button
                onClick={() => setSpeed(1100)}
                className={`px-2 py-0.5 rounded ${speed === 1100 ? 'bg-slate-800 text-emerald-400 font-bold' : ''}`}
              >
                0.5x
              </button>
              <button
                onClick={() => setSpeed(700)}
                className={`px-2 py-0.5 rounded ${speed === 700 ? 'bg-slate-800 text-emerald-400 font-bold' : ''}`}
              >
                1.0x
              </button>
              <button
                onClick={() => setSpeed(350)}
                className={`px-2 py-0.5 rounded ${speed === 350 ? 'bg-slate-800 text-emerald-400 font-bold' : ''}`}
              >
                2.0x
              </button>
            </div>
          </div>

          {/* Trigger Button */}
          <button
            onClick={handleStartSimulation}
            disabled={isSimulating}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold font-mono text-xs transition-all shadow-xl cursor-pointer ${
              isSimulating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(255,95,31,0.35)] active:scale-95'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{isSimulating ? 'PACKET IN FLIGHT...' : `TRANSMIT ${protocol} PACKET`}</span>
          </button>
        </div>

        {/* Live Simulation Topology Canvas */}
        <div className="relative w-full h-[520px] bg-[#0f0e0c] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl select-none tech-dot-bg">
          {/* SVG Links */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            {links.map(link => {
              const src = devices.find(d => d.id === link.sourceDeviceId);
              const tgt = devices.find(d => d.id === link.targetDeviceId);
              if (!src || !tgt) return null;

              const x1 = src.x + 56;
              const y1 = src.y + 44;
              const x2 = tgt.x + 56;
              const y2 = tgt.y + 44;
              const isDown = link.status === 'down';

              return (
                <g key={link.id}>
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isDown ? '#f43f5e' : '#ff5f1f'}
                    strokeWidth="4"
                    strokeOpacity="0.2"
                  />
                  <line
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke={isDown ? '#f43f5e' : '#ff5f1f'}
                    strokeWidth="2.5"
                    strokeDasharray={isDown ? '5' : 'none'}
                  />
                  {/* Idle keep-alive traffic so the network reads as live before you run anything */}
                  {!isDown && !isSimulating && !reduceMotion && (
                    <circle r="2.5" fill="#ffa370" opacity="0.7">
                      <animateMotion dur={`${2.4 + (link.id.length % 5) * 0.45}s`} repeatCount="indefinite" path={`M${x1},${y1} L${x2},${y2}`} />
                    </circle>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Animated Traveling Packet Token */}
          {currentPacket && (
            <div
              style={{
                left: `${packetPos.x}px`,
                top: `${packetPos.y}px`,
                transform: 'translate(-50%, -50%)',
              }}
              onClick={() => {
                playSound('click');
                setInspectedPacket(currentPacket);
              }}
              className="absolute z-30 cursor-pointer animate-bounce transition-all duration-500"
            >
              <div className="relative">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-slate-950 font-bold shadow-2xl ${
                  protocol === 'TCP' ? 'bg-cyan-400 shadow-[0_0_20px_#06b6d4]' : protocol === 'UDP' ? 'bg-amber-400 shadow-[0_0_20px_#f59e0b]' : 'bg-emerald-400 shadow-[0_0_20px_#ff5f1f]'
                }`}>
                  <Zap className="w-4 h-4 fill-current" />
                </div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-black/90 text-emerald-300 border border-emerald-500/40 rounded-lg text-[9px] font-mono whitespace-nowrap shadow-lg">
                  Click to Inspect
                </span>
              </div>
            </div>
          )}

          {/* Device Nodes */}
          {devices.map(device => {
            const Icon = getDeviceIcon(device.type);
            const isSource = device.id === sourceId;
            const isTarget = device.id === targetId;
            const isCurrentHop = currentPacket && currentPacket.path[currentHop] === device.id;
            const primaryIface = device.interfaces[0];

            return (
              <div
                key={device.id}
                style={{
                  transform: `translate(${device.x}px, ${device.y}px)`,
                }}
                className={`absolute top-0 left-0 w-32 sm:w-36 p-3 rounded-2xl border transition-all z-10 ${
                  isCurrentHop
                    ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_25px_rgba(255,95,31,0.5)] scale-105'
                    : isSource
                    ? 'bg-slate-900 border-cyan-500/80 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : isTarget
                    ? 'bg-slate-900 border-indigo-500/80 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-[#151412]/95 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className={`w-2 h-2 rounded-full ${primaryIface?.isUp ? 'bg-emerald-400' : 'bg-rose-500'}`} />
                  {isSource && <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold">SRC</span>}
                  {isTarget && <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold">DST</span>}
                </div>

                <div className="flex flex-col items-center text-center">
                  <Icon className="w-5 h-5 mb-1 text-slate-300" />
                  <span className="text-xs font-bold text-slate-200 truncate w-full">
                    {device.name}
                  </span>
                  {primaryIface?.ipAddress && (
                    <span className="text-[10px] font-mono text-emerald-400 truncate w-full font-semibold">
                      {primaryIface.ipAddress}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Metrics & Forwarding Status Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-[#151412] border border-slate-800 text-xs font-mono shadow-xl">
            <div className="text-slate-400 uppercase text-[10px] font-semibold">Round-Trip Latency (RTT)</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.latency} ms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Wire Transmission Delay</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#151412] border border-slate-800 text-xs font-mono shadow-xl">
            <div className="text-slate-400 uppercase text-[10px] font-semibold">Packet Loss Rate</div>
            <div className={`text-2xl font-bold mt-1 ${stats.lost > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats.sent > 0 ? `${Math.round((stats.lost / stats.sent) * 100)}%` : '0%'}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">{stats.lost} dropped of {stats.sent} sent</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#151412] border border-slate-800 text-xs font-mono shadow-xl">
            <div className="text-slate-400 uppercase text-[10px] font-semibold">Active L4 Protocol</div>
            <div className="text-2xl font-bold text-cyan-400 mt-1">{protocol}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Layer 4 Multiplexing</div>
          </div>

          <div className="p-5 rounded-2xl bg-[#151412] border border-slate-800 text-xs font-mono flex items-center justify-between shadow-xl">
            <div>
              <div className="text-slate-400 uppercase text-[10px] font-semibold">Wireshark Tap</div>
              <div className="text-xs font-bold text-slate-200 mt-1">Deep Inspection</div>
            </div>
            <button
              onClick={() => {
                if (currentPacket) {
                  playSound('click');
                  setInspectedPacket(currentPacket);
                }
              }}
              disabled={!currentPacket}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-mono disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Dissect</span>
            </button>
          </div>
        </div>

        {/* Live Event Log */}
        {simulationLog.length > 0 && (
          <div className="p-4 rounded-2xl bg-[#12110f] border border-slate-800 font-mono text-xs space-y-1.5 shadow-xl">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-semibold">
              Packet Event Log:
            </div>
            {simulationLog.map((log, idx) => (
              <div key={idx} className={log.includes('[DROP]') ? 'text-rose-400' : 'text-emerald-400'}>
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Deep Packet Inspector Modal */}
        <PacketInspectorModal
          packet={inspectedPacket}
          isOpen={!!inspectedPacket}
          onClose={() => setInspectedPacket(null)}
        />
      </div>
    </section>
  );
};
