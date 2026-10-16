import React, { useState, useEffect } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import {
  RefreshCw,
  Zap,
  Trash2,
  CheckCircle,
  XCircle,
  Bot,
  Sparkles,
  Database,
  ArrowRight,
  ShieldCheck,
  Cpu,
  Layers,
  ChevronRight
} from 'lucide-react';
import EditableMatrix from '../components/EditableMatrix';

const RecoveryPage = () => {
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
    applyRecoveryResult,
  } = useSystemState();

  const [strategy, setStrategy] = useState('auto');
  const [targetProcess, setTargetProcess] = useState('');
  const [preemptResource, setPreemptResource] = useState('');
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-sync select dropdowns with available processes & resources
  useEffect(() => {
    if (processes.length > 0 && !processes.includes(targetProcess)) {
      setTargetProcess(processes[0]);
    }
    if (resources.length > 0 && !resources.includes(preemptResource)) {
      setPreemptResource(resources[0]);
    }
  }, [processes, resources, targetProcess, preemptResource]);

  // Execute Deadlock Recovery
  const handleRunRecovery = async () => {
    if (!processes.length || !resources.length) {
      showNotification('Please configure processes and resources first.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await deadlockAPI.recover({
        processes,
        resources,
        available,
        allocation,
        request,
        strategy,
        targetProcess: targetProcess || processes[0],
        preemptResource: preemptResource || resources[0],
        count: 1,
      });
      setRecoveryResult(res.data);
      if (res.data.deadlockResolved) {
        showNotification(res.data.message, 'success');
      } else {
        showNotification(res.data.message, 'warning');
      }
    } catch {
      showNotification('Failed to execute deadlock recovery.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Apply recovered state to the entire app
  const handleApplyToSystem = () => {
    if (!recoveryResult) return;
    applyRecoveryResult(
      recoveryResult.newProcesses,
      recoveryResult.newAvailable,
      recoveryResult.newAllocation,
      recoveryResult.newRequest
    );
    showNotification('System updated! Deadlock-free state reflected across all pages.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-700 rounded-2xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <span>Deadlock Recovery Engine</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Break circular wait states through automated victim selection heuristics, process abortion, or resource preemption.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync Live DB */}
          <button
            onClick={() => {
              syncWithDB(true);
              setRecoveryResult(null);
            }}
            disabled={isLoadingDB}
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 flex items-center gap-2 transition-all shadow-xs"
          >
            {isLoadingDB ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>Sync Live DB</span>
          </button>

          {/* Load Deadlock Preset */}
          <button
            onClick={() => {
              loadPreset('deadlock');
              setRecoveryResult(null);
            }}
            className="px-4 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-800 font-extrabold text-xs border border-red-200 flex items-center gap-2 transition-all shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-red-600" />
            <span>Load Deadlock State</span>
          </button>

          {/* Execute Recovery Button */}
          <button
            onClick={handleRunRecovery}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-black text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Zap className="w-5 h-5 fill-white" />
                <span>Execute Recovery</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Available Vector Pill Row */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-600" />
            <span>Available Resources Vector [Available[j]]</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">Unallocated free instances</span>
        </div>
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
                  setRecoveryResult(null);
                }}
                className="w-16 text-center bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-2 text-emerald-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          ))}
          {resources.length === 0 && (
            <span className="text-xs text-slate-400 italic">No resources defined. Click "Sync Live DB".</span>
          )}
        </div>
      </div>

      {/* Side-by-Side Allocation & Request Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider pl-1">
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
              setRecoveryResult(null);
            }}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider pl-1">
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
              setRecoveryResult(null);
            }}
          />
        </div>
      </div>

      {/* Clean Recovery Strategy Selection Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>Select Deadlock Recovery Strategy</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Choose how the OS kernel should break the circular dependency.
          </p>
        </div>

        {/* 3 Clean Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Auto Recovery */}
          <button
            type="button"
            onClick={() => setStrategy('auto')}
            className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              strategy === 'auto'
                ? 'border-teal-500 bg-teal-50/50 shadow-sm ring-2 ring-teal-500/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-sm text-teal-800 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-teal-600" />
                1. Auto Recovery
              </span>
              <span className="text-[10px] bg-teal-600 text-white font-extrabold px-2 py-0.5 rounded-md">
                Recommended
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              OS scores deadlocked processes by resource weight and aborts the minimum victim to free the bottleneck.
            </p>
          </button>

          {/* Manual Termination */}
          <button
            type="button"
            onClick={() => setStrategy('termination')}
            className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              strategy === 'termination'
                ? 'border-indigo-500 bg-indigo-50/50 shadow-sm ring-2 ring-indigo-500/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-sm text-indigo-800 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4 text-indigo-600" />
                2. Process Abortion
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Manually abort a chosen process to return all of its held resources to the available pool.
            </p>
          </button>

          {/* Resource Preemption */}
          <button
            type="button"
            onClick={() => setStrategy('preemption')}
            className={`text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
              strategy === 'preemption'
                ? 'border-amber-500 bg-amber-50/50 shadow-sm ring-2 ring-amber-500/20'
                : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-black text-sm text-amber-800 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-600" />
                3. Preemption
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Forcibly reclaim a specific resource from a victim process without killing the entire task.
            </p>
          </button>
        </div>

        {/* Strategy Specific Settings Sub-Panel */}
        {strategy === 'termination' && (
          <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex flex-wrap items-center gap-4 text-xs">
            <span className="font-extrabold text-indigo-900">Select Process to Abort:</span>
            <select
              value={targetProcess}
              onChange={(e) => setTargetProcess(e.target.value)}
              className="bg-white border-2 border-indigo-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-600"
            >
              {processes.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <span className="text-slate-500 font-sans">
              Reclaims all resources currently allocated to {targetProcess}.
            </span>
          </div>
        )}

        {strategy === 'preemption' && (
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 flex flex-wrap items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-900">Victim Process:</span>
              <select
                value={targetProcess}
                onChange={(e) => setTargetProcess(e.target.value)}
                className="bg-white border-2 border-amber-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-amber-600"
              >
                {processes.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-extrabold text-amber-900">Resource to Reclaim:</span>
              <select
                value={preemptResource}
                onChange={(e) => setPreemptResource(e.target.value)}
                className="bg-white border-2 border-amber-300 rounded-xl px-3 py-1.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-amber-600"
              >
                {resources.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Recovery Result & Before/After Comparison */}
      {recoveryResult && (
        <div className="space-y-6">
          {/* Main Resolution Card */}
          <div
            className={`p-6 sm:p-8 rounded-3xl border-2 ${
              recoveryResult.deadlockResolved
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-md'
                : 'bg-red-50/90 border-red-300 text-red-950 shadow-md'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                {recoveryResult.deadlockResolved ? (
                  <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-2">
                  <h2 className="text-xl font-black tracking-wide">
                    {recoveryResult.deadlockResolved
                      ? 'DEADLOCK RECOVERY SUCCESSFUL ✅'
                      : 'RECOVERY INCOMPLETE – DEADLOCK PERSISTS ⚠️'}
                  </h2>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {recoveryResult.message}
                  </p>

                  {/* Victims Tag */}
                  {recoveryResult.terminatedVictims?.length > 0 && (
                    <div className="pt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                        Terminated Victim(s):
                      </span>
                      {recoveryResult.terminatedVictims.map((p) => (
                        <span
                          key={p}
                          className="px-3 py-1 rounded-xl bg-red-600 text-white font-mono font-extrabold text-xs shadow-xs"
                        >
                          {p} (Aborted)
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action to Push to Entire Platform */}
              {recoveryResult.deadlockResolved && (
                <button
                  onClick={handleApplyToSystem}
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Apply State to All Pages</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Before & After System Comparison */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Layers className="w-4 h-4 text-teal-600" />
              <span>Before & After Recovery State Comparison</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              {/* Before */}
              <div className="p-4 rounded-2xl bg-red-50/50 border border-red-200 space-y-2">
                <div className="font-black text-red-800 text-sm flex items-center gap-1.5 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span>System State BEFORE Recovery</span>
                </div>
                <div className="text-slate-700 font-sans space-y-1">
                  <p><strong>Initial Available:</strong> [{available.join(', ')}]</p>
                  <p><strong>Total Active Processes:</strong> {processes.length} ({processes.join(', ')})</p>
                  <p className="text-red-700 font-bold">Status: Circular Wait Deadlock Detected</p>
                </div>
              </div>

              {/* After */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 space-y-2">
                <div className="font-black text-emerald-800 text-sm flex items-center gap-1.5 font-sans">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>System State AFTER Recovery</span>
                </div>
                <div className="text-slate-700 font-sans space-y-1">
                  <p><strong>New Available Vector:</strong> [{recoveryResult.newAvailable ? recoveryResult.newAvailable.join(', ') : available.join(', ')}]</p>
                  <p><strong>Remaining Processes:</strong> {recoveryResult.newProcesses ? recoveryResult.newProcesses.join(', ') : processes.join(', ')}</p>
                  <p className="text-emerald-700 font-bold">Status: All Remaining Processes Can Safely Finish</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step Log */}
          {recoveryResult.steps?.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ChevronRight className="w-4 h-4 text-teal-600" />
                <span>Automated Recovery Resolution Log</span>
              </h3>
              <div className="space-y-2.5 font-mono text-xs">
                {recoveryResult.steps.map((stepText, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 flex items-start gap-3"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-bold leading-relaxed">{stepText}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecoveryPage;
