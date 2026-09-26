import React from 'react';
import { ScrambleText, SplitText, CountUp } from '@/components/motion/TextFX';
import { 
  Target, 
  CheckCircle2, 
  BookOpen, 
  Layers, 
  ShieldCheck, 
  Terminal, 
  Activity, 
  Cpu,
  GraduationCap,
  Award,
  Sparkles,
  ArrowRight
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
    { title: 'Design a Computer Network', bloom: 'L6: Create', desc: 'Construct hierarchical topologies using end devices, access switches, and routers.' },
    { title: 'Configure Network Devices', bloom: 'L3: Apply', desc: 'Set up host network parameters, NIC interfaces, and default gateways.' },
    { title: 'Assign IP Addresses & Masks', bloom: 'L3: Apply', desc: 'Apply Class A, B, and C IPv4 addressing schemas with appropriate subnet boundaries.' },
    { title: 'Analyze Packet Communication', bloom: 'L4: Analyze', desc: 'Observe L2 frame encapsulation, L3 IP routing, and L4 protocol multiplexing.' },
    { title: 'Understand TCP and UDP Behavior', bloom: 'L2: Understand', desc: 'Compare 3-way handshake reliability with connectionless low-overhead datagrams.' },
    { title: 'Execute Networking Commands', bloom: 'L3: Apply', desc: 'Employ ping, ipconfig, tracert, arp, and nslookup for empirical troubleshooting.' },
    { title: 'Identify Multi-Layer Faults', bloom: 'L4: Analyze', desc: 'Diagnose 10 realistic faults across Physical, Data Link, Network, and Transport layers.' },
    { title: 'Apply Corrective Actions', bloom: 'L5: Evaluate', desc: 'Implement targeted remediations: interface toggling, cable swaps, and IP realignment.' },
    { title: 'Verify Network Connectivity', bloom: 'L5: Evaluate', desc: 'Validate end-to-end latency, 0% packet loss, and operational service availability.' },
  ];

  return (
    <section className="py-12 bg-[#0f0e0c]/80 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Academic Aim Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
              <Target className="w-4 h-4" />
              <ScrambleText text={"Academic Curriculum Specification // Step 01"} />
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              <SplitText text={"Laboratory Aim & Learning Objectives"} />
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-3xl">
              Somaiya Vidyavihar University — Department of Computer Engineering — Data Communication and Networking Laboratory (DCN-404).
            </p>
          </div>

          <button
            onClick={() => {
              playSound('success');
              onProceedToTheory();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono rounded-xl transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] shrink-0 active:scale-95 cursor-pointer"
          >
            <span>Proceed to Theory</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Aim Academic Callout Box */}
        <div className="bg-[#171614] border-l-4 border-emerald-500 rounded-r-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-[0_0_15px_rgba(255,95,31,0.15)]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Formal Statement of Laboratory Aim
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Course Outcome CO-4
                </span>
              </div>
              <blockquote className="text-base sm:text-xl font-medium text-slate-100 leading-relaxed italic font-serif">
                "To design and simulate a computer network based on specified requirements, analyze communication between network devices, and identify and troubleshoot common network faults using Data Communication and Networking concepts."
              </blockquote>
              <div className="text-xs text-slate-400 font-mono flex items-center gap-4">
                <span>Syllabus: Somaiya Autonomous Engineering</span>
                <span>•</span>
                <span>Course Code: DCN-LAB-404</span>
                <span>•</span>
                <span>Term: Semester IV / VI</span>
              </div>
            </div>
          </div>
        </div>

        {/* 9 Measurable Objectives Grid with Bloom's Taxonomy */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Measurable Course Outcomes (COs) & Bloom's Taxonomy Competencies</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">9 Core Outcomes</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objectives.map((obj, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-2xl bg-[#151412] border border-slate-800/80 hover:border-emerald-500/40 transition-all flex items-start gap-3 group shadow-sm hover:shadow-[0_0_15px_rgba(255,95,31,0.1)]"
              >
                <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-mono text-xs font-bold shrink-0 mt-0.5 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {obj.title}
                    </h4>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                      {obj.bloom}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {obj.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Experiments 1-7 Mapping Bar */}
        <div className="p-6 rounded-3xl bg-[#141311] border border-slate-800 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
            <div>
              <div className="text-xs font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                Curricular Synthesis
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100">
                Concepts the system is built on
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Pick a concept to open its interactive theory
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {DCN_EXPERIMENTS.slice(0, 7).map(exp => (
              <div
                key={exp.id}
                onClick={() => {
                  playSound('click');
                  onJumpToExperiment(exp.id);
                }}
                className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/50 hover:bg-slate-900 transition-all cursor-pointer text-center group"
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
