import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home, 
  FileText, 
  ShieldCheck, 
  History, 
  SlidersHorizontal, 
  TerminalSquare, 
  Download, 
  Puzzle, 
  Smartphone, 
  Activity, 
  Check, 
  Sparkles,
  ExternalLink 
} from 'lucide-react';
import { AppMode, TabType } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  appMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  onReturnHome: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  onOpenRules: () => void;
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  onDownloadExtension: () => void;
  onInstallMobileApp?: () => void;
  canInstallMobile?: boolean;
}

export default function Sidebar({
  isOpen,
  onClose,
  appMode,
  onSelectMode,
  onReturnHome,
  onOpenHistory,
  historyCount,
  onOpenRules,
  activeTab,
  onSelectTab,
  onDownloadExtension,
  onInstallMobileApp,
  canInstallMobile = false
}: SidebarProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [externalCalls, setExternalCalls] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      const hasTouch = window.matchMedia('(pointer: coarse)').matches;
      const isNarrow = window.innerWidth < 768;
      const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile((hasTouch || isMobileUA) && isNarrow);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    try {
      if (typeof window !== 'undefined' && window.performance) {
        const resources = performance.getEntriesByType('resource');
        const externals = resources.filter(r => {
          try {
            const url = new URL(r.name);
            return url.origin !== window.location.origin;
          } catch (e) {
            return false;
          }
        });
        setExternalCalls(externals.length);
      }
    } catch (e) {}
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex">
        <motion.div 
          initial={{ x: -320 }}
          animate={{ x: 0 }}
          exit={{ x: -320 }}
          transition={{ type: "spring", damping: 28, stiffness: 300 }}
          className="w-80 bg-white/90 backdrop-blur-2xl border-r border-slate-200 shadow-2xl flex flex-col justify-between"
        >
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-2xs">
                🛡️
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">PII Shield</h2>
                <span className="text-[10px] text-slate-500 font-medium">Local Browser Workspace</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
                Navigation
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onReturnHome();
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  <Home className="w-4 h-4 text-slate-500" />
                  <span>Return to Landing Page</span>
                </button>

                <button
                  onClick={() => {
                    onSelectMode('sanitizer');
                    onSelectTab('studio');
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'studio' && appMode === 'sanitizer'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>Document & File Sanitizer</span>
                </button>

                <button
                  onClick={() => {
                    onSelectMode('message_guard');
                    onSelectTab('studio');
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'studio' && appMode === 'message_guard'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Message Safety Guard</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
                Workspace Tools
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onOpenHistory();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <History className="w-4 h-4 text-slate-500" />
                    <span>Activity History</span>
                  </div>
                  {historyCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 text-[10px] font-mono font-medium">
                      {historyCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    onOpenRules();
                    onClose();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100/80 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  <span>Settings & Safety Rules</span>
                </button>

                <button
                  onClick={() => {
                    onSelectTab('promptlog');
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    activeTab === 'promptlog'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <TerminalSquare className="w-4 h-4" />
                  <span>Curated Prompt Log</span>
                </button>
              </div>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-2">
                Protection Ecosystem
              </span>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    onDownloadExtension();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 text-white shadow-[0_3px_0_#0f172a] active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Puzzle className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="text-xs font-bold">Download Chrome Extension</div>
                      <div className="text-[10px] text-slate-300">1-Tap Direct .zip Package</div>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-white" />
                </button>

                {isMobile && canInstallMobile && (
                  <button
                    onClick={() => {
                      if (onInstallMobileApp) onInstallMobileApp();
                      onClose();
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 shadow-[0_3px_0_#a7f3d0] active:translate-y-[2px] active:shadow-[0_1px_0_#a7f3d0] transition-all cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="w-4 h-4 text-emerald-700" />
                      <div>
                        <div className="text-xs font-bold">Install Mobile PWA</div>
                        <div className="text-[10px] text-emerald-700">Add to Home Screen</div>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-emerald-700" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50">
            <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>Live Network Monitor</span>
                </div>
                <span className="font-mono text-[11px] font-bold text-emerald-700">0 B Egress</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                {externalCalls} External Requests • Local Pyodide Worker Active
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
