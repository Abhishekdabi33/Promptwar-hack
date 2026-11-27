import React, { useState } from 'react';
import { 
  X, 
  UploadCloud, 
  ClipboardPaste, 
  FileText, 
  Sparkles, 
  Layers, 
  FileCode, 
  FileSpreadsheet, 
  CheckCircle2, 
  Trash2, 
  PenTool,
  Check
} from 'lucide-react';
import { BatchFile } from '../types';

interface InputHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerUpload: () => void;
  onFileDrop: (files: FileList | File[]) => void;
  onPasteClipboard: () => void;
  onStartBlank: () => void;
  onLoadSample: (sampleType: string) => void;
  batchFiles: BatchFile[];
  activeBatchIndex: number;
  onSelectBatchFile: (idx: number) => void;
  onRemoveBatchFile: (idx: number) => void;
}

export default function InputHubModal({
  isOpen,
  onClose,
  onTriggerUpload,
  onFileDrop,
  onPasteClipboard,
  onStartBlank,
  onLoadSample,
  batchFiles = [],
  activeBatchIndex,
  onSelectBatchFile,
  onRemoveBatchFile
}: InputHubModalProps) {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'samples'>('upload');
  const [dragOver, setDragOver] = useState(false);

  if (!isOpen) return null;

  const supportedFormats = [
    { ext: '.txt', label: 'Plain Text & Logs' },
    { ext: '.csv', label: 'Spreadsheet Ledgers' },
    { ext: '.xlsx', label: 'Excel Workbooks' },
    { ext: '.json', label: 'API Payloads & Logs' },
    { ext: '.xml', label: 'Config & Schemas' },
    { ext: '.docx', label: 'Word Resumes' },
    { ext: '.pdf', label: 'PDF Documents' },
    { ext: '.eml', label: 'Email Tickets' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/25 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white/95 backdrop-blur-2xl rounded-3xl border border-white/90 shadow-2xl ring-1 ring-slate-200/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
              Add Document to PII Shield
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              100% Client-Side Privacy • Python WASM • Zero Bytes Sent to Any Server
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-3 border-b border-slate-100 flex gap-2 bg-slate-50/40">
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Custom Files</span>
            {batchFiles.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 rounded-full text-[10px]">
                {batchFiles.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'text'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Type or Paste Text</span>
          </button>

          <button
            onClick={() => setActiveTab('samples')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all cursor-pointer ${
              activeTab === 'samples'
                ? 'border-indigo-600 text-indigo-700 bg-white shadow-2xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Quick Demo Samples</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[460px]">
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div
                onClick={onTriggerUpload}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    onFileDrop(e.dataTransfer.files);
                    onClose();
                  }
                }}
                className={`p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50/80 shadow-md ring-4 ring-indigo-400/20'
                    : 'border-slate-300 bg-slate-50/60 hover:bg-indigo-50/30 hover:border-indigo-300'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-xs">
                  <UploadCloud className="w-6 h-6 animate-bounce" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">
                  Drag & Drop any file here, or click to browse
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mb-4">
                  Multi-file batch uploads supported. All files process 100% locally in browser memory with a shared pseudonym map.
                </p>

                <div className="flex flex-wrap justify-center gap-1.5 max-w-md">
                  {supportedFormats.map((fmt) => (
                    <span
                      key={fmt.ext}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs"
                      title={fmt.label}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      {fmt.ext}
                    </span>
                  ))}
                </div>
              </div>

              {batchFiles.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      Uploaded Documents Queue ({batchFiles.length})
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Click to switch document
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {batchFiles.map((f, idx) => {
                      const isActive = activeBatchIndex === idx;
                      return (
                        <div
                          key={f.id || idx}
                          onClick={() => { onSelectBatchFile(idx); onClose(); }}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isActive
                              ? 'bg-indigo-50 border-indigo-300 font-semibold text-indigo-950 shadow-2xs ring-1 ring-indigo-400/40'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                            <span className="truncate max-w-xs">{f.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              ({(f.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isActive && (
                              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                                Active
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveBatchFile(idx);
                              }}
                              className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                              title="Remove file"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-blue-50/30 border border-indigo-100/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Paste from Clipboard
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Instantly load sensitive text, logs, or clinical transcripts from your clipboard.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onPasteClipboard();
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <ClipboardPaste className="w-4 h-4" />
                  <span>Paste Clipboard Text</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Start Blank Document
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Clear the workspace and switch the left pane into live interactive typing mode.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onStartBlank();
                    onClose();
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
                >
                  <PenTool className="w-4 h-4 text-indigo-600" />
                  <span>Start Blank Editor</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'samples' && (
            <div className="space-y-2.5">
              <p className="text-xs text-slate-500 mb-1">
                Choose a pre-configured scenario containing real PII and subtle false-positive checksum traps to evaluate the Python engine:
              </p>

              <button
                onClick={() => {
                  onLoadSample('mixed');
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-300 transition-all text-left cursor-pointer group shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Incident Dossier</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-indigo-100 text-indigo-800 font-bold">.txt</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Security escalation with PAN, Aadhaar, Cards, Phone, Email, IPv4 and 4 false-positive checksum traps.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onLoadSample('json');
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-300 transition-all text-left cursor-pointer group shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Structured API Event Log</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-100 text-blue-800 font-bold">.json</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nested JSON payload with Bearer JWT tokens, Shannon API secrets, and server IP addresses.
                  </p>
                </div>
              </button>

              <button
                onClick={() => {
                  onLoadSample('csv');
                  onClose();
                }}
                className="w-full flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-indigo-50/40 hover:border-indigo-300 transition-all text-left cursor-pointer group shadow-2xs"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">Customer Support Table</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-bold">.csv</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Multi-column customer ledger preserving quoted fields, commas, and row alignment.
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
          <span>Client-Side Safe WASM Execution</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
