import { motion, useInView, useReducedMotion } from 'motion/react';
import { useRef, type ReactNode } from 'react';

// One animated schematic per theory topic. Orange = the thing being explained,
// bone/grey = context. Animations loop only while the diagram is on screen.

const O = 'rgb(255 95 31)';
const O2 = 'rgb(255 163 112)';
const G = 'rgb(122 118 110)';
const G2 = 'rgb(66 64 60)';
const T = 'rgb(222 219 212)';
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function Frame({ title, caption, children, viewBox }: { title: string; caption: ReactNode; children: (play: boolean) => ReactNode; viewBox: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.3 });
  const reduce = useReducedMotion();
  return (
    <figure ref={ref} className="border border-slate-800 bg-[#12110f] p-5 sm:p-6">
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-emerald-400">Diagram · {title}</span>
        <span className="max-w-2xl text-sm text-slate-400">{caption}</span>
      </figcaption>
      <svg viewBox={viewBox} className="h-auto w-full" role="img" aria-label={title} style={{ fontFamily: '"IBM Plex Sans", sans-serif' }}>
        {children(inView && !reduce)}
      </svg>
    </figure>
  );
}

const Label = ({ x, y, children, anchor = 'middle', size = 12, fill = T, weight = 500 }: { x: number; y: number; children: ReactNode; anchor?: 'start' | 'middle' | 'end'; size?: number; fill?: string; weight?: number }) => (
  <text x={x} y={y} textAnchor={anchor} fill={fill} fontSize={size} fontWeight={weight}>
    {children}
  </text>
);

const Node = ({ x, y, label, sub }: { x: number; y: number; label: string; sub?: string }) => (
  <g>
    <rect x={x - 42} y={y - 22} width={84} height={44} fill="#0d0c0b" stroke={G} />
    <Label x={x} y={y + 1}>{label}</Label>
    {sub && <Label x={x} y={y + 15} size={9} fill={G}>{sub}</Label>}
  </g>
);

// ---------------------------------------------------------------- Commands
export function CommandsDiagram() {
  const xs = [190, 350, 500, 630];
  const scope: [string, number, number, string][] = [
    ['ipconfig', 0, 0, 'this host only'],
    ['arp -a', 0, 1, 'local link: IP → MAC'],
    ['ping', 0, 3, 'end-to-end reachability'],
    ['tracert', 0, 3, 'every router hop'],
    ['nslookup', 0, 3, 'name → IP via DNS'],
  ];
  return (
    <Frame title="What each command tests" caption="Every command answers a different question about the same path." viewBox="0 0 680 360">
      {play => (
        <>
          {xs.slice(0, -1).map((x, i) => <line key={i} x1={x + 42} y1={50} x2={xs[i + 1] - 42} y2={50} stroke={G} />)}
          <Node x={xs[0]} y={50} label="PC" sub="192.168.1.10" />
          <Node x={xs[1]} y={50} label="Switch" sub="L2" />
          <Node x={xs[2]} y={50} label="Router" sub="gw .1.1" />
          <Node x={xs[3]} y={50} label="Server" sub="DNS/HTTP" />
          {play && (
            <motion.circle r={5} cy={50} fill={O} initial={{ cx: xs[0] }} animate={{ cx: [xs[0], xs[3], xs[0]] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          )}
          {scope.map(([cmd, a, b, what], i) => {
            const y = 116 + i * 50;
            return (
              <g key={cmd}>
                <Label x={16} y={y + 4} anchor="start" size={12} fill={O} weight={600}>{cmd}</Label>
                <motion.line
                  x1={xs[a] - 30}
                  x2={xs[b] + 30}
                  y1={y}
                  y2={y}
                  stroke={O}
                  strokeWidth={3}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.2 + i * 0.15, duration: 0.6, ease: EASE }}
                />
                <line x1={xs[a] - 30} x2={xs[a] - 30} y1={y - 6} y2={y + 6} stroke={O} />
                <line x1={xs[b] + 30} x2={xs[b] + 30} y1={y - 6} y2={y + 6} stroke={O} />
                <Label x={xs[a] - 30} y={y + 18} anchor="start" size={10} fill={G}>{what}</Label>
              </g>
            );
          })}
        </>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- Cabling
const T568B = ['#f5f1ea|#e8742c', '#e8742c', '#f5f1ea|#2e9e57', '#3b6fd8', '#f5f1ea|#3b6fd8', '#2e9e57', '#f5f1ea|#8a5a36', '#8a5a36'];
const T568A = ['#f5f1ea|#2e9e57', '#2e9e57', '#f5f1ea|#e8742c', '#3b6fd8', '#f5f1ea|#3b6fd8', '#e8742c', '#f5f1ea|#8a5a36', '#8a5a36'];

function Wires({ x, y, colors, label }: { x: number; y: number; colors: string[]; label: string }) {
  return (
    <g>
      <Label x={x + 76} y={y - 12} fill={T} weight={600}>{label}</Label>
      {colors.map((c, i) => {
        const [base, stripe] = c.split('|');
        return (
          <g key={i}>
            <rect x={x + i * 19} y={y} width={15} height={70} fill={base} />
            {stripe && [0, 1, 2, 3].map(k => <rect key={k} x={x + i * 19} y={y + 6 + k * 17} width={15} height={7} fill={stripe} />)}
            <Label x={x + i * 19 + 7.5} y={y + 86} size={10} fill={G}>{i + 1}</Label>
          </g>
        );
      })}
    </g>
  );
}

export function CablingDiagram() {
  const L = 70;
  const R = 520;
  const py = (p: number) => 188 + p * 13;
  const cross: Record<number, number> = { 1: 3, 2: 6, 3: 1, 6: 2 };
  return (
    <Frame title="T568A vs T568B, straight vs crossover" caption="Only pairs 2 and 3 (pins 1, 2, 3, 6) change places. Same standard on both ends = straight-through; A on one end and B on the other = crossover." viewBox="0 0 680 330">
      {play => (
        <>
          <Wires x={40} y={30} colors={T568A} label="T568A" />
          <Wires x={470} y={30} colors={T568B} label="T568B" />
          <Label x={340} y={62} fill={G} size={11}>pins 1–2 ↔ 3–6 swapped</Label>
          <path d="M 205 70 C 300 40, 380 40, 465 70" fill="none" stroke={O} strokeDasharray="4 4" />
          <Label x={L} y={176} fill={T} weight={600} anchor="start">Crossover (PC ↔ PC)</Label>
          {[1, 2, 3, 4, 5, 6, 7, 8].map(p => {
            const to = cross[p] ?? p;
            const hot = !!cross[p];
            return (
              <g key={p}>
                <Label x={L - 12} y={py(p) + 4} size={9} fill={G} anchor="end">{p}</Label>
                <Label x={R + 22} y={py(to) + 4} size={9} fill={G} anchor="start">{to}</Label>
                <motion.line
                  x1={L}
                  y1={py(p)}
                  x2={R}
                  y2={py(to)}
                  stroke={hot ? O : G2}
                  strokeWidth={hot ? 2.2 : 1.5}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: p * 0.06, duration: 0.7, ease: EASE }}
                />
                {hot && play && (
                  <motion.circle r={3.5} fill={O2} initial={{ cx: L, cy: py(p) }} animate={{ cx: [L, R], cy: [py(p), py(to)] }} transition={{ duration: 1.8, repeat: Infinity, delay: p * 0.2, ease: 'linear' }} />
                )}
              </g>
            );
          })}
          <Label x={L} y={318} size={10} fill={G} anchor="start">1,2 = transmit pair · 3,6 = receive pair (10/100BASE-T). Modern NICs auto-detect (Auto-MDIX).</Label>
        </>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- Encapsulation
export function EncapsulationDiagram() {
  const layers: [string, string, number][] = [
    ['Ethernet header', '14 B · MAC src/dst', 0],
    ['IP header', '20 B · IP src/dst, TTL', 1],
    ['TCP header', '20 B · ports, seq, ack', 2],
  ];
  return (
    <Frame title="Encapsulation & decapsulation" caption="Each layer wraps the one above in its own header. The receiver peels them off in reverse — this is exactly what Wireshark shows you, layer by layer." viewBox="0 0 680 260">
      {play => (
        <>
          {layers.map(([name, sub, i]) => {
            const x = 20 + i * 22;
            const w = 640 - i * 44;
            const y = 30 + i * 22;
            return (
              <motion.g
                key={name}
                animate={play ? { opacity: [1, 1, 0.15, 0.15, 1], x: [0, 0, -12, -12, 0] } : { opacity: 1 }}
                transition={{ duration: 6, times: [0, 0.3 + i * 0.1, 0.4 + i * 0.1, 0.85, 1], repeat: Infinity }}
              >
                <rect x={x} y={y} width={w} height={200 - i * 44} fill="none" stroke={i === 0 ? O : i === 1 ? O2 : T} strokeWidth={1.4} />
                <rect x={x} y={y} width={150} height={20} fill={i === 0 ? O : i === 1 ? O2 : T} />
                <Label x={x + 8} y={y + 14} anchor="start" size={11} fill="#0d0c0b" weight={700}>{name}</Label>
                <Label x={x + 160} y={y + 14} anchor="start" size={10} fill={G}>{sub}</Label>
              </motion.g>
            );
          })}
          <rect x={86} y={96} width={508} height={64} fill="#0d0c0b" stroke={G} strokeDasharray="3 3" />
          <Label x={340} y={126} size={14} fill={T} weight={600}>Application data</Label>
          <Label x={340} y={144} size={10} fill={G}>HTTP · DNS · SSH payload</Label>
          <rect x={596} y={30} width={44} height={200} fill="none" stroke={O} strokeWidth={1.4} />
          <Label x={618} y={134} size={10} fill={O}>FCS</Label>
          <Label x={340} y={252} size={10} fill={G}>Frame = 14 + 20 + 20 + data + 4 B (FCS). Switches read the outer box, routers the next, hosts the rest.</Label>
        </>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- TCP handshake
export function HandshakeDiagram() {
  const C = 150;
  const S = 530;
  const msgs: [string, string, number, boolean][] = [
    ['SYN', 'seq = x', 70, true],
    ['SYN-ACK', 'seq = y, ack = x+1', 125, false],
    ['ACK', 'ack = y+1', 180, true],
    ['DATA', 'seq = x+1, len n', 235, true],
    ['ACK', 'ack = x+1+n', 290, false],
  ];
  return (
    <Frame title="TCP three-way handshake" caption="Before any data, both sides agree on starting sequence numbers. Every byte that follows is acknowledged — that is what makes TCP reliable." viewBox="0 0 680 340">
      {play => (
        <>
          <Label x={C} y={28} weight={600}>Client</Label>
          <Label x={S} y={28} weight={600}>Server :443</Label>
          <line x1={C} y1={40} x2={C} y2={320} stroke={G} />
          <line x1={S} y1={40} x2={S} y2={320} stroke={G} />
          {msgs.map(([name, detail, y, right], i) => {
            const x1 = right ? C : S;
            const x2 = right ? S : C;
            return (
              <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.35 }}>
                <motion.line x1={x1} y1={y} x2={x2} y2={y + 22} stroke={i < 3 ? O : O2} strokeWidth={2} initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3 + i * 0.35, duration: 0.4 }} />
                <polygon points={right ? `${x2},${y + 22} ${x2 - 10},${y + 14} ${x2 - 8},${y + 24}` : `${x2},${y + 22} ${x2 + 10},${y + 14} ${x2 + 8},${y + 24}`} fill={i < 3 ? O : O2} />
                <Label x={(C + S) / 2} y={y + 4} size={12} fill={i < 3 ? O : O2} weight={700}>{name}</Label>
                <Label x={(C + S) / 2} y={y + 36} size={10} fill={G}>{detail}</Label>
                {play && <motion.circle r={4} fill={T} animate={{ cx: [x1, x2], cy: [y, y + 22] }} transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 2.5, delay: i * 0.7 }} />}
              </motion.g>
            );
          })}
          <Label x={C - 16} y={130} anchor="end" size={10} fill={G}>SYN-SENT</Label>
          <Label x={C - 16} y={206} anchor="end" size={10} fill={O}>ESTABLISHED</Label>
          <Label x={S + 16} y={80} anchor="start" size={10} fill={G}>LISTEN</Label>
          <Label x={S + 16} y={206} anchor="start" size={10} fill={O}>ESTABLISHED</Label>
        </>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- Subnetting
export function SubnetDiagram() {
  const bits = Array.from({ length: 32 }, (_, i) => i);
  const bw = 19;
  const x0 = 36;
  const subnets = ['.0 – .63', '.64 – .127', '.128 – .191', '.192 – .255'];
  return (
    <Frame title="Network bits vs host bits" caption="The mask decides where the network part ends. Borrowing 2 host bits turns one /24 into four /26 subnets of 62 usable hosts each." viewBox="0 0 680 300">
      {() => (
        <>
          <Label x={x0} y={24} anchor="start" size={12} fill={T} weight={600}>192.168.1.0/24 → /26</Label>
          {bits.map(i => {
            const net = i < 24;
            const borrowed = i === 24 || i === 25;
            return (
              <motion.rect
                key={i}
                x={x0 + i * bw + Math.floor(i / 8) * 4}
                y={40}
                width={bw - 3}
                height={32}
                fill={net ? O : borrowed ? O2 : '#1a1918'}
                stroke={net || borrowed ? 'none' : G}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.02, duration: 0.3 }}
              />
            );
          })}
          <Label x={x0 + 12 * bw} y={92} size={11} fill={O}>24 network bits (255.255.255)</Label>
          <Label x={x0 + 25 * bw + 16} y={92} size={11} fill={O2}>2 borrowed</Label>
          <Label x={x0 + 29 * bw + 16} y={92} size={11} fill={G}>6 host</Label>
          {subnets.map((r, i) => (
            <motion.g key={r} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + i * 0.15 }}>
              <rect x={x0 + i * 152} y={130} width={140} height={110} fill="#0d0c0b" stroke={i === 1 ? O : G} />
              <Label x={x0 + i * 152 + 70} y={154} size={11} fill={i === 1 ? O : T} weight={700}>Subnet {i + 1}</Label>
              <Label x={x0 + i * 152 + 70} y={176} size={12} fill={T}>192.168.1{r.split(' – ')[0]}</Label>
              <Label x={x0 + i * 152 + 70} y={194} size={10} fill={G}>to {r.split(' – ')[1]}</Label>
              <Label x={x0 + i * 152 + 70} y={218} size={10} fill={G}>62 hosts · bc {r.split(' – ')[1]}</Label>
            </motion.g>
          ))}
          <Label x={340} y={278} size={10} fill={G}>Mask /26 = 255.255.255.192 · block size 64 · first address = network, last = broadcast</Label>
        </>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- Hamming
export function HammingDiagram() {
  const pos = [1, 2, 3, 4, 5, 6, 7];
  const parity = [1, 2, 4];
  const covers: Record<number, number[]> = { 1: [1, 3, 5, 7], 2: [2, 3, 6, 7], 4: [4, 5, 6, 7] };
  const bx = (p: number) => 150 + (p - 1) * 62;
  return (
    <Frame title="Hamming (7,4): who checks whom" caption="Parity bits sit at positions 1, 2 and 4. Each checks the positions whose binary index contains it. A flipped bit fails exactly the checks that add up to its position." viewBox="0 0 680 300">
      {play => (
        <>
          {pos.map(p => {
            const isP = parity.includes(p);
            return (
              <g key={p}>
                <rect x={bx(p) - 22} y={30} width={44} height={40} fill={isP ? O : '#1a1918'} stroke={isP ? 'none' : G} />
                <Label x={bx(p)} y={55} size={13} fill={isP ? '#0d0c0b' : T} weight={700}>{isP ? `p${p}` : `d${p}`}</Label>
                <Label x={bx(p)} y={86} size={10} fill={G}>{p} = {p.toString(2).padStart(3, '0')}</Label>
              </g>
            );
          })}
          {parity.map((pp, row) => {
            const y = 125 + row * 44;
            return (
              <g key={pp}>
                <Label x={24} y={y + 4} anchor="start" size={12} fill={O} weight={700}>p{pp} checks</Label>
                <line x1={bx(1) - 22} x2={bx(7) + 22} y1={y} y2={y} stroke={G2} />
                {covers[pp].map((c, k) => (
                  <motion.circle key={c} cx={bx(c)} cy={y} r={7} fill={O} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + row * 0.25 + k * 0.08 }} />
                ))}
              </g>
            );
          })}
          <motion.rect
            x={bx(5) - 26}
            y={24}
            width={52}
            height={52}
            fill="none"
            stroke="rgb(248 113 113)"
            strokeWidth={2}
            animate={play ? { opacity: [0, 1, 1, 0] } : { opacity: 1 }}
            transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.8, 1] }}
          />
          <Label x={340} y={270} size={12} fill={T}>
            If d5 flips: p1 ✗ and p4 ✗ fail, p2 ✓ passes → syndrome 1 + 4 = <tspan fill={O} fontWeight={700}>5</tspan> → flip bit 5 back.
          </Label>
        </>
      )}
    </Frame>
  );
}

// ---------------------------------------------------------------- TCP vs UDP
export function UdpVsTcpDiagram() {
  const lane = (y: number, label: string, reliable: boolean, play: boolean) => {
    const A = 120;
    const B = 590;
    return (
      <g>
        <Label x={24} y={y + 4} anchor="start" size={13} fill={reliable ? O2 : O} weight={700}>{label}</Label>
        <line x1={A} x2={B - 12} y1={y} y2={y} stroke={G2} />
        <Label x={A} y={y - 14} size={10} fill={G}>sender</Label>
        <Label x={B} y={y - 14} size={10} fill={G}>receiver</Label>
        {[0, 1, 2, 3].map(i => {
          const lost = i === 2;
          const end = lost ? (A + B) / 2 + 30 : B;
          return (
            <g key={i}>
              {play && (
                <motion.rect
                  width={14}
                  height={10}
                  y={y - 5}
                  fill={lost ? 'rgb(248 113 113)' : reliable ? O2 : O}
                  initial={{ x: A, opacity: 0 }}
                  animate={{ x: [A, end], opacity: [0, 1, 1, lost ? 0 : 1] }}
                  transition={{ duration: 1.4, delay: i * 0.6, repeat: Infinity, repeatDelay: 2.4 + (reliable ? 1.2 : 0) }}
                />
              )}
              {reliable && lost && play && (
                <motion.rect
                  width={14}
                  height={10}
                  y={y - 5}
                  fill={O2}
                  initial={{ x: A, opacity: 0 }}
                  animate={{ x: [A, B], opacity: [0, 1, 1, 1] }}
                  transition={{ duration: 1.4, delay: 3.2, repeat: Infinity, repeatDelay: 3.8 }}
                />
              )}
            </g>
          );
        })}
        {[1, 2, 3, 4].map(n => {
          const missing = !reliable && n === 3;
          const resent = reliable && n === 3;
          return (
            <g key={n}>
              <rect x={612 + (n - 1) * 16} y={y - 7} width={13} height={14} fill={missing ? 'none' : reliable ? O2 : O} stroke={missing ? 'rgb(248 113 113)' : 'none'} strokeDasharray={missing ? '2 2' : undefined} />
              <Label x={618 + (n - 1) * 16} y={y + 20} size={8} fill={resent ? O2 : missing ? 'rgb(248 113 113)' : G}>{resent ? '↺' : missing ? '✗' : n}</Label>
            </g>
          );
        })}
        {reliable ? (
          <Label x={360} y={y + 28} size={10} fill={G}>lost segment 3 is noticed (no ACK) and retransmitted · slower, complete, in order</Label>
        ) : (
          <Label x={360} y={y + 28} size={10} fill={G}>lost datagram 3 is simply gone · no handshake, no ACKs, lowest latency</Label>
        )}
      </g>
    );
  };
  return (
    <Frame title="TCP vs UDP under packet loss" caption="Same loss, two philosophies: TCP recovers everything; UDP keeps moving. Video calls, DNS and games choose UDP; file transfer and the web choose TCP." viewBox="0 0 680 230">
      {play => (
        <>
          {lane(60, 'TCP', true, play)}
          {lane(160, 'UDP', false, play)}
        </>
      )}
    </Frame>
  );
}
