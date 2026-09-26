import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ChevronDown, Gamepad2, ScanSearch, Timer } from 'lucide-react';
import { EASE_NET, LinkLoader, PacketPath } from '@/components/motion/PacketPath';
import { playSound } from '@/lib/sound';
import { ForwardingPlaneGame } from './ForwardingPlaneGame';

const RoguePacketGame = lazy(() => import('./rogue-packet/RoguePacketGame').then(m => ({ default: m.RoguePacketGame })));

type Mode = 'idle' | 'entering' | 'playing' | 'exiting';

const cleared = () => {
  try {
    return (JSON.parse(localStorage.getItem('dcn-lab:rogue-packet') ?? '[]') as number[]).length;
  } catch {
    return 0;
  }
};

export function MinigameHub({ onProceedToConclusion }: { onProceedToConclusion: () => void }) {
  const [mode, setMode] = useState<Mode>('idle');
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [drill, setDrill] = useState(false);
  const [progress, setProgress] = useState(cleared);
  const after = useRef<(() => void) | null>(null);
  const reduce = useReducedMotion();
  const enterBtn = useRef<HTMLButtonElement>(null);

  const enter = () => {
    const r = enterBtn.current?.getBoundingClientRect();
    setOrigin(r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    playSound('success');
    setMode('entering');
  };

  const exit = (then?: () => void) => {
    after.current = then ?? null;
    setMode('exiting');
  };

  useEffect(() => {
    if (mode === 'idle') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mode]);

  useEffect(() => {
    if (mode === 'entering') {
      const t = window.setTimeout(() => setMode('playing'), reduce ? 0 : 900);
      return () => clearTimeout(t);
    }
    if (mode === 'exiting') {
      const t = window.setTimeout(() => {
        setMode('idle');
        setProgress(cleared());
        after.current?.();
        after.current = null;
      }, reduce ? 0 : 750);
      return () => clearTimeout(t);
    }
  }, [mode, reduce]);

  const W = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const Hh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const far = Math.hypot(Math.max(origin.x, W - origin.x), Math.max(origin.y, Hh - origin.y)) + 40;
  const closed = `circle(0px at ${origin.x}px ${origin.y}px)`;
  const opened = `circle(${far}px at ${origin.x}px ${origin.y}px)`;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-40 pt-8 sm:px-6 sm:pt-10">
      {/* Landing */}
      <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400">
            <span className="h-px w-6 bg-emerald-400" aria-hidden />
            07 · Mini game
          </div>
          <h2 className="mt-3 font-display text-5xl font-semibold uppercase leading-[0.95] tracking-tight text-slate-50 sm:text-6xl">
            Rogue <span className="text-violet-200">Packet</span>
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300">Something is wrong with the network. Find it before the network fails.</p>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-400">
            Walk a live network operations centre. Inspect PCs, switches, the router and the server; ping and traceroute from any host; tag the rogue packet
            and follow it hop by hop. Then name the device that&rsquo;s breaking the network.
          </p>
          <ul className="mt-6 grid max-w-xl grid-cols-2 gap-x-6 gap-y-2 font-mono text-xs text-slate-400">
            <li><span className="text-slate-100">7</span> rooms to explore</li>
            <li><span className="text-slate-100">11</span> randomized faults</li>
            <li><span className="text-slate-100">5</span> levels · L1 → routing</li>
            <li><span className="text-slate-100">{progress}</span> / 5 cleared</li>
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              ref={enterBtn}
              type="button"
              onClick={enter}
              className="group relative inline-flex h-12 items-center gap-3 rounded-md bg-emerald-500 px-6 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
            >
              <span className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-emerald-300 bg-[#0c0b09]" aria-hidden />
              Enter the network
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="text-xs text-slate-500">Keyboard &amp; mouse recommended · touch supported</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-[#11100e]/80 p-5 sm:p-6">
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
            <span>Live incident</span>
            <span className="flex items-center gap-1.5 text-amber-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-300" /> degraded
            </span>
          </div>
          <PacketPath nodes={['PC-03', 'SW-02', 'SW-01', 'R-01', 'SRV-01']} broken={2} loop failLabel="Rogue packet lost — somewhere" className="mt-4" />
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-800 pt-4 text-xs">
            {[
              ['Inspect', 'Walk up, press E'],
              ['Test', 'Ping · traceroute'],
              ['Trace', 'Follow the rogue'],
            ].map(([a, b]) => (
              <div key={a}>
                <div className="font-medium text-slate-100">{a}</div>
                <div className="text-slate-500">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick drill */}
      <div className="mt-14 rounded-lg border border-slate-800 bg-[#11100e]/60">
        <button
          type="button"
          onClick={() => setDrill(d => !d)}
          className="flex w-full items-center gap-4 px-5 py-4 text-left"
          aria-expanded={drill}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-700 text-emerald-300">
            <Timer className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-slate-100">Quick drill: Forwarding Plane</span>
            <span className="block text-xs text-slate-500">Five-minute router drill — ACL, TTL and longest-prefix match under queue pressure.</span>
          </span>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${drill ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence initial={false}>
          {drill && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EASE_NET }} className="overflow-hidden">
              <div className="-mt-6 border-t border-slate-800">
                <ForwardingPlaneGame onProceedToConclusion={onProceedToConclusion} embedded />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8 flex justify-end">
        <button type="button" onClick={onProceedToConclusion} className="group inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-100">
          Continue to lab report <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Enter-the-network transition + game — portalled so no ancestor stacking context can trap it */}
      {createPortal(
      <AnimatePresence>
        {mode !== 'idle' && (
          <motion.div
            key="world"
            className="fixed inset-0 z-[65] bg-[#090806]"
            initial={{ clipPath: reduce ? opened : closed }}
            animate={{ clipPath: mode === 'exiting' ? `circle(0px at ${W / 2}px ${Hh / 2}px)` : opened }}
            transition={{ duration: mode === 'exiting' ? 0.7 : 0.85, ease: [0.65, 0, 0.35, 1] }}
          >
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center">
                  <LinkLoader label="Joining the network" />
                </div>
              }
            >
              <RoguePacketGame onExit={() => exit()} onReport={() => exit(onProceedToConclusion)} />
            </Suspense>

            {/* Node-burst: the button's node expands, links fly outward */}
            {!reduce && (mode === 'entering' || mode === 'exiting') && (
              <motion.svg
                className="pointer-events-none absolute inset-0 h-full w-full"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                transition={{ delay: mode === 'entering' ? 0.45 : 0, duration: 0.5 }}
                aria-hidden
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const a = (i / 10) * Math.PI * 2;
                  const cx = mode === 'entering' ? origin.x : W / 2;
                  const cy = mode === 'entering' ? origin.y : Hh / 2;
                  return (
                    <motion.line
                      key={i}
                      x1={cx}
                      y1={cy}
                      stroke="rgb(255 122 56 / 0.6)"
                      strokeWidth={1.2}
                      initial={{ x2: cx, y2: cy }}
                      animate={{ x2: cx + Math.cos(a) * far, y2: cy + Math.sin(a) * far }}
                      transition={{ duration: 0.8, ease: EASE_NET }}
                    />
                  );
                })}
                <motion.circle
                  cx={mode === 'entering' ? origin.x : W / 2}
                  cy={mode === 'entering' ? origin.y : Hh / 2}
                  fill="none"
                  stroke="rgb(255 122 56)"
                  strokeWidth={2}
                  initial={{ r: 6 }}
                  animate={{ r: 90 }}
                  transition={{ duration: 0.7, ease: EASE_NET }}
                />
              </motion.svg>
            )}

            <AnimatePresence>
              {mode === 'entering' && !reduce && (
                <motion.div
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                >
                  <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.3em] text-emerald-300">
                    <Gamepad2 className="h-4 w-4" /> Entering the network
                    <ScanSearch className="h-4 w-4" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </section>
  );
}
