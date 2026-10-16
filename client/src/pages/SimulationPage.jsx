import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import { PlaySquare, RotateCcw, CheckCircle, AlertTriangle, Sparkles, HelpCircle, Database } from 'lucide-react';
import EditableMatrix from '../components/EditableMatrix';

const SimulationPage = () => {
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
    autoComputeAvailable,
  } = useSystemState();

  const [showGuide, setShowGuide] = useState(true);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runDetection = async () => {
    if (!processes.length || !resources.length) {
      showNotification('Configure processes and resources first.', 'warning');
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
        simulationName: `Interactive Simulation (${new Date().toLocaleTimeString()})`
      });
      setSimResult(res.data);
      if (res.data.deadlockDetected) {
        showNotification('Deadlock Detected in Simulation!', 'error');
      } else {
        showNotification('Simulation State is Safe!', 'success');
      }
    } catch (err) {
      showNotification('Error executing simulation detection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetSimulation = () => {
    loadPreset('safe');
    setSimResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
              <PlaySquare className="w-6 h-6" />
            </div>
            <span>Interactive Deadlock Simulator</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Test custom scenarios or load preset OS deadlock states to observe detection algorithms in real time.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync DB */}
          <button
            onClick={() => syncWithDB(true)}
            disabled={isLoadingDB}
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-2"
          >
            {isLoadingDB ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>Sync Live DB</span>
          </button>

          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{showGuide ? 'Hide Guide' : 'Show Guide'}</span>
          </button>

          <button
            onClick={runDetection}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Run Detection</span>
            )}
          </button>

          <button
            onClick={resetSimulation}
            className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Guided Tour Banner */}
      {showGuide && (
        <div className="bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 p-6 rounded-3xl border border-amber-100 text-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>How to use the Simulator:</span>
            </h2>
            <button onClick={() => setShowGuide(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Dismiss
            </button>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            1. Select a <strong>Predefined Scenario</strong> below (Safe State vs Deadlock) or edit the matrices directly.<br />
            2. Any change you make here is <strong>automatically shared</strong> with Allocation, Deadlock Detection, Banker's Algorithm, and RAG.<br />
            3. Click <strong>Run Detection</strong> to analyze if the current state contains a deadlock!
          </p>
        </div>
      )}

      {/* Predefined Scenarios Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-3">
          Click to Load Predefined Educational Scenarios:
        </span>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              loadPreset('safe');
              setSimResult(null);
            }}
            className="px-5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold transition-all"
          >
            Scenario 1 &ndash; Safe Execution State
          </button>
          <button
            onClick={() => {
              loadPreset('deadlock');
              setSimResult(null);
            }}
            className="px-5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-extrabold transition-all"
          >
            Scenario 2 &ndash; Classic Deadlock
          </button>
          <button
            onClick={() => {
              loadPreset('simple');
              setSimResult(null);
            }}
            className="px-5 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-extrabold transition-all"
          >
            Scenario 3 &ndash; Simple 3-Process System
          </button>
        </div>
      </div>

      {/* Available Vector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
            Available Resources Vector [Available[j]]
          </h3>
          <button
            onClick={autoComputeAvailable}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Auto-Calculate from Allocations
          </button>
        </div>
        <div className="flex flex-wrap gap-4">
          {resources.map((r, idx) => (
            <div key={r} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 shadow-xs">
              <span className="font-mono font-black text-sm text-indigo-700">{r}:</span>
              <input
                type="number"
                min="0"
                value={available[idx] ?? 0}
                onChange={(e) => {
                  updateAvailableVal(idx, e.target.value);
                  setSimResult(null);
                }}
                className="w-20 bg-white border-2 border-indigo-300 rounded-xl py-2 px-3 text-center text-base font-mono font-extrabold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-1">
          <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider pl-1">
            Allocation Matrix (Currently Held Resources)
          </p>
          <EditableMatrix
            label="Allocation Matrix"
            color="indigo"
            processes={processes}
            resources={resources}
            matrix={allocation}
            onChange={(r, c, v) => {
              updateAllocationCell(r, c, v);
              setSimResult(null);
            }}
          />
        </div>

        <div className="space-y-1">
          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider pl-1">
            Request Matrix (Waiting Resources Requested)
          </p>
          <EditableMatrix
            label="Request Matrix"
            color="amber"
            processes={processes}
            resources={resources}
            matrix={request}
            onChange={(r, c, v) => {
              updateRequestCell(r, c, v);
              setSimResult(null);
            }}
          />
        </div>
      </div>

      {/* Simulation Result */}
      {simResult && (
        <div
          className={`p-8 rounded-3xl border-2 ${
            simResult.deadlockDetected
              ? 'bg-red-50/80 border-red-300 text-red-950 shadow-md'
              : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-md'
          }`}
        >
          <div className="flex items-start gap-4">
            {simResult.deadlockDetected ? (
              <AlertTriangle className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-3">
              <h3 className="font-black text-xl tracking-wide">
                {simResult.deadlockDetected
                  ? 'DEADLOCK DETECTED IN SIMULATION ⚠️'
                  : 'SAFE EXECUTION CONFIRMED ✅'}
              </h3>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {simResult.summaryExplanation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
