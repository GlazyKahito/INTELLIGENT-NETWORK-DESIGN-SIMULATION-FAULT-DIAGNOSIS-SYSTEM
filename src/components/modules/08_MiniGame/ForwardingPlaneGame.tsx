import React, { useEffect, useReducer, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion, type Variants } from 'motion/react';
import { notifyNet } from '@/components/motion/NetStatus';
import { ArrowRight, Check, Lightbulb, Pause, Play, RotateCcw, Star, X } from 'lucide-react';
import { playSound } from '@/lib/sound';
import { cn } from '@/lib/utils';
import {
  EGRESS_NAME,
  EGRESS_ORDER,
  LEVELS,
  decide,
  generatePackets,
  serviceName,
  toBits,
  type Egress,
  type Level,
  type Packet,
  type Route,
  type Verdict,
} from '@/lib/network/forwarding';

// ---------------------------------------------------------------------------
// State

type Status = 'title' | 'briefing' | 'playing' | 'paused' | 'levelEnd' | 'failed' | 'complete';

interface Decision {
  packet: Packet;
  chosen: Egress | 'timeout' | 'overflow';
  verdict: Verdict;
  correct: boolean;
  points: number;
  reaction: number;
  hinted: boolean;
}

interface LevelResult {
  score: number;
  correct: number;
  total: number;
  bestStreak: number;
  avgReaction: number;
  stars: number;
  mistakes: Decision[];
}

interface State {
  status: Status;
  levelIdx: number;
  packets: Packet[];
  spawned: number;
  queue: Packet[];
  headAge: number;
  nextSpawnIn: number;
  levelScore: number;
  streak: number;
  bestStreak: number;
  health: number;
  hinted: boolean;
  decisions: Decision[];
  last: Decision | null;
  results: (LevelResult | undefined)[];
}

type Action =
  | { type: 'brief'; levelIdx: number }
  | { type: 'begin'; packets: Packet[] }
  | { type: 'tick'; dt: number }
  | { type: 'choose'; egress: Egress }
  | { type: 'hint' }
  | { type: 'pause' }
  | { type: 'resume' }
  | { type: 'reset' };

const initialState: State = {
  status: 'title',
  levelIdx: 0,
  packets: [],
  spawned: 0,
  queue: [],
  headAge: 0,
  nextSpawnIn: 0,
  levelScore: 0,
  streak: 0,
  bestStreak: 0,
  health: 100,
  hinted: false,
  decisions: [],
  last: null,
  results: [],
};

const PENALTY = { wrong: 10, timeout: 12, overflow: 6 };
const HINT_COST = 50;

function settle(s: State): State {
  const level = LEVELS[s.levelIdx];
  if (s.health <= 0) return { ...s, health: 0, status: 'failed' };
  if (s.spawned < s.packets.length || s.queue.length > 0) return s;

  const correct = s.decisions.filter(d => d.correct).length;
  const answered = s.decisions.filter(d => d.chosen !== 'timeout' && d.chosen !== 'overflow');
  const accuracy = correct / level.packetCount;
  const result: LevelResult = {
    score: s.levelScore,
    correct,
    total: level.packetCount,
    bestStreak: s.bestStreak,
    avgReaction: answered.length ? answered.reduce((a, d) => a + d.reaction, 0) / answered.length : 0,
    stars: accuracy >= 0.9 && s.health >= 60 ? 3 : accuracy >= 0.75 ? 2 : 1,
    mistakes: s.decisions.filter(d => !d.correct),
  };
  const results = [...s.results];
  results[s.levelIdx] = result;
  return { ...s, results, status: s.levelIdx === LEVELS.length - 1 ? 'complete' : 'levelEnd' };
}

function reducer(s: State, a: Action): State {
  const level = LEVELS[s.levelIdx];
  switch (a.type) {
    case 'brief':
      return { ...s, status: 'briefing', levelIdx: a.levelIdx, queue: [], last: null };
    case 'begin':
      return {
        ...s,
        status: 'playing',
        packets: a.packets,
        spawned: 0,
        queue: [],
        headAge: 0,
        nextSpawnIn: 0.4,
        levelScore: 0,
        streak: 0,
        bestStreak: 0,
        health: 100,
        hinted: false,
        decisions: [],
        last: null,
      };
    case 'tick': {
      if (s.status !== 'playing') return s;
      let { queue, spawned, nextSpawnIn, headAge, health, streak, hinted, last } = s;
      const decisions = [...s.decisions];

      nextSpawnIn -= a.dt;
      if (nextSpawnIn <= 0 && spawned < s.packets.length) {
        const p = s.packets[spawned];
        spawned++;
        nextSpawnIn += level.spawnEvery;
        if (queue.length >= level.queueCap) {
          last = { packet: p, chosen: 'overflow', verdict: decide(p, level), correct: false, points: 0, reaction: 0, hinted: false };
          decisions.push(last);
          health -= PENALTY.overflow;
          streak = 0;
        } else {
          if (queue.length === 0) headAge = 0;
          queue = [...queue, p];
        }
      }

      if (queue.length) {
        headAge += a.dt;
        if (headAge >= level.deadline) {
          const p = queue[0];
          last = { packet: p, chosen: 'timeout', verdict: decide(p, level), correct: false, points: 0, reaction: level.deadline, hinted };
          decisions.push(last);
          queue = queue.slice(1);
          headAge = 0;
          hinted = false;
          health -= PENALTY.timeout;
          streak = 0;
        }
      }

      return settle({ ...s, queue, spawned, nextSpawnIn, headAge, health, streak, hinted, last, decisions });
    }
    case 'choose': {
      if (s.status !== 'playing' || !s.queue.length) return s;
      const packet = s.queue[0];
      const verdict = decide(packet, level);
      const correct = verdict.egress === a.egress;
      const speed = Math.max(0, 1 - s.headAge / level.deadline);
      const mult = 1 + Math.min(s.streak, 8) * 0.125;
      const points = correct ? Math.max(10, Math.round((100 + 60 * speed) * mult) - (s.hinted ? HINT_COST : 0)) : 0;
      const decision: Decision = { packet, chosen: a.egress, verdict, correct, points, reaction: s.headAge, hinted: s.hinted };
      const streak = correct ? s.streak + 1 : 0;
      return settle({
        ...s,
        queue: s.queue.slice(1),
        headAge: 0,
        hinted: false,
        streak,
        bestStreak: Math.max(s.bestStreak, streak),
        health: correct ? s.health : s.health - PENALTY.wrong,
        levelScore: s.levelScore + points,
        decisions: [...s.decisions, decision],
        last: decision,
      });
    }
    case 'hint':
      return s.status === 'playing' && s.queue.length && !s.hinted ? { ...s, hinted: true } : s;
    case 'pause':
      return s.status === 'playing' ? { ...s, status: 'paused' } : s;
    case 'resume':
      return s.status === 'paused' ? { ...s, status: 'playing' } : s;
    case 'reset':
      return initialState;
  }
}

// ---------------------------------------------------------------------------
// Persistence (per-viewer convenience only)

const BEST_KEY = 'dcn-lab:forwarding-plane-best';
const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0;
  } catch {
    return 0;
  }
};
const writeBest = (v: number) => {
  try {
    localStorage.setItem(BEST_KEY, String(v));
  } catch {
    /* storage unavailable */
  }
};

// ---------------------------------------------------------------------------
// Small UI pieces

const panel = 'rounded-lg border border-slate-800 bg-[#0a0f1a]/90';
const label = 'font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500';
const KEYS: Record<Egress, string> = { gi0: '1', gi1: '2', se0: '3', drop: '4' };

function AnimatedNumber({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(prev.current, value, {
      duration: 0.5,
      ease: 'easeOut',
      onUpdate: v => {
        node.textContent = Math.round(v).toLocaleString();
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return <span ref={ref}>{value.toLocaleString()}</span>;
}

function Stars({ count, size = 'h-4 w-4' }: { count: number; size?: string }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${count} of 3 stars`}>
      {[1, 2, 3].map(i => (
        <Star key={i} className={cn(size, i <= count ? 'fill-amber-400 text-amber-400' : 'text-slate-700')} aria-hidden />
      ))}
    </span>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">{children}</kbd>;
}

function BinaryLens({ ip, route }: { ip: string; route: Route }) {
  const dst = toBits(ip);
  const net = toBits(route.prefix);
  const row = (bits: string, isNet: boolean) =>
    [0, 1, 2, 3].map(o => (
      <span key={o} className="inline-flex">
        {bits
          .slice(o * 8, o * 8 + 8)
          .split('')
          .map((b, i) => {
            const idx = o * 8 + i;
            const inPrefix = idx < route.len;
            return (
              <span key={i} className={cn(inPrefix ? 'text-emerald-400' : isNet ? 'text-slate-700' : 'text-slate-500')}>
                {isNet && !inPrefix ? '·' : b}
              </span>
            );
          })}
        {o < 3 && <span className="px-0.5 text-slate-700">.</span>}
      </span>
    ));
  return (
    <div className="overflow-x-auto rounded-md border border-slate-800 bg-black/30 p-2.5 font-mono text-[10px] leading-5 sm:text-[11px]">
      <div className="flex items-center gap-3 whitespace-nowrap">
        <span className="w-14 shrink-0 text-slate-500">dst</span>
        <span>{row(dst, false)}</span>
      </div>
      <div className="flex items-center gap-3 whitespace-nowrap">
        <span className="w-14 shrink-0 text-slate-500">/{route.len}</span>
        <span>{row(net, true)}</span>
      </div>
      <div className="mt-1 text-slate-500">
        First <span className="text-emerald-400">{route.len} bits</span> of {ip} equal {route.prefix}/{route.len}.
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board panels

function PacketCard({ packet, level, age, exitKind }: { packet: Packet; level: Level; age: number; exitKind: string }) {
  const remaining = Math.max(0, 1 - age / level.deadline);
  const urgent = remaining < 0.35;
  // Exiting children only see the latest `custom` from AnimatePresence, so resolve the exit lazily.
  const exitVariants: Variants = {
    exit: (kind: string) =>
      kind === 'forward'
        ? { x: 80, opacity: 0, transition: { duration: 0.25, ease: 'easeIn' } }
        : kind === 'drop'
          ? { scale: 0.94, opacity: 0, filter: 'grayscale(1)', transition: { duration: 0.25 } }
          : { y: 12, opacity: 0, transition: { duration: 0.25 } },
  };
  return (
    <motion.div
      key={packet.id}
      custom={exitKind}
      variants={exitVariants}
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }}
      exit="exit"
      className="relative"
    >
      <div className="flex items-baseline justify-between">
        <span className={label}>Head of queue</span>
        <span className="font-mono text-[11px] text-slate-500">PKT #{String(packet.id).padStart(4, '0')}</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <div className="col-span-2">
          <div className={label}>Destination</div>
          <div className="mt-1 font-mono text-2xl font-medium tracking-tight text-slate-50 sm:text-3xl">{packet.dst}</div>
        </div>
        <div className="col-span-2 sm:col-span-2">
          <div className={label}>Source</div>
          <div className="mt-1 font-mono text-base text-slate-300 sm:text-lg">{packet.src}</div>
        </div>
        <div>
          <div className={label}>Protocol</div>
          <div className="mt-1 font-mono text-sm text-slate-200">
            {packet.proto.toUpperCase()}
            {packet.port !== undefined && <span className="text-slate-500">/{packet.port}</span>}
            <span className="ml-2 text-slate-500">{serviceName(packet)}</span>
          </div>
        </div>
        <div>
          <div className={label}>TTL</div>
          <div className={cn('mt-1 font-mono text-sm', packet.ttl <= 1 ? 'text-amber-400' : 'text-slate-200')}>{packet.ttl}</div>
        </div>
      </div>
      <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-800" role="progressbar" aria-label="Time left for this packet" aria-valuenow={Math.round(remaining * 100)}>
        <div
          className={cn('h-full rounded-full transition-[width] duration-100 ease-linear', urgent ? 'bg-rose-500' : remaining < 0.6 ? 'bg-amber-400' : 'bg-emerald-500')}
          style={{ width: `${remaining * 100}%` }}
        />
      </div>
    </motion.div>
  );
}

function PortPanel({
  level,
  disabled,
  last,
  onChoose,
}: {
  level: Level;
  disabled: boolean;
  last: Decision | null;
  onChoose: (e: Egress) => void;
}) {
  return (
    <div className={cn(panel, 'p-4')}>
      <div className="flex items-center justify-between">
        <span className={label}>R1 egress ports</span>
        <span className="hidden font-mono text-[11px] text-slate-600 sm:inline">ISR-4331 · forwarding engine</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {EGRESS_ORDER.map(e => {
          const flash = last && last.chosen === e ? last : null;
          const isDrop = e === 'drop';
          return (
            <button
              key={e}
              type="button"
              disabled={disabled}
              onClick={() => onChoose(e)}
              className={cn(
                'group relative overflow-hidden rounded-md border px-3 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                isDrop
                  ? 'border-slate-800 bg-slate-950/60 hover:border-rose-500/60 hover:bg-rose-500/5'
                  : 'border-slate-800 bg-slate-950/60 hover:border-emerald-500/60 hover:bg-emerald-500/5',
              )}
              aria-label={`Send out ${isDrop ? 'drop' : EGRESS_NAME[e]} — ${level.ports[e]} (key ${KEYS[e]})`}
            >
              {flash && (
                <motion.span
                  key={flash.packet.id}
                  aria-hidden
                  className={cn('absolute inset-0', flash.correct ? 'bg-emerald-500/20' : 'bg-rose-500/20')}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <span
                    aria-hidden
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isDrop ? 'bg-rose-500/70' : 'bg-emerald-400 shadow-[0_0_6px_rgba(96,165,250,0.9)]',
                    )}
                  />
                  <span className="font-mono text-sm font-medium text-slate-100">{isDrop ? 'Drop' : EGRESS_NAME[e]}</span>
                </span>
                <Kbd>{KEYS[e]}</Kbd>
              </div>
              <div className="relative mt-1.5 truncate text-xs text-slate-500">{level.ports[e]}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RouteTable({ level, highlight }: { level: Level; highlight: number | null }) {
  return (
    <div className={cn(panel, 'p-4')}>
      <div className="flex items-center justify-between">
        <span className={label}>Routing table</span>
        <span className="font-mono text-[11px] text-slate-600">R1# show ip route</span>
      </div>
      <table className="mt-3 w-full font-mono text-xs">
        <thead>
          <tr className="text-left text-[10px] uppercase tracking-wider text-slate-600">
            <th className="pb-2 pr-2 font-normal">Code</th>
            <th className="pb-2 pr-2 font-normal">Prefix</th>
            <th className="hidden pb-2 pr-2 font-normal sm:table-cell">Next hop</th>
            <th className="pb-2 font-normal">Exit</th>
          </tr>
        </thead>
        <tbody>
          {level.routes.map((r, i) => (
            <tr
              key={i}
              className={cn(
                'border-t border-slate-800/80 transition-colors duration-300',
                highlight === i ? 'bg-emerald-500/10 text-emerald-300' : 'text-slate-300',
              )}
            >
              <td className="py-1.5 pr-2 text-slate-500">{r.code}</td>
              <td className="py-1.5 pr-2">
                {r.prefix}
                <span className="text-slate-500">/{r.len}</span>
              </td>
              <td className="hidden py-1.5 pr-2 text-slate-500 sm:table-cell">{r.via ?? 'connected'}</td>
              <td className="py-1.5">{r.egress === 'drop' ? 'Null0' : EGRESS_NAME[r.egress]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 font-mono text-[10px] text-slate-600">C connected · S static · O OSPF · * candidate default</div>
    </div>
  );
}

function AclTable({ level, highlight }: { level: Level; highlight: number | null }) {
  if (!level.acl.length) return null;
  return (
    <div className={cn(panel, 'p-4')}>
      <div className="flex items-center justify-between">
        <span className={label}>Inbound ACL</span>
        <span className="font-mono text-[11px] text-slate-600">ip access-group 110 in</span>
      </div>
      <ol className="mt-3 space-y-1 font-mono text-xs">
        {level.acl.map((r, i) => (
          <li
            key={i}
            className={cn(
              'flex gap-3 rounded px-1.5 py-1 transition-colors duration-300',
              highlight === i ? 'bg-rose-500/10 text-rose-300' : r.action === 'deny' ? 'text-slate-300' : 'text-slate-500',
            )}
          >
            <span className="text-slate-600">{(i + 1) * 10}</span>
            {r.text}
          </li>
        ))}
      </ol>
    </div>
  );
}

function QueueList({ waiting, cap }: { waiting: Packet[]; cap: number }) {
  return (
    <div className={cn(panel, 'p-4')}>
      <div className="flex items-center justify-between">
        <span className={label}>Ingress queue</span>
        <span className="flex items-center gap-1" aria-label={`${waiting.length + 1} of ${cap} buffer slots used`}>
          {Array.from({ length: cap }, (_, i) => (
            <span
              key={i}
              className={cn(
                'h-2 w-2 rounded-sm',
                i <= waiting.length ? (waiting.length + 1 >= cap ? 'bg-rose-500' : 'bg-emerald-500/80') : 'bg-slate-800',
              )}
            />
          ))}
        </span>
      </div>
      <ul className="mt-3 min-h-[3rem] space-y-1 font-mono text-xs">
        <AnimatePresence initial={false}>
          {waiting.map(p => (
            <motion.li
              key={p.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-between gap-2 text-slate-400"
            >
              <span className="text-slate-600">#{String(p.id).padStart(4, '0')}</span>
              <span className="flex-1 truncate text-slate-300">→ {p.dst}</span>
              <span>{serviceName(p)}</span>
              <span className={cn('w-12 text-right', p.ttl <= 1 && 'text-amber-400')}>ttl {p.ttl}</span>
            </motion.li>
          ))}
        </AnimatePresence>
        {waiting.length === 0 && <li className="text-slate-600">No packets waiting.</li>}
      </ul>
    </div>
  );
}

function Feedback({ last, level }: { last: Decision | null; level: Level }) {
  return (
    <div className={cn(panel, 'min-h-[9rem] p-4')} aria-live="polite">
      <span className={label}>Last decision</span>
      <AnimatePresence mode="wait">
        {last ? (
          <motion.div
            key={last.packet.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-3"
          >
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span
                className={cn(
                  'inline-flex h-5 w-5 items-center justify-center rounded-full',
                  last.correct ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400',
                )}
              >
                {last.correct ? <Check className="h-3.5 w-3.5" aria-hidden /> : <X className="h-3.5 w-3.5" aria-hidden />}
              </span>
              <span className="font-medium text-slate-100">
                {last.chosen === 'timeout'
                  ? 'Timed out at the head of the queue'
                  : last.chosen === 'overflow'
                    ? 'Tail-dropped — queue full'
                    : last.correct
                      ? `Correct · +${last.points}`
                      : `Sent to ${EGRESS_NAME[last.chosen]}`}
              </span>
              {!last.correct && (
                <span className="font-mono text-xs text-slate-400">
                  expected <span className="text-emerald-400">{EGRESS_NAME[last.verdict.egress]}</span>
                </span>
              )}
              <span className="ml-auto font-mono text-[11px] text-slate-600">→ {last.packet.dst}</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">{last.verdict.reason}</p>
            {last.verdict.routeIndex !== null && level.routes[last.verdict.routeIndex].len > 0 && (
              <BinaryLens ip={last.packet.dst} route={level.routes[last.verdict.routeIndex]} />
            )}
          </motion.div>
        ) : (
          <motion.p key="none" className="mt-3 text-sm text-slate-500" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            Your first packet is on its way. Read the header, then pick a port.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overlay screens

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-start justify-center overflow-y-auto bg-[#070a12]/90 p-4 backdrop-blur-sm sm:items-center sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="w-full max-w-2xl"
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

function PrimaryButton({ onClick, children, autoFocus }: { onClick: () => void; children: React.ReactNode; autoFocus?: boolean }) {
  return (
    <button
      type="button"
      autoFocus={autoFocus}
      onClick={onClick}
      className="group inline-flex h-11 items-center gap-2 rounded-md bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
    </button>
  );
}

function GhostButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-11 items-center gap-2 rounded-md border border-slate-700 px-4 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100"
    >
      {children}
    </button>
  );
}

const CONTROLS = (
  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-400">
    <span><Kbd>1</Kbd> Gi0/0</span>
    <span><Kbd>2</Kbd> Gi0/1</span>
    <span><Kbd>3</Kbd> Se0/0/0</span>
    <span><Kbd>4</Kbd> / <Kbd>D</Kbd> Drop</span>
    <span><Kbd>H</Kbd> Binary lens (−{HINT_COST})</span>
    <span><Kbd>Space</Kbd> Pause</span>
  </div>
);

// ---------------------------------------------------------------------------
// Main component

export const ForwardingPlaneGame: React.FC<{ onProceedToConclusion: () => void; embedded?: boolean }> = ({ onProceedToConclusion, embedded = false }) => {
  const [s, dispatch] = useReducer(reducer, initialState);
  const [best, setBest] = useState(readBest);
  const reduceMotion = useReducedMotion();
  const level = LEVELS[s.levelIdx];

  const totalScore =
    s.results.reduce((a, r) => a + (r?.score ?? 0), 0) +
    (s.status === 'playing' || s.status === 'paused' || s.status === 'failed' ? s.levelScore : 0);

  const beginLevel = () => {
    playSound('click');
    dispatch({ type: 'begin', packets: generatePackets(level, s.levelIdx * 100 + 1) });
  };
  const choose = (egress: Egress) => dispatch({ type: 'choose', egress });

  // Simulation clock.
  useEffect(() => {
    if (s.status !== 'playing') return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: 'tick', dt: Math.min(0.25, (now - last) / 1000) });
      last = now;
    }, 100);
    return () => clearInterval(id);
  }, [s.status]);

  // Pause when the tab is hidden.
  useEffect(() => {
    const onVis = () => document.hidden && dispatch({ type: 'pause' });
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Audio feedback per decision.
  useEffect(() => {
    if (s.last) playSound(s.last.correct ? 'packet' : 'alert');
  }, [s.last]);

  // Level / run completion.
  useEffect(() => {
    if (s.status === 'levelEnd' || s.status === 'complete') playSound('success');
    if (s.status === 'complete') {
      if (totalScore > best) {
        setBest(totalScore);
        writeBest(totalScore);
      }
      notifyNet({ ok: true, title: 'All shifts complete', detail: `Forwarding plane stable · ${totalScore.toLocaleString()} points` });
    }
  }, [s.status]);

  // Keyboard.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (s.status === 'playing') {
        const idx = ['1', '2', '3', '4'].indexOf(k);
        if (idx !== -1 || k === 'd') {
          e.preventDefault();
          choose(k === 'd' ? 'drop' : EGRESS_ORDER[idx]);
        } else if (k === 'h') {
          e.preventDefault();
          dispatch({ type: 'hint' });
        } else if (k === ' ' || k === 'p') {
          e.preventDefault();
          dispatch({ type: 'pause' });
        }
      } else if (s.status === 'paused' && (k === ' ' || k === 'p' || k === 'escape')) {
        e.preventDefault();
        dispatch({ type: 'resume' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s.status]);

  const head = s.queue[0];
  const headVerdict = head && s.hinted ? decide(head, level) : null;
  const routeHighlight = headVerdict ? headVerdict.routeIndex : s.last?.verdict.routeIndex ?? null;
  const aclHighlight = headVerdict ? headVerdict.aclIndex : s.last?.verdict.aclIndex ?? null;
  const exitKind = !s.last ? 'miss' : s.last.chosen === 'drop' ? 'drop' : s.last.chosen === 'timeout' || s.last.chosen === 'overflow' ? 'miss' : 'forward';
  const lastResult = s.results[s.levelIdx];

  return (
    <section className={embedded ? "p-4 sm:p-5" : "mx-auto max-w-7xl px-4 pb-40 pt-8 sm:px-6 sm:pt-10"}>
      {/* Module header */}
      {!embedded && (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400">
            <span className="h-px w-6 bg-emerald-400" aria-hidden />
            07 · Mini game
          </div>
          <h2 className="mt-3 font-display text-3xl font-semibold uppercase tracking-tight text-slate-50 sm:text-4xl">Forwarding Plane</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
            You are router R1&rsquo;s forwarding engine. Read each packet header, apply the ACL, check the TTL, find the
            longest matching prefix — and get it out the right port before the queue backs up.
          </p>
        </div>
        <div className="flex items-center gap-6 font-mono text-xs text-slate-500">
          <div>
            <div className={label}>Best run</div>
            <div className="mt-1 text-base text-slate-200">{best.toLocaleString()}</div>
          </div>
          <div>
            <div className={label}>Shifts</div>
            <div className="mt-1 flex gap-1.5">
              {LEVELS.map((l, i) => (
                <span
                  key={l.id}
                  title={l.title}
                  className={cn(
                    'h-1.5 w-6 rounded-full',
                    s.results[i] ? 'bg-emerald-500' : i === s.levelIdx && s.status !== 'title' ? 'bg-emerald-500/40' : 'bg-slate-800',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      )}

      {/* Game frame */}
      <div className="relative mt-8 min-h-[640px] overflow-hidden rounded-xl border border-slate-800 bg-[#070b14]">
        {/* HUD */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-slate-800 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <div className={label}>Shift {s.levelIdx + 1} / {LEVELS.length}</div>
            <div className="truncate text-sm font-medium text-slate-100">{level.title}</div>
          </div>
          <div>
            <div className={label}>Score</div>
            <div className="font-mono text-sm text-slate-100">
              <AnimatedNumber value={totalScore} />
            </div>
          </div>
          <div>
            <div className={label}>Streak</div>
            <div className="font-mono text-sm text-slate-100">
              {s.streak} <span className="text-slate-500">×{(1 + Math.min(s.streak, 8) * 0.125).toFixed(2)}</span>
            </div>
          </div>
          <div className="min-w-[8rem] flex-1 sm:max-w-[14rem]">
            <div className="flex justify-between">
              <span className={label}>Link health</span>
              <span className="font-mono text-[11px] text-slate-400">{Math.max(0, s.health)}%</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-slate-800">
              <motion.div
                className={cn('h-full rounded-full', s.health > 60 ? 'bg-emerald-500' : s.health > 30 ? 'bg-amber-400' : 'bg-rose-500')}
                animate={{ width: `${Math.max(0, s.health)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
          <div className="font-mono text-xs text-slate-500">
            {Math.min(s.spawned, level.packetCount)}/{level.packetCount} pkts
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: 'hint' })}
              disabled={s.status !== 'playing' || !head || s.hinted}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-800 px-2.5 text-xs text-slate-300 transition-colors hover:border-slate-600 disabled:opacity-40"
              aria-label={`Binary lens hint, costs ${HINT_COST} points (H)`}
            >
              <Lightbulb className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Lens</span>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: s.status === 'paused' ? 'resume' : 'pause' })}
              disabled={s.status !== 'playing' && s.status !== 'paused'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-800 text-slate-300 transition-colors hover:border-slate-600 disabled:opacity-40"
              aria-label={s.status === 'paused' ? 'Resume (Space)' : 'Pause (Space)'}
            >
              {s.status === 'paused' ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Board */}
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className={cn(panel, 'min-h-[13rem] overflow-hidden p-5')}>
              <AnimatePresence mode="popLayout" custom={exitKind}>
                {head ? (
                  <PacketCard key={head.id} packet={head} level={level} age={s.headAge} exitKind={exitKind} />
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex h-full min-h-[10rem] flex-col justify-center">
                    <span className={label}>Head of queue</span>
                    <p className="mt-3 font-mono text-sm text-slate-500">
                      {s.status === 'playing' ? 'Waiting for the next arrival…' : 'Idle — no traffic.'}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
              {headVerdict && headVerdict.routeIndex !== null && level.routes[headVerdict.routeIndex].len > 0 && head && (
                <div className="mt-4">
                  <BinaryLens ip={head.dst} route={level.routes[headVerdict.routeIndex]} />
                </div>
              )}
              {headVerdict && headVerdict.routeIndex === null && (
                <p className="mt-4 rounded-md border border-slate-800 bg-black/30 p-2.5 font-mono text-[11px] text-slate-400">
                  Lens: this one never reaches the routing table. Check the ACL and TTL.
                </p>
              )}
            </div>
            <PortPanel level={level} disabled={s.status !== 'playing' || !head} last={s.last} onChoose={choose} />
            <Feedback last={s.last} level={level} />
          </div>
          <div className="space-y-4 lg:col-span-5">
            <RouteTable level={level} highlight={routeHighlight} />
            <AclTable level={level} highlight={aclHighlight} />
            <QueueList waiting={s.queue.slice(1)} cap={level.queueCap} />
          </div>
        </div>

        {/* Screens */}
        <AnimatePresence>
          {s.status === 'title' && (
            <Overlay key="title">
              <div className={label}>How a router decides</div>
              <h3 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight text-slate-50">Three checks, in order</h3>
              <ol className="mt-6 grid gap-4 sm:grid-cols-3">
                {[
                  ['ACL', 'An inbound access list is read top-down. The first matching line permits or denies.'],
                  ['TTL', 'Each hop decrements TTL. A packet arriving with TTL 1 would hit 0 — drop it.'],
                  ['Longest prefix', 'Of all routes that contain the destination, the most specific wins. No match, no default → drop.'],
                ].map(([t, d], i) => (
                  <li key={t} className="border-t border-slate-800 pt-3">
                    <div className="font-mono text-[11px] text-emerald-400">{String(i + 1).padStart(2, '0')}</div>
                    <div className="mt-1 text-sm font-semibold text-slate-100">{t}</div>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{d}</p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 border-t border-slate-800 pt-4">{CONTROLS}</div>
              <p className="mt-4 text-sm text-slate-400">
                Four shifts. Faster decisions and unbroken streaks score more; wrong ports, timeouts and a full queue drain link health.
              </p>
              <div className="mt-6">
                <PrimaryButton autoFocus onClick={() => dispatch({ type: 'brief', levelIdx: 0 })}>
                  Clock in
                </PrimaryButton>
              </div>
            </Overlay>
          )}

          {s.status === 'briefing' && (
            <Overlay key={`brief-${s.levelIdx}`}>
              <div className={label}>Shift {s.levelIdx + 1} of {LEVELS.length}</div>
              <h3 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight text-slate-50">{level.title}</h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-300">{level.concept}</p>
              <div className="mt-4 flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-200">
                <span className="font-mono text-[11px] uppercase tracking-wider text-emerald-400">New</span>
                <span>{level.newRule}</span>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-4 border-t border-slate-800 pt-4 font-mono text-xs">
                <div>
                  <dt className="text-slate-500">Packets</dt>
                  <dd className="mt-1 text-slate-200">{level.packetCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Arrival</dt>
                  <dd className="mt-1 text-slate-200">every {level.spawnEvery}s</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Head timeout</dt>
                  <dd className="mt-1 text-slate-200">{level.deadline}s</dd>
                </div>
              </dl>
              <div className="mt-5">{CONTROLS}</div>
              <div className="mt-6">
                <PrimaryButton autoFocus onClick={beginLevel}>
                  Start shift {s.levelIdx + 1}
                </PrimaryButton>
              </div>
            </Overlay>
          )}

          {s.status === 'paused' && (
            <Overlay key="paused">
              <div className={label}>Paused</div>
              <h3 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight text-slate-50">Queue frozen</h3>
              <p className="mt-3 text-sm text-slate-400">Timers are stopped. Nothing arrives while you&rsquo;re away.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton autoFocus onClick={() => dispatch({ type: 'resume' })}>
                  Resume
                </PrimaryButton>
                <GhostButton onClick={() => dispatch({ type: 'brief', levelIdx: s.levelIdx })}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> Restart shift
                </GhostButton>
              </div>
            </Overlay>
          )}

          {s.status === 'failed' && (
            <Overlay key="failed">
              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-rose-400">Link down</div>
              <h3 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight text-slate-50">R1 is dropping everything</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Link health hit zero on <span className="text-slate-200">{level.title}</span>. Review the misses below, then run the shift again.
              </p>
              <MistakeList decisions={s.decisions.filter(d => !d.correct)} />
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton autoFocus onClick={() => dispatch({ type: 'brief', levelIdx: s.levelIdx })}>
                  Retry shift
                </PrimaryButton>
              </div>
            </Overlay>
          )}

          {s.status === 'levelEnd' && lastResult && (
            <Overlay key={`end-${s.levelIdx}`}>
              <ResultSummary title={`Shift ${s.levelIdx + 1} complete`} subtitle={level.title} result={lastResult} />
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton autoFocus onClick={() => dispatch({ type: 'brief', levelIdx: s.levelIdx + 1 })}>
                  Next: {LEVELS[s.levelIdx + 1].title}
                </PrimaryButton>
                <GhostButton onClick={() => dispatch({ type: 'brief', levelIdx: s.levelIdx })}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> Replay shift
                </GhostButton>
              </div>
            </Overlay>
          )}

          {s.status === 'complete' && (
            <Overlay key="complete">
              <div className={label}>All shifts complete</div>
              <h3 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight text-slate-50">
                <AnimatedNumber value={totalScore} /> points
              </h3>
              <table className="mt-5 w-full text-sm">
                <tbody>
                  {LEVELS.map((l, i) => {
                    const r = s.results[i];
                    return (
                      <tr key={l.id} className="border-t border-slate-800">
                        <td className="py-2 pr-3 font-mono text-[11px] text-slate-500">{String(i + 1).padStart(2, '0')}</td>
                        <td className="py-2 pr-3 text-slate-200">{l.title}</td>
                        <td className="py-2 pr-3 font-mono text-xs text-slate-400">{r ? `${r.correct}/${r.total}` : '—'}</td>
                        <td className="py-2 pr-3 text-right font-mono text-xs text-slate-300">{r ? r.score.toLocaleString() : '—'}</td>
                        <td className="py-2 text-right">{r && <Stars count={r.stars} size="h-3.5 w-3.5" />}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {totalScore >= best && totalScore > 0 && <p className="mt-3 font-mono text-xs text-emerald-400">New best run.</p>}
              <div className="mt-6 flex flex-wrap gap-3">
                <PrimaryButton autoFocus onClick={onProceedToConclusion}>
                  Continue to lab report
                </PrimaryButton>
                <GhostButton onClick={() => dispatch({ type: 'reset' })}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> Play again
                </GhostButton>
              </div>
            </Overlay>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

function MistakeList({ decisions }: { decisions: Decision[] }) {
  if (!decisions.length) return <p className="mt-4 text-sm text-emerald-300">No mistakes. Clean shift.</p>;
  return (
    <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
      {decisions.slice(0, 6).map(d => (
        <li key={d.packet.id} className="border-l-2 border-rose-500/50 pl-3 text-sm">
          <div className="font-mono text-xs text-slate-300">
            {d.packet.dst} · {serviceName(d.packet)} · ttl {d.packet.ttl}
            <span className="ml-2 text-slate-500">
              {d.chosen === 'timeout' ? 'timed out' : d.chosen === 'overflow' ? 'tail-dropped' : `you: ${EGRESS_NAME[d.chosen]}`} → expected{' '}
              <span className="text-emerald-400">{EGRESS_NAME[d.verdict.egress]}</span>
            </span>
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{d.verdict.reason}</p>
        </li>
      ))}
    </ul>
  );
}

function ResultSummary({ title, subtitle, result }: { title: string; subtitle: string; result: LevelResult }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={label}>{title}</div>
          <h3 className="mt-2 font-display text-3xl font-semibold uppercase tracking-tight text-slate-50">{subtitle}</h3>
        </div>
        <Stars count={result.stars} size="h-5 w-5" />
      </div>
      <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-800 pt-4 font-mono text-xs sm:grid-cols-4">
        <div>
          <dt className="text-slate-500">Score</dt>
          <dd className="mt-1 text-base text-slate-100">{result.score.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Accuracy</dt>
          <dd className="mt-1 text-base text-slate-100">{Math.round((result.correct / result.total) * 100)}%</dd>
        </div>
        <div>
          <dt className="text-slate-500">Avg decision</dt>
          <dd className="mt-1 text-base text-slate-100">{result.avgReaction.toFixed(1)}s</dd>
        </div>
        <div>
          <dt className="text-slate-500">Best streak</dt>
          <dd className="mt-1 text-base text-slate-100">{result.bestStreak}</dd>
        </div>
      </dl>
      <div className="mt-5">
        <div className={label}>Review</div>
        <MistakeList decisions={result.mistakes} />
      </div>
    </>
  );
}
