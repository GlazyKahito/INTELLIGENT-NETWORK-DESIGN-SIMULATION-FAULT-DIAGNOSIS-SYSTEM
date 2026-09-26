import React from 'react';
import { X, Search, ShieldCheck, Binary, ArrowRight } from 'lucide-react';
import { SimulatedPacket } from '../../../types/network';
import { playSound } from '../../../lib/sound';

interface PacketInspectorModalProps {
  packet: SimulatedPacket | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PacketInspectorModal: React.FC<PacketInspectorModalProps> = ({
  packet,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !packet) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#05070d]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="max-w-2xl w-full bg-[#0d1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-mono text-xs">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0a0f1c]">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-100 uppercase tracking-wider">
              Wireshark Packet Dissector // Packet #{packet.id.slice(-6)}
            </span>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Packet Dissection Layers */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Summary Banner */}
          <div className="p-3 bg-black/40 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-slate-400">Protocol: </span>
              <span className="text-emerald-400 font-bold">{packet.protocol}</span>
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-slate-400">Status: </span>
              <span className={packet.status === 'transmitting' || packet.status === 'received' ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {packet.status.toUpperCase()}
              </span>
            </div>
            <div className="text-slate-400">
              Hop: <span className="text-cyan-400">{packet.currentHopIndex + 1}</span> of {packet.path.length}
            </div>
          </div>

          {/* Layer 2: Ethernet Frame Header */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-emerald-400 font-bold flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span>LAYER 2: DATA LINK (ETHERNET II FRAME)</span>
              <span className="text-[10px] text-slate-500">IEEE 802.3</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500">Source MAC: </span>
                <span className="text-slate-100">{packet.l2.sourceMac}</span>
              </div>
              <div>
                <span className="text-slate-500">Destination MAC: </span>
                <span className="text-slate-100">{packet.l2.destMac}</span>
              </div>
              <div>
                <span className="text-slate-500">EtherType: </span>
                <span className="text-slate-100">{packet.l2.etherType}</span>
              </div>
              <div>
                <span className="text-slate-500">Frame Check Sequence (FCS): </span>
                <span className="text-emerald-400">0x3E19A20F (Valid)</span>
              </div>
            </div>
          </div>

          {/* Layer 3: IPv4 Datagram Header */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-cyan-400 font-bold flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span>LAYER 3: NETWORK (INTERNET PROTOCOL v4)</span>
              <span className="text-[10px] text-slate-500">RFC 791</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-slate-300">
              <div>
                <span className="text-slate-500">Source IPv4: </span>
                <span className="text-emerald-400 font-semibold">{packet.l3.sourceIP}</span>
              </div>
              <div>
                <span className="text-slate-500">Destination IPv4: </span>
                <span className="text-cyan-400 font-semibold">{packet.l3.destIP}</span>
              </div>
              <div>
                <span className="text-slate-500">Time-To-Live (TTL): </span>
                <span className="text-slate-100">{packet.l3.ttl}</span>
              </div>
              <div>
                <span className="text-slate-500">Total Packet Length: </span>
                <span className="text-slate-100">{packet.l3.totalLength} Bytes</span>
              </div>
            </div>
          </div>

          {/* Layer 4: Transport Header (TCP / UDP / ICMP) */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
            <div className="text-indigo-400 font-bold flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span>LAYER 4: TRANSPORT ({packet.protocol})</span>
              <span className="text-[10px] text-slate-500">L4 Segment</span>
            </div>

            {packet.l4 ? (
              <div className="grid grid-cols-2 gap-3 text-slate-300">
                <div>
                  <span className="text-slate-500">Source Port: </span>
                  <span className="text-slate-100">{packet.l4.sourcePort}</span>
                </div>
                <div>
                  <span className="text-slate-500">Destination Port: </span>
                  <span className="text-slate-100">{packet.l4.destPort}</span>
                </div>

                {packet.protocol === 'TCP' && (
                  <>
                    <div>
                      <span className="text-slate-500">Seq Number: </span>
                      <span className="text-slate-100">{packet.l4.seqNumber ?? 100}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Ack Number: </span>
                      <span className="text-slate-100">{packet.l4.ackNumber ?? 101}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Window Size: </span>
                      <span className="text-slate-100">{packet.l4.windowSize ?? 64240} Bytes</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Checksum: </span>
                      <span className="text-slate-100">{packet.l4.checksum}</span>
                    </div>
                  </>
                )}

                {packet.protocol === 'UDP' && (
                  <>
                    <div>
                      <span className="text-slate-500">Length: </span>
                      <span className="text-slate-100">{packet.l4.length ?? 32} Bytes</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Checksum: </span>
                      <span className="text-slate-100">{packet.l4.checksum}</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-slate-400">
                ICMP Echo: Type 8 (Echo Request), Code 0, Identifier 0x0001, Seq 1.
              </div>
            )}
          </div>

          {/* Payload Data */}
          <div className="p-4 rounded-xl bg-black/60 border border-slate-800 space-y-2">
            <div className="text-slate-400 font-bold text-[11px] uppercase">
              Application Payload Stream (Hex & ASCII)
            </div>
            <div className="p-2.5 bg-black/80 rounded border border-slate-900 text-[11px] text-emerald-300 break-all">
              {packet.payload || '61 62 63 64 65 66 67 68 69 6a 6b 6c 6d 6e 6f 70 71 72 73 74 75 76 77 61 62 63 64 65 66 67 68 69 (abcdefghijklmnopqrstuvwabcdefghi)'}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#0a0f1c] border-t border-slate-800 flex items-center justify-between text-slate-500 text-[11px]">
          <span>CAPTURED VIA VIRTUAL PROMISCUOUS TAP</span>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
