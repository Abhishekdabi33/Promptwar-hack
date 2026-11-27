import React, { useMemo } from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  AlertCircle, 
  Copy, 
  Check, 
  ClipboardPaste, 
  Trash2, 
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
  Shuffle,
  Shield
} from 'lucide-react';
import { SanitizationResult, RedactionMode, SafetyAdvisory, SafetyVerdict } from '../types';

interface MessageGuardViewProps {
  messageText: string;
  onChangeMessageText: (text: string) => void;
  sanitizedResult: SanitizationResult | null;
  redactionMode: RedactionMode;
  onChangeRedactionMode: (mode: RedactionMode) => void;
  onPasteClipboard: () => void;
  onClearMessage: () => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export default function MessageGuardView({
  messageText,
  onChangeMessageText,
  sanitizedResult,
  redactionMode,
  onChangeRedactionMode,
  onPasteClipboard,
  onClearMessage,
  addToast
}: MessageGuardViewProps) {
  const [isCopied, setIsCopied] = React.useState(false);

  const verdict: SafetyVerdict = useMemo(() => {
    if (!messageText.trim()) {
      return {
        level: 'Safe to Send',
        color: 'emerald',
        advisories: [],
        risksCount: 0
      };
    }

    const counts = sanitizedResult?.entity_counts || {};
    const advisories: SafetyAdvisory[] = [];
    let hasCritical = false;
    let hasHigh = false;

    if ((counts['OTP'] || 0) > 0) {
      hasCritical = true;
      advisories.push({
        id: 'otp',
        category: 'One-Time Passcode',
        title: 'Contains a verification code or OTP',
        description: 'Sharing one-time verification codes in chats or support channels allows immediate account takeover.',
        recommendation: 'Do not share one-time codes in messages. Real service providers will never request this.',
        severity: 'Critical'
      });
    }

    if ((counts['Password'] || 0) > 0) {
      hasCritical = true;
      advisories.push({
        id: 'pwd',
        category: 'Plaintext Credentials',
        title: 'Contains an exposed password or secret key',
        description: 'Cleartext passwords can be archived in chat logs, viewed by group members, or logged by third parties.',
        recommendation: 'Remove the credential and use a secure password manager or temporary secret sharing link.',
        severity: 'Critical'
      });
    }

    if ((counts['Credit Card'] || 0) > 0) {
      hasCritical = true;
      advisories.push({
        id: 'card',
        category: 'Payment Cards',
        title: 'Contains a valid credit or debit card number',
        description: 'Transmitting full card numbers across messaging or email violates PCI-DSS security compliance.',
        recommendation: 'Mask all but the last 4 digits before communicating with customers or teammates.',
        severity: 'Critical'
      });
    }

    if ((counts['Secret Token'] || 0) > 0) {
      hasCritical = true;
      advisories.push({
        id: 'secret',
        category: 'API Credentials',
        title: 'Contains a high-entropy secret or API token',
        description: 'Exposed access tokens permit programmatic access to production systems and databases.',
        recommendation: 'Rotate this secret immediately and pass credentials via environment secrets.',
        severity: 'Critical'
      });
    }

    if ((counts['Aadhaar'] || 0) > 0 || (counts['PAN'] || 0) > 0) {
      hasHigh = true;
      advisories.push({
        id: 'identity',
        category: 'National Identity Proof',
        title: 'Contains national identity identifiers (Aadhaar or PAN)',
        description: 'Identity card numbers can be aggregated and weaponized for financial impersonation.',
        recommendation: 'Redact government identifiers unless using a designated compliance portal.',
        severity: 'High'
      });
    }

    if ((counts['Financial'] || 0) > 0) {
      hasHigh = true;
      advisories.push({
        id: 'financial',
        category: 'Financial Transfer Details',
        title: 'Contains Indian financial routing (UPI handle or IFSC code)',
        description: 'UPI IDs and branch codes reveal sensitive personal banking accounts and routing targets.',
        recommendation: 'Verify the authenticity of the recipient before providing direct transfer routes.',
        severity: 'High'
      });
    }

    if ((counts['Suspicious Link'] || 0) > 0) {
      hasHigh = true;
      advisories.push({
        id: 'links',
        category: 'Unverified Links',
        title: 'Contains a shortened, unencrypted, or direct IP link',
        description: 'Shortened or direct-IP URLs conceal true endpoints and frequently front phishing attacks.',
        recommendation: 'Unshorten the link and verify the full domain reputation before sending.',
        severity: 'High'
      });
    }

    if ((counts['Email'] || 0) > 0 || (counts['Phone'] || 0) > 0) {
      advisories.push({
        id: 'contact',
        category: 'Direct Contact Details',
        title: 'Contains direct phone number or personal email',
        description: 'Unprotected contact info posted to shared channels can invite spam or social engineering.',
        recommendation: 'Verify the recipient is authorized to receive direct personal contact records.',
        severity: 'Medium'
      });
    }

    const totalRisks = Object.values(counts).reduce((a, b) => a + b, 0);

    if (hasCritical) {
      return {
        level: 'Unsafe to Send',
        color: 'rose',
        advisories,
        risksCount: totalRisks
      };
    }

    if (hasHigh || advisories.length > 0) {
      return {
        level: 'Review Recommended',
        color: 'amber',
        advisories,
        risksCount: totalRisks
      };
    }

    return {
      level: 'Safe to Send',
      color: 'emerald',
      advisories: [],
      risksCount: 0
    };
  }, [messageText, sanitizedResult]);

  const safeMessage = sanitizedResult?.sanitized_text || messageText;

  const handleCopy = () => {
    if (!safeMessage) return;
    navigator.clipboard.writeText(safeMessage);
    setIsCopied(true);
    addToast('Safe sanitized message copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const loadExample = (type: 'risky' | 'payment' | 'clean') => {
    if (type === 'risky') {
      onChangeMessageText(
        "Hi team, your OTP is 894102 for verifying your account. The password is TempPass2026! Login at bit.ly/corp-auth to approve the update."
      );
    } else if (type === 'payment') {
      onChangeMessageText(
        "Please send the refund to my UPI id rahul.mehta@okaxis or transfer via IFSC SBIN0001234. Card on file was 4539 1488 0343 6467. Mobile: +91 98201 45982"
      );
    } else {
      onChangeMessageText(
        "Hi Priya, following up on our discussion yesterday. Looking forward to reviewing the project documentation during our team sync tomorrow at 3 PM."
      );
    }
  };

  const modes: Array<{ id: RedactionMode; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'full', label: 'Full Redaction', icon: EyeOff },
    { id: 'partial', label: 'Partial Mask', icon: Eye },
    { id: 'pseudonym', label: 'Consistent Pseudonyms', icon: Shuffle }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Message Safety Guard</h2>
            <p className="text-xs text-slate-500">
              Inspect messages, emails, customer replies, or AI prompts for accidental leaks before hitting send.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
          <span className="text-xs text-slate-400 font-medium">Quick Examples:</span>
          <button
            onClick={() => loadExample('risky')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            OTP & Password
          </button>
          <button
            onClick={() => loadExample('payment')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            UPI & Card
          </button>
          <button
            onClick={() => loadExample('clean')}
            className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Clean Text
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[560px] overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Original Message Draft</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={onPasteClipboard}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <ClipboardPaste className="w-3.5 h-3.5 text-slate-500" />
                <span>Paste</span>
              </button>
              {messageText && (
                <button
                  onClick={onClearMessage}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                  title="Clear message"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            <textarea
              value={messageText}
              onChange={(e) => onChangeMessageText(e.target.value)}
              placeholder="Paste or write a message before sending (Slack note, customer email, support reply, or prompt for an external AI)..."
              className="flex-1 w-full p-3 bg-slate-50/50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white resize-none font-sans leading-relaxed"
              spellCheck={false}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
              <span>{messageText.length} characters</span>
              <span>Local client-side evaluation (0 bytes sent)</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className={`p-4 rounded-xl border shadow-xs transition-colors ${
            verdict.color === 'rose'
              ? 'bg-rose-50/70 border-rose-200 text-rose-950'
              : verdict.color === 'amber'
              ? 'bg-amber-50/70 border-amber-200 text-amber-950'
              : 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {verdict.color === 'rose' ? (
                  <div className="w-9 h-9 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 flex-shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                ) : verdict.color === 'amber' ? (
                  <div className="w-9 h-9 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                      SAFETY VERDICT
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      verdict.color === 'rose'
                        ? 'bg-rose-200 text-rose-900'
                        : verdict.color === 'amber'
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-emerald-200 text-emerald-900'
                    }`}>
                      {verdict.level}
                    </span>
                  </div>
                  <p className="text-xs font-medium mt-0.5">
                    {verdict.risksCount === 0
                      ? 'No sensitive credentials, passwords, or PII detected in this message.'
                      : `Found ${verdict.risksCount} potential security risk${verdict.risksCount > 1 ? 's' : ''} in this message.`}
                  </p>
                </div>
              </div>
            </div>

            {verdict.advisories.length > 0 && (
              <div className="mt-3 space-y-2 max-h-44 overflow-y-auto pr-1">
                {verdict.advisories.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-2.5 rounded-lg bg-white/90 border border-slate-200 text-xs shadow-2xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900">{adv.title}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        adv.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : adv.severity === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {adv.severity}
                      </span>
                    </div>
                    <p className="text-slate-600 mb-1 leading-snug">{adv.description}</p>
                    <p className="text-slate-800 font-medium text-[11px] flex items-center gap-1">
                      <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                      <span>{adv.recommendation}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex-1 flex flex-col overflow-hidden min-h-[300px]">
            <div className="px-4 py-2.5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-900">Safe Version Ready to Send</span>
              </div>

              <div className="flex items-center gap-1">
                <div className="inline-flex p-0.5 bg-slate-200/70 rounded-lg">
                  {modes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onChangeRedactionMode(m.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        redactionMode === m.id
                          ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 flex flex-col">
              <div className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-sans leading-relaxed whitespace-pre-wrap overflow-y-auto">
                {safeMessage || (
                  <span className="text-slate-400 italic">
                    Sanitized message will render here automatically...
                  </span>
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {verdict.risksCount > 0 ? 'All detected risks safely masked' : 'Original text verified safe'}
                </span>

                <button
                  onClick={handleCopy}
                  disabled={!safeMessage.trim()}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-all cursor-pointer"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-white" />
                      <span>Copy Safe Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
