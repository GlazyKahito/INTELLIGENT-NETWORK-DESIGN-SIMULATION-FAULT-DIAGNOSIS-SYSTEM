import React, { useEffect, useState } from 'react';
import { 
  Network, 
  Volume2, 
  VolumeX, 
  Layers, 
  Play, 
  Terminal, 
  Activity, 
  HelpCircle, 
  Gamepad2,
  BookOpen,
  Award,
  Maximize2,
  Radio
} from 'lucide-react';
import { playSound, toggleAudioMute, getAudioMuteState } from '../../lib/sound';

interface HeaderProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  openWorksModal: () => void;
  onOpenSandbox: () => void;
  progressPercent: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  setActiveModule,
  openWorksModal,
  onOpenSandbox,
  progressPercent,
}) => {
  const [isMuted, setIsMuted] = useState(getAudioMuteState());

  // Once the page scrolls, the bar lifts off the content and floats.
  const [floating, setFloating] = useState(false);
  useEffect(() => {
    const onScroll = () => setFloating(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleMuteToggle = () => {
    const next = toggleAudioMute();
    setIsMuted(next);
    if (!next) playSound('click');
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: Network },
    { id: 'aim', label: '01 Aim', icon: BookOpen },
    { id: 'theory', label: '02 Theory', icon: HelpCircle },
    { id: 'design', label: '03 Design', icon: Layers },
    { id: 'simulation', label: '04 Simulate', icon: Play },
    { id: 'diagnostics', label: '05 Faults', icon: Terminal },
    { id: 'assessments', label: '06 Assessment', icon: Activity },
    { id: 'minigame', label: '07 Game', icon: Gamepad2 },
    { id: 'conclusion', label: '08 Report', icon: Award },
  ];

  return (
    <header
      className={`sticky top-0 z-40 w-full backdrop-blur-xl border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        floating
          ? 'bg-[#070a12]/80 border-slate-700/70 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.9)]'
          : 'bg-[#070a12]/90 border-slate-800/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div 
          onClick={() => {
            playSound('click');
            setActiveModule('home');
          }}
          className="flex items-center gap-3 cursor-pointer select-none group shrink-0 whitespace-nowrap"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 group-hover:border-emerald-400 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                Somaiya DCN Lab
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700/60 font-mono">
                v2.4
              </span>
            </div>
            <div className="text-xs font-semibold tracking-tight text-slate-200 group-hover:text-emerald-300 transition-colors hidden sm:block">
              Intelligent Network Simulator
            </div>
          </div>
        </div>

        {/* Desktop Quick Navigation Links */}
        <nav className="hidden xl:flex items-center gap-0.5 min-w-0 bg-[#0b101c]/80 p-1 rounded-xl border border-slate-800/90 shadow-inner">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeModule === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playSound('click');
                  setActiveModule(item.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap border transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(59,130,246,0.2)] font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 hidden 2xl:block" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Tools: Progress, Audio, Sandbox, Works Hub */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Telemetry Status Ticker */}
          <div className="hidden lg:flex xl:hidden 2xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>KERNEL: ONLINE</span>
          </div>

          {/* Progress Indicator */}
          <div className="hidden md:flex xl:hidden 2xl:flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 rounded-lg border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Progress:</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
              />
            </div>
            <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
          </div>

          {/* Fullscreen Sandbox Trigger Button */}
          <button
            onClick={() => {
              playSound('click');
              onOpenSandbox();
            }}
            title="Launch Fullscreen Lab Sandbox (Shortcut: F)"
            aria-label="Open fullscreen lab sandbox (F)"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-mono transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline xl:hidden 2xl:inline">Sandbox</span>
            <kbd className="text-[9px] px-1 bg-black/40 rounded text-slate-400 border border-slate-700/60">F</kbd>
          </button>

          {/* Sound Synthesizer Audio Toggle */}
          <button
            onClick={handleMuteToggle}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Laboratory Audio"
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Works / Modules Launcher Button */}
          <button
            onClick={() => {
              playSound('click');
              openWorksModal();
            }}
            aria-label="Open modules hub (M)"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] active:scale-95 cursor-pointer font-mono"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hub</span>
            <kbd className="text-[10px] px-1.5 py-0.2 bg-black/20 rounded text-slate-950">M</kbd>
          </button>
        </div>
      </div>
    </header>
  );
};
