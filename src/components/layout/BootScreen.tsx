import React, { useState, useEffect } from 'react';
import { Terminal, Shield, CheckCircle2, ChevronRight } from 'lucide-react';
import { playSound } from '../../lib/sound';

interface BootScreenProps {
  onComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const bootLogs = [
    { text: 'SOMAIYA VIRTUAL LABS — DCN LABORATORY', delay: 250 },
    { text: 'INITIALIZING NETWORK ENVIRONMENT...', delay: 300 },
    { text: 'LOADING PROTOCOL STACK (TCP/IP, ICMP, UDP, ARP)...', delay: 300 },
    { text: 'LOADING DISCRETE SIMULATION ENGINE...', delay: 250 },
    { text: 'INITIALIZING DETERMINISTIC FAULT DIAGNOSIS MATRIX...', delay: 250 },
    { text: 'SYSTEM READY — NETWORK LAB ONLINE', delay: 200 },
  ];

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step < bootLogs.length) {
      playSound('packet');
      timer = setTimeout(() => {
        setStep(prev => prev + 1);
      }, bootLogs[step].delay);
    } else {
      playSound('success');
      timer = setTimeout(() => {
        onComplete();
      }, 400);
    }

    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="fixed inset-0 z-50 bg-[#06090f] flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="max-w-xl w-full bg-[#0d1322] border border-emerald-500/30 rounded-lg p-6 shadow-2xl relative overflow-hidden">
        {/* Glow corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400" />

        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
              Boot Sequence // Lab Kernel v4.3
            </span>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onComplete();
            }}
            className="text-xs px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1 transition-colors"
          >
            Skip <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-2.5 min-h-[180px]">
          {bootLogs.slice(0, step).map((log, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm">
              <span className="text-emerald-500 font-bold select-none">&gt;</span>
              <span className={idx === bootLogs.length - 1 ? 'text-emerald-300 font-semibold' : 'text-slate-300'}>
                {log.text}
              </span>
              {idx === step - 1 && (
                <span className="inline-block w-2 h-4 bg-emerald-400 animate-pulse" />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>HOST: SOMAIYA-DCN-NODE-01</span>
          <span>SECURITY: ISOLATED VIRTUAL SANDBOX</span>
        </div>
      </div>
    </div>
  );
};
