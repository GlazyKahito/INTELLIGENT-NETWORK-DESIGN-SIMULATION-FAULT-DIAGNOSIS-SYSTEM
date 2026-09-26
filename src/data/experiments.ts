// DCN Laboratory Experiments Metadata and Mapping

export interface ExperimentMeta {
  id: number;
  code: string;
  title: string;
  category: string;
  duration: string;
  summary: string;
  keyTools: string[];
  competencies: string[];
  icon: string;
}

export const DCN_EXPERIMENTS: ExperimentMeta[] = [
  {
    id: 1,
    code: 'EXP-01',
    title: 'Networking Commands & Connectivity Diagnosis',
    category: 'Layer 3 & 4 Diagnostic Tools',
    duration: '2 Hours',
    summary: 'Execution and interpretation of core command-line network utilities including ping, ipconfig, tracert, arp, nslookup, and netstat for connectivity troubleshooting and route tracing.',
    keyTools: ['ping', 'ipconfig /all', 'tracert', 'arp -a', 'nslookup', 'netstat -an'],
    competencies: [
      'Analyze ICMP round-trip times and packet loss metrics',
      'Inspect NIC IP configuration, subnet masks, and default gateways',
      'Trace Layer 3 hop-by-hop forwarding routes to detect routing bottlenecks',
      'Query and diagnose ARP cache mappings between IPv4 and MAC addresses',
      'Perform DNS lookups and inspect active TCP/UDP socket connections'
    ],
    icon: 'Terminal',
  },
  {
    id: 2,
    code: 'EXP-02',
    title: 'LAN Cable Fabrication & Pinout Standards',
    category: 'Layer 1 Physical Media',
    duration: '2 Hours',
    summary: 'Study and virtual fabrication of unshielded twisted pair (UTP Cat5e/Cat6) cables with RJ45 modular connectors adhering to ANSI/TIA-568-A and ANSI/TIA-568-B wiring standards.',
    keyTools: ['RJ-45 8P8C Connector', 'UTP Cat6 Cable', 'Crimping Tool', 'Cable Continuity Tester'],
    competencies: [
      'Master the T568A color sequence: White-Green, Green, White-Orange, Blue, White-Blue, Orange, White-Brown, Brown',
      'Master the T568B color sequence: White-Orange, Orange, White-Green, Blue, White-Blue, Green, White-Brown, Brown',
      'Differentiate between Straight-Through cables (MDI to MDI-X) and Crossover cables (MDI to MDI)',
      'Diagnose physical layer cable faults including open pairs, short circuits, and reversed pinouts'
    ],
    icon: 'Cable',
  },
  {
    id: 3,
    code: 'EXP-03',
    title: 'Wireshark Protocol Analysis & Packet Decapsulation',
    category: 'Packet Capture & Inspection',
    duration: '3 Hours',
    summary: 'Deep-packet inspection of live network frames capturing Layer 2 Ethernet frames, Layer 3 IPv4 datagrams, and Layer 4 TCP/UDP segments with protocol hierarchy analysis.',
    keyTools: ['Wireshark', 'Promiscuous Mode Capture', 'BPF Capture Filters', 'Display Filters'],
    competencies: [
      'Dissect Ethernet II frame headers (Preamble, SFD, Destination MAC, Source MAC, EtherType)',
      'Analyze IPv4 packet structure (IHL, DSCP, Total Length, TTL, Protocol ID, Checksum)',
      'Inspect protocol encapsulation hierarchies across OSI and TCP/IP stack layers',
      'Identify malicious or abnormal traffic patterns and protocol anomalies'
    ],
    icon: 'Search',
  },
  {
    id: 4,
    code: 'EXP-04',
    title: 'TCP Header Architecture & 3-Way Handshake',
    category: 'Layer 4 Transport Layer',
    duration: '2.5 Hours',
    summary: 'Exploration of the 20-byte Transmission Control Protocol header structure, sequence and acknowledgement tracking, window flow control, and connection establishment/termination.',
    keyTools: ['TCP Packet Dissector', 'Handshake Visualizer', 'Flags Bitfield Inspector'],
    competencies: [
      'Understand the TCP 3-Way Handshake mechanism (SYN -> SYN-ACK -> ACK)',
      'Decode control flags: SYN, ACK, FIN, RST, PSH, URG',
      'Analyze byte-stream sequence numbering, acknowledgement calculations, and sliding window sizes',
      'Simulate connection teardown sequences (FIN -> ACK -> FIN -> ACK)'
    ],
    icon: 'ShieldCheck',
  },
  {
    id: 5,
    code: 'EXP-05',
    title: 'IPv4 Address Classes, Subnetting & CIDR',
    category: 'Layer 3 Logical Addressing',
    duration: '3 Hours',
    summary: 'Mathematical and conceptual analysis of classful IPv4 addressing (Classes A, B, C, D, E), Classless Inter-Domain Routing (CIDR), network and host portions, and VLSM.',
    keyTools: ['CIDR Subnet Calculator', 'Binary ANDing Engine', 'Class Identifier Matrix'],
    competencies: [
      'Identify classful ranges: Class A (1-126), Class B (128-191), Class C (192-223)',
      'Calculate network addresses, broadcast addresses, and usable host count via bitwise AND operations',
      'Apply private address ranges (RFC 1918: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)',
      'Solve subnetting problems with variable-length subnet masks (VLSM)'
    ],
    icon: 'Network',
  },
  {
    id: 6,
    code: 'EXP-06',
    title: 'Hamming Code Error Detection & Correction',
    category: 'Layer 2 Error Control',
    duration: '2.5 Hours',
    summary: 'Implementation and analysis of Richard Hamming’s (7,4) linear block error-correcting code for single-bit error detection and automatic forward error correction (FEC).',
    keyTools: ['Hamming (7,4) Matrix Engine', 'Parity Bit Calculator', 'Syndrome Bit Vector Analyzer'],
    competencies: [
      'Calculate parity bit positions at powers of 2 (positions 1, 2, 4)',
      'Construct parity coverage equations: P1 (1,3,5,7), P2 (2,3,6,7), P4 (4,5,6,7)',
      'Inject single-bit transmission corruption and compute the 3-bit syndrome word (S4, S2, S1)',
      'Identify exact faulty bit positions and execute mathematical bit-inversion correction'
    ],
    icon: 'Binary',
  },
  {
    id: 7,
    code: 'EXP-07',
    title: 'UDP Protocol & Connectionless Communication',
    category: 'Layer 4 Transport Layer',
    duration: '2 Hours',
    summary: 'Study of the User Datagram Protocol (UDP) 8-byte minimal header, connectionless transmission, lack of acknowledgements, and low-latency performance in real-time streaming and DNS.',
    keyTools: ['UDP Datagram Inspector', 'TCP vs UDP Comparative Matrix', 'Jitter & Latency Simulator'],
    competencies: [
      'Dissect the compact 8-byte UDP header (Source Port, Destination Port, Length, Checksum)',
      'Compare TCP reliability vs UDP speed and zero-handshake overhead',
      'Examine real-world protocol usage: DNS (Port 53), DHCP (Port 67/68), VoIP, and Video Streaming',
      'Analyze the impact of network congestion and packet drops on connectionless datagrams'
    ],
    icon: 'Zap',
  },
  {
    id: 8,
    code: 'EXP-08',
    title: 'Network Design, Simulation & Fault Diagnosis (Capstone)',
    category: 'End-to-End System Integration',
    duration: '4 Hours',
    summary: 'The central laboratory experiment synthesizing Experiments 1 through 7 into a complete interactive network design, packet simulation, fault injection, and automated diagnosis environment.',
    keyTools: ['Visual Topology Canvas', 'Simulation Engine', 'Intelligent Diagnostic Engine', 'Interactive CLI'],
    competencies: [
      'Design hierarchical LAN architectures with end-devices, access switches, and routers',
      'Configure valid IP parameters and verify inter-subnet routing',
      'Simulate end-to-end packet transmission with real-time ICMP/TCP/UDP decapsulation',
      'Troubleshoot 10 realistic multi-layer network faults using deductive diagnostic workflows'
    ],
    icon: 'Cpu',
  },
];
