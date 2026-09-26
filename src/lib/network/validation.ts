// Network Topology Validation Engine

import { NetworkDevice, NetworkLink, NetworkValidationIssue } from '../../types/network';
import { isValidIPv4, isSameSubnet } from './addressing';

export function validateNetworkTopology(
  devices: NetworkDevice[],
  links: NetworkLink[]
): NetworkValidationIssue[] {
  const issues: NetworkValidationIssue[] = [];

  // Map of device connections
  const connectedDeviceIds = new Set<string>();
  links.forEach(l => {
    if (l.status === 'active') {
      connectedDeviceIds.add(l.sourceDeviceId);
      connectedDeviceIds.add(l.targetDeviceId);
    }
  });

  // Track all IP addresses to detect duplicates
  const ipOccurrences = new Map<string, string[]>(); // ip -> deviceNames[]

  devices.forEach(device => {
    // 1. Check if device is isolated / disconnected
    if (!connectedDeviceIds.has(device.id)) {
      issues.push({
        id: `iso-${device.id}`,
        severity: 'warning',
        deviceId: device.id,
        message: `${device.name} is completely disconnected from the network.`,
        recommendation: `Connect ${device.name} to a switch or router using an Ethernet cable.`,
      });
    }

    // 2. Validate interfaces
    device.interfaces.forEach(iface => {
      // Switches generally operate at Layer 2 without host IPs, unless managed
      if (device.type !== 'switch') {
        if (!iface.ipAddress) {
          issues.push({
            id: `no-ip-${iface.id}`,
            severity: 'error',
            deviceId: device.id,
            message: `${device.name} interface ${iface.name} has no IP address assigned.`,
            recommendation: `Assign a valid IPv4 address (e.g., 192.168.1.10) to ${iface.name}.`,
          });
        } else if (!isValidIPv4(iface.ipAddress)) {
          issues.push({
            id: `inv-ip-${iface.id}`,
            severity: 'error',
            deviceId: device.id,
            message: `${device.name} has an invalid IPv4 format: "${iface.ipAddress}".`,
            recommendation: `Provide a valid 4-octet IPv4 address (e.g., 192.168.1.15).`,
          });
        } else {
          // Track for duplicates
          const list = ipOccurrences.get(iface.ipAddress) || [];
          list.push(device.name);
          ipOccurrences.set(iface.ipAddress, list);
        }

        if (iface.ipAddress && !isValidIPv4(iface.subnetMask)) {
          issues.push({
            id: `inv-mask-${iface.id}`,
            severity: 'error',
            deviceId: device.id,
            message: `${device.name} has an invalid subnet mask: "${iface.subnetMask}".`,
            recommendation: `Use a standard mask such as 255.255.255.0 (/24).`,
          });
        }

        if (!iface.isUp) {
          issues.push({
            id: `if-down-${iface.id}`,
            severity: 'warning',
            deviceId: device.id,
            message: `${device.name} interface ${iface.name} is administratively DOWN.`,
            recommendation: `Enable interface ${iface.name} to allow packet transmission.`,
          });
        }
      }
    });

    // 3. Default Gateway validation for end hosts (PC, Laptop, Server)
    if (device.type === 'pc' || device.type === 'laptop' || device.type === 'server') {
      const primaryInterface = device.interfaces[0];
      if (device.defaultGateway) {
        if (!isValidIPv4(device.defaultGateway)) {
          issues.push({
            id: `inv-gw-${device.id}`,
            severity: 'error',
            deviceId: device.id,
            message: `${device.name} default gateway "${device.defaultGateway}" is invalid.`,
            recommendation: `Enter a valid gateway router IP address in the local subnet.`,
          });
        } else if (
          primaryInterface &&
          isValidIPv4(primaryInterface.ipAddress) &&
          isValidIPv4(primaryInterface.subnetMask) &&
          !isSameSubnet(primaryInterface.ipAddress, device.defaultGateway, primaryInterface.subnetMask)
        ) {
          issues.push({
            id: `gw-subnet-mismatch-${device.id}`,
            severity: 'error',
            deviceId: device.id,
            message: `Gateway ${device.defaultGateway} is not on the same subnet as ${device.name} (${primaryInterface.ipAddress} / ${primaryInterface.subnetMask}).`,
            recommendation: `Host cannot reach its default gateway. Assign a gateway IP inside the local subnet (e.g. 192.168.1.1).`,
          });
        }
      } else {
        issues.push({
          id: `missing-gw-${device.id}`,
          severity: 'info',
          deviceId: device.id,
          message: `${device.name} does not have a default gateway configured.`,
          recommendation: `End-hosts without a gateway cannot communicate outside their local subnet.`,
        });
      }
    }
  });

  // Check duplicate IPs
  ipOccurrences.forEach((devList, ip) => {
    if (devList.length > 1) {
      issues.push({
        id: `dup-ip-${ip}`,
        severity: 'error',
        message: `Duplicate IP address collision detected: ${ip} is assigned to [${devList.join(', ')}].`,
        recommendation: `Every network interface on a shared segment must have a unique IP address. Change one of the assigned IPs.`,
      });
    }
  });

  return issues;
}
