import React from 'react';
import { 
  Target, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Cpu,
  GraduationCap
} from 'lucide-react';
import { DCN_EXPERIMENTS } from '../../../data/experiments';
import { playSound } from '../../../lib/sound';

interface AimSectionProps {
  onProceedToTheory: () => void;
  onJumpToExperiment: (expId: number) => void;
}

export const AimSection: React.FC<AimSectionProps> = ({
  onProceedToTheory,
  onJumpToExperiment,
}) => {
  const objectives = [
    { title: 'Design a Computer Network', desc: 'Construct hierarchical topologies using end devices, access switches, and routers.' },
    { title: 'Configure Network Devices', desc: 'Set up host network parameters, NIC interfaces, and default gateways.' },
    { title: 'Assign IP Addresses & Masks', desc: 'Apply Class A, B, and C IPv4 addressing schemas with appropriate subnet boundaries.' },
    { title: 'Analyze Packet Communication', desc: 'Observe L2 frame encapsulation, L3 IP routing, and L4 protocol multiplexing.' },
    { title: 'Understand TCP and UDP Behavior', desc: 'Compare 3-way handshake reliability with connectionless low-overhead datagrams.' },
    { title: 'Execute Networking Commands', desc: 'Employ ping, ipconfig, tracert, arp, and nslookup for empirical troubleshooting.' },
    { title: 'Identify Multi-Layer Faults', desc: 'Diagnose 10 realistic faults across Physical, Data Link, Network, and Transport layers.' },
    { title: 'Apply Corrective Actions', desc: 'Implement targeted remediations: interface toggling, cable swaps, and IP realignment.' },
    { title: 'Verify Network Connectivity', desc: 'Validate end-to-end latency, 0% packet loss, and operational service availability.' },
  ];

  return (
    <section className="py-12 bg-[#090d16] border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Academic Aim Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-2">
            <Target className="w-4 h-4" />
            <span>Academic Curriculum Specification // Lab 08</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
            Laboratory Aim & Learning Objectives
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-3xl">
            Somaiya Vidyavihar University — Department of Computer Engineering — Data Communication and Networks Laboratory.
          </p>
        </div>

        {/* Primary Aim Academic Callout Box */}
        <div className="bg-[#0e1626] border-l-4 border-emerald-500 rounded-r-2xl p-6 sm:p-8 shadow-xl mb-12">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <div className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                Formal Statement of Aim
              </div>
              <blockquote className="text-base sm:text-xl font-medium text-slate-100 leading-relaxed italic font-serif">
                "To design and simulate a computer network based on specified requirements, analyze communication between network devices, and identify and troubleshoot common network faults using Data Communication and Networking concepts."
              </blockquote>
              <div className="text-xs text-slate-400 font-mono">
                Syllabus Reference: Mumbai University / Somaiya Autonomous Curriculum • Course Code: DCN-LAB-404
              </div>
            </div>
          </div>
        </div>

        {/* 9 Measurable Objectives Grid */}
        <div className="space-y-4 mb-14">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Measurable Course Outcomes (COs) & Laboratory Objectives</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">9 Core Competencies</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objectives.map((obj, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl bg-[#0d1322] border border-slate-800/80 hover:border-emerald-500/40 transition-all flex items-start gap-3 group"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                    {obj.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    {obj.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mapping to Experiments 1-7 */}
        <div className="p-6 rounded-2xl bg-[#0c1220] border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                Syllabus Synthesis
              </div>
              <h3 className="text-lg font-bold text-slate-100">
                Integration Matrix: Experiments 01 through 07
              </h3>
            </div>
            <button
              onClick={() => {
                playSound('click');
                onProceedToTheory();
              }}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              Explore Interactive Theory →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {DCN_EXPERIMENTS.slice(0, 7).map(exp => (
              <div
                key={exp.id}
                onClick={() => {
                  playSound('click');
                  onJumpToExperiment(exp.id);
                }}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer text-center group"
              >
                <div className="text-[10px] font-mono font-bold text-emerald-400 mb-1">
                  {exp.code}
                </div>
                <div className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors line-clamp-2">
                  {exp.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
