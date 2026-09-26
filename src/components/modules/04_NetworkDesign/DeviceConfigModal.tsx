import React, { useState } from 'react';
import { X, Save, Trash2, Check, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react';
import { NetworkDevice } from '../../../types/network';
import { playSound } from '../../../lib/sound';
import { isValidIPv4, getSubnetDetails } from '../../../lib/network/addressing';

interface DeviceConfigModalProps {
  device: NetworkDevice;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: NetworkDevice) => void;
  onDelete: (deviceId: string) => void;
}

export const DeviceConfigModal: React.FC<DeviceConfigModalProps> = ({
  device,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(device.name);
  const [ip, setIp] = useState(device.interfaces[0]?.ipAddress || '');
  const [mask, setMask] = useState(device.interfaces[0]?.subnetMask || '255.255.255.0');
  const [gateway, setGateway] = useState(device.defaultGateway || '');
  const [dns, setDns] = useState(device.dnsServer || '');
  const [isUp, setIsUp] = useState(device.interfaces[0]?.isUp ?? true);

  if (!isOpen) return null;

  const handleSave = () => {
    playSound('success');
    const updated: NetworkDevice = {
      ...device,
      name,
      defaultGateway: gateway || undefined,
      dnsServer: dns || undefined,
      interfaces: device.interfaces.map((iface, idx) => {
        if (idx === 0) {
          return {
            ...iface,
            ipAddress: ip,
            subnetMask: mask,
            isUp,
          };
        }
        return iface;
      }),
    };
    onSave(updated);
    onClose();
  };

  const subnetInfo = ip && mask && isValidIPv4(ip) && isValidIPv4(mask) ? getSubnetDetails(ip, mask) : null;

  return (
    <div className="fixed inset-0 z-50 bg-[#090806]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="max-w-lg w-full bg-[#151412] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#11100e]">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">
              Device Configuration & Port Parameters
            </span>
            <h3 className="text-base font-bold text-slate-100 font-display">
              {device.name} [{device.type.toUpperCase()}]
            </h3>
          </div>
          <button
            onClick={() => {
              playSound('click');
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Device Label */}
          <div>
            <label className="block text-xs font-mono text-slate-400 mb-1">Device Hostname:</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          {/* Interface Up/Down Toggle */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-200">
                Interface {device.interfaces[0]?.name || 'Port 0'}
              </span>
              <div className="text-[11px] font-mono text-slate-400">
                MAC: {device.interfaces[0]?.macAddress || '00:00:00:00:00:00'}
              </div>
            </div>
            <button
              onClick={() => {
                playSound('click');
                setIsUp(!isUp);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                isUp
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}
            >
              {isUp ? 'Status: UP' : 'Status: SHUTDOWN'}
            </button>
          </div>

          {/* Only hosts and routers need IP configuration */}
          {device.type !== 'switch' ? (
            <>
              {/* IPv4 Address */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  IPv4 Address:
                </label>
                <input
                  type="text"
                  value={ip}
                  onChange={e => setIp(e.target.value.trim())}
                  placeholder="e.g. 192.168.1.10"
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-lg font-mono text-sm focus:outline-none ${
                    isValidIPv4(ip)
                      ? 'border-slate-700 text-emerald-300 focus:border-emerald-500'
                      : 'border-rose-500/80 text-rose-300 focus:border-rose-500'
                  }`}
                />
              </div>

              {/* Subnet Mask */}
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  Subnet Mask:
                </label>
                <input
                  type="text"
                  value={mask}
                  onChange={e => setMask(e.target.value.trim())}
                  placeholder="e.g. 255.255.255.0"
                  className={`w-full px-3 py-2 bg-slate-950 border rounded-lg font-mono text-sm focus:outline-none ${
                    isValidIPv4(mask)
                      ? 'border-slate-700 text-emerald-300 focus:border-emerald-500'
                      : 'border-rose-500/80 text-rose-300 focus:border-rose-500'
                  }`}
                />
              </div>

              {/* Default Gateway (for PC, Laptop, Server) */}
              {(device.type === 'pc' || device.type === 'laptop' || device.type === 'server') && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Default Gateway:
                  </label>
                  <input
                    type="text"
                    value={gateway}
                    onChange={e => setGateway(e.target.value.trim())}
                    placeholder="e.g. 192.168.1.1"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* DNS Server */}
              {(device.type === 'pc' || device.type === 'laptop') && (
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    DNS Server:
                  </label>
                  <input
                    type="text"
                    value={dns}
                    onChange={e => setDns(e.target.value.trim())}
                    placeholder="e.g. 192.168.2.10"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Real-time Subnet validation snippet */}
              {subnetInfo && (
                <div className="p-3 bg-black/40 border border-slate-800 rounded-lg text-xs font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Subnet Network ID:</span>
                    <span className="text-emerald-400 font-semibold">{subnetInfo.networkAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Broadcast Address:</span>
                    <span className="text-slate-300">{subnetInfo.broadcastAddress}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usable Capacity:</span>
                    <span className="text-slate-300">{subnetInfo.usableHosts} Hosts</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-slate-400 leading-relaxed font-mono">
              Layer 2 FastEthernet Switch: Transparently switches Ethernet frames at Data Link layer using port-to-MAC hardware CAM tables. IP assignment is not required for L2 switching.
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#11100e] border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              playSound('alert');
              onDelete(device.id);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3 py-2 text-rose-400 hover:bg-rose-500/10 rounded-lg text-xs font-medium transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Device</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSound('click');
                onClose();
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-[0_0_12px_rgba(255,95,31,0.3)]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
