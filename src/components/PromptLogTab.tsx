import React, { useState } from 'react';
import { 
  Terminal, 
  Copy, 
  Check, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  CheckCircle2, 
  Layers, 
  ShieldAlert, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface PromptEntry {
  id: string;
  phase: string;
  title: string;
  summary: string;
  icon: React.ComponentType<{ className?: string }>;
  promptText: string;
}

export default function PromptLogTab() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set(['prompt_1', 'prompt_2']));

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const promptEntries: PromptEntry[] = [
    {
      id: 'prompt_1',
      phase: 'Phase 01 • Core Client-Side Architecture',
      title: 'Zero-Server Pyodide WebAssembly Web Worker Engine',
      summary: 'Architected the foundational 100% in-browser privacy engine using React 18, TypeScript, Tailwind CSS, and Python 3.12 running inside an off-thread browser Web Worker via Pyodide. Guaranteed strictly 0 network requests in Chrome DevTools after initial engine initialization.',
      icon: Cpu,
      promptText: `Build a complete, production-grade, 100% client-side browser web application called "PII Shield" for the Cybersecurity & Data Privacy hackathon challenge using React 18 (Vite), Tailwind CSS, Framer Motion, Lucide React icons, and a real Python 3 engine running locally inside a browser Web Worker via Pyodide (WebAssembly).

CORE ARCHITECTURE & ZERO-SERVER RULES:
- Frontend Stack: React 18 (Vite) + Tailwind CSS + Framer Motion + lucide-react + xlsx (SheetJS) + pdfjs-dist + jspdf + jszip.
- Advanced Python Engine: Place all core detection, validation, entropy analysis, structured-format parsing, pseudonymization, and cryptographic audit hashing inside a standalone Python module at public/engine.py.
- Off-Thread Execution: Load Pyodide and execute public/engine.py inside a dedicated browser Web Worker (src/workers/pyodideWorker.js) so heavy Python processing never freezes the React UI.
- Strict Client-Side Privacy: No backend server, no Flask/FastAPI, no external database. Once Pyodide boots on startup, all text pasting, file uploads, redaction mode switches, custom rules, and downloads MUST generate strictly 0 network requests in Chrome DevTools.`
    },
    {
      id: 'prompt_2',
      phase: 'Phase 02 • Algorithmic Detection & Validation',
      title: 'Mathematical Checksums & Zero False Positives',
      summary: 'Eliminated crude regex false positives by introducing strict mathematical checksums: Luhn Mod-10 for credit cards, Verhoeff dihedral D5 permutations for 12-digit Indian Aadhaar, PAN 4th-character income tax entity codes, IPv4 0-255 octet bounds, and Shannon entropy for API tokens.',
      icon: CheckCircle2,
      promptText: `Implement rigorous algorithmic validation and false-positive elimination inside public/engine.py:

1. Credit Cards: Strip hyphens/spaces and validate candidates using the Luhn Mod-10 algorithm. Reject sequential invoice IDs.
2. Indian Aadhaar IDs: Enforce 12 digits with lead digit in [2-9] and evaluate dihedral group D5 multiplication and permutation tables (Verhoeff checksum).
3. Indian PAN Numbers: Enforce [A-Z]{5}[0-9]{4}[A-Z] and strictly validate the 4th character against official income tax entity codes (P, C, H, F, A, T, B, L, J, G).
4. Strict IPv4: Parse 4 integer octets and enforce bounds [0, 255] with no illegal leading zeros, ignoring semantic software version tags.
5. Shannon Entropy: Calculate character-level Shannon entropy H(X) = -sum(p * log2(p)) to detect high-entropy API keys, JWTs, and bearer tokens.
6. Overlap Priority Resolver: Resolve overlapping token boundaries in favor of highest-risk entity category and track false-positive traps safely ignored.`
    },
    {
      id: 'prompt_3',
      phase: 'Phase 03 • Multi-Format Engine & Pseudonymization',
      title: 'Structure-Preserving Multi-Format & Consistent Pseudonym Vault',
      summary: 'Engineered parsing and structure-preserving exports for 8 file formats (.txt, .csv, .xlsx, .json, .xml, .docx, .pdf, .eml). Built unified cross-file consistent pseudonyms with exportable reversible key vault, synchronized row-aligned diff engine, and SHA-256 compliance audit dossiers.',
      icon: Layers,
      promptText: `Upgrade PII Shield with structure-preserving multi-format sanitization and consistent cross-file pseudonymization:

1. Multi-Format Support: Ingest and sanitize .txt, .csv, .xlsx, .json, .xml, .docx, .pdf, and .eml files. Preserve embedded tables, XML run trees, and JSON structures.
2. Consistent Cross-File Pseudonyms: Generate deterministic, collision-free tokens (EMAIL_01, CARD_01) mapped uniformly across entire multi-file queues. Provide 1-click download of the reversible JSON Key Vault.
3. Synchronized Row-Aligned Diff: Render raw vs sanitized streams in a unified container with synchronized line heights, wrapped text, and color-coded entity pills.
4. Cryptographic Audit Dossier: Compute SHA-256 hashes of original and sanitized outputs client-side and map findings to HIPAA, GDPR, PCI-DSS, and DPDP frameworks.`
    },
    {
      id: 'prompt_4',
      phase: 'Phase 04 • Threat Protection & Message Guard',
      title: 'Message Safety Guard & Pre-Send Threat Verdicts',
      summary: 'Built the Message Safety Guard to scan outbound communications (customer emails, Slack notes, AI prompts) for accidental leaks of verification OTPs, exposed passwords, UPI IDs, IFSC routing codes, and unverified phishing links with plain-English advisory verdicts.',
      icon: ShieldAlert,
      promptText: `Create an enterprise Message Safety Guard view inside PII Shield:

1. Threat Detection: Scan messages in real time for verification OTPs/PINs, plaintext passwords, Indian UPI IDs, IFSC routing codes, shortened URLs, and direct-IP links.
2. Safety Verdicts: Calculate automated verdicts ("Safe to Send", "Review Recommended", "Unsafe to Send") with actionable recommendations.
3. Safe Version Generation: Automatically render the sanitized message alongside raw text with 1-click "Copy Safe Message" button and redaction mode toggles.
4. Zero Leakage: Ensure all checks execute client-side inside the local Python Web Worker with zero network latency.`
    },
    {
      id: 'prompt_5',
      phase: 'Phase 05 • Full Ecosystem & Tactile Experience',
      title: 'Installable PWA, Manifest V3 Chrome Extension & Scroll Landing',
      summary: 'Completed the full privacy ecosystem with local-only Activity History (localStorage, 0 server calls), PWA offline service worker, 1-tap downloadable Manifest V3 Chrome Extension for live web form protection, and a daylight glassmorphism scroll-animated landing page.',
      icon: Sparkles,
      promptText: `Finalize the complete PII Shield privacy ecosystem:

1. Local Activity History: Store up to 50 sessions locally in browser localStorage with search, filters, one-click restore, and JSON export.
2. Mobile & Desktop PWA: Implement manifest.json and sw.js precaching core assets for 100% offline usage.
3. Manifest V3 Chrome Extension: Package a live browser extension (manifest.json, content.js, popup.html) that monitors web inputs and provides inline 1-click masking. Provide 1-tap direct zip download.
4. Scroll-Animated Landing Page: Build a high-impact Framer Motion landing page with scroll-to-redact interactive demo, sticky architecture walkthrough, and tactile 3D interactive buttons.`
    }
  ];

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    const fullLog = promptEntries.map((p, i) => (
      `================================================================================\n` +
      `PROMPT ${i + 1}: ${p.phase}\n` +
      `TITLE: ${p.title}\n` +
      `================================================================================\n\n` +
      `${p.promptText}\n\n`
    )).join('\n');

    navigator.clipboard.writeText(fullLog);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleExportMarkdown = () => {
    const mdContent = `# PII Shield — Curated Engineering Prompt Log\n\n` +
      `**Platform:** 100% Client-Side WebAssembly (Pyodide Python 3.12 Web Worker)\n` +
      `**Zero-Server Guarantee:** 0 Bytes Network Egress Verified in Chrome DevTools\n\n` +
      `---\n\n` +
      promptEntries.map((p, i) => (
        `## Phase ${i + 1}: ${p.title}\n` +
        `*${p.phase}*\n\n` +
        `**Summary:** ${p.summary}\n\n` +
        `### Exact Engineering Prompt:\n` +
        `\`\`\`text\n${p.promptText}\n\`\`\`\n\n` +
        `---\n\n`
      )).join('');

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PII_SHIELD_PROMPT_LOG.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/90 p-6 shadow-sm ring-1 ring-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-2">
            <Terminal className="w-3.5 h-3.5" />
            <span>Curated Engineering Dossier</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Curated Engineering Prompt Log
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            The 5 core prompts that architected PII Shield from zero-server foundation to production-grade WebAssembly privacy firewall.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-[0_3px_0_#cbd5e1] active:translate-y-[2px] active:shadow-[0_1px_0_#cbd5e1] transition-all cursor-pointer whitespace-nowrap"
          >
            {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copiedAll ? 'Copied All!' : 'Copy All Prompts'}</span>
          </button>

          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-[0_4px_0_#0f172a] active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] transition-all cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Prompt Log (.md)</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {promptEntries.map((entry, index) => {
          const Icon = entry.icon;
          const isExpanded = expandedIds.has(entry.id);
          const isCopied = copiedId === entry.id;

          return (
            <div
              key={entry.id}
              className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/90 shadow-sm ring-1 ring-slate-200/80 overflow-hidden transition-all"
            >
              <div 
                onClick={() => toggleExpand(entry.id)}
                className="p-5 flex items-start justify-between gap-4 cursor-pointer hover:bg-slate-50/50 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider block mb-0.5">
                      {entry.phase}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">
                      {entry.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {entry.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPrompt(entry.id, entry.promptText);
                    }}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                    title="Copy this prompt"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  <div className="p-1.5 text-slate-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/60">
                  <div className="flex items-center justify-between py-2 text-[11px] font-semibold text-slate-500">
                    <span>Exact Prompt Instruction Given to Model:</span>
                    <button
                      onClick={() => handleCopyPrompt(entry.id, entry.promptText)}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 cursor-pointer font-bold"
                    >
                      {isCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{isCopied ? 'Copied' : 'Copy Prompt'}</span>
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap overflow-x-auto shadow-inner selection:bg-indigo-500 selection:text-white">
                    {entry.promptText}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
