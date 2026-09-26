import React, { useState } from 'react';
import { 
  Network, 
  Volume2, 
  VolumeX, 
  Layers, 
  CheckCircle, 
  Play, 
  Terminal, 
  Activity, 
  HelpCircle, 
  Gamepad2,
  BookOpen,
  Award
} from 'lucide-react';
import { playSound, toggleAudioMute, getAudioMuteState } from '../../lib/sound';

interface HeaderProps {
  activeModule: string;
  setActiveModule: (module: string) => void;
  openWorksModal: () => void;
  progressPercent: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeModule,
  setActiveModule,
  openWorksModal,
  progressPercent,
}) => {
  const [isMuted, setIsMuted] = useState(getAudioMuteState());

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
    { id: 'minigame', label: '07 NOC Hunt', icon: Gamepad2 },
    { id: 'conclusion', label: '08 Report', icon: Award },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070a12]/95 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div 
          onClick={() => {
            playSound('click');
            setActiveModule('home');
          }}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]">
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
            <div className="text-sm font-semibold tracking-tight text-slate-100 group-hover:text-emerald-300 transition-colors hidden sm:block">
              Intelligent Network Simulator
            </div>
          </div>
        </div>

        {/* Desktop Quick Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-[#0b101c] p-1 rounded-lg border border-slate-800/80">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Action Tools: Progress, Audio, Works Hub */}
        <div className="flex items-center gap-3">
          {/* Progress Indicator */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 rounded-md border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Lab:</span>
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, progressPercent))}%` }}
              />
            </div>
            <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={handleMuteToggle}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Laboratory Audio"
            className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Works / Modules Launcher Button */}
          <button
            onClick={() => {
              playSound('click');
              openWorksModal();
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modules Hub</span>
          </button>
        </div>
      </div>
    </header>
  );
};
