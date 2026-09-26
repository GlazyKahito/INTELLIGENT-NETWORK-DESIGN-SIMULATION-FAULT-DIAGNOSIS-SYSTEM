import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
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
import { MODULE_LABEL, MODULE_ORDER, NAV_GROUPS } from '../../lib/nav';

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
  const steps = NAV_GROUPS.map((g, i) => ({ ...g, num: String(i + 1).padStart(2, '0'), title: g.label, short: g.label }));

  const currentIndex = steps.findIndex(s => s.modules.includes(activeModule));
  const order = MODULE_ORDER.indexOf(activeModule);
  const prevModule = order > 0 ? MODULE_ORDER[order - 1] : null;
  const nextModule = order < MODULE_ORDER.length - 1 ? MODULE_ORDER[order + 1] : null;

  // Remember where we came from so a packet can travel the path to the new node.
  const reduce = useReducedMotion();
  const prevIndex = useRef(currentIndex);
  const [hop, setHop] = useState<{ from: number; to: number; id: number } | null>(null);
  useEffect(() => {
    if (prevIndex.current !== currentIndex && prevIndex.current !== -1 && currentIndex !== -1 && !reduce) {
      setHop({ from: prevIndex.current, to: currentIndex, id: Date.now() });
    }
    prevIndex.current = currentIndex;
  }, [currentIndex, reduce]);
  const pct = (i: number) => ((i + 0.5) / steps.length) * 100;
  const visited = (s: (typeof steps)[number]) => s.modules.some(m => completedModules.has(m));
  const reached = Math.max(currentIndex, ...steps.map((s, i) => (visited(s) ? i : -1)));

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-full max-w-4xl px-4 pointer-events-none select-none">
      <div className="bg-[#12110f]/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-2 sm:p-2.5 pointer-events-auto transition-all duration-300">
        {/* Header Strip inside Dock */}
        <div className="flex items-center justify-between pb-1.5 px-2 border-b border-slate-800/80 text-[11px] font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">LAB JOURNEY:</span>
            <span className="text-emerald-400 font-bold">
              {`Step ${currentIndex + 1} of ${steps.length}: ${steps[currentIndex].title} · ${MODULE_LABEL[activeModule]}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              Progress: {steps.filter(visited).length}/{steps.length} sections
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
                if (prevModule) {
                  playSound('click');
                  onNavigate(prevModule);
                }
              }}
              disabled={!prevModule}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono disabled:opacity-30 disabled:pointer-events-none hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Prev</span>
            </button>

            {/* Network path: ● visited · ◉ current · ○ not yet */}
            <div className="relative flex-1 px-1">
              <div className="absolute top-[11px] h-px bg-slate-700/70" style={{ left: `${pct(0)}%`, right: `${100 - pct(steps.length - 1)}%` }} aria-hidden />
              <motion.div
                className="absolute top-[11px] h-px bg-emerald-400/80"
                style={{ left: `${pct(0)}%` }}
                animate={{ width: `${Math.max(0, pct(Math.max(0, reached)) - pct(0))}%` }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                aria-hidden
              />
              {hop && (
                <motion.span
                  key={hop.id}
                  className="absolute top-[8px] h-[7px] w-[7px] -translate-x-1/2 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(255,163,112,0.9)]"
                  initial={{ left: `${pct(hop.from)}%`, opacity: 1 }}
                  animate={{ left: `${pct(hop.to)}%`, opacity: [1, 1, 0] }}
                  transition={{ duration: Math.min(0.9, 0.3 + Math.abs(hop.to - hop.from) * 0.1), ease: [0.65, 0, 0.35, 1], opacity: { times: [0, 0.85, 1] } }}
                  aria-hidden
                />
              )}
              <ol className="relative flex">
                {steps.map((st, idx) => {
                  const isActive = st.modules.includes(activeModule);
                  const isDone = visited(st);
                  return (
                    <li key={st.id} className="flex flex-1 justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          playSound('click');
                          if (!isActive) onNavigate(st.modules[0]);
                        }}
                        className="group flex flex-col items-center gap-1 rounded-md px-1 pb-0.5 outline-offset-2"
                        aria-current={isActive ? 'step' : undefined}
                        aria-label={`${st.num} ${st.title}${isDone ? ' (visited)' : ''}`}
                        title={st.title}
                      >
                        <span className="relative flex h-[22px] w-[22px] items-center justify-center">
                          {isActive && !reduce && (
                            <motion.span
                              key={`ping-${st.id}`}
                              className="absolute inset-0 rounded-full border border-emerald-400"
                              initial={{ scale: 0.6, opacity: 0.9 }}
                              animate={{ scale: 1.6, opacity: 0 }}
                              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                            />
                          )}
                          <span
                            className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border-[1.5px] bg-[#12110f] transition-colors duration-300 ${
                              isActive ? 'border-emerald-300' : isDone ? 'border-emerald-500' : 'border-slate-600 group-hover:border-slate-400'
                            }`}
                          >
                            <motion.span
                              className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                              initial={false}
                              animate={{ scale: isActive || isDone ? 1 : 0 }}
                              transition={{ duration: 0.25, delay: isActive && hop ? 0.35 : 0 }}
                            />
                          </span>
                        </span>
                        <span
                          className={`hidden font-mono text-[10px] transition-colors sm:block ${
                            isActive ? 'font-semibold text-emerald-300' : isDone ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        >
                          {st.short}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Next Button */}
            <button
              onClick={() => {
                if (nextModule) {
                  playSound('success');
                  onNavigate(nextModule);
                }
              }}
              disabled={!nextModule}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold disabled:opacity-30 disabled:pointer-events-none hover:bg-emerald-500/30 transition-colors shadow-sm"
            >
              <span className="hidden md:inline">Next: {nextModule ? MODULE_LABEL[nextModule] : 'Finish'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
