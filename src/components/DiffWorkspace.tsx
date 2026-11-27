import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Copy, 
  Check, 
  Eye, 
  FileText, 
  Table2, 
  ShieldCheck,
  ClipboardPaste,
  Plus,
  Trash2,
  FileCode,
  FileSpreadsheet,
  Edit3,
  EyeOff,
  Shuffle
} from 'lucide-react';
import TablePreview from './TablePreview';
import { parseDelimitedTextToMatrix } from '../utils/fileHandlers';
import { PIIMatch, BatchFile, EntityCategory, RedactionMode } from '../types';

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
  redactionMode: RedactionMode;
  onChangeRedactionMode: (mode: RedactionMode) => void;
  onOpenInputHub: () => void;
  onPasteClipboard: () => void;
  onClearInput: () => void;
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
  tableMatrix,
  redactionMode,
  onChangeRedactionMode,
  onOpenInputHub,
  onPasteClipboard,
  onClearInput
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
      if (catMatches.length > 0) {
        const safeIdx = currentEntityIndex % catMatches.length;
        const m = catMatches[safeIdx];
        scrollToLine(m.line);
        setSelectedMatch(m);
      }
    }
  }, [highlightedCategory, currentEntityIndex, activeMatches]);

  const getPillColor = (type: EntityCategory, isWhitelisted = false) => {
    if (isWhitelisted) {
      return 'bg-slate-200 text-slate-500 line-through border border-slate-300';
    }
    switch (type) {
      case 'Credit Card':
      case 'Aadhaar':
      case 'PAN':
      case 'Secret Token':
      case 'Password':
      case 'OTP':
        return 'bg-rose-50 text-rose-800 border border-rose-200 shadow-2xs font-medium';
      case 'Email':
      case 'Phone':
      case 'IPv4':
      case 'Financial':
      case 'Suspicious Link':
        return 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs font-medium';
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200 font-medium';
    }
  };

  const getDotColor = (type: EntityCategory) => {
    switch (type) {
      case 'Credit Card':
      case 'Aadhaar':
      case 'PAN':
      case 'Secret Token':
      case 'Password':
      case 'OTP':
        return '#E11D48';
      case 'Email':
      case 'Phone':
      case 'IPv4':
      case 'Financial':
      case 'Suspicious Link':
        return '#D97706';
      default:
        return '#64748B';
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
      case 'OTP': return '[REDACTED_OTP]';
      case 'Password': return '[REDACTED_PASSWORD]';
      case 'Financial': return '[REDACTED_FINANCIAL]';
      case 'Suspicious Link': return '[REDACTED_LINK]';
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
        <span className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
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
          <span key={`raw_plain_${i}`} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
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
        <span key="raw_plain_end" className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {lineText.slice(lastEnd)}
        </span>
      );
    }

    return (
      <span className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
        {segments}
      </span>
    );
  };

  const renderSanitizedLine = (lineText: string, lineNo: number) => {
    const lineMatches = (matchesByLine.get(lineNo) || []).slice().sort((a, b) => a.start - b.start);
    if (lineMatches.length === 0) {
      return (
        <span className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
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
          <span key={`san_plain_${i}`} className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
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
        <span key="san_plain_end" className="whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
          {lineText.slice(lastEnd)}
        </span>
      );
    }

    return (
      <span className="font-mono text-xs text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
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

  const isEmpty = !rawText || rawText.trim() === '';

  const modes: Array<{
    id: RedactionMode;
    label: string;
    sub: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'full', label: 'Full Redaction', sub: '[REDACTED]', icon: EyeOff },
    { id: 'partial', label: 'Partial Mask', sub: 'XXXX-1234', icon: Eye },
    { id: 'pseudonym', label: 'Consistent Pseudonyms', sub: 'TOKEN_01', icon: Shuffle }
  ];

  return (
    <div className="relative mb-3">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
        <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Redaction Policy:
            </span>
            <div className="inline-flex p-0.5 bg-slate-200/60 rounded-lg gap-1 flex-wrap sm:flex-nowrap">
              {modes.map((m) => {
                const active = redactionMode === m.id;
                const Icon = m.icon;
                return (
                  <button
                    key={m.id}
                    onClick={() => onChangeRedactionMode(m.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-700 flex-shrink-0" />
                    <span>{m.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                      ({m.sub})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={onOpenInputHub}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5 text-slate-600" />
              <span>Add / Switch File</span>
            </button>
          </div>
        </div>

        {isEmpty ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[460px] bg-slate-50/30">
            <div className="w-full max-w-xl bg-white/90 backdrop-blur-xl rounded-3xl border border-white/90 p-8 shadow-sm ring-1 ring-slate-200/70 flex flex-col gap-6 text-center">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto mb-3 text-indigo-600 shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  Ready for Local Zero-Leakage Sanitization
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Type sensitive text, paste from your clipboard, drop any document or spreadsheet, or load a noisy test scenario.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={onPasteClipboard}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/70 text-indigo-900 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <ClipboardPaste className="w-4 h-4 text-indigo-600" />
                  <span>Paste from Clipboard</span>
                </button>

                <button
                  onClick={onOpenInputHub}
                  className="flex items-center justify-center gap-2 p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-indigo-600" />
                  <span>Add Document / File</span>
                </button>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <span className="text-xs font-semibold text-slate-700 px-1">Or Type Raw Text Directly:</span>
                <textarea
                  value={rawText}
                  onChange={(e) => onChangeRawText(e.target.value)}
                  placeholder="Paste sensitive logs, resumes, support tickets, or clinical notes directly here to begin instant zero-leakage redaction..."
                  className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                  spellCheck={false}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 border-b border-slate-200 bg-slate-50 text-xs">
              <div className="flex items-center justify-between px-4 py-2 gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className="font-semibold text-slate-800 truncate" title={activeFile?.name || 'Original Input'}>
                    {activeFile?.name || 'Original Input'}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium uppercase bg-slate-200 text-slate-700 flex-shrink-0">
                    {activeFormat === 'text' ? 'txt' : activeFormat}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <div className="flex bg-slate-200/80 p-0.5 rounded-lg">
                    <button
                      onClick={() => setViewMode('edit')}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        viewMode === 'edit'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Edit raw text directly"
                    >
                      <Edit3 className="w-3 h-3 text-slate-600" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setViewMode('inspect')}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        viewMode === 'inspect'
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Inspect entity matches"
                    >
                      <Eye className="w-3 h-3 text-slate-600" />
                      <span>Inspect</span>
                    </button>
                  </div>

                  <button
                    onClick={onPasteClipboard}
                    className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    title="Paste from clipboard"
                  >
                    <ClipboardPaste className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={onOpenInputHub}
                    className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 transition-colors cursor-pointer"
                    title="+ Add File or Document"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={onClearInput}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Clear input"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between px-4 py-2 gap-2 min-w-0 bg-slate-50">
                <div className="flex items-center gap-2 text-slate-800 font-semibold min-w-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">Sanitized Output</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700 whitespace-nowrap hidden sm:inline">
                    {redactionMode === 'full' ? 'Full Redaction' : redactionMode === 'partial' ? 'Partial Mask' : 'Consistent Pseudonyms'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isTabular && (
                    <button
                      onClick={() => setShowTablePreview(!showTablePreview)}
                      className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                        showTablePreview
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Table2 className="w-3 h-3" />
                      <span>Table View</span>
                    </button>
                  )}

                  <button
                    onClick={onCopySanitized}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
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
            </div>

            {showTablePreview && matrixData ? (
              <div className="p-3 bg-slate-50 min-h-[480px]">
                <TablePreview matrix={matrixData} />
              </div>
            ) : (
              <div className="flex h-[560px] overflow-hidden">
                <div 
                  ref={unifiedScrollRef}
                  className="flex-1 overflow-y-auto divide-y divide-slate-100"
                >
                  <div className="sticky top-0 z-10 grid grid-cols-2 divide-x divide-slate-200 bg-slate-100 border-b border-slate-200 shadow-2xs">
                    <div className="px-4 py-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Original Input</span>
                      <span>{rawLines.length} lines</span>
                    </div>
                    <div className="px-4 py-1.5 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100">
                      <span className="text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Sanitized Output
                      </span>
                      <span>{sanitizedLines.length} lines</span>
                    </div>
                  </div>

                  {viewMode === 'edit' ? (
                    <div className="grid grid-cols-2 divide-x divide-slate-200/80 min-h-full">
                      <div className="flex p-3 bg-slate-50/30">
                        <div className="select-none pr-3 text-right text-slate-300 font-mono text-[11px] leading-[22px] min-w-[34px] border-r border-slate-100 mr-2">
                          {rawLines.map((_, i) => (
                            <div key={i} className="leading-[22px]">{i + 1}</div>
                          ))}
                        </div>
                        <textarea
                          value={rawText}
                          onChange={(e) => onChangeRawText(e.target.value)}
                          placeholder="Type or edit text live here..."
                          className="flex-1 bg-transparent border-0 p-0 text-slate-900 font-mono text-xs leading-[22px] whitespace-pre-wrap break-words [overflow-wrap:anywhere] resize-none focus:outline-hidden"
                          spellCheck={false}
                        />
                      </div>
                      <div className="p-3 bg-white">
                        {Array.from({ length: totalLines }).map((_, idx) => {
                          const lineNo = idx + 1;
                          const textLine = sanitizedLines[idx] ?? '';
                          return (
                            <div key={`edit_san_${lineNo}`} className="flex items-start leading-[22px]">
                              <span className="select-none text-right text-slate-300 font-mono text-[11px] min-w-[34px] pr-2.5 mr-2 flex-shrink-0 pt-0.5">
                                {lineNo}
                              </span>
                              <div className="flex-1 min-w-0 font-mono text-xs text-slate-800 whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
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
                            className="grid grid-cols-2 divide-x divide-slate-200/80 hover:bg-slate-50/60 transition-colors"
                          >
                            <div 
                              onClick={() => setViewMode('edit')}
                              className="flex items-start min-w-0 px-3 py-1 leading-[22px] bg-slate-50/20 cursor-text"
                              title="Click to live-edit raw text"
                            >
                              <span className="select-none text-right text-slate-300 font-mono text-[11px] min-w-[34px] pr-2.5 mr-2 flex-shrink-0 pt-0.5">
                                {lineNo}
                              </span>
                              <div className="flex-1 min-w-0">
                                {renderInspectLine(rawLineText, lineNo)}
                              </div>
                            </div>

                            <div className="flex items-start min-w-0 px-3 py-1 leading-[22px] bg-white">
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
                  className="w-6 border-l border-slate-200 bg-slate-50 relative flex-shrink-0 select-none hidden md:block"
                  title="Entity location minimap — click to jump to line"
                >
                  {activeMatches.map((m) => {
                    const fraction = Math.min(0.96, Math.max(0.04, (m.line - 1) / Math.max(totalLines, 1)));
                    const topPercent = (fraction * 100).toFixed(1);
                    return (
                      <button
                        key={`radar_${m.id}`}
                        onClick={() => scrollToLine(m.line)}
                        style={{ top: `${topPercent}%` }}
                        className="absolute left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 flex items-center justify-center hover:scale-150 transition-transform cursor-pointer"
                        title={`Line ${m.line}: ${m.type} ("${m.value}")`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shadow-2xs"
                          style={{ backgroundColor: getDotColor(m.type) }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {selectedMatch && (
        <div
          style={{ top: popoverPos.top, left: popoverPos.left }}
          className="fixed z-50 w-80 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/90 ring-1 ring-slate-200/80 p-4 animate-in fade-in zoom-in-95 duration-150"
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
                Validation Proof
              </span>
              <div className="mt-0.5 text-slate-800 font-medium bg-slate-50 p-1.5 rounded-md border border-slate-100 font-mono text-[11px]">
                ✓ {selectedMatch.reason}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Detected Entity
              </span>
              <div className="mt-0.5 text-rose-800 bg-rose-50/70 p-1.5 rounded-md border border-rose-100 font-mono text-[11px] break-all">
                {selectedMatch.value}
              </div>
            </div>

            {selectedMatch.redacted_value && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Redacted Value
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
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
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
