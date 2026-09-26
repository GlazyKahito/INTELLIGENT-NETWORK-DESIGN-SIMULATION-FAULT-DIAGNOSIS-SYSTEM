// 10 Comprehensive Network Fault Scenarios for Fault Diagnosis Engine

import { FaultScenario } from '../types/diagnostics';

export const FAULT_SCENARIOS: FaultScenario[] = [
  {
    id: 'fault-bad-ip',
    title: 'Fault 01: Incorrect Host IP Address Allocation',
    category: 'Layer 3 (Network)',
    difficulty: 'Beginner',
    symptom: 'PC1 cannot ping PC2 or reach the Gateway. Local hosts cannot detect PC1.',
    expectedObservation: 'Destination Host Unreachable on ping; ipconfig reveals host is in an incompatible subnet.',
    hints: [
      'Run "ipconfig /all" on PC1 to inspect the assigned IPv4 address.',
      'Compare PC1 IP with the local LAN subnet (192.168.1.0/24).',
      'Verify if PC1 has an IP in a completely different network range.'
    ],
    rootCause: 'PC1 FastEthernet0 has been misconfigured with IP 10.0.0.99 instead of an address in the 192.168.1.0/24 subnet.',
    recommendedAction: 'Reassign PC1 IPv4 address to 192.168.1.10 with subnet mask 255.255.255.0.',
    confidence: 'Very High',
    affectedDeviceId: 'dev-pc1',
    testCommands: ['ipconfig', 'ping 192.168.1.1', 'ping 192.168.1.11'],
  },
  {
    id: 'fault-bad-subnet',
    title: 'Fault 02: Incompatible Subnet Mask Boundary',
    category: 'Layer 3 (Network)',
    difficulty: 'Intermediate',
    symptom: 'PC1 cannot communicate with remote server and exhibits abnormal ARP resolution with local hosts.',
    expectedObservation: 'Subnet mask misconfigured as 255.255.0.0 (/16) on a /24 network segment.',
    hints: [
      'Check the subnet mask on PC1 compared to Router R1 G0/0 (255.255.255.0).',
      'A /16 mask causes PC1 to assume remote addresses are on the local link, never querying the gateway.'
    ],
    rootCause: 'PC1 subnet mask is set to 255.255.0.0 (/16). PC1 erroneously treats 192.168.2.10 as a local broadcast partner rather than forwarding through the gateway.',
    recommendedAction: 'Update PC1 subnet mask to 255.255.255.0 (/24) to match the router default gateway interface.',
    confidence: 'High',
    affectedDeviceId: 'dev-pc1',
    testCommands: ['ipconfig', 'tracert 192.168.2.10', 'arp -a'],
  },
  {
    id: 'fault-bad-gateway',
    title: 'Fault 03: Invalid / Mismatched Default Gateway',
    category: 'Layer 3 (Network)',
    difficulty: 'Beginner',
    symptom: 'PC1 can communicate perfectly with PC2 on the local switch, but fails to reach the Enterprise Web Server.',
    expectedObservation: 'Local pings (192.168.1.11) succeed 100%, but ping to remote server (192.168.2.10) returns "Request timed out".',
    hints: [
      'Execute "ping 192.168.1.11" to check local LAN connectivity.',
      'Execute "ping 192.168.2.10" to check inter-VLAN routing.',
      'Inspect default gateway configuration in "ipconfig".'
    ],
    rootCause: 'PC1 has its Default Gateway configured as 192.168.1.254 (non-existent) instead of Router R1 interface 192.168.1.1.',
    recommendedAction: 'Change PC1 Default Gateway setting to 192.168.1.1.',
    confidence: 'Very High',
    affectedDeviceId: 'dev-pc1',
    testCommands: ['ipconfig', 'ping 192.168.1.1', 'ping 192.168.2.10', 'tracert 192.168.2.10'],
  },
  {
    id: 'fault-link-down',
    title: 'Fault 04: Physical Link Failure / Unplugged Cable',
    category: 'Layer 1 (Physical)',
    difficulty: 'Beginner',
    symptom: 'Total loss of connectivity between Switch SW1 and Router R1. Link activity LED is OFF.',
    expectedObservation: 'Packets cannot traverse past SW1. "Destination host unreachable" on all remote destinations.',
    hints: [
      'Inspect physical link status between SW1 and R1 in the topology visualizer.',
      'Check if the trunk/access cable has been unplugged or severed.'
    ],
    rootCause: 'The Ethernet cable connecting SW1 (Gi0/1) to R1 (Gi0/0) is disconnected (link state DOWN).',
    recommendedAction: 'Reconnect the physical patch cable between SW1 and Router R1.',
    confidence: 'Very High',
    affectedDeviceId: 'link-sw1-r1',
    testCommands: ['ping 192.168.1.1', 'tracert 192.168.2.10'],
  },
  {
    id: 'fault-interface-down',
    title: 'Fault 05: Router Interface Administratively Shutdown',
    category: 'Layer 2 (Data Link)',
    difficulty: 'Intermediate',
    symptom: 'Switch link light is green, but Router R1 G0/0 interface is not responding to ARP or ICMP.',
    expectedObservation: 'Terminal ping to 192.168.1.1 times out. ARP table shows incomplete entry for gateway.',
    hints: [
      'Inspect Router R1 interface status.',
      'Verify whether GigabitEthernet0/0 is administratively shutdown (no shutdown command required).'
    ],
    rootCause: 'Router R1 GigabitEthernet0/0 interface has been set to "Administratively DOWN".',
    recommendedAction: 'Enable interface GigabitEthernet0/0 on Router R1 ("no shutdown").',
    confidence: 'Very High',
    affectedDeviceId: 'dev-r1',
    testCommands: ['ping 192.168.1.1', 'arp -a'],
  },
  {
    id: 'fault-duplicate-ip',
    title: 'Fault 06: Duplicate IPv4 Address Conflict',
    category: 'Layer 3 (Network)',
    difficulty: 'Intermediate',
    symptom: 'Intermittent connection drops, ARP poisoning symptoms, and erratic ping responses between PC1 and PC2.',
    expectedObservation: 'Gratuitous ARP indicates address conflict; two different MAC addresses claim 192.168.1.10.',
    hints: [
      'Check IP address assigned to PC2 in the topology inspector.',
      'Compare PC2 IP with PC1 IP address.'
    ],
    rootCause: 'PC2 was inadvertently assigned the exact same IP address (192.168.1.10) as PC1, causing MAC address thrashing at SW1.',
    recommendedAction: 'Reconfigure PC2 IP address to a unique address: 192.168.1.11.',
    confidence: 'Very High',
    affectedDeviceId: 'dev-pc2',
    testCommands: ['ipconfig', 'arp -a', 'ping 192.168.1.10'],
  },
  {
    id: 'fault-dns-failure',
    title: 'Fault 07: DNS Server Resolution Failure',
    category: 'Layer 7 (Application)',
    difficulty: 'Intermediate',
    symptom: 'Users can ping the server via direct IP (192.168.2.10), but browsing to "server.local" fails.',
    expectedObservation: 'nslookup returns "DNS request timed out: server unreachable".',
    hints: [
      'Test raw IP ping: "ping 192.168.2.10" (succeeds).',
      'Test domain resolution: "nslookup server.local" (fails).',
      'Check DNS server IP configured on PC1.'
    ],
    rootCause: 'PC1 has an invalid DNS server IP address (192.168.99.1) configured, preventing name resolution for "server.local".',
    recommendedAction: 'Set PC1 Primary DNS server to 192.168.2.10 (Enterprise Server IP).',
    confidence: 'Very High',
    affectedDeviceId: 'dev-pc1',
    testCommands: ['nslookup server.local', 'ping 192.168.2.10', 'ipconfig'],
  },
  {
    id: 'fault-routing-missing',
    title: 'Fault 08: Missing Routing Table Entry on Core Router',
    category: 'Layer 3 (Network)',
    difficulty: 'Advanced',
    symptom: 'Router R1 receives packets for 192.168.2.0/24 subnet from PC1, but drops them and generates ICMP Net Unreachable.',
    expectedObservation: 'tracert reaches 192.168.1.1, but terminates immediately with "Destination net unreachable".',
    hints: [
      'Run "tracert 192.168.2.10" to identify which hop drops the packet.',
      'Inspect Router R1 routing table entries.'
    ],
    rootCause: 'Router R1 routing table has no route entry for subnet 192.168.2.0/24.',
    recommendedAction: 'Add static route for 192.168.2.0/24 via interface GigabitEthernet0/1 on Router R1.',
    confidence: 'High',
    affectedDeviceId: 'dev-r1',
    testCommands: ['tracert 192.168.2.10', 'ping 192.168.2.10'],
  },
  {
    id: 'fault-packet-loss',
    title: 'Fault 09: Heavy Physical Packet Loss / Link Degraded',
    category: 'Layer 1 (Physical)',
    difficulty: 'Intermediate',
    symptom: 'Severe latency spikes, packet drops (80% loss rate), and frequent TCP retransmissions.',
    expectedObservation: 'Ping shows 4 packets transmitted, 1 received (75% loss); erratic RTT varying between 8ms and 450ms.',
    hints: [
      'Run "ping 192.168.2.10" and observe the packet loss percentage.',
      'Check the link quality and error rate between R1 and SW2.'
    ],
    rootCause: 'Severely degraded or pinched Cat6 cable between R1 and SW2 causing excessive CRC errors and 75% packet loss.',
    recommendedAction: 'Replace the faulty patch cable between R1 and SW2 with a certified Cat6 cable.',
    confidence: 'High',
    affectedDeviceId: 'link-r1-sw2',
    testCommands: ['ping 192.168.2.10', 'netstat'],
  },
  {
    id: 'fault-port-blocked',
    title: 'Fault 10: Transport Layer Service Down / Port Blocked',
    category: 'Layer 4 (Transport)',
    difficulty: 'Intermediate',
    symptom: 'ICMP Ping to Server 192.168.2.10 succeeds with 0% loss, but HTTP Web requests to port 80 are rejected.',
    expectedObservation: 'TCP 3-Way Handshake SYN receives RST-ACK flag response ("Connection Refused").',
    hints: [
      'Run "ping 192.168.2.10" (confirm Layer 3 is completely healthy).',
      'Check active TCP listening services on the server with "netstat".'
    ],
    rootCause: 'HTTP Web Service daemon on Enterprise Server (Port 80) is stopped.',
    recommendedAction: 'Start the HTTP Web Service on Enterprise Server.',
    confidence: 'Very High',
    affectedDeviceId: 'dev-server',
    testCommands: ['ping 192.168.2.10', 'netstat', 'nslookup server.local'],
  },
];
