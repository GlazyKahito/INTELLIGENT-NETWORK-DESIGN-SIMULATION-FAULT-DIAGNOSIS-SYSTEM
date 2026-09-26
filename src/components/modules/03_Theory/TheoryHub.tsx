import React, { useState } from 'react';
import { 
  BookOpen, 
  Terminal, 
  Cable, 
  Search, 
  ShieldCheck, 
  Network, 
  Binary, 
  Zap, 
  Layers,
  ArrowRight,
  Eye,
  Filter
} from 'lucide-react';
import { CableFabrication } from './CableFabrication';
import { SubnetCalculator } from './SubnetCalculator';
import { TcpHeaderViewer } from './TcpHeaderViewer';
import { HammingSimulator } from './HammingSimulator';
import { CommandReference } from './CommandReference';
import { playSound } from '../../../lib/sound';
import { TopologyWalkthrough } from '@/components/motion/TopologyWalkthrough';

interface TheoryHubProps {
  initialTab?: string;
  onProceedToDesign: () => void;
  onTestInTerminal: (cmd: string) => void;
}

export const TheoryHub: React.FC<TheoryHubProps> = ({
  initialTab = 'fundamentals',
  onProceedToDesign,
  onTestInTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [selectedCaptureIdx, setSelectedCaptureIdx] = useState<number>(0);

  const tabs = [
    { id: 'fundamentals', label: 'Network Fundamentals', icon: Layers, exp: 'Theory' },
    { id: 'commands', label: '01 Commands', icon: Terminal, exp: 'CLI' },
    { id: 'cabling', label: '02 Cabling & Pinout', icon: Cable, exp: 'L1' },
    { id: 'wireshark', label: '03 Packet Analysis', icon: Search, exp: 'L2–L7' },
    { id: 'tcp', label: '04 TCP Header', icon: ShieldCheck, exp: 'L4' },
    { id: 'addressing', label: '05 IP Classes & Subnet', icon: Network, exp: 'L3' },
    { id: 'hamming', label: '06 Hamming Code', icon: Binary, exp: 'L2' },
    { id: 'udp', label: '07 UDP Datagrams', icon: Zap, exp: 'L4' },
  ];

  // Captured packets for Wireshark analysis pane
  const wiresharkCaptures = [
    {
      num: 1,
      time: '0.000000',
      src: '192.168.1.10',
      dst: '192.168.2.10',
      proto: 'ICMP',
      len: 74,
      info: 'Echo (ping) request  id=0x0001, seq=1/256, ttl=64',
      l2: { srcMac: '00:1A:2B:3C:4D:01', dstMac: '00:E0:F9:11:22:01', type: 'IPv4 (0x0800)' },
      l3: { ver: 4, ihl: '20 bytes', dscp: '0x00', totalLen: 60, id: '0x4f2a', ttl: 64, proto: 'ICMP (1)', chk: '0x8a92' },
      l4: { type: 'Echo Request (8)', code: 0, chk: '0x5d4e', id: '0x0001', seq: '1' },
      hex: [
        '00 e0 f9 11 22 01 00 1a  2b 3c 4d 01 08 00 45 00',
        '00 3c 4f 2a 00 00 40 01  8a 92 c0 a8 01 0a c0 a8',
        '02 0a 08 00 5d 4e 00 01  00 01 61 62 63 64 65 66',
        '67 68 69 6a 6b 6c 6d 6e  6f 70 71 72 73 74 75 76',
      ],
      ascii: [
        '...."...+<M...E.',
        '.<O*..@.........',
        '....]N....abcdef',
        'ghijklmnopqrstuv',
      ]
    },
    {
      num: 2,
      time: '0.001842',
      src: '192.168.1.10',
      dst: '192.168.2.10',
      proto: 'TCP',
      len: 66,
      info: '49210 → 80 [SYN] Seq=0 Win=64240 Len=0 MSS=1460 SACK_PERM=1',
      l2: { srcMac: '00:1A:2B:3C:4D:01', dstMac: '00:E0:F9:11:22:01', type: 'IPv4 (0x0800)' },
      l3: { ver: 4, ihl: '20 bytes', dscp: '0x00', totalLen: 52, id: '0x3a19', ttl: 64, proto: 'TCP (6)', chk: '0x91a0' },
      l4: { srcPort: 49210, dstPort: 80, seq: 0, ack: 0, flags: 'SYN (0x002)', win: 64240, chk: '0x4a1e' },
      hex: [
        '00 e0 f9 11 22 01 00 1a  2b 3c 4d 01 08 00 45 00',
        '00 34 3a 19 40 00 40 06  91 a0 c0 a8 01 0a c0 a8',
        '02 0a c0 3a 00 50 00 00  00 00 00 00 00 00 80 02',
        'fa f0 4a 1e 00 00 02 04  05 b4 01 03 03 08 01 01',
      ],
      ascii: [
        '...."...+<M...E.',
        '.4:.@.@.........',
        '...:.P..........',
        '..J.............',
      ]
    },
    {
      num: 3,
      time: '0.003112',
      src: '192.168.1.10',
      dst: '192.168.2.10',
      proto: 'DNS',
      len: 71,
      info: 'Standard query 0x1a2b A server.local',
      l2: { srcMac: '00:1A:2B:3C:4D:01', dstMac: '00:E0:F9:11:22:01', type: 'IPv4 (0x0800)' },
      l3: { ver: 4, ihl: '20 bytes', dscp: '0x00', totalLen: 57, id: '0x12c4', ttl: 64, proto: 'UDP (17)', chk: '0x6e2f' },
      l4: { srcPort: 58102, dstPort: 53, length: 37, chk: '0x9b2c' },
      hex: [
        '00 e0 f9 11 22 01 00 1a  2b 3c 4d 01 08 00 45 00',
        '00 39 12 c4 00 00 40 11  6e 2f c0 a8 01 0a c0 a8',
        '02 0a e2 f6 00 35 00 25  9b 2c 1a 2b 01 00 00 01',
        '00 00 00 00 00 00 06 73  65 72 76 65 72 05 6c 6f',
      ],
      ascii: [
        '...."...+<M...E.',
        '.9....@.n/......',
        '.....5.%.+,.....',
        '.......server.lo',
      ]
    },
  ];

  const currentPkt = wiresharkCaptures[selectedCaptureIdx] || wiresharkCaptures[0];

  return (
    <section className="py-12 bg-[#0c0b09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
              <BookOpen className="w-4 h-4" />
              <span>Networking foundations behind the system</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              Interactive Theory & Protocol Dissection
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Explore interactive mathematical calculators, cabling pinouts, Wireshark packet inspectors, and protocol structures.
            </p>
          </div>

          <button
            onClick={() => {
              playSound('success');
              onProceedToDesign();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(255,95,31,0.3)] shrink-0 active:scale-95 cursor-pointer"
          >
            <span>Proceed to Network Design</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-none">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound('click');
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(255,95,31,0.2)] font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-black/40 text-slate-500">
                  {tab.exp}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="transition-all animate-in fade-in duration-200">
          {activeTab === 'fundamentals' && (
            <div className="space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#151412] border border-slate-800 space-y-5 shadow-2xl">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span>Network Architecture Fundamentals (LAN, WAN & Topologies)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                  Computer networks facilitate reliable resource sharing and information interchange through standardized protocol hierarchies. High-performance enterprise networks rely on distinct functional tiers: Access Layer (Switches), Distribution/Core Layer (High-speed Routers), and Service Layer (Web, DNS, and DHCP Servers).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <h4 className="text-sm font-bold text-emerald-400 mb-1.5">Local Area Network (LAN)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      High-bandwidth, low-latency interconnections within bounded geographic boundaries (laboratories, campuses) utilizing Ethernet IEEE 802.3 and twisted-pair copper media.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <h4 className="text-sm font-bold text-cyan-400 mb-1.5">Layer 2 Switching (CAM)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Hardware ASIC-based frame forwarding utilizing Content Addressable Memory (CAM) tables mapping 48-bit MAC addresses to dedicated collision-free switch ports.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
                    <h4 className="text-sm font-bold text-indigo-400 mb-1.5">Layer 3 Routing (Gateway)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Inter-network packet forwarding across distinct subnet boundaries based on logical IPv4 addresses, routing tables, and default gateway pointers.
                    </p>
                  </div>
                </div>
              </div>

              {/* How a packet crosses the network — built hop by hop as you scroll */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#12110f] border border-slate-800 shadow-xl">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">One packet, four devices</div>
                <p className="mt-1 mb-4 text-sm text-slate-400 max-w-2xl">Scroll through the path. Each device only reads the layer it is responsible for.</p>
                <TopologyWalkthrough />
              </div>

              {/* Protocol Stack Visual */}
              <div className="p-6 rounded-3xl bg-[#12110f] border border-slate-800 font-mono text-xs shadow-xl">
                <div className="text-slate-400 uppercase tracking-wider mb-4 font-semibold">
                  OSI 7-Layer vs TCP/IP 4-Layer Architecture Mapping
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <div className="text-[10px] text-slate-400">Layer 4</div>
                    <div className="font-bold text-sm">Application</div>
                    <div className="text-[10px] text-slate-500 mt-1">HTTP, DNS, DHCP, SSH</div>
                  </div>
                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    <div className="text-[10px] text-slate-400">Layer 3</div>
                    <div className="font-bold text-sm">Transport</div>
                    <div className="text-[10px] text-slate-500 mt-1">TCP (Reliable), UDP (Fast)</div>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    <div className="text-[10px] text-slate-400">Layer 2</div>
                    <div className="font-bold text-sm">Internet / Network</div>
                    <div className="text-[10px] text-slate-500 mt-1">IPv4, ICMP, ARP, OSPF</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300">
                    <div className="text-[10px] text-slate-400">Layer 1</div>
                    <div className="font-bold text-sm">Network Access / Link</div>
                    <div className="text-[10px] text-slate-500 mt-1">Ethernet 802.3, MAC, Cat6</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'commands' && (
            <CommandReference onTestInTerminal={onTestInTerminal} />
          )}

          {activeTab === 'cabling' && (
            <CableFabrication />
          )}

          {activeTab === 'wireshark' && (
            <div className="p-6 rounded-3xl bg-[#151412] border border-slate-800 space-y-6 shadow-2xl font-mono text-xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-sans">
                    <Search className="w-5 h-5 text-emerald-400" />
                    <span>Wireshark Dual-Pane Protocol Dissector & Hex Dump</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Frame decapsulation, Protocol Trees & Byte-Level Hex/ASCII Dump.
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Promiscuous Tap: Active
                </span>
              </div>

              {/* Pane 1: Packet List */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="p-2.5">No.</th>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Source</th>
                      <th className="p-2.5">Destination</th>
                      <th className="p-2.5">Protocol</th>
                      <th className="p-2.5">Length</th>
                      <th className="p-2.5">Info</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {wiresharkCaptures.map((pkt, idx) => (
                      <tr
                        key={pkt.num}
                        onClick={() => {
                          playSound('click');
                          setSelectedCaptureIdx(idx);
                        }}
                        className={`cursor-pointer transition-colors ${
                          selectedCaptureIdx === idx
                            ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                            : 'hover:bg-slate-900/60 text-slate-300'
                        }`}
                      >
                        <td className="p-2.5">{pkt.num}</td>
                        <td className="p-2.5 text-slate-400">{pkt.time}</td>
                        <td className="p-2.5 text-emerald-400">{pkt.src}</td>
                        <td className="p-2.5 text-cyan-400">{pkt.dst}</td>
                        <td className="p-2.5 font-bold">{pkt.proto}</td>
                        <td className="p-2.5">{pkt.len}</td>
                        <td className="p-2.5 text-slate-300 truncate max-w-xs">{pkt.info}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pane 2: Decapsulated Protocol Tree */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Packet Details (Protocol Hierarchy Tree):
                  </div>

                  {/* L2 */}
                  <div className="pl-3 border-l-2 border-emerald-500 space-y-0.5 text-[11px]">
                    <span className="text-emerald-400 font-bold block">Ethernet II Frame</span>
                    <div className="text-slate-300">Src MAC: {currentPkt.l2.srcMac}</div>
                    <div className="text-slate-300">Dst MAC: {currentPkt.l2.dstMac}</div>
                    <div className="text-slate-400">EtherType: {currentPkt.l2.type}</div>
                  </div>

                  {/* L3 */}
                  <div className="pl-3 border-l-2 border-cyan-500 space-y-0.5 text-[11px]">
                    <span className="text-cyan-400 font-bold block">Internet Protocol Version 4</span>
                    <div className="text-slate-300">Src IP: {currentPkt.src} ➔ Dst IP: {currentPkt.dst}</div>
                    <div className="text-slate-300">TTL: {currentPkt.l3.ttl} | Protocol: {currentPkt.l3.proto}</div>
                    <div className="text-slate-400">Header Length: {currentPkt.l3.ihl} | Total: {currentPkt.l3.totalLen}B</div>
                  </div>

                  {/* L4 */}
                  <div className="pl-3 border-l-2 border-indigo-500 space-y-0.5 text-[11px]">
                    <span className="text-indigo-400 font-bold block">{currentPkt.proto} Segment</span>
                    {currentPkt.proto === 'TCP' ? (
                      <div className="text-slate-300">
                        Ports: {(currentPkt.l4 as any).srcPort} ➔ {(currentPkt.l4 as any).dstPort} | Flags: {(currentPkt.l4 as any).flags}
                      </div>
                    ) : currentPkt.proto === 'UDP' ? (
                      <div className="text-slate-300">
                        Ports: {(currentPkt.l4 as any).srcPort} ➔ {(currentPkt.l4 as any).dstPort} | Length: {(currentPkt.l4 as any).length}B
                      </div>
                    ) : (
                      <div className="text-slate-300">
                        {(currentPkt.l4 as any).type} | Code: {(currentPkt.l4 as any).code}
                      </div>
                    )}
                  </div>
                </div>

                {/* Pane 3: Hex Dump & ASCII Side-by-Side */}
                <div className="p-4 rounded-xl bg-black/80 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Packet Bytes (Hex Dump & ASCII):</span>
                    <span className="text-[10px] text-emerald-400">Offset: 0x0000</span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                    {currentPkt.hex.map((hLine, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-slate-600 select-none">{(i * 16).toString(16).padStart(4, '0')}:</span>
                        <span className="text-emerald-300 tracking-wider flex-1">{hLine}</span>
                        <span className="text-slate-400 border-l border-slate-800 pl-2">{currentPkt.ascii[i]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tcp' && (
            <TcpHeaderViewer />
          )}

          {activeTab === 'addressing' && (
            <SubnetCalculator />
          )}

          {activeTab === 'hamming' && (
            <HammingSimulator />
          )}

          {activeTab === 'udp' && (
            <TcpHeaderViewer />
          )}
        </div>
      </div>
    </section>
  );
};
