import React from 'react';
import { Layers, FileText, CheckCircle, X, Archive } from 'lucide-react';
import { BatchFile } from '../types';

interface BatchQueueStripProps {
  files: BatchFile[];
  activeFileIndex: number;
  onSelectFile: (idx: number) => void;
  onRemoveFile: (idx: number) => void;
  onDownloadAllZip: () => void;
}

export default function BatchQueueStrip({
  files = [],
  activeFileIndex,
  onSelectFile,
  onRemoveFile,
  onDownloadAllZip
}: BatchQueueStripProps) {
  if (files.length <= 1) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm mb-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">
            Multi-File Batch Queue ({files.length} documents)
          </span>
          <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-semibold">
            Unified Shared Pseudonym Vault
          </span>
        </div>

        <button
          onClick={onDownloadAllZip}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Download All as ZIP</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pt-3 pb-1">
        {files.map((file, idx) => {
          const isActive = activeFileIndex === idx;
          const isDone = Boolean(file.sanitizedText || file.sanitizedBlob);

          return (
            <div
              key={file.id || idx}
              onClick={() => onSelectFile(idx)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs border cursor-pointer transition-all flex-shrink-0 select-none ${
                isActive
                  ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-500/20 text-indigo-950 font-medium'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div className="flex flex-col">
                <span className="max-w-[140px] truncate">{file.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(file.size / 1024).toFixed(1)} KB • {file.format}
                </span>
              </div>
              {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-500 ml-1" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFile(idx);
                }}
                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
