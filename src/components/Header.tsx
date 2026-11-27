import React from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  Lock, 
  Plus, 
  TerminalSquare
} from 'lucide-react';
import { TabType, WorkerStatus } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  workerStatus: WorkerStatus;
  onOpenInputHub: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  workerStatus,
  onOpenInputHub
}: HeaderProps) {
  const getStatusBadge = () => {
    if (workerStatus.status === 'ready' || workerStatus.status === 'ready_fallback') {
      const isPython = workerStatus.engine === 'python-wasm';
      return (
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50/90 border border-emerald-200 text-emerald-800 text-[11px] font-semibold shadow-2xs whitespace-nowrap cursor-help transition-all hover:bg-emerald-100/80"
          title={isPython ? 'Python 3.12 WebAssembly Worker Active (0 Bytes Sent / Fully Isolated)' : 'Client-Side Safe Mode Active (0 Bytes Sent)'}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isPython ? 'Python WASM • 0B Sent' : 'Client Safe Mode • 0B'}</span>
          <Lock className="w-3 h-3 text-emerald-600" />
        </div>
      );
    }
    return (
      <div 
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold shadow-2xs animate-pulse whitespace-nowrap"
        title="Compiling and loading Python WebAssembly inside Web Worker..."
      >
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-spin"></span>
        <Cpu className="w-3.5 h-3.5 text-amber-600" />
        <span>Booting Python WASM...</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/80 shadow-xs ring-1 ring-slate-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">PII Shield</h1>
            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-50 border border-indigo-200 text-indigo-700 whitespace-nowrap">
              WASM Engine
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center flex-shrink-0">
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onOpenInputHub}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl shadow-xs shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Document</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'studio' ? 'promptlog' : 'studio')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'promptlog'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                : 'bg-white/80 hover:bg-white text-slate-700 border-slate-200'
            }`}
          >
            <TerminalSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activeTab === 'promptlog' ? 'Diff Studio' : 'Prompt Log'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
