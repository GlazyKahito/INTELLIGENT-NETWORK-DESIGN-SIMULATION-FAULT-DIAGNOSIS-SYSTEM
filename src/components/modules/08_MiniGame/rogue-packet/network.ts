// Rogue Packet — network model.
// A small but honest simulation: host config, ARP resolution per L2 segment,
// default gateways, longest-prefix routing, TTL, link/port state and loss.
// Faults mutate this state; every clue in the game is derived from it.

import { ipToNumber } from '@/lib/network/addressing';

export type DeviceId = 'PC-01' | 'PC-02' | 'PC-03' | 'PC-04' | 'SWITCH-01' | 'SWITCH-02' | 'ROUTER-01' | 'SERVER-01';
export type HostId = 'PC-01' | 'PC-02' | 'PC-03' | 'PC-04' | 'SERVER-01' | 'SWITCH-01' | 'SWITCH-02';
export type LinkId = 'L-PC1' | 'L-PC2' | 'L-PC3' | 'L-PC4' | 'L-TRUNK' | 'L-UPLINK' | 'L-SRV';
export type RouterIface = 'Gi0/0' | 'Gi0/1';
type Seg = 'lan' | 'srv';

export const DEVICE_IDS: DeviceId[] = ['PC-01', 'PC-02', 'PC-03', 'PC-04', 'SWITCH-01', 'SWITCH-02', 'ROUTER-01', 'SERVER-01'];
export const PCS: DeviceId[] = ['PC-01', 'PC-02', 'PC-03', 'PC-04'];

export interface LinkDef {
  id: LinkId;
  a: DeviceId;
  aPort: string;
  b: DeviceId;
  bPort: string;
  media: string;
}

export const LINKS: LinkDef[] = [
  { id: 'L-PC1', a: 'PC-01', aPort: 'eth0', b: 'SWITCH-01', bPort: 'Fa0/1', media: 'Cat6 UTP' },
  { id: 'L-PC2', a: 'PC-02', aPort: 'eth0', b: 'SWITCH-01', bPort: 'Fa0/2', media: 'Cat6 UTP' },
  { id: 'L-PC3', a: 'PC-03', aPort: 'eth0', b: 'SWITCH-02', bPort: 'Fa0/1', media: 'Cat6 UTP' },
  { id: 'L-PC4', a: 'PC-04', aPort: 'eth0', b: 'SWITCH-02', bPort: 'Fa0/2', media: 'Cat6 UTP' },
  { id: 'L-TRUNK', a: 'SWITCH-01', aPort: 'Gi0/1', b: 'SWITCH-02', bPort: 'Gi0/1', media: 'Cat6 UTP · trunk' },
  { id: 'L-UPLINK', a: 'SWITCH-01', aPort: 'Gi0/2', b: 'ROUTER-01', bPort: 'Gi0/0', media: 'Cat6 UTP · uplink' },
  { id: 'L-SRV', a: 'ROUTER-01', aPort: 'Gi0/1', b: 'SERVER-01', bPort: 'eth0', media: 'OM3 multimode fibre' },
];

export const linkById = (id: LinkId) => LINKS.find(l => l.id === id)!;
export const linksOf = (d: DeviceId) => LINKS.filter(l => l.a === d || l.b === d);
export const peerOf = (l: LinkDef, d: DeviceId) => (l.a === d ? l.b : l.a);
export const portOn = (l: LinkDef, d: DeviceId) => (l.a === d ? l.aPort : l.bPort);

export interface HostCfg {
  ip: string;
  mask: number;
  gw: string;
  mac: string;
  mode: 'DHCP' | 'Static';
}

export interface Route {
  code: 'C' | 'S';
  prefix: string;
  len: number;
  via?: string;
  iface: RouterIface;
}

export interface NetState {
  hosts: Record<HostId, HostCfg>;
  /** RJ45 / fibre physically seated. */
  cable: Record<LinkId, boolean>;
  /** `${device}:${port}` → administratively enabled. Missing = enabled. */
  portAdmin: Record<string, boolean>;
  duplexMismatch: LinkId | null;
  router: {
    ifaces: Record<RouterIface, { ip: string; mask: number; up: boolean; mac: string }>;
    statics: Route[];
  };
  serverUp: boolean;
  // Transient event modifiers
  switchDown: Partial<Record<DeviceId, boolean>>;
  flappingLink: LinkId | null;
  storm: boolean;
}

export const EXPECTED_IP: Record<HostId, string> = {
  'PC-01': '192.168.1.11',
  'PC-02': '192.168.1.12',
  'PC-03': '192.168.1.13',
  'PC-04': '192.168.1.14',
  'SERVER-01': '192.168.2.10',
  'SWITCH-01': '192.168.1.2',
  'SWITCH-02': '192.168.1.3',
};

export function baseState(): NetState {
  const host = (ip: string, mac: string, gw = '192.168.1.1', mode: HostCfg['mode'] = 'DHCP'): HostCfg => ({ ip, mask: 24, gw, mac, mode });
  return {
    hosts: {
      'PC-01': host('192.168.1.11', '4A:91:3F:21:0B:11'),
      'PC-02': host('192.168.1.12', '4A:91:3F:21:0B:12'),
      'PC-03': host('192.168.1.13', '4A:91:3F:21:0B:13'),
      'PC-04': host('192.168.1.14', '4A:91:3F:21:0B:14'),
      'SERVER-01': host('192.168.2.10', '00:1B:44:11:3A:B7', '192.168.2.1', 'Static'),
      'SWITCH-01': host('192.168.1.2', '00:25:B5:0A:01:02', '192.168.1.1', 'Static'),
      'SWITCH-02': host('192.168.1.3', '00:25:B5:0A:02:03', '192.168.1.1', 'Static'),
    },
    cable: { 'L-PC1': true, 'L-PC2': true, 'L-PC3': true, 'L-PC4': true, 'L-TRUNK': true, 'L-UPLINK': true, 'L-SRV': true },
    portAdmin: {},
    duplexMismatch: null,
    router: {
      ifaces: {
        'Gi0/0': { ip: '192.168.1.1', mask: 24, up: true, mac: 'C4:0A:CB:10:00:01' },
        'Gi0/1': { ip: '192.168.2.1', mask: 24, up: true, mac: 'C4:0A:CB:10:00:02' },
      },
      statics: [],
    },
    serverUp: true,
    switchDown: {},
    flappingLink: null,
    storm: false,
  };
}

export const cloneState = (s: NetState): NetState => JSON.parse(JSON.stringify(s));

// ---------------------------------------------------------------------------
// Primitive checks

const maskOf = (len: number) => (len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0);
export const sameNet = (a: string, b: string, len: number) =>
  ((ipToNumber(a) & maskOf(len)) >>> 0) === ((ipToNumber(b) & maskOf(len)) >>> 0);
export const dottedMask = (len: number) => {
  const m = maskOf(len);
  return [24, 16, 8, 0].map(sh => (m >>> sh) & 255).join('.');
};
export const netOf = (ip: string, len: number) => {
  const n = (ipToNumber(ip) & maskOf(len)) >>> 0;
  return [24, 16, 8, 0].map(sh => (n >>> sh) & 255).join('.');
};

export const isSwitch = (d: DeviceId) => d === 'SWITCH-01' || d === 'SWITCH-02';
export const isHost = (d: DeviceId): d is HostId => d !== 'ROUTER-01';

export function portEnabled(s: NetState, d: DeviceId, port: string) {
  return s.portAdmin[`${d}:${port}`] !== false;
}

function endUp(s: NetState, l: LinkDef, d: DeviceId) {
  const port = portOn(l, d);
  if (isSwitch(d) && (s.switchDown[d] || !portEnabled(s, d, port))) return false;
  if (d === 'ROUTER-01' && !s.router.ifaces[port as RouterIface].up) return false;
  return true;
}

export function linkUp(s: NetState, id: LinkId) {
  const l = linkById(id);
  return s.cable[id] && s.flappingLink !== id && endUp(s, l, l.a) && endUp(s, l, l.b);
}

/** Cisco-style "line / protocol" status as seen from device d. */
export function portStatus(s: NetState, d: DeviceId, l: LinkDef): 'connected' | 'notconnect' | 'disabled' | 'err-down' {
  if (isSwitch(d) && !portEnabled(s, d, portOn(l, d))) return 'disabled';
  if (d === 'ROUTER-01' && !s.router.ifaces[portOn(l, d) as RouterIface].up) return 'disabled';
  if (isSwitch(d) && s.switchDown[d]) return 'err-down';
  return linkUp(s, l.id) ? 'connected' : 'notconnect';
}

// ---------------------------------------------------------------------------
// Forwarding

export interface Leg {
  from: DeviceId;
  to: DeviceId;
  link: LinkId;
}

export type Outcome = 'delivered' | 'nolink' | 'nogw' | 'noarp' | 'noroute' | 'ttl' | 'lost' | 'discard';

export interface Trace {
  legs: Leg[];
  outcome: Outcome;
  /** Where the packet stopped: the leg index and how far along it (0 = at `from`, 1 = at `to`). -1 = at source. */
  stopLeg: number;
  stopFrac: number;
  /** Device that generated an ICMP error, or the device that received the packet. */
  at: DeviceId;
  reason: string;
}

const segOfDevice = (d: DeviceId): Seg => (d === 'SERVER-01' ? 'srv' : 'lan');

function ipsOf(s: NetState, d: DeviceId): string[] {
  if (d === 'ROUTER-01') return (['Gi0/0', 'Gi0/1'] as RouterIface[]).filter(i => s.router.ifaces[i].up).map(i => s.router.ifaces[i].ip);
  if (isSwitch(d) && s.switchDown[d]) return [];
  if (d === 'SERVER-01' && !s.serverUp) return [];
  return [s.hosts[d as HostId].ip];
}

export function ownsIp(s: NetState, d: DeviceId, ip: string) {
  return ipsOf(s, d).includes(ip);
}

/** Devices on a segment that would answer an ARP request for `ip`. */
function arpOwners(s: NetState, seg: Seg, ip: string): DeviceId[] {
  const out: DeviceId[] = [];
  for (const d of DEVICE_IDS) {
    if (d === 'ROUTER-01') {
      const iface: RouterIface = seg === 'lan' ? 'Gi0/0' : 'Gi0/1';
      const r = s.router.ifaces[iface];
      if (r.up && r.ip === ip) out.push(d);
      continue;
    }
    if (segOfDevice(d) !== seg) continue;
    if (ownsIp(s, d, ip)) out.push(d);
  }
  return out;
}

const ADJ: Record<DeviceId, DeviceId[]> = Object.fromEntries(DEVICE_IDS.map(d => [d, linksOf(d).map(l => peerOf(l, d))])) as Record<
  DeviceId,
  DeviceId[]
>;

/** Physical path in the (tree) topology. */
export function physicalPath(a: DeviceId, b: DeviceId): Leg[] {
  const prev = new Map<DeviceId, DeviceId>();
  const q: DeviceId[] = [a];
  const seen = new Set([a]);
  while (q.length) {
    const cur = q.shift()!;
    if (cur === b) break;
    for (const n of ADJ[cur]) if (!seen.has(n)) (seen.add(n), prev.set(n, cur), q.push(n));
  }
  const nodes: DeviceId[] = [b];
  while (nodes[0] !== a) {
    const p = prev.get(nodes[0]);
    if (!p) return [];
    nodes.unshift(p);
  }
  const legs: Leg[] = [];
  for (let i = 0; i < nodes.length - 1; i++) {
    const link = LINKS.find(l => (l.a === nodes[i] && l.b === nodes[i + 1]) || (l.b === nodes[i] && l.a === nodes[i + 1]))!;
    legs.push({ from: nodes[i], to: nodes[i + 1], link: link.id });
  }
  return legs;
}

function neighbourOnSeg(d: DeviceId, seg: Seg): DeviceId {
  if (d === 'ROUTER-01') return seg === 'lan' ? 'SWITCH-01' : 'SERVER-01';
  return ADJ[d][0];
}

const deviceIp = (s: NetState, d: DeviceId) => (d === 'ROUTER-01' ? s.router.ifaces['Gi0/0'].ip : s.hosts[d as HostId].ip);

type Hop = { ip: string; seg: Seg } | { fail: Outcome; reason: string };

function nextHop(s: NetState, cur: DeviceId, dst: string): Hop {
  if (cur === 'ROUTER-01') {
    const routes: Route[] = [];
    (['Gi0/0', 'Gi0/1'] as RouterIface[]).forEach(i => {
      const r = s.router.ifaces[i];
      if (r.up) routes.push({ code: 'C', prefix: netOf(r.ip, r.mask), len: r.mask, iface: i });
    });
    s.router.statics.forEach(r => s.router.ifaces[r.iface].up && routes.push(r));
    const match = routes.filter(r => sameNet(dst, r.prefix, r.len)).sort((a, b) => b.len - a.len)[0];
    if (!match) return { fail: 'noroute', reason: `ROUTER-01 has no route to ${dst}` };
    return { ip: match.via ?? dst, seg: match.iface === 'Gi0/0' ? 'lan' : 'srv' };
  }
  const cfg = s.hosts[cur as HostId];
  const seg = segOfDevice(cur);
  if (sameNet(cfg.ip, dst, cfg.mask)) return { ip: dst, seg };
  if (!sameNet(cfg.ip, cfg.gw, cfg.mask))
    return { fail: 'nogw', reason: `${cur}'s gateway ${cfg.gw} is outside its own subnet ${netOf(cfg.ip, cfg.mask)}/${cfg.mask}` };
  return { ip: cfg.gw, seg };
}

const FORWARDERS: DeviceId[] = ['ROUTER-01', 'SWITCH-01'];

export function trace(s: NetState, src: DeviceId, dst: string, rnd: () => number = Math.random): Trace {
  const legs: Leg[] = [];
  const stop = (outcome: Outcome, at: DeviceId, reason: string, leg = legs.length - 1, frac = 1): Trace => ({
    legs,
    outcome,
    stopLeg: leg,
    stopFrac: frac,
    at,
    reason,
  });
  let cur = src;
  let ttl = 9;

  for (let guard = 0; guard < 20; guard++) {
    if (ownsIp(s, cur, dst)) return stop('delivered', cur, `Delivered to ${cur}`);
    if (cur !== src) {
      if (!FORWARDERS.includes(cur)) return stop('discard', cur, `${cur} is not a router and discarded a packet not addressed to it`);
      ttl--;
      if (ttl <= 0) return stop('ttl', cur, `TTL expired at ${cur} — the packet was going round in a loop`);
    }
    // A host with no carrier cannot transmit at all.
    if (isHost(cur) && !isSwitch(cur)) {
      const own = linksOf(cur)[0];
      if (!linkUp(s, own.id)) return stop('nolink', cur, `${cur} has no link on eth0 (no carrier)`, -1, 0);
    }
    const hop = nextHop(s, cur, dst);
    if ('fail' in hop) return stop(hop.fail, cur, hop.reason);

    const owners = arpOwners(s, hop.seg, hop.ip);
    const target = owners.length ? owners[Math.floor(rnd() * owners.length)] : null;
    const path = physicalPath(cur, target ?? neighbourOnSeg(cur, hop.seg));

    for (let i = 0; i < path.length; i++) {
      const leg = path[i];
      if (!linkUp(s, leg.link)) {
        legs.push(leg);
        const atStart = i === 0;
        return stop('lost', leg.from, `Frame could not leave ${leg.from} ${portOn(linkById(leg.link), leg.from)}: link is down`, legs.length - 1, atStart ? 0.08 : 0);
      }
      legs.push(leg);
      if (s.duplexMismatch === leg.link && rnd() < 0.4)
        return stop('lost', leg.to, `Frame corrupted on ${leg.link} (CRC error)`, legs.length - 1, 0.55);
      if (s.storm && (leg.link === 'L-TRUNK' || leg.link === 'L-UPLINK') && rnd() < 0.22)
        return stop('lost', leg.from, 'Dropped: output queue full (packet storm)', legs.length - 1, 0.35);
    }

    if (!target) {
      const who = hop.ip === dst ? dst : `next hop ${hop.ip}`;
      return stop('noarp', cur, `${cur} sent ARP "who has ${hop.ip}?" — nobody answered (${who} unreachable)`);
    }
    cur = target;
  }
  return stop('ttl', cur, 'TTL expired');
}

// ---------------------------------------------------------------------------
// Diagnostic tools

export interface PingLine {
  text: string;
  ok: boolean;
}

export function ipOwnerLabel(s: NetState, ip: string): string {
  for (const d of DEVICE_IDS) if (ipsOf(s, d).includes(ip)) return d;
  return '';
}

export function ping(s: NetState, src: DeviceId, dst: string, rnd: () => number = Math.random) {
  const srcIp = deviceIp(s, src);
  const lines: PingLine[] = [];
  let ok = 0;
  let packets = 0;
  for (let i = 0; i < 4; i++) {
    const fwd = trace(s, src, dst, rnd);
    packets += Math.max(1, fwd.legs.length);
    if (fwd.outcome === 'nolink') {
      lines.push({ text: 'PING: transmit failed. General failure.', ok: false });
      continue;
    }
    if (fwd.outcome === 'nogw' || (fwd.outcome === 'noarp' && fwd.at === src)) {
      lines.push({ text: `Reply from ${srcIp}: Destination host unreachable.`, ok: false });
      continue;
    }
    if (fwd.outcome === 'noroute') {
      lines.push({ text: `Reply from ${deviceIp(s, fwd.at)}: Destination net unreachable.`, ok: false });
      continue;
    }
    if (fwd.outcome === 'ttl') {
      lines.push({ text: `Reply from ${deviceIp(s, fwd.at)}: TTL expired in transit.`, ok: false });
      continue;
    }
    if (fwd.outcome !== 'delivered') {
      lines.push({ text: 'Request timed out.', ok: false });
      continue;
    }
    const back = trace(s, fwd.at, srcIp, rnd);
    packets += back.legs.length;
    if (back.outcome !== 'delivered') {
      lines.push({ text: 'Request timed out.', ok: false });
      continue;
    }
    ok++;
    const hopsL3 = fwd.legs.filter(l => l.from === 'ROUTER-01').length;
    lines.push({ text: `Reply from ${dst}: bytes=32 time=${1 + Math.floor(rnd() * 3) + hopsL3}ms TTL=${64 - hopsL3}`, ok: true });
  }
  const loss = Math.round(((4 - ok) / 4) * 100);
  return { srcIp, lines, ok, loss, packets };
}

export interface TraceStep {
  device: DeviceId;
  ip?: string;
  layer: 'L2' | 'L3' | 'host';
}

export function traceroute(s: NetState, src: DeviceId, dst: string, rnd: () => number = Math.random) {
  const t = trace(s, src, dst, rnd);
  const steps: TraceStep[] = [{ device: src, ip: deviceIp(s, src), layer: 'host' }];
  const upto = t.stopFrac >= 1 ? t.stopLeg : t.stopLeg - 1;
  for (let i = 0; i <= upto && i < t.legs.length; i++) {
    const d = t.legs[i].to;
    steps.push({ device: d, ip: isSwitch(d) ? undefined : deviceIp(s, d), layer: isSwitch(d) ? 'L2' : d === 'ROUTER-01' ? 'L3' : 'host' });
  }
  const failed = t.outcome !== 'delivered';
  return { trace: t, steps, failed, target: dst, targetLabel: ipOwnerLabel(s, dst) || dst };
}

// ---------------------------------------------------------------------------
// Faults

export type FaultKind =
  | 'cable'
  | 'port-disabled'
  | 'wrong-ip'
  | 'wrong-mask'
  | 'server-subnet'
  | 'duplicate-ip'
  | 'router-iface'
  | 'wrong-route'
  | 'routing-loop'
  | 'packet-loss'
  | 'server-offline';

export interface Fault {
  id: string;
  kind: FaultKind;
  rogue: DeviceId;
  apply: (s: NetState) => void;
  rogueFlow: { src: DeviceId; dst: string };
  ticket: string;
  fix: string;
  lesson: string;
  victims: DeviceId[];
  monitorHint: string;
  capture: string[];
  title: string;
}

const pick = <T,>(xs: T[], rnd: () => number) => xs[Math.floor(rnd() * xs.length)];
const PC_PORT: Record<string, { sw: DeviceId; port: string; link: LinkId }> = {
  'PC-01': { sw: 'SWITCH-01', port: 'Fa0/1', link: 'L-PC1' },
  'PC-02': { sw: 'SWITCH-01', port: 'Fa0/2', link: 'L-PC2' },
  'PC-03': { sw: 'SWITCH-02', port: 'Fa0/1', link: 'L-PC3' },
  'PC-04': { sw: 'SWITCH-02', port: 'Fa0/2', link: 'L-PC4' },
};
const SRV = '192.168.2.10';
let faultSeq = 0;

export function createFault(kind: FaultKind, rnd: () => number, avoid: DeviceId[] = []): Fault {
  const pcs = PCS.filter(p => !avoid.includes(p));
  const pc = pick(pcs.length ? pcs : PCS, rnd);
  const n = pc.slice(-1);
  const id = `${kind}-${++faultSeq}`;
  switch (kind) {
    case 'cable': {
      if (!avoid.includes('SWITCH-02') && rnd() < 0.35) {
        return {
          id, kind, rogue: 'SWITCH-02', title: 'Unseated trunk cable',
          apply: s => void (s.cable['L-TRUNK'] = false),
          rogueFlow: { src: 'PC-03', dst: SRV },
          ticket: 'Two workstations in the Computer Lab dropped off the network at exactly the same moment. The other two are fine.',
          fix: 'Re-seated the trunk cable on SWITCH-02 Gi0/1. Link light green, trunk forwarding again.',
          lesson: 'When several hosts fail together, look for what they share — here, one uplink cable.',
          victims: ['PC-03', 'PC-04'],
          monitorHint: 'Hosts seen on 192.168.1.0/24 dropped from 4 to 2.',
          capture: ['(no frames from 192.168.1.13 or 192.168.1.14 in the last 60 s)'],
        };
      }
      return {
        id, kind, rogue: pc, title: 'Disconnected cable',
        apply: s => void (s.cable[PC_PORT[pc].link] = false),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'Helpdesk #4471 — "One machine in the Computer Lab can\'t open anything on the file server. Nobody else has complained."',
        fix: `Re-seated ${pc}'s patch lead. The NIC reports 1 Gbps full duplex again.`,
        lesson: 'No carrier means Layer 1. Check cables and link lights before touching IP settings.',
        victims: [],
        monitorHint: 'Hosts seen on 192.168.1.0/24 dropped from 4 to 3.',
        capture: [`(no frames from 192.168.1.1${n} in the last 60 s)`],
      };
    }
    case 'port-disabled': {
      const { sw, port } = PC_PORT[pc];
      return {
        id, kind, rogue: sw, title: 'Switch port shut down',
        apply: s => void (s.portAdmin[`${sw}:${port}`] = false),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'Helpdesk #4502 — "My PC says the network cable is unplugged, but I haven\'t touched anything." (Computer Lab)',
        fix: `${sw}(config-if)# interface ${port} → no shutdown. Port is forwarding again.`,
        lesson: 'A shut-down switch port looks exactly like an unplugged cable from the PC. Only the switch knows the difference.',
        victims: [pc],
        monitorHint: 'Hosts seen on 192.168.1.0/24 dropped from 4 to 3.',
        capture: [`(no frames from 192.168.1.1${n} in the last 60 s)`],
      };
    }
    case 'wrong-ip': {
      const bad = `192.168.10.1${n}`;
      return {
        id, kind, rogue: pc, title: 'Mistyped IP address',
        apply: s => void Object.assign(s.hosts[pc as HostId], { ip: bad, mode: 'Static' }),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'Helpdesk #4519 — "A lab workstation can\'t reach anything at all, not even the gateway. It worked yesterday."',
        fix: `Set ${pc} back to 192.168.1.1${n}/24 (it had been typed as ${bad}).`,
        lesson: 'A host outside its gateway\'s subnet cannot even ARP for the gateway — nothing leaves the LAN.',
        victims: [],
        monitorHint: `Unknown source address ${bad} seen on the LAN.`,
        capture: [`ARP  Who has 192.168.1.1? Tell ${bad}   (no reply — gateway not in sender's subnet)`],
      };
    }
    case 'wrong-mask':
      return {
        id, kind, rogue: pc, title: 'Wrong subnet mask',
        apply: s => void Object.assign(s.hosts[pc as HostId], { mask: 16, mode: 'Static' }),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'Helpdesk #4533 — "One lab PC can ping the other lab PCs fine, but the file server just times out."',
        fix: `Corrected ${pc}'s mask from 255.255.0.0 to 255.255.255.0.`,
        lesson: 'A /16 mask makes the host think 192.168.2.10 is local, so it ARPs for it instead of using the gateway.',
        victims: [],
        monitorHint: 'ARP requests for 192.168.2.10 are being broadcast on the LAN. Something thinks the server is local.',
        capture: [`ARP  Who has 192.168.2.10? Tell 192.168.1.1${n}`, `ARP  Who has 192.168.2.10? Tell 192.168.1.1${n}`, '(no reply)'],
      };
    case 'server-subnet':
      return {
        id, kind, rogue: 'SERVER-01', title: 'Server on the wrong subnet',
        apply: s => void Object.assign(s.hosts['SERVER-01'], { ip: '192.168.3.10' }),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'After last night\'s maintenance, every lab machine lost the file server at 192.168.2.10.',
        fix: 'Re-addressed SERVER-01 from 192.168.3.10 to 192.168.2.10/24.',
        lesson: 'The router can only deliver to hosts that actually live in the connected subnet.',
        victims: [...PCS],
        monitorHint: 'ROUTER-01 ARP for 192.168.2.10 on Gi0/1 is not being answered.',
        capture: ['(capture point is on the LAN side — server-segment frames not visible)'],
      };
    case 'duplicate-ip': {
      const victim = pick((['PC-01', 'PC-02'] as DeviceId[]).filter(p => !avoid.includes(p)).concat(['PC-01']), rnd);
      const rogue = pick((['PC-03', 'PC-04'] as DeviceId[]).filter(p => !avoid.includes(p)).concat(['PC-03']), rnd);
      const ip = EXPECTED_IP[victim as HostId];
      return {
        id, kind, rogue, title: 'Duplicate IP address',
        apply: s => void Object.assign(s.hosts[rogue as HostId], { ip, mode: 'Static' }),
        rogueFlow: { src: 'SERVER-01', dst: ip },
        ticket: `Helpdesk #4550 — "${victim} keeps losing its session to the server every few seconds, then it comes back."`,
        fix: `Returned ${rogue} to DHCP; it took ${EXPECTED_IP[rogue as HostId]} again. ${ip} now belongs only to ${victim}.`,
        lesson: 'Two hosts with one IP fight over ARP: replies go to whichever MAC answered last.',
        victims: [victim],
        monitorHint: `Duplicate address alert: ${ip} is being claimed by two different MAC addresses.`,
        capture: [
          `ARP  ${ip} is at 4A:91:3F:21:0B:1${victim.slice(-1)}`,
          `ARP  ${ip} is at 4A:91:3F:21:0B:1${rogue.slice(-1)}   ← different MAC`,
          `ARP  ${ip} is at 4A:91:3F:21:0B:1${victim.slice(-1)}`,
        ],
      };
    }
    case 'router-iface':
      return {
        id, kind, rogue: 'ROUTER-01', title: 'Router interface shut down',
        apply: s => void (s.router.ifaces['Gi0/1'].up = false),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'The whole lab lost the server segment. Local file sharing between lab PCs still works.',
        fix: 'ROUTER-01(config)# interface Gi0/1 → no shutdown. Connected route 192.168.2.0/24 is back.',
        lesson: 'When an interface goes down, its connected route disappears — the router answers "net unreachable".',
        victims: [...PCS, 'SERVER-01'],
        monitorHint: 'Server segment unreachable from the LAN. The gateway 192.168.1.1 still answers.',
        capture: ['ICMP 192.168.1.1 → 192.168.1.1x  Destination unreachable (Net unreachable)'],
      };
    case 'wrong-route':
      return {
        id, kind, rogue: 'ROUTER-01', title: 'Incorrect static route',
        apply: s => void s.router.statics.push({ code: 'S', prefix: '192.168.2.0', len: 25, via: '192.168.1.254', iface: 'Gi0/0' }),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'The file server has been unreachable since the 02:00 routing change window.',
        fix: 'Removed "ip route 192.168.2.0 255.255.255.128 192.168.1.254" from ROUTER-01.',
        lesson: 'A more specific (/25) route beats the connected /24 — even when it points somewhere that doesn\'t exist.',
        victims: [...PCS],
        monitorHint: 'ROUTER-01 is ARPing for 192.168.1.254 on the LAN. Nobody answers.',
        capture: ['ARP  Who has 192.168.1.254? Tell 192.168.1.1', 'ARP  Who has 192.168.1.254? Tell 192.168.1.1', '(no reply)'],
      };
    case 'routing-loop':
      return {
        id, kind, rogue: 'ROUTER-01', title: 'Routing loop',
        apply: s => void s.router.statics.push({ code: 'S', prefix: '192.168.2.0', len: 25, via: '192.168.1.2', iface: 'Gi0/0' }),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'Monitoring is flooded with "TTL expired" messages and the file server is unreachable.',
        fix: 'Removed the /25 route pointing at SWITCH-01. The router uses its connected route to Gi0/1 again.',
        lesson: 'Two devices pointing at each other bounce a packet back and forth until its TTL runs out.',
        victims: [...PCS, 'SWITCH-01'],
        monitorHint: 'TTL-expired storm between 192.168.1.1 and 192.168.1.2.',
        capture: ['ICMP 192.168.1.2 → 192.168.1.1x  Time-to-live exceeded', 'ICMP 192.168.1.1 → 192.168.1.1x  Time-to-live exceeded'],
      };
    case 'packet-loss':
      return {
        id, kind, rogue: 'SWITCH-01', title: 'Duplex mismatch on uplink',
        apply: s => void (s.duplexMismatch = 'L-UPLINK'),
        rogueFlow: { src: 'PC-03', dst: SRV },
        ticket: 'Everything is slow and flaky: web pages half-load and pings drop at random. It\'s every machine, not just one.',
        fix: 'Set SWITCH-01 Gi0/2 back to auto-negotiate (it was forced to 100 Mb/s half duplex). CRC errors stopped.',
        lesson: 'Random loss for everyone usually means one shared link — find the port with climbing error counters.',
        victims: [...PCS, 'ROUTER-01'],
        monitorHint: 'CRC error counters are climbing somewhere on the LAN core.',
        capture: ['TCP  [TCP Retransmission] 192.168.1.1x → 192.168.2.10', 'TCP  [TCP Dup ACK] 192.168.2.10 → 192.168.1.1x'],
      };
    case 'server-offline':
      return {
        id, kind, rogue: 'SERVER-01', title: 'Server offline',
        apply: s => void (s.serverUp = false),
        rogueFlow: { src: pc, dst: SRV },
        ticket: 'The file server stopped answering around 09:40. Nothing was changed on the network.',
        fix: 'Rebooted SERVER-01 from its console after a kernel panic. Services came back up.',
        lesson: 'If the router\'s interface is up but ARP for the server stays incomplete, the server itself is not answering.',
        victims: [...PCS],
        monitorHint: 'ROUTER-01 ARP for 192.168.2.10 on Gi0/1 is not being answered.',
        capture: ['(capture point is on the LAN side — server-segment frames not visible)'],
      };
  }
}

// ---------------------------------------------------------------------------
// Levels

export interface Level {
  id: number;
  title: string;
  concept: string;
  pool: FaultKind[];
  faults: number;
  events: EventKind[];
  learned: string[];
}

export type EventKind = 'storm' | 'blackout' | 'loop' | 'switch-fail' | 'server-offline' | 'link-lost';

export const LEVELS: Level[] = [
  {
    id: 1,
    title: 'Cable Chaos',
    concept: 'Layer 1. Links, carrier and cables — the first thing to check and the easiest to miss.',
    pool: ['cable'],
    faults: 1,
    events: [],
    learned: ['Physical layer (L1)', 'Link lights & carrier', 'Isolating a single host'],
  },
  {
    id: 2,
    title: 'IP Crisis',
    concept: 'Layer 3 addressing. Subnets, masks, gateways — and what ARP does when they are wrong.',
    pool: ['wrong-ip', 'wrong-mask', 'server-subnet', 'duplicate-ip'],
    faults: 1,
    events: ['storm'],
    learned: ['IP addressing', 'Subnet masks', 'Default gateway', 'ARP'],
  },
  {
    id: 3,
    title: 'Switch Failure',
    concept: 'Layer 2. Switch ports, port state and error counters on shared links.',
    pool: ['port-disabled', 'packet-loss'],
    faults: 1,
    events: ['storm', 'link-lost'],
    learned: ['Switch ports', 'Packet loss', 'CRC errors & duplex', 'Shared links'],
  },
  {
    id: 4,
    title: 'Routing Nightmare',
    concept: 'Routing tables. Connected routes, static routes, longest-prefix match and TTL.',
    pool: ['router-iface', 'wrong-route', 'routing-loop'],
    faults: 1,
    events: ['storm', 'switch-fail'],
    learned: ['Routing tables', 'Longest prefix match', 'TTL & routing loops'],
  },
  {
    id: 5,
    title: 'Network Blackout',
    concept: 'Two faults at once, under pressure. Fix one and the other becomes easier to see.',
    pool: ['cable', 'port-disabled', 'wrong-mask', 'duplicate-ip', 'packet-loss', 'server-offline', 'router-iface', 'wrong-ip'],
    faults: 2,
    events: ['blackout', 'storm', 'switch-fail', 'link-lost', 'server-offline'],
    learned: ['Multiple-fault isolation', 'Evidence over assumptions', 'Fault isolation'],
  },
];

export function rollFaults(level: Level, rnd: () => number = Math.random): Fault[] {
  const faults: Fault[] = [];
  const kinds = [...level.pool];
  while (faults.length < level.faults && kinds.length) {
    const kind = kinds.splice(Math.floor(rnd() * kinds.length), 1)[0];
    const f = createFault(kind, rnd, faults.flatMap(x => [x.rogue, ...x.victims.filter(v => v.startsWith('PC'))]));
    if (faults.some(x => x.rogue === f.rogue)) continue;
    faults.push(f);
  }
  return faults;
}

// ---------------------------------------------------------------------------
// Diagnosis feedback

export function explainWrong(s: NetState, device: DeviceId, open: Fault[]): string {
  const victimOf = open.find(f => f.victims.includes(device) || f.rogueFlow.src === device);
  if (device.startsWith('PC')) {
    const c = s.hosts[device as HostId];
    const cfg = `${c.ip}/${c.mask}, gateway ${c.gw}`;
    if (victimOf)
      return `${device}'s own settings check out (${cfg}) — it is a victim, not the cause. Its traffic dies further along the path. Follow it.`;
    return `${device} is configured correctly (${cfg}) and reaches the server normally.`;
  }
  if (isSwitch(device)) {
    const quiet = linksOf(device).filter(l => portStatus(s, device, l) === 'notconnect').map(l => portOn(l, device));
    const note = quiet.length ? ` A port showing "notconnect" (${quiet.join(', ')}) means no signal from the far end — the switch itself isn't blocking it.` : '';
    return `${device} has no disabled ports and clean error counters.${note}`;
  }
  if (device === 'ROUTER-01')
    return 'ROUTER-01\'s interfaces are up and its routing table only holds the two connected /24 routes. When traffic reaches it, it forwards correctly.';
  return 'SERVER-01 is up, addressed correctly (192.168.2.10/24) and answers whenever traffic actually reaches it.';
}
