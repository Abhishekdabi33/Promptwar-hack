import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Cpu, 
  ClipboardPaste, 
  FolderUp, 
  ChevronDown, 
  FileText, 
  Database, 
  Table2, 
  Lock,
  Sparkles
} from 'lucide-react';
import { TabType, WorkerStatus } from '../types';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  workerStatus: WorkerStatus;
  onLoadSample: (sampleType: string) => void;
  onPasteClipboard: () => void;
  onTriggerUpload: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  workerStatus,
  onLoadSample,
  onPasteClipboard,
  onTriggerUpload,
  fileInputRef,
  onFileChange
}: HeaderProps) {
  const [sampleMenuOpen, setSampleMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getStatusBadge = () => {
    if (workerStatus.status === 'ready' || workerStatus.status === 'ready_fallback') {
      const isPython = workerStatus.engine === 'python-wasm';
      return (
        <div 
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/90 text-emerald-800 text-[11px] font-semibold shadow-2xs whitespace-nowrap cursor-help transition-all hover:bg-emerald-100/70"
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
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold shadow-2xs animate-pulse whitespace-nowrap"
        title="Compiling and loading Python WebAssembly inside Web Worker..."
      >
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-spin"></span>
        <Cpu className="w-3.5 h-3.5 text-amber-600" />
        <span>Booting Python WASM...</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">PII Shield</h1>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
              v2.6 WASM
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center flex-shrink-0">
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Sample</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {sampleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Pre-configured Test Scenarios
                </div>
                <button
                  onClick={() => {
                    onLoadSample('mixed');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Noisy Incident Dossier</div>
                    <div className="text-[10px] text-slate-400">Mixed PII, Verhoeff & Luhn traps</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onLoadSample('json');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2.5 transition-colors"
                >
                  <Database className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Structured JSON API Log</div>
                    <div className="text-[10px] text-slate-400">Nested keys, Shannon bearer tokens</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onLoadSample('csv');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2.5 transition-colors"
                >
                  <Table2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <div>
                    <div className="font-medium">Customer Support CSV</div>
                    <div className="text-[10px] text-slate-400">Quoted rows, repeated emails</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onPasteClipboard}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-2xs whitespace-nowrap"
          >
            <ClipboardPaste className="w-3.5 h-3.5 text-slate-600" />
            <span>Paste</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            multiple
            accept=".txt,.log,.md,.csv,.tsv,.json,.xml,.docx,.pdf,.xlsx,.xls,.eml"
            className="hidden"
          />

          <button
            onClick={onTriggerUpload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors whitespace-nowrap"
          >
            <FolderUp className="w-3.5 h-3.5 text-white" />
            <span>Upload File</span>
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-1">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'studio'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sanitizer Studio
            </button>
            <button
              onClick={() => setActiveTab('promptlog')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                activeTab === 'promptlog'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Prompt Log
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
