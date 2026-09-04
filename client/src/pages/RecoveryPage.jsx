import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Zap, Trash2, CheckCircle, XCircle, Bot, Sparkles, ArrowRight } from 'lucide-react';

const RecoveryPage = () => {
  const { showNotification } = useAuth();

  const [processes] = useState(['P0', 'P1', 'P2', 'P3']);
  const [resources] = useState(['R1', 'R2', 'R3']);
  const [available] = useState([0, 0, 0]);
  const [allocation] = useState([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 3],
    [2, 1, 1]
  ]);
  const [request] = useState([
    [0, 0, 0],
    [2, 0, 2],
    [0, 0, 1],
    [1, 0, 0]
  ]);

  const [strategy, setStrategy] = useState('auto');
  const [targetProcess, setTargetProcess] = useState('P1');
  const [preemptResource, setPreemptResource] = useState('R1');

  const [recoveryResult, setRecoveryResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunRecovery = async () => {
    setLoading(true);
    try {
      const res = await deadlockAPI.recover({
        processes,
        resources,
        available,
        allocation,
        request,
        strategy,
        targetProcess,
        preemptResource,
        count: 1
      });
      setRecoveryResult(res.data);
      if (res.data.deadlockResolved) {
        showNotification(res.data.message, 'success');
      } else {
        showNotification(res.data.message, 'warning');
      }
    } catch (err) {
      showNotification('Failed to execute deadlock recovery.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-700 rounded-2xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <span>Automated Deadlock Recovery Engine</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Automated OS algorithms to detect deadlocks, select optimal victim processes, and resolve circular waits.
          </p>
        </div>

        <button
          onClick={handleRunRecovery}
          disabled={loading}
          className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white font-black text-base shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Zap className="w-5 h-5 fill-white" />
              <span>Execute Recovery Strategy</span>
            </>
          )}
        </button>
      </div>

      {/* Recovery Mode Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automated Recovery (Recommended & Selected by default) */}
        <div
          onClick={() => setStrategy('auto')}
          className={`bg-white p-6 rounded-3xl border-2 cursor-pointer transition-all relative space-y-3 ${
            strategy === 'auto'
              ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-lg bg-teal-50/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-teal-700 font-black text-base">
              <Bot className="w-6 h-6 text-teal-600" />
              <span>1. Automated Deadlock Recovery</span>
            </div>
            <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-extrabold text-xs shadow-xs">
              Recommended
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            The OS automatically identifies deadlocked processes, ranks them by resource holdings, and terminates optimal victim processes step-by-step until system safety is restored.
          </p>
        </div>

        {/* Manual Process Termination */}
        <div
          onClick={() => setStrategy('termination')}
          className={`bg-white p-6 rounded-3xl border-2 cursor-pointer transition-all space-y-3 ${
            strategy === 'termination'
              ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-lg bg-teal-50/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5 text-indigo-700 font-black text-base">
            <Trash2 className="w-5 h-5 text-indigo-600" />
            <span>2. Manual Termination</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Manually choose a specific process to abort and reclaim its allocated resources to break circular dependencies.
          </p>

          {strategy === 'termination' && (
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Process to Abort:</label>
              <select
                value={targetProcess}
                onChange={(e) => setTargetProcess(e.target.value)}
                className="w-full bg-slate-50 border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
              >
                {processes.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Manual Preemption */}
        <div
          onClick={() => setStrategy('preemption')}
          className={`bg-white p-6 rounded-3xl border-2 cursor-pointer transition-all space-y-3 ${
            strategy === 'preemption'
              ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-lg bg-teal-50/20'
              : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5 text-amber-700 font-black text-base">
            <Zap className="w-5 h-5 text-amber-600" />
            <span>3. Resource Preemption</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Preempt specific resource instances from a victim process and return them to the free available pool.
          </p>

          {strategy === 'preemption' && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Victim Process:</label>
                <select
                  value={targetProcess}
                  onChange={(e) => setTargetProcess(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-amber-200 rounded-xl px-2 py-2 text-xs text-slate-900 font-mono font-bold"
                >
                  {processes.map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preempt Resource:</label>
                <select
                  value={preemptResource}
                  onChange={(e) => setPreemptResource(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-amber-200 rounded-xl px-2 py-2 text-xs text-slate-900 font-mono font-bold"
                >
                  {resources.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recovery Result Banner */}
      {recoveryResult && (
        <div className="space-y-6">
          <div className={`p-8 rounded-3xl border-2 ${
            recoveryResult.deadlockResolved
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-md'
              : 'bg-red-50/80 border-red-300 text-red-950 shadow-md'
          }`}>
            <div className="flex items-start gap-4">
              {recoveryResult.deadlockResolved ? (
                <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-3">
                <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
                  {recoveryResult.deadlockResolved
                    ? 'AUTOMATED RECOVERY SUCCESSFUL – DEADLOCK RESOLVED ✅'
                    : 'RECOVERY INCOMPLETE – DEADLOCK PERSISTS ⚠️'}
                </h2>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {recoveryResult.message}
                </p>

                {/* Terminated Victims Display */}
                {recoveryResult.terminatedVictims && recoveryResult.terminatedVictims.length > 0 && (
                  <div className="pt-3 flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                      Terminated Victim Processes:
                    </span>
                    {recoveryResult.terminatedVictims.map(p => (
                      <span key={p} className="px-3 py-1 rounded-xl bg-red-600 text-white font-mono font-extrabold text-xs shadow-xs">
                        {p} (Aborted)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Automated Resolution Steps Log */}
          {recoveryResult.steps && recoveryResult.steps.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <span>Automated Recovery Resolution Log</span>
              </h3>

              <div className="space-y-3 font-mono text-xs">
                {recoveryResult.steps.map((stepText, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="font-bold">{stepText}</span>
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
