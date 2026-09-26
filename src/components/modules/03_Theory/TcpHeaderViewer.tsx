import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { playSound } from '../../../lib/sound';

export const TcpHeaderViewer: React.FC = () => {
  const [selectedField, setSelectedField] = useState<string>('flags');
  const [activeTab, setActiveTab] = useState<'tcp' | 'udp' | 'handshake'>('tcp');

  // Interactive TCP flags toggle
  const [flags, setFlags] = useState({
    urg: false,
    ack: true,
    psh: false,
    rst: false,
    syn: true,
    fin: false,
  });

  const toggleFlag = (flagName: keyof typeof flags) => {
    playSound('click');
    setFlags(prev => ({ ...prev, [flagName]: !prev[flagName] }));
  };

  const fieldDescriptions: Record<string, { title: string; size: string; desc: string }> = {
    srcPort: {
      title: 'Source Port',
      size: '16 Bits (2 Bytes)',
      desc: 'Identifies the sending application socket on the client side (e.g., ephemeral port 49210).',
    },
    dstPort: {
      title: 'Destination Port',
      size: '16 Bits (2 Bytes)',
      desc: 'Identifies the destination service on the server (e.g., Port 80 for HTTP, 443 for HTTPS, 22 for SSH).',
    },
    seq: {
      title: 'Sequence Number',
      size: '32 Bits (4 Bytes)',
      desc: 'Tracks the position of the first data byte in this segment within the stream, or represents the Initial Sequence Number (ISN) when SYN=1.',
    },
    ack: {
      title: 'Acknowledgment Number',
      size: '32 Bits (4 Bytes)',
      desc: 'Specifies the next sequential byte number the sender expects to receive. Valid only when ACK flag = 1.',
    },
    offset: {
      title: 'Data Offset (Header Length)',
      size: '4 Bits',
      desc: 'Number of 32-bit words in the TCP header. Defaults to 5 (5 x 4 = 20 bytes) without TCP options.',
    },
    reserved: {
      title: 'Reserved',
      size: '3 Bits',
      desc: 'Reserved for future standardization; must always be set to zero.',
    },
    flags: {
      title: 'Control Flags (Bitfield)',
      size: '9 Bits (URG, ACK, PSH, RST, SYN, FIN)',
      desc: 'Control bits governing session lifecycle: SYN initiates, ACK confirms, FIN gracefully closes, RST abruptly resets.',
    },
    window: {
      title: 'Receive Window Size',
      size: '16 Bits (2 Bytes)',
      desc: 'Flow control parameter specifying the number of data bytes the sender is currently prepared to accept in its buffer.',
    },
    checksum: {
      title: 'Header & Data Checksum',
      size: '16 Bits (2 Bytes)',
      desc: '16-bit one’s complement sum over a pseudo-IPv4 header, TCP header, and payload for error detection.',
    },
    urgent: {
      title: 'Urgent Pointer',
      size: '16 Bits (2 Bytes)',
      desc: 'Offset pointing to urgent payload data that requires out-of-order processing. Valid only when URG=1.',
    },
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>TCP Header Structure & Transport Layer Protocol Analysis</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            20-byte TCP Frame Architecture, 3-Way Handshake & TCP vs UDP Matrix.
          </p>
        </div>

        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('tcp');
            }}
            className={`px-3 py-1 rounded transition-colors ${activeTab === 'tcp' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            TCP 20-Byte Header
          </button>
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('handshake');
            }}
            className={`px-3 py-1 rounded transition-colors ${activeTab === 'handshake' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            3-Way Handshake
          </button>
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('udp');
            }}
            className={`px-3 py-1 rounded transition-colors ${activeTab === 'udp' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            TCP vs UDP Comparison
          </button>
        </div>
      </div>

      {activeTab === 'tcp' && (
        <div className="space-y-6">
          {/* Interactive 32-bit Width TCP Header Grid */}
          <div className="p-5 rounded-xl bg-[#0b101d] border border-slate-800 font-mono text-xs overflow-x-auto">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between font-semibold">
              <span>Standard 20-Byte RFC 793 TCP Header (32 Bits Wide)</span>
              <span className="text-emerald-400">Click any field to dissect</span>
            </div>

            {/* Bit Indices (0 to 31) */}
            <div className="grid grid-cols-32 gap-0 text-center text-[9px] text-slate-500 mb-1">
              <div className="col-span-16">Bits 0-15</div>
              <div className="col-span-16">Bits 16-31</div>
            </div>

            <div className="space-y-1.5 min-w-[600px]">
              {/* Row 1: Source & Dest Port */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedField('srcPort');
                  }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedField === 'srcPort'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">00-15</div>
                  Source Port (16 bits)
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedField('dstPort');
                  }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedField === 'dstPort'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[10px] text-slate-400">16-31</div>
                  Destination Port (16 bits)
                </button>
              </div>

              {/* Row 2: Sequence Number */}
              <button
                onClick={() => {
                  playSound('click');
                  setSelectedField('seq');
                }}
                className={`w-full p-3 rounded-lg border text-center transition-all ${
                  selectedField === 'seq'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400">00-31</div>
                Sequence Number (32 bits) — [e.g. 0x3F419B02]
              </button>

              {/* Row 3: Acknowledgment Number */}
              <button
                onClick={() => {
                  playSound('click');
                  setSelectedField('ack');
                }}
                className={`w-full p-3 rounded-lg border text-center transition-all ${
                  selectedField === 'ack'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400">00-31</div>
                Acknowledgment Number (32 bits) — [Valid if ACK = 1]
              </button>

              {/* Row 4: Data Offset, Reserved, Flags, Window Size */}
              <div className="grid grid-cols-12 gap-1.5">
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedField('offset');
                  }}
                  className={`col-span-2 p-2.5 rounded-lg border text-center transition-all ${
                    selectedField === 'offset'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[9px] text-slate-400">Offset</div>
                  4 bits
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedField('reserved');
                  }}
                  className={`col-span-2 p-2.5 rounded-lg border text-center transition-all ${
                    selectedField === 'reserved'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[9px] text-slate-400">Reserved</div>
                  3 bits
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedField('flags');
                  }}
                  className={`col-span-4 p-2.5 rounded-lg border text-center transition-all ${
                    selectedField === 'flags'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[9px] text-slate-400">Control Flags</div>
                  9 bits (URG ACK PSH RST SYN FIN)
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedField('window');
                  }}
                  className={`col-span-4 p-2.5 rounded-lg border text-center transition-all ${
                    selectedField === 'window'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-[9px] text-slate-400">Window Size</div>
                  16 bits (64,240 B)
                </button>
              </div>

              {/* Row 5: Checksum & Urgent Pointer */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedField('checksum');
                  }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedField === 'checksum'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Checksum (16 bits) — 0x4A1E
                </button>
                <button
                  onClick={() => {
                    playSound('click');
                    setSelectedField('urgent');
                  }}
                  className={`p-3 rounded-lg border text-center transition-all ${
                    selectedField === 'urgent'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  Urgent Pointer (16 bits)
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Flags Bitfield Control */}
          <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
            <div className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-2 font-semibold">
              Interactive Flag Bitfield (Click to Toggle):
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {(Object.keys(flags) as (keyof typeof flags)[]).map(f => (
                <button
                  key={f}
                  onClick={() => toggleFlag(f)}
                  className={`p-2 rounded-lg border font-mono text-xs uppercase font-bold flex items-center justify-between transition-all ${
                    flags[f]
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_8px_rgba(59,130,246,0.2)]'
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}
                >
                  <span>{f}</span>
                  <span className="text-[10px] px-1 rounded bg-black/40">
                    {flags[f] ? '1' : '0'}
                  </span>
                </button>
              ))}
            </div>
            <div className="text-[11px] font-mono text-slate-400 mt-2">
              Current Segment Classification:{' '}
              <span className="text-emerald-300 font-bold">
                {flags.syn && flags.ack
                  ? 'SYN-ACK (Handshake Step 2)'
                  : flags.syn
                  ? 'SYN (Connection Request)'
                  : flags.fin && flags.ack
                  ? 'FIN-ACK (Graceful Teardown)'
                  : flags.rst
                  ? 'RST (Connection Refused / Abort)'
                  : flags.ack
                  ? 'ACK (Data Transfer / Keepalive)'
                  : 'Plain TCP Segment'}
              </span>
            </div>
          </div>

          {/* Detailed Selected Field Card */}
          {fieldDescriptions[selectedField] && (
            <div className="p-5 rounded-xl bg-[#0e1626] border-l-4 border-emerald-500 shadow-xl">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-bold text-slate-100">
                  {fieldDescriptions[selectedField].title}
                </h4>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {fieldDescriptions[selectedField].size}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {fieldDescriptions[selectedField].desc}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'handshake' && (
        <div className="p-6 rounded-xl bg-[#0b101d] border border-slate-800 space-y-6">
          <div className="text-sm font-bold text-slate-100">
            TCP 3-Way Handshake Connection Establishment
          </div>

          <div className="relative py-4 space-y-8 font-mono text-xs">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold">STEP 01: Client ➔ Server</span>
                <div className="text-slate-300 mt-1">[SYN] Seq = 100, Win = 64240, MSS = 1460</div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-400">SYN Sent</span>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-[#0d1322] border border-cyan-500/40 flex items-center justify-between">
              <div>
                <span className="text-cyan-400 font-bold">STEP 02: Server ➔ Client</span>
                <div className="text-slate-300 mt-1">[SYN, ACK] Seq = 300, Ack = 101 (Seq + 1), Win = 65535</div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">SYN Received</span>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-[#0d1322] border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold">STEP 03: Client ➔ Server</span>
                <div className="text-slate-300 mt-1">[ACK] Seq = 101, Ack = 301 (Seq + 1)</div>
              </div>
              <span className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">ESTABLISHED</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'udp' && (
        <div className="p-6 rounded-xl bg-[#0b101d] border border-slate-800 space-y-6">
          <div className="text-sm font-bold text-slate-100">
            Transport Layer Comparative Matrix: TCP vs UDP
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border border-slate-800">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-300">
                  <th className="p-3">Characteristic</th>
                  <th className="p-3 text-emerald-400">TCP (Transmission Control Protocol)</th>
                  <th className="p-3 text-cyan-400">UDP (User Datagram Protocol)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr>
                  <td className="p-3 font-semibold text-slate-400">Connection Mode</td>
                  <td className="p-3">Connection-Oriented (3-Way Handshake)</td>
                  <td className="p-3">Connectionless (Direct Datagrams)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-400">Header Size</td>
                  <td className="p-3">20 to 60 Bytes</td>
                  <td className="p-3 font-bold text-cyan-300">8 Bytes (Minimal Overhead)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-400">Reliability & Ordering</td>
                  <td className="p-3">Guaranteed byte-ordered delivery & retransmission</td>
                  <td className="p-3">Unreliable; packets may arrive out of order or be dropped</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-400">Flow & Congestion Control</td>
                  <td className="p-3">Sliding Window & AIMD Congestion Avoidance</td>
                  <td className="p-3">None (Application controls pacing)</td>
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-400">Typical Applications</td>
                  <td className="p-3">HTTP/HTTPS, SSH, FTP, SMTP (Port 25)</td>
                  <td className="p-3">DNS (Port 53), DHCP, VoIP, Real-time Gaming, Video Streaming</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
