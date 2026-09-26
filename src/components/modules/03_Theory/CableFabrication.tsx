import React, { useState } from 'react';
import { Cable, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { playSound } from '../../../lib/sound';

export const CableFabrication: React.FC = () => {
  const [standard, setStandard] = useState<'T568A' | 'T568B'>('T568B');
  const [cableType, setCableType] = useState<'straight' | 'crossover'>('straight');
  const [testResult, setTestResult] = useState<string | null>(null);

  // ANSI/TIA-568-A and TIA-568-B color pinouts
  const t568aColors = [
    { pin: 1, name: 'White-Green', hex: '#86efac', stripe: true },
    { pin: 2, name: 'Green', hex: '#22c55e', stripe: false },
    { pin: 3, name: 'White-Orange', hex: '#fed7aa', stripe: true },
    { pin: 4, name: 'Blue', hex: '#3b82f6', stripe: false },
    { pin: 5, name: 'White-Blue', hex: '#bfdbfe', stripe: true },
    { pin: 6, name: 'Orange', hex: '#f97316', stripe: false },
    { pin: 7, name: 'White-Brown', hex: '#d7ccc8', stripe: true },
    { pin: 8, name: 'Brown', hex: '#795548', stripe: false },
  ];

  const t568bColors = [
    { pin: 1, name: 'White-Orange', hex: '#fed7aa', stripe: true },
    { pin: 2, name: 'Orange', hex: '#f97316', stripe: false },
    { pin: 3, name: 'White-Green', hex: '#86efac', stripe: true },
    { pin: 4, name: 'Blue', hex: '#3b82f6', stripe: false },
    { pin: 5, name: 'White-Blue', hex: '#bfdbfe', stripe: true },
    { pin: 6, name: 'Green', hex: '#22c55e', stripe: false },
    { pin: 7, name: 'White-Brown', hex: '#d7ccc8', stripe: true },
    { pin: 8, name: 'Brown', hex: '#795548', stripe: false },
  ];

  const endA = standard === 'T568A' ? t568aColors : t568bColors;
  const endB = cableType === 'straight' 
    ? (standard === 'T568A' ? t568aColors : t568bColors)
    : (standard === 'T568A' ? t568bColors : t568aColors);

  const runContinuityTest = () => {
    playSound('success');
    if (cableType === 'straight') {
      setTestResult('CONTINUITY PASS (1:1 Pins Match): Certified for Switch <-> Host / Router connections.');
    } else {
      setTestResult('CONTINUITY PASS (Pins 1/2 Swap with 3/6): Certified for Host <-> Host or Switch <-> Switch direct connections.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cable className="w-5 h-5 text-emerald-400" />
            <span>LAN Cable Fabrication (ANSI/TIA-568-A vs T568-B)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Experiment 02: UTP Cat6 Termination & RJ-45 Modular Plug Pinout Standards.
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                playSound('click');
                setStandard('T568A');
                setTestResult(null);
              }}
              className={`px-3 py-1 rounded ${standard === 'T568A' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
            >
              T568-A
            </button>
            <button
              onClick={() => {
                playSound('click');
                setStandard('T568B');
                setTestResult(null);
              }}
              className={`px-3 py-1 rounded ${standard === 'T568B' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
            >
              T568-B (Standard)
            </button>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                playSound('click');
                setCableType('straight');
                setTestResult(null);
              }}
              className={`px-3 py-1 rounded ${cableType === 'straight' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
            >
              Straight-Through
            </button>
            <button
              onClick={() => {
                playSound('click');
                setCableType('crossover');
                setTestResult(null);
              }}
              className={`px-3 py-1 rounded ${cableType === 'crossover' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
            >
              Crossover
            </button>
          </div>
        </div>
      </div>

      {/* Visual RJ-45 Pinout Connectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* End A Connector */}
        <div className="p-5 rounded-xl bg-[#0d1322] border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase">
              RJ-45 Connector End A ({standard})
            </span>
            <span className="text-[10px] font-mono text-slate-400">8P8C Pins</span>
          </div>

          <div className="space-y-2">
            {endA.map(w => (
              <div key={w.pin} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-5 text-slate-400 font-bold">P{w.pin}</span>
                <div 
                  className="w-10 h-4 rounded border border-slate-700/60 shadow-inner"
                  style={{
                    backgroundColor: w.hex,
                    backgroundImage: w.stripe 
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.7) 3px, rgba(255,255,255,0.7) 6px)' 
                      : 'none'
                  }}
                />
                <span className="text-slate-200">{w.name}</span>
                <span className="text-[10px] text-slate-500 ml-auto">
                  {w.pin === 1 || w.pin === 2 ? 'Tx Pair' : w.pin === 3 || w.pin === 6 ? 'Rx Pair' : 'Spare/PoE'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* End B Connector */}
        <div className="p-5 rounded-xl bg-[#0d1322] border border-slate-800">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
              RJ-45 Connector End B ({cableType === 'straight' ? standard : (standard === 'T568A' ? 'T568B' : 'T568A')})
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              {cableType === 'straight' ? 'Identical Pinout' : 'Crossed Tx/Rx Pins'}
            </span>
          </div>

          <div className="space-y-2">
            {endB.map(w => (
              <div key={w.pin} className="flex items-center gap-3 text-xs font-mono">
                <span className="w-5 text-slate-400 font-bold">P{w.pin}</span>
                <div 
                  className="w-10 h-4 rounded border border-slate-700/60 shadow-inner"
                  style={{
                    backgroundColor: w.hex,
                    backgroundImage: w.stripe 
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.7) 3px, rgba(255,255,255,0.7) 6px)' 
                      : 'none'
                  }}
                />
                <span className="text-slate-200">{w.name}</span>
                <span className="text-[10px] text-slate-500 ml-auto">
                  {w.pin === 1 || w.pin === 2 ? 'Tx Pair' : w.pin === 3 || w.pin === 6 ? 'Rx Pair' : 'Spare/PoE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Continuity Tester Button & Output */}
      <div className="p-4 rounded-xl bg-[#0c1220] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-slate-100">Application Rule: </span>
          {cableType === 'straight' 
            ? 'Straight-Through is used between unlike devices (PC to Switch, Switch to Router).'
            : 'Crossover is used between like devices (PC to PC, Switch to Switch, Router to PC) without Auto MDI-X.'}
        </div>
        <button
          onClick={runContinuityTest}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RUN CONTINUITY TEST</span>
        </button>
      </div>

      {testResult && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs font-mono animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}
    </div>
  );
};
