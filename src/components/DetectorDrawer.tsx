import React, { useState, useEffect } from 'react';
import { 
  X, 
  SlidersHorizontal, 
  Plus, 
  CreditCard, 
  Fingerprint, 
  FileBadge, 
  Mail, 
  Phone, 
  Network, 
  KeyRound, 
  Sparkles,
  Check
} from 'lucide-react';
import { CustomRule } from '../types';

interface DetectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  enabledTypes: Set<string>;
  onToggleType: (type: string) => void;
  customRules: CustomRule[];
  onAddCustomRule: (rule: CustomRule) => void;
  onRemoveCustomRule: (id: string) => void;
}

export default function DetectorDrawer({
  isOpen,
  onClose,
  enabledTypes,
  onToggleType,
  customRules,
  onAddCustomRule,
  onRemoveCustomRule
}: DetectorDrawerProps) {
  const [ruleInput, setRuleInput] = useState('');
  const [ruleType, setRuleType] = useState<'keyword' | 'regex'>('keyword');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const detectors = [
    {
      key: 'Credit Card',
      label: 'Credit & Debit Cards',
      desc: 'Luhn Mod-10 Checksum with issuer prefix validation',
      icon: CreditCard,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      key: 'Aadhaar',
      label: 'Indian Aadhaar (12-Digit)',
      desc: 'Verhoeff Dihedral Group algorithm validation',
      icon: Fingerprint,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200'
    },
    {
      key: 'PAN',
      label: 'Indian Income Tax PAN',
      desc: 'DPDP entity code verification (Individual, Corporate)',
      icon: FileBadge,
      color: 'text-purple-600 bg-purple-50 border-purple-200'
    },
    {
      key: 'Email',
      label: 'Email Addresses',
      desc: 'Standard RFC 5322 mailbox formatting',
      icon: Mail,
      color: 'text-blue-600 bg-blue-50 border-blue-200'
    },
    {
      key: 'Phone',
      label: 'Phone Numbers',
      desc: 'E.164 telephony formats including +1 and +91',
      icon: Phone,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-200'
    },
    {
      key: 'IPv4',
      label: 'IPv4 Addresses',
      desc: 'Strict 4-octet numeric boundary [0-255]',
      icon: Network,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      key: 'Secret Token',
      label: 'High-Entropy Secrets & Keys',
      desc: 'Shannon entropy analysis (>= 3.2 bits/char) & bearer tokens',
      icon: KeyRound,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      key: 'OTP',
      label: 'One-Time Passcodes & PINs',
      desc: '4-8 digit security verification codes and PINs',
      icon: KeyRound,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      key: 'Password',
      label: 'Plaintext Passwords',
      desc: 'Contextual credential assignments (password=, pwd:, passcode:)',
      icon: KeyRound,
      color: 'text-rose-600 bg-rose-50 border-rose-200'
    },
    {
      key: 'Financial',
      label: 'UPI IDs & IFSC Codes',
      desc: 'Indian bank branch routing codes and UPI handles',
      icon: CreditCard,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      key: 'Suspicious Link',
      label: 'Shortened & Direct-IP Links',
      desc: 'bit.ly, tinyurl, raw IP addresses, and unencrypted login links',
      icon: Network,
      color: 'text-amber-600 bg-amber-50 border-amber-200'
    },
    {
      key: 'Custom',
      label: 'Custom Rules & Terms',
      desc: 'User-specified exact keywords and regular expressions',
      icon: Sparkles,
      color: 'text-slate-600 bg-slate-50 border-slate-200'
    }
  ];

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleInput.trim()) return;
    onAddCustomRule({
      id: `rule_${Date.now()}`,
      type: ruleType,
      value: ruleInput.trim()
    });
    setRuleInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/25 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div 
        className="relative w-full sm:w-[440px] h-full bg-white/95 backdrop-blur-2xl border-l border-white/90 shadow-2xl z-10 flex flex-col animate-in slide-in-from-right duration-200 ring-1 ring-slate-200/80"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/80 via-white to-indigo-50/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Detectors & Custom Rules
              </h3>
              <p className="text-[11px] text-slate-500">
                {enabledTypes.size} of {detectors.length} active engines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close detectors and rules drawer"
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Active Python Detection Engines
            </div>
            <div className="space-y-2">
              {detectors.map((d) => {
                const isActive = enabledTypes.has(d.key);
                const Icon = d.icon;
                return (
                  <div
                    key={d.key}
                    onClick={() => onToggleType(d.key)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-white border-slate-200 shadow-2xs ring-1 ring-indigo-500/10'
                        : 'bg-slate-50/60 border-slate-200/70 opacity-60 hover:opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5 ${d.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900">{d.label}</div>
                        <div className="text-[11px] text-slate-500 truncate">{d.desc}</div>
                      </div>
                    </div>
                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors flex-shrink-0 ${isActive ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Add Custom Redaction Rule
            </div>

            <form onSubmit={handleAddRule} className="space-y-2">
              <div className="flex gap-2">
                <select
                  value={ruleType}
                  onChange={(e) => setRuleType(e.target.value as 'keyword' | 'regex')}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 font-semibold focus:outline-hidden"
                >
                  <option value="keyword">Keyword</option>
                  <option value="regex">Regex</option>
                </select>
                <input
                  type="text"
                  value={ruleInput}
                  onChange={(e) => setRuleInput(e.target.value)}
                  placeholder={ruleType === 'keyword' ? 'e.g. Confidential Project Alpha' : 'e.g. [A-Z]{3}-\\d{6}'}
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-hidden font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Custom Rule</span>
              </button>
            </form>

            {customRules.length > 0 && (
              <div className="mt-3 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Configured Rules ({customRules.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {customRules.map((r) => (
                    <span
                      key={r.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono bg-teal-50 border border-teal-200 text-teal-800 shadow-2xs"
                    >
                      <span className="text-[10px] font-bold uppercase text-teal-600">[{r.type}]</span>
                      <span>{r.value}</span>
                      <button
                        onClick={() => onRemoveCustomRule(r.id)}
                        className="p-0.5 hover:bg-teal-200 rounded-full text-teal-600 hover:text-teal-900 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center">
          <span className="text-xs text-slate-400">
            Rules apply in real time
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
}
