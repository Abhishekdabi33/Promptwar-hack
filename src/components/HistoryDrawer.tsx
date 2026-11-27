import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  History, 
  Search, 
  Trash2, 
  Download, 
  RotateCcw, 
  Copy, 
  Check, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  MessageSquare,
  Clock
} from 'lucide-react';
import { ActivityHistoryItem } from '../types';
import { exportHistoryAsJson } from '../utils/historyStorage';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ActivityHistoryItem[];
  onRestore: (item: ActivityHistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  history,
  onRestore,
  onDelete,
  onClearAll,
  addToast
}: HistoryDrawerProps) {
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'sanitizer' | 'message_guard'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      if (filterMode !== 'all' && item.mode !== filterMode) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.rawPreview.toLowerCase().includes(q) ||
        item.sanitizedPreview.toLowerCase().includes(q)
      );
    });
  }, [history, filterMode, search]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopy = (item: ActivityHistoryItem) => {
    navigator.clipboard.writeText(item.sanitizedText);
    setCopiedId(item.id);
    addToast('Sanitized text copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Activity History</h2>
              <span className="text-[10px] text-slate-500 font-medium">Local Browser Storage • Zero Network Calls</span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close activity history drawer"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search past activity..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({history.length})
              </button>
              <button
                onClick={() => setFilterMode('sanitizer')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterMode === 'sanitizer'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Docs
              </button>
              <button
                onClick={() => setFilterMode('message_guard')}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filterMode === 'message_guard'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                Messages
              </button>
            </div>

            {history.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => exportHistoryAsJson(history)}
                  className="p-1 text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                  title="Export history JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Clear all local activity history? This cannot be undone.')) {
                      onClearAll();
                      addToast('Cleared all local activity history');
                    }
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                  title="Clear all history"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50/50">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center">
              <History className="w-8 h-8 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="font-medium text-slate-600">No activity found</p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                Sanitize a document or scan a message to automatically track private offline history.
              </p>
            </div>
          ) : (
            filteredHistory.map((item) => {
              const isMsg = item.mode === 'message_guard';
              return (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs hover:border-slate-300 transition-colors flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {isMsg ? (
                        <span className="p-1 rounded bg-amber-50 text-amber-700 flex-shrink-0">
                          <MessageSquare className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="p-1 rounded bg-blue-50 text-blue-700 flex-shrink-0">
                          <FileText className="w-3 h-3" />
                        </span>
                      )}
                      <span className="font-semibold text-xs text-slate-900 truncate" title={item.title}>
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0 text-[10px] text-slate-400">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTime(item.timestamp)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-100 font-mono text-[11px] text-slate-700 line-clamp-2 break-all">
                    {item.sanitizedPreview || item.rawPreview || 'Empty text'}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                        item.risksCount > 0
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {item.risksCount} risk{item.risksCount === 1 ? '' : 's'}
                      </span>
                      <span className="text-[10px] text-slate-400 capitalize">
                        {item.redactionMode}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(item)}
                        className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        title="Copy clean text"
                      >
                        {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>

                      <button
                        onClick={() => {
                          onRestore(item);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Restore to workspace"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
