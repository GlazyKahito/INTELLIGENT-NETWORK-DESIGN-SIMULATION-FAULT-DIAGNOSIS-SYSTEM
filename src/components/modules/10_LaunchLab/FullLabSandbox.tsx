import React, { useState } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Play, 
  Terminal as TerminalIcon, 
  Layers, 
  RotateCcw, 
  X,
  Search,
  CheckCircle,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';
import { NetworkDevice, NetworkLink } from '../../../types/network';
import { DesignerCanvas } from '../04_NetworkDesign/DesignerCanvas';
import { SimulationView } from '../05_Simulation/SimulationView';
import { DiagnosticTerminal } from '../06_FaultDiagnosis/DiagnosticTerminal';
import { playSound } from '../../../lib/sound';

interface FullLabSandboxProps {
  devices: NetworkDevice[];
  setDevices: React.Dispatch<React.SetStateAction<NetworkDevice[]>>;
  links: NetworkLink[];
  setLinks: React.Dispatch<React.SetStateAction<NetworkLink[]>>;
  onClose: () => void;
}

export const FullLabSandbox: React.FC<FullLabSandboxProps> = ({
  devices,
  setDevices,
  links,
  setLinks,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'designer' | 'simulation' | 'terminal'>('designer');
  const [showTerminalDrawer, setShowTerminalDrawer] = useState(true);

  return (
    <div className="fixed inset-0 z-50 bg-[#0c0b09] flex flex-col font-sans overflow-hidden">
      {/* Top Sandbox Navbar */}
      <div className="h-14 px-4 bg-[#151412] border-b border-slate-800 flex items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>SANDBOX VIRTUAL LAB</span>
          </div>
          <span className="text-sm font-bold text-slate-100 hidden sm:inline">
            Unrestricted Topology & Simulation Workbench
          </span>
        </div>

        {/* View mode toggle */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
          <button
            onClick={() => {
              playSound('click');
              setActiveTab('designer');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'designer' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Designer Canvas</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('simulation');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'simulation' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Packet Simulator</span>
          </button>

          <button
            onClick={() => {
              playSound('click');
              setActiveTab('terminal');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors ${
              activeTab === 'terminal' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Diagnostic CLI</span>
          </button>
        </div>

        {/* Close Sandbox button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit Fullscreen</span>
          </button>
        </div>
      </div>

      {/* Main Sandbox Content Body */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0c0b09]">
        {activeTab === 'designer' && (
          <DesignerCanvas
            devices={devices}
            setDevices={setDevices}
            links={links}
            setLinks={setLinks}
            onProceedToSimulation={() => setActiveTab('simulation')}
          />
        )}

        {activeTab === 'simulation' && (
          <SimulationView
            devices={devices}
            links={links}
            onOpenDiagnostics={() => setActiveTab('terminal')}
          />
        )}

        {activeTab === 'terminal' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <span>UNRESTRICTED COMMAND PROMPT // ALL ACTIVE SUBNETS MONITORED</span>
              <span className="text-emerald-400">STATE SYNCHRONIZED</span>
            </div>
            <DiagnosticTerminal
              currentHostId="dev-pc1"
              devices={devices}
              links={links}
              activeFault={null}
              onEvidenceDiscovered={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};
