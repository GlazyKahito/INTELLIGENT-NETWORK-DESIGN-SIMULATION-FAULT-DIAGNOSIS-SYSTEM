import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState } from 'react';
import { EASE_NET, PacketPath } from './PacketPath';

// Network-themed success / error feedback, used instead of confetti.

export interface NetStatusEvent {
  ok: boolean;
  title: string;
  detail?: string;
}

const EVT = 'dcn:net-status';

export function notifyNet(e: NetStatusEvent) {
  window.dispatchEvent(new CustomEvent<NetStatusEvent>(EVT, { detail: e }));
}

export function NetStatusHost() {
  const [item, setItem] = useState<(NetStatusEvent & { id: number }) | null>(null);

  useEffect(() => {
    let timer = 0;
    const on = (e: Event) => {
      const detail = (e as CustomEvent<NetStatusEvent>).detail;
      setItem({ ...detail, id: Date.now() });
      clearTimeout(timer);
      timer = window.setTimeout(() => setItem(null), 3400);
    };
    window.addEventListener(EVT, on);
    return () => {
      window.removeEventListener(EVT, on);
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-[70] flex justify-center px-4" aria-live="polite">
      <AnimatePresence>
        {item && (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3, ease: EASE_NET }}
            className="pointer-events-auto w-full max-w-sm rounded-lg border border-slate-700/80 bg-[#0a0f1a]/95 px-4 py-3 shadow-2xl backdrop-blur"
          >
            <PacketPath nodes={['SRC', 'LINK', 'DST']} broken={item.ok ? null : 1} compact runKey={item.id} />
            <div className={`mt-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] ${item.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
              {item.title}
            </div>
            {item.detail && <div className="mt-0.5 text-xs text-slate-400">{item.detail}</div>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
