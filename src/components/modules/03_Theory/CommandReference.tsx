import React, { useState } from 'react';
import { Terminal, Copy, Check, Play, BookOpen } from 'lucide-react';
import { playSound } from '../../../lib/sound';

export const CommandReference: React.FC<{ onTestInTerminal: (cmd: string) => void }> = ({ onTestInTerminal }) => {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const commands = [
    {
      name: 'ping',
      syntax: 'ping <ip_address | hostname> [-t] [-n count]',
      purpose: 'Verifies Layer 3 network-level IP reachability by transmitting ICMP Echo Request messages and measuring Round-Trip Times (RTT) and packet loss percentage.',
      example: 'ping 192.168.1.1',
      outputSample: 'Reply from 192.168.1.1: bytes=32 time=1ms TTL=64\nPackets: Sent = 4, Received = 4, Lost = 0 (0% loss)',
      keyFlags: ['-t : Ping until stopped (Ctrl+C)', '-n count : Number of echo requests to send'],
    },
    {
      name: 'ipconfig',
      syntax: 'ipconfig [/all] [/release] [/renew] [/flushdns]',
      purpose: 'Displays all current TCP/IP network configuration values, physical MAC addresses, IPv4/IPv6 addresses, subnet masks, default gateways, and DNS resolvers.',
      example: 'ipconfig /all',
      outputSample: 'Ethernet adapter FastEthernet0:\n   Physical Address. . . . . . . . . : 00-1A-2B-3C-4D-01\n   IPv4 Address. . . . . . . . . . . : 192.168.1.10\n   Subnet Mask . . . . . . . . . . . : 255.255.255.0\n   Default Gateway . . . . . . . . . : 192.168.1.1',
      keyFlags: ['/all : Full verbose parameters with MAC & DNS', '/flushdns : Purges DNS resolver cache'],
    },
    {
      name: 'tracert',
      syntax: 'tracert <ip_address | hostname>',
      purpose: 'Traces the hop-by-hop path taken by IPv4 packets to a destination by incrementing the IP Time-To-Live (TTL) field and listening for ICMP Time Exceeded messages.',
      example: 'tracert 192.168.2.10',
      outputSample: '  1    1 ms    1 ms    1 ms  192.168.1.1\n  2    2 ms    2 ms    2 ms  192.168.2.10\nTrace complete.',
      keyFlags: ['-d : Do not resolve addresses to hostnames for faster output'],
    },
    {
      name: 'arp',
      syntax: 'arp -a [-N if_addr] | arp -d *',
      purpose: 'Displays and modifies the Address Resolution Protocol (ARP) cache table, which maps Layer 3 IPv4 addresses to Layer 2 48-bit Ethernet MAC addresses on the local LAN.',
      example: 'arp -a',
      outputSample: 'Interface: 192.168.1.10 --- 0x2\n  Internet Address      Physical Address      Type\n  192.168.1.1           00-e0-f9-11-22-01     dynamic\n  192.168.1.11          00-1a-2b-3c-4d-02     dynamic',
      keyFlags: ['-a : Displays current ARP entries for all interfaces', '-d : Deletes a specified entry'],
    },
    {
      name: 'nslookup',
      syntax: 'nslookup <hostname | ip_address> [dns_server]',
      purpose: 'Queries Domain Name System (DNS) servers to resolve human-readable fully qualified domain names (FQDNs) to IPv4 A-records or PTR reverse-lookup records.',
      example: 'nslookup server.local',
      outputSample: 'Server:  ns1.somaiya.edu\nAddress: 192.168.2.10\n\nName:    server.local\nAddress: 192.168.2.10',
      keyFlags: ['type=mx : Query mail exchanger records', 'type=ns : Query authoritative name servers'],
    },
    {
      name: 'netstat',
      syntax: 'netstat [-a] [-n] [-r] [-o]',
      purpose: 'Displays active TCP connections, listening socket ports, Ethernet network statistics, and the local IPv4 routing table.',
      example: 'netstat -an',
      outputSample: 'Active Connections\n  Proto  Local Address          Foreign Address        State\n  TCP    192.168.1.10:49210     192.168.2.10:80        ESTABLISHED\n  UDP    192.168.1.10:58102     *:*',
      keyFlags: ['-a : Displays all active connections and listening ports', '-n : Displays addresses and port numbers in numerical form'],
    },
  ];

  const handleCopy = (text: string) => {
    playSound('click');
    navigator.clipboard.writeText(text);
    setCopiedCmd(text);
    setTimeout(() => setCopiedCmd(null), 1500);
  };

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <span>DCN Core Networking Commands Playbook</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Experiment 01: Layer 3 & 4 Diagnostic CLI Utilities for Connectivity and Socket Inspection.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {commands.map(cmd => (
          <div
            key={cmd.name}
            className="p-5 rounded-xl bg-[#0d1322] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">
                    {cmd.name}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">CLI Tool</span>
                </div>
                <button
                  onClick={() => handleCopy(cmd.example)}
                  title="Copy command"
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {copiedCmd === cmd.example ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="font-mono text-xs text-slate-300 bg-black/40 p-2 rounded border border-slate-800/80 mb-2">
                {cmd.syntax}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {cmd.purpose}
              </p>

              <div className="space-y-1 text-[11px] font-mono text-slate-500">
                {cmd.keyFlags.map((flag, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span className="text-emerald-500/70">•</span>
                    <span>{flag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Try: <code className="text-emerald-300">{cmd.example}</code>
              </span>
              <button
                onClick={() => {
                  playSound('click');
                  onTestInTerminal(cmd.example);
                }}
                className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono rounded transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>Test in CLI</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
