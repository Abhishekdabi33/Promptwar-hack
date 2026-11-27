import React, { useState, useRef } from 'react';
import { 
  motion, 
  useScroll, 
  useTransform, 
  useSpring,
  AnimatePresence 
} from 'framer-motion';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Zap, 
  Sparkles, 
  Cpu, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Download, 
  Puzzle, 
  Eye, 
  EyeOff, 
  Shuffle, 
  Database, 
  FileCheck2, 
  ServerOff, 
  ChevronRight, 
  Terminal, 
  ExternalLink, 
  Layers,
  Check,
  Smartphone
} from 'lucide-react';

interface LandingPageProps {
  onLaunchSanitizer: () => void;
  onLaunchMessageGuard: () => void;
  onOpenPromptLog: () => void;
  onDownloadExtension: () => void;
  workerReady: boolean;
}

export default function LandingPage({
  onLaunchSanitizer,
  onLaunchMessageGuard,
  onOpenPromptLog,
  onDownloadExtension,
  workerReady
}: LandingPageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const [activeChapter, setActiveChapter] = useState(0);
  const [demoRedacted, setDemoRedacted] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const demoItems = [
    {
      type: 'Credit Card (Luhn Valid)',
      raw: '4532 8910 2341 5590',
      redacted: '[REDACTED_CARD]',
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    {
      type: 'Aadhaar (12-Digit Verhoeff)',
      raw: '8923 1245 9812',
      redacted: '[REDACTED_AADHAAR]',
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    {
      type: 'Personal Email',
      raw: 'alex.hunter@fintech-vault.io',
      redacted: 'EMAIL_01',
      color: 'bg-indigo-50 text-indigo-800 border-indigo-200'
    },
    {
      type: 'PAN Holder Tax ID',
      raw: 'ABCDE1234F',
      redacted: 'PAN_01',
      color: 'bg-amber-50 text-amber-800 border-amber-200'
    },
    {
      type: 'High-Entropy Secret Token',
      raw: 'ghp_98a72bdf84918204cba7',
      redacted: '[REDACTED_TOKEN]',
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    },
    {
      type: 'Direct IP Phishing Link',
      raw: 'http://192.168.1.1/auth?token=x99',
      redacted: '[REDACTED_LINK]',
      color: 'bg-rose-50 text-rose-800 border-rose-200'
    }
  ];

  const chapters = [
    {
      title: "Local Python 3 WASM Engine",
      subtitle: "Off-thread execution with strictly zero server latency or data leaks",
      description: "PII Shield loads a dedicated Python 3.12 Web Worker powered by Pyodide (WebAssembly). All parsing, multi-regex evaluations, cryptographic entropy sweeps, and JSON matrix transforms occur isolated inside your browser tab.",
      icon: Cpu,
      stats: "0 KB Network • 100% Client-Side"
    },
    {
      title: "Zero False-Positive Validation",
      subtitle: "Mathematical validation eliminates dummy codes, timestamps & zip codes",
      description: "Candidates are never blindly matched with crude regex. Credit cards pass Luhn checksums, national IDs verify via Verhoeff dihedral D5 permutations, PAN numbers validate holder entity codes, and IPv4 addresses confirm strict 0–255 octet bounds.",
      icon: CheckCircle2,
      stats: "5 Mathematical Verification Layers"
    },
    {
      title: "Multi-Format & Consistent Pseudonyms",
      subtitle: "Structure-preserving redaction for PDFs, Word, Spreadsheets & Logs",
      description: "Directly redact .txt, .csv, .xlsx, .json, .xml, .docx, .pdf, and .eml files. The consistent pseudonymization engine maps recurring entities to uniform tokens across multi-file batches and exports a reversible cryptographic key vault.",
      icon: Layers,
      stats: "8 Formats Supported • Batch ZIP Export"
    },
    {
      title: "Message Safety Guard & Extension",
      subtitle: "Catches credentials, OTPs, UPI/IFSC & phishing before you press send",
      description: "Draft customer replies, Slack messages, or AI prompts with real-time threat verdicts. The companion Manifest V3 Chrome Extension injects inline input protection into any live web form or chat interface.",
      icon: ShieldAlert,
      stats: "Real-Time Typing Shield • 1-Tap Mask"
    }
  ];

  const handleDownload = () => {
    onDownloadExtension();
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#F8FAFC] text-[#0F172A] relative selection:bg-indigo-100 selection:text-indigo-900 font-sans overflow-x-hidden">
      <motion.div 
        style={{ scaleX }} 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-sky-500 to-emerald-500 origin-left z-50" 
      />

      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[30rem] h-[30rem] rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-[28rem] h-[28rem] rounded-full bg-emerald-100/40 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl border-b border-white/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-[0_3px_0_#0f172a]">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">PII Shield</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                Zero-Server Local Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/80 border border-slate-200/80 text-slate-700 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className={`inline-flex rounded-full h-2 w-2 ${workerReady ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              </span>
              <span>0 Bytes Network Sent</span>
            </div>

            <button
              onClick={handleDownload}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-[0_3px_0_#cbd5e1] active:translate-y-[2px] active:shadow-[0_1px_0_#cbd5e1] transition-all cursor-pointer"
            >
              <Puzzle className="w-3.5 h-3.5 text-slate-600" />
              <span>{downloadSuccess ? 'Downloaded!' : 'Extension .zip'}</span>
            </button>

            <button
              onClick={onLaunchSanitizer}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-[0_4px_0_#0f172a] active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] transition-all cursor-pointer"
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section className="pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-slate-200 shadow-xs text-xs font-semibold text-slate-800 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>100% Client-Side Privacy Firewall & Redactor</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]"
            >
              Sanitize Sensitive Data & Guard Messages{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-600 to-emerald-600">
                Locally Inside Your Browser
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              Run genuine Python 3.12 WebAssembly off the main thread. Detect cards, national IDs, passwords, OTPs, and phishing links across 8 file formats with mathematically zero false positives and strictly 0 network requests.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
            >
              <button
                onClick={onLaunchSanitizer}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-[0_4px_0_#0f172a] active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                <span>Launch Sanitizer Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onLaunchMessageGuard}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-[0_3px_0_#cbd5e1] active:translate-y-[2px] active:shadow-[0_1px_0_#cbd5e1] transition-all cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Open Message Safety Guard</span>
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-14 max-w-4xl mx-auto"
          >
            <div className="bg-white/80 backdrop-blur-2xl rounded-3xl border border-white/90 p-5 sm:p-7 shadow-xl ring-1 ring-slate-200/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Interactive Live Redaction Preview
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Click to toggle stream state:</span>
                  <button
                    onClick={() => setDemoRedacted(!demoRedacted)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    {demoRedacted ? <Shuffle className="w-3.5 h-3.5 text-indigo-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{demoRedacted ? 'Show Raw Stream' : 'Apply Instant Redaction'}</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {demoItems.map((item, idx) => (
                  <div 
                    key={idx}
                    className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 flex flex-col justify-between gap-1.5 transition-all hover:bg-white"
                  >
                    <div className="flex items-center justify-between text-[11px] font-sans font-semibold text-slate-500">
                      <span>{item.type}</span>
                      <span className="text-[10px] text-slate-400">Match #{idx + 1}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <AnimatePresence mode="wait">
                        {demoRedacted ? (
                          <motion.span
                            key="redacted"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className={`px-2 py-0.5 rounded-md font-bold text-xs border ${item.color}`}
                          >
                            {item.redacted}
                          </motion.span>
                        ) : (
                          <motion.span
                            key="raw"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="text-slate-900 font-medium"
                          >
                            {item.raw}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      <span className="text-[10px] font-sans font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        Zero Leakage
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Pyodide Python 3.12 Web Worker runtime ready</span>
                </span>
                <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                  Network Egress: 0 Bytes
                </span>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Engine Architecture
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How PII Shield Protects You Locally
            </h2>
            <p className="text-sm text-slate-500">
              A high-performance offline pipeline executing directly on your machine.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3">
              {chapters.map((ch, idx) => {
                const Icon = ch.icon;
                const isSelected = activeChapter === idx;
                return (
                  <div
                    key={idx}
                    onClick={() => setActiveChapter(idx)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white shadow-md border-indigo-200 ring-2 ring-indigo-500/20'
                        : 'bg-white/60 hover:bg-white border-slate-200 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{ch.title}</h3>
                    </div>
                    <p className="text-xs text-slate-500 leading-normal pl-11">{ch.subtitle}</p>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-7">
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/90 p-8 shadow-xl ring-1 ring-slate-200/80 min-h-[440px] flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-mono font-bold mb-4">
                    <span>{chapters[activeChapter].stats}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {chapters[activeChapter].title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6">
                    {chapters[activeChapter].description}
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <ServerOff className="w-4 h-4 text-emerald-600" />
                    <span>No cloud API dependencies or network egress</span>
                  </div>
                  <button
                    onClick={onLaunchSanitizer}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                  >
                    <span>Try In Studio</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200/80">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Interactive Capabilities
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineered for Enterprise Data Privacy
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 mb-4 shadow-2xs">
                  <Shuffle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">3 Redaction Modes</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Toggle between Full Redaction ([REDACTED]), Partial Mask (a***@domain.com), and Consistent Pseudonyms (EMAIL_01) with exportable key vault.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-indigo-600">
                Consistent cross-file tokens
              </div>
            </div>

            <div className="p-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 mb-4 shadow-2xs">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Cryptographic Audits</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Calculates real SHA-256 raw and sanitized hashes client-side with compliance mapping for HIPAA, GDPR, PCI-DSS, and DPDP.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-emerald-600">
                Downloadable JSON audit dossier
              </div>
            </div>

            <div className="p-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 mb-4 shadow-2xs">
                  <Database className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Local Activity History</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Saves session records strictly to browser localStorage with search, filters, one-click session restore, and zero cloud backups.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-amber-600">
                100% offline persistence
              </div>
            </div>

            <div className="p-6 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 mb-4 shadow-2xs">
                  <Puzzle className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">Chrome Extension</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Packaged Manifest V3 browser extension that monitors live input textareas and forms on any web page with 1-click masking.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-semibold text-sky-600">
                1-tap direct zip download
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-slate-200/80">
          <div className="text-center max-w-xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">
              Zero-Trust Verification
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Traditional Cloud vs PII Shield
            </h2>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-slate-200 bg-slate-50 border-b border-slate-200 text-xs font-bold">
              <div className="p-4 text-slate-500 text-center">Traditional Cloud Services</div>
              <div className="p-4 text-emerald-800 bg-emerald-50/50 text-center flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>PII Shield (100% Local WASM)</span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {[
                { feature: 'Network Outbound Transmission', cloud: 'Uploads raw files to third-party server', local: '0 bytes transmitted (verified in DevTools)' },
                { feature: 'Server Storage & Logging', cloud: 'Stored in vendor cloud database', local: 'Never saved outside your local browser memory' },
                { feature: 'Engine Execution', cloud: 'Remote cloud API with latency & token fees', local: 'Python 3.12 Web Worker runs locally on device' },
                { feature: 'False-Positive Traps', cloud: 'Crude regex matches timestamps & random numbers', local: 'Mathematical Luhn, Verhoeff & IPv4 validation' },
                { feature: 'Multi-Format Processing', cloud: 'Requires cloud format converters', local: 'Parses PDF, DOCX, XLSX, JSON, CSV offline' }
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-2 divide-x divide-slate-100 p-3.5 sm:p-4">
                  <div className="text-slate-500 pr-3">{row.cloud}</div>
                  <div className="text-slate-900 font-semibold pl-3 text-emerald-950 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>{row.local}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center space-y-6">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-900 text-white shadow-2xl space-y-6 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-indigo-500/20 blur-3xl" />
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Ready to Sanitize Your Data Locally?
            </h2>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
              No registration, no API keys, and no remote server calls. Launch the studio immediately in your browser tab.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onLaunchSanitizer}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-[2px] active:shadow-[0_1px_0_#94a3b8] transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-slate-900" />
                <span>Launch Sanitizer Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleDownload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl shadow-[0_3px_0_#0f172a] active:translate-y-[2px] active:shadow-[0_1px_0_#0f172a] transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Extension (.zip)</span>
              </button>
            </div>

            <div className="pt-4">
              <button
                onClick={onOpenPromptLog}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>View Curated Prompt Engineering Log</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white/70 py-6 text-center text-xs text-slate-500">
        <p>PII Shield • 100% Client-Side Python WebAssembly Engine • Strictly 0 Network Calls</p>
      </footer>
    </div>
  );
}
