# PII Shield — 100% Client-Side Privacy Engine & Local PII Sanitizer

[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-purple.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-4.0-cyan.svg)](https://tailwindcss.com/)
[![Pyodide](https://img.shields.io/badge/Pyodide-WASM-yellow.svg)](https://pyodide.org/)
[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org/)
[![Privacy](https://img.shields.io/badge/Network_Egress-0_Bytes-success.svg)](#zero-server-privacy-guarantee)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Cybersecurity & Data Privacy Hackathon Challenge**  
> An enterprise-grade, zero-leakage, client-side data privacy workspace that detects, validates, and sanitizes Personally Identifiable Information (PII), secrets, and sensitive tokens in documents, logs, and LLM chat messages — running a real Python 3.12 engine entirely in your browser via WebAssembly.

---

## 🔒 Zero-Server Privacy Guarantee

Traditional privacy tools send your unencrypted documents and sensitive prompts to external cloud APIs for inspection, introducing compliance hazards (GDPR, HIPAA, DPDP Act) and cloud egress data breaches.

**PII Shield inverts this model completely:**

```
[ Sensitive Document / LLM Prompt ]
                 │
                 ▼
     ┌───────────────────────┐
     │   Local Browser Tab   │
     │  (No Network Egress)  │
     └───────────┬───────────┘
                 │
        PostMessage (IPC)
                 │
                 ▼
     ┌───────────────────────┐
     │ Web Worker (Pyodide)  │
     │  Python 3.12 in WASM  │
     │   • Regex & Entropy   │
     │   • Luhn & Verhoeff   │
     │   • Format Rebuilders │
     │   • SHA-256 Hashes    │
     └───────────┬───────────┘
                 │
                 ▼
[ 100% Sanitized Stream / Rebuilt File / Audit Report ]
```

- **0 Network Requests After Startup**: Once the WebAssembly runtime initializes, all text typing, clipboard pasting, multi-format file parsing, rule configuration, and file exports generate strictly **0 bytes of network traffic**.
- **Off-Thread Python Execution**: Computation runs inside a dedicated browser Web Worker (`src/workers/pyodideWorker.js`), ensuring smooth 60 FPS UI responsiveness even when processing multi-megabyte files.
- **Client-Side SHA-256 Provenance**: Every input and output stream is cryptographically hashed with SHA-256 in WebAssembly to provide an immutable compliance audit trail.

---

## 🛡️ Algorithmic Checksums & False-Positive Elimination

Simple regex engines flag order numbers as credit cards and serial numbers as national IDs. PII Shield combines regex pattern discovery with rigorous mathematical checksum validation:

| Entity Type | Detection Strategy | Mathematical Validation / Discard Rule |
| :--- | :--- | :--- |
| **Credit Cards** | Visa, MasterCard, Amex, Discover, Diners, JCB | **Luhn Algorithm (Mod-10)** checksum. Non-Luhn 16-digit serials are classified as benign traps and preserved intact. |
| **Aadhaar Numbers** | 12-digit Indian national identity numbers | **Verhoeff Algorithm** over dihedral group $D_5$ permutations. Random 12-digit numbers and timestamps are ignored. |
| **Indian PAN** | `[A-Z]{5}[0-9]{4}[A-Z]` tax identifiers | **4th-Character Entity Code** check (`P` = Individual, `C` = Company, `H` = HUF, `F` = Firm, `A` = AOP, `T` = Trust, `B` = BOI, `L` = Local, `J` = AJP, `G` = Govt). |
| **IPv4 Addresses** | Four octet dotted-quads | **Strict Octet Range [0–255]**. Release strings like `v3.14.299.1` are rejected. |
| **High-Entropy Secrets** | API keys, Bearer tokens, private secrets | **Shannon Entropy Analysis** ($H \ge 3.8$ bits/char) over candidate alphanumeric character distributions. |
| **Financial Amounts** | Currency-prefixed and formatted sums | Boundary-aware decimal and comma parsing across international currency symbols (`$`, `€`, `£`, `₹`, `¥`). |
| **Suspicious URLs** | Unchecked HTTP/HTTPS destinations | URL defanging and tokenization to prevent prompt injection and phishing redirects. |

---

## 📁 Multi-Format Structure-Preserving Engines

PII Shield sanitizes complex structured files while preserving tables, attributes, and formatting:

- **Plain Text & Logs (`.txt`, `.log`, `.md`)**: Sanitized directly line-by-line with synchronized diff view and auto-height row alignment.
- **Tabular Data (`.csv`, `.tsv`, `.xlsx`)**:
  - `.csv`/`.tsv` processed via Python standard `csv.reader` and `csv.writer`, strictly preserving quote rules and delimiter spacing.
  - `.xlsx` spreadsheets parsed client-side via SheetJS, cells sanitized with a shared pseudonym vault across workbooks, and repackaged into native `.xlsx`.
  - Toggleable interactive **Table Grid Preview** with per-column PII density indicators.
- **Structured Payloads (`.json`, `.xml`)**:
  - `.json` recursively traverses objects and arrays, sanitizing string values while leaving keys, booleans, integers, and nulls unchanged.
  - `.xml` parses hierarchical nodes and attributes using Python `xml.etree.ElementTree`, sanitizing text content while keeping tag trees intact.
- **Word Documents (`.docx`)**: Unpacks `word/document.xml` using `zipfile` in Python, concatenates split `<w:t>` text runs per paragraph `<w:p>`, sanitizes, and repackages a valid `.docx` binary.
- **PDF Documents (`.pdf`)**: Page-by-page text extraction client-side via `pdfjs-dist` worker, with export to `.txt` and clean reconstructed `.pdf` via `jspdf`.
- **Support Emails (`.eml`)**: Parsed via Python `email` module, sanitizing `From`, `To`, `Cc`, `Subject`, and body text while preserving MIME headers.
- **Multi-File Batch Queue**: Drop mixed formats simultaneously. PII Shield processes them sequentially with a unified pseudonym mapping dictionary and provides a 1-click **Download All as ZIP** via `JSZip`.

---

## ⚡ 3 Configurable Redaction Modes

1. **Full Mask**: High-contrast, standardized placeholder badges:
   ```
   Contact [REDACTED_EMAIL] or charge [REDACTED_CARD] for account [REDACTED_PAN].
   ```
2. **Partial Mask**: Retains safe trailing digits or initials for human operational context:
   ```
   Contact a***@domain.com or charge XXXX-XXXX-XXXX-1234 for account ABCDE****F.
   ```
3. **Consistent Pseudonymization**: Generates reversible, deterministic pseudonym tokens (`EMAIL_01`, `CARD_01`, `USER_01`) mapped consistently across entire files and multi-file batches:
   ```
   Contact EMAIL_01 or charge CARD_01 for account PAN_01.
   ```
   Includes an exportable, air-gapped `pseudonym_vault.json` allowing authorized offline reversal.

---

## 💬 Message Safety Guard (AI & LLM Copilot Defense)

Before sending sensitive prompts, source code, or clinical notes to external AI models (ChatGPT, Claude, Gemini, GitHub Copilot):

- **Real-Time Guard Scanner**: Paste or type prompts to get immediate PII discovery, risk severity tiering (**Low**, **Medium**, **High**, **Critical**), and threat classification.
- **1-Click Copy Clean Message**: Instantly sanitizes all detected entities using your selected redaction mode and copies clean text directly to your clipboard.
- **Defanged Threat Insights**: Highlights suspicious URLs, leaked bearer tokens, credentials, and identity identifiers.

---

## 🧩 Chrome Browser Extension (Manifest V3)

PII Shield includes a complete, downloadable Manifest V3 Chrome Extension for live input protection across third-party websites:

1. Click **Download Chrome Extension (.zip)** in the app header or sidebar.
2. Unzip the downloaded file to a local directory.
3. Open `chrome://extensions` in Google Chrome and enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the unzipped extension directory.
5. PII Shield will monitor text inputs and highlight or sanitize sensitive data right before form submission.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Core UI Framework** | React 18, TypeScript 5.5, Vite 5.4 |
| **Styling & Animation** | Tailwind CSS, Framer Motion (useScroll, useTransform, useSpring, layout animations) |
| **Icons & Design** | Lucide React, Daylight Glassmorphism, 3D tactile physical press buttons |
| **Local WASM Runtime** | Pyodide (Python 3.12 compiled to WebAssembly via Emscripten) |
| **Concurrency** | Dedicated HTML5 Web Worker (`pyodideWorker.js`) with postMessage IPC |
| **Document Parsers** | SheetJS (`xlsx`), `pdfjs-dist`, `jspdf`, `jszip`, Python `xml.etree`, Python `email`, Python `zipfile` |
| **Storage & Audit** | Browser `localStorage` (Activity History), SHA-256 via Web Crypto & Python `hashlib` |

---

## 💻 Local Development Setup

### Prerequisites
- Node.js 18+ or 20+
- pnpm, npm, or yarn

### Installation & Launch

```bash
# Clone the repository
git clone https://github.com/Abhishekdabi33/Promptwar-hack.git
cd Promptwar-hack

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build

```bash
# Type check and build bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔍 How to Verify Zero Network Egress in Chrome DevTools

Judges and security auditors can verify PII Shield's zero-server privacy claims in seconds:

1. Open PII Shield in Google Chrome.
2. Press `F12` or right-click anywhere and select **Inspect** to open Chrome DevTools.
3. Switch to the **Network** tab and check **Preserve log**.
4. Allow the initial Pyodide WebAssembly binaries to load on boot.
5. Click the red ⊘ **Clear** button in the Network tab to clear initial asset requests.
6. Now perform any sensitive action:
   - Type or paste credit cards, Aadhaar, PAN, emails, or API keys.
   - Drop a multi-format `.csv`, `.xlsx`, `.json`, or `.docx` file.
   - Toggle between Full Mask, Partial Mask, and Pseudonym modes.
   - Click **Download Sanitized**, **Export Audit Report**, or **Save Activity**.
7. Observe the Network tab: **0 requests appear. 0 bytes are transmitted.**
8. In the app sidebar, the live **Network Monitor** badge reads:
   `0 B Egress • 0 External Requests` by querying `window.performance.getEntriesByType('resource')`.

---

## 📜 Curated Prompt Engineering Log

PII Shield was engineered through 5 disciplined phases, fully documented in the in-app **Prompt Log**:

1. **Phase 1: Core WASM Engine & Zero-Server Pipeline**: Bootstrapping Python 3 in a Web Worker, zero-server architecture, and basic regex detection.
2. **Phase 2: Algorithmic Checksums & False-Positive Elimination**: Integrating Luhn, Verhoeff, Indian PAN entity codes, IPv4 octet ranges, and Shannon entropy.
3. **Phase 3: Multi-Format Structure Rebuilding & Pseudonymization**: Architecture for CSV, XLSX, JSON, XML, DOCX, PDF, and collision-free token vaults.
4. **Phase 4: Message Safety Guard & Daylight Glassmorphism UI**: Real-time AI prompt guard, 3D tactile button press feedback, and Daylight Glassmorphism interface.
5. **Phase 5: Chrome Extension, PWA, Local History & Compliance**: Manifest V3 extension, mobile PWA support, local-only encrypted activity history, and verifiable SHA-256 compliance exports.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
