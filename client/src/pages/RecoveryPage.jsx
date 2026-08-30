import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Zap, Trash2, CheckCircle, XCircle } from 'lucide-react';

const RecoveryPage = () => {
  const { showNotification } = useAuth();

  const [processes] = useState(['P1', 'P2', 'P3', 'P4']);
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

  const [strategy, setStrategy] = useState('termination');
  const [targetProcess, setTargetProcess] = useState('P2');
  const [preemptResource, setPreemptResource] = useState('R1');
  const [preemptCount, setPreemptCount] = useState(1);

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
        count: preemptCount
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-teal-600" />
            <span>Deadlock Recovery Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Break deadlocks via Process Termination or Resource Preemption algorithms.
          </p>
        </div>

        <button
          onClick={handleRunRecovery}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-xs shadow-md shadow-teal-500/20 transition-all flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Execute Recovery Strategy</span>
            </>
          )}
        </button>
      </div>

      {/* Recovery Strategy Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Termination Option */}
        <div
          onClick={() => setStrategy('termination')}
          className={`bg-white p-6 rounded-3xl border cursor-pointer transition-all ${
            strategy === 'termination' ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Option 1: Process Termination</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Abort one or more deadlocked processes to reclaim all their held resources and break circular dependencies.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Select Process to Abort:</label>
            <select
              value={targetProcess}
              onChange={(e) => setTargetProcess(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-teal-500"
            >
              {processes.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Preemption Option */}
        <div
          onClick={() => setStrategy('preemption')}
          className={`bg-white p-6 rounded-3xl border cursor-pointer transition-all ${
            strategy === 'preemption' ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md' : 'border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Option 2: Resource Preemption</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Successively preempt resources from victim processes and reallocate them to other waiting processes.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Victim Process:</label>
              <select
                value={targetProcess}
                onChange={(e) => setTargetProcess(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-teal-500"
              >
                {processes.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Resource to Preempt:</label>
              <select
                value={preemptResource}
                onChange={(e) => setPreemptResource(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono font-bold focus:outline-none focus:border-teal-500"
              >
                {resources.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Recovery Result Banner */}
      {recoveryResult && (
        <div className={`p-6 rounded-3xl border ${
          recoveryResult.deadlockResolved ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm' : 'bg-red-50 border-red-200 text-red-900 shadow-sm'
        }`}>
          <div className="flex items-start gap-4">
            {recoveryResult.deadlockResolved ? (
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
            ) : (
              <XCircle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
            )}
            <div>
              <h2 className="text-lg font-black tracking-wide">
                {recoveryResult.deadlockResolved ? 'RECOVERY SUCCESSFUL – DEADLOCK RESOLVED' : 'RECOVERY INCOMPLETE – DEADLOCK PERSISTS'}
              </h2>
              <p className="text-xs mt-1 leading-relaxed font-medium">{recoveryResult.message}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecoveryPage;
