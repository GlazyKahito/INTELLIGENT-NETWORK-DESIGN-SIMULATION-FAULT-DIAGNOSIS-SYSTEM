import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Activity, Cable, Check, Lock, Monitor, Network, Router, ScanSearch, Server, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EASE_NET, LinkLoader, PacketPath } from '@/components/motion/PacketPath';
import { playSound } from '@/lib/sound';
import type { Interactable, RoomId } from './map';
import {
  DEVICE_IDS,
  EXPECTED_IP,
  LINKS,
  dottedMask,
  isSwitch,
  linkById,
  linkUp,
  linksOf,
  peerOf,
  ping,
  portOn,
  portStatus,
  sameNet,
  trace,
  traceroute,
  type DeviceId,
  type Fault,
  type HostId,
  type LinkId,
  type NetState,
  type Trace,
} from './network';

export interface Counters {
  dev: Record<DeviceId, { tx: number; rx: number; drop: number; fwd: number }>;
  link: Record<LinkId, number>;
  crc: number;
}

export const emptyCounters = (): Counters => ({
  dev: Object.fromEntries(DEVICE_IDS.map(d => [d, { tx: 0, rx: 0, drop: 0, fwd: 0 }])) as Counters['dev'],
  link: Object.fromEntries(LINKS.map(l => [l.id, 0])) as Counters['link'],
  crc: 0,
});

// ---------------------------------------------------------------------------
// Shared chrome

export function Sheet({
  title,
  eyebrow,
  icon,
  onClose,
  children,
  wide,
}: {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-end justify-center bg-[#080705]/60 p-2 backdrop-blur-[2px] sm:items-center sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onMouseDown={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn('flex max-h-[88%] w-full flex-col overflow-hidden rounded-lg border border-slate-700/80 bg-[#11100e]/97 shadow-2xl', wide ? 'max-w-4xl' : 'max-w-2xl')}
        initial={{ y: 16, opacity: 0, scale: 0.985 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.3, ease: EASE_NET }}
      >
        <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3">
          {icon && <span className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 text-emerald-300">{icon}</span>}
          <div className="min-w-0 flex-1">
            {eyebrow && <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">{eyebrow}</div>}
            <div className="truncate font-display text-lg font-semibold uppercase tracking-tight text-slate-50">{title}</div>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100" aria-label="Close (Esc)">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-4">{children}</div>
      </motion.div>
    </motion.div>
  );
}

const Field = ({ k, v, warn }: { k: string; v: ReactNode; warn?: boolean }) => (
  <div className="flex items-baseline justify-between gap-4 border-b border-slate-800/70 py-1.5 font-mono text-xs">
    <span className="text-slate-500">{k}</span>
    <span className={cn('text-right', warn ? 'text-amber-300' : 'text-slate-200')}>{v}</span>
  </div>
);

const Pre = ({ children }: { children: ReactNode }) => (
  <pre className="overflow-x-auto whitespace-pre rounded-md border border-slate-800 bg-black/40 p-3 font-mono text-[11px] leading-5 text-slate-300">{children}</pre>
);

const H = ({ children }: { children: ReactNode }) => <div className="mb-1.5 mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500 first:mt-0">{children}</div>;

export const deviceIcon = (d: DeviceId, cls = 'h-4 w-4') =>
  d.startsWith('PC') ? <Monitor className={cls} /> : isSwitch(d) ? <Network className={cls} /> : d === 'ROUTER-01' ? <Router className={cls} /> : <Server className={cls} />;

// ---------------------------------------------------------------------------
// Physical inspection

function arpLine(s: NetState, from: DeviceId, ip: string) {
  const t = trace(s, from, ip, () => Math.random());
  if (t.outcome !== 'delivered') return `${ip.padEnd(15)}  (incomplete)`;
  const mac = t.at === 'ROUTER-01' ? s.router.ifaces[ip === s.router.ifaces['Gi0/1'].ip ? 'Gi0/1' : 'Gi0/0'].mac : s.hosts[t.at as HostId].mac;
  return `${ip.padEnd(15)}  ${mac}   dynamic`;
}

export function InspectView({
  target,
  state,
  counters,
  open,
  elapsed,
}: {
  target: Interactable;
  state: NetState;
  counters: Counters;
  open: Fault[];
  elapsed: number;
}) {
  const d = target.device;
  if (target.kind === 'device' && d?.startsWith('PC')) {
    const c = state.hosts[d as HostId];
    const link = linksOf(d)[0];
    const up = linkUp(state, link.id);
    const k = counters.dev[d];
    const gwLocal = sameNet(c.ip, c.gw, c.mask);
    return (
      <>
        <H>Network adapter · eth0</H>
        <Field k="Status" v="ONLINE" />
        <Field k="IPv4 address" v={c.ip} />
        <Field k="Subnet mask" v={`${dottedMask(c.mask)} (/${c.mask})`} />
        <Field k="Default gateway" v={c.gw} />
        <Field k="MAC address" v={c.mac} />
        <Field k="Addressing" v={c.mode} />
        <Field k="Link" v={up ? 'Connected · 1.0 Gbps full duplex' : 'Media disconnected'} warn={!up} />
        <Field k="Packets sent / received" v={`${k.tx} / ${k.rx}`} />
        <Field k="Packet loss" v={`${k.tx ? Math.round((k.drop / k.tx) * 100) : 0}%`} />
        <H>arp -a</H>
        <Pre>{gwLocal ? arpLine(state, d, c.gw) : `${c.gw.padEnd(15)}  (no interface in this subnet)`}</Pre>
      </>
    );
  }
  if (target.kind === 'device' && d && isSwitch(d)) {
    const sw = d;
    const down = !!state.switchDown[sw];
    const rows = linksOf(sw).map(l => {
      const port = portOn(l, sw);
      const peer = peerOf(l, sw);
      const status = portStatus(state, sw, l);
      const mismatch = state.duplexMismatch === l.id && sw === 'SWITCH-01';
      const duplex = status !== 'connected' ? 'auto   auto' : mismatch ? 'a-half 100 ' : 'a-full a-1000';
      const crc = mismatch ? counters.crc : 0;
      return `${port.padEnd(7)} ${('to ' + peer).padEnd(14)} ${status.padEnd(11)} ${l.id === 'L-TRUNK' || l.id === 'L-UPLINK' ? 'trunk' : '1    '}  ${duplex}  ${String(crc).padStart(4)}`;
    });
    const macs = linksOf(sw)
      .filter(l => portStatus(state, sw, l) === 'connected')
      .flatMap(l => {
        const peer = peerOf(l, sw);
        const port = portOn(l, sw);
        const far = peer.startsWith('PC') ? [peer] : peer === 'SWITCH-02' ? (['PC-03', 'PC-04'] as DeviceId[]).filter(p => linkUp(state, linksOf(p)[0].id)) : peer === 'SWITCH-01' ? (['PC-01', 'PC-02'] as DeviceId[]).filter(p => linkUp(state, linksOf(p)[0].id)) : [];
        const macsHere = far.map(p => `   1    ${state.hosts[p as HostId].mac}   DYNAMIC   ${port}`);
        if (peer === 'ROUTER-01') macsHere.push(`   1    ${state.router.ifaces['Gi0/0'].mac}   DYNAMIC   ${port}`);
        return macsHere;
      });
    return (
      <>
        <Field k="Model" v="Catalyst 2960-X · 24-port" />
        <Field k="Management" v={`${state.hosts[sw].ip}/24 (VLAN 1)`} />
        <Field k="State" v={down ? 'REBOOTING — POST in progress' : `up ${41 + (sw === 'SWITCH-02' ? 3 : 0)}d ${Math.floor(elapsed / 60)}m`} warn={down} />
        <H>show interfaces status</H>
        <Pre>{`Port    Name           Status      Vlan   Duplex Speed  CRC\n${rows.join('\n')}`}</Pre>
        <H>show mac address-table</H>
        <Pre>{`Vlan   Mac Address         Type      Ports\n${macs.join('\n') || '   (empty)'}`}</Pre>
      </>
    );
  }
  if (target.kind === 'device' && d === 'ROUTER-01') {
    const r = state.router;
    const brief = (['Gi0/0', 'Gi0/1'] as const).map(i => {
      const l = LINKS.find(x => (x.a === 'ROUTER-01' && x.aPort === i) || (x.b === 'ROUTER-01' && x.bPort === i))!;
      const st = !r.ifaces[i].up ? 'administratively down' : linkUp(state, l.id) ? 'up' : 'down';
      const proto = r.ifaces[i].up && linkUp(state, l.id) ? 'up' : 'down';
      return `GigabitEthernet${i.slice(2)}  ${r.ifaces[i].ip.padEnd(14)} YES manual ${st.padEnd(22)} ${proto}`;
    });
    const routes = [
      ...(['Gi0/0', 'Gi0/1'] as const).filter(i => r.ifaces[i].up).map(i => `C    ${i === 'Gi0/0' ? '192.168.1.0' : '192.168.2.0'}/24 is directly connected, GigabitEthernet${i.slice(2)}`),
      ...r.statics.map(s => `S    ${s.prefix}/${s.len} [1/0] via ${s.via}`),
    ];
    const pcs = (['PC-01', 'PC-02', 'PC-03', 'PC-04'] as HostId[]).map(p => state.hosts[p].ip).filter((ip, i, a) => a.indexOf(ip) === i && sameNet(ip, '192.168.1.0', 24));
    const arp = [...pcs.map(ip => arpLine(state, 'ROUTER-01', ip)), arpLine(state, 'ROUTER-01', '192.168.2.10')];
    return (
      <>
        <Field k="Model" v="ISR 4331 · IOS XE 17.9" />
        <H>show ip interface brief</H>
        <Pre>{`Interface          IP-Address     OK? Method Status                 Protocol\n${brief.join('\n')}`}</Pre>
        <H>show ip route</H>
        <Pre>{`Codes: C - connected, S - static\n\n${routes.join('\n') || '(no routes)'}`}</Pre>
        <H>show arp</H>
        <Pre>{`Address          Hardware Addr       Type\n${arp.join('\n')}`}</Pre>
      </>
    );
  }
  if (target.kind === 'device' && d === 'SERVER-01') {
    const c = state.hosts['SERVER-01'];
    const fibre = linkUp(state, 'L-SRV');
    if (!state.serverUp)
      return (
        <>
          <Field k="Status" v="NOT RESPONDING" warn />
          <Field k="Power" v="ON · fans 2400 rpm" />
          <Field k="eth0 link" v={fibre ? 'up · 10 Gb/s' : 'down'} />
          <H>Serial console</H>
          <Pre>{`[ 5821.330412] BUG: unable to handle page fault\n[ 5821.330990] Kernel panic - not syncing: Fatal exception in interrupt\n[ 5821.331502] ---[ end Kernel panic ]---`}</Pre>
        </>
      );
    const gwOk = sameNet(c.ip, c.gw, c.mask) && fibre && state.router.ifaces['Gi0/1'].up && state.router.ifaces['Gi0/1'].ip === c.gw;
    return (
      <>
        <Field k="Status" v="ONLINE · up 12d 4h" />
        <Field k="eth0" v={`${c.ip}/${c.mask}`} />
        <Field k="Default route" v={`via ${c.gw}`} />
        <Field k="MAC address" v={c.mac} />
        <Field k="eth0 link" v={fibre ? 'up · 10 Gb/s' : 'down (no light)'} warn={!fibre} />
        <Field k="Packets received" v={counters.dev['SERVER-01'].rx} />
        <H>ss -tlnp</H>
        <Pre>{`LISTEN  0.0.0.0:80   nginx\nLISTEN  0.0.0.0:53   named\nLISTEN  0.0.0.0:445  smbd`}</Pre>
        <H>ip neigh</H>
        <Pre>{`${c.gw}  dev eth0  ${gwOk ? 'lladdr C4:0A:CB:10:00:02 REACHABLE' : 'FAILED'}`}</Pre>
      </>
    );
  }
  if (target.kind === 'cable' && target.link) {
    const l = linkById(target.link);
    const seated = state.cable[l.id];
    const up = linkUp(state, l.id);
    const badEnd = l.id === 'L-TRUNK' ? l.b : l.a;
    const fibre = l.id === 'L-SRV';
    return (
      <>
        <Field k="Media" v={l.media} />
        <Field k="Ends" v={`${l.a} ${l.aPort}  ↔  ${l.b} ${l.bPort}`} />
        <Field k={`Connector at ${l.a}`} v={seated || badEnd !== l.a ? 'seated, latched' : 'NOT SEATED'} warn={!seated && badEnd === l.a} />
        <Field k={`Connector at ${l.b}`} v={seated || badEnd !== l.b ? 'seated, latched' : 'NOT SEATED'} warn={!seated && badEnd === l.b} />
        <Field k={fibre ? 'Light level' : 'Continuity'} v={!seated ? 'open circuit' : fibre ? '-3.1 dBm (good)' : '8/8 conductors OK'} warn={!seated} />
        <Field k="Link pulse" v={up ? 'present both ends' : seated ? 'none from the far end' : 'none'} warn={!up} />
        <Field k="Frames carried" v={counters.link[l.id]} />
      </>
    );
  }
  if (target.kind === 'monitor') {
    const max = Math.max(1, ...LINKS.map(l => counters.link[l.id]));
    return (
      <>
        <H>Link activity (frames since shift start)</H>
        <div className="space-y-1.5">
          {LINKS.map(l => (
            <div key={l.id} className="grid grid-cols-[7.5rem_1fr_3rem] items-center gap-3 font-mono text-[11px]">
              <span className="text-slate-400">{l.a.replace('SWITCH', 'SW').replace('ROUTER', 'R')}–{l.b.replace('SWITCH', 'SW').replace('ROUTER', 'R').replace('SERVER', 'SRV')}</span>
              <span className="h-1.5 overflow-hidden rounded-full bg-slate-800">
                <span className="block h-full rounded-full bg-emerald-500/70" style={{ width: `${(counters.link[l.id] / max) * 100}%` }} />
              </span>
              <span className="text-right text-slate-300">{counters.link[l.id]}</span>
            </div>
          ))}
        </div>
        <H>Alerts</H>
        <Pre>{[...open.map(f => `WARN  ${f.monitorHint}`), 'INFO  NTP synchronised · stratum 2', 'INFO  Config backup completed 02:14'].join('\n')}</Pre>
        <p className="mt-3 text-xs text-slate-500">Link activity is now shown on the topology map (Tab).</p>
      </>
    );
  }
  if (target.kind === 'analyzer') {
    const normal = [
      'TCP  192.168.1.11 → 192.168.2.10  [ACK] Seq=4412 Len=1380',
      'DNS  192.168.1.12 → 192.168.2.10  Standard query A files.lab',
      'ARP  Who has 192.168.1.1? Tell 192.168.1.14',
      'ARP  192.168.1.1 is at C4:0A:CB:10:00:01',
    ];
    const lines = [...open.flatMap(f => f.capture), ...normal].sort(() => Math.random() - 0.5);
    return (
      <>
        <H>Live capture · SPAN of SWITCH-01</H>
        <Pre>{lines.map((l, i) => `${String(i + 1).padStart(3)}  ${(elapsed + i * 0.13).toFixed(2).padStart(7)}  ${l}`).join('\n')}</Pre>
        <p className="mt-3 text-xs text-slate-400">
          <span className="text-emerald-300">PACKET TRACE unlocked.</span> Open the Network Panel (P) to follow the rogue packet through the network.
        </p>
      </>
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Network panel (P)

export type Tool = 'ping' | 'traceroute' | 'trace' | 'journal';

const TARGETS: { ip: string; label: string }[] = [
  { ip: '192.168.2.10', label: 'SERVER-01 (file server)' },
  { ip: '192.168.1.1', label: 'ROUTER-01 Gi0/0 (gateway)' },
  { ip: '192.168.2.1', label: 'ROUTER-01 Gi0/1' },
  ...(['PC-01', 'PC-02', 'PC-03', 'PC-04'] as HostId[]).map(p => ({ ip: EXPECTED_IP[p], label: `${p} (asset record)` })),
  { ip: '192.168.1.2', label: 'SWITCH-01 mgmt' },
  { ip: '192.168.1.3', label: 'SWITCH-02 mgmt' },
];
const SOURCES: DeviceId[] = ['PC-01', 'PC-02', 'PC-03', 'PC-04', 'ROUTER-01', 'SERVER-01'];

export interface JournalEntry {
  id: number;
  tool: string;
  text: string;
  ok: boolean;
}

export function NetworkPanel({
  state,
  tool,
  setTool,
  traceUnlocked,
  journal,
  onRecord,
  onStartTrace,
  onClose,
}: {
  state: NetState;
  tool: Tool;
  setTool: (t: Tool) => void;
  traceUnlocked: boolean;
  journal: JournalEntry[];
  onRecord: (e: Omit<JournalEntry, 'id'>, packets: number, discovered?: DeviceId[]) => void;
  onStartTrace: () => void;
  onClose: () => void;
}) {
  const [src, setSrc] = useState<DeviceId>('PC-01');
  const [dst, setDst] = useState('192.168.2.10');
  const [lines, setLines] = useState<{ text: string; ok: boolean }[]>([]);
  const [running, setRunning] = useState(false);
  const [tr, setTr] = useState<ReturnType<typeof traceroute> | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const runPing = () => {
    timers.current.forEach(clearTimeout);
    const r = ping(state, src, dst);
    setRunning(true);
    setLines([{ text: `PING ${dst} from ${src} (${r.srcIp}) — 32 bytes of data:`, ok: true }]);
    r.lines.forEach((l, i) =>
      timers.current.push(
        window.setTimeout(() => {
          setLines(prev => [...prev, l]);
          playSound(l.ok ? 'packet' : 'click');
        }, 320 * (i + 1)),
      ),
    );
    timers.current.push(
      window.setTimeout(() => {
        setLines(prev => [...prev, { text: `Packets: Sent = 4, Received = ${r.ok}, Lost = ${4 - r.ok} (${r.loss}% loss)`, ok: r.ok === 4 }]);
        setRunning(false);
        onRecord({ tool: 'PING', text: `${src} → ${dst}: ${r.ok}/4 replies (${r.loss}% loss)${r.ok < 4 ? ` · "${r.lines.find(l => !l.ok)?.text}"` : ''}`, ok: r.ok === 4 }, r.packets);
      }, 320 * 5 + 80),
    );
  };

  const runTrace = () => {
    const r = traceroute(state, src, dst);
    setTr(r);
    const chain = r.steps.map(s => s.device).join(' → ');
    onRecord(
      { tool: 'TRACEROUTE', text: `${src} → ${dst}: ${chain}${r.failed ? ' → ✕' : ' ✓'}`, ok: !r.failed },
      r.trace.legs.length * 3 + 3,
      r.steps.map(s => s.device),
    );
  };

  const tabs: { id: Tool; label: string }[] = [
    { id: 'ping', label: 'Ping' },
    { id: 'traceroute', label: 'Traceroute' },
    { id: 'trace', label: 'Packet trace' },
    { id: 'journal', label: `Evidence (${journal.length})` },
  ];

  const selects = (
    <div className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
      <label className="font-mono text-[11px] text-slate-500">
        From
        <select value={src} onChange={e => setSrc(e.target.value as DeviceId)} className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-200">
          {SOURCES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="font-mono text-[11px] text-slate-500">
        To
        <input
          list="rp-targets"
          value={dst}
          onChange={e => setDst(e.target.value.trim())}
          className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-2 py-2 font-mono text-xs text-slate-200"
          aria-label="Destination IP"
        />
        <datalist id="rp-targets">
          {TARGETS.map(t => (
            <option key={t.ip} value={t.ip}>
              {t.label}
            </option>
          ))}
        </datalist>
      </label>
      <button
        type="button"
        disabled={running || !/^\d{1,3}(\.\d{1,3}){3}$/.test(dst)}
        onClick={tool === 'ping' ? runPing : runTrace}
        className="self-end rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-40"
      >
        Run
      </button>
    </div>
  );

  return (
    <Sheet title="Network diagnostics" eyebrow="Network panel · P" icon={<Activity className="h-4 w-4" />} onClose={onClose}>
      <div className="mb-4 flex gap-1 overflow-x-auto rounded-md border border-slate-800 bg-black/30 p-1">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTool(t.id)}
            className={cn('relative whitespace-nowrap rounded px-3 py-1.5 text-xs transition-colors', tool === t.id ? 'text-slate-950' : 'text-slate-400 hover:text-slate-100')}
          >
            {tool === t.id && <motion.span layoutId="rp-tab" className="absolute inset-0 rounded bg-emerald-400" transition={{ duration: 0.25, ease: EASE_NET }} />}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {tool === 'ping' && (
        <>
          {selects}
          <div className="mt-3 min-h-[9rem] rounded-md border border-slate-800 bg-black/40 p-3 font-mono text-[11px] leading-5">
            {lines.length === 0 && <span className="text-slate-600">C:\&gt; ping — pick a source and destination, then Run.</span>}
            {lines.map((l, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -4 }} animate={{ opacity: 1, x: 0 }} className={l.ok ? 'text-slate-200' : 'text-slate-400'}>
                {l.text}
              </motion.div>
            ))}
            {running && <LinkLoader label="Sending echo requests" className="mt-1" />}
          </div>
        </>
      )}

      {tool === 'traceroute' && (
        <>
          {selects}
          {tr && (
            <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_1.2fr]">
              <div>
                <PacketPath
                  key={`${tr.steps.map(s => s.device).join()}-${tr.failed}-${Math.random()}`}
                  nodes={[...tr.steps.map(s => s.device.replace('SWITCH-', 'SW-').replace('ROUTER-', 'R-').replace('SERVER-', 'SRV-')), ...(tr.failed ? [tr.targetLabel.replace('SERVER-', 'SRV-')] : [])]}
                  broken={tr.failed ? tr.steps.length - 1 : null}
                  orientation="vertical"
                  compact
                  okLabel="Destination reached"
                  failLabel="No further hops"
                  className="mx-auto max-w-[150px]"
                />
              </div>
              <Pre>
                {`traceroute to ${tr.target}, 30 hops max\n` +
                  tr.steps
                    .slice(1)
                    .map((s, i) => `${String(i + 1).padStart(2)}  ${s.layer === 'L2' ? `(${s.device} — L2, invisible to real traceroute)` : `${s.ip}  ${s.device}  ${1 + i} ms ${2 + i} ms ${1 + i} ms`}`)
                    .join('\n') +
                  (tr.failed ? `\n${String(tr.steps.length).padStart(2)}  * * *  Request timed out.` : '')}
              </Pre>
            </div>
          )}
          {!tr && <p className="mt-3 text-xs text-slate-500">Shows every device a probe passes through — and where it stops.</p>}
        </>
      )}

      {tool === 'trace' && (
        <div className="space-y-3">
          {traceUnlocked ? (
            <>
              <p className="text-sm leading-relaxed text-slate-300">
                Tag the <span className="text-violet-200">rogue packet</span> — the flow the incident is about — and follow it with the camera, hop by hop. Watch
                where it stops, loops, or goes somewhere it shouldn&rsquo;t.
              </p>
              <button type="button" onClick={onStartTrace} className="inline-flex items-center gap-2 rounded-md bg-violet-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-violet-200">
                <ScanSearch className="h-4 w-4" /> Start packet trace
              </button>
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-md border border-slate-800 bg-black/30 p-3 text-sm text-slate-400">
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
              Packet trace needs the capture appliance. Visit the <span className="text-slate-200">Packet Analysis Lab</span> and open the analyzer.
            </div>
          )}
        </div>
      )}

      {tool === 'journal' && (
        <ul className="space-y-2">
          {journal.length === 0 && <li className="text-sm text-slate-500">No evidence yet. Inspect devices and run tests — results land here.</li>}
          {[...journal].reverse().map(j => (
            <li key={j.id} className={cn('border-l-2 pl-3 text-xs leading-relaxed', j.ok ? 'border-emerald-500/40' : 'border-slate-500/50')}>
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">{j.tool}</span>
              <div className="font-mono text-slate-300">{j.text}</div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Topology map (Tab)

const MAP_POS: Record<DeviceId, [number, number]> = {
  'PC-01': [50, 40],
  'PC-02': [150, 40],
  'PC-03': [270, 40],
  'PC-04': [370, 40],
  'SWITCH-01': [100, 140],
  'SWITCH-02': [320, 140],
  'ROUTER-01': [210, 230],
  'SERVER-01': [210, 320],
};

export function TopologyMap({
  discovered,
  counters,
  linkStats,
  visited,
  onClose,
}: {
  discovered: Set<DeviceId>;
  counters: Counters;
  linkStats: boolean;
  visited: Set<RoomId>;
  onClose: () => void;
}) {
  const max = Math.max(1, ...LINKS.map(l => counters.link[l.id]));
  return (
    <Sheet title="Network topology" eyebrow={`Tab · ${discovered.size}/8 devices discovered · ${visited.size}/7 rooms`} icon={<Network className="h-4 w-4" />} onClose={onClose} wide>
      <svg viewBox="0 0 420 370" className="mx-auto h-auto w-full max-w-xl">
        {LINKS.map(l => {
          const known = discovered.has(l.a) && discovered.has(l.b);
          if (!known) return null;
          const [x1, y1] = MAP_POS[l.a];
          const [x2, y2] = MAP_POS[l.b];
          const w = linkStats ? 1 + (counters.link[l.id] / max) * 3 : 1.2;
          return (
            <g key={l.id}>
              <motion.line x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgb(255 122 56 / 0.45)" strokeWidth={w} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: EASE_NET }} />
              {linkStats && (
                <text x={(x1 + x2) / 2 + 6} y={(y1 + y2) / 2} className="fill-slate-500 font-mono" style={{ fontSize: 9 }}>
                  {counters.link[l.id]}
                </text>
              )}
            </g>
          );
        })}
        {DEVICE_IDS.map(d => {
          const [x, y] = MAP_POS[d];
          const known = discovered.has(d);
          return (
            <g key={d}>
              <circle cx={x} cy={y} r={known ? 9 : 7} fill="#11100e" stroke={known ? 'rgb(255 122 56 / 0.8)' : 'rgb(85 84 82 / 0.6)'} strokeDasharray={known ? undefined : '2 3'} strokeWidth={1.5} />
              {known && <circle cx={x} cy={y} r={3.5} fill="rgb(255 122 56)" />}
              <text x={x} y={y + 22} textAnchor="middle" className={known ? 'fill-slate-300 font-mono' : 'fill-slate-600 font-mono'} style={{ fontSize: 10 }}>
                {known ? d : '?'}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-3 text-center text-xs text-slate-500">
        Devices appear as you find them. {linkStats ? 'Link widths show traffic volume.' : 'Read MONITOR-01 in the Monitoring Room to overlay link activity.'}
      </p>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Diagnosis

export interface DiagnosisResult {
  device: DeviceId;
  correct: boolean;
  fault?: Fault;
  explanation: string;
}

export function DiagnosePanel({
  onSubmit,
  result,
  remaining,
  onClose,
  onContinue,
}: {
  onSubmit: (d: DeviceId) => void;
  result: DiagnosisResult | null;
  remaining: number;
  onClose: () => void;
  onContinue: () => void;
}) {
  const [sel, setSel] = useState<DeviceId | null>(null);
  return (
    <Sheet title="Who is the rogue?" eyebrow={`Diagnose network · ${remaining} fault${remaining === 1 ? '' : 's'} unresolved`} icon={<ScanSearch className="h-4 w-4" />} onClose={onClose}>
      <AnimatePresence mode="wait">
        {!result ? (
          <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <p className="mb-3 text-sm text-slate-400">Name the device causing the fault. A wrong call costs stability — but you can keep investigating.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {DEVICE_IDS.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSel(d)}
                  className={cn(
                    'group flex flex-col items-start gap-2 rounded-md border px-3 py-3 text-left transition-colors',
                    sel === d ? 'border-emerald-400 bg-emerald-500/10' : 'border-slate-800 bg-slate-950/60 hover:border-slate-600',
                  )}
                  aria-pressed={sel === d}
                >
                  <span className={cn('transition-colors', sel === d ? 'text-emerald-300' : 'text-slate-500 group-hover:text-slate-300')}>{deviceIcon(d)}</span>
                  <span className="font-mono text-xs text-slate-100">{d}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                disabled={!sel}
                onClick={() => sel && onSubmit(sel)}
                className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 disabled:opacity-40"
              >
                Confirm diagnosis
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="res" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <PacketPath
              nodes={['PC', 'SWITCH', 'ROUTER', 'SERVER']}
              broken={result.correct ? null : 2}
              okLabel={remaining === 0 ? 'Network restored' : 'Fault repaired'}
              failLabel="Incorrect diagnosis"
            />
            <div className="mt-3 flex items-center gap-2 text-sm">
              {result.correct ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-rose-400" />}
              <span className="font-medium text-slate-100">{result.correct ? `${result.device}: ${result.fault!.title}` : `${result.device} is not the rogue`}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{result.explanation}</p>
            {result.correct && <p className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-200">{result.fault!.lesson}</p>}
            <div className="mt-4 flex justify-end">
              <button type="button" autoFocus onClick={onContinue} className="rounded-md bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
                {result.correct && remaining === 0 ? 'View report' : 'Keep investigating'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Sheet>
  );
}

export { Cable };
