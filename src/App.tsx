import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import CommandStrip from './components/CommandStrip';
import DiffWorkspace from './components/DiffWorkspace';
import ExportBar from './components/ExportBar';
import InputHubModal from './components/InputHubModal';
import DetectorDrawer from './components/DetectorDrawer';
import PromptLogTab from './components/PromptLogTab';
import MessageGuardView from './components/MessageGuardView';
import HistoryDrawer from './components/HistoryDrawer';
import ExtensionModal from './components/ExtensionModal';
import Toast from './components/Toast';
import { 
  loadActivityHistory, 
  saveActivityItem, 
  deleteActivityItem, 
  clearActivityHistory, 
  exportHistoryAsJson 
} from './utils/historyStorage';
import { 
  initPyodideWorker, 
  subscribeWorkerStatus, 
  processWithWorker, 
  generateSampleWithWorker 
} from './services/pyodideService';
import { 
  detectFormat, 
  extractTextFromPdf, 
  arrayBufferToBase64, 
  base64ToBlob, 
  downloadBlob, 
  downloadText, 
  createBatchZip 
} from './utils/fileHandlers';
import { 
  UploadCloud, 
  FileText, 
  Shield, 
  Sparkles, 
  ChevronDown, 
  FileCode, 
  FileSpreadsheet, 
  ClipboardPaste, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { 
  WorkerStatus, 
  TabType, 
  RedactionMode, 
  CustomRule, 
  BatchFile, 
  SanitizationResult, 
  ToastItem, 
  EntityCategory,
  AppMode,
  ActivityHistoryItem 
} from './types';

export default function App() {
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({
    status: 'booting',
    engine: 'initializing',
    message: 'Booting Python WASM Worker...'
  });
  const [activeTab, setActiveTab] = useState<TabType>('studio');
  const [appMode, setAppMode] = useState<AppMode>('sanitizer');
  const [rawText, setRawText] = useState('');
  const [sanitizedResult, setSanitizedResult] = useState<SanitizationResult | null>(null);
  const [messageGuardText, setMessageGuardText] = useState('');
  const [messageGuardResult, setMessageGuardResult] = useState<SanitizationResult | null>(null);
  const [showDemoDropdown, setShowDemoDropdown] = useState(false);
  const [redactionMode, setRedactionMode] = useState<RedactionMode>('full');
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set([
    'Credit Card', 'Aadhaar', 'PAN', 'Email', 'Phone', 'IPv4', 'Secret Token',
    'OTP', 'Password', 'Financial', 'Suspicious Link', 'Custom'
  ]));
  const [customRules, setCustomRules] = useState<CustomRule[]>([]);
  const [whitelistedIds, setWhitelistedIds] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<EntityCategory | null>(null);
  const [currentEntityIndex, setCurrentEntityIndex] = useState(0);

  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [activeBatchIndex, setActiveBatchIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isInputHubOpen, setIsInputHubOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [liveRawHash, setLiveRawHash] = useState<string>('');
  const [liveSanitizedHash, setLiveSanitizedHash] = useState<string>('');

  const sharedPseudonymMapRef = useRef<Record<string, string>>({});
  const sharedCountersRef = useRef<Record<string, number>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processTimeoutRef = useRef<any>(null);
  const guardTimeoutRef = useRef<any>(null);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<ActivityHistoryItem[]>(() => loadActivityHistory());
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const lastSavedHashRef = useRef<string>('');

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPwa = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      addToast('PII Shield app installed successfully');
    }
    setInstallPrompt(null);
  };

  const normalizeTier = (tier?: string): 'Low' | 'Medium' | 'High' | 'Critical' => {
    if (!tier) return 'Low';
    const lower = tier.toLowerCase();
    if (lower === 'critical') return 'Critical';
    if (lower === 'high') return 'High';
    if (lower === 'medium') return 'Medium';
    return 'Low';
  };

  const recordSessionInHistory = useCallback((
    mode: AppMode,
    title: string,
    format: string,
    raw: string,
    clean: string,
    res: SanitizationResult | null,
    rawHashVal?: string,
    sanHashVal?: string
  ) => {
    if (!raw || !raw.trim()) return;
    const rHash = rawHashVal || res?.raw_sha256 || '';
    const sHash = sanHashVal || res?.sanitized_sha256 || '';
    const uniqueKey = `${mode}_${rHash}_${sHash}`;
    if (lastSavedHashRef.current === uniqueKey) return;
    lastSavedHashRef.current = uniqueKey;

    const item: ActivityHistoryItem = {
      id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      title: title || (mode === 'message_guard' ? 'Guarded Message' : 'Sanitized Document'),
      mode,
      format: format || 'txt',
      rawPreview: raw.length > 200 ? raw.slice(0, 200) + '...' : raw,
      sanitizedPreview: clean.length > 200 ? clean.slice(0, 200) + '...' : clean,
      rawText: raw,
      sanitizedText: clean,
      risksCount: res?.active_matches_count ?? 0,
      riskTier: normalizeTier(res?.risk_tier),
      redactionMode: redactionMode,
      rawHash: rHash,
      sanitizedHash: sHash,
      fileName: title
    };
    saveActivityItem(item);
    setHistoryItems(loadActivityHistory());
  }, [redactionMode]);

  const handleRestoreHistory = (item: ActivityHistoryItem) => {
    if (item.mode === 'message_guard') {
      setAppMode('message_guard');
      setMessageGuardText(item.rawText);
    } else {
      setAppMode('sanitizer');
      const text = item.rawText;
      setRawText(text);
      const restoredFile: BatchFile = {
        id: `restored_${Date.now()}`,
        name: item.title,
        size: text.length,
        format: item.format || 'txt',
        rawText: text
      };
      setBatchFiles([restoredFile]);
      setActiveBatchIndex(0);
      setWhitelistedIds(new Set());
      setSelectedCategory(null);
      setCurrentEntityIndex(0);
    }
    if (item.redactionMode) {
      setRedactionMode(item.redactionMode);
    }
    setIsHistoryOpen(false);
    addToast(`Restored: ${item.title}`);
  };

  const handleDeleteHistory = (id: string) => {
    deleteActivityItem(id);
    setHistoryItems(loadActivityHistory());
    addToast('Removed history entry');
  };

  const handleClearHistory = () => {
    clearActivityHistory();
    setHistoryItems([]);
    addToast('Cleared all local activity history');
  };

  useEffect(() => {
    initPyodideWorker();
    const unsub = subscribeWorkerStatus((status) => {
      setWorkerStatus(status);
    });
    return () => unsub();
  }, []);

  const activeFile = batchFiles[activeBatchIndex] || null;
  const rawFormat = activeFile?.format || 'txt';
  const activeFormat = rawFormat === 'text' ? 'txt' : rawFormat;

  const runSanitization = useCallback(async (textToProcess: string) => {
    if (!textToProcess) {
      setSanitizedResult(null);
      return;
    }

    try {
      const options = {
        redaction_mode: redactionMode,
        enabled_types: Array.from(enabledTypes),
        custom_rules: customRules,
        whitelisted_ids: Array.from(whitelistedIds)
      };

      const result = await processWithWorker({
        format: activeFormat === 'docx' ? 'text' : activeFormat,
        content: textToProcess,
        options,
        pseudonymMap: sharedPseudonymMapRef.current,
        counters: sharedCountersRef.current
      });

      setSanitizedResult(result);
      if (result.pseudonym_vault) {
        sharedPseudonymMapRef.current = result.pseudonym_vault;
      }
    } catch (err) {
      addToast('Worker processing encountered an error', 'error');
    }
  }, [redactionMode, enabledTypes, customRules, whitelistedIds, activeFormat]);

  useEffect(() => {
    clearTimeout(processTimeoutRef.current);
    processTimeoutRef.current = setTimeout(() => {
      runSanitization(rawText);
    }, 150);
    return () => clearTimeout(processTimeoutRef.current);
  }, [rawText, runSanitization]);

  useEffect(() => {
    if (appMode !== 'message_guard') return;
    if (!messageGuardText.trim()) {
      setMessageGuardResult(null);
      return;
    }

    clearTimeout(guardTimeoutRef.current);
    guardTimeoutRef.current = setTimeout(async () => {
      try {
        const options = {
          redaction_mode: redactionMode,
          enabled_types: Array.from(enabledTypes),
          custom_rules: customRules,
          whitelisted_ids: []
        };
        const res = await processWithWorker({
          format: 'text',
          content: messageGuardText,
          options,
          pseudonymMap: sharedPseudonymMapRef.current,
          counters: sharedCountersRef.current
        });
        setMessageGuardResult(res);
      } catch (err) {
        addToast('Message safety scan encountered an error', 'error');
      }
    }, 150);

    return () => clearTimeout(guardTimeoutRef.current);
  }, [messageGuardText, appMode, redactionMode, enabledTypes, customRules]);

  useEffect(() => {
    let active = true;
    async function digestHashes() {
      if (!rawText) {
        if (active) {
          setLiveRawHash('');
          setLiveSanitizedHash('');
        }
        return;
      }
      const cleanText = sanitizedResult?.sanitized_text || rawText;
      if (window.crypto && window.crypto.subtle) {
        try {
          const [rb, sb] = await Promise.all([
            window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawText)),
            window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(cleanText))
          ]);
          if (active) {
            setLiveRawHash(Array.from(new Uint8Array(rb)).map(b => b.toString(16).padStart(2, '0')).join(''));
            setLiveSanitizedHash(Array.from(new Uint8Array(sb)).map(b => b.toString(16).padStart(2, '0')).join(''));
          }
          return;
        } catch (e) {}
      }
      if (active && sanitizedResult?.raw_sha256) {
        setLiveRawHash(sanitizedResult.raw_sha256);
        setLiveSanitizedHash(sanitizedResult.sanitized_sha256);
      }
    }
    digestHashes();
    return () => { active = false; };
  }, [rawText, sanitizedResult?.sanitized_text, sanitizedResult?.raw_sha256, sanitizedResult?.sanitized_sha256]);

  useEffect(() => {
    if (appMode === 'sanitizer' && sanitizedResult && rawText.trim().length > 0) {
      const timer = setTimeout(() => {
        recordSessionInHistory(
          'sanitizer',
          activeFile?.name || 'Document Snippet',
          activeFormat,
          rawText,
          sanitizedResult.sanitized_text || rawText,
          sanitizedResult,
          liveRawHash,
          liveSanitizedHash
        );
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [sanitizedResult, rawText, activeFile?.name, activeFormat, appMode, liveRawHash, liveSanitizedHash, recordSessionInHistory]);

  useEffect(() => {
    if (appMode === 'message_guard' && messageGuardResult && messageGuardText.trim().length > 0) {
      const timer = setTimeout(() => {
        recordSessionInHistory(
          'message_guard',
          'Guarded Message',
          'txt',
          messageGuardText,
          messageGuardResult.sanitized_text || messageGuardText,
          messageGuardResult
        );
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [messageGuardResult, messageGuardText, appMode, recordSessionInHistory]);

  const handleClearInput = () => {
    setRawText('');
    setSanitizedResult(null);
    setBatchFiles([]);
    setWhitelistedIds(new Set());
    setSelectedCategory(null);
    addToast('Cleared document input');
  };

  const handleLoadSample = async (sampleType: string) => {
    try {
      const sample = await generateSampleWithWorker(sampleType);
      const ext = sampleType === 'json' ? 'json' : sampleType === 'csv' ? 'csv' : 'txt';
      const name = sampleType === 'json' ? 'security_event_log.json' : sampleType === 'csv' ? 'support_tickets.csv' : 'incident_dossier.txt';

      setRawText(sample);
      setWhitelistedIds(new Set());
      setSelectedCategory(null);
      setCurrentEntityIndex(0);

      const newFile: BatchFile = {
        id: `sample_${Date.now()}`,
        name,
        size: sample.length,
        format: ext,
        rawText: sample
      };

      setBatchFiles([newFile]);
      setActiveBatchIndex(0);
      addToast(`Loaded ${name}`);
    } catch (err) {
      addToast('Failed to load sample', 'error');
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (!clipText.trim()) {
        addToast('Clipboard is empty', 'info');
        return;
      }
      setRawText(clipText);
      const newFile: BatchFile = {
        id: `clip_${Date.now()}`,
        name: 'clipboard_snippet.txt',
        size: clipText.length,
        format: 'txt',
        rawText: clipText
      };
      setBatchFiles([newFile]);
      setActiveBatchIndex(0);
      setWhitelistedIds(new Set());
      setSelectedCategory(null);
      addToast('Pasted text from clipboard');
    } catch (err) {
      addToast('Please grant clipboard permission or use Ctrl+V', 'error');
    }
  };

  const handleProcessIncomingFiles = async (filesList: FileList | File[] | null) => {
    if (!filesList || filesList.length === 0) return;

    const newBatch: BatchFile[] = [];
    for (let i = 0; i < filesList.length; i++) {
      const file = filesList[i];
      const rawFmt = detectFormat(file.name);
      const fmt = rawFmt === 'text' ? 'txt' : rawFmt;
      const fileId = `file_${Date.now()}_${i}`;

      try {
        if (fmt === 'pdf') {
          const extractedText = await extractTextFromPdf(file);
          newBatch.push({
            id: fileId,
            name: file.name,
            size: file.size,
            format: 'pdf',
            rawText: extractedText,
            rawFile: file
          });
        } else if (fmt === 'docx') {
          const ab = await file.arrayBuffer();
          const b64 = arrayBufferToBase64(ab);
          const docxOptions = {
            redaction_mode: redactionMode,
            enabled_types: Array.from(enabledTypes),
            custom_rules: customRules,
            whitelisted_ids: []
          };
          const res = await processWithWorker({
            format: 'docx',
            content: b64,
            options: docxOptions,
            pseudonymMap: sharedPseudonymMapRef.current,
            counters: sharedCountersRef.current
          });

          const sanitizedBlob = res.sanitized_docx_base64
            ? base64ToBlob(res.sanitized_docx_base64, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')
            : null;

          newBatch.push({
            id: fileId,
            name: file.name,
            size: file.size,
            format: 'docx',
            rawText: res.sanitized_text || 'DOCX XML structure processed',
            rawFile: file,
            sanitizedBlob: sanitizedBlob || undefined,
            sanitizedText: res.sanitized_text
          });
        } else {
          const text = await file.text();
          newBatch.push({
            id: fileId,
            name: file.name,
            size: file.size,
            format: fmt,
            rawText: text,
            rawFile: file
          });
        }
      } catch (err) {
        addToast(`Failed to parse file: ${file.name}`, 'error');
      }
    }

    if (newBatch.length > 0) {
      setBatchFiles(prev => [...prev, ...newBatch]);
      const lastIdx = batchFiles.length;
      setActiveBatchIndex(lastIdx);
      setRawText(newBatch[0].rawText);
      setWhitelistedIds(new Set());
      setSelectedCategory(null);
      setCurrentEntityIndex(0);
      addToast(`Added ${newBatch.length} file(s) to processing queue`);
    }
  };

  const handleSelectBatchFile = (idx: number) => {
    if (idx < 0 || idx >= batchFiles.length) return;
    setActiveBatchIndex(idx);
    const targetFile = batchFiles[idx];
    setRawText(targetFile.rawText);
    setWhitelistedIds(new Set());
    setSelectedCategory(null);
    setCurrentEntityIndex(0);
  };

  const handleRemoveBatchFile = (idx: number) => {
    setBatchFiles(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length === 0) {
        setRawText('');
        setSanitizedResult(null);
        setActiveBatchIndex(0);
      } else if (activeBatchIndex >= updated.length) {
        setActiveBatchIndex(updated.length - 1);
        setRawText(updated[updated.length - 1].rawText);
      } else {
        setRawText(updated[activeBatchIndex].rawText);
      }
      return updated;
    });
  };

  const handleToggleType = (type: string) => {
    setEnabledTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const handleAddCustomRule = (rule: CustomRule) => {
    setCustomRules(prev => [...prev, rule]);
    addToast(`Added rule: ${rule.value}`);
  };

  const handleRemoveCustomRule = (id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleWhitelist = (id: string) => {
    setWhitelistedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopySanitized = () => {
    const textToCopy = sanitizedResult?.sanitized_text || rawText;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    addToast('Sanitized clean text copied to clipboard');
    recordSessionInHistory(
      'sanitizer',
      activeFile?.name || 'Document Snippet',
      activeFormat,
      rawText,
      textToCopy,
      sanitizedResult,
      liveRawHash,
      liveSanitizedHash
    );
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSanitized = () => {
    const textToDownload = sanitizedResult?.sanitized_text || rawText;
    const cleanExt = (activeFormat || 'txt').trim().toLowerCase().replace(/^\./, '');
    const ext = cleanExt === 'text' ? 'txt' : (cleanExt || 'txt');
    const baseName = activeFile?.name ? activeFile.name.replace(/\.[^/.]+$/, "") : "document";
    const filename = `sanitized_${baseName}.${ext}`;

    recordSessionInHistory(
      'sanitizer',
      activeFile?.name || 'Document Snippet',
      activeFormat,
      rawText,
      textToDownload,
      sanitizedResult,
      liveRawHash,
      liveSanitizedHash
    );

    if (activeFormat === 'docx' && activeFile?.sanitizedBlob) {
      downloadBlob(activeFile.sanitizedBlob, filename);
      addToast('Downloaded sanitized .docx file');
      return;
    }

    downloadText(textToDownload, filename);
    addToast(`Downloaded sanitized .${ext} file`);
  };

  const handleDownloadAuditReport = () => {
    if (!sanitizedResult) return;
    const auditObj = {
      system: "PII Shield Privacy Engine",
      runtime: "Pyodide Python 3.12 Web Worker",
      timestamp: new Date().toISOString(),
      raw_sha256: liveRawHash || sanitizedResult.raw_sha256,
      sanitized_sha256: liveSanitizedHash || sanitizedResult.sanitized_sha256,
      risk_assessment: {
        score: sanitizedResult.risk_score,
        tier: sanitizedResult.risk_tier,
        compliance_frameworks: sanitizedResult.compliance_frameworks
      },
      detection_metrics: {
        total_sensitive_matches_found: sanitizedResult.matches?.length || 0,
        active_matches_redacted: sanitizedResult.active_matches_count,
        whitelisted_matches_count: whitelistedIds.size,
        false_positive_traps_ignored: sanitizedResult.rejected_traps_count
      },
      entity_breakdown: sanitizedResult.entity_counts,
      ignored_traps_log: sanitizedResult.rejected_traps,
      active_matches: (sanitizedResult.matches || []).filter(m => !whitelistedIds.has(m.id))
    };

    const auditJson = JSON.stringify(auditObj, null, 2);
    downloadText(auditJson, `audit_report_${Date.now()}.json`, 'application/json');
    addToast('Downloaded audit report JSON');
  };

  const handleDownloadVault = () => {
    if (!sharedPseudonymMapRef.current) return;
    const vaultJson = JSON.stringify({
      vault_version: "1.0",
      generated_at: new Date().toISOString(),
      reversible_entity_map: sharedPseudonymMapRef.current
    }, null, 2);
    downloadText(vaultJson, `pseudonym_vault_${Date.now()}.json`, 'application/json');
    addToast('Downloaded pseudonym key dictionary');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessIncomingFiles(e.dataTransfer.files);
    }
  };

  const hasSanitizerContent = Boolean(rawText.trim() || batchFiles.length > 0);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen bg-slate-50 text-slate-900 relative flex flex-col font-sans"
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          handleProcessIncomingFiles(e.target.files);
          e.target.value = '';
        }}
      />

      {isDragging && (
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-6"
        >
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-900 p-8 text-center max-w-md shadow-2xl">
            <UploadCloud className="w-12 h-12 text-slate-900 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-900 mb-1">
              Drop Document to Sanitize Offline
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              All files are parsed locally inside your browser with 0 bytes transmitted.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['.txt', '.csv', '.xlsx', '.json', '.xml', '.docx', '.pdf', '.eml'].map((ext) => (
                <span key={ext} className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-medium">
                  {ext}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workerStatus={workerStatus}
        onOpenInputHub={() => setIsInputHubOpen(true)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
        historyCount={historyItems.length}
        canInstall={Boolean(installPrompt)}
        onInstallPwa={handleInstallPwa}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {activeTab === 'promptlog' ? (
          <PromptLogTab />
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
              <div className="inline-flex p-1 bg-slate-200/70 rounded-xl">
                <button
                  onClick={() => setAppMode('sanitizer')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    appMode === 'sanitizer'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-slate-700" />
                  <span>Document & File Sanitizer</span>
                </button>
                <button
                  onClick={() => setAppMode('message_guard')}
                  className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    appMode === 'message_guard'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4 text-slate-700" />
                  <span>Message Safety Guard</span>
                </button>
              </div>

              {appMode === 'sanitizer' && hasSanitizerContent && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsInputHubOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add File</span>
                  </button>
                  <button
                    onClick={handleClearInput}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All</span>
                  </button>
                </div>
              )}
            </div>

            {appMode === 'message_guard' ? (
              <MessageGuardView
                messageText={messageGuardText}
                onChangeMessageText={setMessageGuardText}
                sanitizedResult={messageGuardResult}
                redactionMode={redactionMode}
                onChangeRedactionMode={setRedactionMode}
                onPasteClipboard={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    setMessageGuardText(text);
                    addToast('Pasted message from clipboard');
                  } catch (e) {
                    addToast('Clipboard access denied', 'error');
                  }
                }}
                onClearMessage={() => {
                  setMessageGuardText('');
                  setMessageGuardResult(null);
                }}
                addToast={addToast}
              />
            ) : (
              <>
                {!hasSanitizerContent ? (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-semibold text-slate-900">
                          Sanitize Sensitive Data Locally
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Paste text, logs, or drop multi-format files to detect, redact, and pseudonymize PII offline.
                        </p>
                      </div>

                      <div className="relative">
                        <button
                          onClick={() => setShowDemoDropdown(!showDemoDropdown)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                          <span>Load Demo Sample</span>
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        </button>

                        {showDemoDropdown && (
                          <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => {
                                setShowDemoDropdown(false);
                                handleLoadSample('incident');
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5 text-slate-400" />
                              <div>
                                <div className="font-medium text-slate-900">Incident Dossier (.txt)</div>
                                <div className="text-[10px] text-slate-400">Cards, Aadhaar, PAN, secrets & traps</div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setShowDemoDropdown(false);
                                handleLoadSample('json');
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <FileCode className="w-3.5 h-3.5 text-slate-400" />
                              <div>
                                <div className="font-medium text-slate-900">Security Event Log (.json)</div>
                                <div className="text-[10px] text-slate-400">Structured JSON payload with tokens</div>
                              </div>
                            </button>
                            <button
                              onClick={() => {
                                setShowDemoDropdown(false);
                                handleLoadSample('csv');
                              }}
                              className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                            >
                              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
                              <div>
                                <div className="font-medium text-slate-900">Customer Support Table (.csv)</div>
                                <div className="text-[10px] text-slate-400">Tabular ledger with phone & email</div>
                              </div>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 min-h-[440px]">
                      <div className="p-6 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-slate-700">Paste Text or Logs</label>
                            <button
                              onClick={handlePasteClipboard}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                            >
                              <ClipboardPaste className="w-3.5 h-3.5 text-slate-500" />
                              <span>Paste from Clipboard</span>
                            </button>
                          </div>
                          <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="Paste text, a message, logs, or notes here to sanitize locally..."
                            className="w-full h-64 p-3.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white resize-none font-mono leading-relaxed"
                            spellCheck={false}
                          />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            Strict 0-server privacy • Evaluated in local browser Web Worker
                          </span>
                          <button
                            onClick={() => {
                              if (!rawText.trim()) {
                                addToast('Please paste or type text first', 'info');
                                return;
                              }
                              setBatchFiles([{
                                id: `input_${Date.now()}`,
                                name: 'manual_input.txt',
                                size: rawText.length,
                                format: 'txt',
                                rawText
                              }]);
                              setActiveBatchIndex(0);
                            }}
                            disabled={!rawText.trim()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors cursor-pointer"
                          >
                            <span>Start Sanitizing</span>
                          </button>
                        </div>
                      </div>

                      <div className="p-6 flex flex-col justify-between bg-slate-50/30">
                        <div>
                          <div className="mb-2">
                            <span className="text-xs font-semibold text-slate-700">Drop Files or Spreadsheets</span>
                          </div>
                          <div
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-white hover:bg-slate-50/50 min-h-[256px]"
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 mb-3 shadow-2xs">
                              <UploadCloud className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-semibold text-slate-900">
                              Drop files here or click to browse
                            </p>
                            <p className="text-xs text-slate-500 mt-1 max-w-xs">
                              Upload documents, spreadsheets, logs, or multi-file batches for structure-preserving offline redaction.
                            </p>
                            <div className="flex flex-wrap justify-center gap-1.5 mt-4 max-w-sm">
                              {['.txt', '.csv', '.xlsx', '.json', '.xml', '.docx', '.pdf', '.eml'].map((ext) => (
                                <span key={ext} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-mono font-medium">
                                  {ext}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                          <span>Batch files processed sequentially</span>
                          <span>Exports preserve original file types</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <CommandStrip
                      result={sanitizedResult}
                      selectedCategory={selectedCategory}
                      currentEntityIndex={currentEntityIndex}
                      onSelectCategory={(cat) => {
                        if (!cat) {
                          setSelectedCategory(null);
                          setCurrentEntityIndex(0);
                        } else if (selectedCategory === cat) {
                          const catMatches = (sanitizedResult?.matches || []).filter(m => m.type === cat && !whitelistedIds.has(m.id));
                          if (catMatches.length > 0) {
                            setCurrentEntityIndex((prev) => (prev + 1) % catMatches.length);
                          }
                        } else {
                          setSelectedCategory(cat);
                          setCurrentEntityIndex(0);
                        }
                      }}
                      onOpenDrawer={() => setIsDrawerOpen(true)}
                      activeDetectorCount={enabledTypes.size}
                    />

                    <DiffWorkspace
                      rawText={rawText}
                      onChangeRawText={setRawText}
                      sanitizedText={sanitizedResult?.sanitized_text || rawText}
                      matches={sanitizedResult?.matches || []}
                      activeFile={activeFile}
                      activeFormat={activeFormat}
                      whitelistedIds={whitelistedIds}
                      onToggleWhitelist={handleToggleWhitelist}
                      highlightedCategory={selectedCategory}
                      currentEntityIndex={currentEntityIndex}
                      onCopySanitized={handleCopySanitized}
                      isCopied={isCopied}
                      tableMatrix={activeFile?.tableMatrix}
                      redactionMode={redactionMode}
                      onChangeRedactionMode={setRedactionMode}
                      onOpenInputHub={() => setIsInputHubOpen(true)}
                      onPasteClipboard={handlePasteClipboard}
                      onClearInput={handleClearInput}
                    />

                    <ExportBar
                      onDownloadSanitized={handleDownloadSanitized}
                      onDownloadAuditReport={handleDownloadAuditReport}
                      onDownloadVault={handleDownloadVault}
                      redactionMode={redactionMode}
                      activeFormat={activeFormat}
                      rawHash={liveRawHash || sanitizedResult?.raw_sha256}
                      sanitizedHash={liveSanitizedHash || sanitizedResult?.sanitized_sha256}
                      activeMatchesCount={sanitizedResult?.active_matches_count || 0}
                    />
                  </>
                )}
              </>
            )}
          </div>
        )}
      </main>

      <InputHubModal
        isOpen={isInputHubOpen}
        onClose={() => setIsInputHubOpen(false)}
        onTriggerUpload={() => fileInputRef.current?.click()}
        onFileDrop={handleProcessIncomingFiles}
        onPasteClipboard={handlePasteClipboard}
        onStartBlank={() => {
          handleClearInput();
          setIsInputHubOpen(false);
        }}
        onLoadSample={handleLoadSample}
        batchFiles={batchFiles}
        activeBatchIndex={activeBatchIndex}
        onSelectBatchFile={handleSelectBatchFile}
        onRemoveBatchFile={handleRemoveBatchFile}
      />

      <DetectorDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        enabledTypes={enabledTypes}
        onToggleType={handleToggleType}
        customRules={customRules}
        onAddCustomRule={handleAddCustomRule}
        onRemoveCustomRule={handleRemoveCustomRule}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={historyItems}
        onRestore={handleRestoreHistory}
        onDelete={handleDeleteHistory}
        onClearAll={handleClearHistory}
        addToast={addToast}
      />

      <ExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        onToast={addToast}
      />

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
