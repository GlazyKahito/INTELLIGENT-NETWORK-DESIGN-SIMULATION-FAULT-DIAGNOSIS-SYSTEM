import React from 'react';
import { AlertTriangle, ShieldAlert, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { FaultScenario } from '../../../types/diagnostics';
import { FAULT_SCENARIOS } from '../../../data/faults';
import { playSound } from '../../../lib/sound';

interface ScenarioSelectorProps {
  activeFault: FaultScenario | null;
  onSelectFault: (fault: FaultScenario) => void;
  onClearFault: () => void;
}

export const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({
  activeFault,
  onSelectFault,
  onClearFault,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Select Fault Injection Scenario (10 Realistic Lab Faults)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject realistic multi-layer anomalies into the topology to practice diagnosis and remediation.
          </p>
        </div>

        {activeFault && (
          <button
            onClick={() => {
              playSound('repair');
              onClearFault();
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono transition-colors"
          >
            Clear Active Fault
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {FAULT_SCENARIOS.map((fault, idx) => {
          const isActive = activeFault?.id === fault.id;

          return (
            <div
              key={fault.id}
              onClick={() => {
                playSound('alert');
                onSelectFault(fault);
              }}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                isActive
                  ? 'bg-amber-500/15 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-400'
                  : 'bg-[#151412] border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    F{idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                    {fault.difficulty}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-slate-200 line-clamp-1 mb-1">
                  {fault.title.split(':')[1]?.trim() || fault.title}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {fault.symptom}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-500">{fault.category.split(' ')[0]}</span>
                <span className={isActive ? 'text-amber-300 font-bold' : 'text-slate-400'}>
                  {isActive ? 'Active Anomaly' : 'Inject'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
