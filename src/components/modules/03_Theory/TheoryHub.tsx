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
  ArrowRight
} from 'lucide-react';
import { CableFabrication } from './CableFabrication';
import { SubnetCalculator } from './SubnetCalculator';
import { TcpHeaderViewer } from './TcpHeaderViewer';
import { HammingSimulator } from './HammingSimulator';
import { CommandReference } from './CommandReference';
import { playSound } from '../../../lib/sound';

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

  const tabs = [
    { id: 'fundamentals', label: 'Network Fundamentals', icon: Layers, exp: 'Theory' },
    { id: 'commands', label: '01 Commands', icon: Terminal, exp: 'Exp 01' },
    { id: 'cabling', label: '02 Cabling & Pinout', icon: Cable, exp: 'Exp 02' },
    { id: 'wireshark', label: '03 Packet Analysis', icon: Search, exp: 'Exp 03' },
    { id: 'tcp', label: '04 TCP Header', icon: ShieldCheck, exp: 'Exp 04' },
    { id: 'addressing', label: '05 IP Classes & Subnet', icon: Network, exp: 'Exp 05' },
    { id: 'hamming', label: '06 Hamming Code', icon: Binary, exp: 'Exp 06' },
    { id: 'udp', label: '07 UDP Datagrams', icon: Zap, exp: 'Exp 07' },
  ];

  return (
    <section className="py-12 bg-[#070a12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
              <BookOpen className="w-4 h-4" />
              <span>DCN Theoretical Modules // Experiments 01–07</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              Interactive Theory & Mathematical Foundations
            </h2>
          </div>

          <button
            onClick={() => {
              playSound('success');
              onProceedToDesign();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] shrink-0"
          >
            <span>Proceed to Network Design (Exp 08)</span>
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)] font-semibold'
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
              <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 space-y-4">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-400" />
                  <span>Network Architecture Fundamentals (LAN, WAN & Topologies)</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-4xl">
                  Computer networks facilitate resource sharing and information interchange through standardized protocol hierarchies. High-performance enterprise networks rely on distinct layers: Access Layer (Switches), Distribution/Core Layer (High-speed Routers), and Service Layer (Web, DNS, and DHCP Servers).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h4 className="text-sm font-bold text-emerald-400 mb-1">Local Area Network (LAN)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      High-bandwidth, low-latency interconnections within bounded geographic boundaries (laboratories, campuses) utilizing Ethernet IEEE 802.3 and twisted-pair copper media.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h4 className="text-sm font-bold text-cyan-400 mb-1">Layer 2 Switching (CAM)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Hardware ASIC-based frame forwarding utilizing Content Addressable Memory (CAM) tables mapping 48-bit MAC addresses to dedicated collision-free switch ports.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <h4 className="text-sm font-bold text-indigo-400 mb-1">Layer 3 Routing (Gateway)</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Inter-network packet forwarding across distinct subnet boundaries based on logical IPv4 addresses, routing tables, and default gateway pointers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Protocol Stack Visual */}
              <div className="p-6 rounded-2xl bg-[#0b101d] border border-slate-800 font-mono text-xs">
                <div className="text-slate-400 uppercase tracking-wider mb-4 font-semibold">
                  OSI 7-Layer vs TCP/IP 4-Layer Architecture Mapping
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <div className="text-[10px] text-slate-400">Layer 4</div>
                    <div className="font-bold">Application</div>
                    <div className="text-[10px] text-slate-500 mt-1">HTTP, DNS, DHCP, SSH</div>
                  </div>
                  <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    <div className="text-[10px] text-slate-400">Layer 3</div>
                    <div className="font-bold">Transport</div>
                    <div className="text-[10px] text-slate-500 mt-1">TCP (Reliable), UDP (Fast)</div>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    <div className="text-[10px] text-slate-400">Layer 2</div>
                    <div className="font-bold">Internet / Network</div>
                    <div className="text-[10px] text-slate-500 mt-1">IPv4, ICMP, ARP, OSPF</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700 text-slate-300">
                    <div className="text-[10px] text-slate-400">Layer 1</div>
                    <div className="font-bold">Network Access / Link</div>
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
            <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Search className="w-5 h-5 text-emerald-400" />
                  <span>Wireshark Packet Analysis & Protocol Decapsulation</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Experiment 03: Frame Encapsulation, Berkeley Packet Filters (BPF), and Layer 2-4 Dissection.
                </p>
              </div>

              {/* Wireshark Packet Dissection Mock */}
              <div className="space-y-3 font-mono text-xs">
                {/* Frame / L2 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-emerald-400 font-bold mb-2 flex items-center justify-between">
                    <span>Frame 1: 74 bytes on wire (592 bits), 74 bytes captured</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">Layer 2</span>
                  </div>
                  <div className="text-slate-300 space-y-1 text-[11px] pl-3 border-l-2 border-emerald-500/40">
                    <div>Ethernet II, Src: 00:1a:2b:3c:4d:01, Dst: 00:e0:f9:11:22:01</div>
                    <div className="text-slate-500">Destination: Cisco Router (00:e0:f9:11:22:01)</div>
                    <div className="text-slate-500">Source: Workstation PC1 (00:1a:2b:3c:4d:01)</div>
                    <div className="text-slate-400">Type: IPv4 (0x0800)</div>
                  </div>
                </div>

                {/* IPv4 / L3 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-cyan-400 font-bold mb-2 flex items-center justify-between">
                    <span>Internet Protocol Version 4, Src: 192.168.1.10, Dst: 192.168.2.10</span>
                    <span className="text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 rounded">Layer 3</span>
                  </div>
                  <div className="text-slate-300 space-y-1 text-[11px] pl-3 border-l-2 border-cyan-500/40">
                    <div>0100 .... = Version: 4 | .... 0101 = Header Length: 20 bytes (5)</div>
                    <div>Total Length: 60 bytes | Identification: 0x4f2a (20266)</div>
                    <div>Time to Live (TTL): 64 | Protocol: ICMP (1)</div>
                    <div>Header Checksum: 0x8a92 [validation disabled]</div>
                  </div>
                </div>

                {/* ICMP / L4 */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-indigo-400 font-bold mb-2 flex items-center justify-between">
                    <span>Internet Control Message Protocol (ICMP)</span>
                    <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded">Layer 4 Control</span>
                  </div>
                  <div className="text-slate-300 space-y-1 text-[11px] pl-3 border-l-2 border-indigo-500/40">
                    <div>Type: 8 (Echo (ping) request) | Code: 0</div>
                    <div>Checksum: 0x5d4e [correct] | Identifier (BE): 1 (0x0001)</div>
                    <div>Sequence Number (BE): 1 (0x0001)</div>
                    <div className="text-slate-500">Data (32 bytes): abcdefghijklmnopqrstuvwabcdefghi</div>
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
