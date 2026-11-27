import React, { useState } from 'react';
import { 
  EyeOff, 
  Eye, 
  Shuffle, 
  Plus, 
  X, 
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Binary
} from 'lucide-react';
import { RedactionMode, CustomRule } from '../types';

interface ControlBarProps {
  redactionMode: RedactionMode;
  onChangeRedactionMode: (mode: RedactionMode) => void;
  enabledTypes: Set<string>;
  onToggleType: (type: string) => void;
  customRules: CustomRule[];
  onAddCustomRule: (rule: CustomRule) => void;
  onRemoveCustomRule: (id: string) => void;
}

export default function ControlBar({
  redactionMode,
  onChangeRedactionMode,
  enabledTypes,
  onToggleType,
  customRules,
  onAddCustomRule,
  onRemoveCustomRule
}: ControlBarProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [ruleInput, setRuleInput] = useState('');
  const [ruleType, setRuleType] = useState<'keyword' | 'regex'>('keyword');

  const modes: Array<{
    id: RedactionMode;
    label: string;
    desc: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
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
    { key: 'Aadhaar', label: 'Aadhaar (Verhoeff)' },
    { key: 'PAN', label: 'Indian PAN' },
    { key: 'Email', label: 'Email' },
    { key: 'Phone', label: 'Phone' },
    { key: 'IPv4', label: 'IPv4' },
    { key: 'Secret Token', label: 'Shannon Secrets', icon: Binary },
    { key: 'Custom', label: 'Custom Rules' }
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
    <div className="bg-white rounded-xl border border-slate-200 px-3.5 py-2 shadow-2xs mb-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline whitespace-nowrap">
            MODE:
          </span>
          <div className="inline-flex p-0.5 bg-slate-100/90 rounded-lg border border-slate-200 gap-1 flex-wrap sm:flex-nowrap">
            {modes.map((m) => {
              const active = redactionMode === m.id;
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  onClick={() => onChangeRedactionMode(m.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-left transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-white text-indigo-900 shadow-2xs border border-slate-200/90 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  <span className="text-xs">{m.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono hidden md:inline">
                    ({m.desc})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer whitespace-nowrap ${
            drawerOpen
              ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
          <span>Detectors & Rules ({enabledTypes.size}/8 active, {customRules.length} custom)</span>
          {drawerOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {drawerOpen && (
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex flex-col gap-2.5 animate-in fade-in duration-150">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
              Detectors:
            </span>
            {detectorToggles.map((d) => {
              const active = enabledTypes.has(d.key);
              return (
                <button
                  key={d.key}
                  onClick={() => onToggleType(d.key)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-indigo-600' : 'bg-slate-400'}`} />
                  <span>{d.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-slate-100/70">
            <form onSubmit={handleAddRule} className="flex items-center gap-1.5 flex-1 max-w-md">
              <select
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value as 'keyword' | 'regex')}
                className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium focus:outline-hidden"
              >
                <option value="keyword">Keyword</option>
                <option value="regex">Regex</option>
              </select>

              <input
                type="text"
                value={ruleInput}
                onChange={(e) => setRuleInput(e.target.value)}
                placeholder={ruleType === 'keyword' ? 'e.g. Confidential Project Alpha' : 'e.g. [A-Z]{3}-\\d{6}'}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 placeholder-slate-400 focus:outline-hidden font-mono"
              />

              <button
                type="submit"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            {customRules.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {customRules.map((r) => (
                  <span
                    key={r.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono bg-teal-50 border border-teal-200 text-teal-800"
                  >
                    <span>{r.value}</span>
                    <button
                      onClick={() => onRemoveCustomRule(r.id)}
                      className="text-teal-500 hover:text-teal-800 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
