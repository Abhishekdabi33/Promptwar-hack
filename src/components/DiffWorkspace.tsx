import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Code, 
  Eye, 
  FileText, 
  Table2, 
  ShieldCheck
} from 'lucide-react';
import TablePreview from './TablePreview';
import { parseDelimitedTextToMatrix } from '../utils/fileHandlers';
import { PIIMatch, BatchFile, EntityCategory } from '../types';

interface DiffWorkspaceProps {
  rawText: string;
  onChangeRawText: (text: string) => void;
  sanitizedText: string;
  matches: PIIMatch[];
  activeFile: BatchFile | null;
  activeFormat: string;
  whitelistedIds: Set<string>;
  onToggleWhitelist: (id: string) => void;
  highlightedCategory: EntityCategory | null;
  currentEntityIndex: number;
  onCopySanitized: () => void;
  isCopied: boolean;
  tableMatrix?: string[][];
}

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
}: DiffWorkspaceProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'inspect'>('inspect');
  const [showTablePreview, setShowTablePreview] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PIIMatch | null>(null);
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const unifiedScrollRef = useRef<HTMLDivElement>(null);

  const trimmedRaw = useMemo(() => rawText.replace(/\r?\n$/, ''), [rawText]);
  const trimmedSanitized = useMemo(() => sanitizedText.replace(/\r?\n$/, ''), [sanitizedText]);

  const rawLines = useMemo(() => (trimmedRaw ? trimmedRaw.split('\n') : ['']), [trimmedRaw]);
  const sanitizedLines = useMemo(() => (trimmedSanitized ? trimmedSanitized.split('\n') : ['']), [trimmedSanitized]);
  const totalLines = Math.max(rawLines.length, sanitizedLines.length);

  const activeMatches = useMemo(() => {
    return matches.filter(m => !whitelistedIds.has(m.id));
  }, [matches, whitelistedIds]);

  const matchesByLine = useMemo(() => {
    const map = new Map<number, PIIMatch[]>();
    for (const m of matches) {
      if (!map.has(m.line)) map.set(m.line, []);
      map.get(m.line)!.push(m);
    }
    return map;
  }, [matches]);

  const scrollToLine = (lineNum: number) => {
    const el = document.getElementById(`diff_row_${lineNum}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  const getPillColor = (type: EntityCategory, isWhitelisted = false) => {
    if (isWhitelisted) {
      return 'bg-slate-200/90 text-slate-500 line-through border border-slate-300';
    }
    switch (type) {
      case 'Credit Card': return 'bg-rose-100 text-rose-900 border border-rose-300 shadow-2xs font-semibold';
      case 'Aadhaar': return 'bg-indigo-100 text-indigo-900 border border-indigo-300 shadow-2xs font-semibold';
      case 'PAN': return 'bg-purple-100 text-purple-900 border border-purple-300 shadow-2xs font-semibold';
      case 'Email': return 'bg-blue-100 text-blue-900 border border-blue-300 shadow-2xs font-semibold';
      case 'Phone': return 'bg-cyan-100 text-cyan-900 border border-cyan-300 shadow-2xs font-semibold';
      case 'IPv4': return 'bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs font-semibold';
      case 'Secret Token': return 'bg-orange-100 text-orange-900 border border-orange-300 shadow-2xs font-semibold';
      case 'Custom': return 'bg-teal-100 text-teal-900 border border-teal-300 shadow-2xs font-semibold';
      default: return 'bg-slate-100 text-slate-900 border border-slate-300';
    }
  };

  const getDotColor = (type: EntityCategory) => {
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

  const openMatchPopover = (match: PIIMatch, e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + window.scrollY + 6,
      left: Math.min(window.innerWidth - 320, Math.max(16, rect.left + window.scrollX - 80))
    });
    setSelectedMatch(match);
  };

  const formatTokenFallback = (type: EntityCategory) => {
    switch (type) {
      case 'Email': return '[REDACTED_EMAIL]';
      case 'Credit Card': return '[REDACTED_CARD]';
      case 'Aadhaar': return '[REDACTED_AADHAAR]';
      case 'PAN': return '[REDACTED_PAN]';
      case 'Secret Token': return '[REDACTED_SECRET]';
      case 'IPv4': return '[REDACTED_IPV4]';
      case 'Phone': return '[REDACTED_PHONE]';
      case 'Custom': return '[REDACTED_CUSTOM]';
      default: return '[REDACTED]';
    }
  };

  const renderInspectLine = (lineText: string, lineNo: number) => {
    const lineMatches = (matchesByLine.get(lineNo) || []).slice().sort((a, b) => a.start - b.start);
    if (lineMatches.length === 0) {
      return (
        <span className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-words break-all">
          {lineText || ' '}
        </span>
      );
    }

    const segments: React.ReactNode[] = [];
    let curIdx = 0;
    const occurrences: Array<{ start: number; end: number; match: PIIMatch }> = [];

    for (const m of lineMatches) {
      const idx = lineText.indexOf(m.value, curIdx);
      if (idx !== -1) {
        occurrences.push({ start: idx, end: idx + m.value.length, match: m });
        curIdx = idx + m.value.length;
      }
    }
    occurrences.sort((a, b) => a.start - b.start);

    let lastEnd = 0;
    occurrences.forEach((occ, i) => {
      if (occ.start > lastEnd) {
        segments.push(
          <span key={`raw_plain_${i}`} className="whitespace-pre-wrap break-words break-all">
            {lineText.slice(lastEnd, occ.start)}
          </span>
        );
      }
      const isWhite = whitelistedIds.has(occ.match.id);
      const isHighlighted = highlightedCategory ? occ.match.type === highlightedCategory : false;

      segments.push(
        <mark
          key={`mark_${occ.match.id}_${i}`}
          onClick={(e) => openMatchPopover(occ.match, e)}
          className={`cursor-pointer px-1.5 py-0.5 rounded text-[11px] font-mono transition-all inline-block ${getPillColor(occ.match.type, isWhite)} ${
            isHighlighted ? 'ring-2 ring-indigo-500 scale-105 font-bold' : ''
          }`}
          title={`${occ.match.type}: Click to inspect Python proof`}
        >
          {occ.match.value}
        </mark>
      );
      lastEnd = occ.end;
    });

    if (lastEnd < lineText.length) {
      segments.push(
        <span key="raw_plain_end" className="whitespace-pre-wrap break-words break-all">
          {lineText.slice(lastEnd)}
        </span>
      );
    }

    return (
      <span className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-words break-all">
        {segments}
      </span>
    );
  };

  const renderSanitizedLine = (lineText: string, lineNo: number) => {
    const lineMatches = (matchesByLine.get(lineNo) || []).slice().sort((a, b) => a.start - b.start);
    if (lineMatches.length === 0) {
      return (
        <span className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-words break-all">
          {lineText || ' '}
        </span>
      );
    }

    const segments: React.ReactNode[] = [];
    let curSearchIdx = 0;
    const occurrences: Array<{ start: number; end: number; match: PIIMatch; token: string }> = [];

    for (const m of lineMatches) {
      const isWhite = whitelistedIds.has(m.id);
      const token = isWhite ? m.value : (m.redacted_value || formatTokenFallback(m.type));
      if (!token) continue;
      const idx = lineText.indexOf(token, curSearchIdx);
      if (idx !== -1) {
        occurrences.push({ start: idx, end: idx + token.length, match: m, token });
        curSearchIdx = idx + token.length;
      }
    }

    occurrences.sort((a, b) => a.start - b.start);

    let lastEnd = 0;
    occurrences.forEach((occ, i) => {
      if (occ.start > lastEnd) {
        segments.push(
          <span key={`san_plain_${i}`} className="whitespace-pre-wrap break-words break-all">
            {lineText.slice(lastEnd, occ.start)}
          </span>
        );
      }

      const isWhite = whitelistedIds.has(occ.match.id);
      const isHighlighted = highlightedCategory ? occ.match.type === highlightedCategory : false;

      segments.push(
        <mark
          key={`san_mark_${occ.match.id}_${i}`}
          onClick={(e) => openMatchPopover(occ.match, e)}
          className={`cursor-pointer px-1.5 py-0.5 rounded text-[11px] font-mono transition-all inline-block ${getPillColor(occ.match.type, isWhite)} ${
            isHighlighted ? 'ring-2 ring-indigo-500 scale-105 font-bold' : ''
          }`}
          title={`${occ.match.type}: Click to view cryptographic proof`}
        >
          {occ.token}
        </mark>
      );
      lastEnd = occ.end;
    });

    if (lastEnd < lineText.length) {
      segments.push(
        <span key="san_plain_end" className="whitespace-pre-wrap break-words break-all">
          {lineText.slice(lastEnd)}
        </span>
      );
    }

    return (
      <span className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-words break-all">
        {segments}
      </span>
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-2.5 border-b border-slate-200 bg-slate-50/70 gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>{activeFile?.name || 'Raw Document Stream'}</span>
            </span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold uppercase bg-slate-200/80 text-slate-700 whitespace-nowrap">
              {activeFormat === 'text' ? 'txt' : activeFormat}
            </span>
            {activeFile?.size && (
              <span className="text-[10px] text-slate-400 whitespace-nowrap">
                ({(activeFile.size / 1024).toFixed(1)} KB)
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/60">
              <button
                onClick={() => setViewMode('edit')}
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'edit'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3 h-3" />
                <span>Raw Editor</span>
              </button>
              <button
                onClick={() => setViewMode('inspect')}
                className={`flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  viewMode === 'inspect'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3 h-3 text-indigo-600" />
                <span>X-Ray Inspect</span>
              </button>
            </div>

            {isTabular && (
              <button
                onClick={() => setShowTablePreview(!showTablePreview)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-all whitespace-nowrap cursor-pointer ${
                  showTablePreview
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Table2 className="w-3 h-3" />
                <span>Table Grid</span>
              </button>
            )}

            <button
              onClick={onCopySanitized}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors whitespace-nowrap cursor-pointer"
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
          <div className="p-3 bg-slate-50/50 min-h-[480px]">
            <TablePreview matrix={matrixData} />
          </div>
        ) : (
          <div className="flex h-[540px] overflow-hidden">
            <div 
              ref={unifiedScrollRef}
              className="flex-1 overflow-y-auto divide-y divide-slate-100"
            >
              <div className="sticky top-0 z-10 grid grid-cols-2 divide-x divide-slate-200 bg-slate-100/95 backdrop-blur-xs border-b border-slate-200 shadow-2xs">
                <div className="px-3.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>Original Untrusted Stream</span>
                  <span>{rawLines.length} lines</span>
                </div>
                <div className="px-3.5 py-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100/95">
                  <span className="text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Sanitized Zero-Leakage Stream
                  </span>
                  <span>{sanitizedLines.length} lines</span>
                </div>
              </div>

              {viewMode === 'edit' ? (
                <div className="grid grid-cols-2 divide-x divide-slate-200 min-h-full">
                  <div className="flex p-2 bg-slate-50/30">
                    <div className="select-none pr-3 text-right text-slate-300 font-mono text-[11px] leading-[22px] min-w-[34px] border-r border-slate-100 mr-2">
                      {rawLines.map((_, i) => (
                        <div key={i} className="leading-[22px]">{i + 1}</div>
                      ))}
                    </div>
                    <textarea
                      value={rawText}
                      onChange={(e) => onChangeRawText(e.target.value)}
                      placeholder="Paste text, log entries, or drag files here..."
                      className="flex-1 bg-transparent border-0 p-0 text-slate-900 font-mono text-xs leading-[22px] whitespace-pre-wrap break-words resize-none focus:outline-hidden"
                      spellCheck={false}
                    />
                  </div>
                  <div className="p-2 bg-white">
                    {Array.from({ length: totalLines }).map((_, idx) => {
                      const lineNo = idx + 1;
                      const textLine = sanitizedLines[idx] ?? '';
                      return (
                        <div key={`edit_san_${lineNo}`} className="flex items-start leading-[22px]">
                          <span className="select-none text-right text-slate-300 font-mono text-[11px] min-w-[34px] pr-2.5 mr-2 flex-shrink-0 pt-0.5">
                            {lineNo}
                          </span>
                          <div className="flex-1 min-w-0 font-mono text-xs text-slate-800 whitespace-pre-wrap break-words break-all">
                            {renderSanitizedLine(textLine, lineNo)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  {Array.from({ length: totalLines }).map((_, idx) => {
                    const lineNo = idx + 1;
                    const rawLineText = rawLines[idx] ?? '';
                    const sanLineText = sanitizedLines[idx] ?? '';
                    return (
                      <div
                        key={`diff_row_${lineNo}`}
                        id={`diff_row_${lineNo}`}
                        className="grid grid-cols-2 divide-x divide-slate-200 hover:bg-slate-50/60 transition-colors"
                      >
                        <div className="flex items-start min-w-0 px-2 py-1 leading-[22px] bg-slate-50/20">
                          <span className="select-none text-right text-slate-300 font-mono text-[11px] min-w-[34px] pr-2.5 mr-2 flex-shrink-0 pt-0.5">
                            {lineNo}
                          </span>
                          <div className="flex-1 min-w-0">
                            {renderInspectLine(rawLineText, lineNo)}
                          </div>
                        </div>

                        <div className="flex items-start min-w-0 px-2 py-1 leading-[22px] bg-white">
                          <span className="select-none text-right text-slate-300 font-mono text-[11px] min-w-[34px] pr-2.5 mr-2 flex-shrink-0 pt-0.5">
                            {lineNo}
                          </span>
                          <div className="flex-1 min-w-0">
                            {renderSanitizedLine(sanLineText, lineNo)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div 
              className="w-7 border-l border-slate-200 bg-[#F8FAFC] relative flex-shrink-0 select-none hidden md:block"
              title="PII Radar Scroll Minimap — click any marker to jump to line"
            >
              <div className="absolute top-1 left-0 right-0 text-[8px] font-bold text-center text-slate-400 uppercase tracking-tighter pointer-events-none">
                Radar
              </div>
              {activeMatches.map((m) => {
                const fraction = Math.min(0.96, Math.max(0.04, (m.line - 1) / Math.max(totalLines, 1)));
                const topPercent = (fraction * 100).toFixed(1);
                return (
                  <button
                    key={`radar_${m.id}`}
                    onClick={() => scrollToLine(m.line)}
                    style={{ top: `${topPercent}%` }}
                    className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 flex items-center justify-center hover:scale-150 transition-transform cursor-pointer"
                    title={`Line ${m.line}: ${m.type} ("${m.value}")`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shadow-2xs"
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
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="my-2.5 space-y-2 text-xs">
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
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors shadow-2xs cursor-pointer ${
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
