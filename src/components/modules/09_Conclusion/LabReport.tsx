import React from 'react';
import { 
  Award, 
  CheckCircle2, 
  Download, 
  Printer, 
  Layers, 
  Play, 
  GraduationCap, 
  Share2,
  Maximize2
} from 'lucide-react';
import { playSound } from '../../../lib/sound';

interface LabReportProps {
  onLaunchFullLab: () => void;
  onReturnToHome: () => void;
}

export const LabReport: React.FC<LabReportProps> = ({
  onLaunchFullLab,
  onReturnToHome,
}) => {
  const verifiedChecklist = [
    { title: 'Network Design & Hierarchical Topology', desc: 'Constructed multi-hop LAN with end devices, access switches, and routers.' },
    { title: 'IP Addressing & Subnet Mask Configuration', desc: 'Configured Class A/B/C addresses and verified broadcast boundaries.' },
    { title: 'Packet Simulation & Traffic Transmission', desc: 'Animated end-to-end ICMP, TCP, and UDP packet trajectories with hop tracking.' },
    { title: 'Protocol Analysis & Frame Decapsulation', desc: 'Dissected Layer 2 Ethernet, Layer 3 IPv4, and Layer 4 TCP/UDP segment headers.' },
    { title: 'Multi-Layer Fault Diagnosis (CLI Tools)', desc: 'Employed ping, ipconfig, tracert, arp, and nslookup to isolate root cause.' },
    { title: 'Corrective Action Remediation', desc: 'Applied targeted network fixes: IP realignment, interface enabling, and cable reconnection.' },
    { title: 'Connectivity & Recovery Verification', desc: 'Validated 0% packet loss, nominal round-trip times, and service availability.' },
  ];

  const competencies = [
    'Modular Computer Network Design & Segmentation',
    'IPv4 Subnetting & CIDR Mathematical Boundary Calculations',
    'Byte-Level TCP Header Dissection & 3-Way Handshake Flow',
    'Linear Block Error Correction with Hamming (7,4) Code',
    'Layer 1 ANSI/TIA-568 UTP Cable Termination Standards',
    'Deductive Empirical Network Troubleshooting Methodology',
  ];

  const handlePrint = () => {
    playSound('click');
    window.print();
  };

  const handleDownloadSummary = () => {
    playSound('click');
    const summaryData = {
      institution: 'Somaiya Virtual Labs — DCN Laboratory',
      project: 'Intelligent Network Design, Simulation & Fault Diagnosis System',
      date: new Date().toISOString(),
      studentStatus: 'Laboratory Complete — Certified',
      verifiedCompetencies: competencies,
    };
    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'DCN_Lab_Completion_Report.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="py-12 bg-[#070a12]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Certificate Card Container */}
        <div className="p-8 sm:p-10 rounded-3xl bg-[#0d1322] border border-emerald-500/40 shadow-[0_0_40px_rgba(16,185,129,0.15)] relative overflow-hidden">
          {/* Subtle watermark badge */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Institutional Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Academic Laboratory Assessment Report
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-display">
                  Somaiya Virtual Labs — DCN Laboratory
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Experiment 08: Capstone Network Design, Simulation & Fault Diagnosis System
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/80 transition-colors"
                title="Print Report"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadSummary}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/80 transition-colors"
                title="Download JSON Report"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Laboratory Complete Status Badge */}
          <div className="my-8 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-300">
                  LABORATORY EXPERIMENT COMPLETE // STATUS: VERIFIED
                </div>
                <div className="text-[11px] text-slate-400">
                  All 7 experimental execution phases successfully synthesized and evaluated.
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/40 hidden sm:inline-block">
              100% Complete
            </span>
          </div>

          {/* Checklist of Executed Modules */}
          <div className="space-y-4 mb-8">
            <h3 className="text-sm font-mono font-bold text-slate-300 uppercase tracking-wider">
              Experimental Execution Checklist:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {verifiedChecklist.map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-200">{item.title}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mastered Competencies */}
          <div className="p-5 rounded-2xl bg-[#090d16] border border-slate-800 space-y-3 font-sans">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Core Technical Competencies Mastered:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
              {competencies.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-emerald-400">▸</span>
                  <span>{comp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Launch Full Lab CTA */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#0e1626] to-[#0a101d] border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
            <span>UNRESTRICTED INTERACTIVE LABORATORY</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
            Ready to Build Your Own Network?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
            Launch the unrestricted full-screen virtual laboratory environment to design custom multi-subnet topologies, inject custom faults, and inspect deep packet flows.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => {
                playSound('success');
                onLaunchFullLab();
              }}
              className="flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-[0_0_20px_rgba(16,185,129,0.4)] active:scale-95"
            >
              <Maximize2 className="w-4 h-4" />
              <span>LAUNCH FULL UNRESTRICTED LAB</span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                onReturnToHome();
              }}
              className="px-5 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold rounded-xl text-sm border border-slate-800 transition-colors"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
