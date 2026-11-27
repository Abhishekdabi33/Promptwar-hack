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
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs px-4 py-3 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline whitespace-nowrap">
            FINGERPRINTS:
          </span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-nowrap">
            <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-sans font-medium text-slate-500">Raw SHA-256:</span>
            <span className="font-semibold text-slate-800">
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

          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 font-mono text-[11px] text-emerald-900 whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-sans font-medium text-emerald-700">Clean SHA-256:</span>
            <span className="font-semibold text-emerald-950">
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap hover:text-slate-900"
            >
              <Key className="w-3.5 h-3.5 text-slate-500" />
              <span>Pseudonym Key (.json)</span>
            </button>
          )}

          <button
            onClick={onDownloadAuditReport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap hover:text-slate-900"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Audit Report (.json)</span>
          </button>

          <button
            onClick={onDownloadSanitized}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all cursor-pointer whitespace-nowrap active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download Sanitized (.{displayExt})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
