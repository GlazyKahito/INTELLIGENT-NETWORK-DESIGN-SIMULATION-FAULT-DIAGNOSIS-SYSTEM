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
  { at: 0, speed: 0.15, intensity: 0 },
  { at: 300, speed: 0.7, intensity: 0.9 },
  { at: 900, speed: 1.9, intensity: 1 },
  { at: 1700, speed: 3.8, intensity: 1 },
  { at: 2500, speed: 7.5, intensity: 1.15 },
];
const TUNNEL_DURATION = 3500;
const EXIT_DURATION = 700;

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
  { key: '3', label: 'Forwarding Plane game', target: 'minigame' },
];

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
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
        ? { speed: 6, intensity: 0.9 }
        : { speed: 0.35, intensity: 0.55 };

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="Intelligent Network Lab — introduction"
      className="fixed inset-0 z-[60] overflow-hidden bg-background text-foreground"
      animate={{ opacity: phase === 'exit' ? 0 : 1 }}
      transition={{ duration: EXIT_DURATION / 1000, ease: 'easeInOut' }}
    >
      {/* Stage: warp tunnel */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: reduceMotion ? 1 : 0 }}
        animate={{ opacity: phase === 'tunnel' && stage === 0 ? 0 : 1, scale: phase === 'exit' ? 1.08 : 1 }}
        transition={{ duration: phase === 'exit' ? EXIT_DURATION / 1000 : 0.9, ease: EASE_OUT }}
      >
        <WarpTunnel speed={tunnel.speed} intensity={tunnel.intensity} onReady={markReady} aria-label="Travelling through a network data tunnel" />
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
          <TunnelOverlay key="tunnel" started={ready} layer={layer} onSkip={skipTunnel} />
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
          />
        )}
      </AnimatePresence>

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

function TunnelOverlay({ started, layer, onSkip }: { started: boolean; layer: number; onSkip: () => void }) {
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      {/* Wordmark — we fly through it on exit */}
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, letterSpacing: '0.7em', filter: 'blur(12px)' }}
          animate={started ? { opacity: 1, letterSpacing: '0.24em', filter: 'blur(0px)' } : undefined}
          exit={{ opacity: 0, scale: 1.7, filter: 'blur(8px)', transition: { duration: 0.45, ease: 'easeIn' } }}
          transition={{ delay: 0.7, duration: 1.5, ease: EASE_OUT }}
        >
          <div className="font-mono text-[10px] uppercase text-muted-foreground sm:text-[11px]">Somaiya Virtual Labs · DCN</div>
          <div className="mt-3 font-display text-2xl font-semibold uppercase text-foreground sm:text-4xl md:text-5xl">
            Intelligent Network Lab
          </div>
        </motion.div>
      </div>

      {/* OSI trace readout — the tunnel descends the stack */}
      <div className="absolute bottom-6 left-4 font-mono text-[11px] text-muted-foreground sm:bottom-8 sm:left-8" aria-hidden>
        <div className="mb-2 flex gap-1">
          {OSI_LAYERS.map((_, i) => (
            <span
              key={i}
              className={`h-1 w-4 rounded-full transition-colors duration-300 sm:w-6 ${i <= layer ? 'bg-primary' : 'bg-border'}`}
            />
          ))}
        </div>
        <div className="h-4 overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            {layer >= 0 && (
              <motion.div
                key={layer}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.22 }}
              >
                <span className="text-primary">L{layer + 1}</span> · {OSI_LAYERS[layer]}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

function IntroPanel({
  muted,
  onToggleMute,
  onEnter,
}: {
  muted: boolean;
  onToggleMute: () => void;
  onEnter: (target?: string) => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col overflow-y-auto"
      initial="hidden"
      animate="show"
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
          Experiment 08 · Capstone virtual lab
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
            className="group inline-flex h-12 items-center justify-center gap-3 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-offset-4"
          >
            Enter lab
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
          </button>
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
