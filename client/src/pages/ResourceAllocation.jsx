import React, { useState } from 'react';
import { Share2, Plus, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ResourceAllocation = () => {
  const { showNotification } = useAuth();

  const [processes, setProcesses] = useState(['P0', 'P1', 'P2']);
  const [resources, setResources] = useState(['R1', 'R2', 'R3']);
  const [available, setAvailable] = useState([1, 1, 0]);

  const [allocation, setAllocation] = useState([
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 0]
  ]);

  const [request, setRequest] = useState([
    [0, 1, 0],
    [1, 0, 1],
    [0, 0, 1]
  ]);

  const handleCellChange = (matrixType, pIdx, rIdx, val) => {
    const numVal = Math.max(0, parseInt(val) || 0);
    if (matrixType === 'allocation') {
      const newAlloc = allocation.map((row, i) =>
        row.map((cell, j) => (i === pIdx && j === rIdx ? numVal : cell))
      );
      setAllocation(newAlloc);
    } else {
      const newReq = request.map((row, i) =>
        row.map((cell, j) => (i === pIdx && j === rIdx ? numVal : cell))
      );
      setRequest(newReq);
    }
  };

  const handleAvailableChange = (rIdx, val) => {
    const numVal = Math.max(0, parseInt(val) || 0);
    const newAvail = [...available];
    newAvail[rIdx] = numVal;
    setAvailable(newAvail);
  };

  const addProcessRow = () => {
    const pName = `P${processes.length}`;
    setProcesses([...processes, pName]);
    setAllocation([...allocation, new Array(resources.length).fill(0)]);
    setRequest([...request, new Array(resources.length).fill(0)]);
    showNotification(`Added process ${pName}`, 'info');
  };

  const addResourceCol = () => {
    const rName = `R${resources.length + 1}`;
    setResources([...resources, rName]);
    setAvailable([...available, 1]);
    setAllocation(allocation.map(row => [...row, 0]));
    setRequest(request.map(row => [...row, 0]));
    showNotification(`Added resource ${rName}`, 'info');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
              <Share2 className="w-6 h-6" />
            </div>
            <span>Resource Allocation & Matrix Editor</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Easily edit allocation vectors, waiting requests, and available resources in real time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addProcessRow}
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>+ Add Process</span>
          </button>
          <button
            onClick={addResourceCol}
            className="px-4 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-extrabold text-xs border border-purple-200 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4 text-purple-600" />
            <span>+ Add Resource</span>
          </button>
        </div>
      </div>

      {/* Available Vector Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Available Resource Vector [Available[j]]</span>
        </h3>
        <div className="flex flex-wrap gap-4">
          {resources.map((resName, idx) => (
            <div key={resName} className="flex items-center gap-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl px-5 py-3 shadow-xs">
              <span className="font-mono font-black text-sm text-emerald-900">{resName}:</span>
              <input
                type="number"
                min="0"
                value={available[idx]}
                onChange={(e) => handleAvailableChange(idx, e.target.value)}
                className="w-20 bg-white border-2 border-emerald-300 rounded-xl py-2 px-3 text-center text-base font-mono font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Enlarged Matrices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-indigo-700 flex items-center gap-2">
              <span>Allocation Matrix</span>
            </h3>
            <span className="text-xs font-mono text-slate-400 font-bold">[Allocation[i][j]]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600 text-sm">
                <tr>
                  <th className="p-3 text-left font-bold">Process</th>
                  {resources.map(r => (
                    <th key={r} className="p-3 text-indigo-700 font-black text-base">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((proc, pIdx) => (
                  <tr key={proc} className="hover:bg-slate-50/80">
                    <td className="p-3 text-left font-black text-slate-800 text-sm">{proc}</td>
                    {resources.map((res, rIdx) => (
                      <td key={res} className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={allocation[pIdx][rIdx]}
                          onChange={(e) => handleCellChange('allocation', pIdx, rIdx, e.target.value)}
                          className="w-20 bg-indigo-50/50 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl py-2 px-3 text-center text-base font-extrabold text-indigo-900 focus:outline-none focus:bg-white transition-all shadow-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Request Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-amber-700 flex items-center gap-2">
              <span>Request Matrix</span>
            </h3>
            <span className="text-xs font-mono text-slate-400 font-bold">[Request[i][j]]</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead className="bg-slate-50 border-b border-slate-200 font-mono text-slate-600 text-sm">
                <tr>
                  <th className="p-3 text-left font-bold">Process</th>
                  {resources.map(r => (
                    <th key={r} className="p-3 text-amber-700 font-black text-base">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((proc, pIdx) => (
                  <tr key={proc} className="hover:bg-slate-50/80">
                    <td className="p-3 text-left font-black text-slate-800 text-sm">{proc}</td>
                    {resources.map((res, rIdx) => (
                      <td key={res} className="p-2">
                        <input
                          type="number"
                          min="0"
                          value={request[pIdx][rIdx]}
                          onChange={(e) => handleCellChange('request', pIdx, rIdx, e.target.value)}
                          className="w-20 bg-amber-50/50 border-2 border-amber-200 focus:border-amber-600 rounded-xl py-2 px-3 text-center text-base font-extrabold text-amber-900 focus:outline-none focus:bg-white transition-all shadow-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocation;
