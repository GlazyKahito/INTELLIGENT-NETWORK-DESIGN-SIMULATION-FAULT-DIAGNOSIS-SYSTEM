import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

// Site-wide smooth scrolling (Lenis). Paused whenever an overlay locks the page
// (intro, game, fullscreen lab set body overflow: hidden) and skipped entirely
// for users who prefer reduced motion.

let lenis: Lenis | null = null;

export function initSmoothScroll(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  lenis = new Lenis({
    duration: 1.1,
    easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // ease-out expo
    allowNestedScroll: true, // terminals, lists and modals keep their own scroll
    anchors: true,
  });

  let raf = 0;
  const loop = (time: number) => {
    lenis?.raf(time);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  // Follow page locks: overlays set body overflow hidden while they are open.
  const sync = () => {
    const locked = document.body.style.overflow === 'hidden' || !!document.body.dataset.gameActive;
    if (locked) lenis?.stop();
    else lenis?.start();
  };
  const observer = new MutationObserver(sync);
  observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'data-game-active'] });
  sync();

  return () => {
    cancelAnimationFrame(raf);
    observer.disconnect();
    lenis?.destroy();
    lenis = null;
  };
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { duration: 0.9 });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}
