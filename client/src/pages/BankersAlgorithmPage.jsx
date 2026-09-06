import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Calculator,
  Play,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Plus,
  Trash2,
  HelpCircle
} from 'lucide-react';

const BankersAlgorithmPage = () => {
  const { showNotification } = useAuth();

  const [processes, setProcesses] = useState(['P0', 'P1', 'P2', 'P3', 'P4']);
  const [resources, setResources] = useState(['A', 'B', 'C']);
  const [available, setAvailable] = useState([3, 3, 2]);

  const [allocation, setAllocation] = useState([
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
  ]);

  const [maximum, setMaximum] = useState([
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
  ]);

  const [safetyResult, setSafetyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const [requestProcIdx, setRequestProcIdx] = useState(1);
  const [requestVec, setRequestVec] = useState([1, 0, 2]);
  const [requestResult, setRequestResult] = useState(null);

  // Preset Loaders
  const loadPreset = (type) => {
    if (type === 'safe5') {
      setProcesses(['P0', 'P1', 'P2', 'P3', 'P4']);
      setResources(['A', 'B', 'C']);
      setAvailable([3, 3, 2]);
      setAllocation([
        [0, 1, 0],
        [2, 0, 0],
        [3, 0, 2],
        [2, 1, 1],
        [0, 0, 2]
      ]);
      setMaximum([
        [7, 5, 3],
        [3, 2, 2],
        [9, 0, 2],
        [2, 2, 2],
        [4, 3, 3]
      ]);
      showNotification('Loaded Preset 1: Standard 5-Process Safe State', 'success');
    } else if (type === 'unsafe') {
      setProcesses(['P0', 'P1', 'P2']);
      setResources(['A', 'B', 'C']);
      setAvailable([1, 0, 0]);
      setAllocation([
        [2, 1, 1],
        [1, 2, 0],
        [0, 1, 2]
      ]);
      setMaximum([
        [4, 3, 2],
        [3, 4, 1],
        [2, 3, 4]
      ]);
      showNotification('Loaded Preset 2: Unsafe / Deadlock Prone State', 'warning');
    } else if (type === 'simple') {
      setProcesses(['P0', 'P1', 'P2']);
      setResources(['R1', 'R2']);
      setAvailable([2, 1]);
      setAllocation([
        [1, 0],
        [2, 0],
        [0, 1]
      ]);
      setMaximum([
        [3, 2],
        [4, 1],
        [1, 3]
      ]);
      showNotification('Loaded Preset 3: Simple 3-Process 2-Resource Example', 'info');
    }
    setSafetyResult(null);
    setRequestResult(null);
  };

  const handleCellChange = (matrixType, pIdx, rIdx, val) => {
    const numVal = Math.max(0, parseInt(val) || 0);
    if (matrixType === 'allocation') {
      const newAlloc = allocation.map((row, i) =>
        row.map((cell, j) => (i === pIdx && j === rIdx ? numVal : cell))
      );
      setAllocation(newAlloc);
    } else if (matrixType === 'maximum') {
      const newMax = maximum.map((row, i) =>
        row.map((cell, j) => (i === pIdx && j === rIdx ? numVal : cell))
      );
      setMaximum(newMax);
    }
    setSafetyResult(null);
  };

  const handleAvailableChange = (rIdx, val) => {
    const numVal = Math.max(0, parseInt(val) || 0);
    const newAvail = [...available];
    newAvail[rIdx] = numVal;
    setAvailable(newAvail);
    setSafetyResult(null);
  };

  const addProcess = () => {
    const pName = `P${processes.length}`;
    setProcesses([...processes, pName]);
    setAllocation([...allocation, new Array(resources.length).fill(0)]);
    setMaximum([...maximum, new Array(resources.length).fill(1)]);
    showNotification(`Added ${pName}`, 'info');
  };

  const removeProcess = () => {
    if (processes.length <= 1) {
      showNotification('Minimum 1 process required.', 'warning');
      return;
    }
    setProcesses(processes.slice(0, -1));
    setAllocation(allocation.slice(0, -1));
    setMaximum(maximum.slice(0, -1));
  };

  const addResource = () => {
    const rName = String.fromCharCode(65 + resources.length);
    setResources([...resources, rName]);
    setAvailable([...available, 1]);
    setAllocation(allocation.map(row => [...row, 0]));
    setMaximum(maximum.map(row => [...row, 1]));
    setRequestVec([...requestVec, 0]);
    showNotification(`Added Resource ${rName}`, 'info');
  };

  const handleRunSafety = async () => {
    setLoading(true);
    try {
      const res = await deadlockAPI.bankers({
        processes,
        resources,
        available,
        allocation,
        maximum,
        mode: 'safety'
      });
      setSafetyResult(res.data);
      if (res.data.isSafe) {
        showNotification(`Safe sequence found: ${res.data.safeSequence.join(' → ')}`, 'success');
      } else {
        showNotification('System is in an UNSAFE state!', 'warning');
      }
    } catch (err) {
      showNotification('Error running Banker\'s safety check.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRunRequest = async () => {
    try {
      const res = await deadlockAPI.bankers({
        processes,
        resources,
        available,
        allocation,
        maximum,
        processIndex: requestProcIdx,
        requestVector: requestVec,
        mode: 'request'
      });
      setRequestResult(res.data);
      if (res.data.granted) {
        showNotification(res.data.reason, 'success');
      } else {
        showNotification(res.data.reason, 'error');
      }
    } catch (err) {
      showNotification('Error evaluating resource request.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Calculator className="w-6 h-6" />
            </div>
            <span>Banker's Algorithm for Deadlock Avoidance</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Easily enter matrices, calculate Need values automatically, and test process resource requests in real-time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-2 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{showGuide ? 'Hide Guide' : 'Show How It Works'}</span>
          </button>

          <button
            onClick={handleRunSafety}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Run Safety Algorithm</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Guided Tour Banner for New Users */}
      {showGuide && (
        <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 p-6 rounded-3xl border border-indigo-100 text-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-indigo-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Quick Guide for New Users: What do these numbers mean?</span>
            </h2>
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Dismiss
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-xs space-y-1">
              <div className="font-extrabold text-indigo-600 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>1. Allocation Matrix</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                The resources each process is <strong>currently holding</strong> right now in memory.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-xs space-y-1">
              <div className="font-extrabold text-blue-600 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                <span>2. Maximum Matrix</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                The total maximum resources a process <strong>will ever request</strong> to finish its execution.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs space-y-1">
              <div className="font-extrabold text-amber-600 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>3. Need Matrix (Auto)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Calculated as <strong>Need = Max - Allocation</strong>. Resources the process still needs to complete.
              </p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs space-y-1">
              <div className="font-extrabold text-emerald-600 text-sm flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>4. Available Vector</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                The free unallocated resources <strong>currently available</strong> in the system to give out.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Preset Loaders & Matrix Controls Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
            1-Click Preset Examples (Instant Setup):
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadPreset('safe5')}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold transition-all"
            >
              Preset 1: Standard 5-Process Safe Example
            </button>
            <button
              onClick={() => loadPreset('unsafe')}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-extrabold transition-all"
            >
              Preset 2: Unsafe / Deadlock Example
            </button>
            <button
              onClick={() => loadPreset('simple')}
              className="px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-extrabold transition-all"
            >
              Preset 3: Simple 3-Process Example
            </button>
          </div>
        </div>

        {/* Matrix Dimensions Controls */}
        <div className="flex items-center gap-2 pt-2 md:pt-0">
          <button
            onClick={addProcess}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-indigo-600" />
            <span>+ Process</span>
          </button>
          <button
            onClick={removeProcess}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs border border-slate-200"
            title="Remove last process"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
          <button
            onClick={addResource}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>+ Resource</span>
          </button>
        </div>
      </div>

      {/* Available Resource Vector */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
            <span>Available Resources Vector [Available[j]]</span>
            <span className="text-xs font-normal text-slate-500 font-sans">(Current Free Instances)</span>
          </h3>
        </div>

        <div className="flex flex-wrap gap-4">
          {resources.map((resName, idx) => (
            <div key={resName} className="flex items-center gap-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl px-5 py-3 shadow-xs">
              <span className="font-mono font-black text-sm text-emerald-900">{resName}:</span>
              <input
                type="number"
                min="0"
                value={available[idx]}
                onChange={(e) => handleAvailableChange(idx, e.target.value)}
                className="w-20 bg-white border-2 border-emerald-300 rounded-xl py-2 px-3 text-center text-base font-mono font-extrabold text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-400/20 shadow-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Enlarged Matrices Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Allocation Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-indigo-700 flex items-center gap-2">
                <span>Allocation Matrix</span>
              </h3>
              <p className="text-xs text-slate-500">Currently assigned resources</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-mono font-bold text-xs border border-indigo-200">
              Editable
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center table-fixed">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-sm">
                  <th className="w-20 text-left py-3 px-2 font-bold">Process</th>
                  {resources.map(r => (
                    <th key={r} className="w-20 py-3 px-2 text-indigo-700 font-black text-base">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((p, i) => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="w-20 text-left font-black text-slate-800 py-3 px-2 text-sm">{p}</td>
                    {allocation[i].map((val, j) => (
                      <td key={j} className="w-20 py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          value={val}
                          onChange={(e) => handleCellChange('allocation', i, j, e.target.value)}
                          className="w-16 bg-indigo-50/50 border-2 border-indigo-200 focus:border-indigo-600 rounded-xl py-2 px-1 text-center text-base font-extrabold text-indigo-900 focus:outline-none focus:bg-white transition-all shadow-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Maximum Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-blue-700 flex items-center gap-2">
                <span>Maximum Matrix</span>
              </h3>
              <p className="text-xs text-slate-500">Max resources process may request</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs border border-blue-200">
              Editable
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center table-fixed">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-sm">
                  <th className="w-20 text-left py-3 px-2 font-bold">Process</th>
                  {resources.map(r => (
                    <th key={r} className="w-20 py-3 px-2 text-blue-700 font-black text-base">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((p, i) => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="w-20 text-left font-black text-slate-800 py-3 px-2 text-sm">{p}</td>
                    {maximum[i].map((val, j) => (
                      <td key={j} className="w-20 py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          value={val}
                          onChange={(e) => handleCellChange('maximum', i, j, e.target.value)}
                          className="w-16 bg-blue-50/50 border-2 border-blue-200 focus:border-blue-600 rounded-xl py-2 px-1 text-center text-base font-extrabold text-blue-900 focus:outline-none focus:bg-white transition-all shadow-xs"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Need Matrix (Auto Calculated) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h3 className="font-black text-base text-amber-700 flex items-center gap-2">
                <span>Need Matrix</span>
              </h3>
              <p className="text-xs text-slate-500 font-mono font-bold">Need = Maximum - Allocation</p>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-mono font-bold text-xs border border-amber-200">
              Auto Calculated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center table-fixed">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-mono text-sm">
                  <th className="w-20 text-left py-3 px-2 font-bold">Process</th>
                  {resources.map(r => (
                    <th key={r} className="w-20 py-3 px-2 text-amber-700 font-black text-base">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processes.map((p, i) => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="w-20 text-left font-black text-slate-800 py-3 px-2 text-sm">{p}</td>
                    {maximum[i].map((maxVal, j) => {
                      const allocVal = allocation[i] ? allocation[i][j] || 0 : 0;
                      const needVal = Math.max(0, maxVal - allocVal);
                      const isInvalid = maxVal < allocVal;
                      return (
                        <td key={j} className="w-20 py-2 px-1">
                          <div className={`w-16 py-2 text-center text-base font-black rounded-xl border-2 font-mono mx-auto ${
                            isInvalid
                              ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
                              : 'bg-amber-50 text-amber-900 border-amber-200'
                          }`}>
                            {needVal}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Run Safety Check Big Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleRunSafety}
          disabled={loading}
          className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Play className="w-6 h-6 fill-white" />
              <span>Evaluate Banker's Safety Sequence Now</span>
            </>
          )}
        </button>
      </div>

      {/* Safety Result Display */}
      {safetyResult && (
        <div className="space-y-6">
          <div className={`p-8 rounded-3xl border-2 ${
            safetyResult.isSafe
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-md'
              : 'bg-red-50/80 border-red-300 text-red-950 shadow-md'
          }`}>
            <div className="flex items-start gap-4">
              {safetyResult.isSafe ? (
                <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-3">
                <h2 className="text-xl font-black tracking-wide flex items-center gap-2">
                  {safetyResult.isSafe ? 'SYSTEM IS IN A SAFE STATE ✅' : 'SYSTEM IS IN AN UNSAFE STATE ⚠️'}
                </h2>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">{safetyResult.explanation}</p>

                {safetyResult.isSafe && (
                  <div className="pt-4 flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-extrabold text-emerald-800">Safe Execution Sequence:</span>
                    <div className="flex items-center gap-2 font-mono text-sm flex-wrap">
                      {safetyResult.safeSequence.map((proc, idx) => (
                        <React.Fragment key={proc}>
                          <span className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black text-sm shadow-xs border border-emerald-700">
                            {proc}
                          </span>
                          {idx < safetyResult.safeSequence.length - 1 && (
                            <ArrowRight className="w-5 h-5 text-emerald-700 font-bold" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step-by-Step Banker's Algorithm Calculations Log */}
          {safetyResult.steps && safetyResult.steps.length > 0 && (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <span>Step-by-Step Banker's Safety Calculations Log</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">
                  {safetyResult.steps.length} Steps Executed
                </span>
              </div>

              <div className="space-y-4">
                {safetyResult.steps.map((st, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold">
                        Step {st.step}: {st.process ? `Evaluating ${st.process}` : st.title}
                      </span>
                      {st.newWork && (
                        <span className="text-emerald-700 font-black text-xs">
                          Work = [{st.newWork.join(', ')}]
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 text-sm font-sans font-medium leading-relaxed pt-1">
                      {st.description}
                    </p>
                    {st.currentSequence && st.currentSequence.length > 0 && (
                      <div className="pt-2 flex items-center gap-2 font-sans font-bold text-slate-600">
                        <span>Current Sequence Progress:</span>
                        <span className="text-emerald-700 font-mono font-black">
                          {st.currentSequence.join(' → ')}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Resource Request Algorithm */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
                Simulate Additional Resource Request (Resource-Request Algorithm)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Test if allocating extra resources to a process right now will keep the system safe.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                <label className="block font-bold text-slate-700 mb-2">Select Requesting Process:</label>
                <select
                  value={requestProcIdx}
                  onChange={(e) => setRequestProcIdx(parseInt(e.target.value))}
                  className="bg-white border-2 border-indigo-300 rounded-xl px-4 py-2.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-mono font-black text-base shadow-xs"
                >
                  {processes.map((p, idx) => (
                    <option key={p} value={idx}>{p}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                {resources.map((r, rIdx) => (
                  <div key={r}>
                    <label className="block font-bold text-slate-700 mb-2">Request {r}:</label>
                    <input
                      type="number"
                      min="0"
                      value={requestVec[rIdx] || 0}
                      onChange={(e) => {
                        const newVec = [...requestVec];
                        newVec[rIdx] = parseInt(e.target.value) || 0;
                        setRequestVec(newVec);
                      }}
                      className="w-20 bg-white border-2 border-indigo-300 rounded-xl py-2 px-3 text-center text-slate-900 font-mono font-black text-base focus:outline-none focus:border-indigo-600 shadow-xs"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleRunRequest}
                className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-500/20 transition-all"
              >
                Test Request Grant
              </button>
            </div>

            {requestResult && (
              <div className={`p-5 rounded-2xl border-2 text-sm font-mono mt-3 ${
                requestResult.granted
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-red-50 border-red-300 text-red-900'
              }`}>
                <p className="font-extrabold">{requestResult.reason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankersAlgorithmPage;
