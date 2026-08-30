import React, { useState } from 'react';
import { Share2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ResourceAllocation = () => {
  const { showNotification } = useAuth();

  const [processes, setProcesses] = useState(['P1', 'P2', 'P3']);
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
    const pName = `P${processes.length + 1}`;
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-purple-600" />
            <span>Resource Allocation & Matrix Editor</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Interactively edit Allocation and Request matrices, manage available vectors, and validate allocation bounds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={addProcessRow}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>+ Process</span>
          </button>
          <button
            onClick={addResourceCol}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>+ Resource</span>
          </button>
        </div>
      </div>

      {/* Available Vector Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider mb-3">
          Available Resource Vector [Available[j]]
        </h3>
        <div className="flex flex-wrap gap-4">
          {resources.map((resName, idx) => (
            <div key={resName} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
              <span className="font-mono font-bold text-xs text-emerald-700">{resName}:</span>
              <input
                type="number"
                min="0"
                value={available[idx]}
                onChange={(e) => handleAvailableChange(idx, e.target.value)}
                className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-slate-800 text-center focus:outline-none focus:border-emerald-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Matrices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-indigo-600 flex items-center gap-2">
              <span>Allocation Matrix</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">[Allocation[i][j]]</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-mono text-slate-400">
                <tr>
                  <th className="p-2.5 text-left">Process</th>
                  {resources.map(r => (
                    <th key={r} className="p-2.5 text-indigo-600">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((proc, pIdx) => (
                  <tr key={proc} className="hover:bg-slate-50/80">
                    <td className="p-2.5 text-left font-bold text-slate-800">{proc}</td>
                    {resources.map((res, rIdx) => (
                      <td key={res} className="p-2.5">
                        <input
                          type="number"
                          min="0"
                          value={allocation[pIdx][rIdx]}
                          onChange={(e) => handleCellChange('allocation', pIdx, rIdx, e.target.value)}
                          className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-indigo-700 focus:outline-none focus:border-indigo-500"
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-amber-600 flex items-center gap-2">
              <span>Request Matrix</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">[Request[i][j]]</span>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 font-mono text-slate-400">
                <tr>
                  <th className="p-2.5 text-left">Process</th>
                  {resources.map(r => (
                    <th key={r} className="p-2.5 text-amber-600">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((proc, pIdx) => (
                  <tr key={proc} className="hover:bg-slate-50/80">
                    <td className="p-2.5 text-left font-bold text-slate-800">{proc}</td>
                    {resources.map((res, rIdx) => (
                      <td key={res} className="p-2.5">
                        <input
                          type="number"
                          min="0"
                          value={request[pIdx][rIdx]}
                          onChange={(e) => handleCellChange('request', pIdx, rIdx, e.target.value)}
                          className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-center font-bold text-amber-700 focus:outline-none focus:border-amber-500"
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
