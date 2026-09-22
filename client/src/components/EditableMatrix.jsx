import React from 'react';

/**
 * EditableMatrix — Reusable editable matrix component.
 * 
 * Props:
 *   label       - string: Title shown above the matrix
 *   color       - 'indigo' | 'blue' | 'rose' | 'amber' | 'emerald' — colour theme
 *   processes   - string[]: Row headers (e.g. ['P0','P1','P2'])
 *   resources   - string[]: Column headers (e.g. ['R1','R2','R3'])
 *   matrix      - number[][]: The 2D matrix data (processes × resources)
 *   onChange    - (rowIdx, colIdx, newValue) => void: called when a cell changes
 *   readOnly    - bool (optional): if true, cells are not editable
 */
const THEMES = {
  indigo: { header: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'text-indigo-700', input: 'focus:border-indigo-500 focus:ring-indigo-200' },
  blue:   { header: 'bg-blue-50 text-blue-700 border-blue-200',       label: 'text-blue-700',   input: 'focus:border-blue-500 focus:ring-blue-200'   },
  rose:   { header: 'bg-rose-50 text-rose-700 border-rose-200',       label: 'text-rose-700',   input: 'focus:border-rose-500 focus:ring-rose-200'   },
  amber:  { header: 'bg-amber-50 text-amber-700 border-amber-200',    label: 'text-amber-700',  input: 'focus:border-amber-500 focus:ring-amber-200' },
  emerald:{ header: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'text-emerald-700', input: 'focus:border-emerald-500 focus:ring-emerald-200' },
};

const EditableMatrix = ({ label, color = 'indigo', processes = [], resources = [], matrix = [], onChange, readOnly = false }) => {
  const theme = THEMES[color] || THEMES.indigo;

  if (!processes.length || !resources.length) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs text-slate-400 italic text-center">
        No processes or resources loaded yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Label */}
      <div className={`px-4 py-2.5 border-b ${theme.header} font-extrabold text-xs uppercase tracking-wider`}>
        {label}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-4 py-2 text-left text-slate-500 font-bold w-16">Process</th>
              {resources.map((r) => (
                <th key={r} className={`px-3 py-2 text-center font-extrabold ${theme.label} min-w-[60px]`}>
                  {r}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processes.map((p, rowIdx) => (
              <tr key={p} className="hover:bg-slate-50/60 transition-colors">
                <td className={`px-4 py-2 font-extrabold ${theme.label}`}>{p}</td>
                {resources.map((_, colIdx) => {
                  const val = matrix[rowIdx]?.[colIdx] ?? 0;
                  return (
                    <td key={colIdx} className="px-2 py-1.5 text-center">
                      {readOnly ? (
                        <span className="font-bold text-slate-700">{val}</span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          value={val}
                          onChange={(e) => onChange && onChange(rowIdx, colIdx, parseInt(e.target.value) || 0)}
                          className={`w-14 text-center bg-slate-50 border border-slate-200 rounded-lg px-1 py-1 text-slate-800 font-bold focus:outline-none focus:ring-2 transition-all ${theme.input}`}
                        />
                      )}
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
};

export default EditableMatrix;
