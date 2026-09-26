import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseAlpha: number;
  color: string;
}

export const LiveWallpaper: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef<{ x: number; y: number; isHovering: boolean }>({
    x: -1000,
    y: -1000,
    isHovering: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Render a simple elegant static grid
      ctx.fillStyle = '#070a12';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
        isHovering: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.isHovering = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    // Particle nodes configuration
    const particleCount = Math.min(55, Math.floor((width * height) / 25000));
    let particles: Particle[] = [];

    const colors = [
      'rgba(16, 185, 129, ', // Emerald
      'rgba(6, 182, 212, ',  // Cyan
      'rgba(99, 102, 241, ', // Indigo
    ];

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.45,
          vy: (Math.random() - 0.5) * 0.45,
          radius: Math.random() * 2 + 1.2,
          baseAlpha: Math.random() * 0.35 + 0.15,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    initParticles();

    // Pulse time variable for traveling packet pulses along lines
    let pulseTime = 0;

    const render = () => {
      pulseTime += 0.015;
      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const maxDistance = 145;

      // Update and draw network links
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];

        // Move
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce from boundaries
        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Mouse attraction/drift
        if (mouse.isHovering) {
          const dx = mouse.x - p1.x;
          const dy = mouse.y - p1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 180 && dist > 10) {
            const force = (180 - dist) / 180;
            p1.x += (dx / dist) * force * 0.4;
            p1.y += (dy / dist) * force * 0.4;
          }
        }

        // Draw connections between nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.18;
            ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
            ctx.lineWidth = 0.85;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();

            // Traveling packet spark on some links
            if ((i + j) % 5 === 0) {
              const progress = (Math.sin(pulseTime + i) + 1) / 2;
              const sparkX = p1.x + (p2.x - p1.x) * progress;
              const sparkY = p1.y + (p2.y - p1.y) * progress;
              ctx.fillStyle = `rgba(52, 211, 153, ${alpha * 2})`;
              ctx.beginPath();
              ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Draw Node
        ctx.fillStyle = p1.color + `${p1.baseAlpha})`;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-40 transition-opacity duration-1000"
      style={{ filter: 'blur(0.4px)' }}
    />
  );
};
