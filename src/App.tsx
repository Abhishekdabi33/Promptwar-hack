import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import TelemetryDashboard from './components/TelemetryDashboard';
import ControlBar from './components/ControlBar';
import DiffWorkspace from './components/DiffWorkspace';
import BatchQueueStrip from './components/BatchQueueStrip';
import ExportBar from './components/ExportBar';
import PromptLogTab from './components/PromptLogTab';
import Toast from './components/Toast';
import { 
  initPyodideWorker, 
  subscribeWorkerStatus, 
  processWithWorker, 
  processCellsWithWorker,
  generateSampleWithWorker 
} from './services/pyodideService';
import { 
  detectFormat, 
  extractTextFromPdf, 
  exportSanitizedPdf, 
  parseXlsxWorkbook, 
  rebuildXlsxWorkbook, 
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
        format: 'text',
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
  const activeFormat = activeFile?.format || 'text';

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
        format: 'text',
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
      const fmt = detectFormat(file.name);
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
            rawText: res.sanitized_text || 'Processed DOCX Document',
            sanitizedText: res.sanitized_text,
            sanitizedBlob,
            sanitizedFilename: `sanitized_${file.name}`,
            result: res
          });
        } else if (fmt === 'xlsx') {
          const { sheets, sheetNames } = await parseXlsxWorkbook(file);
          const firstSheet = sheets[sheetNames[0]] || [];
          const cellOptions = {
            redaction_mode: redactionMode,
            enabled_types: Array.from(enabledTypes),
            custom_rules: customRules,
            whitelisted_ids: []
          };
          const cellRes = await processCellsWithWorker({
            matrix: firstSheet,
            options: cellOptions,
            pseudonymMap: sharedPseudonymMapRef.current,
            counters: sharedCountersRef.current
          });

          const sanitizedSheets = { [sheetNames[0]]: cellRes.sanitized_matrix };
          const sanitizedXlsxBlob = rebuildXlsxWorkbook(sanitizedSheets, sheetNames);

          newBatch.push({
            id: fileId,
            name: file.name,
            size: file.size,
            format: 'xlsx',
            rawText: firstSheet.map(r => r.join(',')).join('\n'),
            sanitizedText: (cellRes.sanitized_matrix || []).map(r => r.join(',')).join('\n'),
            sanitizedBlob: sanitizedXlsxBlob,
            sanitizedFilename: `sanitized_${file.name}`,
            tableMatrix: cellRes.sanitized_matrix,
            result: cellRes as any
          });
        } else {
          const text = await file.text();
          newBatch.push({
            id: fileId,
            name: file.name,
            size: file.size,
            format: fmt,
            rawText: text
          });
        }
      } catch (e: any) {
        addToast(`Failed to parse ${file.name}: ${e?.message || 'Error'}`, 'error');
      }
    }

    if (newBatch.length > 0) {
      setBatchFiles(newBatch);
      setActiveBatchIndex(0);
      setRawText(newBatch[0].rawText);
      setWhitelistedIds(new Set());
      setSelectedCategory(null);
      setCurrentEntityIndex(0);
      addToast(`Imported ${newBatch.length} ${newBatch.length === 1 ? 'file' : 'files'} into client-side pipeline!`);
    }
  };

  const handleSelectBatchFile = (index: number) => {
    setActiveBatchIndex(index);
    const target = batchFiles[index];
    if (target) {
      setRawText(target.rawText);
      setWhitelistedIds(new Set());
      setSelectedCategory(null);
      setCurrentEntityIndex(0);
    }
  };

  const handleRemoveBatchFile = (index: number) => {
    const nextFiles = batchFiles.filter((_, i) => i !== index);
    setBatchFiles(nextFiles);
    if (nextFiles.length > 0) {
      const nextIdx = Math.max(0, index - 1);
      setActiveBatchIndex(nextIdx);
      setRawText(nextFiles[nextIdx].rawText);
    } else {
      setRawText('');
      setSanitizedResult(null);
    }
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
    addToast(`Added custom ${rule.type} rule: "${rule.value}"`);
  };

  const handleRemoveCustomRule = (id: string) => {
    setCustomRules(prev => prev.filter(r => r.id !== id));
  };

  const handleToggleWhitelist = (matchId: string) => {
    setWhitelistedIds(prev => {
      const next = new Set(prev);
      const isAlreadyWhite = next.has(matchId);
      if (isAlreadyWhite) {
        next.delete(matchId);
        addToast('Re-applied redaction to selected match');
      } else {
        next.add(matchId);
        addToast('Match whitelisted (preserved in output)');
      }
      return next;
    });
  };

  const handleCopySanitized = () => {
    if (!sanitizedResult?.sanitized_text) return;
    navigator.clipboard.writeText(sanitizedResult.sanitized_text);
    setIsCopied(true);
    addToast('Sanitized output copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const filteredMatches = (sanitizedResult?.matches || []).filter(m => {
    if (whitelistedIds.has(m.id)) return false;
    if (selectedCategory && m.type !== selectedCategory) return false;
    return true;
  });

  const handleNavigateEntity = (direction: 'prev' | 'next') => {
    if (filteredMatches.length === 0) return;
    if (direction === 'next') {
      setCurrentEntityIndex(prev => (prev + 1) % filteredMatches.length);
    } else {
      setCurrentEntityIndex(prev => (prev - 1 + filteredMatches.length) % filteredMatches.length);
    }
  };

  const handleDownloadSanitized = () => {
    if (!sanitizedResult) return;
    const baseName = activeFile?.name ? activeFile.name.replace(/\.[^/.]+$/, "") : "sanitized_document";

    if (activeFormat === 'pdf') {
      exportSanitizedPdf(sanitizedResult.sanitized_text, `${baseName}_sanitized.pdf`);
      addToast('Downloaded sanitized PDF via jsPDF!');
    } else if (activeFormat === 'docx') {
      if (activeFile?.sanitizedBlob) {
        downloadBlob(activeFile.sanitizedBlob, `${baseName}_sanitized.docx`);
      } else {
        downloadText(sanitizedResult.sanitized_text, `${baseName}_sanitized.txt`);
      }
      addToast('Downloaded sanitized DOCX file!');
    } else if (activeFormat === 'xlsx') {
      if (activeFile?.sanitizedBlob) {
        downloadBlob(activeFile.sanitizedBlob, `${baseName}_sanitized.xlsx`);
      } else {
        downloadText(sanitizedResult.sanitized_text, `${baseName}_sanitized.csv`);
      }
      addToast('Downloaded sanitized XLSX workbook!');
    } else if (activeFormat === 'csv' || activeFormat === 'tsv') {
      downloadText(sanitizedResult.sanitized_text, `${baseName}_sanitized.${activeFormat}`, 'text/csv');
      addToast(`Downloaded sanitized .${activeFormat}!`);
    } else if (activeFormat === 'json') {
      downloadText(sanitizedResult.sanitized_text, `${baseName}_sanitized.json`, 'application/json');
      addToast('Downloaded sanitized .json!');
    } else if (activeFormat === 'xml') {
      downloadText(sanitizedResult.sanitized_text, `${baseName}_sanitized.xml`, 'application/xml');
      addToast('Downloaded sanitized .xml!');
    } else if (activeFormat === 'eml') {
      downloadText(sanitizedResult.sanitized_text, `${baseName}_sanitized.eml`, 'message/rfc822');
      addToast('Downloaded sanitized .eml!');
    } else {
      downloadText(sanitizedResult.sanitized_text, `${baseName}_sanitized.txt`, 'text/plain');
      addToast('Downloaded sanitized .txt!');
    }
  };

  const handleDownloadAuditReport = () => {
    if (!sanitizedResult) return;
    const auditObj = {
      audit_meta: {
        application: "PII Shield — Client-Side Zero-Server Sanitizer",
        version: "2.6.0-wasm",
        timestamp: new Date().toISOString(),
        redaction_policy: redactionMode,
        execution_environment: workerStatus.engine === 'python-wasm' ? 'Python 3.12 WebAssembly (Pyodide Web Worker)' : 'Client-Side Safe Engine'
      },
      file_details: {
        name: activeFile?.name || 'raw_input.txt',
        format: activeFormat,
        input_sha256: sanitizedResult.raw_sha256,
        output_sha256: sanitizedResult.sanitized_sha256
      },
      risk_and_compliance: {
        risk_score: sanitizedResult.risk_score,
        risk_tier: sanitizedResult.risk_tier,
        triggered_regulations: sanitizedResult.compliance_frameworks,
        active_pii_matches_count: sanitizedResult.active_matches_count,
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

  const handleDownloadAllZip = async () => {
    if (batchFiles.length === 0) return;
    try {
      const filesToZip = batchFiles.map(f => ({
        sanitizedFilename: `sanitized_${f.name}`,
        sanitizedBlob: f.sanitizedBlob,
        sanitizedText: f.sanitizedText || (f.id === activeFile?.id ? sanitizedResult?.sanitized_text : f.rawText)
      }));

      const zipBlob = await createBatchZip(filesToZip);
      downloadBlob(zipBlob, `pii_shield_batch_${Date.now()}.zip`);
      addToast('Downloaded complete batch as ZIP!');
    } catch (err) {
      addToast('Failed to create batch ZIP', 'error');
    }
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
      className="min-h-screen bg-[#F8FAFC] text-[#0F172A] relative flex flex-col"
    >
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-indigo-900/40 backdrop-blur-xs flex items-center justify-center p-6 border-4 border-dashed border-indigo-400 m-4 rounded-3xl animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
            <UploadCloud className="w-16 h-16 text-indigo-600 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              Drop Files to Sanitize Locally
            </h3>
            <p className="text-xs text-slate-500">
              Supports TXT, CSV, TSV, XLSX, JSON, XML, DOCX, PDF, and EML. Processed 100% inside your browser Web Worker with 0 server uploads.
            </p>
          </div>
        </div>
      )}

      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workerStatus={workerStatus}
        onLoadSample={handleLoadSample}
        onPasteClipboard={handlePasteClipboard}
        onTriggerUpload={() => fileInputRef.current?.click()}
        fileInputRef={fileInputRef}
        onFileChange={(e) => handleProcessIncomingFiles(e.target.files)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'promptlog' ? (
          <PromptLogTab />
        ) : (
          <>
            <BatchQueueStrip
              files={batchFiles}
              activeFileIndex={activeBatchIndex}
              onSelectFile={handleSelectBatchFile}
              onRemoveFile={handleRemoveBatchFile}
              onDownloadAllZip={handleDownloadAllZip}
            />

            <TelemetryDashboard
              result={sanitizedResult}
              selectedCategory={selectedCategory}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setCurrentEntityIndex(0);
              }}
              currentEntityIndex={currentEntityIndex}
              onNavigateEntity={handleNavigateEntity}
              filteredMatches={filteredMatches}
            />

            <ControlBar
              redactionMode={redactionMode}
              onChangeRedactionMode={setRedactionMode}
              enabledTypes={enabledTypes}
              onToggleType={handleToggleType}
              customRules={customRules}
              onAddCustomRule={handleAddCustomRule}
              onRemoveCustomRule={handleRemoveCustomRule}
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
            />

            <ExportBar
              onDownloadSanitized={handleDownloadSanitized}
              onDownloadAuditReport={handleDownloadAuditReport}
              onDownloadVault={handleDownloadVault}
              redactionMode={redactionMode}
              activeFormat={activeFormat}
              rawHash={sanitizedResult?.raw_sha256}
              sanitizedHash={sanitizedResult?.sanitized_sha256}
              activeMatchesCount={sanitizedResult?.active_matches_count || 0}
            />
          </>
        )}
      </main>

      <Toast toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
