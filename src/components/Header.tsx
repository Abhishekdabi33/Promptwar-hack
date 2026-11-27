import React from 'react';
import { 
  Shield, 
  Plus, 
  TerminalSquare,
  SlidersHorizontal
} from 'lucide-react';
import { TabType, WorkerStatus } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  workerStatus: WorkerStatus;
  onOpenInputHub: () => void;
  onOpenDrawer: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  workerStatus,
  onOpenInputHub,
  onOpenDrawer
}: HeaderProps) {
  const isReady = workerStatus.status === 'ready' || workerStatus.status === 'ready_fallback';

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
            <Shield className="w-4 h-4 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-slate-900 tracking-tight whitespace-nowrap">
              PII Shield
            </h1>
          </div>
        </div>

        <div className="hidden md:flex items-center flex-shrink-0">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
            <span className="relative flex h-2 w-2">
              <span className={`inline-flex rounded-full h-2 w-2 ${isReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
            </span>
            <span>Local Mode • Offline Safe</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onOpenInputHub}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Input</span>
          </button>

          <button
            onClick={onOpenDrawer}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Settings & Rules</span>
          </button>

          <button
            onClick={() => setActiveTab(activeTab === 'studio' ? 'promptlog' : 'studio')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'promptlog'
                ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
            }`}
          >
            <TerminalSquare className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{activeTab === 'promptlog' ? 'Workspace' : 'Prompt Log'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
