// Routing, Path Finding, and Next-Hop Resolution

import { NetworkDevice, NetworkLink } from '../../types/network';
import { isSameSubnet } from './addressing';

export interface RouteResolution {
  success: boolean;
  path: string[]; // sequence of device IDs traversed
  failureReason?: string;
  failingDeviceId?: string;
  failingLinkId?: string;
  ttl: number;
}

export function findNetworkPath(
  sourceDeviceId: string,
  targetDeviceId: string,
  devices: NetworkDevice[],
  links: NetworkLink[]
): RouteResolution {
  const deviceMap = new Map<string, NetworkDevice>(devices.map(d => [d.id, d]));
  const src = deviceMap.get(sourceDeviceId);
  const dst = deviceMap.get(targetDeviceId);

  if (!src || !dst) {
    return { success: false, path: [], failureReason: 'Source or Destination device not found.', ttl: 64 };
  }

  const srcIface = src.interfaces[0];
  const dstIface = dst.interfaces[0];

  if (!srcIface || !srcIface.isUp) {
    return {
      success: false,
      path: [src.id],
      failingDeviceId: src.id,
      failureReason: `Host interface ${srcIface?.name || 'eth0'} is administratively DOWN.`,
      ttl: 64
    };
  }

  // Check if same subnet
  const sameSubnet = isSameSubnet(srcIface.ipAddress, dstIface?.ipAddress || '', srcIface.subnetMask);

  // If different subnets, end-host requires default gateway
  if (!sameSubnet && (src.type === 'pc' || src.type === 'laptop' || src.type === 'server')) {
    if (!src.defaultGateway) {
      return {
        success: false,
        path: [src.id],
        failingDeviceId: src.id,
        failureReason: `Host has no Default Gateway configured to reach remote subnet ${dstIface?.ipAddress || 'destination'}.`,
        ttl: 64
      };
    }

    if (!isSameSubnet(srcIface.ipAddress, src.defaultGateway, srcIface.subnetMask)) {
      return {
        success: false,
        path: [src.id],
        failingDeviceId: src.id,
        failureReason: `Default Gateway (${src.defaultGateway}) is unreachable: not on local subnet (${srcIface.ipAddress}/${srcIface.subnetMask}).`,
        ttl: 64
      };
    }
  }

  // Build Adjacency Graph from active links
  const adj = new Map<string, { neighborId: string; link: NetworkLink }[]>();
  devices.forEach(d => adj.set(d.id, []));

  links.forEach(link => {
    if (link.status === 'active') {
      const srcList = adj.get(link.sourceDeviceId) || [];
      srcList.push({ neighborId: link.targetDeviceId, link });
      adj.set(link.sourceDeviceId, srcList);

      const tgtList = adj.get(link.targetDeviceId) || [];
      tgtList.push({ neighborId: link.sourceDeviceId, link });
      adj.set(link.targetDeviceId, tgtList);
    }
  });

  // Check physical connection of source
  const srcConnections = adj.get(sourceDeviceId) || [];
  if (srcConnections.length === 0) {
    return {
      success: false,
      path: [src.id],
      failingDeviceId: src.id,
      failureReason: `Physical cable disconnected: ${src.name} has no active link.`,
      ttl: 64
    };
  }

  // BFS to find the shortest physical hop path
  const queue: { currentId: string; path: string[] }[] = [{ currentId: sourceDeviceId, path: [sourceDeviceId] }];
  const visited = new Set<string>([sourceDeviceId]);
  let foundPath: string[] | null = null;

  while (queue.length > 0) {
    const { currentId, path } = queue.shift()!;

    if (currentId === targetDeviceId) {
      foundPath = path;
      break;
    }

    const neighbors = adj.get(currentId) || [];
    for (const edge of neighbors) {
      if (!visited.has(edge.neighborId)) {
        visited.add(edge.neighborId);
        queue.push({
          currentId: edge.neighborId,
          path: [...path, edge.neighborId]
        });
      }
    }
  }

  if (!foundPath) {
    return {
      success: false,
      path: [src.id],
      failureReason: `Network unreachable: No active physical or switching path between ${src.name} and ${dst.name}.`,
      ttl: 64
    };
  }

  // Validate intermediate nodes along the path (e.g. routers routing tables, interfaces)
  let currentTtl = 64;
  for (let i = 0; i < foundPath.length; i++) {
    const devId = foundPath[i];
    const dev = deviceMap.get(devId)!;

    // Check device interfaces
    const anyUp = dev.interfaces.some(iface => iface.isUp);
    if (!anyUp && dev.interfaces.length > 0) {
      return {
        success: false,
        path: foundPath.slice(0, i + 1),
        failingDeviceId: dev.id,
        failureReason: `${dev.name} interface is down. Dropped packet at ${dev.name}.`,
        ttl: currentTtl
      };
    }

    // If Router, decrement TTL and check routing
    if (dev.type === 'router') {
      currentTtl -= 1;
      if (currentTtl <= 0) {
        return {
          success: false,
          path: foundPath.slice(0, i + 1),
          failingDeviceId: dev.id,
          failureReason: `Time to live (TTL) expired in transit at ${dev.name}.`,
          ttl: 0
        };
      }

      // Check if router has route to destination network
      if (dev.routingTable && dev.routingTable.length > 0 && dstIface?.ipAddress) {
        const hasRoute = dev.routingTable.some(r => {
          if (r.network === '0.0.0.0') return true; // Default route
          return isSameSubnet(dstIface.ipAddress, r.network, r.mask);
        });

        if (!hasRoute) {
          return {
            success: false,
            path: foundPath.slice(0, i + 1),
            failingDeviceId: dev.id,
            failureReason: `Destination network unreachable: ${dev.name} has no routing table entry for ${dstIface.ipAddress}.`,
            ttl: currentTtl
          };
        }
      }
    }
  }

  // Check destination interface
  if (dstIface && !dstIface.isUp) {
    return {
      success: false,
      path: foundPath,
      failingDeviceId: dst.id,
      failureReason: `Destination host ${dst.name} interface is disabled.`,
      ttl: currentTtl
    };
  }

  return {
    success: true,
    path: foundPath,
    ttl: currentTtl
  };
}
