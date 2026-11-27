import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard,
  Fingerprint,
  FileBadge,
  Mail,
  Phone,
  Network,
  KeyRound,
  Sparkles,
  X
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
  onSelectCategory
}: TelemetryDashboardProps) {
  const [trapModalOpen, setTrapModalOpen] = useState(false);

  const riskScore = result?.risk_score ?? 0;
  const riskTier = result?.risk_tier || 'Low';
  const compliance = result?.compliance_frameworks || [];
  const entityCounts = result?.entity_counts || {};
  const activeCount = result?.active_matches_count || 0;
  const rejectedCount = result?.rejected_traps_count || 0;
  const rejectedTraps = result?.rejected_traps || [];

  const radius = 38;
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
    { key: 'Credit Card', label: 'Cards', icon: CreditCard, color: 'border-rose-300 bg-rose-50 text-rose-800' },
    { key: 'Aadhaar', label: 'Aadhaar', icon: Fingerprint, color: 'border-indigo-300 bg-indigo-50 text-indigo-800' },
    { key: 'PAN', label: 'PAN', icon: FileBadge, color: 'border-purple-300 bg-purple-50 text-purple-800' },
    { key: 'Email', label: 'Email', icon: Mail, color: 'border-blue-300 bg-blue-50 text-blue-800' },
    { key: 'Phone', label: 'Phone', icon: Phone, color: 'border-cyan-300 bg-cyan-50 text-cyan-800' },
    { key: 'IPv4', label: 'IPv4', icon: Network, color: 'border-amber-300 bg-amber-50 text-amber-800' },
    { key: 'Secret Token', label: 'Secrets', icon: KeyRound, color: 'border-orange-300 bg-orange-50 text-orange-800' },
    { key: 'Custom', label: 'Custom', icon: Sparkles, color: 'border-teal-300 bg-teal-50 text-teal-800' }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 px-3.5 py-2 shadow-2xs mb-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative w-14 h-14 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke="#F1F5F9"
                strokeWidth="6"
                fill="none"
              />
              <motion.circle
                cx="48"
                cy="48"
                r={radius}
                stroke={tierColors.stroke}
                strokeWidth="6"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-0.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900 leading-none">
                {riskScore}
              </span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 whitespace-nowrap">
                RISK SCORE
              </span>
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Threat:
              </span>
              <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${tierColors.bg} ${tierColors.text} border ${tierColors.border} whitespace-nowrap`}>
                {riskTier} Severity
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {['India DPDP Act', 'PCI-DSS', 'GDPR'].map((fw) => {
                const active = compliance.includes(fw);
                return (
                  <span
                    key={fw}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-semibold whitespace-nowrap ${
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

        <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            {categories.map((cat) => {
              const count = entityCounts[cat.key] || 0;
              const isSelected = selectedCategory === cat.key;
              const Icon = cat.icon;

              return (
                <button
                  key={cat.key}
                  onClick={() => onSelectCategory(isSelected ? null : cat.key)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-all cursor-pointer whitespace-nowrap ${
                    count > 0
                      ? isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-bold'
                        : `${cat.color} hover:brightness-95`
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-50'
                  }`}
                  title={`${cat.label}: ${count} active match${count === 1 ? '' : 'es'}`}
                >
                  <Icon className="w-3 h-3 flex-shrink-0" />
                  <span>{cat.label}</span>
                  <span className={`ml-0.5 px-1 py-0.2 rounded-full text-[9px] font-bold ${
                    isSelected ? 'bg-white/20 text-white' : count > 0 ? 'bg-black/10' : 'bg-slate-200'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setTrapModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer whitespace-nowrap"
            title="Click to view all rejected false-positive traps"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Traps Ignored:</span>
            <span className="px-1.5 py-0.2 bg-emerald-200/80 rounded-full text-[10px] font-bold text-emerald-900">
              {rejectedCount}
            </span>
          </button>
        </div>
      </div>

      {trapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-emerald-50/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Traps Safely Ignored ({rejectedTraps.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Candidate tokens safely rejected by algorithm checksums & DPDP rules
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTrapModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[360px] overflow-y-auto space-y-2.5 divide-y divide-slate-100">
              {rejectedTraps.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs font-medium">
                  No false-positive candidate traps detected in this document stream.
                </div>
              ) : (
                rejectedTraps.map((trap, idx) => (
                  <div key={idx} className="pt-2.5 first:pt-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {trap.value}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                          {trap.type}
                        </span>
                        {trap.line && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Line {trap.line}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium pl-1">
                      ✓ {trap.reason}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs">
              <span className="text-slate-500">
                Luhn • Verhoeff • Octet [0-255] • Entity Codes
              </span>
              <button
                onClick={() => setTrapModalOpen(false)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition-colors cursor-pointer"
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
