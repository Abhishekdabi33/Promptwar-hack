import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Check, 
  Copy, 
  Puzzle, 
  ShieldCheck, 
  Zap, 
  FolderDown, 
  ToggleRight, 
  ExternalLink 
} from 'lucide-react';

interface ExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function ExtensionModal({ isOpen, onClose, onToast }: ExtensionModalProps) {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = '/pii-shield-extension.zip';
    link.download = 'pii-shield-extension.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (onToast) onToast('Downloaded PII Shield Chrome Extension (.zip)');
    setTimeout(() => setIsDownloading(false), 800);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText('chrome://extensions/');
    setCopiedUrl(true);
    if (onToast) onToast('Copied chrome://extensions/ to clipboard');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Puzzle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                PII Shield Browser Extension
              </h2>
              <p className="text-xs text-slate-500">
                Live input field protection for Chrome, Edge, Brave, and Chromium
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-900">Input Monitoring</div>
              <div className="text-[11px] text-slate-500 leading-normal">
                Detects cards, passwords, OTPs, and personal identity numbers as you type.
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-900">1-Click Masking</div>
              <div className="text-[11px] text-slate-500 leading-normal">
                Inline floating badge lets you redact sensitive entities before submission.
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <ExternalLink className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-900">100% Local Guard</div>
              <div className="text-[11px] text-slate-500 leading-normal">
                Runs entirely in-browser with zero remote network calls or telemetry.
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
              3-Step Installation Guide (Manifest V3)
            </h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900">Download & Extract Zip</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Download the pre-bundled extension package and extract the folder to a convenient location on your machine.
                  </div>
                </div>
                <button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isDownloading ? 'Downloading...' : 'Download .zip'}</span>
                </button>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900">Enable Developer Mode in Chrome</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Navigate to <code className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px]">chrome://extensions</code> in your browser and turn on the Developer mode toggle in the top-right corner.
                  </div>
                </div>
                <button
                  onClick={handleCopyUrl}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? 'Copied' : 'Copy URL'}</span>
                </button>
              </div>

              <div className="flex items-start gap-3.5 p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-slate-900">Load Unpacked Extension</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Click the <strong>Load unpacked</strong> button in the top-left toolbar and select the unzipped extension directory. PII Shield is now active across all open web tabs.
                  </div>
                </div>
                <div className="flex items-center gap-1 text-slate-400 flex-shrink-0">
                  <FolderDown className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <ToggleRight className="w-4 h-4 text-emerald-600" />
            <span>Tested for Chrome Manifest V3 specification</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Extension Bundle (.zip)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
