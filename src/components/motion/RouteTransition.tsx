import { motion } from 'motion/react';
import { EASE_NET } from './PacketPath';

const LABEL: Record<string, string> = {
  home: 'Home',
  aim: 'Aim',
  theory: 'Theory',
  design: 'Design',
  simulation: 'Simulate',
  diagnostics: 'Diagnose',
  assessments: 'Assess',
  minigame: 'Rogue Packet',
  conclusion: 'Report',
};

/**
 * Section change as a hop: a packet leaves the old section's node and activates
 * the next one. Simulation → Diagnosis breaks the link; entering the game expands
 * the destination node.
 */
export function RouteTransition({ from, to }: { from: string; to: string }) {
  const variant = from === 'simulation' && to === 'diagnostics' ? 'break' : to === 'minigame' ? 'expand' : 'flow';
  const A = 14;
  const B = 206;
  const stopX = variant === 'break' ? 138 : B;
  return (
    <motion.div
      className="pointer-events-none fixed inset-x-0 top-[4.35rem] z-30 flex justify-center"
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4, transition: { duration: 0.25 } }}
      transition={{ duration: 0.2, ease: EASE_NET }}
      aria-hidden
    >
      <div className="flex items-center gap-3 rounded-full border border-slate-800 bg-[#070a12]/90 px-4 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400 backdrop-blur">
        <span>{LABEL[from] ?? from}</span>
        <svg width={220} height={16} viewBox="0 0 220 16" className="overflow-visible">
          <line x1={A} y1={8} x2={B} y2={8} stroke="rgb(51 65 85)" strokeWidth={1} />
          <motion.line
            x1={A}
            y1={8}
            x2={B}
            y2={8}
            stroke="rgb(52 211 153)"
            strokeWidth={1}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: variant === 'break' ? 0.64 : 1 }}
            transition={{ duration: 0.45, ease: EASE_NET }}
          />
          <circle cx={A} cy={8} r={3.5} fill="rgb(52 211 153)" />
          <motion.circle
            cx={B}
            cy={8}
            r={3.5}
            fill="#070a12"
            stroke={variant === 'break' ? 'rgb(100 116 139)' : 'rgb(52 211 153)'}
            strokeWidth={1.4}
            animate={variant === 'break' ? {} : { fill: 'rgb(52 211 153)' }}
            transition={{ delay: 0.45, duration: 0.15 }}
          />
          <motion.circle
            r={2.4}
            cy={8}
            fill="rgb(167 243 208)"
            initial={{ cx: A, opacity: 1 }}
            animate={{ cx: stopX, opacity: variant === 'break' ? [1, 1, 0] : [1, 1, 0] }}
            transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1], opacity: { times: [0, 0.9, 1], duration: 0.5 } }}
          />
          {variant === 'break' && (
            <motion.path
              d={`M${stopX - 4} 4 L${stopX + 4} 12 M${stopX + 4} 4 L${stopX - 4} 12`}
              stroke="rgb(251 113 133)"
              strokeWidth={1.5}
              strokeLinecap="round"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45, duration: 0.18 }}
              style={{ originX: `${stopX}px`, originY: '8px' }}
            />
          )}
          {variant === 'expand' && (
            <motion.circle
              cx={B}
              cy={8}
              r={3.5}
              fill="none"
              stroke="rgb(196 181 253)"
              strokeWidth={1.2}
              initial={{ scale: 1, opacity: 0 }}
              animate={{ scale: 5, opacity: [0, 0.9, 0] }}
              transition={{ delay: 0.45, duration: 0.55, ease: EASE_NET }}
              style={{ originX: `${B}px`, originY: '8px' }}
            />
          )}
        </svg>
        <span className={variant === 'break' ? 'text-rose-300' : 'text-emerald-300'}>{variant === 'break' ? `${LABEL[to]} · fault` : LABEL[to] ?? to}</span>
      </div>
    </motion.div>
  );
}
