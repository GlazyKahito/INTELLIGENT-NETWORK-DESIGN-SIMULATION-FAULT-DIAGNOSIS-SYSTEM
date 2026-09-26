import React, { useState, useEffect } from 'react';
import { 
  Network, 
  ArrowRight, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Layers, 
  Play, 
  Zap, 
  CheckCircle2, 
  ChevronRight,
  Volume2,
  VolumeX,
  Clock,
  Compass,
  Gamepad2,
  Cpu,
  Radio
} from 'lucide-react';
import { IntroLiveBackground } from './IntroLiveBackground';
import { playSound, toggleAudioMute, getAudioMuteState } from '../../lib/sound';

interface CinematicIntroProps {
  onEnter: (targetModule?: string) => void;
}

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onEnter }) => {
  const [isExiting, setIsExiting] = useState(false);
  const [pulseIndex, setPulseIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(getAudioMuteState());
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour12: false }) + ' UTC');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex(prev => (prev + 1) % 4);
    }, 1100);
    return () => clearInterval(interval);
  }, []);

  const handleStart = (moduleTarget = 'home') => {
    playSound('success');
    setIsExiting(true);
    setTimeout(() => {
      onEnter(moduleTarget);
    }, 550);
  };

  const handleToggleSound = () => {
    const next = toggleAudioMute();
    setIsMuted(next);
    if (!next) {
      playSound('click');
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStart('home');
      } else if (e.key === '1') {
        e.preventDefault();
        handleStart('design');
      } else if (e.key === '2') {
        e.preventDefault();
        handleStart('faults');
      } else if (e.key === '3') {
        e.preventDefault();
        handleStart('minigame');
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const readinessChecks = [
    { label: 'Discrete Packet Engine', status: 'Active (60 FPS)', icon: Play },
    { label: 'Diagnostic Reasoner', status: 'Armed (10 Faults)', icon: Terminal },
    { label: 'Protocol Stack L1–L4', status: 'RFC 791/793/768', icon: ShieldCheck },
    { label: 'NOC Floor Simulation', status: 'Online (5 Scenarios)', icon: Activity },
  ];

  return (
    <div className={`fixed inset-0 z-50 bg-[#06090e] flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 font-sans overflow-y-auto sm:overflow-hidden transition-all duration-700 select-none ${
      isExiting ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
    }`}>
      {/* 1. Interactive Live Mesh & Packet Transit Background */}
      <IntroLiveBackground />

      {/* 2. Top Header HUD with Institutional Identifier, Live Clock, and Controls */}
      <div className="w-full flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase flex items-center gap-2">
              <span>SOMAIYA VIRTUAL LABS</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block" />
              <span className="text-[10px] text-slate-500 font-normal hidden sm:inline-block">DCN LAB 404</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Department of Computer Engineering • Mumbai
            </div>
          </div>
        </div>

        {/* Center Live Clock & System Status */}
        <div className="hidden md:flex items-center gap-4 px-4 py-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 backdrop-blur-md font-mono text-[11px]">
          <div className="flex items-center gap-2 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{currentTime || '00:00:00 UTC'}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold">KERNEL DETERMINISTIC</span>
          </div>
        </div>

        {/* Right Action Icons: Sound Mute & Skip */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleSound}
            title={isMuted ? 'Unmute Audio (M)' : 'Mute Audio (M)'}
            className="p-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition-colors backdrop-blur-md cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={() => handleStart('home')}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 px-3.5 py-2 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 flex items-center gap-1.5 transition-colors backdrop-blur-md cursor-pointer"
          >
            <span>Skip Intro</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Center Glassmorphic Presentation Console */}
      <div className="max-w-4xl w-full text-center relative z-20 my-auto py-4 space-y-6 animate-in fade-in zoom-in-95 duration-500">
        {/* Curricular Badge */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono tracking-wider shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold">EXPERIMENT 08 CAPSTONE // ACADEMIC VIRTUAL LAB</span>
          <span className="text-slate-500 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">BLOOM'S L2–L6</span>
        </div>

        {/* Main Title */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 font-display tracking-tight leading-[1.12]">
            INTELLIGENT NETWORK DESIGN, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
              SIMULATION & FAULT DIAGNOSIS
            </span>
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed font-sans px-2">
            A production-quality virtual laboratory to architect multi-hop IP networks, observe packet decapsulation at wire speed, isolate empirical faults, and verify complete restoration.
          </p>
        </div>

        {/* Interactive 4-Phase Protocol Cycle Pill */}
        <div className="max-w-xl mx-auto p-2.5 rounded-2xl bg-[#090e1a]/85 border border-slate-800/90 shadow-2xl backdrop-blur-md">
          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
            <div className={`p-2 rounded-xl border transition-all ${
              pulseIndex === 0 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
            }`}>
              <div className="text-[9px] text-slate-500">L1 - L2</div>
              <div className="font-bold mt-0.5">DESIGN</div>
            </div>

            <div className={`p-2 rounded-xl border transition-all ${
              pulseIndex === 1 ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]' : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
            }`}>
              <div className="text-[9px] text-slate-500">L3 - L4</div>
              <div className="font-bold mt-0.5">SIMULATE</div>
            </div>

            <div className={`p-2 rounded-xl border transition-all ${
              pulseIndex === 2 ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]' : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
            }`}>
              <div className="text-[9px] text-slate-500">CLI & ENGINE</div>
              <div className="font-bold mt-0.5">DIAGNOSE</div>
            </div>

            <div className={`p-2 rounded-xl border transition-all ${
              pulseIndex === 3 ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]' : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
            }`}>
              <div className="text-[9px] text-slate-500">RFC AUDIT</div>
              <div className="font-bold mt-0.5">RECOVER</div>
            </div>
          </div>
        </div>

        {/* Readiness Micro-Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mx-auto text-left">
          {readinessChecks.map((item, idx) => (
            <div key={idx} className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/90 backdrop-blur-md text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-emerald-400 mb-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold text-slate-200 truncate">{item.label}</span>
              </div>
              <div className="text-[10px] text-slate-400 pl-5">{item.status}</div>
            </div>
          ))}
        </div>

        {/* Primary Enter Action Button */}
        <div className="pt-2 flex flex-col items-center gap-3">
          <button
            onClick={() => handleStart('home')}
            className="group relative inline-flex items-center gap-3 px-9 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-sm sm:text-base transition-all duration-200 shadow-[0_0_30px_rgba(16,185,129,0.45)] hover:shadow-[0_0_40px_rgba(16,185,129,0.65)] hover:-translate-y-0.5 active:scale-95 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-slate-950 shrink-0" />
            <span>START GUIDED LAB CURRICULUM</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
          </button>

          {/* Quick-Jump Entry Launchpad Modes */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-xs">
            <span className="text-[11px] text-slate-400 mr-1 hidden sm:inline">Or Jump Directly:</span>
            
            <button
              onClick={() => handleStart('design')}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-cyan-500/20 text-slate-300 hover:text-cyan-300 border border-slate-800 hover:border-cyan-500/50 transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>CAD Designer [1]</span>
            </button>

            <button
              onClick={() => handleStart('faults')}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-800 hover:border-amber-500/50 transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span>Fault Diagnosis [2]</span>
            </button>

            <button
              onClick={() => handleStart('minigame')}
              className="px-3 py-1.5 rounded-xl bg-slate-950/80 hover:bg-purple-500/20 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-500/50 transition-all flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
            >
              <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
              <span>NOC Room 2.0 [3]</span>
            </button>
          </div>

          <span className="text-[10px] font-mono text-slate-400 mt-1">
            Press <kbd className="px-1.5 py-0.5 bg-slate-900 rounded text-slate-300 border border-slate-700">Enter</kbd> to launch • Click anywhere on background to ping mesh
          </span>
        </div>
      </div>

      {/* 4. Bottom Engineering Footer Bar */}
      <div className="w-full flex items-center justify-between text-[11px] font-mono text-slate-400 z-20 border-t border-slate-800/80 pt-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 font-bold">RFC 791 / RFC 793 / RFC 768 COMPLIANT</span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">STRICT DISCRETE EVENT SIMULATION</span>
        </div>

        <div className="text-slate-400 text-right">
          <span>K.J. SOMAIYA COLLEGE OF ENGINEERING</span>
        </div>
      </div>
    </div>
  );
};
