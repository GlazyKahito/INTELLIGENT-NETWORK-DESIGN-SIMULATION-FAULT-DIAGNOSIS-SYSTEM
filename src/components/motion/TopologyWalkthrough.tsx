import { motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { EASE_NET } from './PacketPath';

const STEPS = [
  {
    node: 'PC',
    layer: 'L7 → L2',
    title: 'The host builds the packet',
    text: 'PC-01 wraps its data in TCP, then IP (src 192.168.1.11 → dst 192.168.2.10). The destination is on another subnet, so it ARPs for its gateway and addresses the Ethernet frame to the router’s MAC.',
  },
  {
    node: 'Switch',
    layer: 'L2',
    title: 'The switch forwards by MAC',
    text: 'SW-01 reads only the destination MAC, looks it up in its CAM table and sends the frame out the one port that leads to the router. It never looks at the IP header.',
  },
  {
    node: 'Router',
    layer: 'L3',
    title: 'The router forwards by IP',
    text: 'R1 strips the frame, decrements TTL, finds the longest matching route (192.168.2.0/24 on Gi0/1), ARPs for the server and re-frames the packet with new MAC addresses.',
  },
  {
    node: 'Server',
    layer: 'L2 → L7',
    title: 'Delivered — and answered',
    text: 'The server de-encapsulates layer by layer, hands the data to the listening process, and the reply retraces the same path in reverse.',
  },
];

const Y = (i: number) => 28 + i * 86;

function Step({ i, active, onActive, children }: { i: number; active: boolean; onActive: (i: number) => void; children: React.ReactNode }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: '-45% 0px -45% 0px' });
  useEffect(() => {
    if (inView) onActive(i);
  }, [inView, i, onActive]);
  return (
    <li ref={ref} className={cn('border-l-2 py-6 pl-5 transition-colors duration-300 md:py-10', active ? 'border-emerald-400' : 'border-slate-800')}>
      {children}
    </li>
  );
}

/** Scroll-driven packet walk: each step adds a hop and the packet moves to it. */
export function TopologyWalkthrough() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const shown = reduce ? STEPS.length - 1 : active;

  return (
    <div className="grid gap-8 md:grid-cols-[220px_1fr] md:gap-12">
      <div className="md:sticky md:top-28 md:self-start">
        <svg viewBox="0 0 220 320" className="mx-auto h-auto w-full max-w-[220px]" role="img" aria-label="Packet path: PC, switch, router, server">
          {STEPS.slice(0, -1).map((_, i) => {
            const lit = i < shown;
            const hot = hover === i || hover === i + 1;
            return (
              <g key={`l${i}`}>
                <line x1={40} y1={Y(i)} x2={40} y2={Y(i + 1)} stroke="rgb(42 41 39)" strokeWidth={2} />
                <motion.line
                  x1={40}
                  y1={Y(i)}
                  x2={40}
                  y2={Y(i + 1)}
                  stroke={hot ? 'rgb(255 201 168)' : 'rgb(255 122 56)'}
                  strokeWidth={2}
                  initial={false}
                  animate={{ pathLength: lit ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: EASE_NET }}
                />
              </g>
            );
          })}
          {STEPS.map((s, i) => {
            const lit = i <= shown;
            return (
              <g key={s.node} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} className="cursor-default">
                <motion.circle
                  cx={40}
                  cy={Y(i)}
                  r={11}
                  fill="#0c0b09"
                  strokeWidth={2}
                  initial={false}
                  animate={{ stroke: lit ? 'rgb(255 122 56)' : 'rgb(65 64 62)', scale: hover === i ? 1.12 : 1 }}
                  transition={{ duration: 0.3 }}
                  style={{ originX: '40px', originY: `${Y(i)}px` }}
                />
                <motion.circle cx={40} cy={Y(i)} r={4.5} fill="rgb(255 122 56)" initial={false} animate={{ opacity: lit ? 1 : 0 }} transition={{ delay: lit ? 0.35 : 0, duration: 0.2 }} />
                <text x={64} y={Y(i) - 2} className={lit ? 'fill-slate-100' : 'fill-slate-600'} style={{ fontSize: 13, fontWeight: 600 }}>
                  {s.node}
                </text>
                <text x={64} y={Y(i) + 13} className="fill-slate-500 font-mono" style={{ fontSize: 10 }}>
                  {s.layer}
                </text>
              </g>
            );
          })}
          {!reduce && (
            <motion.circle
              cx={40}
              r={5}
              fill="rgb(255 201 168)"
              initial={false}
              animate={{ cy: Y(shown) }}
              transition={{ duration: 0.55, ease: [0.65, 0, 0.35, 1] }}
              style={{ filter: 'drop-shadow(0 0 5px rgb(255 122 56))' }}
            />
          )}
        </svg>
      </div>
      <ol>
        {STEPS.map((s, i) => (
          <Step key={s.node} i={i} active={i === shown} onActive={setActive}>
            <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-emerald-400">
              {String(i + 1).padStart(2, '0')} · {s.node} · {s.layer}
            </div>
            <h4 className="mt-1 text-base font-semibold text-slate-100">{s.title}</h4>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-400">{s.text}</p>
          </Step>
        ))}
      </ol>
    </div>
  );
}
