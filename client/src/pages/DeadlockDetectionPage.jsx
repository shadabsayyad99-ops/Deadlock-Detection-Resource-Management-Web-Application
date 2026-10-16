import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import { ShieldAlert, Play, CheckCircle, AlertTriangle, ChevronRight, Database, Sparkles } from 'lucide-react';
import EditableMatrix from '../components/EditableMatrix';

const DeadlockDetectionPage = () => {
  const { showNotification } = useAuth();
  const {
    processes,
    resources,
    available,
    allocation,
    request,
    isLoadingDB,
    syncWithDB,
    loadPreset,
    updateAllocationCell,
    updateRequestCell,
    updateAvailableVal,
  } = useSystemState();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Run Detection Algorithm
  const handleRunDetection = async () => {
    if (!processes.length || !resources.length) {
      showNotification('Please configure processes and resources first.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await deadlockAPI.detect({
        processes,
        resources,
        available,
        allocation,
        request,
        simulationName: `Detection Run – ${new Date().toLocaleTimeString()}`,
      });
      setResult(res.data);
      if (res.data.deadlockDetected) {
        showNotification(`Deadlock Detected! Processes: ${res.data.deadlockedProcesses.join(', ')}`, 'warning');
      } else {
        showNotification('System is completely safe. No deadlock detected.', 'success');
      }
    } catch (err) {
      showNotification('Failed to run deadlock detection algorithm.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Deadlock Detection Algorithm</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard Operating System Deadlock Detection algorithm execution with real-time shared matrix state.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync from DB */}
          <button
            onClick={() => syncWithDB(true)}
            disabled={isLoadingDB}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-2 transition-all shadow-xs"
          >
            {isLoadingDB ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            Sync from DB
          </button>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  loadPreset(e.target.value);
                  setResult(null);
                }
              }}
              defaultValue=""
              className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Load Preset...</option>
              <option value="deadlock">Classic Deadlock (4 Processes)</option>
              <option value="safe">Banker's Safe State (5 Processes)</option>
              <option value="simple">Simple 3-Process System</option>
            </select>
          </div>

          {/* Run Detection */}
          <button
            onClick={handleRunDetection}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-red-500/20 transition-all flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Detection Algorithm</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Available Vector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-3">
          Available Vector — Free unallocated resources right now [Available[j]]
        </p>
        <div className="flex flex-wrap gap-3">
          {resources.map((r, idx) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">{r}</span>
              <input
                type="number"
                min="0"
                value={available[idx] ?? 0}
                onChange={(e) => {
                  updateAvailableVal(idx, e.target.value);
                  setResult(null);
                }}
                className="w-16 text-center bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-2 text-emerald-800 font-extrabold text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          ))}
          {resources.length === 0 && (
            <span className="text-xs text-slate-400 italic">No resources defined. Click "Sync from DB".</span>
          )}
        </div>
      </div>

      {/* Matrices side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
            Allocation Matrix — What each process currently holds
          </p>
          <EditableMatrix
            label="Allocation Matrix"
            color="indigo"
            processes={processes}
            resources={resources}
            matrix={allocation}
            onChange={(r, c, v) => {
              updateAllocationCell(r, c, v);
              setResult(null);
            }}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
            Request Matrix — What each process is waiting for
          </p>
          <EditableMatrix
            label="Request Matrix"
            color="rose"
            processes={processes}
            resources={resources}
            matrix={request}
            onChange={(r, c, v) => {
              updateRequestCell(r, c, v);
              setResult(null);
            }}
          />
        </div>
      </div>

      {/* Result Display */}
      {result && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div
            className={`p-6 rounded-3xl border ${
              result.deadlockDetected
                ? 'bg-red-50 border-red-200 text-red-900 shadow-sm'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              {result.deadlockDetected ? (
                <AlertTriangle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
              )}
              <div className="space-y-2">
                <h2 className="text-lg font-black tracking-wide">
                  {result.deadlockDetected ? '🔴 DEADLOCK DETECTED' : '🟢 SYSTEM IS SAFE'}
                </h2>
                <p className="text-xs leading-relaxed font-medium">{result.summaryExplanation}</p>
                {result.deadlockedProcesses?.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-bold text-red-700">Deadlocked Processes:</span>
                    {result.deadlockedProcesses.map((p) => (
                      <span
                        key={p}
                        className="px-2.5 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold border border-red-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
                {result.safeProcesses?.length > 0 && (
                  <div className="pt-1 flex items-center gap-2 text-xs flex-wrap">
                    <span className="font-bold text-emerald-700">Safe Processes:</span>
                    {result.safeProcesses.map((p) => (
                      <span
                        key={p}
                        className="px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold border border-emerald-300"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Educational Step-by-Step Trace */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ChevronRight className="w-4 h-4 text-indigo-600" />
              <span>Step-by-Step Educational Execution Trace</span>
            </h3>
            <div className="space-y-3">
              {result.steps.map((s, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono"
                >
                  <div className="flex items-center justify-between text-slate-600 font-bold border-b border-slate-200 pb-1.5 mb-1.5">
                    <span className="text-indigo-600">
                      Step {s.step}: {s.title || (s.process ? `Evaluating Process ${s.process}` : '')}
                    </span>
                    {s.canSatisfy !== undefined && (
                      <span
                        className={
                          s.canSatisfy
                            ? 'text-emerald-600 font-sans font-bold'
                            : 'text-amber-600 font-sans font-bold'
                        }
                      >
                        {s.canSatisfy ? '✓ SATISFIED' : '⏳ WAITING'}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 font-sans leading-normal font-medium">{s.description}</p>
                  {s.newWork && (
                    <p className="text-slate-500 font-sans">
                      Updated Work Vector: [{s.newWork.join(', ')}]
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeadlockDetectionPage;
