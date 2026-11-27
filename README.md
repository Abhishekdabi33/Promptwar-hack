# PII Shield — 100% Client-Side Privacy & PII Sanitizer

> **Cybersecurity & Data Privacy Hackathon Challenge**  
> Built with **React 18 (Vite)**, **Tailwind CSS**, **Framer Motion**, **Lucide React**, **SheetJS (xlsx)**, **pdfjs-dist**, **jsPDF**, **JSZip**, and a **Python 3.12 WebAssembly (Pyodide) Engine** running inside a dedicated browser Web Worker.

---

## 🔒 100% Client-Side Zero-Server Architecture

PII Shield eliminates third-party cloud data leakage by running all detection, validation, entropy analysis, format parsing, pseudonymization, and cryptographic hashing **strictly inside the client browser**:
- **Python 3.12 in WebAssembly**: Executed locally via Pyodide.
- **Dedicated Off-Thread Web Worker (`src/workers/pyodideWorker.js`)**: Keeps heavy regex and parsing tasks off the main thread so UI stays fluid.
- **Zero Outbound Network Egress**: Once the WASM worker boots on startup, text paste, file uploads, mode switches, custom rules, and exports generate **0 network requests in Chrome DevTools**.

---

## 🛡️ Rigorous Algorithmic Checksums (Zero False Positives)

1. **Credit Cards**: Luhn checksum algorithm (mod-10). Non-Luhn 16-digit serials (e.g., `8841-9923-1104-5521`) are safely ignored and logged under *Traps Safely Ignored*.
2. **12-Digit Indian Aadhaar**: Verhoeff checksum algorithm over dihedral group $D_5$ permutations. Non-Verhoeff 12-digit invoice IDs (`2947 1058 3629`) remain intact.
3. **IPv4 Addresses**: Strict integer octet range [0–255]. Build versions like `v3.14.299.1` are rejected.
4. **Indian PAN**: Format `[A-Z]{5}[0-9]{4}[A-Z]` with strict 4th character validation against official income tax entity codes (P, C, H, F, A, T, B, L, J, G).
5. **Shannon Entropy Secret Scanner**: Computes character-level Shannon entropy ($H \ge 3.8$ bits/char) to flag leaked bearer tokens, JWTs, and API keys.

---

## 📁 Multi-Format Parsing & Structure-Preserving Exports

- **Plain Text & Logs (`.txt`, `.log`, `.md`)**: Sanitized directly in Python and exported with native extensions.
- **Tabular Data (`.csv`, `.tsv`, `.xlsx`)**:
  - `.csv`/`.tsv` processed via Python `csv.reader`/`csv.writer` preserving quoted fields and delimiters.
  - `.xlsx` extracted via SheetJS, cells sanitized with a shared pseudonym dictionary, and repackaged into `.xlsx`.
  - Toggleable interactive **Table Grid Preview**.
- **Structured Payloads (`.json`, `.xml`)**:
  - `.json` recursively sanitizes string values while preserving keys, numbers, booleans, and nulls.
  - `.xml` sanitizes text nodes and attribute values via `xml.etree.ElementTree`.
- **Word Documents (`.docx`)**: Unpacks `word/document.xml` using `zipfile`, joins split `<w:t>` runs per `<w:p>`, sanitizes, and repackages valid `.docx`.
- **PDF Documents (`.pdf`)**: Page-by-page text extraction client-side via `pdfjs-dist` worker, with export to `.txt` and reconstructed `.pdf` via `jspdf`.
- **Support Emails (`.eml`)**: Parsed via Python `email` module, sanitizing `From`, `To`, `Cc`, `Subject`, and text body.
- **Multi-File Batch Queue**: Drop mixed files at once with a unified pseudonym map and 1-click **Download All as ZIP** via `JSZip`.

---

## ⚡ 3 Redaction Modes

1. **Full Mask**: `[REDACTED_EMAIL]`, `[REDACTED_CARD]`, `[REDACTED_PAN]`, `[REDACTED_AADHAAR]`
2. **Partial Mask**: `XXXX-XXXX-XXXX-1234`, `a***@domain.com`, `+91-******7890`, `192.168.***.***`
3. **Consistent Pseudonymization**: Collision-free tokens (`EMAIL_01`, `CARD_01`, `USER_01`) mapped identically across single or multi-file batches, with exportable `pseudonym_vault.json`.

---

## 🚀 Running Locally

```bash
# Install dependencies
pnpm install

# Start Vite development server
pnpm run dev

# Build for production
pnpm run build
```
