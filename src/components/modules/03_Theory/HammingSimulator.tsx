import React, { useState } from 'react';
import { Binary, CheckCircle2, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import { encodeHamming74, decodeHamming74 } from '../../../lib/network/hamming';
import { playSound } from '../../../lib/sound';

export const HammingSimulator: React.FC = () => {
  // 4 Data bits: D1, D2, D3, D4 (defaults to 1, 0, 1, 1 from the prompt)
  const [dataBits, setDataBits] = useState<number[]>([1, 0, 1, 1]);

  // Compute transmitted codeword
  const encoded = encodeHamming74(dataBits[0], dataBits[1], dataBits[2], dataBits[3]);

  // Received bits in transmission channel (initially matches encoded)
  const [channelBits, setChannelBits] = useState<number[]>([...encoded.encodedBits]);

  // Calculate syndrome & error position
  const syndromeResult = decodeHamming74(channelBits);

  const handleToggleDataBit = (index: number) => {
    playSound('click');
    const next = [...dataBits];
    next[index] = next[index] === 1 ? 0 : 1;
    setDataBits(next);
    const newEncoded = encodeHamming74(next[0], next[1], next[2], next[3]);
    setChannelBits([...newEncoded.encodedBits]);
  };

  const handleToggleChannelBit = (index: number) => {
    playSound('alert');
    const next = [...channelBits];
    next[index] = next[index] === 1 ? 0 : 1;
    setChannelBits(next);
  };

  const handleResetToClean = () => {
    playSound('repair');
    setChannelBits([...encoded.encodedBits]);
  };

  const bitLabels = [
    { pos: 1, name: 'P1 (Parity)', isParity: true },
    { pos: 2, name: 'P2 (Parity)', isParity: true },
    { pos: 3, name: 'D1 (Data)', isParity: false },
    { pos: 4, name: 'P4 (Parity)', isParity: true },
    { pos: 5, name: 'D2 (Data)', isParity: false },
    { pos: 6, name: 'D3 (Data)', isParity: false },
    { pos: 7, name: 'D4 (Data)', isParity: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Binary className="w-5 h-5 text-emerald-400" />
            <span>Hamming Code (7,4) Error Detection & Single-Bit Correction</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Richard Hamming's Linear Block Code with Even Parity and 3-Bit Syndrome Vectoring.
          </p>
        </div>

        <button
          onClick={handleResetToClean}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restore Original Codeword</span>
        </button>
      </div>

      {/* Step 1: Input 4 Data Bits */}
      <div className="p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase">
            Step 1: Input 4-Bit Data Word (Click to Toggle 0/1)
          </span>
          <span className="text-[11px] font-mono text-emerald-400">
            Word: [{dataBits.join('')}]
          </span>
        </div>

        <div className="grid grid-cols-4 gap-3 max-w-md">
          {dataBits.map((b, idx) => (
            <button
              key={idx}
              onClick={() => handleToggleDataBit(idx)}
              className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500 font-mono text-center transition-all group"
            >
              <div className="text-[10px] text-slate-500 mb-1">D{idx + 1}</div>
              <div className="text-2xl font-bold text-emerald-400 group-hover:scale-110 transition-transform">
                {b}
              </div>
            </button>
          ))}
        </div>

        {/* Parity Bit Equations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 font-mono text-xs">
          <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-emerald-400 font-bold">P1 = D1 ⊕ D2 ⊕ D4</span>
            <div className="text-slate-400 mt-1">
              = {dataBits[0]} ⊕ {dataBits[1]} ⊕ {dataBits[3]} = <span className="text-emerald-300 font-bold">{encoded.p1}</span>
            </div>
            <div className="text-[10px] text-slate-500">Covers bits 1, 3, 5, 7</div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-cyan-400 font-bold">P2 = D1 ⊕ D3 ⊕ D4</span>
            <div className="text-slate-400 mt-1">
              = {dataBits[0]} ⊕ {dataBits[2]} ⊕ {dataBits[3]} = <span className="text-cyan-300 font-bold">{encoded.p2}</span>
            </div>
            <div className="text-[10px] text-slate-500">Covers bits 2, 3, 6, 7</div>
          </div>

          <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
            <span className="text-amber-400 font-bold">P4 = D2 ⊕ D3 ⊕ D4</span>
            <div className="text-slate-400 mt-1">
              = {dataBits[1]} ⊕ {dataBits[2]} ⊕ {dataBits[3]} = <span className="text-amber-300 font-bold">{encoded.p4}</span>
            </div>
            <div className="text-[10px] text-slate-500">Covers bits 4, 5, 6, 7</div>
          </div>
        </div>
      </div>

      {/* Step 2: Channel Bit-Flipper (Inject Transmission Error) */}
      <div className="p-5 rounded-xl bg-[#0d1322] border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase">
            Step 2: Transmission Channel (Click ANY Bit to Corrupt / Flip)
          </span>
          <span className="text-[11px] font-mono text-amber-400">
            Noise Injection Simulator
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {channelBits.map((b, idx) => {
            const isFlipped = b !== encoded.encodedBits[idx];
            const meta = bitLabels[idx];

            return (
              <button
                key={idx}
                onClick={() => handleToggleChannelBit(idx)}
                className={`p-3 rounded-xl border font-mono text-center transition-all ${
                  isFlipped
                    ? 'bg-rose-500/20 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)] animate-pulse'
                    : meta.isParity
                    ? 'bg-slate-900 border-slate-700/80 hover:border-slate-500'
                    : 'bg-slate-900/90 border-slate-700 hover:border-emerald-500'
                }`}
              >
                <div className="text-[9px] text-slate-400 mb-1 truncate">
                  {meta.name}
                </div>
                <div className={`text-xl font-bold ${isFlipped ? 'text-rose-400' : 'text-slate-100'}`}>
                  {b}
                </div>
                <div className="text-[9px] text-slate-500 mt-1">Pos {idx + 1}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Receiver Syndrome Calculation & Forward Error Correction */}
      <div className="p-5 rounded-xl bg-[#0b101d] border border-slate-800 space-y-4">
        <div className="text-xs font-mono font-bold text-slate-300 uppercase">
          Step 3: Receiver Syndrome Calculation (S4, S2, S1)
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
          <div className="p-3 rounded-lg bg-black/50 border border-slate-800">
            <span className="text-slate-400">Syndrome Bit S1 (1,3,5,7):</span>
            <div className="text-base font-bold text-slate-100 mt-1">
              S1 = {syndromeResult.s1}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/50 border border-slate-800">
            <span className="text-slate-400">Syndrome Bit S2 (2,3,6,7):</span>
            <div className="text-base font-bold text-slate-100 mt-1">
              S2 = {syndromeResult.s2}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-black/50 border border-slate-800">
            <span className="text-slate-400">Syndrome Bit S4 (4,5,6,7):</span>
            <div className="text-base font-bold text-slate-100 mt-1">
              S4 = {syndromeResult.s4}
            </div>
          </div>
        </div>

        {/* Syndrome Conclusion */}
        <div className="p-4 rounded-xl border font-mono text-xs flex items-center justify-between gap-4 bg-slate-900/60">
          <div>
            <div className="text-slate-400">Syndrome Decimal Value (S4 S2 S1)₂:</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">
              {syndromeResult.syndromeDecimal} (Binary: {syndromeResult.s4}{syndromeResult.s2}{syndromeResult.s1}₂)
            </div>
          </div>

          <div className="text-right">
            {syndromeResult.hasError ? (
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Error Detected at Bit Position {syndromeResult.errorPosition}!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Zero Transmission Errors (Codeword Valid)</span>
              </div>
            )}
            {syndromeResult.hasError && (
              <div className="text-[11px] text-slate-400 mt-1">
                Auto-Correction Rule: Bit at Pos {syndromeResult.errorPosition} inverted to restore valid data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
