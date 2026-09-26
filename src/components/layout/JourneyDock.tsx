import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Layers, 
  ChevronDown, 
  ChevronUp,
  BookOpen,
  HelpCircle,
  Play,
  Terminal,
  Activity,
  Gamepad2,
  Award
} from 'lucide-react';
import { playSound } from '../../lib/sound';

interface JourneyDockProps {
  activeModule: string;
  onNavigate: (moduleId: string) => void;
  completedModules: Set<string>;
}

export const JourneyDock: React.FC<JourneyDockProps> = ({
  activeModule,
  onNavigate,
  completedModules,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Ordered educational sequence
  const steps = [
    { id: 'aim', num: '01', title: 'Aim & Objectives', short: 'Aim', icon: BookOpen },
    { id: 'theory', num: '02', title: 'Theory (Exp 1-7)', short: 'Theory', icon: HelpCircle },
    { id: 'design', num: '03', title: 'Network Design', short: 'Design', icon: Layers },
    { id: 'simulation', num: '04', title: 'Packet Simulator', short: 'Simulate', icon: Play },
    { id: 'diagnostics', num: '05', title: 'Fault Diagnosis', short: 'Diagnose', icon: Terminal },
    { id: 'assessments', num: '06', title: 'Assessments', short: 'Assess', icon: Activity },
    { id: 'minigame', num: '07', title: 'NOC Room Hunt', short: 'NOC Hunt', icon: Gamepad2 },
    { id: 'conclusion', num: '08', title: 'Completion Report', short: 'Report', icon: Award },
  ];

  const currentIndex = steps.findIndex(s => s.id === activeModule);

  const prevStep = currentIndex > 0 ? steps[currentIndex - 1] : null;
  const nextStep = currentIndex < steps.length - 1 ? steps[currentIndex + 1] : null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 pointer-events-none select-none">
      <div className="bg-[#0b101c]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 sm:p-2.5 pointer-events-auto transition-all duration-300">
        {/* Header Strip inside Dock */}
        <div className="flex items-center justify-between pb-1.5 px-2 border-b border-slate-800/80 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">LAB JOURNEY:</span>
            <span className="text-emerald-400 font-bold">
              {currentIndex !== -1 ? `Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex].title}` : 'Overview'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Progress: {completedModules.size}/{steps.length} Completed
            </span>
            <button
              onClick={() => {
                playSound('click');
                setIsCollapsed(!isCollapsed);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title={isCollapsed ? 'Expand Journey Dock' : 'Collapse Journey Dock'}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Steps Bar (Collapsible) */}
        {!isCollapsed && (
          <div className="pt-2 flex items-center justify-between gap-1 sm:gap-2">
            {/* Prev Button */}
            <button
              onClick={() => {
                if (prevStep) {
                  playSound('click');
                  onNavigate(prevStep.id);
                }
              }}
              disabled={!prevStep}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Prev</span>
            </button>

            {/* Stepper Pills */}
            <div className="flex-1 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none px-1">
              {steps.map((st, idx) => {
                const isActive = activeModule === st.id;
                const isCompleted = completedModules.has(st.id);

                return (
                  <button
                    key={st.id}
                    onClick={() => {
                      playSound('click');
                      onNavigate(st.id);
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                        : isCompleted
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-slate-900/60 text-slate-400 border border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {isCompleted && !isActive ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span className="text-[10px] opacity-75">{st.num}</span>
                    )}
                    <span className="hidden sm:inline">{st.short}</span>
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                if (nextStep) {
                  playSound('success');
                  onNavigate(nextStep.id);
                }
              }}
              disabled={!nextStep}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold disabled:opacity-30 disabled:pointer-events-none hover:bg-emerald-500/30 transition-colors shadow-sm"
            >
              <span className="hidden md:inline">Next: {nextStep?.short || 'Finish'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
