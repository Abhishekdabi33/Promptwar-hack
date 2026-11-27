import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  X,
  CreditCard,
  Fingerprint,
  FileBadge,
  Mail,
  Phone,
  Network,
  KeyRound,
  Sparkles
} from 'lucide-react';
import { SanitizationResult, EntityCategory, PIIMatch } from '../types';

interface TelemetryDashboardProps {
  result: SanitizationResult | null;
  selectedCategory: EntityCategory | null;
  onSelectCategory: (cat: EntityCategory | null) => void;
  currentEntityIndex: number;
  onNavigateEntity: (dir: 'prev' | 'next') => void;
  filteredMatches: PIIMatch[];
}

export default function TelemetryDashboard({
  result,
  selectedCategory,
  onSelectCategory,
  currentEntityIndex,
  onNavigateEntity,
  filteredMatches
}: TelemetryDashboardProps) {
  const [trapModalOpen, setTrapModalOpen] = useState(false);

  const riskScore = result?.risk_score ?? 0;
  const riskTier = result?.risk_tier || 'Low';
  const compliance = result?.compliance_frameworks || [];
  const entityCounts = result?.entity_counts || {};
  const activeCount = result?.active_matches_count || 0;
  const rejectedCount = result?.rejected_traps_count || 0;
  const rejectedTraps = result?.rejected_traps || [];

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Critical': return { stroke: '#E11D48', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
      case 'High': return { stroke: '#EA580C', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'Medium': return { stroke: '#D97706', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      default: return { stroke: '#10B981', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }
  };

  const tierColors = getTierColor(riskTier);

  const categories: Array<{
    key: EntityCategory;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
  }> = [
    { key: 'Credit Card', label: 'Cards', icon: CreditCard, color: 'border-rose-300 bg-rose-50/70 text-rose-800' },
    { key: 'Aadhaar', label: 'Aadhaar', icon: Fingerprint, color: 'border-indigo-300 bg-indigo-50/70 text-indigo-800' },
    { key: 'PAN', label: 'PAN', icon: FileBadge, color: 'border-purple-300 bg-purple-50/70 text-purple-800' },
    { key: 'Email', label: 'Email', icon: Mail, color: 'border-blue-300 bg-blue-50/70 text-blue-800' },
    { key: 'Phone', label: 'Phone', icon: Phone, color: 'border-cyan-300 bg-cyan-50/70 text-cyan-800' },
    { key: 'IPv4', label: 'IPv4', icon: Network, color: 'border-amber-300 bg-amber-50/70 text-amber-800' },
    { key: 'Secret Token', label: 'Secrets', icon: KeyRound, color: 'border-orange-300 bg-orange-50/70 text-orange-800' },
    { key: 'Custom', label: 'Custom', icon: Sparkles, color: 'border-teal-300 bg-teal-50/70 text-teal-800' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs mb-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-center">
        <div className="lg:col-span-4 flex items-center gap-3.5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-2.5 lg:pb-0 lg:pr-3.5">
          <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="#F1F5F9"
                strokeWidth="7"
                fill="none"
              />
              <motion.circle
                cx="48"
                cy="48"
                r={radius}
                stroke={tierColors.stroke}
                strokeWidth="7"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
                {riskScore}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                Risk Score
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Threat:
              </span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${tierColors.bg} ${tierColors.text} border ${tierColors.border}`}>
                {riskTier} Severity
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mt-1.5">
              {['India DPDP Act', 'PCI-DSS', 'GDPR'].map((fw) => {
                const active = compliance.includes(fw);
                return (
                  <span
                    key={fw}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-100 line-through opacity-60'
                    }`}
                  >
                    {active ? <CheckCircle2 className="w-2.5 h-2.5 text-blue-600" /> : null}
                    {fw}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-700">Detected PII Categories</span>
              <span className="text-[11px] text-slate-400 font-medium">
                ({activeCount} active {activeCount === 1 ? 'match' : 'matches'})
              </span>
            </div>

            <button
              onClick={() => setTrapModalOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
              title="Click to view all rejected false-positive traps"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Traps Safely Ignored:</span>
              <span className="px-1.5 py-0.2 bg-emerald-200/80 rounded-full text-[10px] font-bold text-emerald-900">
                {rejectedCount}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const count = entityCounts[cat.key] || 0;
              const isSelected = selectedCategory === cat.key;
              const Icon = cat.icon;

              return (
                <button
                  key={cat.key}
                  onClick={() => onSelectCategory(isSelected ? null : cat.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    count > 0
                      ? isSelected
                        ? 'ring-2 ring-indigo-500 shadow-2xs bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                        : `${cat.color} hover:brightness-95 cursor-pointer`
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 cursor-default opacity-50'
                  }`}
                  disabled={count === 0}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                    count > 0 ? 'bg-white/90 shadow-2xs text-slate-900' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedCategory && filteredMatches.length > 0 && (
            <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 rounded-lg px-3 py-1.5 mt-0.5">
              <div className="flex items-center gap-2 text-xs text-indigo-950 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>Category: <strong>{selectedCategory}</strong></span>
                <span className="text-indigo-600 font-semibold text-[11px]">
                  (Match {currentEntityIndex + 1} of {filteredMatches.length})
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => onNavigateEntity('prev')}
                  className="p-1 rounded bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors"
                  title="Previous match"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateEntity('next')}
                  className="p-1 rounded bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors"
                  title="Next match"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onSelectCategory(null)}
                  className="p-1 rounded hover:bg-indigo-200/60 text-indigo-700 transition-colors ml-1"
                  title="Clear filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {trapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm">Algorithmic Traps Safely Rejected</h3>
              </div>
              <button
                onClick={() => setTrapModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 my-2.5 leading-relaxed">
              PII Shield implements strict algorithmic verification (Luhn Mod-10, Verhoeff Checksum, and IPv4 0-255 octet bounds). The following items resemble PII formats but were mathematically proven to be random tracking serials, invoice IDs, or build version tags and were <strong>safely preserved without false-positive redaction</strong>:
            </p>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl my-2.5">
              {rejectedTraps.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No false-positive lookalikes in active document.
                </div>
              ) : (
                rejectedTraps.map((trap, idx) => (
                  <div key={idx} className="p-2.5 text-xs bg-slate-50/50 hover:bg-slate-50">
                    <div className="flex items-center justify-between font-mono font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-200 font-sans font-semibold text-slate-700">
                          {trap.type || 'Lookalike'}
                        </span>
                        <span className="text-rose-800">{trap.value}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-sans">Line {trap.line}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium mt-1">
                      ✓ {trap.reason}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                onClick={() => setTrapModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
