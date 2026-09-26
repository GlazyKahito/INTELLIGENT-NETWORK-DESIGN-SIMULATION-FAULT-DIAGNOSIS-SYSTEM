import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, ArrowRight, Check, Lock, Map as MapIcon, MapPin, Pause, ScanSearch, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound, getAudioMuteState, toggleAudioMute } from '@/lib/sound';
import { EASE_NET, PacketPath } from '@/components/motion/PacketPath';
import { GameEngine, type SimHost } from './engine';
import { DEVICE_ROOM, ROOMS, type Interactable, type Room, type RoomId } from './map';
import {
  LEVELS,
  LINKS,
  baseState,
  explainWrong,
  linksOf,
  linkUp,
  portOn,
  portStatus,
  rollFaults,
  trace,
  type DeviceId,
  type EventKind,
  type Fault,
  type LinkId,
  type NetState,
  type Trace,
} from './network';
import {
  DiagnosePanel,
  InspectView,
  NetworkPanel,
  Sheet,
  TopologyMap,
  deviceIcon,
  emptyCounters,
  type Counters,
  type DiagnosisResult,
  type JournalEntry,
  type Tool,
} from './panels';

type Screen = 'title' | 'briefing' | 'play' | 'complete';
type Panel = { kind: 'inspect'; target: Interactable } | { kind: 'net' } | { kind: 'map' } | { kind: 'diagnose' } | { kind: 'pause' } | null;

interface ActiveEvent {
  kind: EventKind;
  title: string;
  detail: string;
  until: number;
  room?: RoomId;
  link?: LinkId;
}

const MOVE = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const PROGRESS_KEY = 'dcn-lab:rogue-packet';
const readProgress = (): number[] => {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? '[]');
  } catch {
    return [];
  }
};
const writeProgress = (v: number[]) => {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable */
  }
};
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function observe(t: Trace): string {
  switch (t.outcome) {
    case 'delivered':
      return `Arrived at ${t.at}.`;
    case 'nolink':
      return `Never left ${t.at} — there was no carrier on its network port.`;
    case 'nogw':
      return `Never left ${t.at} — it had no reachable gateway to hand the packet to.`;
    case 'noarp':
      return `${t.at} broadcast "who has…?" and nobody answered. The packet was dropped there.`;
    case 'noroute':
      return `${t.at} had no route for it and answered "destination net unreachable".`;
    case 'ttl':
      return `It bounced back and forth ${t.legs.length} times until its TTL ran out at ${t.at}.`;
    case 'lost': {
      const leg = t.legs[Math.max(0, t.stopLeg)];
      return `It vanished on the link ${leg.from} → ${leg.to}.`;
    }
    case 'discard':
      return `It was handed to ${t.at}, which discarded it.`;
  }
}

function summarise(target: Interactable, s: NetState): string {
  const d = target.device;
  if (target.kind === 'device' && d?.startsWith('PC')) {
    const c = s.hosts[d as 'PC-01'];
    return `${d}: ${c.ip}/${c.mask} gw ${c.gw} · ${c.mode} · link ${linkUp(s, linksOf(d)[0].id) ? 'up' : 'DOWN'}`;
  }
  if (target.kind === 'device' && d?.startsWith('SWITCH'))
    return `${d}: ${linksOf(d).map(l => `${portOn(l, d)} ${portStatus(s, d, l)}`).join(', ')}${s.duplexMismatch && d === 'SWITCH-01' ? ' · Gi0/2 half duplex, CRC rising' : ''}`;
  if (d === 'ROUTER-01')
    return `ROUTER-01: Gi0/0 ${s.router.ifaces['Gi0/0'].up ? 'up' : 'admin down'}, Gi0/1 ${s.router.ifaces['Gi0/1'].up ? 'up' : 'admin down'} · ${s.router.statics.length} static route(s)`;
  if (d === 'SERVER-01') return s.serverUp ? `SERVER-01: online · ${s.hosts['SERVER-01'].ip}/${s.hosts['SERVER-01'].mask}` : 'SERVER-01: not responding (console shows kernel panic)';
  if (target.kind === 'cable' && target.link) return `${target.label}: ${s.cable[target.link] ? 'seated' : 'NOT SEATED'} · link ${linkUp(s, target.link) ? 'up' : 'down'}`;
  return target.label;
}

export function RoguePacketGame({ onExit, onReport }: { onExit: () => void; onReport: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  const [screen, setScreen] = useState<Screen>('title');
  const [levelIdx, setLevelIdx] = useState(() => Math.min(readProgress().length, LEVELS.length - 1));
  const [cleared, setCleared] = useState<number[]>(readProgress);
  const [faults, setFaults] = useState<Fault[]>([]);
  const [resolved, setResolved] = useState<string[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [tool, setTool] = useState<Tool>('ping');
  const [near, setNear] = useState<Interactable | null>(null);
  const [room, setRoom] = useState<Room | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [stability, setStability] = useState(100);
  const [event, setEvent] = useState<ActiveEvent | null>(null);
  const [unlocked, setUnlocked] = useState({ trace: false, linkStats: false });
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [, setDiscVersion] = useState(0);
  const [traceLog, setTraceLog] = useState<DeviceId[] | null>(null);
  const [traceResult, setTraceResult] = useState<string | null>(null);
  const [diag, setDiag] = useState<DiagnosisResult | null>(null);
  const [muted, setMuted] = useState(getAudioMuteState());
  const [touch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);

  const level = LEVELS[levelIdx];
  const open = useMemo(() => faults.filter(f => !resolved.includes(f.id)), [faults, resolved]);

  // ---- mutable sim state (read by the engine every frame) --------------------------
  const effRef = useRef<NetState>(baseState());
  const openRef = useRef<Fault[]>([]);
  const eventRef = useRef<ActiveEvent | null>(null);
  const discoveredRef = useRef(new Set<DeviceId>());
  const countersRef = useRef<Counters>(emptyCounters());
  const statsRef = useRef({ correct: 0, wrong: 0, packets: 0 });
  const nextEventRef = useRef(30);
  const journalSeq = useRef(0);

  const recompute = useCallback(() => {
    const s = baseState();
    openRef.current.forEach(f => f.apply(s));
    const ev = eventRef.current;
    if (ev) {
      if (ev.kind === 'storm') s.storm = true;
      if (ev.kind === 'switch-fail') s.switchDown['SWITCH-02'] = true;
      if (ev.kind === 'server-offline') s.serverUp = false;
      if (ev.kind === 'link-lost' && ev.link) s.flappingLink = ev.link;
      if (ev.kind === 'blackout' && ev.room === 'switch') s.switchDown = { 'SWITCH-01': true, 'SWITCH-02': true };
      if (ev.kind === 'blackout' && ev.room === 'server') s.serverUp = false;
    }
    effRef.current = s;
  }, []);

  useEffect(() => {
    openRef.current = open;
    recompute();
  }, [open, recompute]);

  const discover = useCallback((ds: DeviceId[]) => {
    let changed = false;
    ds.forEach(d => {
      if (!discoveredRef.current.has(d)) (discoveredRef.current.add(d), (changed = true));
    });
    if (changed) setDiscVersion(v => v + 1);
  }, []);

  const record = useCallback((e: Omit<JournalEntry, 'id'>, packets = 0) => {
    statsRef.current.packets += packets;
    setJournal(j => [...j.slice(-40), { ...e, id: ++journalSeq.current }]);
  }, []);

  const sim: SimHost = useMemo(
    () => ({
      state: () => effRef.current,
      trace: (src, dst) => trace(effRef.current, src, dst),
      rogueFlow: () => openRef.current[0]?.rogueFlow ?? null,
      discovered: () => discoveredRef.current,
      blackoutRoom: () => (eventRef.current?.kind === 'blackout' ? eventRef.current.room ?? null : null),
      storm: () => eventRef.current?.kind === 'storm',
      loopEvent: () => eventRef.current?.kind === 'loop',
      countPacket: t => {
        const c = countersRef.current;
        const src = t.legs[0]?.from ?? t.at;
        c.dev[src].tx++;
        t.legs.forEach((l, i) => {
          if (i <= t.stopLeg) c.link[l.link]++;
          if (i < t.legs.length - 1 && i < t.stopLeg) c.dev[l.to].fwd++;
          if (effRef.current.duplexMismatch === l.link) c.crc += 1 + Math.floor(Math.random() * 3);
        });
        if (t.outcome === 'delivered') c.dev[t.at].rx++;
        else c.dev[src].drop++;
      },
    }),
    [],
  );

  // ---- engine lifecycle ------------------------------------------------------------
  const handlers = useRef({
    onNear: (_i: Interactable | null) => {},
    onInteract: (_i: Interactable) => {},
    onRoom: (_r: Room | null) => {},
    onTraceHop: (_d: DeviceId) => {},
    onTraceEnd: (_t: Trace) => {},
    onStep: () => {},
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new GameEngine(canvas, miniRef.current, sim, {
      onNear: i => handlers.current.onNear(i),
      onInteract: i => handlers.current.onInteract(i),
      onRoom: r => handlers.current.onRoom(r),
      onTraceHop: d => handlers.current.onTraceHop(d),
      onTraceEnd: t => handlers.current.onTraceEnd(t),
      onStep: () => handlers.current.onStep(),
    });
    engineRef.current = engine;
    engine.start();
    if (import.meta.env.DEV) (window as unknown as { __rp?: GameEngine }).__rp = engine;
    document.body.dataset.gameActive = '1';
    return () => {
      engine.destroy();
      engineRef.current = null;
      delete document.body.dataset.gameActive;
    };
  }, [sim]);

  handlers.current = {
    onNear: i => setNear(i),
    onRoom: r => {
      setRoom(r);
      if (r) discover((Object.keys(DEVICE_ROOM) as DeviceId[]).filter(d => DEVICE_ROOM[d] === r.id));
    },
    onInteract: it => {
      playSound('click');
      if (it.kind === 'console') {
        setDiag(null);
        setPanel({ kind: 'diagnose' });
        return;
      }
      if (it.device) discover([it.device]);
      if (it.kind === 'analyzer' && !unlocked.trace) setUnlocked(u => ({ ...u, trace: true }));
      if (it.kind === 'monitor' && !unlocked.linkStats) setUnlocked(u => ({ ...u, linkStats: true }));
      record({ tool: 'INSPECT', text: summarise(it, effRef.current), ok: true }, 1);
      setPanel({ kind: 'inspect', target: it });
    },
    onTraceHop: d => {
      discover([d]);
      setTraceLog(l => [...(l ?? []), d]);
      playSound('packet');
    },
    onTraceEnd: t => {
      const text = observe(t);
      setTraceResult(text);
      record({ tool: 'PACKET TRACE', text: `${t.legs[0]?.from ?? t.at} → … ${text}`, ok: t.outcome === 'delivered' }, t.legs.length + 1);
      playSound(t.outcome === 'delivered' ? 'ping' : 'alert');
    },
    onStep: () => {},
  };

  useEffect(() => {
    engineRef.current?.setInputEnabled(screen === 'play' && !panel);
  }, [screen, panel]);

  // ---- clock, stability, random events ----------------------------------------------
  const paused = screen !== 'play' || panel?.kind === 'pause';
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setElapsed(e => {
        const t = e + 1;
        const ev = eventRef.current;
        if (ev && t >= ev.until) {
          eventRef.current = null;
          setEvent(null);
          recompute();
        } else if (!ev && level.events.length && t >= nextEventRef.current) {
          const kinds = level.events.filter(k => !(k === 'server-offline' && openRef.current.some(f => f.kind === 'server-offline')));
          const kind = kinds[Math.floor(Math.random() * kinds.length)];
          const next: ActiveEvent = { kind, title: '', detail: '', until: t + 9 };
          if (kind === 'storm') Object.assign(next, { title: 'Packet storm', detail: 'Broadcast flood on the LAN core — expect congestion and drops for a few seconds.' });
          if (kind === 'switch-fail') Object.assign(next, { title: 'Switch failure', detail: 'SWITCH-02 is reloading. Hosts behind it are cut off until it returns.' });
          if (kind === 'server-offline') Object.assign(next, { title: 'Server offline', detail: 'SERVER-01 is restarting a service. It will be back shortly.' });
          if (kind === 'loop') Object.assign(next, { title: 'Routing loop', detail: 'Transient loop while routes reconverge. It will clear.' });
          if (kind === 'link-lost') {
            const link = (['L-PC1', 'L-PC2', 'L-PC3', 'L-PC4'] as LinkId[])[Math.floor(Math.random() * 4)];
            Object.assign(next, { title: 'Connection lost', detail: `A lab link is flapping (${LINKS.find(l => l.id === link)!.a}). It should recover.`, link });
          }
          if (kind === 'blackout') {
            const r = (['switch', 'server', 'lab'] as RoomId[])[Math.floor(Math.random() * 3)];
            Object.assign(next, { title: 'Network blackout', detail: `Power loss in the ${ROOMS.find(x => x.id === r)!.name}. Equipment there is dark.`, room: r, until: t + 12 });
          }
          eventRef.current = next;
          setEvent(next);
          recompute();
          playSound('alert');
          nextEventRef.current = t + (levelIdx === 4 ? 28 : 40) + Math.floor(Math.random() * 18);
        }
        return t;
      });
      setStability(s => Math.max(5, s - openRef.current.length * 0.3 - (eventRef.current ? 0.4 : 0)));
    }, 1000);
    return () => clearInterval(id);
  }, [paused, level, levelIdx, recompute]);

  // ---- flow ------------------------------------------------------------------------
  const beginLevel = () => {
    const fs = rollFaults(level);
    openRef.current = fs;
    setFaults(fs);
    setResolved([]);
    countersRef.current = emptyCounters();
    statsRef.current = { correct: 0, wrong: 0, packets: 0 };
    discoveredRef.current = new Set();
    eventRef.current = null;
    nextEventRef.current = levelIdx === 4 ? 22 : 30;
    setEvent(null);
    setJournal([]);
    setElapsed(0);
    setStability(100);
    setTraceLog(null);
    setTraceResult(null);
    setDiag(null);
    setPanel(null);
    engineRef.current?.reset();
    recompute();
    setScreen('play');
    playSound('success');
  };

  const submitDiagnosis = (d: DeviceId) => {
    const match = open.find(f => f.rogue === d);
    if (match) {
      statsRef.current.correct++;
      playSound('repair');
      setDiag({ device: d, correct: true, fault: match, explanation: match.fix });
      setResolved(r => [...r, match.id]);
      record({ tool: 'REPAIR', text: `${d}: ${match.title} — ${match.fix}`, ok: true });
    } else {
      statsRef.current.wrong++;
      playSound('alert');
      setStability(s => Math.max(5, s - 8));
      const explanation = explainWrong(effRef.current, d, open);
      setDiag({ device: d, correct: false, explanation });
      record({ tool: 'DIAGNOSIS', text: `Accused ${d} — wrong. ${explanation}`, ok: false });
    }
  };

  const afterDiagnosis = () => {
    const done = diag?.correct && open.length === 0;
    setDiag(null);
    setPanel(null);
    if (done) {
      const next = Array.from(new Set([...cleared, level.id]));
      setCleared(next);
      writeProgress(next);
      setScreen('complete');
      playSound('success');
    }
  };

  const startTrace = () => {
    setPanel(null);
    setTraceResult(null);
    setTraceLog([]);
    if (!engineRef.current?.startTrace()) setTraceLog(null);
  };

  // ---- keyboard --------------------------------------------------------------------
  const stateRef = useRef({ screen, panel });
  stateRef.current = { screen, panel };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const { screen, panel } = stateRef.current;
      const engine = engineRef.current;
      if (!engine || screen !== 'play') return;
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement;
      if (panel) {
        if (e.key === 'Escape' || (e.code === 'Tab' && panel.kind === 'map')) {
          e.preventDefault();
          setPanel(null);
          setDiag(null);
        }
        return;
      }
      if (typing) return;
      if (engine.isTracing()) {
        if (e.key === 'Escape') {
          engine.cancelTrace();
          setTraceLog(null);
        }
        return;
      }
      if (MOVE.has(e.code)) {
        e.preventDefault();
        engine.keyDown(e.code);
        return;
      }
      if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        engine.interact();
      } else if (e.code === 'KeyP') {
        setPanel({ kind: 'net' });
      } else if (e.code === 'Tab' || e.code === 'KeyM') {
        e.preventDefault();
        setPanel({ kind: 'map' });
      } else if (e.code === 'KeyG') {
        setDiag(null);
        setPanel({ kind: 'diagnose' });
      } else if (e.key === 'Escape') {
        setPanel({ kind: 'pause' });
      }
    };
    const up = (e: KeyboardEvent) => engineRef.current?.keyUp(e.code);
    const blur = () => engineRef.current?.clearKeys();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
    };
  }, []);

  const stats = statsRef.current;
  const accuracy = stats.correct + stats.wrong ? Math.round((stats.correct / (stats.correct + stats.wrong)) * 100) : 100;
  const firstOpen = LEVELS.findIndex(l => !cleared.includes(l.id));

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#05070d] font-sans text-slate-100 select-none">
      <canvas ref={canvasRef} className="absolute inset-0 block" aria-label="Rogue Packet — network operations centre" role="img" />

      {/* HUD */}
      <AnimatePresence>
        {screen === 'play' && (
          <motion.div className="pointer-events-none absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="pointer-events-auto absolute left-3 top-3 max-w-[60%] rounded-md border border-slate-800 bg-[#070b14]/85 px-3 py-2 backdrop-blur sm:left-4 sm:top-4">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-emerald-400">
                Level {level.id} · {level.title}
              </div>
              <div className="mt-0.5 flex items-center gap-2 text-sm text-slate-100">
                Find the rogue
                <span className="flex gap-1">
                  {faults.map(f => (
                    <span key={f.id} className={cn('h-2 w-2 rounded-full border', resolved.includes(f.id) ? 'border-emerald-400 bg-emerald-400' : 'border-slate-500')} />
                  ))}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                <MapPin className="h-3 w-3" aria-hidden />
                <AnimatePresence mode="wait">
                  <motion.span key={room?.id ?? 'corridor'} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    {room?.name ?? 'Corridor'}
                  </motion.span>
                </AnimatePresence>
              </div>
            </div>

            <div className="pointer-events-auto absolute right-3 top-3 flex flex-col items-end gap-2 sm:right-4 sm:top-4">
              <div className="flex items-center gap-3 rounded-md border border-slate-800 bg-[#070b14]/85 px-3 py-2 backdrop-blur">
                <span className="font-mono text-sm tabular-nums text-slate-200">{mmss(elapsed)}</span>
                <div className="w-20 sm:w-28">
                  <div className="flex justify-between font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    <span>Stability</span>
                    <span>{Math.round(stability)}%</span>
                  </div>
                  <div className="mt-1 h-1 rounded-full bg-slate-800">
                    <motion.div
                      className={cn('h-full rounded-full', stability > 60 ? 'bg-emerald-500' : stability > 30 ? 'bg-amber-400' : 'bg-rose-500')}
                      animate={{ width: `${stability}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <HudButton label="Network panel" k="P" onClick={() => setPanel({ kind: 'net' })} icon={<Activity className="h-3.5 w-3.5" />} />
                <HudButton label="Map" k="Tab" onClick={() => setPanel({ kind: 'map' })} icon={<MapIcon className="h-3.5 w-3.5" />} />
                <HudButton label="Diagnose" k="G" primary onClick={() => (setDiag(null), setPanel({ kind: 'diagnose' }))} icon={<ScanSearch className="h-3.5 w-3.5" />} />
                <HudButton label="Pause" k="Esc" onClick={() => setPanel({ kind: 'pause' })} icon={<Pause className="h-3.5 w-3.5" />} />
              </div>
            </div>

            {/* Event banner */}
            <AnimatePresence>
              {event && !traceLog && (
                <motion.div
                  key={event.title}
                  className="absolute inset-x-0 top-20 mx-auto w-[min(92%,26rem)] rounded-md border border-amber-400/30 bg-[#140f05]/85 px-3 py-2 text-center backdrop-blur sm:top-[6.5rem]"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, ease: EASE_NET }}
                  role="status"
                >
                  <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                    {event.title} · {Math.max(0, event.until - elapsed)}s
                  </div>
                  <div className="text-xs text-amber-100/80">{event.detail}</div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Packet trace HUD */}
            <AnimatePresence>
              {traceLog && (
                <motion.div
                  className="pointer-events-auto absolute inset-x-0 top-20 mx-auto w-[min(94%,34rem)] rounded-md border border-violet-300/30 bg-[#0d0a18]/90 px-4 py-3 backdrop-blur sm:top-[6.5rem]"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-[0.16em] text-violet-200">
                    <span>Packet trace · rogue packet</span>
                    {!traceResult && <span className="text-violet-300/60">Esc to cancel</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1 font-mono text-xs">
                    <span className="text-slate-400">{open[0]?.rogueFlow.src}</span>
                    {traceLog.map((d, i) => (
                      <motion.span key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className="text-slate-200">
                        <span className="text-slate-600"> → </span>
                        {d}
                      </motion.span>
                    ))}
                  </div>
                  {traceResult && (
                    <>
                      <p className="mt-2 text-sm text-violet-100">{traceResult}</p>
                      <button type="button" onClick={() => (setTraceLog(null), setTraceResult(null))} className="mt-2 rounded-md bg-violet-300 px-3 py-1.5 text-xs font-semibold text-slate-950">
                        Back to investigating
                      </button>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interaction prompt */}
            <AnimatePresence>
              {near && !panel && !traceLog && (
                <motion.div
                  key={near.id}
                  className="absolute inset-x-0 bottom-24 flex justify-center sm:bottom-8"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                >
                  <button
                    type="button"
                    onClick={() => engineRef.current?.interact()}
                    className="pointer-events-auto flex items-center gap-2 rounded-md border border-emerald-400/40 bg-[#07110e]/90 px-3 py-2 text-sm text-slate-100 backdrop-blur"
                  >
                    <kbd className="rounded border border-emerald-400/50 px-1.5 font-mono text-[11px] text-emerald-300">E</kbd>
                    {near.verb}
                    <span className="font-mono text-[11px] text-slate-400">· {near.label}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimap (always mounted so the engine can draw into it) */}
      <div className={cn('pointer-events-none absolute bottom-3 right-3 rounded-md border border-slate-800 bg-[#070b14]/80 p-1 backdrop-blur transition-opacity sm:bottom-4 sm:right-4', screen === 'play' && !touch ? 'opacity-100' : 'opacity-0')}>
        <canvas ref={miniRef} width={184} height={126} className="block h-[126px] w-[184px]" aria-hidden />
      </div>

      {/* Touch controls */}
      {touch && screen === 'play' && !panel && (
        <>
          <Joystick onMove={(x, y) => engineRef.current?.setJoystick(x, y)} />
          <div className="absolute bottom-6 right-4 flex flex-col items-end gap-2">
            <button type="button" onClick={() => engineRef.current?.interact()} className="h-16 w-16 rounded-full border border-emerald-400/50 bg-emerald-500/20 font-mono text-lg text-emerald-200 active:bg-emerald-500/40" aria-label="Interact">
              E
            </button>
          </div>
        </>
      )}

      {/* Panels */}
      <AnimatePresence>
        {screen === 'play' && panel?.kind === 'inspect' && (
          <Sheet
            key="inspect"
            title={panel.target.label}
            eyebrow={panel.target.verb}
            icon={panel.target.device ? deviceIcon(panel.target.device) : <Activity className="h-4 w-4" />}
            onClose={() => setPanel(null)}
          >
            <InspectView target={panel.target} state={effRef.current} counters={countersRef.current} open={open} elapsed={elapsed} />
          </Sheet>
        )}
        {screen === 'play' && panel?.kind === 'net' && (
          <NetworkPanel
            key="net"
            state={effRef.current}
            tool={tool}
            setTool={setTool}
            traceUnlocked={unlocked.trace}
            journal={journal}
            onRecord={(e, packets, ds) => {
              record(e, packets);
              if (ds) discover(ds);
            }}
            onStartTrace={startTrace}
            onClose={() => setPanel(null)}
          />
        )}
        {screen === 'play' && panel?.kind === 'map' && (
          <TopologyMap
            key="map"
            discovered={discoveredRef.current}
            counters={countersRef.current}
            linkStats={unlocked.linkStats}
            visited={engineRef.current?.visited ?? new Set()}
            onClose={() => setPanel(null)}
          />
        )}
        {screen === 'play' && panel?.kind === 'diagnose' && (
          <DiagnosePanel key="diag" onSubmit={submitDiagnosis} result={diag} remaining={open.length} onClose={() => (setPanel(null), setDiag(null))} onContinue={afterDiagnosis} />
        )}
        {screen === 'play' && panel?.kind === 'pause' && (
          <Sheet key="pause" title="Paused" eyebrow="Rogue Packet" onClose={() => setPanel(null)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <Controls />
              <div className="space-y-2">
                <button type="button" autoFocus onClick={() => setPanel(null)} className="w-full rounded-md bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
                  Resume
                </button>
                <button type="button" onClick={() => (setPanel(null), setScreen('briefing'))} className="w-full rounded-md border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-slate-500">
                  Restart level
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = toggleAudioMute();
                    setMuted(next);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-slate-500"
                >
                  {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />} Sound {muted ? 'off' : 'on'}
                </button>
                <button type="button" onClick={onExit} className="w-full rounded-md border border-slate-700 px-4 py-2.5 text-sm text-slate-200 hover:border-slate-500">
                  Return to lab
                </button>
              </div>
            </div>
          </Sheet>
        )}
      </AnimatePresence>

      {/* Screens */}
      <AnimatePresence mode="wait">
        {screen === 'title' && (
          <Overlay key="title">
            <motion.div initial={{ opacity: 0, letterSpacing: '0.4em' }} animate={{ opacity: 1, letterSpacing: '0.16em' }} transition={{ duration: 1, ease: EASE_NET }} className="font-mono text-[11px] uppercase text-emerald-400">
              07 · Mini game · Network operations centre
            </motion.div>
            <h2 className="mt-3 font-display text-5xl font-semibold uppercase leading-none tracking-tight text-slate-50 sm:text-7xl">
              Rogue <span className="text-violet-200">Packet</span>
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300 sm:text-base">Something is wrong with the network. Find it before the network fails.</p>
            <ol className="mt-6 space-y-1.5">
              {LEVELS.map((l, i) => {
                const locked = i > 0 && !cleared.includes(LEVELS[i - 1].id) && !cleared.includes(l.id);
                const done = cleared.includes(l.id);
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => setLevelIdx(i)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                        levelIdx === i ? 'border-emerald-400/60 bg-emerald-500/10' : 'border-slate-800 bg-black/20 hover:border-slate-600',
                      )}
                    >
                      <span className="w-6 font-mono text-[11px] text-slate-500">{String(l.id).padStart(2, '0')}</span>
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-slate-100">{l.title}</span>
                        <span className="block text-xs text-slate-500">{l.concept}</span>
                      </span>
                      {done ? <Check className="h-4 w-4 text-emerald-400" /> : locked ? <Lock className="h-3.5 w-3.5 text-slate-500" /> : null}
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryBtn autoFocus onClick={() => setScreen('briefing')}>
                {cleared.includes(level.id) ? 'Replay' : 'Start'} level {level.id}
              </PrimaryBtn>
              <GhostBtn onClick={onExit}>Return to lab</GhostBtn>
            </div>
            {firstOpen === -1 && <p className="mt-3 font-mono text-xs text-emerald-400">All five levels cleared.</p>}
          </Overlay>
        )}

        {screen === 'briefing' && (
          <Overlay key={`brief-${level.id}`}>
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400">Level {level.id} of {LEVELS.length}</div>
            <h2 className="mt-2 font-display text-4xl font-semibold uppercase tracking-tight text-slate-50 sm:text-5xl">{level.title}</h2>
            <p className="mt-3 max-w-xl text-sm text-slate-300">{level.concept}</p>
            <div className="mt-5 rounded-md border border-slate-700/80 bg-black/30 p-4">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                <span>Incident report</span>
                <span className="text-amber-300">Priority 2</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">
                {level.faults > 1 ? 'Multiple reports are coming in. Something is failing in more than one place.' : 'A report just came in from the helpdesk.'}
              </p>
              <p className="mt-2 text-xs text-slate-500">The ticket details arrive when you clock in.</p>
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
              <li>• Walk the facility and <b className="text-slate-100">inspect</b> devices (E)</li>
              <li>• Test from any host with the <b className="text-slate-100">Network Panel</b> (P)</li>
              <li>• Unlock <b className="text-violet-200">Packet Trace</b> in the Packet Analysis Lab</li>
              <li>• Name the rogue at the <b className="text-slate-100">Diagnosis Console</b> (G)</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryBtn autoFocus onClick={beginLevel}>
                Clock in
              </PrimaryBtn>
              <GhostBtn onClick={() => setScreen('title')}>Back</GhostBtn>
            </div>
          </Overlay>
        )}

        {screen === 'complete' && (
          <Overlay key="complete">
            <PacketPath nodes={['PC', 'SWITCH', 'ROUTER', 'SERVER']} okLabel={levelIdx === LEVELS.length - 1 ? 'Network secured' : 'Network restored'} className="max-w-md" />
            <h2 className="mt-3 font-display text-4xl font-semibold uppercase tracking-tight text-slate-50">Level {level.id} complete</h2>
            <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-800 pt-4 font-mono text-xs sm:grid-cols-3">
              <Stat k="Rogue node" v={faults.map(f => f.rogue).join(', ')} />
              <Stat k="Diagnosis accuracy" v={`${accuracy}%`} />
              <Stat k="Faults found" v={`${resolved.length} / ${faults.length}`} />
              <Stat k="Packets investigated" v={String(stats.packets)} />
              <Stat k="Incorrect actions" v={String(stats.wrong)} />
              <Stat k="Time" v={mmss(elapsed)} />
              <Stat k="Network stability" v={`${Math.round(stability)}%`} />
              <Stat k="Successful repairs" v={String(stats.correct)} />
            </dl>
            <div className="mt-5">
              <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">You learned</div>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {level.learned.map((l, i) => (
                  <motion.li key={l} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.08 }} className="flex items-center gap-2 text-sm text-slate-200">
                    <Check className="h-3.5 w-3.5 text-emerald-400" /> {l}
                  </motion.li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-slate-400">{faults.map(f => f.lesson).join(' ')}</p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {levelIdx < LEVELS.length - 1 ? (
                <PrimaryBtn autoFocus onClick={() => (setLevelIdx(levelIdx + 1), setScreen('briefing'))}>
                  Next: {LEVELS[levelIdx + 1].title}
                </PrimaryBtn>
              ) : (
                <PrimaryBtn autoFocus onClick={onReport}>
                  Continue to lab report
                </PrimaryBtn>
              )}
              <GhostBtn onClick={() => setScreen('briefing')}>Replay level</GhostBtn>
              <GhostBtn onClick={onExit}>Return to lab</GhostBtn>
            </div>
          </Overlay>
        )}
      </AnimatePresence>

      {/* Incident ticket toast at the start of a level */}
      <AnimatePresence>
        {screen === 'play' && elapsed < 9 && !panel && faults.length > 0 && (
          <motion.div
            className="pointer-events-none absolute inset-x-0 bottom-40 mx-auto w-[min(92%,30rem)] rounded-md border border-slate-700 bg-[#0a0f1a]/92 px-4 py-3 backdrop-blur sm:bottom-24"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_NET }}
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber-300">Incident</div>
            {faults.map(f => (
              <p key={f.id} className="mt-1 text-sm text-slate-200">
                {f.ticket}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------

function HudButton({ label, k, icon, onClick, primary }: { label: string; k: string; icon: React.ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`${label} (${k})`}
      aria-label={`${label} (${k})`}
      className={cn(
        'flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-xs backdrop-blur transition-colors',
        primary ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25' : 'border-slate-800 bg-[#070b14]/85 text-slate-300 hover:border-slate-600 hover:text-slate-100',
      )}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
      <kbd className="hidden rounded border border-current/30 px-1 font-mono text-[9px] opacity-60 lg:inline">{k}</kbd>
    </button>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0 z-40 flex items-start justify-center overflow-y-auto bg-[#04060b]/75 p-4 backdrop-blur-[3px] sm:items-center sm:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <motion.div className="w-full max-w-2xl" initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} transition={{ duration: 0.45, ease: EASE_NET }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

function PrimaryBtn({ children, onClick, autoFocus }: { children: React.ReactNode; onClick: () => void; autoFocus?: boolean }) {
  return (
    <button type="button" autoFocus={autoFocus} onClick={onClick} className="group inline-flex h-11 items-center gap-2 rounded-md bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400">
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-11 items-center rounded-md border border-slate-700 px-4 text-sm text-slate-300 transition-colors hover:border-slate-500 hover:text-slate-100">
      {children}
    </button>
  );
}

const Stat = ({ k, v }: { k: string; v: string }) => (
  <div>
    <dt className="text-slate-500">{k}</dt>
    <dd className="mt-0.5 text-sm text-slate-100">{v}</dd>
  </div>
);

function Controls() {
  const rows: [string, string][] = [
    ['WASD / Arrows', 'Move'],
    ['E', 'Interact'],
    ['P', 'Network panel'],
    ['Tab', 'Topology map'],
    ['G', 'Diagnose'],
    ['Esc', 'Pause / close'],
  ];
  return (
    <dl className="space-y-1.5 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-3">
          <dt>
            <kbd className="rounded border border-slate-700 bg-slate-900 px-1.5 py-0.5 font-mono text-[11px] text-slate-300">{k}</kbd>
          </dt>
          <dd className="text-slate-400">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Joystick({ onMove }: { onMove: (x: number, y: number) => void }) {
  const [knob, setKnob] = useState({ x: 0, y: 0 });
  const base = useRef<HTMLDivElement>(null);
  const R = 44;
  const move = (e: React.PointerEvent) => {
    const r = base.current!.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2);
    let y = e.clientY - (r.top + r.height / 2);
    const m = Math.hypot(x, y);
    if (m > R) (x = (x / m) * R), (y = (y / m) * R);
    setKnob({ x, y });
    onMove(x / R, y / R);
  };
  const end = () => {
    setKnob({ x: 0, y: 0 });
    onMove(0, 0);
  };
  return (
    <div
      ref={base}
      className="absolute bottom-6 left-5 h-28 w-28 touch-none rounded-full border border-slate-700 bg-[#070b14]/60 backdrop-blur"
      onPointerDown={e => (e.currentTarget.setPointerCapture(e.pointerId), move(e))}
      onPointerMove={e => e.buttons && move(e)}
      onPointerUp={end}
      onPointerCancel={end}
      aria-label="Movement joystick"
      role="application"
    >
      <span className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full border border-emerald-400/50 bg-emerald-500/20" style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }} />
    </div>
  );
}
