import React from 'react';
import { 
  Monitor, 
  Laptop, 
  Cpu, 
  Router as RouterIcon, 
  Server, 
  Cable, 
  RotateCcw, 
  CheckCircle,
  Plus
} from 'lucide-react';
import { DeviceType } from '../../../types/network';
import { playSound } from '../../../lib/sound';

interface DevicePaletteProps {
  onAddDevice: (type: DeviceType) => void;
  isConnecting: boolean;
  setIsConnecting: (connecting: boolean) => void;
  onResetTopology: () => void;
  onValidate: () => void;
}

export const DevicePalette: React.FC<DevicePaletteProps> = ({
  onAddDevice,
  isConnecting,
  setIsConnecting,
  onResetTopology,
  onValidate,
}) => {
  const devices = [
    { type: 'pc' as DeviceType, label: 'Workstation PC', icon: Monitor },
    { type: 'laptop' as DeviceType, label: 'Laptop', icon: Laptop },
    { type: 'switch' as DeviceType, label: 'L2 Switch', icon: Cpu },
    { type: 'router' as DeviceType, label: 'Core Router', icon: RouterIcon },
    { type: 'server' as DeviceType, label: 'Enterprise Server', icon: Server },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#0d1322] border border-slate-800 rounded-2xl shadow-xl">
      {/* Device placement buttons */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
          Place Nodes:
        </span>
        {devices.map(d => {
          const Icon = d.icon;
          return (
            <button
              key={d.type}
              onClick={() => {
                playSound('click');
                onAddDevice(d.type);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium transition-all hover:border-emerald-500/50 hover:text-emerald-300 active:scale-95 shadow-sm"
            >
              <Icon className="w-3.5 h-3.5 text-emerald-400" />
              <span>+ {d.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action buttons: Cable, Validate, Reset */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            playSound('click');
            setIsConnecting(!isConnecting);
          }}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-sm ${
            isConnecting
              ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80'
          }`}
        >
          <Cable className="w-3.5 h-3.5" />
          <span>{isConnecting ? 'Click 2 Nodes to Link' : 'Connect Cable'}</span>
        </button>

        <button
          onClick={() => {
            playSound('click');
            onValidate();
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-mono font-bold transition-all shadow-[0_0_12px_rgba(59,130,246,0.3)] active:scale-95"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Validate Topology</span>
        </button>

        <button
          onClick={() => {
            playSound('repair');
            onResetTopology();
          }}
          title="Reset to Reference Topology"
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700/80 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
