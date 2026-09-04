import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlaySquare, RotateCcw, CheckCircle, AlertTriangle, Sparkles, HelpCircle } from 'lucide-react';

const SimulationPage = () => {
  const { showNotification } = useAuth();

  const [processes, setProcesses] = useState(['P0', 'P1', 'P2']);
  const [resources, setResources] = useState(['R1', 'R2', 'R3']);
  const [available, setAvailable] = useState([1, 1, 0]);
  const [showGuide, setShowGuide] = useState(true);

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

  const [simResult, setSimResult] = useState(null);

  const loadScenario = (type) => {
    if (type === 'safe') {
      setProcesses(['P0', 'P1', 'P2']);
      setResources(['R1', 'R2', 'R3']);
      setAvailable([3, 3, 2]);
      setAllocation([
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2]
      ]);
      setRequest([
        [0, 0, 0],
        [1, 0, 1],
        [0, 0, 0]
      ]);
      showNotification('Loaded Scenario 1: Safe Execution State', 'info');
    } else if (type === 'deadlock') {
      setProcesses(['P0', 'P1']);
      setResources(['R1', 'R2']);
      setAvailable([0, 0]);
      setAllocation([
        [1, 0],
        [0, 1]
      ]);
      setRequest([
        [0, 1],
        [1, 0]
      ]);
      showNotification('Loaded Scenario 2: Simple Circular Deadlock', 'warning');
    } else if (type === 'multi') {
      setProcesses(['P0', 'P1', 'P2', 'P3']);
      setResources(['R1', 'R2', 'R3']);
      setAvailable([0, 0, 0]);
      setAllocation([
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 3],
        [2, 1, 1]
      ]);
      setRequest([
        [0, 0, 0],
        [2, 0, 2],
        [0, 0, 1],
        [1, 0, 0]
      ]);
      showNotification('Loaded Scenario 3: Multiple Resources Deadlock', 'warning');
    }
    setSimResult(null);
  };

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
    setSimResult(null);
  };

  const handleAvailableChange = (rIdx, val) => {
    const numVal = Math.max(0, parseInt(val) || 0);
    const newAvail = [...available];
    newAvail[rIdx] = numVal;
    setAvailable(newAvail);
    setSimResult(null);
  };

  const runDetection = async () => {
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
    }
  };

  const resetSimulation = () => {
    loadScenario('safe');
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{showGuide ? 'Hide Guide' : 'Show Guide'}</span>
          </button>

          <button
            onClick={runDetection}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-500/25 transition-all"
          >
            Run Detection
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

      {/* First Time User Guided Banner */}
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
            1. Select a <strong>Predefined Scenario</strong> below (Safe State vs Deadlock) to auto-fill matrices.<br />
            2. Or edit the large table cells below directly to change held resources (Allocation) and waiting resources (Request).<br />
            3. Click <strong>Run Detection</strong> to analyze if any process is stuck in a circular wait condition!
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
            onClick={() => loadScenario('safe')}
            className="px-5 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold transition-all"
          >
            Scenario 1 – Safe Execution State
          </button>
          <button
            onClick={() => loadScenario('deadlock')}
            className="px-5 py-2.5 rounded-2xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-extrabold transition-all"
          >
            Scenario 2 – Simple Circular Deadlock
          </button>
          <button
            onClick={() => loadScenario('multi')}
            className="px-5 py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-extrabold transition-all"
          >
            Scenario 3 – Multi-Resource Deadlock
          </button>
        </div>
      </div>

      {/* Available Resources Inputs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
          Available Resources Vector
        </h3>
        <div className="flex flex-wrap gap-4">
          {resources.map((r, idx) => (
            <div key={r} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 shadow-xs">
              <span className="font-mono font-black text-sm text-indigo-700">{r}:</span>
              <input
                type="number"
                min="0"
                value={available[idx]}
                onChange={(e) => handleAvailableChange(idx, e.target.value)}
                className="w-20 bg-white border-2 border-indigo-300 rounded-xl py-2 px-3 text-center text-base font-mono font-extrabold text-slate-900 focus:outline-none focus:border-indigo-600 shadow-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Enlarged Matrix Input Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-base text-indigo-700 border-b border-slate-100 pb-3">
            Allocation Matrix (Currently Held Resources)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-sm">
                  <th className="text-left py-3 px-2 font-bold">Process</th>
                  {resources.map(r => (
                    <th key={r} className="py-3 px-2 text-indigo-700 font-black text-base">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((p, pIdx) => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="text-left font-black text-slate-800 py-3 px-2 text-sm">{p}</td>
                    {resources.map((r, rIdx) => (
                      <td key={r} className="py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          value={allocation[pIdx] ? allocation[pIdx][rIdx] : 0}
                          onChange={(e) => handleCellChange('allocation', pIdx, rIdx, e.target.value)}
                          className="w-20 bg-indigo-50/50 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl py-2 px-2 text-center text-base font-extrabold text-indigo-900 focus:outline-none focus:bg-white transition-all shadow-xs"
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
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-base text-amber-700 border-b border-slate-100 pb-3">
            Request Matrix (Waiting Resources Requested)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-center">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-sm">
                  <th className="text-left py-3 px-2 font-bold">Process</th>
                  {resources.map(r => (
                    <th key={r} className="py-3 px-2 text-amber-700 font-black text-base">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((p, pIdx) => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="text-left font-black text-slate-800 py-3 px-2 text-sm">{p}</td>
                    {resources.map((r, rIdx) => (
                      <td key={r} className="py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          value={request[pIdx] ? request[pIdx][rIdx] : 0}
                          onChange={(e) => handleCellChange('request', pIdx, rIdx, e.target.value)}
                          className="w-20 bg-amber-50/50 border-2 border-amber-200 focus:border-amber-600 rounded-xl py-2 px-2 text-center text-base font-extrabold text-amber-900 focus:outline-none focus:bg-white transition-all shadow-xs"
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

      {/* Simulation Result Display */}
      {simResult && (
        <div className={`p-8 rounded-3xl border-2 ${
          simResult.deadlockDetected
            ? 'bg-red-50/80 border-red-300 text-red-950 shadow-md'
            : 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-md'
        }`}>
          <div className="flex items-start gap-4">
            {simResult.deadlockDetected ? (
              <AlertTriangle className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-3">
              <h3 className="font-black text-xl tracking-wide">
                {simResult.deadlockDetected ? 'DEADLOCK DETECTED IN SIMULATION ⚠️' : 'SAFE EXECUTION CONFIRMED ✅'}
              </h3>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">{simResult.summaryExplanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
