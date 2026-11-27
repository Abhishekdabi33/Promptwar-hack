import React, { useState } from 'react';
import { 
  Download, 
  FileCheck2, 
  Key, 
  Fingerprint, 
  Copy, 
  ShieldCheck, 
  Check 
} from 'lucide-react';
import { RedactionMode } from '../types';

interface ExportBarProps {
  onDownloadSanitized: () => void;
  onDownloadAuditReport: () => void;
  onDownloadVault: () => void;
  redactionMode: RedactionMode;
  activeFormat: string;
  rawHash?: string;
  sanitizedHash?: string;
  activeMatchesCount: number;
}

export default function ExportBar({
  onDownloadSanitized,
  onDownloadAuditReport,
  onDownloadVault,
  redactionMode,
  activeFormat,
  rawHash,
  sanitizedHash
}: ExportBarProps) {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const copyToClipboard = (hash: string, label: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(label);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const cleanExt = (activeFormat || 'txt').trim().toLowerCase().replace(/^\./, '');
  const displayExt = cleanExt === 'text' ? 'txt' : (cleanExt || 'txt');

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/90 shadow-sm ring-1 ring-slate-200/60 px-4 py-2.5 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline whitespace-nowrap">
            FINGERPRINTS:
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50/90 border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-nowrap shadow-2xs">
            <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-sans font-medium text-slate-500">Raw SHA-256:</span>
            <span className="font-bold text-slate-800">
              {rawHash ? `${rawHash.slice(0, 8)}...${rawHash.slice(-6)}` : 'Computing...'}
            </span>
            {rawHash && (
              <button
                onClick={() => copyToClipboard(rawHash, 'raw')}
                className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 ml-0.5 cursor-pointer"
                title="Copy full raw hash"
              >
                {copiedHash === 'raw' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50/90 border border-emerald-200 font-mono text-[11px] text-emerald-900 whitespace-nowrap shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-sans font-medium text-emerald-700">Clean SHA-256:</span>
            <span className="font-bold text-emerald-950">
              {sanitizedHash ? `${sanitizedHash.slice(0, 8)}...${sanitizedHash.slice(-6)}` : 'Computing...'}
            </span>
            {sanitizedHash && (
              <button
                onClick={() => copyToClipboard(sanitizedHash, 'san')}
                className="p-0.5 hover:bg-emerald-200 rounded text-emerald-700 ml-0.5 cursor-pointer"
                title="Copy full sanitized hash"
              >
                {copiedHash === 'san' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {redactionMode === 'pseudonym' && (
            <button
              onClick={onDownloadVault}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white/90 hover:bg-white border border-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap hover:border-indigo-300"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pseudonym Key (.json)</span>
            </button>
          )}

          <button
            onClick={onDownloadAuditReport}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white/90 hover:bg-white border border-slate-200 rounded-xl shadow-2xs transition-all cursor-pointer whitespace-nowrap hover:border-indigo-300"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit JSON</span>
          </button>

          <button
            onClick={onDownloadSanitized}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 rounded-xl shadow-xs shadow-indigo-500/20 transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download Sanitized (.${displayExt})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
