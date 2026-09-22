import React, { useState, useEffect, useCallback } from 'react';
import { deadlockAPI, processAPI, resourceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { RefreshCw, Zap, Trash2, CheckCircle, XCircle, Bot, Sparkles, Database } from 'lucide-react';
import EditableMatrix from '../components/EditableMatrix';

const zeroMatrix = (rows, cols) => Array.from({ length: rows }, () => new Array(cols).fill(0));

const RecoveryPage = () => {
  const { showNotification } = useAuth();

  // ── State ──────────────────────────────────────────────────────────────────
  const [processes, setProcesses] = useState([]);
  const [resources, setResources] = useState([]);
  const [available, setAvailable] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const [request, setRequest] = useState([]);

  const [strategy, setStrategy] = useState('auto');
  const [targetProcess, setTargetProcess] = useState('');
  const [preemptResource, setPreemptResource] = useState('');
  const [recoveryResult, setRecoveryResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDB, setLoadingDB] = useState(false);

  // ── Load from DB ───────────────────────────────────────────────────────────
  const loadFromDB = useCallback(async () => {
    setLoadingDB(true);
    try {
      const [pRes, rRes] = await Promise.all([processAPI.getAll(), resourceAPI.getAll()]);
      const dbProcesses = pRes.data.map(p => p.processId);
      const dbResources = rRes.data.map(r => r.resourceId);
      const dbAvailable = rRes.data.map(r => r.availableInstances ?? 0);

      if (dbProcesses.length === 0 || dbResources.length === 0) {
        showNotification('No data in DB. Loading deadlock example.', 'warning');
        loadExample();
        return;
      }

      setProcesses(dbProcesses);
      setResources(dbResources);
      setAvailable(dbAvailable);
      setAllocation(zeroMatrix(dbProcesses.length, dbResources.length));
      setRequest(zeroMatrix(dbProcesses.length, dbResources.length));
      setTargetProcess(dbProcesses[0] || '');
      setPreemptResource(dbResources[0] || '');
      setRecoveryResult(null);
      showNotification(`Loaded ${dbProcesses.length} processes and ${dbResources.length} resources.`, 'success');
    } catch {
      showNotification('Could not load from DB. Loading deadlock example.', 'error');
      loadExample();
    } finally {
      setLoadingDB(false);
    }
  }, []);

  const loadExample = () => {
    const procs = ['P0', 'P1', 'P2', 'P3'];
    const res   = ['R1', 'R2', 'R3'];
    setProcesses(procs);
    setResources(res);
    setAvailable([0, 0, 0]);
    setAllocation([[0,1,0],[2,0,0],[3,0,3],[2,1,1]]);
    setRequest([[0,0,0],[2,0,2],[0,0,1],[1,0,0]]);
    setTargetProcess('P1');
    setPreemptResource('R1');
    setRecoveryResult(null);
    showNotification('Loaded classic deadlock example (system IS deadlocked).', 'info');
  };

  useEffect(() => { loadFromDB(); }, [loadFromDB]);

  // ── Matrix Change Handlers ─────────────────────────────────────────────────
  const handleAllocationChange = (r, c, v) => {
    setAllocation(prev => prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? Math.max(0, v) : cell))));
    setRecoveryResult(null);
  };

  const handleRequestChange = (r, c, v) => {
    setRequest(prev => prev.map((row, ri) => row.map((cell, ci) => (ri === r && ci === c ? Math.max(0, v) : cell))));
    setRecoveryResult(null);
  };

  const handleAvailableChange = (idx, val) => {
    setAvailable(prev => prev.map((v, i) => (i === idx ? Math.max(0, parseInt(val) || 0) : v)));
    setRecoveryResult(null);
  };

  // ── Run Recovery ───────────────────────────────────────────────────────────
  const handleRunRecovery = async () => {
    if (!processes.length || !resources.length) {
      showNotification('Please load processes and resources first.', 'warning');
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
        targetProcess,
        preemptResource,
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

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-teal-100 text-teal-700 rounded-2xl">
              <RefreshCw className="w-6 h-6" />
            </div>
            <span>Deadlock Recovery Engine</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Enter your system state below, choose a recovery strategy, and execute.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadFromDB}
            disabled={loadingDB}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-2 transition-all"
          >
            {loadingDB ? <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            Load from DB
          </button>

          <button
            onClick={loadExample}
            className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Load Example
          </button>

          <button
            onClick={handleRunRecovery}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Zap className="w-5 h-5 fill-white" /><span>Execute Recovery</span></>
            )}
          </button>
        </div>
      </div>

      {/* Available Vector */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider mb-3">Available Vector — Free resources</p>
        <div className="flex flex-wrap gap-3">
          {resources.map((r, idx) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">{r}</span>
              <input
                type="number" min="0"
                value={available[idx] ?? 0}
                onChange={e => handleAvailableChange(idx, e.target.value)}
                className="w-16 text-center bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-2 text-emerald-800 font-extrabold text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          ))}
          {resources.length === 0 && <span className="text-xs text-slate-400 italic">Load data first.</span>}
        </div>
      </div>

      {/* Allocation + Request Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Allocation Matrix — What each process currently holds</p>
          <EditableMatrix label="Allocation" color="indigo" processes={processes} resources={resources} matrix={allocation} onChange={handleAllocationChange} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Request Matrix — What each process is waiting for</p>
          <EditableMatrix label="Request" color="rose" processes={processes} resources={resources} matrix={request} onChange={handleRequestChange} />
        </div>
      </div>

      {/* Recovery Strategy Selector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Automated */}
        <div
          onClick={() => setStrategy('auto')}
          className={`bg-white p-6 rounded-3xl border-2 cursor-pointer transition-all space-y-3 ${strategy === 'auto' ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-lg bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-teal-700 font-black text-base">
              <Bot className="w-6 h-6 text-teal-600" />
              <span>1. Auto Recovery</span>
            </div>
            <span className="px-3 py-1 rounded-xl bg-teal-600 text-white font-extrabold text-xs">Recommended</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            OS automatically picks the best victim process, terminates it, reclaims resources, and loops until deadlock is gone.
          </p>
        </div>

        {/* Manual Termination */}
        <div
          onClick={() => setStrategy('termination')}
          className={`bg-white p-6 rounded-3xl border-2 cursor-pointer transition-all space-y-3 ${strategy === 'termination' ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-lg bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center gap-2.5 text-indigo-700 font-black text-base">
            <Trash2 className="w-5 h-5 text-indigo-600" />
            <span>2. Manual Termination</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">Choose a specific process to abort and reclaim its allocated resources.</p>
          {strategy === 'termination' && (
            <div className="pt-1">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Process to Abort:</label>
              <select
                value={targetProcess}
                onChange={e => setTargetProcess(e.target.value)}
                onClick={e => e.stopPropagation()}
                className="w-full bg-slate-50 border-2 border-indigo-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold focus:outline-none focus:border-indigo-600"
              >
                {processes.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Manual Preemption */}
        <div
          onClick={() => setStrategy('preemption')}
          className={`bg-white p-6 rounded-3xl border-2 cursor-pointer transition-all space-y-3 ${strategy === 'preemption' ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-lg bg-teal-50/20' : 'border-slate-200 hover:border-slate-300'}`}
        >
          <div className="flex items-center gap-2.5 text-amber-700 font-black text-base">
            <Zap className="w-5 h-5 text-amber-600" />
            <span>3. Resource Preemption</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">Forcibly take a resource from a victim process and return it to the free pool.</p>
          {strategy === 'preemption' && (
            <div className="grid grid-cols-2 gap-2 pt-1" onClick={e => e.stopPropagation()}>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Victim Process:</label>
                <select value={targetProcess} onChange={e => setTargetProcess(e.target.value)} className="w-full bg-slate-50 border-2 border-amber-200 rounded-xl px-2 py-2 text-xs text-slate-900 font-mono font-bold">
                  {processes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Preempt Resource:</label>
                <select value={preemptResource} onChange={e => setPreemptResource(e.target.value)} className="w-full bg-slate-50 border-2 border-amber-200 rounded-xl px-2 py-2 text-xs text-slate-900 font-mono font-bold">
                  {resources.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Result */}
      {recoveryResult && (
        <div className="space-y-6">
          <div className={`p-8 rounded-3xl border-2 ${recoveryResult.deadlockResolved ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-red-50/80 border-red-300 text-red-950'} shadow-md`}>
            <div className="flex items-start gap-4">
              {recoveryResult.deadlockResolved
                ? <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0 mt-0.5" />
                : <XCircle className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />}
              <div className="space-y-3">
                <h2 className="text-xl font-black tracking-wide">
                  {recoveryResult.deadlockResolved
                    ? 'RECOVERY SUCCESSFUL – DEADLOCK RESOLVED ✅'
                    : 'RECOVERY INCOMPLETE – DEADLOCK PERSISTS ⚠️'}
                </h2>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">{recoveryResult.message}</p>
                {recoveryResult.terminatedVictims?.length > 0 && (
                  <div className="pt-3 flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Terminated Victims:</span>
                    {recoveryResult.terminatedVictims.map(p => (
                      <span key={p} className="px-3 py-1 rounded-xl bg-red-600 text-white font-mono font-extrabold text-xs">{p} (Aborted)</span>
                    ))}
                  </div>
                )}
                {recoveryResult.newAvailable && (
                  <p className="text-xs font-mono text-slate-600 pt-1">
                    New Available: [{recoveryResult.newAvailable.join(', ')}]
                  </p>
                )}
              </div>
            </div>
          </div>

          {recoveryResult.steps?.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5 text-teal-600" />
                Automated Recovery Resolution Log
              </h3>
              <div className="space-y-3 font-mono text-xs">
                {recoveryResult.steps.map((stepText, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 leading-relaxed flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
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
