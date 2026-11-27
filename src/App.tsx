import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import CommandStrip from './components/CommandStrip';
import DiffWorkspace from './components/DiffWorkspace';
import ExportBar from './components/ExportBar';
import InputHubModal from './components/InputHubModal';
import DetectorDrawer from './components/DetectorDrawer';
import PromptLogTab from './components/PromptLogTab';
import Toast from './components/Toast';
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
import { UploadCloud } from 'lucide-react';
import { 
  WorkerStatus, 
  TabType, 
  RedactionMode, 
  CustomRule, 
  BatchFile, 
  SanitizationResult, 
  ToastItem, 
  EntityCategory 
} from './types';

export default function App() {
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>({
    status: 'booting',
    engine: 'initializing',
    message: 'Booting Python WASM Worker...'
  });
  const [activeTab, setActiveTab] = useState<TabType>('studio');
  const [rawText, setRawText] = useState('');
  const [sanitizedResult, setSanitizedResult] = useState<SanitizationResult | null>(null);
  const [redactionMode, setRedactionMode] = useState<RedactionMode>('full');
  const [enabledTypes, setEnabledTypes] = useState<Set<string>>(new Set([
    'Credit Card', 'Aadhaar', 'PAN', 'Email', 'Phone', 'IPv4', 'Secret Token', 'Custom'
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

  useEffect(() => {
    initPyodideWorker();
    const unsub = subscribeWorkerStatus((status) => {
      setWorkerStatus(status);
    });
    return () => unsub();
  }, []);

  const loadInitialSample = useCallback(async () => {
    try {
      const sample = await generateSampleWithWorker('mixed');
      setRawText(sample);
      setBatchFiles([{
        id: 'sample_dossier',
        name: 'incident_dossier_7749.txt',
        size: sample.length,
        format: 'txt',
        rawText: sample
      }]);
      setActiveBatchIndex(0);
    } catch (err) {
      setRawText('Sample generation failed. Please type or paste text.');
    }
  }, []);

  useEffect(() => {
    loadInitialSample();
  }, [loadInitialSample]);

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
      addToast(`Loaded ${name} with valid entities & false-positive traps!`);
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
      addToast('Pasted document from clipboard!');
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
      addToast(`Added ${newBatch.length} file(s) to processing queue!`);
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
    addToast(`Added custom rule: ${rule.value}`);
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
    addToast('Sanitized clean text copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadSanitized = () => {
    const textToDownload = sanitizedResult?.sanitized_text || rawText;
    const cleanExt = (activeFormat || 'txt').trim().toLowerCase().replace(/^\./, '');
    const ext = cleanExt === 'text' ? 'txt' : (cleanExt || 'txt');
    const baseName = activeFile?.name ? activeFile.name.replace(/\.[^/.]+$/, "") : "document";
    const filename = `sanitized_${baseName}.${ext}`;

    if (activeFormat === 'docx' && activeFile?.sanitizedBlob) {
      downloadBlob(activeFile.sanitizedBlob, filename);
      addToast('Downloaded sanitized .docx file!');
      return;
    }

    downloadText(textToDownload, filename);
    addToast(`Downloaded sanitized .${ext} file!`);
  };

  const handleDownloadAuditReport = () => {
    if (!sanitizedResult) return;
    const auditObj = {
      system: "PII Shield Zero-Leakage Privacy Engine",
      runtime: "Pyodide Python 3.12 Web Worker (WASM)",
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
    addToast('Downloaded cryptographic audit report JSON!');
  };

  const handleDownloadVault = () => {
    if (!sharedPseudonymMapRef.current) return;
    const vaultJson = JSON.stringify({
      vault_version: "1.0",
      generated_at: new Date().toISOString(),
      reversible_entity_map: sharedPseudonymMapRef.current
    }, null, 2);
    downloadText(vaultJson, `pseudonym_vault_${Date.now()}.json`, 'application/json');
    addToast('Downloaded pseudonym vault dictionary!');
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

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="min-h-screen text-[#0F172A] relative flex flex-col"
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
          className="fixed inset-0 z-50 bg-indigo-900/25 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-150"
        >
          <div className="bg-white/95 backdrop-blur-2xl rounded-3xl border-2 border-dashed border-indigo-500 p-10 text-center max-w-lg shadow-2xl ring-8 ring-indigo-500/10">
            <UploadCloud className="w-14 h-14 text-indigo-600 mx-auto mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Drop Document to Sanitize Locally
            </h3>
            <p className="text-xs text-slate-600 mb-4 max-w-sm mx-auto">
              Drop your .txt, .csv, .xlsx, .json, .docx, .pdf, or .eml file to sanitize locally with zero network requests.
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {['.txt', '.csv', '.xlsx', '.json', '.xml', '.docx', '.pdf', '.eml'].map((ext) => (
                <span key={ext} className="px-2 py-0.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-mono font-bold">
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
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        {activeTab === 'promptlog' ? (
          <PromptLogTab />
        ) : (
          <>
            <CommandStrip
              result={sanitizedResult}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentEntityIndex(0);
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

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
