import React, { useState, useEffect } from 'react';
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
  AlertTriangle
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

  // Cycle the simulated packet through the hero network topology
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseHop(prev => (prev + 1) % 4);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative pt-6 pb-16 overflow-hidden">
      {/* Background Grid & Decorative ambient glow */}
      <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Lab Metadata Banner */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOMAIYA VIRTUAL LABS // DCN EXPERIMENT 08</span>
          </div>
          <div className="hidden sm:inline-flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>IEEE 802.3 Ethernet</span>
            <span>•</span>
            <span>TCP/IP Protocol Suite</span>
            <span>•</span>
            <span>Deterministic Diagnostics</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Academic Titles & Call to Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <div className="text-xs sm:text-sm font-mono tracking-widest text-emerald-400 uppercase font-semibold">
                Computer Engineering & Information Technology
              </div>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-100 font-display leading-[1.1]">
                INTELLIGENT NETWORK DESIGN, <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                  SIMULATION & FAULT DIAGNOSIS
                </span> SYSTEM
              </h1>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl border-l-2 border-emerald-500/40 pl-4 py-1">
              An interactive Data Communication and Networking laboratory for designing networks, observing packet communication, identifying faults, and verifying corrective actions based on Experiments 1 through 7.
            </p>

            {/* Core Workflow Strip */}
            <div className="bg-[#0c1220]/90 border border-slate-800 rounded-xl p-3 max-w-2xl">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>The Experimental Learning Loop</span>
                <span className="text-emerald-400 font-semibold">Deterministic Simulation</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs font-mono">
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-emerald-300">
                  <div className="text-[10px] text-slate-500">01</div>
                  DESIGN
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-cyan-300">
                  <div className="text-[10px] text-slate-500">02</div>
                  SIMULATE
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-indigo-300">
                  <div className="text-[10px] text-slate-500">03</div>
                  OBSERVE
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-amber-300">
                  <div className="text-[10px] text-slate-500">04</div>
                  DIAGNOSE
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-rose-300">
                  <div className="text-[10px] text-slate-500">05</div>
                  REPAIR
                </div>
                <div className="p-2 bg-slate-900/80 rounded border border-slate-800/80 text-emerald-400 font-bold">
                  <div className="text-[10px] text-slate-500">06</div>
                  VERIFY
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  playSound('success');
                  onExploreLab();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95"
              >
                <Layers className="w-4 h-4" />
                <span>EXPLORE LAB & EXPERIMENTS</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  onLaunchSimulator();
                }}
                className="flex items-center gap-2 px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all hover:border-emerald-500/40 active:scale-95"
              >
                <Play className="w-4 h-4 text-emerald-400" />
                <span>LAUNCH SIMULATOR</span>
              </button>

              <button
                onClick={() => {
                  playSound('click');
                  onOpenDiagnostics();
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-300 border border-slate-800 font-mono text-xs transition-all hover:text-amber-300"
              >
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>DIAGNOSTIC TERMINAL</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Network Topology */}
          <div className="lg:col-span-5">
            <div className="bg-[#0d1322] border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-mono font-semibold text-slate-300 uppercase">
                    Live Topology Monitor
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Status: 100% Operational
                </span>
              </div>

              {/* Topology Visualizer Node Graph */}
              <div className="relative py-4 flex flex-col items-center gap-5">
                {/* Layer 1: PC1 and PC2 */}
                <div className="grid grid-cols-2 gap-8 w-full max-w-xs">
                  {/* PC1 */}
                  <div className={`p-3 rounded-xl border transition-all text-center ${
                    pulseHop === 0 
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                      : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <Monitor className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
                    <div className="text-xs font-bold text-slate-200">PC1</div>
                    <div className="text-[10px] font-mono text-slate-400">192.168.1.10</div>
                  </div>

                  {/* PC2 */}
                  <div className="p-3 rounded-xl border bg-slate-900/90 border-slate-800 text-center">
                    <Monitor className="w-5 h-5 mx-auto mb-1 text-slate-400" />
                    <div className="text-xs font-bold text-slate-200">PC2</div>
                    <div className="text-[10px] font-mono text-slate-400">192.168.1.11</div>
                  </div>
                </div>

                {/* Connecting Links to Switch */}
                <div className="w-48 h-5 relative flex justify-center">
                  <svg className="w-full h-full" viewBox="0 0 200 20">
                    <line x1="50" y1="0" x2="100" y2="20" stroke="#334155" strokeWidth="2" />
                    <line x1="150" y1="0" x2="100" y2="20" stroke="#334155" strokeWidth="2" />
                    {pulseHop === 0 && (
                      <circle cx="75" cy="10" r="3.5" fill="#10b981" className="animate-pulse" />
                    )}
                  </svg>
                </div>

                {/* Switch SW1 */}
                <div className={`w-full max-w-xs p-3 rounded-xl border transition-all text-center ${
                  pulseHop === 1
                    ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-slate-200">SW1 (Catalyst 2960)</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">Layer 2 Switch • VLAN 10</div>
                </div>

                {/* Link to Router */}
                <div className="w-1 h-6 bg-slate-800 relative">
                  {pulseHop === 1 && (
                    <div className="w-2 h-2 rounded-full bg-cyan-400 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Router R1 */}
                <div className={`w-full max-w-xs p-3 rounded-xl border transition-all text-center ${
                  pulseHop === 2
                    ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                    : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <RouterIcon className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-slate-200">R1 (Gateway Router)</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">G0/0: 192.168.1.1 ⟷ G0/1: 192.168.2.1</div>
                </div>

                {/* Link to Server */}
                <div className="w-1 h-6 bg-slate-800 relative">
                  {pulseHop === 2 && (
                    <div className="w-2 h-2 rounded-full bg-indigo-400 absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2" />
                  )}
                </div>

                {/* Server */}
                <div className={`w-full max-w-xs p-3 rounded-xl border transition-all text-center ${
                  pulseHop === 3
                    ? 'bg-emerald-500/15 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'bg-slate-900/90 border-slate-800'
                }`}>
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-slate-200">ENTERPRISE SERVER</span>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">192.168.2.10 • DNS / HTTP</div>
                </div>
              </div>

              {/* Packet Inspection Quick Snippet */}
              <div className="mt-4 p-2.5 rounded-lg bg-black/50 border border-slate-800/80 font-mono text-[11px] text-slate-400">
                <div className="flex items-center justify-between text-slate-500 pb-1 mb-1 border-b border-slate-800">
                  <span>PACKET TRANSIT STREAM</span>
                  <span className="text-emerald-400">ICMP ECHO</span>
                </div>
                <div className="flex justify-between">
                  <span>SRC: 192.168.1.10</span>
                  <span>DST: 192.168.2.10</span>
                  <span>TTL: 63</span>
                  <span className="text-emerald-400">RTT: 2ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
