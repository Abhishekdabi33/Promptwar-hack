import React from 'react';
import { 
  Shield, 
  Plus, 
  Menu,
  ArrowLeft,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { AppMode, WorkerStatus } from '../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onReturnHome: () => void;
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onOpenInputHub: () => void;
  workerStatus: WorkerStatus;
}

export default function Header({
  onToggleSidebar,
  onReturnHome,
  appMode,
  onSelectMode,
  onOpenInputHub,
  workerStatus
}: HeaderProps) {
  const isReady = workerStatus.status === 'ready' || workerStatus.status === 'ready_fallback';

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-xl text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 shadow-2xs transition-colors cursor-pointer"
            title="Open navigation & tools menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <button
            onClick={onReturnHome}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl shadow-2xs transition-colors cursor-pointer"
            title="Return to Landing Page"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Home</span>
          </button>

          <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-2xs">
              <Shield className="w-4 h-4 stroke-[2.2]" />
            </div>
            <span className="text-sm font-bold text-slate-900 tracking-tight whitespace-nowrap">
              PII Shield
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center">
          <div className="inline-flex p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
            <button
              onClick={() => onSelectMode('sanitizer')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                appMode === 'sanitizer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Document Sanitizer</span>
            </button>
            <button
              onClick={() => onSelectMode('message_guard')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                appMode === 'message_guard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Message Safety Guard</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-medium">
            <span className="relative flex h-2 w-2">
              <span className={`inline-flex rounded-full h-2 w-2 ${isReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
            </span>
            <span className="hidden sm:inline">Local • 0B Sent</span>
            <span className="sm:hidden">0B</span>
          </div>

          <button
            onClick={onOpenInputHub}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-[0_3px_0_#0f172a] active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] transition-all cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Input</span>
          </button>
        </div>
      </div>
    </header>
  );
}
