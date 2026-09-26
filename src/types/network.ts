// Types for Data Communication and Networking (DCN) Lab

export type DeviceType = 'pc' | 'laptop' | 'switch' | 'router' | 'server';

export interface DeviceInterface {
  id: string;
  name: string; // e.g. "eth0", "GigabitEthernet0/0"
  macAddress: string;
  ipAddress: string;
  subnetMask: string;
  isUp: boolean;
  connectedToLinkId?: string;
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  x: number;
  y: number;
  interfaces: DeviceInterface[];
  defaultGateway?: string;
  dnsServer?: string;
  services?: {
    dns?: boolean;
    http?: boolean;
    dhcp?: boolean;
  };
  arpTable?: Record<string, string>; // IP -> MAC
  routingTable?: RoutingEntry[];
  customFault?: string; // Optional fault tag active on this device
}

export interface RoutingEntry {
  network: string; // e.g., "192.168.2.0"
  mask: string;    // e.g., "255.255.255.0"
  nextHop: string; // e.g., "192.168.1.1" or "Direct"
  interfaceName: string;
}

export type CableType = 'straight-through' | 'crossover' | 'fiber' | 'auto';

export interface NetworkLink {
  id: string;
  sourceDeviceId: string;
  sourceInterfaceId: string;
  targetDeviceId: string;
  targetInterfaceId: string;
  cableType: CableType;
  status: 'active' | 'down' | 'flapping';
  latencyMs: number;
  lossRate: number; // 0 to 1
}

export type NetworkProtocol = 'ICMP' | 'TCP' | 'UDP' | 'ARP' | 'DNS' | 'HTTP';

export interface PacketHeaderL2 {
  sourceMac: string;
  destMac: string;
  etherType: '0x0800 (IPv4)' | '0x0806 (ARP)';
  vlan?: number;
}

export interface PacketHeaderL3 {
  sourceIP: string;
  destIP: string;
  protocol: NetworkProtocol;
  ttl: number;
  totalLength: number;
  identification: number;
  flags: { df: boolean; mf: boolean };
}

export interface PacketHeaderL4 {
  sourcePort: number;
  destPort: number;
  seqNumber?: number;
  ackNumber?: number;
  flags?: {
    syn: boolean;
    ack: boolean;
    fin: boolean;
    rst: boolean;
    psh: boolean;
    urg: boolean;
  };
  windowSize?: number;
  checksum: string;
  length?: number; // for UDP
}

export interface SimulatedPacket {
  id: string;
  sourceDeviceId: string;
  targetDeviceId: string;
  protocol: NetworkProtocol;
  l2: PacketHeaderL2;
  l3: PacketHeaderL3;
  l4?: PacketHeaderL4;
  payload: string;
  status: 'transmitting' | 'received' | 'dropped' | 'rejected';
  dropReason?: string;
  timestamp: number;
  currentHopIndex: number;
  path: string[]; // deviceIds
  isReply?: boolean;
}

export interface NetworkValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  deviceId?: string;
  message: string;
  recommendation: string;
}
