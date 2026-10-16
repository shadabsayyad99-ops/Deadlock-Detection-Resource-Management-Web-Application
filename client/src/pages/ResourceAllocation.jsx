import React from 'react';
import { useSystemState } from '../context/SystemStateContext';
import { Share2, Database, Calculator, RefreshCw, Sparkles, CheckCircle } from 'lucide-react';
import EditableMatrix from '../components/EditableMatrix';

const ResourceAllocation = () => {
  const {
    processes,
    resources,
    totalInstances,
    available,
    allocation,
    request,
    maximum,
    isLoadingDB,
    lastSyncTime,
    syncWithDB,
    loadPreset,
    updateAllocationCell,
    updateRequestCell,
    updateMaximumCell,
    updateAvailableVal,
    updateTotalInstanceVal,
    autoComputeAvailable,
  } = useSystemState();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
              <Share2 className="w-6 h-6" />
            </div>
            <span>System Resource Allocation & Matrices</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Centralized matrix state. All edits made here immediately reflect in <strong>Deadlock Detection</strong>, <strong>Banker's Algorithm</strong>, <strong>RAG</strong>, <strong>Simulation</strong>, and <strong>Recovery</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync from Database */}
          <button
            onClick={() => syncWithDB(true)}
            disabled={isLoadingDB}
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 flex items-center gap-2 transition-all shadow-xs"
          >
            {isLoadingDB ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>Sync with Live DB</span>
          </button>

          {/* Auto Compute Available */}
          <button
            onClick={autoComputeAvailable}
            className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200 flex items-center gap-2 transition-all shadow-xs"
            title="Sets Available[j] = Total[j] - Sum(Allocation[i][j])"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Compute Available</span>
          </button>

          {/* Presets Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select
              onChange={(e) => e.target.value && loadPreset(e.target.value)}
              defaultValue=""
              className="bg-transparent text-xs text-slate-700 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Load Preset Scenario...</option>
              <option value="deadlock">Classic Deadlock (4 Processes)</option>
              <option value="safe">Banker's Safe State (5 Processes)</option>
              <option value="simple">Simple 3-Process System</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sync Status Banner */}
      <div className="flex items-center justify-between text-xs px-5 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>
            Active System: <strong>{processes.length} Processes</strong> ({processes.join(', ')}) &bull; <strong>{resources.length} Resources</strong> ({resources.join(', ')})
          </span>
        </div>
        {lastSyncTime && (
          <span className="text-slate-400 font-mono">Synced from DB at {lastSyncTime}</span>
        )}
      </div>

      {/* Vectors Section: Total Instances and Available Instances */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Instances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-amber-800 uppercase tracking-wider">
              Total Instances [TotalInstances[j]]
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Total hardware copies</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {resources.map((r, idx) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500">{r}</span>
                <input
                  type="number"
                  min="1"
                  value={totalInstances[idx] ?? 1}
                  onChange={(e) => updateTotalInstanceVal(idx, e.target.value)}
                  className="w-16 text-center bg-amber-50 border border-amber-200 rounded-xl px-2 py-2 text-amber-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Available Instances */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
              Available Vector [Available[j]]
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Currently free to allocate</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {resources.map((r, idx) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500">{r}</span>
                <input
                  type="number"
                  min="0"
                  value={available[idx] ?? 0}
                  onChange={(e) => updateAvailableVal(idx, e.target.value)}
                  className="w-16 text-center bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-2 text-emerald-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Allocation & Request Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Matrix */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
              Allocation Matrix — What each process currently holds
            </p>
            <span className="text-[10px] text-slate-400 font-mono">[Allocation[i][j]]</span>
          </div>
          <EditableMatrix
            label="Allocation Matrix"
            color="indigo"
            processes={processes}
            resources={resources}
            matrix={allocation}
            onChange={updateAllocationCell}
          />
        </div>

        {/* Request Matrix */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider">
              Request Matrix — What each process is waiting for
            </p>
            <span className="text-[10px] text-slate-400 font-mono">[Request[i][j]]</span>
          </div>
          <EditableMatrix
            label="Request Matrix"
            color="rose"
            processes={processes}
            resources={resources}
            matrix={request}
            onChange={updateRequestCell}
          />
        </div>
      </div>

      {/* Maximum Matrix (for Banker's Algorithm) */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            Maximum Matrix — Maximum claims declared in advance (used by Banker's Algorithm)
          </p>
          <span className="text-[10px] text-slate-400 font-mono">[Maximum[i][j]]</span>
        </div>
        <EditableMatrix
          label="Maximum Matrix (Banker's Claims)"
          color="blue"
          processes={processes}
          resources={resources}
          matrix={maximum}
          onChange={updateMaximumCell}
        />
      </div>
    </div>
  );
};

export default ResourceAllocation;
