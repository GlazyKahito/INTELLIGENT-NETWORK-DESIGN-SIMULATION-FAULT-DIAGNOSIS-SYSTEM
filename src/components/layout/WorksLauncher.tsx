import React, { useEffect, useState } from 'react';
import { 
  X, 
  ArrowRight, 
  BookOpen, 
  HelpCircle, 
  Layers, 
  Play, 
  Terminal, 
  Activity, 
  Gamepad2, 
  Award, 
  Maximize2, 
  Home,
  CheckCircle2
} from 'lucide-react';
import { playSound } from '../../lib/sound';

interface WorksLauncherProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectModule: (moduleId: string) => void;
  activeModule: string;
  completedModules: Set<string>;
}

export const WorksLauncher: React.FC<WorksLauncherProps> = ({
  isOpen,
  onClose,
  onSelectModule,
  activeModule,
  completedModules,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const modules = [
    {
      id: 'home',
      num: '00',
      title: 'HOME & LABORATORY OVERVIEW',
      desc: 'System overview, live topology and what you can do in the lab.',
      icon: Home,
      tag: 'Overview',
    },
    {
      id: 'aim',
      num: '01',
      title: 'AIM & OBJECTIVES',
      desc: 'What the system is for and the outcomes you build towards.',
      icon: BookOpen,
      tag: 'Foundation',
    },
    {
      id: 'theory',
      num: '02',
      title: 'INTERACTIVE THEORY & CONCEPTS',
      desc: 'The foundations the system runs on: commands, cabling, TCP/UDP, subnetting and error detection.',
      icon: HelpCircle,
      tag: 'Foundations',
    },
    {
      id: 'design',
      num: '03',
      title: 'NETWORK DESIGN CANVAS',
      desc: 'Place PCs, Switches, Routers & Servers. Configure IPv4 parameters and validate topology.',
      icon: Layers,
      tag: 'Core Lab',
    },
    {
      id: 'simulation',
      num: '04',
      title: 'PACKET SIMULATION ENGINE',
      desc: 'Transmit ICMP, TCP & UDP frames. Inspect Layer 2-4 headers and measure latency.',
      icon: Play,
      tag: 'Simulation',
    },
    {
      id: 'diagnostics',
      num: '05',
      title: 'INTELLIGENT FAULT DIAGNOSIS',
      desc: 'Symptom -> Hypothesis -> Test -> Evidence -> Root Cause -> Fix -> Verification workflow.',
      icon: Terminal,
      tag: 'Deductive Reasoning',
    },
    {
      id: 'assessments',
      num: '06',
      title: 'ASSESSMENTS & SCENARIO QUIZ',
      desc: 'Phase 1 DCN Fundamentals & Phase 2 Real-world Network Diagnosis troubleshooting cases.',
      icon: Activity,
      tag: 'Evaluation',
    },
    {
      id: 'minigame',
      num: '07',
      title: 'MINI-GAME: ROGUE PACKET',
      desc: 'Walk a live network operations centre, trace the rogue packet and name the faulty device. Five levels, randomized faults.',
      icon: Gamepad2,
      tag: 'Gamified Practice',
    },
    {
      id: 'conclusion',
      num: '08',
      title: 'LAB REPORT & COMPETENCIES',
      desc: 'Summary of verified competencies, results analysis, and academic certificate export.',
      icon: Award,
      tag: 'Certification',
    },
    {
      id: 'launchlab',
      num: '09',
      title: 'LAUNCH FULL UNRESTRICTED LAB',
      desc: 'Full-screen sandbox mode with complete designer, packet inspector, and terminal tools.',
      icon: Maximize2,
      tag: 'Open Sandbox',
    },
  ];

  // Keyboard navigation: Arrows, Enter, Escape, Numbers 0-9
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playSound('click');
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        playSound('click');
        setSelectedIndex(prev => (prev + 1) % modules.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        playSound('click');
        setSelectedIndex(prev => (prev - 1 + modules.length) % modules.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        playSound('success');
        onSelectModule(modules[selectedIndex].id);
        onClose();
      } else if (/^[0-9]$/.test(e.key)) {
        const num = parseInt(e.key, 10);
        if (num < modules.length) {
          playSound('click');
          setSelectedIndex(num);
          onSelectModule(modules[num].id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090806]/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="max-w-4xl w-full bg-[#151412] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Hub Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#11100e]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                Works Hub // Master Navigation
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-mono">
                10 Lab Modules
              </span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 font-display">
              Intelligent Network Design & Diagnosis System
            </h2>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modules Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5">
          {modules.map((mod, idx) => {
            const Icon = mod.icon;
            const isCurrent = activeModule === mod.id;
            const isSelected = selectedIndex === idx;
            const isCompleted = completedModules.has(mod.id);

            return (
              <div
                key={mod.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={() => {
                  playSound('success');
                  onSelectModule(mod.id);
                  onClose();
                }}
                className={`node-card group relative p-4 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/60 shadow-[0_0_15px_rgba(255,95,31,0.15)] translate-x-1'
                    : 'bg-[#191816]/50 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="text-xs font-mono font-bold text-slate-500 group-hover:text-emerald-400 w-6">
                    {mod.num}
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center border transition-colors ${
                    isCurrent
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-emerald-400 group-hover:border-slate-700'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                        {mod.title}
                      </h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                        {mod.tag}
                      </span>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Done</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                      {mod.desc}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                      Active
                    </span>
                  )}
                  <ArrowRight className={`w-4 h-4 transition-transform ${
                    isSelected ? 'text-emerald-400 translate-x-1' : 'text-slate-600'
                  }`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-4 bg-[#11100e] border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">↑</kbd> <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">↓</kbd> Navigate</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Enter</kbd> Open</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">0-9</kbd> Direct Jump</span>
            <span><kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">Esc</kbd> Close</span>
          </div>
          <span className="text-emerald-400">SOMAIYA VIRTUAL LABS</span>
        </div>
      </div>
    </div>
  );
};
