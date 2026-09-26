import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Send, RefreshCw, HelpCircle, ShieldAlert } from 'lucide-react';
import { NetworkDevice, NetworkLink } from '../../../types/network';
import { FaultScenario, DiagnosticEvidence, TerminalLine } from '../../../types/diagnostics';
import { executeTerminalCommand } from '../../../lib/diagnostics/terminal';
import { playSound } from '../../../lib/sound';

interface DiagnosticTerminalProps {
  currentHostId: string;
  devices: NetworkDevice[];
  links: NetworkLink[];
  activeFault: FaultScenario | null;
  onEvidenceDiscovered: (evidence: DiagnosticEvidence) => void;
  injectedCommand?: string | null;
}

export const DiagnosticTerminal: React.FC<DiagnosticTerminalProps> = ({
  currentHostId,
  devices,
  links,
  activeFault,
  onEvidenceDiscovered,
  injectedCommand,
}) => {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: '1', type: 'system', text: 'SOMAIYA DCN VIRTUAL LAB — INTERACTIVE DIAGNOSTIC CLI [Version 10.0.22631]' },
    { id: '2', type: 'system', text: '(c) Department of Computer Engineering. All rights reserved.' },
    { id: '3', type: 'system', text: 'Type "help" for a list of available diagnostic commands (ping, ipconfig, tracert, arp, nslookup, netstat).' },
    { id: '4', type: 'system', text: '' },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentHost = devices.find(d => d.id === currentHostId) || devices[0];

  // Auto-scroll to bottom of terminal
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  // Handle injected command from external buttons (e.g. Command Reference)
  useEffect(() => {
    if (injectedCommand) {
      handleRunCommand(injectedCommand);
    }
  }, [injectedCommand]);

  const handleRunCommand = (cmdText: string) => {
    const trimmed = cmdText.trim();
    if (!trimmed) return;

    playSound('click');

    // Add input line
    const promptLine = `C:\\Users\\Student>${trimmed}`;
    const newLines: TerminalLine[] = [
      ...lines,
      { id: Date.now().toString(), type: 'input', text: promptLine },
    ];

    // Execute command against topology state
    const result = executeTerminalCommand(trimmed, currentHostId, devices, links, activeFault);

    if (result.output.length === 1 && result.output[0] === '__CLEAR__') {
      setLines([]);
      return;
    }

    result.output.forEach((outStr, idx) => {
      newLines.push({
        id: `${Date.now()}-${idx}`,
        type: result.isError ? 'error' : 'output',
        text: outStr,
      });
    });

    // Notify evidence discovery if inference was generated
    if (result.discoveredEvidence) {
      playSound('repair');
      onEvidenceDiscovered({
        id: `ev-${Date.now()}`,
        command: result.discoveredEvidence.command,
        output: result.output.join('\n'),
        inference: result.discoveredEvidence.inference,
        timestamp: Date.now(),
      });
    }

    setLines(newLines);
    setHistory(prev => [...prev, trimmed]);
    setHistoryIndex(-1);
    setInputVal('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleRunCommand(inputVal);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const nextIdx = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx < history.length) {
          setHistoryIndex(nextIdx);
          setInputVal(history[nextIdx]);
        } else {
          setHistoryIndex(-1);
          setInputVal('');
        }
      }
    }
  };

  return (
    <div className="rounded-2xl bg-[#080c16] border border-slate-800 shadow-2xl overflow-hidden font-code flex flex-col h-[460px]">
      {/* Terminal Titlebar */}
      <div className="px-4 py-2.5 bg-[#0d1322] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200">
            Command Prompt // {currentHost?.name} ({currentHost?.interfaces[0]?.ipAddress || '0.0.0.0'})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleRunCommand('ipconfig /all')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
          >
            ipconfig
          </button>
          <button
            onClick={() => handleRunCommand('ping 192.168.1.1')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
          >
            ping gw
          </button>
          <button
            onClick={() => handleRunCommand('ping 192.168.2.10')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
          >
            ping srv
          </button>
          <button
            onClick={() => handleRunCommand('clear')}
            className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
          >
            clear
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      <div
        onClick={() => inputRef.current?.focus()}
        className="flex-1 p-4 overflow-y-auto space-y-1 text-xs select-text cursor-text terminal-scanline"
      >
        {lines.map(line => (
          <div
            key={line.id}
            className={`whitespace-pre-wrap leading-relaxed ${
              line.type === 'input'
                ? 'text-emerald-400 font-semibold'
                : line.type === 'error'
                ? 'text-rose-400'
                : line.type === 'system'
                ? 'text-slate-400'
                : 'text-slate-300'
            }`}
          >
            {line.text}
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>

      {/* Input Prompt */}
      <div className="p-3 bg-[#0a0f1c] border-t border-slate-800 flex items-center gap-2">
        <span className="text-emerald-400 font-bold text-xs select-none">
          C:\Users\Student&gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command (e.g. ping 192.168.2.10)..."
          className="flex-1 bg-transparent text-slate-100 font-code text-xs focus:outline-none placeholder:text-slate-600"
          autoFocus
        />
        <button
          onClick={() => handleRunCommand(inputVal)}
          className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
