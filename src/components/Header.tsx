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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
          <span>{isPython ? 'Python Worker Active • 0 Bytes Sent' : 'Client-Side Safe Engine Active'}</span>
          <Lock className="w-3 h-3 text-emerald-600 ml-0.5" />
        </div>
      );
    }
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium shadow-sm animate-pulse">
        <span className="h-2 w-2 rounded-full bg-amber-500 animate-spin"></span>
        <Cpu className="w-3.5 h-3.5 text-amber-600" />
        <span>Booting Python WASM Worker...</span>
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">PII Shield</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                v2.6 WASM
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              Zero-Server Client-Side Privacy & PII Sanitizer
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center">
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setSampleMenuOpen(!sampleMenuOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Sample</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {sampleMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Test Scenarios & Traps
                </div>
                <button
                  onClick={() => {
                    onLoadSample('mixed');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2.5 transition-colors"
                >
                  <FileText className="w-4 h-4 text-blue-500" />
                  <div>
                    <div className="font-medium">Noisy Incident Dossier</div>
                    <div className="text-[10px] text-slate-400">45+ lines, mixed PII, Verhoeff & Luhn traps</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onLoadSample('json');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2.5 transition-colors"
                >
                  <Database className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="font-medium">Structured JSON API Log</div>
                    <div className="text-[10px] text-slate-400">Nested keys, Shannon secrets, IP traps</div>
                  </div>
                </button>
                <button
                  onClick={() => {
                    onLoadSample('csv');
                    setSampleMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center gap-2.5 transition-colors"
                >
                  <Table2 className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="font-medium">Customer Support CSV</div>
                    <div className="text-[10px] text-slate-400">Quoted rows, repeated emails, serial traps</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onPasteClipboard}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors shadow-sm"
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
          >
            <FolderUp className="w-3.5 h-3.5 text-white" />
            <span>Upload File</span>
          </button>

          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-1">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'studio'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sanitizer Studio
            </button>
            <button
              onClick={() => setActiveTab('promptlog')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === 'promptlog'
                  ? 'bg-white text-slate-900 shadow-sm'
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
