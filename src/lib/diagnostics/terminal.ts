// Realistic Interactive Diagnostic Terminal Command Runner

import { NetworkDevice, NetworkLink } from '../../types/network';
import { FaultScenario } from '../../types/diagnostics';
import { findNetworkPath } from '../network/routing';
import { isSameSubnet, isValidIPv4 } from '../network/addressing';

export interface TerminalExecutionResult {
  output: string[];
  isError?: boolean;
  discoveredEvidence?: {
    command: string;
    inference: string;
  };
}

export function executeTerminalCommand(
  rawCommand: string,
  currentHostId: string,
  devices: NetworkDevice[],
  links: NetworkLink[],
  activeFault?: FaultScenario | null
): TerminalExecutionResult {
  const trimmed = rawCommand.trim();
  if (!trimmed) return { output: [] };

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const currentHost = devices.find(d => d.id === currentHostId) || devices[0];
  const hostIface = currentHost?.interfaces[0];

  switch (cmd) {
    case 'help':
      return {
        output: [
          'DCN LABORATORY DIAGNOSTIC TERMINAL — SUPPORTED COMMANDS:',
          '  ipconfig [/all]        Display network interface configuration and IP parameters',
          '  ping <ip | hostname>   Send ICMP Echo Request packets to verify host connectivity',
          '  tracert <ip | host>    Trace Layer 3 network hops to destination',
          '  arp -a                 Display local Address Resolution Protocol (ARP) cache table',
          '  nslookup <hostname>    Query configured DNS server for domain name resolution',
          '  netstat [-an]          Display active TCP/UDP network connections and socket ports',
          '  route print            Display local IP routing table and gateway routes',
          '  clear                  Clear the terminal console window',
        ],
      };

    case 'clear':
      return { output: ['__CLEAR__'] };

    case 'ipconfig': {
      const isAll = args.includes('/all') || args.includes('-all');
      const lines = [
        'Windows IP Configuration',
        '',
        `Ethernet adapter ${hostIface?.name || 'Ethernet'}:`,
        `   Connection-specific DNS Suffix  . : somaiya.edu`,
      ];

      if (isAll) {
        lines.push(`   Physical Address (MAC)  . . . . : ${hostIface?.macAddress || '00:00:00:00:00:00'}`);
        lines.push(`   DHCP Enabled. . . . . . . . . . : No`);
        lines.push(`   Autoconfiguration Enabled . . . : Yes`);
      }

      lines.push(`   IPv4 Address. . . . . . . . . . : ${hostIface?.ipAddress || '0.0.0.0'}`);
      lines.push(`   Subnet Mask . . . . . . . . . . : ${hostIface?.subnetMask || '0.0.0.0'}`);
      lines.push(`   Default Gateway . . . . . . . . : ${currentHost.defaultGateway || 'None'}`);

      if (isAll) {
        lines.push(`   DNS Servers . . . . . . . . . . : ${currentHost.dnsServer || 'None'}`);
        lines.push(`   NetBIOS over Tcpip. . . . . . . : Enabled`);
      }

      // Check evidence
      let inference: string | undefined;
      if (activeFault?.id === 'fault-bad-ip') {
        inference = `PC1 IP is configured as ${hostIface?.ipAddress}, which is not in the required 192.168.1.0/24 subnet.`;
      } else if (activeFault?.id === 'fault-bad-subnet') {
        inference = `Subnet mask is ${hostIface?.subnetMask} instead of standard 255.255.255.0 (/24).`;
      } else if (activeFault?.id === 'fault-bad-gateway') {
        inference = `Default Gateway is set to ${currentHost.defaultGateway} which does not match router R1 (192.168.1.1).`;
      }

      return {
        output: lines,
        discoveredEvidence: inference ? { command: 'ipconfig', inference } : undefined,
      };
    }

    case 'arp': {
      if (args[0] === '-a' || args.length === 0) {
        const lines = [
          `Interface: ${hostIface?.ipAddress} --- 0x2`,
          '  Internet Address      Physical Address      Type',
        ];

        if (currentHost.arpTable && Object.keys(currentHost.arpTable).length > 0) {
          Object.entries(currentHost.arpTable).forEach(([ip, mac]) => {
            lines.push(`  ${ip.padEnd(20)}  ${mac.padEnd(20)}  dynamic`);
          });
        } else {
          lines.push('  No ARP entries found.');
        }

        let inference: string | undefined;
        if (activeFault?.id === 'fault-interface-down') {
          inference = 'ARP table lacks active MAC resolution for Gateway 192.168.1.1 (Gateway interface down).';
        } else if (activeFault?.id === 'fault-duplicate-ip') {
          inference = 'ARP conflict detected: IP 192.168.1.10 has overlapping MAC announcements.';
        }

        return {
          output: lines,
          discoveredEvidence: inference ? { command: 'arp -a', inference } : undefined,
        };
      }
      return { output: ['Usage: arp -a'] };
    }

    case 'nslookup': {
      const domain = args[0] || 'server.local';
      const dnsServer = currentHost.dnsServer || 'None';

      const lines = [
        `Server:  ${dnsServer === '192.168.2.10' ? 'ns1.somaiya.edu' : 'Unknown'}`,
        `Address: ${dnsServer}`,
        '',
      ];

      // Check if DNS server is reachable
      const srvDev = devices.find(d => d.services?.dns && d.interfaces.some(i => i.ipAddress === dnsServer));
      const pathRes = srvDev ? findNetworkPath(currentHost.id, srvDev.id, devices, links) : { success: false };

      if (dnsServer === '192.168.2.10' && pathRes.success && srvDev?.services?.dns) {
        if (domain.toLowerCase() === 'server.local' || domain.toLowerCase() === 'somaiya.edu') {
          lines.push(`Name:    ${domain}`);
          lines.push('Address: 192.168.2.10');
          return { output: lines };
        } else {
          lines.push(`*** UnKnown can't find ${domain}: Non-existent domain`);
          return { output: lines, isError: true };
        }
      } else {
        lines.push('DNS request timed out.');
        lines.push('    timeout was 2 seconds.');
        lines.push(`*** Request to ${dnsServer} timed-out`);

        return {
          output: lines,
          isError: true,
          discoveredEvidence: {
            command: `nslookup ${domain}`,
            inference: `DNS query failed because DNS server ${dnsServer} is unreachable or misconfigured.`,
          },
        };
      }
    }

    case 'netstat': {
      const lines = [
        'Active Connections',
        '',
        '  Proto  Local Address          Foreign Address        State',
      ];

      if (activeFault?.id === 'fault-port-blocked') {
        lines.push('  TCP    192.168.1.10:49210     192.168.2.10:80        SYN_SENT');
        lines.push('  TCP    192.168.1.10:49211     192.168.2.10:443       CLOSED');
        return {
          output: lines,
          discoveredEvidence: {
            command: 'netstat',
            inference: 'HTTP Web port 80 state is SYN_SENT without acknowledgement: web server daemon is inactive.',
          },
        };
      }

      lines.push('  TCP    192.168.1.10:49210     192.168.2.10:80        ESTABLISHED');
      lines.push('  TCP    192.168.1.10:49212     192.168.2.10:53        TIME_WAIT');
      lines.push('  UDP    192.168.1.10:58102     *:*');
      return { output: lines };
    }

    case 'route': {
      if (args[0] === 'print' || args.length === 0) {
        return {
          output: [
            '===========================================================================',
            'IPv4 Route Table',
            '===========================================================================',
            'Active Routes:',
            'Network Destination        Netmask          Gateway       Interface  Metric',
            `          0.0.0.0          0.0.0.0      ${currentHost.defaultGateway || 'On-link'}    ${hostIface?.ipAddress}      25`,
            `      127.0.0.0        255.0.0.0         On-link         127.0.0.1     331`,
            `    192.168.1.0    255.255.255.0         On-link    ${hostIface?.ipAddress}      281`,
            `    192.168.1.255  255.255.255.255         On-link    ${hostIface?.ipAddress}      281`,
            '===========================================================================',
          ],
        };
      }
      return { output: ['Usage: route print'] };
    }

    case 'ping': {
      if (!args[0]) {
        return { output: ['Usage: ping <IPv4 Address | Hostname> [-n count]'] };
      }

      let target = args[0];
      if (target.toLowerCase() === 'server.local') {
        if (currentHost.dnsServer === '192.168.2.10' && activeFault?.id !== 'fault-dns-failure') {
          target = '192.168.2.10';
        } else {
          return {
            output: [`Ping request could not find host ${args[0]}. Please check the name and try again.`],
            isError: true,
            discoveredEvidence: {
              command: `ping ${args[0]}`,
              inference: 'Host name resolution failed due to missing or misconfigured DNS server.',
            },
          };
        }
      }

      // Find destination device
      const destDev = devices.find(d => d.interfaces.some(i => i.ipAddress === target));

      // Resolve path
      const pathRes = destDev ? findNetworkPath(currentHost.id, destDev.id, devices, links) : null;

      const lines = [
        `Pinging ${target} with 32 bytes of data:`,
      ];

      // Handle severe packet loss fault
      if (activeFault?.id === 'fault-packet-loss' && pathRes?.success) {
        lines.push('Reply from 192.168.2.10: bytes=32 time=428ms TTL=62');
        lines.push('Request timed out.');
        lines.push('Request timed out.');
        lines.push('Request timed out.');
        lines.push('');
        lines.push(`Ping statistics for ${target}:`);
        lines.push('    Packets: Sent = 4, Received = 1, Lost = 3 (75% loss),');
        lines.push('Approximate round trip times in milli-seconds:');
        lines.push('    Minimum = 428ms, Maximum = 428ms, Average = 428ms');

        return {
          output: lines,
          discoveredEvidence: {
            command: `ping ${target}`,
            inference: '75% packet loss observed. Severe link degradation or physical interference present.',
          },
        };
      }

      if (pathRes && pathRes.success) {
        const rtt = Math.max(1, (pathRes.path.length - 1) * 2);
        for (let i = 0; i < 4; i++) {
          lines.push(`Reply from ${target}: bytes=32 time=${rtt}ms TTL=${pathRes.ttl}`);
        }
        lines.push('');
        lines.push(`Ping statistics for ${target}:`);
        lines.push('    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),');
        lines.push('Approximate round trip times in milli-seconds:');
        lines.push(`    Minimum = ${rtt}ms, Maximum = ${rtt}ms, Average = ${rtt}ms`);

        return { output: lines };
      } else {
        const failureReason = pathRes?.failureReason || 'Destination host unreachable.';
        for (let i = 0; i < 4; i++) {
          lines.push(failureReason.includes('unreachable') ? `Reply from ${hostIface?.ipAddress}: Destination host unreachable.` : 'Request timed out.');
        }
        lines.push('');
        lines.push(`Ping statistics for ${target}:`);
        lines.push('    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),');

        let inference = `Ping to ${target} failed with 100% loss: ${failureReason}`;
        if (target === '192.168.1.1' && activeFault?.id === 'fault-interface-down') {
          inference = 'Gateway router 192.168.1.1 is not responding (Interface G0/0 is administratively down).';
        }

        return {
          output: lines,
          isError: true,
          discoveredEvidence: {
            command: `ping ${target}`,
            inference,
          },
        };
      }
    }

    case 'tracert': {
      if (!args[0]) {
        return { output: ['Usage: tracert <IPv4 Address | Hostname>'] };
      }

      let target = args[0];
      if (target.toLowerCase() === 'server.local') target = '192.168.2.10';

      const destDev = devices.find(d => d.interfaces.some(i => i.ipAddress === target));
      const pathRes = destDev ? findNetworkPath(currentHost.id, destDev.id, devices, links) : null;

      const lines = [
        `Tracing route to ${target} over a maximum of 30 hops:`,
        '',
      ];

      if (pathRes && pathRes.success) {
        let hopNum = 1;
        pathRes.path.forEach((devId, idx) => {
          if (idx === 0) return; // skip localhost
          const dev = devices.find(d => d.id === devId)!;
          if (dev.type === 'switch') return; // switches are transparent at L2
          const ip = dev.interfaces[0]?.ipAddress || 'unknown';
          lines.push(`  ${hopNum}     ${hopNum * 2} ms     ${hopNum * 2} ms     ${hopNum * 2} ms  ${dev.name} [${ip}]`);
          hopNum++;
        });
        lines.push('');
        lines.push('Trace complete.');
        return { output: lines };
      } else {
        // Output partial hops before failure
        if (pathRes && pathRes.path.length > 1) {
          let hopNum = 1;
          pathRes.path.forEach((devId, idx) => {
            if (idx === 0) return;
            const dev = devices.find(d => d.id === devId);
            if (dev && dev.type !== 'switch') {
              lines.push(`  ${hopNum}     ${hopNum * 2} ms     ${hopNum * 2} ms     ${hopNum * 2} ms  ${dev.name} [${dev.interfaces[0]?.ipAddress}]`);
              hopNum++;
            }
          });
        }
        lines.push('  *        *        *     Request timed out.');
        lines.push('  *        *        *     Request timed out.');
        lines.push('');
        lines.push('Trace failed: Destination unreachable.');

        return {
          output: lines,
          isError: true,
          discoveredEvidence: {
            command: `tracert ${target}`,
            inference: `Trace stopped along the path: ${pathRes?.failureReason || 'Packet dropped in transit'}.`,
          },
        };
      }
    }

    default:
      return {
        output: [
          `'${cmd}' is not recognized as an internal or external command,`,
          'operable program or batch file. Type "help" for a list of commands.',
        ],
        isError: true,
      };
  }
}
