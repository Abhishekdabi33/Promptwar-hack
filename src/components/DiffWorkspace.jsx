import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Code, 
  Eye, 
  FileText, 
  Table2, 
  ShieldCheck, 
  ShieldX, 
  SlidersHorizontal,
  ExternalLink,
  Info
} from 'lucide-react';
import TablePreview from './TablePreview';
import { parseDelimitedTextToMatrix } from '../utils/fileHandlers';

export default function DiffWorkspace({
  rawText,
  onChangeRawText,
  sanitizedText,
  matches = [],
  activeFile,
  activeFormat,
  whitelistedIds,
  onToggleWhitelist,
  highlightedCategory,
  currentEntityIndex,
  onCopySanitized,
  isCopied,
  tableMatrix
}) {
  const [viewMode, setViewMode] = useState('inspect');
  const [showTablePreview, setShowTablePreview] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });

  const leftPaneRef = useRef(null);
  const rightPaneRef = useRef(null);
  const isScrollingRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  const rawLines = useMemo(() => rawText.split('\n'), [rawText]);
  const sanitizedLines = useMemo(() => sanitizedText.split('\n'), [sanitizedText]);
  const totalLines = Math.max(rawLines.length, sanitizedLines.length);

  const activeMatches = useMemo(() => {
    return matches.filter(m => !whitelistedIds.has(m.id));
  }, [matches, whitelistedIds]);

  const handleLeftScroll = () => {
    if (isScrollingRef.current === 'right') return;
    isScrollingRef.current = 'left';

    if (leftPaneRef.current && rightPaneRef.current) {
      const scrollFraction = leftPaneRef.current.scrollTop / (leftPaneRef.current.scrollHeight - leftPaneRef.current.clientHeight || 1);
      rightPaneRef.current.scrollTop = scrollFraction * (rightPaneRef.current.scrollHeight - rightPaneRef.current.clientHeight);
    }

    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = null;
    }, 50);
  };

  const handleRightScroll = () => {
    if (isScrollingRef.current === 'left') return;
    isScrollingRef.current = 'right';

    if (leftPaneRef.current && rightPaneRef.current) {
      const scrollFraction = rightPaneRef.current.scrollTop / (rightPaneRef.current.scrollHeight - rightPaneRef.current.clientHeight || 1);
      leftPaneRef.current.scrollTop = scrollFraction * (leftPaneRef.current.scrollHeight - leftPaneRef.current.clientHeight);
    }

    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = null;
    }, 50);
  };

  const scrollToLine = (lineNum) => {
    const targetIdx = Math.max(0, lineNum - 1);
    const approxLineHeight = 22;
    const targetScroll = targetIdx * approxLineHeight - 80;

    if (leftPaneRef.current) {
      leftPaneRef.current.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
    if (rightPaneRef.current) {
      rightPaneRef.current.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (highlightedCategory && activeMatches.length > 0) {
      const catMatches = activeMatches.filter(m => m.type === highlightedCategory);
      if (catMatches.length > 0 && currentEntityIndex < catMatches.length) {
        const m = catMatches[currentEntityIndex];
        scrollToLine(m.line);
        setSelectedMatch(m);
      }
    }
  }, [highlightedCategory, currentEntityIndex]);

  const getPillColor = (type, isWhitelisted = false) => {
    if (isWhitelisted) {
      return 'bg-slate-200/80 text-slate-500 line-through border border-slate-300';
    }
    switch (type) {
      case 'Credit Card': return 'bg-rose-100/90 text-rose-900 border border-rose-300 shadow-2xs font-semibold';
      case 'Aadhaar': return 'bg-indigo-100/90 text-indigo-900 border border-indigo-300 shadow-2xs font-semibold';
      case 'PAN': return 'bg-purple-100/90 text-purple-900 border border-purple-300 shadow-2xs font-semibold';
      case 'Email': return 'bg-blue-100/90 text-blue-900 border border-blue-300 shadow-2xs font-semibold';
      case 'Phone': return 'bg-cyan-100/90 text-cyan-900 border border-cyan-300 shadow-2xs font-semibold';
      case 'IPv4': return 'bg-amber-100/90 text-amber-900 border border-amber-300 shadow-2xs font-semibold';
      case 'Secret Token': return 'bg-orange-100/90 text-orange-900 border border-orange-300 shadow-2xs font-semibold';
      case 'Custom': return 'bg-teal-100/90 text-teal-900 border border-teal-300 shadow-2xs font-semibold';
      default: return 'bg-slate-100 text-slate-900 border border-slate-300';
    }
  };

  const getDotColor = (type) => {
    switch (type) {
      case 'Credit Card': return '#E11D48';
      case 'Aadhaar': return '#4F46E5';
      case 'PAN': return '#9333EA';
      case 'Email': return '#2563EB';
      case 'Phone': return '#0891B2';
      case 'IPv4': return '#D97706';
      case 'Secret Token': return '#EA580C';
      case 'Custom': return '#0D9488';
      default: return '#64748B';
    }
  };

  const openMatchPopover = (match, e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + window.scrollY + 8,
      left: Math.min(window.innerWidth - 320, Math.max(20, rect.left + window.scrollX - 100))
    });
    setSelectedMatch(match);
  };

  const renderInspectRaw = () => {
    if (matches.length === 0) {
      return (
        <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-all leading-[22px]">
          {rawText}
        </pre>
      );
    }

    const segments = [];
    let lastIdx = 0;
    const sorted = [...matches].sort((a, b) => a.start - b.start);

    sorted.forEach((m, idx) => {
      if (m.start > lastIdx) {
        segments.push(
          <span key={`text_${idx}`}>{rawText.slice(lastIdx, m.start)}</span>
        );
      }
      const isWhite = whitelistedIds.has(m.id);
      const isHighlighted = highlightedCategory ? m.type === highlightedCategory : false;

      segments.push(
        <mark
          key={`match_${m.id}`}
          onClick={(e) => openMatchPopover(m, e)}
          className={`cursor-pointer px-1 py-0.5 rounded text-xs transition-all ${getPillColor(m.type, isWhite)} ${
            isHighlighted ? 'ring-2 ring-indigo-500 scale-105 inline-block' : ''
          }`}
          title={`${m.type}: Click to inspect Python proof`}
        >
          {m.value}
        </mark>
      );
      lastIdx = m.end;
    });

    if (lastIdx < rawText.length) {
      segments.push(<span key="text_end">{rawText.slice(lastIdx)}</span>);
    }

    return (
      <pre className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-all leading-[22px]">
        {segments}
      </pre>
    );
  };

  const isTabular = ['csv', 'tsv', 'xlsx'].includes(activeFormat);
  const matrixData = useMemo(() => {
    if (tableMatrix) return tableMatrix;
    if (isTabular) return parseDelimitedTextToMatrix(sanitizedText, activeFormat === 'tsv' ? '\t' : ',');
    return null;
  }, [tableMatrix, isTabular, sanitizedText, activeFormat]);

  return (
    <div className="relative mb-5">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/70 gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>{activeFile?.name || 'Raw Document Editor'}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-slate-200/80 text-slate-700">
              {activeFormat || 'text'}
            </span>
            {activeFile?.size && (
              <span className="text-[11px] text-slate-400">
                ({(activeFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/60">
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'edit'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Raw Editor</span>
              </button>
              <button
                onClick={() => setViewMode('inspect')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'inspect'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-indigo-600" />
                <span>X-Ray Inspect</span>
              </button>
            </div>

            {isTabular && (
              <button
                onClick={() => setShowTablePreview(!showTablePreview)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all ${
                  showTablePreview
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Table2 className="w-3.5 h-3.5" />
                <span>Table Grid</span>
              </button>
            )}

            <button
              onClick={onCopySanitized}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors ml-1"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Clean Text</span>
                </>
              )}
            </button>
          </div>
        </div>

        {showTablePreview && matrixData ? (
          <div className="p-4 bg-slate-50/50 min-h-[480px]">
            <TablePreview matrix={matrixData} />
          </div>
        ) : (
          <div className="relative grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 min-h-[500px] max-h-[640px]">
            <div className="flex flex-col h-full overflow-hidden bg-slate-50/30">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-100/50 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span>Original Untrusted Stream</span>
                <span>{rawLines.length} lines</span>
              </div>

              <div
                ref={leftPaneRef}
                onScroll={handleLeftScroll}
                className="flex-1 overflow-auto flex p-3 text-xs"
              >
                <div className="select-none pr-3 text-right text-slate-300 font-mono text-[11px] leading-[22px] min-w-[32px] border-r border-slate-100 mr-3">
                  {rawLines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                <div className="flex-1 min-w-0">
                  {viewMode === 'edit' ? (
                    <textarea
                      value={rawText}
                      onChange={(e) => onChangeRawText(e.target.value)}
                      placeholder="Paste text, log entries, or drag files here..."
                      className="w-full h-full bg-transparent border-0 p-0 text-slate-900 font-mono text-xs leading-[22px] resize-none focus:outline-hidden"
                      spellCheck={false}
                    />
                  ) : (
                    renderInspectRaw()
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col h-full overflow-hidden bg-white">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-100/50 flex items-center justify-between text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <span className="text-emerald-700 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Sanitized Zero-Leakage Stream
                </span>
                <span>{sanitizedLines.length} lines</span>
              </div>

              <div
                ref={rightPaneRef}
                onScroll={handleRightScroll}
                className="flex-1 overflow-auto flex p-3 text-xs"
              >
                <div className="select-none pr-3 text-right text-slate-300 font-mono text-[11px] leading-[22px] min-w-[32px] border-r border-slate-100 mr-3">
                  {sanitizedLines.map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                <div className="flex-1 min-w-0 font-mono text-xs leading-[22px] text-slate-800 whitespace-pre-wrap break-all">
                  {sanitizedText}
                </div>
              </div>
            </div>

            <div className="absolute right-0 top-10 bottom-0 w-3 bg-slate-100/70 border-l border-slate-200 hidden md:block">
              {activeMatches.map((m) => {
                const fraction = Math.min(1, Math.max(0, (m.line - 1) / Math.max(totalLines, 1)));
                const topPercent = (fraction * 100).toFixed(1);
                return (
                  <button
                    key={m.id}
                    onClick={() => scrollToLine(m.line)}
                    style={{ top: `${topPercent}%` }}
                    className="absolute right-0.5 w-2 h-2 rounded-full transform -translate-y-1/2 hover:scale-150 transition-transform shadow-xs"
                    title={`Line ${m.line}: ${m.type} (${m.value})`}
                  >
                    <span
                      className="block w-full h-full rounded-full"
                      style={{ backgroundColor: getDotColor(m.type) }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedMatch && (
        <div
          style={{ top: popoverPos.top, left: popoverPos.left }}
          className="fixed z-50 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${getPillColor(selectedMatch.type)}`}>
                {selectedMatch.type}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Line {selectedMatch.line}
              </span>
            </div>
            <button
              onClick={() => setSelectedMatch(null)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded"
            >
              ✕
            </button>
          </div>

          <div className="my-3 space-y-2 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Python Engine Validation Proof
              </span>
              <div className="mt-0.5 text-slate-800 font-medium bg-slate-50 p-1.5 rounded-md border border-slate-100 font-mono text-[11px]">
                ✓ {selectedMatch.reason}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Original Sensitive Entity
              </span>
              <div className="mt-0.5 text-rose-800 bg-rose-50/70 p-1.5 rounded-md border border-rose-100 font-mono text-[11px] break-all">
                {selectedMatch.value}
              </div>
            </div>

            {selectedMatch.redacted_value && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Redacted Transformation
                </span>
                <div className="mt-0.5 text-emerald-800 bg-emerald-50/70 p-1.5 rounded-md border border-emerald-100 font-mono text-[11px] break-all">
                  {selectedMatch.redacted_value}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-[10px] text-slate-400">
              ID: {selectedMatch.id}
            </span>
            <button
              onClick={() => {
                onToggleWhitelist(selectedMatch.id);
                setSelectedMatch(null);
              }}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors shadow-2xs ${
                whitelistedIds.has(selectedMatch.id)
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {whitelistedIds.has(selectedMatch.id) ? 'Re-Apply Redaction' : 'Whitelist / Ignore'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
