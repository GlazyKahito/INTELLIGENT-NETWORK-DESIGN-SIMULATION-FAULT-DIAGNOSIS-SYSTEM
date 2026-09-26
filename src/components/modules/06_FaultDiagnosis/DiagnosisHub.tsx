import React, { useState } from 'react';
import { 
  Terminal as TerminalIcon, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Wrench, 
  Search, 
  FileText, 
  RefreshCw,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { notifyNet } from '@/components/motion/NetStatus';
import { PacketPath } from '@/components/motion/PacketPath';
import { NetworkDevice, NetworkLink } from '../../../types/network';
import { FaultScenario, DiagnosticEvidence } from '../../../types/diagnostics';
import { FAULT_SCENARIOS } from '../../../data/faults';
import { DiagnosticTerminal } from './DiagnosticTerminal';
import { ScenarioSelector } from './ScenarioSelector';
import { evaluateDiagnosticState, applyCorrectiveAction, injectFaultScenario } from '../../../lib/diagnostics/ruleEngine';
import { INITIAL_DEVICES, INITIAL_LINKS } from '../../../data/defaultTopology';
import { playSound } from '../../../lib/sound';

interface DiagnosisHubProps {
  devices: NetworkDevice[];
  setDevices: React.Dispatch<React.SetStateAction<NetworkDevice[]>>;
  links: NetworkLink[];
  setLinks: React.Dispatch<React.SetStateAction<NetworkLink[]>>;
  onProceedToAssessments: () => void;
}

export const DiagnosisHub: React.FC<DiagnosisHubProps> = ({
  devices,
  setDevices,
  links,
  setLinks,
  onProceedToAssessments,
}) => {
  // Start with Fault 3 (Invalid Gateway) as an active demonstration, or allow user selection
  const [activeFault, setActiveFault] = useState<FaultScenario | null>(FAULT_SCENARIOS[2]);
  const [evidenceList, setEvidenceList] = useState<DiagnosticEvidence[]>([]);
  const [isFixed, setIsFixed] = useState(false);
  const [verificationOutput, setVerificationOutput] = useState<string | null>(null);
  const [terminalInjectedCmd, setTerminalInjectedCmd] = useState<string | null>(null);

  // Evaluate intelligent rule engine
  const report = evaluateDiagnosticState(evidenceList, activeFault, devices, links);

  const handleSelectFault = (fault: FaultScenario) => {
    setActiveFault(fault);
    setEvidenceList([]);
    setIsFixed(false);
    setVerificationOutput(null);

    // Mutate topology state
    const { mutatedDevices, mutatedLinks } = injectFaultScenario(fault.id, devices, links);
    setDevices(mutatedDevices);
    setLinks(mutatedLinks);
  };

  const handleClearFault = () => {
    setActiveFault(null);
    setEvidenceList([]);
    setIsFixed(false);
    setVerificationOutput(null);

    // Restore default topology
    setDevices(JSON.parse(JSON.stringify(INITIAL_DEVICES)));
    setLinks(JSON.parse(JSON.stringify(INITIAL_LINKS)));
  };

  const handleEvidenceDiscovered = (ev: DiagnosticEvidence) => {
    setEvidenceList(prev => {
      if (prev.some(p => p.command === ev.command)) return prev;
      return [...prev, ev];
    });
  };

  const handleApplyFix = () => {
    if (!activeFault) return;

    playSound('repair');
    const { updatedDevices, updatedLinks, message } = applyCorrectiveAction(activeFault.id, devices, links);
    setDevices(updatedDevices);
    setLinks(updatedLinks);
    setIsFixed(true);

    // Run verification ping check
    setTimeout(() => {
      playSound('success');
      notifyNet({ ok: true, title: 'Connection established', detail: 'Fault repaired — verification ping reached its destination.' });
      setVerificationOutput(
        `VERIFICATION SUCCESSFUL: Host connectivity restored (100% packets received, 0% loss, Gateway UP, DNS resolved). ${message}`
      );
    }, 600);
  };

  return (
    <section className="py-10 bg-[#0c0b09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest mb-1.5">
              <span>Intelligent Fault Diagnostic Engine</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              Network Troubleshooting & Deductive Analysis
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Inspect anomalies, formulate hypotheses, gather empirical CLI evidence, isolate root cause, apply corrective actions, and verify network recovery.
            </p>
          </div>

          <button
            onClick={() => {
              playSound('success');
              onProceedToAssessments();
            }}
            className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] shrink-0"
          >
            Take Assessments (Quiz) →
          </button>
        </div>

        {/* 10 Realistic Fault Selector */}
        <ScenarioSelector
          activeFault={activeFault}
          onSelectFault={handleSelectFault}
          onClearFault={handleClearFault}
        />

        {/* Where the packet dies — replays whenever the fault changes or is repaired */}
        {activeFault && (
          <div className="rounded-2xl border border-slate-800 bg-[#12110f] px-5 py-4">
            <div className="mb-1 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
              <span>Packet path · PC → server</span>
              <span>{isFixed ? 'after repair' : 'fault injected'}</span>
            </div>
            <PacketPath
              key={`${activeFault.id}-${isFixed}`}
              nodes={['PC', 'SWITCH', 'ROUTER', 'SERVER']}
              broken={isFixed ? null : /Layer (1|2)/.test(activeFault.category) ? 0 : /Layer 3/.test(activeFault.category) ? 1 : 2}
              okLabel="Connection established"
              failLabel="Packet dropped"
              className="max-w-xl"
            />
          </div>
        )}

        {/* Active Anomaly Network Alert Banner */}
        {activeFault && (
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                    NETWORK ANOMALY DETECTED: {activeFault.title}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                    {activeFault.category}
                  </span>
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  Symptom: {activeFault.symptom}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 font-mono">
                  Observation: {activeFault.expectedObservation}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
              <span className="text-slate-400">Packet Loss: </span>
              <span className="text-rose-400 font-bold text-sm">100%</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-slate-400">Diagnosis: </span>
              <span className="text-amber-400 font-bold">REQUIRED</span>
            </div>
          </div>
        )}

        {/* Core Diagnosis Split Workspace: Terminal + Intelligent Reasoner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Interactive Diagnostic Terminal */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <TerminalIcon className="w-4 h-4 text-emerald-400" />
                <span>Diagnostic CLI Console (Execute Tests)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                Host: PC1 (192.168.1.10)
              </span>
            </div>

            <DiagnosticTerminal
              currentHostId="dev-pc1"
              devices={devices}
              links={links}
              activeFault={activeFault}
              onEvidenceDiscovered={handleEvidenceDiscovered}
              injectedCommand={terminalInjectedCmd}
            />

            {/* Suggested test commands quick strip */}
            {activeFault && (
              <div className="p-3 bg-[#151412] border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Recommended Test Commands:</span>
                <div className="flex gap-2">
                  {activeFault.testCommands.map(cmd => (
                    <button
                      key={cmd}
                      onClick={() => setTerminalInjectedCmd(cmd)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 rounded transition-colors text-[11px]"
                    >
                      {cmd}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Deductive Reasoning & Remediation Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-[#151412] border border-slate-800 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  Deductive Diagnostic Engine
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  report.confidence === 'Very High' || report.confidence === 'High'
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}>
                  Confidence: {report.confidence}
                </span>
              </div>

              {/* 1. Evidence Gathered */}
              <div>
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2 font-semibold">
                  1. Empirical Evidence Collected ({evidenceList.length}):
                </span>
                {evidenceList.length === 0 ? (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-500 font-mono">
                    No tests executed yet. Run commands in the CLI to uncover network evidence.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {evidenceList.map(ev => (
                      <div key={ev.id} className="p-2.5 bg-slate-950 rounded-lg border border-slate-800/80 text-xs font-mono">
                        <div className="text-emerald-400 font-semibold">{ev.command}</div>
                        <div className="text-slate-300 text-[11px] mt-0.5">{ev.inference}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Isolated Root Cause */}
              <div className="p-4 rounded-xl bg-[#171614] border-l-4 border-amber-400 shadow">
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold block mb-1">
                  2. Inferred Root Cause:
                </span>
                <p className="text-xs sm:text-sm text-slate-100 font-medium leading-relaxed">
                  {report.likelyRootCause}
                </p>
              </div>

              {/* 3. Recommended Remediation & Fix Button */}
              <div>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5 font-semibold">
                  3. Recommended Corrective Action:
                </span>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  {report.recommendedAction}
                </p>

                {activeFault && !isFixed && (
                  <button
                    onClick={handleApplyFix}
                    className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl font-mono text-xs transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Wrench className="w-4 h-4" />
                    <span>EXECUTE CORRECTIVE ACTION (APPLY FIX)</span>
                  </button>
                )}
              </div>

              {/* 4. Verification & Recovery Badge */}
              {isFixed && (
                <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-mono space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>NETWORK RECOVERY VERIFIED</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 pt-1">
                    <div>Gateway Reachable: <span className="text-emerald-400">✓ PASS</span></div>
                    <div>Routing Table: <span className="text-emerald-400">✓ PASS</span></div>
                    <div>Packet Loss: <span className="text-emerald-400">0%</span></div>
                    <div>End-to-End Latency: <span className="text-emerald-400">2ms</span></div>
                  </div>
                  {verificationOutput && (
                    <div className="text-[11px] text-slate-300 pt-1 border-t border-emerald-500/20">
                      {verificationOutput}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
