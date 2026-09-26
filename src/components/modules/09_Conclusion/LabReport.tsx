import React, { useState } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Download, 
  Printer, 
  Layers, 
  Play, 
  GraduationCap, 
  Share2,
  Maximize2,
  User,
  Hash,
  Sparkles,
  QrCode
} from 'lucide-react';
import { playSound } from '../../../lib/sound';
import { motion } from 'motion/react';
import { PacketPath } from '@/components/motion/PacketPath';

interface LabReportProps {
  onLaunchFullLab: () => void;
  onReturnToHome: () => void;
}

export const LabReport: React.FC<LabReportProps> = ({
  onLaunchFullLab,
  onReturnToHome,
}) => {
  const [studentName, setStudentName] = useState('Engineering Student');
  const [rollNumber, setRollNumber] = useState('DCN-2026-404');

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
      studentName,
      rollNumber,
      date: new Date().toISOString(),
      studentStatus: 'Laboratory Complete — Certified',
      verifiedCompetencies: competencies,
    };
    const blob = new Blob([JSON.stringify(summaryData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DCN_Lab_Certificate_${rollNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="py-12 bg-[#0c0b09]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-10">
        {/* The journey closes: one last packet crosses the whole network */}
        <div className="rounded-2xl border border-slate-800 bg-[#12110f] p-6 sm:p-8">
          <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400">Final verification</div>
          <PacketPath nodes={['PC', 'SWITCH', 'ROUTER', 'SERVER']} okLabel="Network stable · Lab complete" className="mt-4 max-w-2xl" />
          <motion.ul
            className="mt-5 flex flex-wrap gap-2"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { delayChildren: 2.1, staggerChildren: 0.07 } } }}
          >
            {['Cabling & L1', 'Switching', 'IP addressing', 'Routing', 'TCP / UDP', 'Error detection', 'Fault isolation', 'Diagnosis'].map(c => (
              <motion.li
                key={c}
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 font-mono text-[11px] text-emerald-200"
              >
                ✓ {c}
              </motion.li>
            ))}
          </motion.ul>
        </div>

        {/* Student Customization Bar */}
        <div className="p-5 rounded-2xl bg-[#151412] border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-mono font-bold text-slate-300 uppercase">
              Student Lab Credentials:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Name:</span>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-sans font-medium text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500">Roll No:</span>
              <input
                type="text"
                value={rollNumber}
                onChange={e => setRollNumber(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Certificate Card Container */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#151412] border-2 border-emerald-500/40 shadow-[0_0_50px_rgba(255,95,31,0.15)] relative overflow-hidden">
          {/* Subtle watermark background badge */}
          <div className="absolute -top-16 -right-16 w-56 h-56 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Institutional Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest">
                  Academic Certificate of Laboratory Completion
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-100 font-display">
                  Somaiya Virtual Labs — DCN Laboratory
                </h2>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  Course: Data Communication and Networking (DCN-LAB-404)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
                title="Print Official Certificate"
              >
                <Printer className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownloadSummary}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-700/80 transition-colors cursor-pointer"
                title="Download JSON Record"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Certification Statement */}
          <div className="my-8 text-center space-y-3 font-sans">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              This is to certify that
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-emerald-300 font-display">
              {studentName}
            </div>
            <div className="text-xs font-mono text-slate-400">
              Student ID / Roll No: <span className="text-slate-200 font-bold">{rollNumber}</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed pt-2">
              has successfully synthesized, designed, simulated, and diagnosed multi-hop computer networks adhering to IEEE 802.3 and RFC 793 using the Intelligent Network Design, Simulation & Fault Diagnosis System.
            </p>
          </div>

          {/* Laboratory Complete Status Badge */}
          <div className="my-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <div className="text-sm font-bold text-emerald-300">
                  SYSTEM WALKTHROUGH COMPLETE // STATUS: VERIFIED
                </div>
                <div className="text-[11px] text-slate-400">
                  Design, simulation, fault diagnosis and verification completed and evaluated.
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
              Competency checklist:
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
          <div className="p-5 rounded-2xl bg-[#0f0e0c] border border-slate-800 space-y-3 font-sans">
            <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
              Core Technical Competencies Mastered:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-300 font-mono">
              {competencies.map((comp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-emerald-400 font-bold">✓</span>
                  <span>{comp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Launch Full Lab CTA */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-[#171614] to-[#12110f] border border-slate-800 text-center space-y-5 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
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
              className="flex items-center gap-2 px-7 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono rounded-xl text-sm transition-all shadow-[0_0_25px_rgba(255,95,31,0.4)] active:scale-95 cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
              <span>LAUNCH FULL UNRESTRICTED LAB</span>
            </button>

            <button
              onClick={() => {
                playSound('click');
                onReturnToHome();
              }}
              className="px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 font-semibold font-mono rounded-xl text-sm border border-slate-800 transition-colors cursor-pointer"
            >
              Return to Homepage
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
