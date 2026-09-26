import React, { useEffect, useRef } from 'react';

interface Streak {
  angle: number;
  dist: number; // 0 = vanishing point, 1 = screen corner
  length: number;
  speed: number;
  packet: boolean;
}

const FRAME_MS = 1000 / 30;

/**
 * Ambient "tunnel echo" behind the lab: a few faint streaks drifting out of a
 * vanishing point, echoing the opening warp at a fraction of the cost (2D canvas,
 * ~70 lines, 30 fps cap, paused while the tab is hidden, static under reduced motion).
 */
export const LiveWallpaper: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let width = 0;
    let height = 0;
    let maxR = 0;
    let streaks: Streak[] = [];

    const spawn = (dist = Math.random()): Streak => {
      const packet = Math.random() < 0.12;
      return {
        angle: Math.random() * Math.PI * 2,
        dist,
        length: packet ? 0.012 : 0.04 + Math.random() * 0.08,
        speed: 0.012 + Math.random() * 0.02,
        packet,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      maxR = Math.hypot(width, height) / 2;
      const count = width < 768 ? 36 : 72;
      streaks = Array.from({ length: count }, () => spawn());
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      const cx = width / 2;
      const cy = height * 0.42;
      ctx.lineCap = 'round';
      for (const s of streaks) {
        const r0 = s.dist * maxR;
        const r1 = (s.dist + s.length * (0.4 + s.dist)) * maxR;
        const cos = Math.cos(s.angle);
        const sin = Math.sin(s.angle);
        const alpha = Math.min(1, s.dist * 1.4) * (s.packet ? 0.55 : 0.22);
        ctx.strokeStyle = s.packet ? `rgba(110, 231, 183, ${alpha})` : `rgba(16, 185, 129, ${alpha})`;
        ctx.lineWidth = s.packet ? 1.6 : 1;
        ctx.beginPath();
        ctx.moveTo(cx + cos * r0, cy + sin * r0);
        ctx.lineTo(cx + cos * r1, cy + sin * r1);
        ctx.stroke();
      }
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduced) {
      draw();
      return () => window.removeEventListener('resize', resize);
    }

    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      acc += now - last;
      last = now;
      if (acc < FRAME_MS) return;
      const dt = Math.min(acc, 100) / 1000;
      acc = 0;
      for (let i = 0; i < streaks.length; i++) {
        const s = streaks[i];
        s.dist += s.speed * (0.25 + s.dist * 1.6) * dt * 6;
        if (s.dist > 1.05) streaks[i] = spawn(0.02);
      }
      draw();
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 tech-grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_50%_40%,black,transparent_75%)]" />
      <canvas ref={canvasRef} className="absolute inset-0 opacity-60" />
    </div>
  );
};
