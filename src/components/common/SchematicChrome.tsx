import { useEffect, useRef } from 'react';

const SHEETS: Record<string, { n: number; name: string; net: string }> = {
  home: { n: 1, name: 'System overview', net: '0.0.0.0/0' },
  aim: { n: 2, name: 'Aim & objectives', net: '10.0.1.0/24' },
  theory: { n: 3, name: 'Networking theory', net: '10.0.2.0/24' },
  design: { n: 4, name: 'Network design', net: '192.168.1.0/24' },
  simulation: { n: 5, name: 'Packet simulation', net: '192.168.2.0/24' },
  diagnostics: { n: 6, name: 'Fault diagnosis', net: '172.16.0.0/12' },
  assessments: { n: 7, name: 'Assessment', net: '10.0.7.0/24' },
  minigame: { n: 8, name: 'Mini game', net: '198.51.100.0/24' },
  conclusion: { n: 9, name: 'Report', net: '10.0.9.0/24' },
};

/**
 * Drawing-sheet chrome around the lab: a ruler on the left edge, a live cursor
 * coordinate readout, and an engineering title block naming the current sheet.
 * Desktop only; the readout writes straight to the DOM (no React re-render).
 */
export function SchematicChrome({ activeModule }: { activeModule: string }) {
  const xy = useRef<HTMLSpanElement>(null);
  const sheet = SHEETS[activeModule] ?? SHEETS.home;

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    const pad = (v: number) => String(Math.max(0, Math.round(v))).padStart(4, '0');
    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY + window.scrollY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (xy.current) xy.current.textContent = `X ${pad(x)}  Y ${pad(y)}`;
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div aria-hidden className="pointer-events-none">
      <div className="sheet-ruler fixed bottom-0 left-0 top-[88px] z-20 hidden w-[14px] border-r border-slate-800/80 lg:block" />
      <div className="fixed bottom-5 left-7 z-30 hidden font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500 xl:block">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 bg-emerald-500" />
          <span ref={xy} className="tabular-nums text-slate-300">
            X 0000 Y 0000
          </span>
        </div>
        <div className="mt-1 pl-3.5">Net {sheet.net}</div>
      </div>
      <div className="fixed bottom-5 right-5 z-30 hidden border border-slate-700/80 bg-[#0d0c0b]/85 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-400 backdrop-blur xl:grid xl:grid-cols-[auto_auto]">
        <span className="border-b border-r border-slate-700/80 px-2 py-1 text-slate-500">Dwg</span>
        <span className="border-b border-slate-700/80 px-2 py-1 text-slate-200">INDS-{String(sheet.n).padStart(2, '0')}</span>
        <span className="border-b border-r border-slate-700/80 px-2 py-1 text-slate-500">Sheet</span>
        <span className="border-b border-slate-700/80 px-2 py-1 text-emerald-400">
          {sheet.n} / 9 · {sheet.name}
        </span>
        <span className="border-r border-slate-700/80 px-2 py-1 text-slate-500">Rev</span>
        <span className="px-2 py-1 text-slate-300">C · Somaiya DCN</span>
      </div>
    </div>
  );
}
