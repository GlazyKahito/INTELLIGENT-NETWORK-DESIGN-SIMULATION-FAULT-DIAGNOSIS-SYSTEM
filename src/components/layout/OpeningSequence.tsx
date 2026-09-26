import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowRight, Network, Volume2, VolumeX } from 'lucide-react';
import { WarpTunnel } from '@/components/ui/warp-tunnel';
import { markIntroSeen } from '@/lib/intro-session';
import { getAudioMuteState, playSound, toggleAudioMute } from '@/lib/sound';

type Phase = 'tunnel' | 'intro' | 'exit';

interface OpeningSequenceProps {
  onEnter: (targetModule?: string) => void;
}

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Warp timeline (ms). Speed/intensity are targets; the tunnel eases between them.
const TUNNEL_STAGES = [
  { at: 0, speed: 0.15, intensity: 0, collapse: 0 },
  { at: 300, speed: 0.7, intensity: 0.9, collapse: 0 },
  { at: 900, speed: 1.9, intensity: 1, collapse: 0 },
  { at: 1700, speed: 3.8, intensity: 1, collapse: 0 },
  { at: 2500, speed: 7.5, intensity: 1.15, collapse: 0 },
  // Streaks converge on the vanishing point; a network node bursts out of it.
  { at: 3000, speed: 9, intensity: 1.2, collapse: 1 },
];
const BURST_STAGE = 5;
// Signal orange → amber streaks with white-hot packets.
const WARP_COLORS = { primary: '#ff5f1f', accent: '#ffb347', highlight: '#fff1e6' };
const TUNNEL_DURATION = 3750;
const EXIT_DURATION = 1100;
const AUTO_ENTER_S = 30;

const OSI_LAYERS = ['Physical', 'Data link', 'Network', 'Transport', 'Session', 'Presentation', 'Application'];
const LAYER_START = 600;
const LAYER_STEP = 330;

const WORKFLOW = [
  ['Design', 'networks.'],
  ['Inject', 'faults.'],
  ['Trace', 'packets.'],
  ['Diagnose', 'failures.'],
  ['Verify', 'the solution.'],
];

const JOURNEY = ['Aim', 'Theory', 'Design', 'Simulate', 'Diagnose', 'Assess', 'Play', 'Report'];

const QUICK_JUMPS = [
  { key: '1', label: 'Network designer', target: 'design' },
  { key: '2', label: 'Fault diagnosis', target: 'diagnostics' },
  { key: '3', label: 'Rogue Packet game', target: 'minigame' },
];

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  leave: { opacity: 0.12, transition: { duration: 0.3 } },
};

const rise: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE_OUT } },
};

export function OpeningSequence({ onEnter }: OpeningSequenceProps) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(reduceMotion ? 'intro' : 'tunnel');
  const [stage, setStage] = useState(0);
  // The timeline waits for the tunnel's first frame so slow GPUs don't miss the entrance.
  const [ready, setReady] = useState(false);
  const markReady = useCallback(() => setReady(true), []);
  const [layer, setLayer] = useState(-1);
  const [muted, setMuted] = useState(getAudioMuteState());
  const exitTarget = useRef<string>('home');
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const skipTunnel = useCallback(() => {
    markIntroSeen();
    setPhase(p => (p === 'tunnel' ? 'intro' : p));
  }, []);

  const enter = useCallback((target = 'home') => {
    markIntroSeen();
    if (phaseRef.current === 'exit') return;
    phaseRef.current = 'exit';
    exitTarget.current = target;
    playSound('success');
    setPhase('exit');
  }, []);

  useEffect(() => {
    const t = window.setTimeout(markReady, 1500);
    return () => clearTimeout(t);
  }, [markReady]);

  // Warp timeline.
  useEffect(() => {
    if (phase !== 'tunnel' || !ready) return;
    const timers = [
      ...TUNNEL_STAGES.map((s, i) => window.setTimeout(() => setStage(i), s.at)),
      ...OSI_LAYERS.map((_, i) => window.setTimeout(() => setLayer(i), LAYER_START + i * LAYER_STEP)),
      window.setTimeout(skipTunnel, TUNNEL_DURATION),
    ];
    return () => timers.forEach(clearTimeout);
  }, [phase, ready, skipTunnel]);

  // Hand over to the app once the exit fade has played.
  useEffect(() => {
    if (phase !== 'exit') return;
    const t = window.setTimeout(() => onEnter(exitTarget.current), reduceMotion ? 0 : EXIT_DURATION);
    return () => clearTimeout(t);
  }, [phase, onEnter, reduceMotion]);

  // Keyboard: Esc skips the warp (or enters from the intro); Enter / 1–3 act on the intro.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const onButton = e.target instanceof HTMLButtonElement;
      if (phase === 'tunnel') {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault();
          skipTunnel();
        }
        return;
      }
      if (phase !== 'intro') return;
      if (e.key === 'Escape' || (e.key === 'Enter' && !onButton)) {
        e.preventDefault();
        enter('home');
        return;
      }
      const jump = QUICK_JUMPS.find(j => j.key === e.key);
      if (jump) {
        e.preventDefault();
        enter(jump.target);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, skipTunnel, enter]);

  // Lock page scroll underneath the overlay.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const tunnel =
    phase === 'tunnel'
      ? TUNNEL_STAGES[stage]
      : phase === 'exit'
        ? { speed: 4, intensity: 0.5, collapse: 0 }
        : { speed: 0.35, intensity: 0.55, collapse: 0 };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Intelligent Network Lab — introduction"
      className="fixed inset-0 z-[60] overflow-hidden bg-background text-foreground"
      animate={{ opacity: phase === 'exit' ? 0 : 1 }}
      transition={{ delay: phase === 'exit' && !reduceMotion ? 0.72 : 0, duration: 0.38, ease: 'easeInOut' }}
    >
      {/* Stage: warp tunnel */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: reduceMotion ? 1 : 0 }}
        animate={{ opacity: phase === 'tunnel' && stage === 0 ? 0 : 1, scale: phase === 'exit' ? 1.06 : 1 }}
        transition={{ duration: phase === 'exit' ? EXIT_DURATION / 1000 : 0.9, ease: EASE_OUT }}
      >
        <WarpTunnel
          speed={tunnel.speed}
          intensity={tunnel.intensity}
          collapse={tunnel.collapse}
          colors={WARP_COLORS}
          onReady={markReady} aria-label="Travelling through a network data tunnel" />
      </motion.div>

      {/* Vanishing-point bloom + readability vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.10), transparent 42%)' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 120% 90% at 50% 50%, transparent 30%, hsl(var(--background) / 0.85) 100%), linear-gradient(90deg, hsl(var(--background) / 0.82) 0%, hsl(var(--background) / 0.35) 55%, transparent 100%)',
        }}
        initial={false}
        animate={{ opacity: phase === 'tunnel' ? 0 : 1 }}
        transition={{ duration: 0.9, ease: EASE_OUT }}
      />

      <AnimatePresence mode="wait">
        {phase === 'tunnel' ? (
          <TunnelOverlay key="tunnel" started={ready} stage={stage} layer={layer} onSkip={skipTunnel} />
        ) : (
          <IntroPanel
            key="intro"
            muted={muted}
            onToggleMute={() => {
              const next = toggleAudioMute();
              setMuted(next);
              if (!next) playSound('click');
            }}
            onEnter={enter}
            leaving={phase === 'exit'}
          />
        )}
      </AnimatePresence>

      {/* Enter lab: the lab topology links up and a packet carries you in */}
      <AnimatePresence>{phase === 'exit' && !reduceMotion && <EnterTopology key="enter" />}</AnimatePresence>

      {/* Peak flash when the warp hands over to the intro */}
      <AnimatePresence>
        {phase === 'intro' && !reduceMotion && (
          <motion.div
            key="flash"
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.35), hsl(var(--background) / 0) 70%)' }}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/** Letters resolve one by one out of blur — the link coming into focus. */
function ResolveText({ text, start }: { text: string; start: boolean }) {
  return (
    <span aria-label={text} className="inline-block">
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block"
          initial={{ opacity: 0, y: '0.3em', filter: 'blur(8px)' }}
          animate={start ? { opacity: 1, y: 0, filter: 'blur(0px)' } : undefined}
          transition={{ delay: 0.35 + i * 0.035, duration: 0.55, ease: EASE_OUT }}
        >
          {ch === ' ' ? '\u00a0' : ch}
        </motion.span>
      ))}
    </span>
  );
}

const HANDSHAKE = ['SYN', 'SYN-ACK', 'ACK'];

function TunnelOverlay({ started, stage, layer, onSkip }: { started: boolean; stage: number; layer: number; onSkip: () => void }) {
  const [hs, setHs] = useState(-1);
  const [pkts, setPkts] = useState(0);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const burst = stage >= BURST_STAGE;

  useEffect(() => {
    if (!started) return;
    const timers = [1250, 1650, 2050, 2450].map((at, i) => window.setTimeout(() => setHs(i), at));
    const id = window.setInterval(() => setPkts(p => p + 7 + stageRef.current * stageRef.current * 18 + Math.floor(Math.random() * 9)), 60);
    return () => {
      timers.forEach(clearTimeout);
      clearInterval(id);
    };
  }, [started]);

  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      {/* Link readout — we fly through it as the streaks converge */}
      <div className="absolute inset-0 flex items-center justify-center px-4">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={started ? (burst ? { opacity: 0, scale: 1.5, filter: 'blur(8px)' } : { opacity: 1 }) : undefined}
          transition={burst ? { duration: 0.4, ease: 'easeIn' } : { delay: 0.5, duration: 0.6 }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground sm:text-[11px]">
            Opening link → <span className="text-foreground">dcn-lab.somaiya</span> · gw 192.168.1.1
          </div>
          <div className="mt-4 font-display text-[2rem] font-semibold uppercase leading-none tracking-[0.06em] text-foreground sm:text-5xl md:text-6xl">
            <ResolveText text="Intelligent Network Lab" start={started} />
          </div>
          <div className="mt-5 flex items-center justify-center gap-2 font-mono text-[11px] sm:gap-3" aria-hidden>
            {HANDSHAKE.map((h, i) => (
              <span key={h} className="flex items-center gap-2 sm:gap-3">
                {i > 0 && <span className={`h-px w-5 transition-colors duration-300 sm:w-8 ${hs >= i ? 'bg-primary' : 'bg-border'}`} />}
                <span className={`rounded border px-2 py-0.5 transition-colors duration-300 ${hs >= i ? 'border-primary/60 text-primary' : 'border-border text-muted-foreground/60'}`}>{h}</span>
              </span>
            ))}
          </div>
          <div className="mt-3 h-4 font-mono text-[11px] uppercase tracking-[0.2em]">
            <AnimatePresence>
              {hs >= 3 && (
                <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-primary">
                  Connected · 3 hops · 12 ms
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Convergence: a node forms at the vanishing point and the network bursts outward */}
      <AnimatePresence>{burst && <NodeBurst key="burst" />}</AnimatePresence>

      {/* OSI trace readout — the tunnel descends the stack */}
      <div className="absolute bottom-6 left-4 font-mono text-[11px] text-muted-foreground sm:bottom-8 sm:left-8" aria-hidden>
        <div className="mb-2 flex gap-1">
          {OSI_LAYERS.map((_, i) => (
            <span key={i} className={`h-1 w-4 rounded-full transition-colors duration-300 sm:w-6 ${i <= layer ? 'bg-primary' : 'bg-border'}`} />
          ))}
        </div>
        <div className="h-4 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {layer >= 0 && (
              <motion.div key={layer} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.22 }}>
                <span className="text-primary">L{layer + 1}</span> · {OSI_LAYERS[layer]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Packet counter */}
      <div className="absolute bottom-6 right-4 text-right font-mono text-[11px] tabular-nums text-muted-foreground sm:bottom-8 sm:right-8" aria-hidden>
        <div>
          RX <span className="text-foreground">{pkts.toLocaleString()}</span> pkts
        </div>
        <div className="mt-1">{((pkts * 1.46) / 1024).toFixed(1)} MB · 0 dropped</div>
      </div>

      {/* Skip */}
      <motion.button
        type="button"
        onClick={onSkip}
        className="group absolute right-4 top-4 inline-flex items-center gap-2 rounded-md px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground sm:right-8 sm:top-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        aria-label="Skip intro animation"
      >
        Skip intro
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
        <kbd className="ml-1 hidden rounded border border-border px-1.5 py-0.5 text-[10px] sm:inline">Esc</kbd>
      </motion.button>

      {/* Timeline hairline */}
      <motion.div
        aria-hidden
        className="absolute bottom-0 left-0 h-px w-full origin-left bg-primary/60"
        initial={{ scaleX: 0 }}
        animate={started ? { scaleX: 1 } : undefined}
        transition={{ duration: TUNNEL_DURATION / 1000, ease: 'linear' }}
      />
    </motion.div>
  );
}

function NodeBurst() {
  const rays = 14;
  return (
    <motion.svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="-500 -500 1000 1000"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {Array.from({ length: rays }, (_, i) => {
        const a = (i / rays) * Math.PI * 2 + 0.2;
        const len = 180 + (i % 3) * 110;
        return (
          <g key={i}>
            <motion.line
              x1={0}
              y1={0}
              stroke="hsl(var(--primary))"
              strokeOpacity={0.55}
              strokeWidth={1.2}
              initial={{ x2: 0, y2: 0 }}
              animate={{ x2: Math.cos(a) * len, y2: Math.sin(a) * len }}
              transition={{ delay: 0.28, duration: 0.55, ease: EASE_OUT }}
            />
            <motion.circle
              r={3}
              fill="hsl(var(--primary))"
              initial={{ cx: 0, cy: 0, opacity: 0 }}
              animate={{ cx: Math.cos(a) * len, cy: Math.sin(a) * len, opacity: [0, 1, 1] }}
              transition={{ delay: 0.28, duration: 0.55, ease: EASE_OUT }}
            />
          </g>
        );
      })}
      <motion.circle r={9} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={2} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.3, ease: EASE_OUT }} />
      <motion.circle r={4} fill="hsl(var(--primary))" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.12, duration: 0.25 }} />
      <motion.circle r={9} fill="none" stroke="hsl(var(--primary))" initial={{ scale: 1, opacity: 0.9 }} animate={{ scale: 9, opacity: 0 }} transition={{ delay: 0.2, duration: 0.8, ease: EASE_OUT }} />
    </motion.svg>
  );
}

const ENTER_NODES = ['PC', 'SWITCH', 'ROUTER', 'SERVER'];

/** Enter lab: the topology links up, a packet crosses it, and the lab takes over. */
function EnterTopology() {
  const xs = ENTER_NODES.map((_, i) => 12 + i * (76 / (ENTER_NODES.length - 1)));
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      aria-hidden
    >
      <svg viewBox="0 0 100 16" className="mx-auto h-auto w-full max-w-4xl overflow-visible">
        {xs.slice(0, -1).map((x, i) => (
          <motion.line
            key={i}
            x1={x}
            y1={6}
            x2={xs[i + 1]}
            y2={6}
            stroke="hsl(var(--primary))"
            strokeWidth={0.25}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.05 + i * 0.08, duration: 0.22, ease: EASE_OUT }}
          />
        ))}
        {xs.map((x, i) => (
          <g key={i}>
            <motion.circle cx={x} cy={6} r={1.4} fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth={0.3} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.08, duration: 0.2, ease: EASE_OUT }} />
            <motion.circle cx={x} cy={6} r={0.6} fill="hsl(var(--primary))" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.36 + i * 0.12, duration: 0.1 }} />
            <text x={x} y={11.2} textAnchor="middle" className="fill-slate-400 font-mono" style={{ fontSize: 1.7, letterSpacing: 0.3 }}>
              {ENTER_NODES[i]}
            </text>
          </g>
        ))}
        <motion.circle
          r={0.9}
          cy={6}
          fill="hsl(var(--primary))"
          initial={{ cx: xs[0], opacity: 0 }}
          animate={{ cx: xs, opacity: [0, 1, 1, 1] }}
          transition={{ delay: 0.34, duration: 0.42, ease: 'easeInOut' }}
        />
        <motion.circle cx={xs[xs.length - 1]} cy={6} r={1.4} fill="none" stroke="hsl(var(--primary))" strokeWidth={0.3} initial={{ scale: 1, opacity: 0 }} animate={{ scale: 4, opacity: [0, 0.8, 0] }} transition={{ delay: 0.74, duration: 0.45 }} />
      </svg>
      <motion.div className="mt-3 text-center font-mono text-[11px] uppercase tracking-[0.24em] text-primary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.2 }}>
        Link up · entering lab
      </motion.div>
    </motion.div>
  );
}

function IntroPanel({
  muted,
  onToggleMute,
  onEnter,
  leaving,
}: {
  muted: boolean;
  onToggleMute: () => void;
  onEnter: (target?: string) => void;
  leaving: boolean;
}) {
  // Nobody touching anything? Walk in on their behalf after 30 s. Any activity resets the clock.
  const [idleLeft, setIdleLeft] = useState(AUTO_ENTER_S);
  useEffect(() => {
    if (leaving) return;
    const reset = () => setIdleLeft(AUTO_ENTER_S);
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    const id = window.setInterval(() => setIdleLeft(v => v - 1), 1000);
    return () => {
      events.forEach(e => window.removeEventListener(e, reset));
      clearInterval(id);
    };
  }, [leaving]);
  useEffect(() => {
    if (idleLeft <= 0 && !leaving) onEnter('home');
  }, [idleLeft, leaving, onEnter]);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-y-auto"
      initial="hidden"
      animate={leaving ? 'leave' : 'show'}
      exit={{ opacity: 0 }}
      variants={stagger}
    >
      {/* Top bar */}
      <motion.header variants={rise} className="flex shrink-0 items-center justify-between px-4 py-4 sm:px-8 sm:py-6">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-md border border-primary/40 text-primary">
            <Network className="h-4 w-4" aria-hidden />
          </span>
          <div className="leading-tight">
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-foreground">Somaiya Virtual Labs</div>
            <div className="text-xs text-muted-foreground">DCN Laboratory · Dept. of Computer Engineering</div>
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleMute}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
          aria-label={muted ? 'Unmute interface sounds' : 'Mute interface sounds'}
          aria-pressed={muted}
        >
          {muted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
        </button>
      </motion.header>

      {/* Main */}
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-8">
        <motion.div variants={rise} className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.16em] text-primary">
          <span className="h-px w-8 bg-primary" aria-hidden />
          Interactive network laboratory
        </motion.div>

        <h1 className="max-w-5xl font-display text-[2.15rem] font-semibold uppercase leading-[1.02] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          <motion.span variants={rise} className="block">
            Intelligent network design,
          </motion.span>
          <motion.span variants={rise} className="block text-primary">
            simulation &amp; fault diagnosis
          </motion.span>
        </h1>

        {/* Workflow — the lab in five verbs */}
        <motion.ol variants={rise} className="relative mt-8 grid max-w-4xl grid-cols-2 gap-x-6 gap-y-4 sm:mt-10 sm:grid-cols-5 sm:gap-0">
          <span aria-hidden className="absolute left-0 right-0 top-0 hidden h-px bg-border sm:block">
            <span className="packet-run absolute top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary" />
          </span>
          {WORKFLOW.map(([verb, rest], i) => (
            <li key={verb} className="sm:pr-4 sm:pt-4">
              <div className="font-mono text-[11px] text-muted-foreground">{String(i + 1).padStart(2, '0')}</div>
              <div className="mt-1 text-sm text-foreground sm:text-base">
                <span className="font-semibold">{verb}</span> {rest}
              </div>
            </li>
          ))}
        </motion.ol>

        {/* CTA */}
        <motion.div variants={rise} className="mt-10 flex flex-col gap-5 sm:mt-12 sm:flex-row sm:items-center">
          <button
            type="button"
            autoFocus
            onClick={() => onEnter('home')}
            className="group relative inline-flex h-12 items-center justify-center gap-3 overflow-hidden rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-offset-4"
          >
            Enter lab
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
            {/* idle countdown drains along the bottom edge */}
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-[3px] bg-primary-foreground/60 transition-[width] duration-1000 ease-linear"
              style={{ width: `${(idleLeft / AUTO_ENTER_S) * 100}%` }}
            />
          </button>
          <AnimatePresence>
            {idleLeft <= 10 && !leaving && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="font-mono text-xs uppercase tracking-[0.14em] text-primary"
                role="status"
              >
                Entering in {Math.max(0, idleLeft)}s
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            <span className="font-mono text-[11px] uppercase tracking-wider">Jump to</span>
            {QUICK_JUMPS.map(j => (
              <button
                key={j.key}
                type="button"
                onClick={() => onEnter(j.target)}
                className="inline-flex items-center gap-1.5 rounded px-1 underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                {j.label}
                <kbd className="rounded border border-border px-1 font-mono text-[10px] text-muted-foreground">{j.key}</kbd>
              </button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Journey rail */}
      <motion.footer variants={rise} className="shrink-0 px-4 pb-6 sm:px-8 sm:pb-8">
        <div className="mx-auto hidden max-w-6xl md:block" aria-label="Lab journey">
          <div className="relative h-px bg-border">
            <motion.div
              className="absolute inset-y-0 left-0 w-full origin-left bg-primary/70"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.9, duration: 1.4, ease: EASE_OUT }}
            />
          </div>
          <ol className="mt-3 grid grid-cols-8 font-mono text-[11px] text-muted-foreground">
            {JOURNEY.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="text-foreground/40">{String(i + 1).padStart(2, '0')}</span>
                {step}
              </li>
            ))}
          </ol>
        </div>
        <div className="font-mono text-[11px] text-muted-foreground md:hidden">
          8-step guided journey · Aim → Report
        </div>
      </motion.footer>
    </motion.div>
  );
}
