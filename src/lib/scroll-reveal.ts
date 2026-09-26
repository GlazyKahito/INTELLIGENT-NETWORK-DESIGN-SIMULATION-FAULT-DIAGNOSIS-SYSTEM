// Scroll-reveal: content blocks inside <main> fade and rise into place the first
// time they scroll into view. Blocks are discovered automatically (panels, cards,
// figures, headings, tables); only the outermost block in a nesting animates, and
// siblings are lightly staggered. New content (tab switches, section changes) is
// picked up by a MutationObserver. Skipped entirely for reduced motion.

const BLOCKS = [
  '[class*="rounded-2xl"][class*="border"]',
  '[class*="rounded-3xl"][class*="border"]',
  '[class*="rounded-xl"][class*="border"]',
  'figure',
  'h2',
  'table',
].join(',');

export function initScrollReveal(root: HTMLElement): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {};

  const io = new IntersectionObserver(
    entries => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        const el = e.target as HTMLElement;
        el.classList.add('is-revealed');
        pending.delete(el);
        io.unobserve(el);
        // Drop the classes once the transition ends so nothing lingers (e.g. transforms).
        window.setTimeout(() => el.classList.remove('reveal', 'is-revealed'), 1100);
      }
    },
    { rootMargin: '0px', threshold: 0 },
  );

  // Safety net: anything whose top is on screen gets revealed, even if the observer
  // never fires (e.g. the last block on a page that cannot scroll any further).
  const pending = new Set<HTMLElement>();
  const sweep = () => {
    for (const el of pending) {
      if (el.getBoundingClientRect().top < window.innerHeight) {
        el.classList.add('is-revealed');
        pending.delete(el);
        io.unobserve(el);
        window.setTimeout(() => el.classList.remove('reveal', 'is-revealed'), 1100);
      }
    }
  };
  const onScroll = () => requestAnimationFrame(sweep);
  window.addEventListener('scroll', onScroll, { passive: true });
  const sweepTimer = window.setInterval(sweep, 800);

  const seen = new WeakSet<Element>();
  const scan = () => {
    const found = Array.from(root.querySelectorAll<HTMLElement>(BLOCKS));
    const chosen: HTMLElement[] = [];
    for (const el of found) {
      if (seen.has(el)) continue;
      seen.add(el);
      if (el.closest('[data-no-reveal]')) continue;
      if (getComputedStyle(el).position === 'fixed') continue;
      // only the outermost block of a nesting animates
      const outer = found.find(o => o !== el && o.contains(el));
      if (outer) continue;
      chosen.push(el);
    }
    const perParent = new Map<Element | null, number>();
    for (const el of chosen) {
      const i = perParent.get(el.parentElement) ?? 0;
      perParent.set(el.parentElement, i + 1);
      el.style.setProperty('--reveal-delay', `${Math.min(i, 5) * 70}ms`);
      el.classList.add('reveal');
      pending.add(el);
      io.observe(el);
    }
  };

  let queued = 0;
  const mo = new MutationObserver(() => {
    if (queued) return;
    queued = requestAnimationFrame(() => {
      queued = 0;
      scan();
    });
  });
  mo.observe(root, { childList: true, subtree: true });
  scan();

  return () => {
    mo.disconnect();
    window.removeEventListener('scroll', onScroll);
    clearInterval(sweepTimer);
    io.disconnect();
    cancelAnimationFrame(queued);
  };
}
