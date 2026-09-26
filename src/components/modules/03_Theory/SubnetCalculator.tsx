import React, { useState } from 'react';
import { Network, Calculator, Check, ArrowRight } from 'lucide-react';
import { getSubnetDetails, isValidIPv4, ipToNumber, numberToIp } from '../../../lib/network/addressing';
import { playSound } from '../../../lib/sound';

export const SubnetCalculator: React.FC = () => {
  const [ipInput, setIpInput] = useState('192.168.1.10');
  const [maskInput, setMaskInput] = useState('255.255.255.0');

  const subnetInfo = getSubnetDetails(ipInput, maskInput);

  // Quick preset IPs
  const presets = [
    { label: 'Class A (10.0.0.1 /8)', ip: '10.0.0.1', mask: '255.0.0.0' },
    { label: 'Class B (172.16.10.5 /16)', ip: '172.16.10.5', mask: '255.255.0.0' },
    { label: 'Class C (192.168.1.10 /24)', ip: '192.168.1.10', mask: '255.255.255.0' },
    { label: 'Subnetted /28 (192.168.1.45 /28)', ip: '192.168.1.45', mask: '255.255.255.240' },
  ];

  // Convert octet to 8-bit binary string
  const toBinaryOctet = (num: number) => num.toString(2).padStart(8, '0');

  const getBinaryString = (dotted: string) => {
    if (!isValidIPv4(dotted)) return '00000000.00000000.00000000.00000000';
    return dotted.split('.').map(p => toBinaryOctet(parseInt(p, 10))).join('.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <span>IPv4 Address Classes & CIDR Subnet Calculator</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Class A/B/C Identification, Network/Host Bit Boundaries, and Bitwise ANDing.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {presets.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                playSound('click');
                setIpInput(p.ip);
                setMaskInput(p.mask);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 rounded border border-slate-700 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
          <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
            IPv4 Address:
          </label>
          <input
            type="text"
            value={ipInput}
            onChange={e => setIpInput(e.target.value.trim())}
            placeholder="e.g. 192.168.1.10"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-mono text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
          <label className="block text-xs font-mono text-slate-400 mb-1.5 uppercase">
            Subnet Mask:
          </label>
          <input
            type="text"
            value={maskInput}
            onChange={e => setMaskInput(e.target.value.trim())}
            placeholder="e.g. 255.255.255.0"
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-emerald-300 font-mono text-sm focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Binary Bitwise ANDing Visualizer */}
      <div className="p-5 rounded-xl bg-[#0b101d] border border-slate-800 font-mono text-xs overflow-x-auto space-y-2">
        <div className="text-[11px] text-slate-400 uppercase tracking-wider mb-2 font-semibold">
          Bitwise Logic Breakdown (IP Address & Subnet Mask = Network Address)
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span className="w-28 text-slate-500">IP (Binary):</span>
          <span className="text-cyan-300 tracking-wider">{getBinaryString(ipInput)}</span>
        </div>
        <div className="flex items-center gap-4 text-slate-300">
          <span className="w-28 text-slate-500">Mask (Binary):</span>
          <span className="text-amber-300 tracking-wider">{getBinaryString(maskInput)}</span>
        </div>
        <div className="border-t border-slate-800 pt-2 flex items-center gap-4 text-emerald-300 font-bold">
          <span className="w-28 text-slate-500">Network (AND):</span>
          <span className="tracking-wider">{subnetInfo ? getBinaryString(subnetInfo.networkAddress) : 'N/A'}</span>
        </div>
      </div>

      {/* Calculated Results Matrix */}
      {subnetInfo ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Address Class</div>
            <div className="text-sm sm:text-base font-bold text-emerald-400 mt-1">{subnetInfo.ipClass}</div>
            <div className="text-[10px] text-slate-500 mt-1">{subnetInfo.isPrivate ? 'RFC 1918 Private' : 'Public IPv4'}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">CIDR Notation</div>
            <div className="text-sm sm:text-base font-bold text-cyan-400 mt-1">{subnetInfo.prefix}</div>
            <div className="text-[10px] text-slate-500 mt-1">Network Bits Prefix</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Network Address</div>
            <div className="text-sm sm:text-base font-mono font-bold text-slate-100 mt-1">{subnetInfo.networkAddress}</div>
            <div className="text-[10px] text-slate-500 mt-1">Subnet Wire ID</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Broadcast Address</div>
            <div className="text-sm sm:text-base font-mono font-bold text-slate-100 mt-1">{subnetInfo.broadcastAddress}</div>
            <div className="text-[10px] text-slate-500 mt-1">Directed Subnet Broadcast</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">First Usable Host</div>
            <div className="text-sm sm:text-base font-mono font-bold text-slate-200 mt-1">{subnetInfo.firstUsableHost}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Last Usable Host</div>
            <div className="text-sm sm:text-base font-mono font-bold text-slate-200 mt-1">{subnetInfo.lastUsableHost}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1322] border border-slate-800 col-span-2">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Usable Host Capacity</div>
            <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 mt-1">
              {subnetInfo.usableHosts.toLocaleString()} Usable IP Addresses
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Formula: 2^(32 - prefix) - 2</div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono">
          Invalid IPv4 Address or Subnet Mask entered. Please verify 4 octets (0-255).
        </div>
      )}
    </div>
  );
};
