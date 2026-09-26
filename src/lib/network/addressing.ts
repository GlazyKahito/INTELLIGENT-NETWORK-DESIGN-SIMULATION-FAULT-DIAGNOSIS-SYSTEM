// IPv4 Addressing, Class Detection, and Subnet Calculation Library

export function isValidIPv4(ip: string): boolean {
  if (!ip) return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    if (!/^\d+$/.test(part)) return false;
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255 && (part === '0' || !part.startsWith('0'));
  });
}

export function ipToNumber(ip: string): number {
  return ip.split('.').reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

export function numberToIp(num: number): string {
  return [
    (num >>> 24) & 255,
    (num >>> 16) & 255,
    (num >>> 8) & 255,
    num & 255,
  ].join('.');
}

export type IPClass = 'Class A' | 'Class B' | 'Class C' | 'Class D (Multicast)' | 'Class E (Experimental)' | 'Invalid';

export function getIPClass(ip: string): IPClass {
  if (!isValidIPv4(ip)) return 'Invalid';
  const firstOctet = parseInt(ip.split('.')[0], 10);
  if (firstOctet >= 1 && firstOctet <= 126) return 'Class A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'Class B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'Class C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'Class D (Multicast)';
  if (firstOctet >= 240 && firstOctet <= 255) return 'Class E (Experimental)';
  return 'Invalid';
}

export function getDefaultSubnetMask(ip: string): string {
  const ipClass = getIPClass(ip);
  switch (ipClass) {
    case 'Class A': return '255.0.0.0';
    case 'Class B': return '255.255.0.0';
    case 'Class C': return '255.255.255.0';
    default: return '255.255.255.0';
  }
}

export function isSameSubnet(ip1: string, ip2: string, mask: string): boolean {
  if (!isValidIPv4(ip1) || !isValidIPv4(ip2) || !isValidIPv4(mask)) return false;
  const num1 = ipToNumber(ip1);
  const num2 = ipToNumber(ip2);
  const maskNum = ipToNumber(mask);
  return (num1 & maskNum) === (num2 & maskNum);
}

export function getNetworkAddress(ip: string, mask: string): string {
  if (!isValidIPv4(ip) || !isValidIPv4(mask)) return '';
  return numberToIp(ipToNumber(ip) & ipToNumber(mask));
}

export function getBroadcastAddress(ip: string, mask: string): string {
  if (!isValidIPv4(ip) || !isValidIPv4(mask)) return '';
  const netNum = ipToNumber(ip) & ipToNumber(mask);
  const invertedMask = ~ipToNumber(mask) >>> 0;
  return numberToIp((netNum | invertedMask) >>> 0);
}

export function getSubnetDetails(ip: string, mask: string) {
  if (!isValidIPv4(ip) || !isValidIPv4(mask)) return null;
  const netAddr = getNetworkAddress(ip, mask);
  const bcastAddr = getBroadcastAddress(ip, mask);
  const netNum = ipToNumber(netAddr);
  const bcastNum = ipToNumber(bcastAddr);
  const totalHosts = Math.max(0, bcastNum - netNum + 1);
  const usableHosts = Math.max(0, totalHosts - 2);
  const firstHost = usableHosts > 0 ? numberToIp(netNum + 1) : 'None';
  const lastHost = usableHosts > 0 ? numberToIp(bcastNum - 1) : 'None';
  
  // Calculate CIDR prefix length
  const maskNum = ipToNumber(mask);
  let prefix = 0;
  for (let i = 31; i >= 0; i--) {
    if ((maskNum & (1 << i)) !== 0) prefix++;
    else break;
  }

  // Check if private IP
  const firstOctet = parseInt(ip.split('.')[0], 10);
  const secondOctet = parseInt(ip.split('.')[1], 10);
  let isPrivate = false;
  if (firstOctet === 10) isPrivate = true;
  else if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) isPrivate = true;
  else if (firstOctet === 192 && secondOctet === 168) isPrivate = true;

  return {
    ip,
    mask,
    prefix: `/${prefix}`,
    ipClass: getIPClass(ip),
    networkAddress: netAddr,
    broadcastAddress: bcastAddr,
    firstUsableHost: firstHost,
    lastUsableHost: lastHost,
    usableHosts,
    isPrivate,
  };
}
