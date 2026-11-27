export type RedactionMode = 'full' | 'partial' | 'pseudonym';

export type EntityCategory = 
  | 'Credit Card'
  | 'Aadhaar'
  | 'PAN'
  | 'Email'
  | 'Phone'
  | 'IPv4'
  | 'Secret Token'
  | 'OTP'
  | 'Password'
  | 'Financial'
  | 'Suspicious Link'
  | 'Custom';

export type AppMode = 'sanitizer' | 'message_guard';

export interface SafetyAdvisory {
  id: string;
  category: string;
  title: string;
  description: string;
  recommendation: string;
  severity: 'Critical' | 'High' | 'Medium';
}

export interface SafetyVerdict {
  level: 'Safe to Send' | 'Review Recommended' | 'Unsafe to Send';
  color: 'emerald' | 'amber' | 'rose';
  advisories: SafetyAdvisory[];
  risksCount: number;
}

export type SeverityTier = 'Low' | 'Medium' | 'High' | 'Critical';

export interface PIIMatch {
  id: string;
  start: number;
  end: number;
  type: EntityCategory;
  value: string;
  reason: string;
  line: number;
  severity: SeverityTier;
  redacted_value?: string;
  cell?: string;
  json_path?: string;
}

export interface RejectedTrap {
  value: string;
  type: string;
  reason: string;
  line: number;
}

export interface SanitizationResult {
  sanitized_text: string;
  matches: PIIMatch[];
  active_matches_count: number;
  entity_counts: Record<string, number>;
  rejected_traps_count: number;
  rejected_traps: RejectedTrap[];
  risk_score: number;
  risk_tier: SeverityTier;
  compliance_frameworks: string[];
  raw_sha256?: string;
  sanitized_sha256?: string;
  pseudonym_vault?: Record<string, string>;
  sanitized_matrix?: string[][];
  sanitized_docx_base64?: string;
}

export interface CustomRule {
  id: string;
  type: 'keyword' | 'regex';
  value: string;
}

export interface BatchFile {
  id: string;
  name: string;
  size: number;
  format: string;
  rawText: string;
  sanitizedText?: string;
  sanitizedBlob?: Blob | null;
  sanitizedFilename?: string;
  tableMatrix?: string[][];
  rawFile?: File;
  result?: SanitizationResult;
}

export interface WorkerStatus {
  status: 'booting' | 'ready' | 'ready_fallback' | 'error';
  engine: 'initializing' | 'python-wasm' | 'js-mirror' | 'error';
  message: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type TabType = 'studio' | 'promptlog';

export interface ActivityHistoryItem {
  id: string;
  timestamp: string;
  mode: 'sanitizer' | 'message_guard';
  title: string;
  rawPreview: string;
  sanitizedPreview: string;
  rawText: string;
  sanitizedText: string;
  risksCount: number;
  riskTier: SeverityTier;
  redactionMode: RedactionMode;
  rawHash?: string;
  sanitizedHash?: string;
  fileName?: string;
  format?: string;
}
