import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ScrambleText, SplitText, ShinyText, RotatingText } from '@/components/motion/TextFX';
import { 
  Network, 
  Play, 
  Terminal, 
  ArrowRight, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Server, 
  Monitor, 
  Router as RouterIcon, 
  Layers,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Radio,
  Sliders,
  ChevronRight
} from 'lucide-react';
import { playSound } from '../../../lib/sound';

interface HeroProps {
  onExploreLab: () => void;
  onLaunchSimulator: () => void;
  onOpenDiagnostics: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreLab,
  onLaunchSimulator,
  onOpenDiagnostics,
}) => {
  const [pulseHop, setPulseHop] = useState(0);
  const [selectedHeroNode, setSelectedHeroNode] = useState<string>('pc1');

  // Cycle the simulated packet through the hero network topology
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseHop(prev => (prev + 1) % 4);
    }, 1300);
    return () => clearInterval(interval);
  }, []);

  const heroNodesData: Record<string, { title: string; ip: string; mac: string; role: string; details: string }> = {
    pc1: {
      title: 'Workstation PC1 (Engineering Lab)',
      ip: '192.168.1.10 /24',
      mac: '00:1A:2B:3C:4D:01',
      role: 'Client Endpoint (Originator)',
      details: 'Transmits ICMP Echo Requests and TCP sockets through Access Switch SW1 to Default Gateway 192.168.1.1.',
    },
    pc2: {
      title: 'Workstation PC2 (Faculty Station)',
      ip: '192.168.1.11 /24',
      mac: '00:1A:2B:3C:4D:02',
      role: 'Local LAN Partner',
      details: 'Connected to Switch SW1 Fa0/2. Used for local Layer 2 ARP resolution and intra-subnet ping benchmarks.',
    },
    sw1: {
      title: 'Catalyst 2960 Switch (SW1)',
      ip: 'Layer 2 Transparent Switch',
      mac: '00:0F:34:AA:11:01',
      role: 'Access Layer Ethernet Switch',
      details: 'ASIC-powered CAM table forwarding. Performs collision-free frame forwarding based on 48-bit destination MAC addresses.',
    },
    r1: {
      title: 'Cisco 2911 Core Router (R1)',
      ip: 'G0/0: 192.168.1.1 | G0/1: 192.168.2.1',
      mac: '00:E0:F9:11:22:01',
      role: 'Inter-VLAN Default Gateway',
      details: 'Performs Layer 3 route lookup, decrements IP TTL by 1, recomputes IP checksum, and rewrites Layer 2 MAC headers.',
    },
    server: {
      title: 'Enterprise Server Farm',
      ip: '192.168.2.10 /24',
      mac: '00:50:56:FE:ED:01',
      role: 'Service Host (DNS & HTTP)',
      details: 'Hosts authoritative DNS service (UDP Port 53) and Apache Web Daemon (TCP Port 80) in the remote DMZ subnet.',
    },
  };

  const currentNode = heroNodesData[selectedHeroNode] || heroNodesData['pc1'];

  return (
    <div className="relative pt-6 pb-16 overflow-hidden">
      {/* Background Decorative Lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-10">
        {/* Curricular Metadata Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOMAIYA VIRTUAL LABS // NETWORK DESIGN & DIAGNOSIS SYSTEM</span>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>IEEE 802.3 Ethernet</span>
            </span>
            <span>•</span>
            <span>RFC 793 TCP/IP Suite</span>
            <span>•</span>
            <span className="text-emerald-400">Deterministic Engine</span>
          </div>
        </div>

        {/* Hero Headline & Interactive Topology Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column: Academic Titles & Narrative */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-3">
              <div className="text-xs sm:text-sm font-mono tracking-widest text-emerald-400 uppercase font-semibold">
                <ScrambleText text="Autonomous Computer Engineering Curriculum" duration={900} />
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 font-display leading-[1.12]">
                <SplitText text="INTELLIGENT NETWORK DESIGN," /> <br className="hidden sm:block" />
                <motion.span
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ShinyText>SIMULATION & FAULT DIAGNOSIS</ShinyText>
                </motion.span>{' '}
                <SplitText text="SYSTEM" delay={0.9} />
              </h1>
              <p className="flex flex-wrap items-baseline gap-x-2 text-base sm:text-lg text-slate-400">
                <span>Built to</span>
                <RotatingText
                  className="font-semibold text-emerald-400"
                  words={['design networks', 'simulate packet flow', 'inject faults', 'trace the rogue packet', 'diagnose failures', 'verify recovery']}
                />
              </p>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl border-l-2 border-emerald-500/40 pl-4 py-1">
              An intelligent system for designing networks, simulating how packets move through them, and diagnosing what breaks. Build hierarchical LANs, watch real packet decapsulation, isolate faults with CLI tools, and verify the network recovers.
            </p>

            {/* Core Workflow Strip */}
            <div className="bg-[#141311]/90 border border-slate-800 rounded-2xl p-4 max-w-2xl shadow-xl">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>The design → diagnose loop</span>
                <span className="text-emerald-400 font-bold">Deterministic Simulation</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-emerald-300">
                  <div className="text-[10px] text-slate-500">01</div>
                  DESIGN
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-cyan-300">
                  <div className="text-[10px] text-slate-500">02</div>
                  SIMULATE
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-indigo-300">
                  <div className="text-[10px] text-slate-500">03</div>
                  OBSERVE
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-amber-300">
                  <div className="text-[10px] text-slate-500">04</div>
                  DIAGNOSE
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-rose-300">
                  <div className="text-[10px] text-slate-500">05</div>
                  REPAIR
                </div>
                <div className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800/80 text-emerald-400 font-bold">
                  <div className="text-[10px] text-slate-500">06</div>
                  VERIFY
                </div>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  playSound('success');
                  onExploreLab();
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm font-mono transition-all shadow-[0_0_20px_rgba(255,95,31,0.3)] active:scale-95 cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>EXPLORE THE SYSTEM</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  onLaunchSimulator();
                }}
                className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold font-mono text-xs sm:text-sm transition-all hover:border-emerald-500/40 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                <span>LAUNCH SIMULATOR</span>
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  onOpenDiagnostics();
                }}
                className="flex items-center gap-2 px-4 py-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono text-xs transition-all hover:text-amber-300 cursor-pointer"
              >
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>DIAGNOSTIC CLI</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Interactive Topology Monitor */}
          <div className="lg:col-span-5">
            <div className="bg-[#151412] border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                    Interactive Topology Schematic
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Status: 100% Nominal
                </span>
              </div>

              {/* Topology Node Graph with Clickable Nodes */}
              <div className="relative py-2 flex flex-col items-center gap-4">
                {/* Layer 1: PC1 and PC2 */}
                <div className="grid grid-cols-2 gap-6 w-full max-w-xs">
                  {/* PC1 */}
                  <div 
                    onClick={() => {
                      playSound('click');
                      setSelectedHeroNode('pc1');
                    }}
                    className={`p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                      selectedHeroNode === 'pc1'
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(255,95,31,0.3)] ring-1 ring-emerald-400'
                        : pulseHop === 0
                        ? 'bg-emerald-500/10 border-emerald-500'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Monitor className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                    <div className="text-xs font-bold text-slate-200">PC1</div>
                    <div className="text-[10px] font-mono text-slate-400">192.168.1.10</div>
                  </div>

                  {/* PC2 */}
                  <div 
                    onClick={() => {
                      playSound('click');
                      setSelectedHeroNode('pc2');
                    }}
                    className={`p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                      selectedHeroNode === 'pc2'
                        ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(255,95,31,0.3)] ring-1 ring-emerald-400'
                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Monitor className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                    <div className="text-xs font-bold text-slate-200">PC2</div>
                    <div className="text-[10px] font-mono text-slate-400">192.168.1.11</div>
                  </div>
                </div>

                {/* Connecting Lines */}
                <div className="w-48 h-4 relative flex justify-center">
                  <svg className="w-full h-full" viewBox="0 0 200 16">
                    <line x1="50" y1="0" x2="100" y2="16" stroke="#41403e" strokeWidth="2" />
                    <line x1="150" y1="0" x2="100" y2="16" stroke="#41403e" strokeWidth="2" />
                    {pulseHop === 0 && (
                      <circle cx="75" cy="8" r="3.5" fill="#ff5f1f" className="animate-pulse" />
                    )}
                  </svg>
                </div>

                {/* Switch SW1 */}
                <div 
                  onClick={() => {
                    playSound('click');
                    setSelectedHeroNode('sw1');
                  }}
                  className={`w-full max-w-xs p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                    selectedHeroNode === 'sw1'
                      ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-400'
                      : pulseHop === 1
                      ? 'bg-cyan-500/10 border-cyan-500'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-0.5">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">SW1 (Catalyst 2960)</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">Layer 2 Switch • FastEthernet</div>
                </div>

                {/* Link to Router */}
                <div className="w-1 h-5 bg-slate-800 relative">
                  {pulseHop === 1 && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Router R1 */}
                <div 
                  onClick={() => {
                    playSound('click');
                    setSelectedHeroNode('r1');
                  }}
                  className={`w-full max-w-xs p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                    selectedHeroNode === 'r1'
                      ? 'bg-indigo-500/20 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] ring-1 ring-indigo-400'
                      : pulseHop === 2
                      ? 'bg-indigo-500/10 border-indigo-500'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-0.5">
                    <RouterIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">R1 (Gateway Router)</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">G0/0: 192.168.1.1 ⟷ G0/1: 192.168.2.1</div>
                </div>

                {/* Link to Server */}
                <div className="w-1 h-5 bg-slate-800 relative">
                  {pulseHop === 2 && (
                    <div className="w-2 h-2 rounded-full bg-indigo-400 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Server */}
                <div 
                  onClick={() => {
                    playSound('click');
                    setSelectedHeroNode('server');
                  }}
                  className={`w-full max-w-xs p-3 rounded-2xl border transition-all text-center cursor-pointer ${
                    selectedHeroNode === 'server'
                      ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_15px_rgba(255,95,31,0.3)] ring-1 ring-emerald-400'
                      : pulseHop === 3
                      ? 'bg-emerald-500/15 border-emerald-400'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2 mb-0.5">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">ENTERPRISE SERVER</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">192.168.2.10 • DNS & HTTP Port 80</div>
                </div>
              </div>

              {/* Dynamic Node Telemetry Card */}
              <div className="mt-4 p-3.5 rounded-xl bg-black/60 border border-slate-800 font-mono text-xs space-y-1.5 animate-in fade-in">
                <div className="flex items-center justify-between text-slate-400 pb-1 border-b border-slate-800">
                  <span className="text-emerald-400 font-bold">{currentNode.title}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                    {currentNode.role}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-300">
                  <span>IP: {currentNode.ip}</span>
                  <span>MAC: {currentNode.mac}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed pt-0.5">
                  {currentNode.details}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
