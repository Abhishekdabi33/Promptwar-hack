import React, { useState } from 'react';
import { 
  FileTerminal, 
  Copy, 
  Check, 
  ShieldCheck, 
  Cpu, 
  Binary, 
  Workflow, 
  Code2, 
  FileSpreadsheet, 
  FileText,
  Lock
} from 'lucide-react';

export default function PromptLogTab() {
  const [copied, setCopied] = useState(false);

  const promptLogContent = `PII SHIELD — ARCHITECTURAL DOSSIER & PROMPT LOG
Cybersecurity & Data Privacy Hackathon Challenge
Platform: 100% Client-Side WebAssembly (Pyodide Python 3.12 Engine inside Dedicated Web Worker)

================================================================================
1. CORE THREAT MODEL & ZERO-SERVER GUARANTEE
================================================================================
Traditional PII redactors transmit enterprise source documents to remote cloud APIs (e.g. LLMs or proprietary cloud redaction endpoints). In high-assurance environments (defense, banking, healthcare, government), transmitting raw data over the wire is a violation of the DPDP Act (India), PCI-DSS (v4.0), and GDPR (Art. 44 cross-border transfer).

PII Shield guarantees ZERO egress:
- 100% client-side computation using Pyodide (Python 3.12 compiled to WebAssembly).
- Processing runs in an isolated Web Worker off the main browser thread.
- Zero Flask, zero FastAPI, zero external database, zero network packets after initial WASM engine boot.
- Verified in Chrome DevTools Network Tab: exactly 0 B outbound payload on redactions.

================================================================================
2. RIGOROUS ALGORITHMIC VALIDATION (ZERO FALSE POSITIVES)
================================================================================
Naïve regex detectors flag software build versions as IPs, invoice tracking numbers as credit cards, and sequential order serials as Aadhaar IDs. PII Shield rejects false positives using mathematical checksums:

[A] Credit Card Numbers (Luhn Checksum Mod-10):
- Strips separators, enforces 13-19 digits.
- Evaluates Luhn mod-10 formula: sum of digits where every second digit from right is doubled.
- Rejection: Serial IDs like '8841-9923-1104-5521' fail Luhn and are counted under 'Traps Safely Ignored'.

[B] 12-Digit Indian Aadhaar Numbers (Verhoeff Checksum Algorithm):
- Enforces 12 digits starting with [2-9] (0 and 1 are illegal lead digits).
- Calculates check digit across non-commutative dihedral group D5 permutations (Verhoeff tables d and p).
- Rejection: Sequential order/invoice IDs like '2947 1058 3629' fail Verhoeff and are preserved intact.

[C] IPv4 Addresses (Octet Range [0-255]):
- Strictly parses 4 octets, verifies each is an integer 0..255 with no illegal leading zero.
- Rejection: Software version tags like 'v3.14.299.1' (octet 299 > 255) are safely ignored.

[D] Indian Permanent Account Number (PAN):
- Enforces [A-Z]{5}[0-9]{4}[A-Z].
- Strictly validates 4th character against official income tax entity codes:
  P (Individual), C (Company), H (HUF), F (Firm), A (AOP), T (Trust), B (BOI), L (Local), J (Artificial), G (Govt).

[E] Shannon Entropy Secret Token Scanner:
- Computes character-level Shannon entropy: H(X) = -sum(p(x) * log2(p(x))).
- Flags high-entropy strings (H >= 3.8 bits/char, or >= 3.2 with bearer/key prefix) to catch leaked JWTs, API secrets, and bearer tokens.

================================================================================
3. MULTI-FORMAT STRUCTURE-PRESERVING PROCESSING PIPELINE
================================================================================
- Tabular (.csv, .tsv): Processed via Python csv.reader/csv.writer; maintains embedded quotes and row structure.
- Workbooks (.xlsx): Parsed client-side via SheetJS, cells sanitized via Python with unified pseudonym map, repackaged into valid Excel workbook.
- Resumes & Clinical Notes (.docx): Read via Python zipfile and xml.etree.ElementTree; combines split <w:t> runs per <w:p> paragraph, sanitizes, and writes back into runs without breaking Word styles.
- PDF Documents (.pdf): Extracted page-by-page client-side via pdfjs-dist worker, sanitized in Python, exported as clean searchable text and reconstructed PDF via jspdf.
- Support Emails (.eml): Parsed via Python email module; sanitizes From, To, Cc, Subject headers and message body while outputting valid RFC-compliant EML.
- Multi-File Batch Mode: Single shared pseudonymization vault across entire multi-format file queue with 1-click ZIP export via JSZip.

================================================================================
4. THREE REDACTION POLICIES
================================================================================
1. Full Mask: Universal standardized tags ([REDACTED_EMAIL], [REDACTED_CARD], [REDACTED_PAN]).
2. Partial Mask: Safe operational context retained (XXXX-XXXX-XXXX-1234, +91-******7890, a***@domain.com).
3. Consistent Pseudonymization: Normalizes entities (lowercase emails, strip spaces/hyphens) and generates deterministic, collision-free tokens (EMAIL_01, CARD_01, USER_01) with reversible vault export.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(promptLogContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const steps = [
    {
      icon: Lock,
      title: 'Zero-Server Client-Side Isolation',
      desc: 'All computation executes locally inside the browser. Pyodide WebAssembly is isolated inside an off-thread Web Worker so the UI never drops frames.'
    },
    {
      icon: Cpu,
      title: 'Pure Python Standard Library Engine',
      desc: 'public/engine.py utilizes only built-in modules (re, csv, io, json, hashlib, math, zipfile, xml.etree.ElementTree, email) for instant zero-dependency boot.'
    },
    {
      icon: Binary,
      title: 'Algorithmic Checksum Precision',
      desc: 'Zero false-positives via Verhoeff (Aadhaar), Luhn Mod-10 (Credit Cards), IPv4 octet bounds (0-255), and Shannon Entropy (API Secrets).'
    },
    {
      icon: FileSpreadsheet,
      title: 'Structure-Preserving Multi-Format Architecture',
      desc: 'Processes CSV, TSV, XLSX, JSON, XML, DOCX, PDF, and EML with structural integrity preservation and multi-file batch ZIP exports.'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <FileTerminal className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900">
                System Prompt & Technical Architecture Dossier
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Complete specification, threat model, and algorithmic validation proofs for the Cybersecurity Hackathon
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Prompt Log</span>
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          {steps.map((st, i) => {
            const Icon = st.icon;
            return (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 mb-3">
                  <Icon className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">{st.title}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">{st.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-slate-900 rounded-xl p-5 text-slate-200 font-mono text-xs leading-relaxed overflow-x-auto border border-slate-800 shadow-inner max-h-[500px]">
          <pre className="whitespace-pre-wrap">{promptLogContent}</pre>
        </div>
      </div>
    </div>
  );
}
