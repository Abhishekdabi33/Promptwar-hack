import React, { useState, useMemo } from 'react';
import { Search, Table, Download, ArrowUpDown } from 'lucide-react';

export default function TablePreview({ matrix = [], onExportCsv }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCol, setSortCol] = useState(null);
  const [sortAsc, setSortAsc] = useState(true);

  const headers = matrix.length > 0 ? matrix[0] : [];
  const rows = matrix.length > 1 ? matrix.slice(1) : [];

  const filteredRows = useMemo(() => {
    let result = rows;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(row => row.some(cell => String(cell).toLowerCase().includes(q)));
    }
    if (sortCol !== null) {
      result = [...result].sort((a, b) => {
        const valA = a[sortCol] || '';
        const valB = b[sortCol] || '';
        return sortAsc ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
      });
    }
    return result;
  }, [rows, searchTerm, sortCol, sortAsc]);

  const handleSort = (colIdx) => {
    if (sortCol === colIdx) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIdx);
      setSortAsc(true);
    }
  };

  if (!matrix || matrix.length === 0) {
    return (
      <div className="p-12 text-center text-slate-400 text-xs">
        No tabular data available for preview.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex items-center gap-2">
          <Table className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">
            Sanitized Table View ({filteredRows.length} rows, {headers.length} columns)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search table cells..."
              className="pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 w-44"
            />
          </div>

          {onExportCsv && (
            <button
              onClick={onExportCsv}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3 h-3 text-slate-500" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto max-h-[500px]">
        <table className="w-full text-left text-xs text-slate-700 border-collapse">
          <thead className="sticky top-0 bg-slate-100/90 backdrop-blur-xs text-slate-800 font-semibold border-b border-slate-200 z-10">
            <tr>
              <th className="px-3 py-2 text-[10px] text-slate-400 font-mono w-12 border-r border-slate-200 text-center">
                #
              </th>
              {headers.map((h, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(idx)}
                  className="px-3 py-2 cursor-pointer hover:bg-slate-200/70 border-r border-slate-200 select-none whitespace-nowrap"
                >
                  <div className="flex items-center gap-1.5">
                    <span>{h || `Col ${idx + 1}`}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {filteredRows.map((row, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-3 py-1.5 text-[10px] text-slate-400 text-center bg-slate-50/40 border-r border-slate-200">
                  {rIdx + 1}
                </td>
                {headers.map((_, cIdx) => {
                  const val = row[cIdx] !== undefined ? String(row[cIdx]) : '';
                  const isRedacted = val.includes('[REDACTED') || /_0\d/.test(val) || val.includes('XXXX-');
                  return (
                    <td
                      key={cIdx}
                      className={`px-3 py-1.5 border-r border-slate-100 max-w-xs truncate ${
                        isRedacted ? 'bg-indigo-50/30 text-indigo-900 font-semibold' : ''
                      }`}
                    >
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
