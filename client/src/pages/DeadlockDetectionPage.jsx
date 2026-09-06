import React, { useState, useEffect } from 'react';
import { deadlockAPI, processAPI, resourceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Play, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const DeadlockDetectionPage = () => {
  const { showNotification } = useAuth();

  const [processes, setProcesses] = useState(['P0', 'P1', 'P2', 'P3']);
  const [resources, setResources] = useState(['R1', 'R2', 'R3']);
  const [available, setAvailable] = useState([0, 0, 0]);
  const [allocation, setAllocation] = useState([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 3],
    [2, 1, 1]
  ]);
  const [request, setRequest] = useState([
    [0, 0, 0],
    [2, 0, 2],
    [0, 0, 1],
    [1, 0, 0]
  ]);

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Sync with DB
  useEffect(() => {
    const fetchDBData = async () => {
      try {
        const [procRes, resRes] = await Promise.all([
          processAPI.getAll(),
          resourceAPI.getAll()
        ]);
        if (procRes.data && procRes.data.length > 0) {
          setProcesses(procRes.data.map(p => p.processId));
        }
        if (resRes.data && resRes.data.length > 0) {
          setResources(resRes.data.map(r => r.resourceId));
          setAvailable(resRes.data.map(r => r.availableInstances || 0));
        }
      } catch (err) {
        console.error('Failed to sync DB in DeadlockDetectionPage', err);
      }
    };
    fetchDBData();
  }, []);

  const handleRunDetection = async () => {
    setLoading(true);
    try {
      const res = await deadlockAPI.detect({
        processes,
        resources,
        available,
        allocation,
        request,
        simulationName: `Detection Run - ${new Date().toLocaleTimeString()}`
      });
      setResult(res.data);
      if (res.data.deadlockDetected) {
        showNotification(`Deadlock Detected in processes: ${res.data.deadlockedProcesses.join(', ')}`, 'warning');
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
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <span>Deadlock Detection Algorithm</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Evaluates circular wait conditions among active processes ({processes.join(', ')}) and resources ({resources.join(', ')}).
          </p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-700 hover:to-rose-800 text-white font-black text-sm shadow-lg shadow-red-500/25 transition-all flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Play className="w-5 h-5 fill-white" />
              <span>Run Detection Algorithm</span>
            </>
          )}
        </button>
      </div>

      {/* Input Matrices Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 font-bold uppercase tracking-wider block mb-2">Available Vector:</span>
          <span className="text-emerald-700 font-black text-base">[{available.join(', ')}]</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 font-bold uppercase tracking-wider block mb-2">Database Processes:</span>
          <span className="text-indigo-700 font-black text-base">{processes.join(', ')}</span>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 font-bold uppercase tracking-wider block mb-2">Database Resources:</span>
          <span className="text-blue-700 font-black text-base">{resources.join(', ')}</span>
        </div>
      </div>

      {/* Detection Results */}
      {result && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`p-8 rounded-3xl border-2 ${
            result.deadlockDetected
              ? 'bg-red-50/80 border-red-300 text-red-950 shadow-md'
              : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-md'
          }`}>
            <div className="flex items-start gap-4">
              {result.deadlockDetected ? (
                <AlertTriangle className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-3">
                <h2 className="text-xl font-black tracking-wide">
                  {result.deadlockDetected ? 'DEADLOCK DETECTED ⚠️' : 'SYSTEM IS SAFE ✅'}
                </h2>
                <p className="text-sm leading-relaxed font-medium text-slate-800">{result.summaryExplanation}</p>

                {result.deadlockedProcesses && result.deadlockedProcesses.length > 0 && (
                  <div className="pt-2 flex items-center gap-3 text-sm flex-wrap">
                    <span className="font-extrabold text-red-800">Deadlocked Processes:</span>
                    <div className="flex gap-2">
                      {result.deadlockedProcesses.map(p => (
                        <span key={p} className="px-3.5 py-1 rounded-xl bg-red-600 text-white font-mono font-black text-xs shadow-xs border border-red-700">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Educational Step-by-Step Trace */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ChevronRight className="w-5 h-5 text-indigo-600" />
              <span>Step-by-Step Educational Execution Trace</span>
            </h3>

            <div className="space-y-4 font-mono text-xs">
              {result.steps.map((s, idx) => (
                <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-200 pb-2">
                    <span className="text-indigo-700 font-black text-sm">Step {s.step}: {s.title || (s.process ? `Evaluating Process ${s.process}` : '')}</span>
                    {s.canSatisfy !== undefined && (
                      <span className={s.canSatisfy ? 'px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-sans font-black' : 'px-3 py-1 rounded-lg bg-amber-100 text-amber-800 font-sans font-black'}>
                        {s.canSatisfy ? 'SATISFIED' : 'WAITING'}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 font-sans leading-relaxed font-medium text-sm pt-1">{s.description}</p>
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
