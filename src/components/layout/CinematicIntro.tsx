import React, { useState, useEffect } from 'react';
import { 
  Network, 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Terminal, 
  Activity, 
  Layers, 
  Play,
  Zap,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { playSound } from '../../lib/sound';

interface CinematicIntroProps {
  onEnter: () => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % 4);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    playSound('success');
    setIsExiting(true);
    setTimeout(() => {
      onEnter();
    }, 550);
  };

  // Keyboard shortcut: Press Enter or Space to begin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const readinessChecks = [
    { label: 'Discrete Packet Engine', status: 'Initialized', icon: Play },
    { label: 'Deterministic Diagnostic Reasoner', status: 'Armed (10 Faults)', icon: Terminal },
    { label: 'Experiments 01–07 Protocol Stack', status: 'Compiled', icon: ShieldCheck },
    { label: 'Virtual NOC Operations Floor', status: 'Online', icon: Activity },
  ];

  return (
    <div className={`fixed inset-0 z-50 bg-[#06090e] flex flex-col items-center justify-center p-4 sm:p-8 font-sans overflow-hidden transition-all duration-700 select-none ${
      isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
    }`}>
      {/* Background Animated CAD Grid and Radial Lighting */}
      <div className="absolute inset-0 tech-grid-bg opacity-30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[450px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Top Bar with Institutional Identifier & Skip */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              Somaiya Virtual Labs
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Department of Computer Engineering • DCN Lab 404
            </div>
          </div>
        </div>

        <button
          onClick={handleStart}
          className="text-xs font-mono text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 transition-colors"
        >
          <span>Skip Intro</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Cinematic Card */}
      <div className="max-w-3xl w-full text-center relative z-10 space-y-8 animate-in fade-in zoom-in-95 duration-500">
        {/* Curricular Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.15)]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>CAPSTONE EXPERIMENT 08 // ACADEMIC VIRTUAL LAB</span>
        </div>

        {/* Grand Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 font-display tracking-tight leading-[1.15]">
            INTELLIGENT NETWORK DESIGN, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              SIMULATION & FAULT DIAGNOSIS
            </span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans">
            A production-quality virtual laboratory to design multi-hop computer networks, observe discrete packet transit, isolate empirical faults, and verify network recovery.
          </p>
        </div>

        {/* Visual Schematic Diagram (Interactive Node Convergence) */}
        <div className="max-w-xl mx-auto p-4 rounded-2xl bg-[#0c1220]/90 border border-slate-800/90 shadow-2xl relative">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className={`p-2.5 rounded-xl border transition-all ${
              pulseIndex === 0 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}>
              <div className="text-[10px] text-slate-500">LAYER 1-2</div>
              <div className="font-bold mt-0.5">DESIGN</div>
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${
              pulseIndex === 1 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}>
              <div className="text-[10px] text-slate-500">LAYER 3-4</div>
              <div className="font-bold mt-0.5">SIMULATE</div>
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${
              pulseIndex === 2 ? 'bg-amber-500/20 border-amber-500 text-amber-300' : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}>
              <div className="text-[10px] text-slate-500">CLI & REASON</div>
              <div className="font-bold mt-0.5">DIAGNOSE</div>
            </div>

            <div className={`p-2.5 rounded-xl border transition-all ${
              pulseIndex === 3 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold' : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}>
              <div className="text-[10px] text-slate-500">VERIFY</div>
              <div className="font-bold mt-0.5">RECOVER</div>
            </div>
          </div>
        </div>

        {/* Readiness Checklist */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto text-left">
          {readinessChecks.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold text-slate-200 truncate">{item.label}</span>
              </div>
              <div className="text-[10px] text-slate-500 pl-5">{item.status}</div>
            </div>
          ))}
        </div>

        {/* Primary Enter Action Button */}
        <div className="pt-2 flex flex-col items-center gap-2">
          <button
            onClick={handleStart}
            className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-sm sm:text-base transition-all duration-200 shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_35px_rgba(16,185,129,0.6)] active:scale-95 cursor-pointer"
          >
            <span>ENTER VIRTUAL LABORATORY</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>
          <span className="text-[11px] font-mono text-slate-400">
            Press <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700">Enter</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300 border border-slate-700">Space</kbd> to launch
          </span>
        </div>
      </div>

      {/* Institutional Footer */}
      <div className="absolute bottom-5 text-center text-[11px] font-mono text-slate-400 z-20">
        AUTONOMOUS ENGINEERING CURRICULUM • STRICT DETERMINISTIC KERNEL
      </div>
    </div>
  );
};
