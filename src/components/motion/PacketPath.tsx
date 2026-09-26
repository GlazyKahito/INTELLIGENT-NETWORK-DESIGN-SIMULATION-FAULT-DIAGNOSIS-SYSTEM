import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

export const EASE_NET: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface PacketPathProps {
  nodes: string[];
  /** Segment index (0 = between node 0 and 1) where the packet is dropped. */
  broken?: number | null;
  /** Replay the packet forever (after the path has been built). */
  loop?: boolean;
  orientation?: 'horizontal' | 'vertical';
  /** Text shown once the packet arrives / drops. */
  okLabel?: string;
  failLabel?: string;
  /** Change this to replay the sequence. */
  runKey?: string | number;
  className?: string;
  compact?: boolean;
}

const STEP = 0.16;
const HOP = 0.34;

/**
 * The site's core motion primitive: nodes activate in order (○ → ◉), links draw
 * between them, then a packet travels the route — arriving, or dropping at a break.
 */
export function PacketPath({
  nodes,
  broken = null,
  loop = false,
  orientation = 'horizontal',
  okLabel,
  failLabel,
  runKey,
  className,
  compact = false,
}: PacketPathProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: !loop, amount: 0.5 });
  const reduce = useReducedMotion();
  const play = inView || !!reduce;

  const gap = compact ? 90 : 130;
  const pad = compact ? 22 : 34;
  const horiz = orientation === 'horizontal';
  const len = (nodes.length - 1) * gap;
  const W = horiz ? len + pad * 2 : compact ? 150 : 190;
  const H = horiz ? (compact ? 62 : 84) : len + pad * 2;
  const pos = (i: number) => (horiz ? { x: pad + i * gap, y: compact ? 22 : 30 } : { x: 36, y: pad + i * gap });

  const built = nodes.length * STEP + 0.15;
  const stopSeg = broken ?? nodes.length - 1;
  const endIdx = broken === null ? nodes.length - 1 : broken;
  const travel = (broken === null ? nodes.length - 1 : broken + 0.55) * HOP;
  const end = broken === null ? pos(nodes.length - 1) : (() => {
    const a = pos(stopSeg);
    const b = pos(stopSeg + 1);
    return { x: a.x + (b.x - a.x) * 0.55, y: a.y + (b.y - a.y) * 0.55 };
  })();
  const keysX = [...Array.from({ length: endIdx + 1 }, (_, i) => pos(i).x), ...(broken !== null ? [end.x] : [])];
  const keysY = [...Array.from({ length: endIdx + 1 }, (_, i) => pos(i).y), ...(broken !== null ? [end.y] : [])];
  const times = keysX.map((_, i) => (keysX.length === 1 ? 1 : i / (keysX.length - 1)));
  const failed = broken !== null;
  const doneAt = built + travel;
  const label = failed ? failLabel : okLabel;

  return (
    <div className={cn('relative', className)} key={runKey}>
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${nodes.join(' → ')}${failed ? ' — packet dropped' : ''}`}>
        {nodes.slice(0, -1).map((_, i) => {
          const a = pos(i);
          const b = pos(i + 1);
          const isBreak = failed && i === broken;
          return (
            <g key={`l${i}`}>
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="hsl(var(--border))" strokeWidth={1.5} />
              <motion.line
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isBreak ? 'rgb(148 163 184 / 0.5)' : 'hsl(var(--primary))'}
                strokeWidth={1.5}
                strokeDasharray={isBreak ? '3 4' : undefined}
                initial={{ pathLength: reduce ? 1 : 0, opacity: 0.9 }}
                animate={play ? { pathLength: 1 } : undefined}
                transition={{ delay: i * STEP + STEP / 2, duration: STEP * 1.4, ease: EASE_NET }}
              />
            </g>
          );
        })}
        {nodes.map((n, i) => {
          const p = pos(i);
          const reached = !failed || i <= (broken ?? 0);
          return (
            <g key={n + i}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={compact ? 5 : 7}
                fill="hsl(var(--background))"
                stroke="hsl(var(--primary))"
                strokeWidth={1.5}
                initial={{ opacity: reduce ? 1 : 0.25 }}
                animate={play ? { opacity: 1 } : undefined}
                transition={{ delay: i * STEP, duration: 0.2 }}
              />
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={compact ? 2.5 : 3.5}
                fill="hsl(var(--primary))"
                initial={{ opacity: reduce && reached ? 1 : 0 }}
                animate={play && reached ? { opacity: 1 } : undefined}
                transition={{ delay: reduce ? 0 : built + i * HOP, duration: 0.2 }}
              />
              <text
                x={horiz ? p.x : p.x + 18}
                y={horiz ? p.y + (compact ? 22 : 28) : p.y + 4}
                textAnchor={horiz ? 'middle' : 'start'}
                className="fill-slate-400 font-mono"
                style={{ fontSize: compact ? 10 : 11 }}
              >
                {n}
              </text>
            </g>
          );
        })}
        {!reduce && (
          <motion.circle
            r={compact ? 3 : 4}
            fill={failed ? 'rgb(226 232 240)' : 'hsl(var(--primary))'}
            initial={{ cx: pos(0).x, cy: pos(0).y, opacity: 0 }}
            animate={play ? { cx: keysX, cy: keysY, opacity: [0, 1, 1, failed ? 0 : 1] } : undefined}
            transition={{
              delay: built,
              duration: travel,
              ease: 'easeInOut',
              times,
              opacity: { delay: built, duration: travel + 0.15, times: [0, 0.05, 0.9, 1] },
              repeat: loop ? Infinity : 0,
              repeatDelay: 1.6,
            }}
            style={{ filter: 'drop-shadow(0 0 4px hsl(var(--primary) / 0.8))' }}
          />
        )}
        {failed && (
          <motion.g
            initial={{ opacity: reduce ? 1 : 0, scale: 0.6 }}
            animate={play ? { opacity: 1, scale: 1 } : undefined}
            transition={{ delay: reduce ? 0 : doneAt, duration: 0.22, ease: EASE_NET }}
            style={{ originX: `${end.x}px`, originY: `${end.y}px` }}
          >
            <path d={`M${end.x - 5} ${end.y - 5}L${end.x + 5} ${end.y + 5}M${end.x + 5} ${end.y - 5}L${end.x - 5} ${end.y + 5}`} stroke="rgb(251 113 133)" strokeWidth={1.8} strokeLinecap="round" />
          </motion.g>
        )}
        {!failed && (
          <motion.circle
            cx={pos(nodes.length - 1).x}
            cy={pos(nodes.length - 1).y}
            r={compact ? 5 : 7}
            fill="none"
            stroke="hsl(var(--primary))"
            initial={{ opacity: 0, scale: 1 }}
            animate={play && !reduce ? { opacity: [0, 0.8, 0], scale: [1, 2.4] } : undefined}
            transition={{ delay: doneAt, duration: 0.7, repeat: loop ? Infinity : 0, repeatDelay: travel + 1.6 - 0.7 + built * 0 }}
            style={{ originX: `${pos(nodes.length - 1).x}px`, originY: `${pos(nodes.length - 1).y}px` }}
          />
        )}
      </svg>
      {label && (
        <motion.div
          className={cn('mt-1 font-mono text-[11px] uppercase tracking-[0.16em]', failed ? 'text-rose-300' : 'text-emerald-300')}
          initial={{ opacity: reduce ? 1 : 0 }}
          animate={play ? { opacity: 1 } : undefined}
          transition={{ delay: reduce ? 0 : doneAt + 0.1, duration: 0.25 }}
        >
          {label}
        </motion.div>
      )}
    </div>
  );
}

/** ○──○──○ → ●──●──● networking loader. */
export function LinkLoader({ label = 'Transmitting', className }: { label?: string; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className={cn('inline-flex items-center gap-2 font-mono text-[11px] text-slate-400', className)} role="status" aria-live="polite">
      <span className="inline-flex items-center" aria-hidden>
        {[0, 1, 2].map(i => (
          <span key={i} className="inline-flex items-center">
            {i > 0 && <span className="h-px w-3 bg-slate-600" />}
            <motion.span
              className="h-1.5 w-1.5 rounded-full border border-emerald-400"
              animate={reduce ? { backgroundColor: 'rgb(96 165 250)' } : { backgroundColor: ['rgba(96,165,250,0)', 'rgb(96,165,250)', 'rgb(96,165,250)', 'rgba(96,165,250,0)'] }}
              transition={{ duration: 1.2, times: [0, 0.2, 0.75, 1], delay: i * 0.18, repeat: Infinity }}
            />
          </span>
        ))}
      </span>
      {label}
    </span>
  );
}
