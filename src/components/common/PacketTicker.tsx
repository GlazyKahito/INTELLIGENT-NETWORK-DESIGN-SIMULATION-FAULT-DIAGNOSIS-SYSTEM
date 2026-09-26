// A live-capture strip under the header: the lab's traffic scrolls past like a sniffer.
const FEED = [
  ['TCP', '192.168.1.11:52144 → 192.168.2.10:443', 'SYN'],
  ['TCP', '192.168.2.10:443 → 192.168.1.11:52144', 'SYN, ACK'],
  ['TCP', '192.168.1.11:52144 → 192.168.2.10:443', 'ACK'],
  ['ARP', 'who-has 192.168.1.1', 'tell 192.168.1.14'],
  ['ARP', '192.168.1.1 is-at C4:0A:CB:10:00:01', 'reply'],
  ['ICMP', '192.168.1.12 → 192.168.1.1', 'echo request · ttl 64'],
  ['ICMP', '192.168.1.1 → 192.168.1.12', 'echo reply · 1 ms'],
  ['DNS', '192.168.1.13 → 192.168.2.10:53', 'A files.lab?'],
  ['DNS', '192.168.2.10 → 192.168.1.13', 'A 192.168.2.10'],
  ['UDP', '192.168.1.14:5004 → 192.168.2.10:5004', 'len 1316'],
  ['OSPF', '192.168.1.1 → 224.0.0.5', 'hello · area 0'],
  ['ICMP', '192.168.1.1 → 192.168.1.11', 'ttl exceeded'],
  ['TCP', '192.168.2.10:443 → 192.168.1.11', 'PSH, ACK · 1380 B'],
  ['STP', 'SW-01 → 01:80:C2:00:00:00', 'BPDU · root 32768'],
  ['DHCP', '0.0.0.0 → 255.255.255.255', 'DISCOVER'],
  ['TCP', '192.168.1.12 → 192.168.2.10:80', 'RST'],
];

function Row() {
  return (
    <>
      {FEED.map(([proto, path, info], i) => (
        <span key={i} className="flex shrink-0 items-center gap-2 pr-8">
          <span className="text-emerald-400">{proto}</span>
          <span className="text-slate-300">{path}</span>
          <span className="text-slate-500">{info}</span>
          <span className="pl-6 text-slate-700">/</span>
        </span>
      ))}
    </>
  );
}

export function PacketTicker() {
  return (
    <div className="group relative h-6 overflow-hidden border-t border-slate-800/80 bg-[#0d0c0b]/70" aria-hidden>
      <div className="packet-ticker flex w-max items-center font-mono text-[10px] uppercase leading-6 tracking-[0.12em] group-hover:[animation-play-state:paused]">
        <Row />
        <Row />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-stretch">
        <span className="flex items-center gap-1.5 border-r border-emerald-500/40 bg-[#0d0c0b] pl-4 pr-3 font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" /> Live capture
        </span>
        <span className="w-12 bg-gradient-to-r from-[#0d0c0b] to-transparent" />
      </div>
    </div>
  );
}
