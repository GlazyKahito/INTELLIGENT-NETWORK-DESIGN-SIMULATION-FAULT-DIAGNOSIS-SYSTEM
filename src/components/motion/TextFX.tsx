import { AnimatePresence, animate, motion, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

// Text effects in the spirit of 21st.dev's text components, tuned to the lab:
// decode (hyper-text), split rise, shimmer, word rotator, count-up.

const GLYPHS = '01ABCDEF#<>/:*';
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Characters resolve left-to-right out of hex noise; replays on hover. */
export function ScrambleText({ text, className, duration = 700, hover = true }: { text: string; className?: string; duration?: number; hover?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const reduce = useReducedMotion();
  const [out, setOut] = useState(text);
  const timer = useRef(0);

  const run = () => {
    if (reduce) return;
    clearInterval(timer.current);
    const t0 = performance.now();
    timer.current = window.setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / duration);
      const shown = Math.floor(p * text.length);
      setOut(text.split('').map((ch, i) => (ch === ' ' || i < shown ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(''));
      if (p >= 1) clearInterval(timer.current);
    }, 32);
  };

  useEffect(() => {
    if (inView) run();
    return () => clearInterval(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, text]);

  return (
    <span ref={ref} className={className} aria-label={text} onMouseEnter={hover ? run : undefined}>
      <span aria-hidden>{out}</span>
    </span>
  );
}

/** Words stay intact for wrapping; each letter rises out of a mask with a blur. */
export function SplitText({ text, className, delay = 0, stagger = 0.018 }: { text: string; className?: string; delay?: number; stagger?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduce = useReducedMotion();
  if (reduce) return <span className={className}>{text}</span>;
  let n = 0;
  return (
    <span ref={ref} className={className} aria-label={text}>
      {text.split(' ').map((word, wi, words) => (
        <span key={wi} aria-hidden className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          {word.split('').map((ch, ci) => {
            const i = n++;
            return (
              <motion.span
                key={ci}
                className="inline-block"
                initial={{ y: '105%', opacity: 0, filter: 'blur(6px)' }}
                animate={inView ? { y: '0%', opacity: 1, filter: 'blur(0px)' } : undefined}
                transition={{ delay: delay + i * stagger, duration: 0.6, ease: EASE }}
              >
                {ch}
              </motion.span>
            );
          })}
          {wi < words.length - 1 && ' '}
        </span>
      ))}
    </span>
  );
}

/** A light sweep travelling across the text, on a loop. */
export function ShinyText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn('shiny-text', className)}>{children}</span>;
}

/** Cycles through phrases with a vertical slide. */
export function RotatingText({ words, className, interval = 2200 }: { words: string[]; className?: string; interval?: number }) {
  const [i, setI] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setI(v => (v + 1) % words.length), interval);
    return () => clearInterval(id);
  }, [words.length, interval, reduce]);
  return (
    <span className={cn('relative inline-flex overflow-hidden align-bottom', className)} aria-live="polite">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={words[i]}
          className="inline-block whitespace-nowrap"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: '0%', opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Counts from 0 to the value once it scrolls into view. */
export function CountUp({ value, suffix = '', className, duration = 1.2 }: { value: number; suffix?: string; className?: string; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    const node = ref.current;
    if (!node || !inView) return;
    if (reduce) {
      node.textContent = `${value}${suffix}`;
      return;
    }
    const c = animate(0, value, { duration, ease: 'easeOut', onUpdate: v => (node.textContent = `${Math.round(v)}${suffix}`) });
    return () => c.stop();
  }, [inView, value, suffix, duration, reduce]);
  return (
    <span ref={ref} className={cn('tabular-nums', className)}>
      0{suffix}
    </span>
  );
}
