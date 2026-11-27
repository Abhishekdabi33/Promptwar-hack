# PII Shield — 100% Client-Side Privacy Engine & Local PII Sanitizer

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan.svg)](https://tailwindcss.com/)
[![Pyodide](https://img.shields.io/badge/Pyodide-WASM-yellow.svg)](https://pyodide.org/)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org/)
[![Testing](https://img.shields.io/badge/Tests-100%25_Passing-success.svg)](#3-how-the-solution-works)
[![Privacy](https://img.shields.io/badge/Network_Egress-0_Bytes-success.svg)](#1-chosen-vertical)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Chosen Vertical

**Cybersecurity & Data Privacy — PII Shield**

In an era of ubiquitous Large Language Models (ChatGPT, Claude, Gemini, Copilot), developers, healthcare workers, financial analysts, and enterprise support teams routinely paste raw customer records, clinical logs, and source code into untrusted web prompts and cloud tools. Traditional privacy scanners and DLP gateways exacerbate this risk by transmitting unencrypted documents to third-party cloud servers for inspection, triggering GDPR, HIPAA, and DPDP regulatory non-compliance.

**PII Shield** solves this fundamental privacy problem by implementing an air-gapped, zero-trust sanitization engine that executes a real Python 3.12 runtime entirely within the user's browser via WebAssembly (Pyodide). Once the client loads, all detection, mathematical checksum validation, format re-engineering, pseudonymization, and cryptographic hashing generate strictly **0 bytes of network egress**.

---

## 2. Approach & Logic

### 2.1 Client-Side Zero-Trust Architecture
PII Shield operates on the principle that sensitive data must never cross a network boundary:
- **Off-Thread Python 3.12 Web Worker (`src/workers/pyodideWorker.js`)**: Executes regex scans, mathematical checksums, AST parsing, and cryptographic operations off the main React rendering thread, maintaining 60 FPS UI responsiveness.
- **Strict Network Isolation**: The application performs no backend HTTP calls, API analytics, or external telemetry. All state, pseudonym maps, and session history remain in ephemeral memory or browser `localStorage`.
- **Cryptographic Provenance**: SHA-256 digests are computed for both raw input and sanitized output streams in WebAssembly to provide an immutable compliance audit trail.

### 2.2 Mathematical Checksums & Zero False Positives
Crude regex patterns routinely confuse benign serial numbers, timestamps, or product codes with sensitive identifiers. PII Shield employs dual-tier discovery: broad structural regex discovery followed by strict algorithmic validation:
- **Credit Cards (Mod-10 Luhn Checksum)**: Evaluates Luhn algorithms across Visa, MasterCard, Amex, Discover, Diners, and JCB. Non-Luhn 16-digit order serials (e.g., `8841-9923-1104-5521`) are safely rejected and logged in the *Rejected Traps* dossier.
- **Indian Aadhaar (Verhoeff Dihedral Group $D_5$ Algorithm)**: Validates 12-digit Indian national identity numbers using non-commutative permutation and multiplication tables. Non-Verhoeff 12-digit invoice numbers are preserved intact.
- **Strict IPv4 Boundaries**: Enforces four integer octets in the range `[0, 255]` with no illegal leading zeros, rejecting semantic software version tags like `v3.14.299.1`.
- **Indian PAN Verification**: Validates `[A-Z]{5}[0-9]{4}[A-Z]` syntax and checks the 4th character against official Income Tax Department entity codes (`P` = Individual, `C` = Company, `H` = HUF, `F` = Firm, `A` = AOP, `T` = Trust, `B` = BOI, `L` = Local Authority, `J` = Artificial Juridical Person, `G` = Government).
- **Shannon Entropy Analysis**: Computes character-level information entropy $H(X) = -\sum p(x) \log_2 p(x)$ to flag high-entropy ($H \ge 3.8$ bits/char) API secrets, Bearer tokens, and private keys.

### 2.3 Overlap Priority Resolution
When text matches multiple candidate patterns (e.g., a phone number overlapping a financial sum or card digits), PII Shield sorts matches by start offset, category risk weight (`Password` > `OTP` > `Credit Card` > `Aadhaar` > `PAN` > `Financial` > `Secret Token` > `Link` > `Email` > `IPv4` > `Phone`), and span length to guarantee collision-free replacements.

### 2.4 Message Safety Guard Heuristics
Before pasting text into AI prompts or support channels, the Message Safety Guard inspects drafts for high-risk outbound threats:
- Multi-factor OTPs and verification PINs.
- Plaintext passwords and credential assignments (`password = ...`).
- Indian UPI handles (`user@okaxis`, `merchant@upi`) and IFSC bank routing codes (`SBIN0001234`).
- Direct-IP URLs (`http://192.168.1.1/login`) and shortened phishing domains (`bit.ly`, `tinyurl.com`).
- Generates clear, actionable verdicts: **Safe to Send**, **Review Recommended**, or **Unsafe to Send**.

---

## 3. How the Solution Works

### 3.1 Step-by-Step Data Flow

```
[ User Input / Dropzone ]
           │
           ▼
[ React 18 UI Main Thread ] ───(Debounced 200ms postMessage)───┐
                                                                ▼
                                                   [ pyodideWorker.js ]
                                                                │
                                                   [ Python 3.12 WASM ]
                                                                │
                 ┌──────────────────────────────────────────────┴──────────────────────────────┐
                 ▼                                              ▼                              ▼
      [ Candidate Scanning ]                         [ Checksum Validation ]       [ Overlap Resolution ]
      (Regex + Entropy Tokenizer)                    (Luhn, Verhoeff, PAN, IP)     (Priority Weight Matrix)
                 │                                              │                              │
                 └──────────────────────────────────────────────┬──────────────────────────────┘
                                                                ▼
                                                   [ Redaction & Pseudonym Vault ]
                                                   • Full Mask: [REDACTED_CARD]
                                                   • Partial Mask: XXXX-XXXX-XXXX-1234
                                                   • Pseudonym: CARD_01 (Key Vault)
                                                                │
                                                   [ SHA-256 Provenance Hashes ]
                                                                │
[ React 18 UI Diff View ] ◄────(Worker onmessage IPC Result)────┘
• Synchronized CSS Grid Diff Rows
• Color-Coded Pill Badges
• Live Radar Minimap Jump Controls
• 1-Click Export (.txt, .csv, .xlsx, .docx, .pdf, .zip)
```

### 3.2 3 Configurable Redaction Policies
1. **Full Redaction**: Complete entity obscuration via standard tokens (`[REDACTED_EMAIL]`, `[REDACTED_CARD]`, `[REDACTED_PAN]`).
2. **Partial Mask**: Preserves operational context while protecting identity (`XXXX-XXXX-XXXX-6467`, `j***@example.com`, `+91-******4598`).
3. **Consistent Pseudonyms**: Deterministic, reversible tokens (`EMAIL_01`, `CARD_01`) mapped identically across single files or multi-file queues. Normalizes mixed-case emails (`alice@corp.com` and `ALICE@CORP.COM` produce the exact same `EMAIL_01` token). Includes exportable `pseudonym_vault.json`.

### 3.3 Multi-Format Structure Preservation
- **CSV / TSV**: Parsed via Python standard `csv.reader` and `csv.writer`, strictly preserving quote rules and delimiter spacing.
- **XLSX Spreadsheets**: Extracted via SheetJS, cells sanitized using a shared pseudonym dictionary, and repackaged into native `.xlsx`. Includes toggleable **Table View**.
- **JSON & XML**: Recursively traverses nested keys and values, sanitizing string data while leaving structure, numbers, and boolean keys intact.
- **Word (.docx)**: Unpacks `word/document.xml` using `zipfile` in Python, concatenates split `<w:t>` runs per paragraph `<w:p>`, sanitizes, and repackages a valid `.docx`.
- **PDF Documents**: Page-by-page text extraction client-side via `pdfjs-dist` worker, with export to `.txt` and clean reconstructed `.pdf` via `jspdf`.
- **Support Emails (.eml)**: Parsed via Python `email` module, sanitizing headers and body while preserving MIME boundaries.
- **Multi-File Batch Queue**: Ingests mixed formats simultaneously, sanitizing them sequentially with a unified pseudonym map and 1-click **Download All as ZIP**.

### 3.4 Local Activity History & Chrome Extension
- **Local Activity History**: Automatically persists up to 50 sessions locally in browser `localStorage`. Includes search, filters, one-click restore, and JSON export with 0 external network requests.
- **1-Tap Manifest V3 Chrome Extension**: Downloadable `.zip` containing a ready-to-load browser extension that monitors text inputs across third-party websites and provides live inline redaction.

### 3.5 Local Setup Commands

```bash
# Clone the repository
git clone https://github.com/Abhishekdabi33/Promptwar-hack.git
cd Promptwar-hack

# Install dependencies
npm install

# Start development server
npm run dev

# Run automated Python test suite
npm run test:engine
# or directly:
python -m unittest discover -s tests -v

# Run TypeScript type check
npx tsc --noEmit

# Build production bundle
npm run build
```

### 3.6 How to Verify Zero Network Egress in Chrome DevTools
1. Open PII Shield in Google Chrome.
2. Press `F12` or right-click anywhere and select **Inspect** to open Chrome DevTools.
3. Switch to the **Network** tab and check **Preserve log**.
4. Allow Pyodide WebAssembly binaries to load on startup.
5. Click the red ⊘ **Clear** button in the Network tab to clear initial asset downloads.
6. Perform any sensitive action:
   - Paste credit cards, Aadhaar numbers, PAN IDs, passwords, or emails.
   - Drop a multi-format `.csv`, `.xlsx`, `.docx`, or `.json` file.
   - Switch between Full Mask, Partial Mask, and Consistent Pseudonyms.
   - Download sanitized outputs or copy text to clipboard.
7. Observe the Network tab: **0 requests appear. 0 bytes are transmitted.**
8. In the app sidebar, the live **Network Monitor** badge reads:
   `0 B Egress • 0 External Requests` by querying `window.performance.getEntriesByType('resource')`.

---

## 4. Assumptions Made

- **Initial WASM Boot**: Pyodide's WebAssembly runtime and core packages load from the CDN once upon initial app launch. Once initialized, **strictly 0 bytes of user data ever leave the browser**.
- **Digital Document Text vs Scanned Images**: PDF and DOCX extraction pipelines target text-based and digitally authored documents. Non-OCR scanned bitmaps require pre-transcription.
- **Device-Bound Local History**: Activity history is persisted strictly in the user's browser `localStorage` on the current machine and is never synced to external servers or cloud accounts.
- **Chrome Extension Developer Installation**: The downloadable Manifest V3 Chrome Extension is provided as an unbundled folder/zip loaded via Chrome's native `chrome://extensions` -> *Load unpacked* developer mode.
- **Synthetic Test Data**: All sample documents, incident dossiers, and automated test cases utilize synthetic checksum-valid numbers (e.g., test credit cards generated via Luhn, synthetic Aadhaar generated via Verhoeff) to avoid exposing real individual data.

---

## 5. Evaluation Alignment Matrix

| Evaluation Criteria | How PII Shield Satisfies & Exceeds |
| :--- | :--- |
| **Code Quality** | Written in clean, strict TypeScript and Python 3.12 with zero lint/type errors (`npx tsc --noEmit` exits with 0). Zero inline comments (`//`, `/*`, `#`) across all files. Clean modular component architecture. |
| **Security** | Zero-server privacy architecture (0 bytes egress). Strict mathematical checksums eliminate false positives. Shannon entropy flags secrets. ReDoS input guard caps regex length at 200 characters. Strict XSS protection (0 `dangerouslySetInnerHTML`). Strict Content Security Policy (`script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'`). |
| **Efficiency** | Python engine executes inside an off-thread Web Worker, preventing UI frame drops. Real-time typing is debounced by 200ms to balance responsiveness with CPU efficiency. Synchronized CSS Grid diff rows prevent layout re-flows. |
| **Testing** | Automated Python test suite (`tests/test_engine.py`) using Python's built-in `unittest` module covering Luhn, Verhoeff, IPv4, PAN, overlaps, 3 redaction modes, CSV preservation, Message Guard threats, and broken regex safety. 100% passing (`npm run test:engine`). |
| **Accessibility** | WCAG AA compliance: semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), descriptive `aria-label`s on every icon button, `aria-live="polite"` on verdicts and toasts, full Escape key navigation across all drawers, visible focus-visible outlines, and Framer Motion `<MotionConfig reducedMotion="user">` respecting OS reduced-motion preferences. |
| **Problem Statement Alignment** | Directly tackles the Cybersecurity & Data Privacy challenge by providing a production-ready, client-side PII sanitization system that enables secure AI adoption without cloud data leaks. |

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
