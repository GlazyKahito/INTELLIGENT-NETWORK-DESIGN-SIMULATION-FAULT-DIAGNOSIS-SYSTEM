// Forwarding-plane engine for the "Forwarding Plane" mini game.
// Models a router's per-packet decision: inbound ACL → TTL check → longest-prefix match.

import { ipToNumber } from './addressing';

export type Egress = 'gi0' | 'gi1' | 'se0' | 'drop';
export type Proto = 'tcp' | 'udp' | 'icmp';

export const EGRESS_ORDER: Egress[] = ['gi0', 'gi1', 'se0', 'drop'];

export const EGRESS_NAME: Record<Egress, string> = {
  gi0: 'Gi0/0',
  gi1: 'Gi0/1',
  se0: 'Se0/0/0',
  drop: 'Drop',
};

export interface Route {
  code: 'C' | 'S' | 'S*' | 'O';
  prefix: string;
  len: number;
  /** Next hop, or undefined for directly connected. */
  via?: string;
  /** 'drop' models a Null0 (blackhole) route. */
  egress: Egress;
}

export interface AclRule {
  action: 'permit' | 'deny';
  proto: 'ip' | Proto;
  src: string;
  srcLen: number;
  port?: number;
  text: string;
}

export interface Packet {
  id: number;
  src: string;
  dst: string;
  proto: Proto;
  port?: number;
  ttl: number;
}

export type VerdictKind = 'forward' | 'default' | 'acl' | 'ttl' | 'no-route' | 'null-route';

export interface Verdict {
  egress: Egress;
  kind: VerdictKind;
  routeIndex: number | null;
  aclIndex: number | null;
  reason: string;
}

export interface Level {
  id: string;
  title: string;
  concept: string;
  newRule: string;
  routes: Route[];
  acl: AclRule[];
  ports: Record<Egress, string>;
  packetCount: number;
  spawnEvery: number; // seconds between arrivals
  deadline: number; // seconds a packet may sit at the head of the queue
  queueCap: number;
  templates: PacketTemplate[];
}

type PacketTemplate = { weight: number; make: () => Omit<Packet, 'id'> };

export const SERVICE: Record<string, string> = {
  'tcp/22': 'SSH',
  'tcp/23': 'Telnet',
  'tcp/80': 'HTTP',
  'tcp/443': 'HTTPS',
  'udp/53': 'DNS',
  'udp/123': 'NTP',
  'udp/161': 'SNMP',
  'udp/443': 'QUIC',
};

export function serviceName(p: Pick<Packet, 'proto' | 'port'>): string {
  if (p.proto === 'icmp') return 'Echo';
  return SERVICE[`${p.proto}/${p.port}`] ?? `${p.proto.toUpperCase()}/${p.port}`;
}

export function maskOf(len: number): number {
  return len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0;
}

export function inPrefix(ip: string, prefix: string, len: number): boolean {
  const m = maskOf(len);
  return ((ipToNumber(ip) & m) >>> 0) === ((ipToNumber(prefix) & m) >>> 0);
}

export function toBits(ip: string): string {
  return ipToNumber(ip).toString(2).padStart(32, '0');
}

function ifLabel(r: Route): string {
  return r.egress === 'drop' ? 'Null0' : EGRESS_NAME[r.egress];
}

export function decide(packet: Packet, level: Pick<Level, 'routes' | 'acl'>): Verdict {
  // 1. Inbound ACL — first matching line wins.
  for (let i = 0; i < level.acl.length; i++) {
    const rule = level.acl[i];
    const protoOk = rule.proto === 'ip' || rule.proto === packet.proto;
    const portOk = rule.port === undefined || rule.port === packet.port;
    if (protoOk && portOk && inPrefix(packet.src, rule.src, rule.srcLen)) {
      if (rule.action === 'deny') {
        return {
          egress: 'drop',
          kind: 'acl',
          routeIndex: null,
          aclIndex: i,
          reason: `ACL 110 line ${(i + 1) * 10} (${rule.text}) denies it before any route lookup.`,
        };
      }
      break;
    }
  }

  // 2. TTL — the router decrements before forwarding; reaching 0 means drop.
  if (packet.ttl <= 1) {
    return {
      egress: 'drop',
      kind: 'ttl',
      routeIndex: null,
      aclIndex: null,
      reason: 'TTL is 1. Decrementing it reaches 0, so R1 drops it and sends ICMP Time Exceeded to the source.',
    };
  }

  // 3. Longest-prefix match.
  let best = -1;
  const matches: number[] = [];
  level.routes.forEach((r, i) => {
    if (inPrefix(packet.dst, r.prefix, r.len)) {
      matches.push(i);
      if (best === -1 || r.len > level.routes[best].len) best = i;
    }
  });

  if (best === -1) {
    return {
      egress: 'drop',
      kind: 'no-route',
      routeIndex: null,
      aclIndex: null,
      reason: `${packet.dst} matches no route and there is no default route, so it is dropped (ICMP Destination Unreachable).`,
    };
  }

  const route = level.routes[best];
  const others = matches
    .filter(i => i !== best)
    .map(i => (level.routes[i].len === 0 ? 'the default route' : `/${level.routes[i].len}`));
  const beat = others.length ? `, beating ${others.join(' and ')}` : '';

  if (route.egress === 'drop') {
    return {
      egress: 'drop',
      kind: 'null-route',
      routeIndex: best,
      aclIndex: null,
      reason: `${packet.dst} matches ${route.prefix}/${route.len}${beat}. That route points to Null0 — a blackhole — so it is discarded.`,
    };
  }

  if (route.len === 0) {
    return {
      egress: route.egress,
      kind: 'default',
      routeIndex: best,
      aclIndex: null,
      reason: `No specific route covers ${packet.dst}; the default route 0.0.0.0/0 catches it → ${ifLabel(route)}.`,
    };
  }

  return {
    egress: route.egress,
    kind: 'forward',
    routeIndex: best,
    aclIndex: null,
    reason: `${packet.dst} matches ${route.prefix}/${route.len} — the longest match at ${route.len} bits${beat} → ${ifLabel(route)}.`,
  };
}

// ---------------------------------------------------------------------------
// Packet generation helpers

const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
const rndExcept = (min: number, max: number, not: number[]) => {
  let v = rnd(min, max);
  while (not.includes(v)) v = rnd(min, max);
  return v;
};

const INTERNET = ['8.8.8.8', '1.1.1.1', '142.250.183.14', '151.101.1.69', '104.16.132.229', '13.107.42.14', '34.117.59.81'];
const WEB = [
  { proto: 'tcp' as const, port: 443 },
  { proto: 'tcp' as const, port: 443 },
  { proto: 'tcp' as const, port: 80 },
  { proto: 'tcp' as const, port: 22 },
  { proto: 'udp' as const, port: 53 },
  { proto: 'udp' as const, port: 443 },
];
const anySrc = () => pick([`192.168.10.${rnd(2, 250)}`, `192.168.20.${rnd(2, 250)}`, pick(INTERNET), `172.20.${rnd(0, 255)}.${rnd(1, 254)}`]);
const ttl = () => pick([64, 64, 128, 255, rnd(8, 60)]);
const flow = (dst: string, extra: Partial<Omit<Packet, 'id'>> = {}): Omit<Packet, 'id'> => ({
  src: anySrc(),
  dst,
  ...pick(WEB),
  ttl: ttl(),
  ...extra,
});

export const LEVELS: Level[] = [
  {
    id: 'connected',
    title: 'Connected networks',
    concept:
      'R1 has two LANs plugged straight into it and a default route to the ISP. A destination on a connected /24 leaves by that LAN port; anything else follows 0.0.0.0/0.',
    newRule: 'Default route catches everything without a more specific match.',
    routes: [
      { code: 'C', prefix: '192.168.10.0', len: 24, egress: 'gi0' },
      { code: 'C', prefix: '192.168.20.0', len: 24, egress: 'gi1' },
      { code: 'S*', prefix: '0.0.0.0', len: 0, via: '203.0.113.1', egress: 'se0' },
    ],
    acl: [],
    ports: { gi0: 'LAN A · 192.168.10.0/24', gi1: 'LAN B · 192.168.20.0/24', se0: 'ISP uplink', drop: 'Discard' },
    packetCount: 10,
    spawnEvery: 2.6,
    deadline: 7,
    queueCap: 6,
    templates: [
      { weight: 3, make: () => flow(`192.168.10.${rnd(2, 254)}`) },
      { weight: 3, make: () => flow(`192.168.20.${rnd(2, 254)}`) },
      { weight: 3, make: () => flow(pick(INTERNET)) },
      { weight: 1, make: () => flow(`192.168.${rndExcept(0, 60, [10, 20])}.${rnd(1, 254)}`) },
    ],
  },
  {
    id: 'lpm',
    title: 'Longest prefix wins',
    concept:
      'Routes now overlap. 10.20.30.7 is inside 10.0.0.0/8, 10.20.0.0/16 and 10.20.30.0/24 — the router always picks the most specific (longest) prefix. There is no default route this shift.',
    newRule: 'No match and no default route → drop.',
    routes: [
      { code: 'O', prefix: '10.0.0.0', len: 8, via: '172.31.0.2', egress: 'se0' },
      { code: 'O', prefix: '10.20.0.0', len: 16, via: '192.168.20.2', egress: 'gi1' },
      { code: 'O', prefix: '10.20.30.0', len: 24, via: '192.168.10.2', egress: 'gi0' },
      { code: 'S', prefix: '172.16.0.0', len: 12, via: '192.168.20.2', egress: 'gi1' },
    ],
    acl: [],
    ports: { gi0: 'Core A · 10.20.30.0/24', gi1: 'Campus · 10.20.0.0/16', se0: 'WAN · rest of 10/8', drop: 'Discard' },
    packetCount: 12,
    spawnEvery: 2.3,
    deadline: 6.5,
    queueCap: 6,
    templates: [
      { weight: 3, make: () => flow(`10.20.30.${rnd(1, 254)}`) },
      { weight: 3, make: () => flow(`10.20.${rndExcept(0, 255, [30])}.${rnd(1, 254)}`) },
      { weight: 3, make: () => flow(`10.${rndExcept(1, 254, [20])}.${rnd(0, 255)}.${rnd(1, 254)}`) },
      { weight: 2, make: () => flow(`172.${rnd(16, 31)}.${rnd(0, 255)}.${rnd(1, 254)}`) },
      { weight: 1, make: () => flow(`172.${rnd(32, 40)}.${rnd(0, 255)}.${rnd(1, 254)}`) },
      { weight: 1, make: () => flow(pick(INTERNET)) },
    ],
  },
  {
    id: 'filters',
    title: 'Filters & hop limits',
    concept:
      'ACL 110 is applied inbound, so it is checked before routing — the first matching line decides. Every packet also carries a TTL; one that arrives with TTL 1 cannot be forwarded.',
    newRule: 'Order of checks: ACL → TTL → longest-prefix match.',
    routes: [
      { code: 'C', prefix: '192.168.10.0', len: 24, egress: 'gi0' },
      { code: 'C', prefix: '192.168.20.0', len: 24, egress: 'gi1' },
      { code: 'S', prefix: '10.50.0.0', len: 16, via: '192.168.20.2', egress: 'gi1' },
      { code: 'S*', prefix: '0.0.0.0', len: 0, via: '203.0.113.1', egress: 'se0' },
    ],
    acl: [
      { action: 'deny', proto: 'tcp', src: '0.0.0.0', srcLen: 0, port: 23, text: 'deny tcp any any eq telnet' },
      { action: 'deny', proto: 'ip', src: '10.66.0.0', srcLen: 16, text: 'deny ip 10.66.0.0 0.0.255.255 any' },
      { action: 'permit', proto: 'ip', src: '0.0.0.0', srcLen: 0, text: 'permit ip any any' },
    ],
    ports: { gi0: 'LAN A · 192.168.10.0/24', gi1: 'LAN B + 10.50/16', se0: 'ISP uplink', drop: 'Discard' },
    packetCount: 12,
    spawnEvery: 2.1,
    deadline: 6,
    queueCap: 6,
    templates: [
      { weight: 2, make: () => flow(`192.168.10.${rnd(2, 254)}`) },
      { weight: 2, make: () => flow(`10.50.${rnd(0, 255)}.${rnd(1, 254)}`) },
      { weight: 2, make: () => flow(pick(INTERNET)) },
      { weight: 2, make: () => flow(`192.168.20.${rnd(2, 254)}`, { proto: 'tcp', port: 23 }) },
      { weight: 2, make: () => flow(pick([`192.168.10.${rnd(2, 254)}`, pick(INTERNET)]), { src: `10.66.${rnd(0, 255)}.${rnd(1, 254)}` }) },
      { weight: 2, make: () => flow(pick([`192.168.20.${rnd(2, 254)}`, pick(INTERNET)]), { ttl: 1 }) },
    ],
  },
  {
    id: 'peak',
    title: 'Peak hour',
    concept:
      'Everything at once, faster. Watch the /18: 192.168.64.0/18 spans 192.168.64.0 – 192.168.127.255. One /24 inside it goes to a branch over the WAN, and 198.51.100.0/24 is blackholed to Null0.',
    newRule: 'Null0 routes match like any other — then discard.',
    routes: [
      { code: 'S', prefix: '192.168.0.0', len: 16, via: '192.168.20.2', egress: 'gi1' },
      { code: 'O', prefix: '192.168.64.0', len: 18, via: '192.168.10.2', egress: 'gi0' },
      { code: 'O', prefix: '192.168.100.0', len: 24, via: '172.31.0.2', egress: 'se0' },
      { code: 'S', prefix: '198.51.100.0', len: 24, egress: 'drop' },
      { code: 'S*', prefix: '0.0.0.0', len: 0, via: '203.0.113.1', egress: 'se0' },
    ],
    acl: [
      { action: 'deny', proto: 'udp', src: '0.0.0.0', srcLen: 0, port: 161, text: 'deny udp any any eq snmp' },
      { action: 'permit', proto: 'ip', src: '0.0.0.0', srcLen: 0, text: 'permit ip any any' },
    ],
    ports: { gi0: 'Floor 2 · 192.168.64.0/18', gi1: 'Campus · 192.168.0.0/16', se0: 'WAN / ISP', drop: 'Discard' },
    packetCount: 16,
    spawnEvery: 1.6,
    deadline: 4.8,
    queueCap: 7,
    templates: [
      { weight: 3, make: () => flow(`192.168.${rndExcept(64, 127, [100])}.${rnd(1, 254)}`) },
      { weight: 3, make: () => flow(`192.168.${pick([rnd(0, 63), rnd(128, 255)])}.${rnd(1, 254)}`) },
      { weight: 2, make: () => flow(`192.168.100.${rnd(1, 254)}`) },
      { weight: 2, make: () => flow(`198.51.100.${rnd(1, 254)}`) },
      { weight: 2, make: () => flow(pick(INTERNET)) },
      { weight: 1, make: () => flow(`192.168.${rnd(0, 255)}.${rnd(1, 254)}`, { proto: 'udp', port: 161 }) },
      { weight: 1, make: () => flow(pick(INTERNET), { ttl: 1 }) },
    ],
  },
];

/** Build a shuffled packet run for a level, weighted so every template shows up. */
export function generatePackets(level: Level, startId = 1): Packet[] {
  const bag: PacketTemplate[] = [];
  level.templates.forEach(t => {
    for (let i = 0; i < t.weight; i++) bag.push(t);
  });
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [bag[i], bag[j]] = [bag[j], bag[i]];
  }
  return Array.from({ length: level.packetCount }, (_, i) => ({ id: startId + i, ...bag[i % bag.length].make() }));
}
