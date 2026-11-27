import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
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

export default function TelemetryDashboard({
  result,
  selectedCategory,
  onSelectCategory,
  currentEntityIndex,
  onNavigateEntity,
  filteredMatches
}) {
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

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Critical': return { stroke: '#E11D48', text: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' };
      case 'High': return { stroke: '#EA580C', text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' };
      case 'Medium': return { stroke: '#D97706', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      default: return { stroke: '#10B981', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
    }
  };

  const tierColors = getTierColor(riskTier);

  const categories = [
    { key: 'Credit Card', label: 'Credit Cards', icon: CreditCard, color: 'border-rose-300 bg-rose-50/70 text-rose-800' },
    { key: 'Aadhaar', label: '12-Digit Aadhaar', icon: Fingerprint, color: 'border-indigo-300 bg-indigo-50/70 text-indigo-800' },
    { key: 'PAN', label: 'Income Tax PAN', icon: FileBadge, color: 'border-purple-300 bg-purple-50/70 text-purple-800' },
    { key: 'Email', label: 'Email Addresses', icon: Mail, color: 'border-blue-300 bg-blue-50/70 text-blue-800' },
    { key: 'Phone', label: 'Phone Numbers', icon: Phone, color: 'border-cyan-300 bg-cyan-50/70 text-cyan-800' },
    { key: 'IPv4', label: 'IPv4 Addresses', icon: Network, color: 'border-amber-300 bg-amber-50/70 text-amber-800' },
    { key: 'Secret Token', label: 'Secrets & Keys', icon: KeyRound, color: 'border-orange-300 bg-orange-50/70 text-orange-800' },
    { key: 'Custom', label: 'Custom Rules', icon: Sparkles, color: 'border-teal-300 bg-teal-50/70 text-teal-800' }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        <div className="lg:col-span-4 flex items-center gap-5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-5">
          <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke="#F1F5F9"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r={radius}
                stroke={tierColors.stroke}
                strokeWidth="8"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                {riskScore}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                Risk Score
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Threat Posture
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${tierColors.bg} ${tierColors.text} border ${tierColors.border}`}>
                {riskTier} Severity
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-2">
              {['India DPDP Act', 'PCI-DSS', 'GDPR'].map((fw) => {
                const active = compliance.includes(fw);
                return (
                  <span
                    key={fw}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-slate-50 text-slate-400 border border-slate-100 line-through opacity-70'
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

        <div className="lg:col-span-8 flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">Detected PII Categories:</span>
              <span className="text-xs text-slate-500">
                ({activeCount} total active {activeCount === 1 ? 'match' : 'matches'})
              </span>
            </div>

            <button
              onClick={() => setTrapModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Traps Safely Ignored:</span>
              <span className="px-1.5 py-0.2 bg-emerald-200/80 rounded-full text-[11px] font-bold text-emerald-900">
                {rejectedCount}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const count = entityCounts[cat.key] || 0;
              const isSelected = selectedCategory === cat.key;
              const Icon = cat.icon;

              return (
                <button
                  key={cat.key}
                  onClick={() => onSelectCategory(isSelected ? null : cat.key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    count > 0
                      ? isSelected
                        ? 'ring-2 ring-indigo-500 shadow-sm bg-indigo-50 border-indigo-300 text-indigo-900'
                        : `${cat.color} hover:brightness-95`
                      : 'border-slate-100 bg-slate-50/50 text-slate-400 cursor-default opacity-60'
                  }`}
                  disabled={count === 0}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  <span className={`ml-0.5 px-1.5 py-0.2 text-[10px] font-bold rounded-full ${
                    count > 0 ? 'bg-white/80 shadow-2xs text-slate-900' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedCategory && filteredMatches.length > 0 && (
            <div className="flex items-center justify-between bg-indigo-50/70 border border-indigo-200/80 rounded-xl px-3.5 py-2 mt-1 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs text-indigo-950 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
                <span>Active Filter: <strong>{selectedCategory}</strong></span>
                <span className="text-indigo-600 font-semibold">
                  (Match {currentEntityIndex + 1} of {filteredMatches.length})
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onNavigateEntity('prev')}
                  className="p-1 rounded bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors"
                  title="Previous match"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigateEntity('next')}
                  className="p-1 rounded bg-white hover:bg-indigo-100 text-indigo-800 border border-indigo-200 transition-colors"
                  title="Next match"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectCategory(null)}
                  className="p-1 rounded hover:bg-indigo-200/60 text-indigo-700 transition-colors ml-1"
                  title="Clear filter"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {trapModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base">Algorithmic Traps Safely Rejected</h3>
              </div>
              <button
                onClick={() => setTrapModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 my-3 leading-relaxed">
              PII Shield implements strict algorithmic verification (Luhn Mod-10, Verhoeff Checksum, and IPv4 0-255 octet bounds). The following items resemble PII formats but were mathematically proven to be random tracking serials, invoice IDs, or build version tags and were <strong>safely preserved without false-positive redaction</strong>:
            </p>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl my-3">
              {rejectedTraps.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No false-positive traps encountered in the active document.
                </div>
              ) : (
                rejectedTraps.map((trap, idx) => (
                  <div key={idx} className="p-3 text-xs bg-slate-50/50 hover:bg-slate-50">
                    <div className="flex items-center justify-between font-mono font-medium text-slate-800">
                      <span>{trap.value}</span>
                      <span className="text-[10px] text-slate-400 font-sans">Line {trap.line}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-medium mt-1">
                      ✓ {trap.reason}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setTrapModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
