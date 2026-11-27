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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Zero-Leakage Cryptographic Fingerprints
          </span>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-[11px] text-slate-700">
              <Fingerprint className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-sans font-medium text-slate-500">Raw SHA-256:</span>
              <span className="font-bold text-slate-800">
                {rawHash ? `${rawHash.slice(0, 10)}...${rawHash.slice(-8)}` : 'Generating...'}
              </span>
              {rawHash && (
                <button
                  onClick={() => copyToClipboard(rawHash, 'raw')}
                  className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 ml-1"
                  title="Copy full raw hash"
                >
                  {copiedHash === 'raw' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 font-mono text-[11px] text-emerald-900">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-sans font-medium text-emerald-700">Clean SHA-256:</span>
              <span className="font-bold text-emerald-950">
                {sanitizedHash ? `${sanitizedHash.slice(0, 10)}...${sanitizedHash.slice(-8)}` : 'Generating...'}
              </span>
              {sanitizedHash && (
                <button
                  onClick={() => copyToClipboard(sanitizedHash, 'san')}
                  className="p-0.5 hover:bg-emerald-200 rounded text-emerald-700 ml-1"
                  title="Copy full sanitized hash"
                >
                  {copiedHash === 'san' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {redactionMode === 'pseudonym' && (
            <button
              onClick={onDownloadVault}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
            >
              <Key className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download Vault (.json)</span>
            </button>
          )}

          <button
            onClick={onDownloadAuditReport}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition-colors"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Audit Report (.json)</span>
          </button>

          <button
            onClick={onDownloadSanitized}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-white" />
            <span>Download Sanitized File ({activeFormat ? `.${activeFormat}` : 'Native'})</span>
          </button>
        </div>
      </div>
    </div>
  );
}
