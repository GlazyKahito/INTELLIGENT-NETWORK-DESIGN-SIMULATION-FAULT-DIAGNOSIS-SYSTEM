import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, ChevronRight, X } from 'lucide-react';
import { NetworkValidationIssue } from '../../../types/network';
import { playSound } from '../../../lib/sound';

interface ValidationPanelProps {
  issues: NetworkValidationIssue[];
  isOpen: boolean;
  onClose: () => void;
  onSelectDevice?: (deviceId: string) => void;
}

export const ValidationPanel: React.FC<ValidationPanelProps> = ({
  issues,
  isOpen,
  onClose,
  onSelectDevice,
}) => {
  if (!isOpen) return null;

  const errors = issues.filter(i => i.severity === 'error');
  const warnings = issues.filter(i => i.severity === 'warning');
  const infos = issues.filter(i => i.severity === 'info');

  return (
    <div className="p-5 rounded-2xl bg-[#151412] border border-slate-800 shadow-2xl space-y-4 font-sans animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
            Network Topology Validation Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {issues.length} Results
          </span>
        </div>

        <button
          onClick={() => {
            playSound('click');
            onClose();
          }}
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-3 gap-3 text-center text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
          <div className="text-lg font-bold">{errors.length}</div>
          <div className="text-[10px] uppercase">Critical Errors</div>
        </div>

        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
          <div className="text-lg font-bold">{warnings.length}</div>
          <div className="text-[10px] uppercase">Warnings</div>
        </div>

        <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
          <div className="text-lg font-bold">{errors.length === 0 ? 'PASS' : 'FAIL'}</div>
          <div className="text-[10px] uppercase">Topology Health</div>
        </div>
      </div>

      {/* Issues List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {issues.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center gap-3 text-xs font-mono">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold">Topology Fully Validated:</span> All hosts have valid IPv4 parameters, subnets match default gateways, and all active links are operational.
            </div>
          </div>
        ) : (
          issues.map(iss => (
            <div
              key={iss.id}
              onClick={() => {
                if (iss.deviceId && onSelectDevice) {
                  playSound('click');
                  onSelectDevice(iss.deviceId);
                }
              }}
              className={`p-3 rounded-xl border text-xs transition-all ${
                iss.severity === 'error'
                  ? 'bg-rose-500/10 border-rose-500/40 text-rose-200 hover:border-rose-400 cursor-pointer'
                  : iss.severity === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 hover:border-amber-400 cursor-pointer'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {iss.severity === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : iss.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-semibold">{iss.message}</div>
                  <div className="text-[11px] opacity-80 mt-1 font-mono">
                    <span className="font-bold">Fix: </span>
                    {iss.recommendation}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
