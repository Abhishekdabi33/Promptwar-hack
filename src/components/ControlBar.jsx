import React, { useState } from 'react';
import { 
  EyeOff, 
  Eye, 
  Shuffle, 
  Plus, 
  X, 
  SlidersHorizontal,
  Flame,
  Binary
} from 'lucide-react';

export default function ControlBar({
  redactionMode,
  onChangeRedactionMode,
  enabledTypes,
  onToggleType,
  customRules,
  onAddCustomRule,
  onRemoveCustomRule
}) {
  const [ruleInput, setRuleInput] = useState('');
  const [ruleType, setRuleType] = useState('keyword');

  const modes = [
    {
      id: 'full',
      label: 'Full Mask',
      desc: '[REDACTED_CARD]',
      icon: EyeOff
    },
    {
      id: 'partial',
      label: 'Partial Mask',
      desc: 'XXXX-XXXX-1234',
      icon: Eye
    },
    {
      id: 'pseudonym',
      label: 'Consistent Pseudonym',
      desc: 'EMAIL_01, CARD_01',
      icon: Shuffle
    }
  ];

  const detectorToggles = [
    { key: 'Credit Card', label: 'Credit Card (Luhn)' },
    { key: 'Aadhaar', label: '12-Digit Aadhaar (Verhoeff)' },
    { key: 'PAN', label: 'Indian PAN' },
    { key: 'Email', label: 'Email' },
    { key: 'Phone', label: 'Phone' },
    { key: 'IPv4', label: 'IPv4' },
    { key: 'Secret Token', label: 'Shannon Secrets', icon: Binary },
    { key: 'Custom', label: 'Custom Rules' }
  ];

  const handleAddRule = (e) => {
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
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-4 border-b border-slate-100">
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Redaction Policy Mode
          </span>
          <div className="inline-flex p-1 bg-slate-100/80 rounded-xl border border-slate-200">
            {modes.map((m) => {
              const active = redactionMode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => onChangeRedactionMode(m.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    active
                      ? 'bg-white text-indigo-700 font-semibold shadow-xs border border-slate-200/80'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                  <span className="hidden sm:inline text-[10px] text-slate-400 font-mono">
                    ({m.desc})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Active Python Detectors
          </span>
          <div className="flex flex-wrap gap-1.5">
            {detectorToggles.map((d) => {
              const active = enabledTypes.has(d.key);
              return (
                <button
                  key={d.key}
                  onClick={() => onToggleType(d.key)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                    active
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-600' : 'bg-slate-400'}`}></span>
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleAddRule} className="flex items-center gap-2 flex-1 max-w-md">
          <select
            value={ruleType}
            onChange={(e) => setRuleType(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            <option value="keyword">Keyword</option>
            <option value="regex">Regex</option>
          </select>

          <input
            type="text"
            value={ruleInput}
            onChange={(e) => setRuleInput(e.target.value)}
            placeholder={ruleType === 'keyword' ? 'e.g. Confidential Project Apex' : 'e.g. [A-Z]{3}-\\d{6}'}
            className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
          />

          <button
            type="submit"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Rule</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-1.5">
          {customRules.length === 0 ? (
            <span className="text-[11px] text-slate-400 italic">No custom rules active</span>
          ) : (
            customRules.map((rule) => (
              <span
                key={rule.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-teal-50 text-teal-800 border border-teal-200"
              >
                <span className="text-[10px] font-sans font-bold text-teal-600 uppercase">
                  {rule.type}:
                </span>
                <span>{rule.value}</span>
                <button
                  type="button"
                  onClick={() => onRemoveCustomRule(rule.id)}
                  className="p-0.5 hover:bg-teal-200/60 rounded-full text-teal-700"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
