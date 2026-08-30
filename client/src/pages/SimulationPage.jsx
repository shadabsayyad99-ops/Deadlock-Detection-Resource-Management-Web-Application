import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { PlaySquare, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

const SimulationPage = () => {
  const { showNotification } = useAuth();

  const [processes, setProcesses] = useState(['P1', 'P2', 'P3']);
  const [resources, setResources] = useState(['R1', 'R2', 'R3']);
  const [available, setAvailable] = useState([1, 1, 0]);

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
      setProcesses(['P1', 'P2', 'P3']);
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
      showNotification('Loaded Scenario 1: Safe State', 'info');
    } else if (type === 'deadlock') {
      setProcesses(['P1', 'P2']);
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
      showNotification('Loaded Scenario 2: Simple Deadlock', 'warning');
    } else if (type === 'multi') {
      setProcesses(['P1', 'P2', 'P3', 'P4']);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <PlaySquare className="w-5 h-5 text-amber-600" />
            <span>Interactive Deadlock Simulator</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Load preset OS deadlock scenarios or customize resource allocations on the fly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={runDetection}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20"
          >
            Run Detection
          </button>
          <button
            onClick={resetSimulation}
            className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Predefined Scenarios Selector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-3">
          Predefined Educational Scenarios:
        </span>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => loadScenario('safe')}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-all"
          >
            Scenario 1 – Safe State
          </button>
          <button
            onClick={() => loadScenario('deadlock')}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold transition-all"
          >
            Scenario 2 – Simple Circular Deadlock
          </button>
          <button
            onClick={() => loadScenario('multi')}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-all"
          >
            Scenario 3 – Multi-Resource Deadlock
          </button>
        </div>
      </div>

      {/* Simulation Result */}
      {simResult && (
        <div className={`p-6 rounded-3xl border ${
          simResult.deadlockDetected ? 'bg-red-50 border-red-200 text-red-900 shadow-sm' : 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
        }`}>
          <div className="flex items-start gap-3">
            {simResult.deadlockDetected ? (
              <AlertTriangle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <h3 className="font-bold text-sm">{simResult.deadlockDetected ? 'DEADLOCK CONFIRMED' : 'SAFE EXECUTION'}</h3>
              <p className="text-xs mt-1 font-medium">{simResult.summaryExplanation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationPage;
