// Types for Network Fault Diagnosis & Root Cause Analysis

export type FaultId = 
  | 'fault-bad-ip'
  | 'fault-bad-subnet'
  | 'fault-bad-gateway'
  | 'fault-link-down'
  | 'fault-interface-down'
  | 'fault-duplicate-ip'
  | 'fault-dns-failure'
  | 'fault-routing-missing'
  | 'fault-packet-loss'
  | 'fault-port-blocked';

export interface FaultScenario {
  id: FaultId;
  title: string;
  category: 'Layer 1 (Physical)' | 'Layer 2 (Data Link)' | 'Layer 3 (Network)' | 'Layer 4 (Transport)' | 'Layer 7 (Application)';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  symptom: string;
  expectedObservation: string;
  hints: string[];
  rootCause: string;
  recommendedAction: string;
  confidence: 'High' | 'Very High' | 'Medium';
  affectedDeviceId: string;
  testCommands: string[]; // Commands that uncover evidence (e.g. "ping", "ipconfig")
}

export interface DiagnosticEvidence {
  id: string;
  command: string;
  output: string;
  inference: string;
  timestamp: number;
}

export interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error' | 'success' | 'system';
  text: string;
}
