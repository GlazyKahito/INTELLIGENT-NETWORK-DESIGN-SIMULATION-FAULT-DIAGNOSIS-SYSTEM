// Deterministic Rule-Based Fault Diagnosis & Root Cause Analysis Engine

import { FaultScenario, DiagnosticEvidence } from '../../types/diagnostics';
import { NetworkDevice, NetworkLink } from '../../types/network';
import { FAULT_SCENARIOS } from '../../data/faults';

export interface IntelligentDiagnosisReport {
  symptom: string;
  observedEvidence: DiagnosticEvidence[];
  inferredHypotheses: string[];
  likelyRootCause: string;
  recommendedAction: string;
  confidence: 'High' | 'Very High' | 'Medium' | 'Low';
  remedyActionType: string;
  isResolved: boolean;
}

export function evaluateDiagnosticState(
  evidenceList: DiagnosticEvidence[],
  activeFault: FaultScenario | null,
  devices: NetworkDevice[],
  links: NetworkLink[]
): IntelligentDiagnosisReport {
  if (!activeFault) {
    return {
      symptom: 'All network services operational. No active anomalies detected.',
      observedEvidence: evidenceList,
      inferredHypotheses: ['Network is functioning within normal parameters.'],
      likelyRootCause: 'None (System Normal)',
      recommendedAction: 'Continue monitoring or inject a fault scenario to practice troubleshooting.',
      confidence: 'Very High',
      remedyActionType: 'NONE',
      isResolved: true,
    };
  }

  const hypotheses: string[] = [];

  // Generate hypotheses based on fault category and evidence
  if (activeFault.category.includes('Physical')) {
    hypotheses.push('Physical cable disconnected, severed, or pinout mismatch (T568A vs T568B).');
    hypotheses.push('Excessive attenuation or CRC bit errors on copper link.');
  } else if (activeFault.category.includes('Data Link')) {
    hypotheses.push('Interface is administratively shutdown or link negotiation failed.');
    hypotheses.push('ARP table corruption or MAC table flapping.');
  } else if (activeFault.category.includes('Network')) {
    hypotheses.push('Host IPv4 address outside target subnet or duplicate IP collision.');
    hypotheses.push('Subnet mask mismatch preventing default gateway discovery.');
    hypotheses.push('Missing or invalid Default Gateway preventing inter-VLAN routing.');
    hypotheses.push('Missing routing table entry on core gateway router.');
  } else if (activeFault.category.includes('Transport')) {
    hypotheses.push('Destination port is closed or target service daemon is terminated.');
    hypotheses.push('TCP 3-way handshake blocked by security ACL or firewall.');
  } else if (activeFault.category.includes('Application')) {
    hypotheses.push('DNS Server IP unresolvable or DNS service daemon inactive.');
    hypotheses.push('Hostname misconfigured in local hosts file or DNS cache.');
  }

  // Determine confidence based on how many relevant commands were run
  const hasPing = evidenceList.some(e => e.command.startsWith('ping'));
  const hasIpconfig = evidenceList.some(e => e.command.startsWith('ipconfig'));
  const hasTracert = evidenceList.some(e => e.command.startsWith('tracert'));
  const hasArp = evidenceList.some(e => e.command.startsWith('arp'));
  const hasNslookup = evidenceList.some(e => e.command.startsWith('nslookup'));

  let confidence: 'High' | 'Very High' | 'Medium' | 'Low' = 'Low';
  if (evidenceList.length >= 3) {
    confidence = 'Very High';
  } else if (evidenceList.length >= 2) {
    confidence = 'High';
  } else if (evidenceList.length >= 1) {
    confidence = 'Medium';
  }

  return {
    symptom: activeFault.symptom,
    observedEvidence: evidenceList,
    inferredHypotheses: hypotheses,
    likelyRootCause: evidenceList.length >= 1 ? activeFault.rootCause : 'Awaiting additional diagnostic testing to isolate root cause...',
    recommendedAction: evidenceList.length >= 1 ? activeFault.recommendedAction : 'Run "ipconfig /all", "ping", or "tracert" in the Diagnostic Terminal to gather empirical evidence.',
    confidence,
    remedyActionType: activeFault.id,
    isResolved: false,
  };
}

/**
 * Apply the corrective action to the network topology state
 */
export function applyCorrectiveAction(
  faultId: string,
  devices: NetworkDevice[],
  links: NetworkLink[]
): { updatedDevices: NetworkDevice[]; updatedLinks: NetworkLink[]; success: boolean; message: string } {
  let updatedDevices = JSON.parse(JSON.stringify(devices)) as NetworkDevice[];
  let updatedLinks = JSON.parse(JSON.stringify(links)) as NetworkLink[];

  switch (faultId) {
    case 'fault-bad-ip': {
      const pc1 = updatedDevices.find(d => d.id === 'dev-pc1');
      if (pc1 && pc1.interfaces[0]) {
        pc1.interfaces[0].ipAddress = '192.168.1.10';
        pc1.interfaces[0].subnetMask = '255.255.255.0';
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Successfully reconfigured PC1 IPv4 address to 192.168.1.10 / 255.255.255.0.',
      };
    }

    case 'fault-bad-subnet': {
      const pc1 = updatedDevices.find(d => d.id === 'dev-pc1');
      if (pc1 && pc1.interfaces[0]) {
        pc1.interfaces[0].subnetMask = '255.255.255.0';
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Corrected PC1 subnet mask to 255.255.255.0 (/24). Broadcast boundary restored.',
      };
    }

    case 'fault-bad-gateway': {
      const pc1 = updatedDevices.find(d => d.id === 'dev-pc1');
      if (pc1) {
        pc1.defaultGateway = '192.168.1.1';
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Corrected PC1 Default Gateway to 192.168.1.1 (Router R1 GigabitEthernet0/0).',
      };
    }

    case 'fault-link-down': {
      const link = updatedLinks.find(l => l.id === 'link-sw1-r1');
      if (link) {
        link.status = 'active';
        link.lossRate = 0;
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Reconnected physical patch cable between SW1 and Router R1. Link status UP.',
      };
    }

    case 'fault-interface-down': {
      const r1 = updatedDevices.find(d => d.id === 'dev-r1');
      if (r1 && r1.interfaces[0]) {
        r1.interfaces[0].isUp = true;
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Issued "no shutdown" on Router R1 GigabitEthernet0/0. Interface state changed to UP.',
      };
    }

    case 'fault-duplicate-ip': {
      const pc2 = updatedDevices.find(d => d.id === 'dev-pc2');
      if (pc2 && pc2.interfaces[0]) {
        pc2.interfaces[0].ipAddress = '192.168.1.11';
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Resolved IP collision: PC2 address changed to 192.168.1.11.',
      };
    }

    case 'fault-dns-failure': {
      const pc1 = updatedDevices.find(d => d.id === 'dev-pc1');
      if (pc1) {
        pc1.dnsServer = '192.168.2.10';
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Updated PC1 Primary DNS Server configuration to 192.168.2.10.',
      };
    }

    case 'fault-routing-missing': {
      const r1 = updatedDevices.find(d => d.id === 'dev-r1');
      if (r1) {
        r1.routingTable = [
          {
            network: '192.168.1.0',
            mask: '255.255.255.0',
            nextHop: 'Directly Connected',
            interfaceName: 'GigabitEthernet0/0',
          },
          {
            network: '192.168.2.0',
            mask: '255.255.255.0',
            nextHop: 'Directly Connected',
            interfaceName: 'GigabitEthernet0/1',
          },
        ];
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Added static route for 192.168.2.0/24 via GigabitEthernet0/1 to Router R1.',
      };
    }

    case 'fault-packet-loss': {
      const link = updatedLinks.find(l => l.id === 'link-r1-sw2');
      if (link) {
        link.lossRate = 0;
        link.status = 'active';
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Replaced faulty Cat6 patch cable on R1 <-> SW2 link. Packet loss reduced to 0%.',
      };
    }

    case 'fault-port-blocked': {
      const srv = updatedDevices.find(d => d.id === 'dev-server');
      if (srv && srv.services) {
        srv.services.http = true;
      }
      return {
        updatedDevices,
        updatedLinks,
        success: true,
        message: 'Started HTTP Web Service (Port 80) daemon on Enterprise Server.',
      };
    }

    default:
      return { updatedDevices, updatedLinks, success: false, message: 'Unknown fault scenario.' };
  }
}

/**
 * Mutate network state to inject a specific fault scenario
 */
export function injectFaultScenario(
  faultId: string,
  devices: NetworkDevice[],
  links: NetworkLink[]
): { mutatedDevices: NetworkDevice[]; mutatedLinks: NetworkLink[] } {
  let mutatedDevices = JSON.parse(JSON.stringify(devices)) as NetworkDevice[];
  let mutatedLinks = JSON.parse(JSON.stringify(links)) as NetworkLink[];

  switch (faultId) {
    case 'fault-bad-ip': {
      const pc1 = mutatedDevices.find(d => d.id === 'dev-pc1');
      if (pc1 && pc1.interfaces[0]) {
        pc1.interfaces[0].ipAddress = '10.0.0.99';
        pc1.interfaces[0].subnetMask = '255.0.0.0';
      }
      break;
    }

    case 'fault-bad-subnet': {
      const pc1 = mutatedDevices.find(d => d.id === 'dev-pc1');
      if (pc1 && pc1.interfaces[0]) {
        pc1.interfaces[0].subnetMask = '255.255.0.0';
      }
      break;
    }

    case 'fault-bad-gateway': {
      const pc1 = mutatedDevices.find(d => d.id === 'dev-pc1');
      if (pc1) {
        pc1.defaultGateway = '192.168.1.254';
      }
      break;
    }

    case 'fault-link-down': {
      const link = mutatedLinks.find(l => l.id === 'link-sw1-r1');
      if (link) {
        link.status = 'down';
      }
      break;
    }

    case 'fault-interface-down': {
      const r1 = mutatedDevices.find(d => d.id === 'dev-r1');
      if (r1 && r1.interfaces[0]) {
        r1.interfaces[0].isUp = false;
      }
      break;
    }

    case 'fault-duplicate-ip': {
      const pc2 = mutatedDevices.find(d => d.id === 'dev-pc2');
      if (pc2 && pc2.interfaces[0]) {
        pc2.interfaces[0].ipAddress = '192.168.1.10'; // Duplicate of PC1
      }
      break;
    }

    case 'fault-dns-failure': {
      const pc1 = mutatedDevices.find(d => d.id === 'dev-pc1');
      if (pc1) {
        pc1.dnsServer = '192.168.99.1';
      }
      break;
    }

    case 'fault-routing-missing': {
      const r1 = mutatedDevices.find(d => d.id === 'dev-r1');
      if (r1) {
        r1.routingTable = [
          {
            network: '192.168.1.0',
            mask: '255.255.255.0',
            nextHop: 'Directly Connected',
            interfaceName: 'GigabitEthernet0/0',
          },
          // Route for 192.168.2.0 intentionally omitted!
        ];
      }
      break;
    }

    case 'fault-packet-loss': {
      const link = mutatedLinks.find(l => l.id === 'link-r1-sw2');
      if (link) {
        link.lossRate = 0.75;
      }
      break;
    }

    case 'fault-port-blocked': {
      const srv = mutatedDevices.find(d => d.id === 'dev-server');
      if (srv && srv.services) {
        srv.services.http = false;
      }
      break;
    }
  }

  return { mutatedDevices, mutatedLinks };
}
