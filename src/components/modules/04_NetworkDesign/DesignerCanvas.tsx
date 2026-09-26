import React, { useState, useRef, useEffect } from 'react';
import { 
  Monitor, 
  Laptop, 
  Cpu, 
  Router as RouterIcon, 
  Server, 
  Settings, 
  Trash2, 
  Unlink, 
  CheckCircle2, 
  AlertCircle,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { NetworkDevice, NetworkLink, DeviceType } from '../../../types/network';
import { DevicePalette } from './DevicePalette';
import { DeviceConfigModal } from './DeviceConfigModal';
import { ValidationPanel } from './ValidationPanel';
import { validateNetworkTopology } from '../../../lib/network/validation';
import { INITIAL_DEVICES, INITIAL_LINKS } from '../../../data/defaultTopology';
import { playSound } from '../../../lib/sound';

interface DesignerCanvasProps {
  devices: NetworkDevice[];
  setDevices: React.Dispatch<React.SetStateAction<NetworkDevice[]>>;
  links: NetworkLink[];
  setLinks: React.Dispatch<React.SetStateAction<NetworkLink[]>>;
  onProceedToSimulation: () => void;
}

export const DesignerCanvas: React.FC<DesignerCanvasProps> = ({
  devices,
  setDevices,
  links,
  setLinks,
  onProceedToSimulation,
}) => {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [editingDevice, setEditingDevice] = useState<NetworkDevice | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [draggedDeviceId, setDraggedDeviceId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1.0);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Validate network topology
  const validationIssues = validateNetworkTopology(devices, links);

  // Device creation helper
  const handleAddDevice = (type: DeviceType) => {
    const id = `dev-${type}-${Date.now().toString(36)}`;
    const count = devices.filter(d => d.type === type).length + 1;
    let name = '';
    let ip = '';
    let mask = '255.255.255.0';
    let gw = '192.168.1.1';

    if (type === 'pc') {
      name = `PC${count}`;
      ip = `192.168.1.${10 + count}`;
    } else if (type === 'laptop') {
      name = `Laptop${count}`;
      ip = `192.168.1.${20 + count}`;
    } else if (type === 'switch') {
      name = `SW${count} (Switch)`;
    } else if (type === 'router') {
      name = `R${count} (Router)`;
      ip = '192.168.1.1';
    } else if (type === 'server') {
      name = `Server${count}`;
      ip = `192.168.2.${10 + count}`;
      gw = '192.168.2.1';
    }

    const newDevice: NetworkDevice = {
      id,
      name,
      type,
      x: 80 + (count * 70) % 650,
      y: 100 + (count * 50) % 320,
      defaultGateway: type !== 'switch' ? gw : undefined,
      dnsServer: type === 'pc' || type === 'laptop' ? '192.168.2.10' : undefined,
      interfaces: [
        {
          id: `if-${id}-0`,
          name: type === 'switch' ? 'Fa0/1' : 'eth0',
          macAddress: `00:50:56:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}:${Math.floor(Math.random()*90+10)}`,
          ipAddress: ip,
          subnetMask: type !== 'switch' ? mask : '',
          isUp: true,
        },
      ],
    };

    setDevices(prev => [...prev, newDevice]);
  };

  // Device dragging handlers
  const handleMouseDownDevice = (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    if (isConnecting) {
      handleDeviceClickForConnecting(deviceId);
      return;
    }

    const dev = devices.find(d => d.id === deviceId);
    if (!dev) return;

    setSelectedDeviceId(deviceId);
    setDraggedDeviceId(deviceId);

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (canvasRect) {
      setDragOffset({
        x: (e.clientX - canvasRect.left) / zoom - dev.x,
        y: (e.clientY - canvasRect.top) / zoom - dev.y,
      });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!draggedDeviceId || !canvasRef.current) return;
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(20, Math.min(1100, (e.clientX - canvasRect.left) / zoom - dragOffset.x));
    const newY = Math.max(20, Math.min(600, (e.clientY - canvasRect.top) / zoom - dragOffset.y));

    setDevices(prev =>
      prev.map(d => (d.id === draggedDeviceId ? { ...d, x: newX, y: newY } : d))
    );
  };

  const handleMouseUpCanvas = () => {
    setDraggedDeviceId(null);
  };

  // Connect devices
  const handleDeviceClickForConnecting = (deviceId: string) => {
    if (!connectSourceId) {
      playSound('click');
      setConnectSourceId(deviceId);
    } else if (connectSourceId === deviceId) {
      setConnectSourceId(null);
    } else {
      // Check existing connection
      const exists = links.some(
        l =>
          (l.sourceDeviceId === connectSourceId && l.targetDeviceId === deviceId) ||
          (l.sourceDeviceId === deviceId && l.targetDeviceId === connectSourceId)
      );

      if (!exists) {
        playSound('success');
        const newLink: NetworkLink = {
          id: `link-${Date.now().toString(36)}`,
          sourceDeviceId: connectSourceId,
          sourceInterfaceId: 'if0',
          targetDeviceId: deviceId,
          targetInterfaceId: 'if0',
          cableType: 'straight-through',
          status: 'active',
          latencyMs: 1,
          lossRate: 0,
        };
        setLinks(prev => [...prev, newLink]);
      }
      setConnectSourceId(null);
      setIsConnecting(false);
    }
  };

  const handleDeleteLink = (linkId: string) => {
    playSound('alert');
    setLinks(prev => prev.filter(l => l.id !== linkId));
  };

  const handleDeleteDevice = (deviceId: string) => {
    playSound('alert');
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    setLinks(prev => prev.filter(l => l.sourceDeviceId !== deviceId && l.targetDeviceId !== deviceId));
    if (selectedDeviceId === deviceId) setSelectedDeviceId(null);
  };

  const handleSaveDevice = (updated: NetworkDevice) => {
    setDevices(prev => prev.map(d => (d.id === updated.id ? updated : d)));
  };

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'pc': return Monitor;
      case 'laptop': return Laptop;
      case 'switch': return Cpu;
      case 'router': return RouterIcon;
      case 'server': return Server;
    }
  };

  return (
    <section className="py-10 bg-[#070a12]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-1.5">
              <span>Network design // System core</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 font-display">
              Network Topology Designer
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Place, connect, and configure network nodes. Drag devices to position them; click inspect to set IPv4 parameters.
            </p>
          </div>

          <button
            onClick={() => {
              playSound('success');
              onProceedToSimulation();
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold font-mono text-xs rounded-xl transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] shrink-0 active:scale-95 cursor-pointer"
          >
            <span>Proceed to Simulation</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <DevicePalette
          onAddDevice={handleAddDevice}
          isConnecting={isConnecting}
          setIsConnecting={setIsConnecting}
          onResetTopology={() => {
            setDevices(JSON.parse(JSON.stringify(INITIAL_DEVICES)));
            setLinks(JSON.parse(JSON.stringify(INITIAL_LINKS)));
          }}
          onValidate={() => setShowValidation(!showValidation)}
        />

        {/* Validation Panel Dropdown */}
        <ValidationPanel
          issues={validationIssues}
          isOpen={showValidation}
          onClose={() => setShowValidation(false)}
          onSelectDevice={devId => {
            setSelectedDeviceId(devId);
            const dev = devices.find(d => d.id === devId);
            if (dev) setEditingDevice(dev);
          }}
        />

        {/* Core Canvas Workspace with Zoom Controls */}
        <div className="relative w-full h-[600px] bg-[#090d16] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl select-none tech-dot-bg">
          {/* Zoom Rulers & Controls */}
          <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-[#0d1322]/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-800 shadow-xl">
            <button
              onClick={() => setZoom(prev => Math.min(1.4, prev + 0.1))}
              title="Zoom In"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1.5">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(prev => Math.max(0.7, prev - 0.1))}
              title="Zoom Out"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              title="Reset Zoom"
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Canvas Viewport */}
          <div
            ref={canvasRef}
            onMouseMove={handleMouseMoveCanvas}
            onMouseUp={handleMouseUpCanvas}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
              width: '1200px',
              height: '700px',
            }}
            className="relative w-full h-full"
          >
            {/* SVG Links Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              {links.map(link => {
                const src = devices.find(d => d.id === link.sourceDeviceId);
                const tgt = devices.find(d => d.id === link.targetDeviceId);
                if (!src || !tgt) return null;

                const x1 = src.x + 56;
                const y1 = src.y + 44;
                const x2 = tgt.x + 56;
                const y2 = tgt.y + 44;
                const isDown = link.status === 'down';

                return (
                  <g key={link.id} className="pointer-events-auto">
                    {/* Glowing cable aura */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isDown ? '#f43f5e' : '#3b82f6'}
                      strokeWidth="5"
                      strokeOpacity="0.2"
                    />
                    {/* Main cable wire */}
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isDown ? '#f43f5e' : '#3b82f6'}
                      strokeWidth="2.5"
                      strokeDasharray={isDown ? '5' : 'none'}
                    />

                    {/* Midpoint link delete/status icon button */}
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      r="9"
                      fill="#0f172a"
                      stroke={isDown ? '#f43f5e' : '#334155'}
                      strokeWidth="1.5"
                      className="cursor-pointer hover:stroke-rose-400 transition-colors"
                      onClick={e => {
                        e.stopPropagation();
                        handleDeleteLink(link.id);
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {/* Connection Mode Helper Toast */}
            {isConnecting && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-amber-500/90 text-slate-950 font-mono text-xs font-bold rounded-xl shadow-2xl border border-amber-400 flex items-center gap-2 animate-bounce">
                <span>{connectSourceId ? 'Click target node to connect link' : 'Click first node to start cable'}</span>
              </div>
            )}

            {/* Nodes / Devices Layer */}
            {devices.map(device => {
              const Icon = getDeviceIcon(device.type);
              const isSelected = selectedDeviceId === device.id;
              const isConnectSource = connectSourceId === device.id;
              const primaryIface = device.interfaces[0];
              const isDown = !primaryIface?.isUp;

              return (
                <div
                  key={device.id}
                  onMouseDown={e => handleMouseDownDevice(e, device.id)}
                  style={{
                    transform: `translate(${device.x}px, ${device.y}px)`,
                  }}
                  className={`absolute top-0 left-0 w-32 sm:w-36 p-3 rounded-2xl border transition-all cursor-grab active:cursor-grabbing z-10 ${
                    isConnectSource
                      ? 'bg-amber-500/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)]'
                      : isSelected
                      ? 'bg-[#0f172a] border-emerald-400 shadow-[0_0_20px_rgba(59,130,246,0.35)] ring-2 ring-emerald-500/50'
                      : 'bg-[#0d1322]/95 border-slate-800 hover:border-slate-700 shadow-xl'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    {/* Status LED */}
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2.5 h-2.5 rounded-full ${isDown ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400 shadow-[0_0_8px_#3b82f6]'}`} />
                      <span className="text-[9px] font-mono text-slate-400 uppercase">
                        {isDown ? 'DOWN' : 'UP'}
                      </span>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        playSound('click');
                        setEditingDevice(device);
                      }}
                      title="Inspect & Configure Node"
                      className="p-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-1.5 shadow-inner ${
                      device.type === 'switch'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : device.type === 'router'
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        : device.type === 'server'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>

                    <span className="text-xs font-bold text-slate-200 truncate w-full">
                      {device.name}
                    </span>

                    {primaryIface?.ipAddress ? (
                      <span className="text-[10px] font-mono text-emerald-400/90 truncate w-full mt-0.5 font-semibold">
                        {primaryIface.ipAddress}
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono text-slate-500 truncate w-full mt-0.5">
                        L2 Switch Ports
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configuration Modal */}
        {editingDevice && (
          <DeviceConfigModal
            device={editingDevice}
            isOpen={!!editingDevice}
            onClose={() => setEditingDevice(null)}
            onSave={handleSaveDevice}
            onDelete={handleDeleteDevice}
          />
        )}
      </div>
    </section>
  );
};
