import React, { useState } from 'react';
import { Cable, CheckCircle2, AlertCircle, RefreshCw, Zap, ShieldCheck } from 'lucide-react';
import { playSound } from '../../../lib/sound';

export const CableFabrication: React.FC = () => {
  const [standard, setStandard] = useState<'T568A' | 'T568B'>('T568B');
  const [cableType, setCableType] = useState<'straight' | 'crossover'>('straight');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [activePin, setActivePin] = useState<number | null>(null);

  // ANSI/TIA-568-A and TIA-568-B color pinouts
  const t568aColors = [
    { pin: 1, name: 'White-Green', pair: 'Pair 3 (Rx+)', hex: '#86efac', stripe: true },
    { pin: 2, name: 'Green', pair: 'Pair 3 (Rx-)', hex: '#22c55e', stripe: false },
    { pin: 3, name: 'White-Orange', pair: 'Pair 2 (Tx+)', hex: '#fed7aa', stripe: true },
    { pin: 4, name: 'Blue', pair: 'Pair 1 (PoE)', hex: '#3b82f6', stripe: false },
    { pin: 5, name: 'White-Blue', pair: 'Pair 1 (PoE)', hex: '#bfdbfe', stripe: true },
    { pin: 6, name: 'Orange', pair: 'Pair 2 (Tx-)', hex: '#f97316', stripe: false },
    { pin: 7, name: 'White-Brown', pair: 'Pair 4 (Spare)', hex: '#d7ccc8', stripe: true },
    { pin: 8, name: 'Brown', pair: 'Pair 4 (Spare)', hex: '#795548', stripe: false },
  ];

  const t568bColors = [
    { pin: 1, name: 'White-Orange', pair: 'Pair 2 (Tx+)', hex: '#fed7aa', stripe: true },
    { pin: 2, name: 'Orange', pair: 'Pair 2 (Tx-)', hex: '#f97316', stripe: false },
    { pin: 3, name: 'White-Green', pair: 'Pair 3 (Rx+)', hex: '#86efac', stripe: true },
    { pin: 4, name: 'Blue', pair: 'Pair 1 (PoE)', hex: '#3b82f6', stripe: false },
    { pin: 5, name: 'White-Blue', pair: 'Pair 1 (PoE)', hex: '#bfdbfe', stripe: true },
    { pin: 6, name: 'Green', pair: 'Pair 3 (Rx-)', hex: '#22c55e', stripe: false },
    { pin: 7, name: 'White-Brown', pair: 'Pair 4 (Spare)', hex: '#d7ccc8', stripe: true },
    { pin: 8, name: 'Brown', pair: 'Pair 4 (Spare)', hex: '#795548', stripe: false },
  ];

  const endA = standard === 'T568A' ? t568aColors : t568bColors;
  const endB = cableType === 'straight' 
    ? (standard === 'T568A' ? t568aColors : t568bColors)
    : (standard === 'T568A' ? t568bColors : t568aColors);

  const runContinuityTest = () => {
    playSound('success');
    if (cableType === 'straight') {
      setTestResult('CONTINUITY PASS (1:1 Pins Match): Certified for Switch <-> Host or Switch <-> Router patch connections.');
    } else {
      setTestResult('CONTINUITY PASS (Pins 1/2 Swap with 3/6): Certified for Direct Host <-> Host or Switch <-> Switch uplinks without Auto-MDIX.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-[#0d1322] rounded-2xl border border-slate-800 shadow-xl">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Cable className="w-5 h-5 text-emerald-400" />
            <span>LAN Cable Fabrication (ANSI/TIA-568-A vs TIA-568-B)</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            UTP Cat6 Termination, RJ-45 (8P8C) Modular Plug Pinout Standards & Cable Continuity Tester.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                playSound('click');
                setStandard('T568A');
                setTestResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                standard === 'T568A' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              T568-A
            </button>
            <button
              onClick={() => {
                playSound('click');
                setStandard('T568B');
                setTestResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                standard === 'T568B' ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              T568-B (Commercial)
            </button>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => {
                playSound('click');
                setCableType('straight');
                setTestResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                cableType === 'straight' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Straight-Through
            </button>
            <button
              onClick={() => {
                playSound('click');
                setCableType('crossover');
                setTestResult(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                cableType === 'crossover' ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Crossover
            </button>
          </div>
        </div>
      </div>

      {/* Visual RJ-45 Modular Connectors Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* End A Connector */}
        <div className="p-6 rounded-2xl bg-[#0b101d] border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                RJ-45 Plug Connector End A ({standard})
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">8P8C Gold Pins</span>
          </div>

          {/* Wire strip layout */}
          <div className="space-y-2">
            {endA.map(w => (
              <div 
                key={w.pin} 
                onMouseEnter={() => setActivePin(w.pin)}
                onMouseLeave={() => setActivePin(null)}
                className={`flex items-center gap-3 text-xs font-mono p-2 rounded-xl border transition-all ${
                  activePin === w.pin
                    ? 'bg-slate-800 border-emerald-500/60 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className="w-6 text-slate-400 font-bold">Pin {w.pin}</span>
                <div 
                  className="w-12 h-4 rounded-md border border-slate-700/60 shadow-inner"
                  style={{
                    backgroundColor: w.hex,
                    backgroundImage: w.stripe 
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.7) 3px, rgba(255,255,255,0.7) 6px)' 
                      : 'none'
                  }}
                />
                <span className="text-slate-200 font-medium">{w.name}</span>
                <span className="text-[10px] text-slate-500 ml-auto font-mono">
                  {w.pair}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* End B Connector */}
        <div className="p-6 rounded-2xl bg-[#0b101d] border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                RJ-45 Plug Connector End B ({cableType === 'straight' ? standard : (standard === 'T568A' ? 'T568B' : 'T568A')})
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500">
              {cableType === 'straight' ? 'Parallel Wiring' : 'Crossed Pairs'}
            </span>
          </div>

          <div className="space-y-2">
            {endB.map(w => (
              <div 
                key={w.pin} 
                onMouseEnter={() => setActivePin(w.pin)}
                onMouseLeave={() => setActivePin(null)}
                className={`flex items-center gap-3 text-xs font-mono p-2 rounded-xl border transition-all ${
                  activePin === w.pin
                    ? 'bg-slate-800 border-cyan-500/60 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <span className="w-6 text-slate-400 font-bold">Pin {w.pin}</span>
                <div 
                  className="w-12 h-4 rounded-md border border-slate-700/60 shadow-inner"
                  style={{
                    backgroundColor: w.hex,
                    backgroundImage: w.stripe 
                      ? 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.7) 3px, rgba(255,255,255,0.7) 6px)' 
                      : 'none'
                  }}
                />
                <span className="text-slate-200 font-medium">{w.name}</span>
                <span className="text-[10px] text-slate-500 ml-auto font-mono">
                  {w.pair}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Continuity Tester Button & Output */}
      <div className="p-5 rounded-2xl bg-[#0c1220] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="text-xs text-slate-300">
          <span className="font-bold text-slate-100">Engineering Rule: </span>
          {cableType === 'straight' 
            ? 'Straight-Through connects dissimilar devices (PC to Switch, Switch to Router). Pins 1:1 match.'
            : 'Crossover connects similar devices (PC to PC, Switch to Switch) by mapping Tx pairs (1,2) to Rx pairs (3,6).'}
        </div>
        <button
          onClick={runContinuityTest}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs font-mono transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0 active:scale-95 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RUN PIN CONTINUITY TEST</span>
        </button>
      </div>

      {testResult && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs font-mono animate-in fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{testResult}</span>
        </div>
      )}
    </div>
  );
};
