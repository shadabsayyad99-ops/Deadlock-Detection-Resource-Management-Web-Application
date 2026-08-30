import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Calculator, Play, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const BankersAlgorithmPage = () => {
  const { showNotification } = useAuth();

  const [processes] = useState(['P1', 'P2', 'P3', 'P4', 'P5']);
  const [resources] = useState(['A', 'B', 'C']);
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

  const [requestProcIdx, setRequestProcIdx] = useState(1);
  const [requestVec, setRequestVec] = useState([1, 0, 2]);
  const [requestResult, setRequestResult] = useState(null);

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <span>Banker's Algorithm for Deadlock Avoidance</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluate safe states, calculate Need matrices, and test resource requests before allocation.
          </p>
        </div>

        <button
          onClick={handleRunSafety}
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Check Safety Sequence</span>
            </>
          )}
        </button>
      </div>

      {/* Matrix Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
        {/* Allocation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-indigo-600 mb-3 uppercase tracking-wider">Allocation Matrix</h3>
          <table className="w-full text-center font-mono">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="text-left py-1">Process</th>
                {resources.map(r => <th key={r}>{r}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processes.map((p, i) => (
                <tr key={p}>
                  <td className="text-left font-bold text-slate-700 py-1.5">{p}</td>
                  {allocation[i].map((val, j) => <td key={j} className="text-indigo-600 font-bold">{val}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Max */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-blue-600 mb-3 uppercase tracking-wider">Maximum Matrix</h3>
          <table className="w-full text-center font-mono">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="text-left py-1">Process</th>
                {resources.map(r => <th key={r}>{r}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processes.map((p, i) => (
                <tr key={p}>
                  <td className="text-left font-bold text-slate-700 py-1.5">{p}</td>
                  {maximum[i].map((val, j) => <td key={j} className="text-blue-600 font-bold">{val}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Need Matrix */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-amber-600 mb-3 uppercase tracking-wider">Need Matrix (Max - Alloc)</h3>
          <table className="w-full text-center font-mono">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400">
                <th className="text-left py-1">Process</th>
                {resources.map(r => <th key={r}>{r}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processes.map((p, i) => (
                <tr key={p}>
                  <td className="text-left font-bold text-slate-700 py-1.5">{p}</td>
                  {maximum[i].map((maxVal, j) => {
                    const needVal = Math.max(0, maxVal - allocation[i][j]);
                    return <td key={j} className="text-amber-600 font-bold">{needVal}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Safety Result Display */}
      {safetyResult && (
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border ${
            safetyResult.isSafe
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-sm'
              : 'bg-red-50 border-red-200 text-red-900 shadow-sm'
          }`}>
            <div className="flex items-start gap-4">
              {safetyResult.isSafe ? (
                <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0 mt-1" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-red-600 shrink-0 mt-1" />
              )}
              <div className="space-y-2">
                <h2 className="text-lg font-black tracking-wide">
                  {safetyResult.isSafe ? 'SYSTEM IS IN A SAFE STATE' : 'SYSTEM IS IN AN UNSAFE STATE'}
                </h2>
                <p className="text-xs font-medium">{safetyResult.explanation}</p>

                {safetyResult.isSafe && (
                  <div className="pt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-emerald-700">Safe Execution Sequence:</span>
                    <div className="flex items-center gap-2 font-mono text-xs">
                      {safetyResult.safeSequence.map((proc, idx) => (
                        <React.Fragment key={proc}>
                          <span className="px-3 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                            {proc}
                          </span>
                          {idx < safetyResult.safeSequence.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-emerald-600" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Test Resource Request Algorithm */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              Simulate Resource Request (Resource-Request Algorithm)
            </h3>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Select Process:</label>
                <select
                  value={requestProcIdx}
                  onChange={(e) => setRequestProcIdx(parseInt(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                >
                  {processes.map((p, idx) => (
                    <option key={p} value={idx}>{p}</option>
                  ))}
                </select>
              </div>

              {resources.map((r, rIdx) => (
                <div key={r}>
                  <label className="block font-bold text-slate-600 mb-1">Request {r}:</label>
                  <input
                    type="number"
                    min="0"
                    value={requestVec[rIdx] || 0}
                    onChange={(e) => {
                      const newVec = [...requestVec];
                      newVec[rIdx] = parseInt(e.target.value) || 0;
                      setRequestVec(newVec);
                    }}
                    className="w-16 bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-center text-slate-800 font-mono font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}

              <button
                onClick={handleRunRequest}
                className="mt-5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md shadow-indigo-500/20"
              >
                Test Request Grant
              </button>
            </div>

            {requestResult && (
              <div className={`p-4 rounded-2xl border text-xs font-mono mt-3 ${
                requestResult.granted
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <p className="font-bold">{requestResult.reason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BankersAlgorithmPage;
