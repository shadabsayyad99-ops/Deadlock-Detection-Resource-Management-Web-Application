import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Play, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';

const DeadlockDetectionPage = () => {
  const { showNotification } = useAuth();

  const [processes] = useState(['P1', 'P2', 'P3', 'P4']);
  const [resources] = useState(['R1', 'R2', 'R3']);
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
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Deadlock Detection Algorithm</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Standard Operating System Deadlock Detection algorithm execution with step-by-step educational trace.
          </p>
        </div>

        <button
          onClick={handleRunDetection}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-red-500/20 transition-all flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Detection Algorithm</span>
            </>
          )}
        </button>
      </div>

      {/* Input Matrices Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 font-bold block mb-2">Available Vector:</span>
          <span className="text-emerald-600 font-bold text-sm">[{available.join(', ')}]</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 font-bold block mb-2">Processes:</span>
          <span className="text-indigo-600 font-bold">{processes.join(', ')}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-slate-500 font-bold block mb-2">Resources:</span>
          <span className="text-blue-600 font-bold">{resources.join(', ')}</span>
        </div>
      </div>

      {/* Detection Results */}
      {result && (
        <div className="space-y-6">
          {/* Status Banner */}
          <div className={`p-6 rounded-3xl border ${
            result.deadlockDetected
              ? 'bg-red-50 border-red-200 text-red-900 shadow-sm'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
          }`}>
            <div className="flex items-start gap-4">
              {result.deadlockDetected ? (
                <AlertTriangle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
              ) : (
                <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
              )}
              <div className="space-y-2">
                <h2 className="text-lg font-black tracking-wide">
                  {result.deadlockDetected ? 'DEADLOCK DETECTED' : 'SYSTEM IS SAFE'}
                </h2>
                <p className="text-xs leading-relaxed font-medium">{result.summaryExplanation}</p>

                {result.deadlockedProcesses && result.deadlockedProcesses.length > 0 && (
                  <div className="pt-2 flex items-center gap-2 text-xs">
                    <span className="font-bold text-red-700">Deadlocked Processes:</span>
                    <div className="flex gap-1.5">
                      {result.deadlockedProcesses.map(p => (
                        <span key={p} className="px-2.5 py-0.5 rounded bg-red-100 text-red-800 font-mono font-bold border border-red-300">
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
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ChevronRight className="w-4 h-4 text-indigo-600" />
              <span>Step-by-Step Educational Execution Trace</span>
            </h3>

            <div className="space-y-3">
              {result.steps.map((s, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono">
                  <div className="flex items-center justify-between text-slate-600 font-bold border-b border-slate-200 pb-1.5 mb-1.5">
                    <span className="text-indigo-600">Step {s.step}: {s.title || (s.process ? `Evaluating Process ${s.process}` : '')}</span>
                    {s.canSatisfy !== undefined && (
                      <span className={s.canSatisfy ? 'text-emerald-600 font-sans font-bold' : 'text-amber-600 font-sans font-bold'}>
                        {s.canSatisfy ? 'SATISFIED' : 'WAITING'}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 font-sans leading-normal font-medium">{s.description}</p>
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
