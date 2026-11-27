# PII Shield — Curated Engineering Prompt Log

> **Challenge Vertical:** Cybersecurity & Data Privacy  
> **Architecture:** 100% Client-Side WebAssembly (Pyodide Python 3.12 Web Worker)  
> **Privacy Verification:** Strictly 0 Bytes Network Egress After Startup (Chrome DevTools Verified)

---

## Phase 01: Core Client-Side Architecture & Zero-Server Pipeline
*Phase 01 • Core Client-Side Architecture*

**Summary:**  
Architected the foundational 100% in-browser privacy engine using React 18, TypeScript, Tailwind CSS, and Python 3.12 running inside an off-thread browser Web Worker via Pyodide. Guaranteed strictly 0 network requests in Chrome DevTools after initial engine initialization.

### Exact Engineering Prompt:
```text
Build a complete, production-grade, 100% client-side browser web application called "PII Shield" for the Cybersecurity & Data Privacy hackathon challenge using React 18 (Vite), Tailwind CSS, Framer Motion, Lucide React icons, and a real Python 3 engine running locally inside a browser Web Worker via Pyodide (WebAssembly).

CORE ARCHITECTURE & ZERO-SERVER RULES:
- Frontend Stack: React 18 (Vite) + Tailwind CSS + Framer Motion + lucide-react + xlsx (SheetJS) + pdfjs-dist + jspdf + jszip.
- Advanced Python Engine: Place all core detection, validation, entropy analysis, structured-format parsing, pseudonymization, and cryptographic audit hashing inside a standalone Python module at public/engine.py.
- Off-Thread Execution: Load Pyodide and execute public/engine.py inside a dedicated browser Web Worker (src/workers/pyodideWorker.js) so heavy Python processing never freezes the React UI.
- Strict Client-Side Privacy: No backend server, no Flask/FastAPI, no external database. Once Pyodide boots on startup, all text pasting, file uploads, redaction mode switches, custom rules, and downloads MUST generate strictly 0 network requests in Chrome DevTools.
```

---

## Phase 02: Mathematical Checksums & Zero False Positives
*Phase 02 • Algorithmic Detection & Validation*

**Summary:**  
Eliminated crude regex false positives by introducing strict mathematical checksums: Luhn Mod-10 for credit cards, Verhoeff dihedral D5 permutations for 12-digit Indian Aadhaar, PAN 4th-character income tax entity codes, IPv4 0-255 octet bounds, and Shannon entropy for API tokens.

### Exact Engineering Prompt:
```text
Implement rigorous algorithmic validation and false-positive elimination inside public/engine.py:

1. Credit Cards: Strip hyphens/spaces and validate candidates using the Luhn Mod-10 algorithm. Reject sequential invoice IDs.
2. Indian Aadhaar IDs: Enforce 12 digits with lead digit in [2-9] and evaluate dihedral group D5 multiplication and permutation tables (Verhoeff checksum).
3. Indian PAN Numbers: Enforce [A-Z]{5}[0-9]{4}[A-Z] and strictly validate the 4th character against official income tax entity codes (P, C, H, F, A, T, B, L, J, G).
4. Strict IPv4: Parse 4 integer octets and enforce bounds [0, 255] with no illegal leading zeros, ignoring semantic software version tags.
5. Shannon Entropy: Calculate character-level Shannon entropy H(X) = -sum(p * log2(p)) to detect high-entropy API keys, JWTs, and bearer tokens.
6. Overlap Priority Resolver: Resolve overlapping token boundaries in favor of highest-risk entity category and track false-positive traps safely ignored.
```

---

## Phase 03: Structure-Preserving Multi-Format & Consistent Pseudonym Vault
*Phase 03 • Multi-Format Engine & Pseudonymization*

**Summary:**  
Engineered parsing and structure-preserving exports for 8 file formats (.txt, .csv, .xlsx, .json, .xml, .docx, .pdf, .eml). Built unified cross-file consistent pseudonyms with exportable reversible key vault, synchronized row-aligned diff engine, and SHA-256 compliance audit dossiers.

### Exact Engineering Prompt:
```text
Upgrade PII Shield with structure-preserving multi-format sanitization and consistent cross-file pseudonymization:

1. Multi-Format Support: Ingest and sanitize .txt, .csv, .xlsx, .json, .xml, .docx, .pdf, and .eml files. Preserve embedded tables, XML run trees, and JSON structures.
2. Consistent Cross-File Pseudonyms: Generate deterministic, collision-free tokens (EMAIL_01, CARD_01) mapped uniformly across entire multi-file queues. Provide 1-click download of the reversible JSON Key Vault.
3. Synchronized Row-Aligned Diff: Render raw vs sanitized streams in a unified container with synchronized line heights, wrapped text, and color-coded entity pills.
4. Cryptographic Audit Dossier: Compute SHA-256 hashes of original and sanitized outputs client-side and map findings to HIPAA, GDPR, PCI-DSS, and DPDP frameworks.
```

---

## Phase 04: Threat Protection & Message Guard
*Phase 04 • Threat Protection & Message Guard*

**Summary:**  
Built the Message Safety Guard to scan outbound communications (customer emails, Slack notes, AI prompts) for accidental leaks of verification OTPs, exposed passwords, UPI IDs, IFSC routing codes, and unverified phishing links with plain-English advisory verdicts.

### Exact Engineering Prompt:
```text
Create an enterprise Message Safety Guard view inside PII Shield:

1. Threat Detection: Scan messages in real time for verification OTPs/PINs, plaintext passwords, Indian UPI IDs, IFSC routing codes, shortened URLs, and direct-IP links.
2. Safety Verdicts: Calculate automated verdicts ("Safe to Send", "Review Recommended", "Unsafe to Send") with actionable recommendations.
3. Safe Version Generation: Automatically render the sanitized message alongside raw text with 1-click "Copy Safe Message" button and redaction mode toggles.
4. Zero Leakage: Ensure all checks execute client-side inside the local Python Web Worker with zero network latency.
```

---

## Phase 05: Full Ecosystem & Tactile Experience
*Phase 05 • Full Ecosystem & Tactile Experience*

**Summary:**  
Completed the full privacy ecosystem with local-only Activity History (localStorage, 0 server calls), PWA offline service worker, 1-tap downloadable Manifest V3 Chrome Extension for live web form protection, and a daylight glassmorphism scroll-animated landing page.

### Exact Engineering Prompt:
```text
Finalize the complete PII Shield privacy ecosystem:

1. Local Activity History: Store up to 50 sessions locally in browser localStorage with search, filters, one-click restore, and JSON export.
2. Mobile & Desktop PWA: Implement manifest.json and sw.js precaching core assets for 100% offline usage.
3. Manifest V3 Chrome Extension: Package a live browser extension (manifest.json, content.js, popup.html) that monitors web inputs and provides inline 1-click masking. Provide 1-tap direct zip download.
4. Scroll-Animated Landing Page: Build a high-impact Framer Motion landing page with scroll-to-redact interactive demo, sticky architecture walkthrough, and tactile 3D interactive buttons.
```
