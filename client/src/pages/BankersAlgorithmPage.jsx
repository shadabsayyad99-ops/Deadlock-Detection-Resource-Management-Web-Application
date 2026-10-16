import React, { useState, useEffect, useMemo } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import {
  Calculator,
  Play,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Database,
  RefreshCw,
  SendHorizontal,
  ChevronRight
} from 'lucide-react';
import EditableMatrix from '../components/EditableMatrix';

const BankersAlgorithmPage = () => {
  const { showNotification } = useAuth();
  const {
    processes,
    resources,
    available,
    allocation,
    maximum,
    isLoadingDB,
    syncWithDB,
    loadPreset,
    updateAllocationCell,
    updateMaximumCell,
    updateAvailableVal,
    autoComputeAvailable,
  } = useSystemState();

  const [safetyResult, setSafetyResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Resource Request Algorithm state
  const [requestProcIdx, setRequestProcIdx] = useState(0);
  const [requestVec, setRequestVec] = useState([]);
  const [requestResult, setRequestResult] = useState(null);
  const [evaluatingRequest, setEvaluatingRequest] = useState(false);

  // Keep request vector sized to resources
  useEffect(() => {
    setRequestVec(new Array(resources.length).fill(0));
    if (requestProcIdx >= processes.length) {
      setRequestProcIdx(0);
    }
  }, [resources.length, processes.length]);

  // Compute live Need matrix reactively: Need[i][j] = Max - Allocation
  const needMatrix = useMemo(() => {
    return processes.map((_, i) =>
      resources.map((_, j) => {
        const maxVal = Number(maximum?.[i]?.[j]) || 0;
        const allocVal = Number(allocation?.[i]?.[j]) || 0;
        return Math.max(0, maxVal - allocVal);
      })
    );
  }, [processes, resources, maximum, allocation]);

  // Run Banker's Safety Algorithm
  const handleRunSafety = async () => {
    if (!processes.length || !resources.length) {
      showNotification('Please configure processes and resources first.', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await deadlockAPI.bankers({
        processes,
        resources,
        available,
        allocation,
        maximum,
        mode: 'safety',
      });
      setSafetyResult(res.data);
      if (res.data.isSafe) {
        showNotification(`Safe sequence found: ${res.data.safeSequence.join(' → ')}`, 'success');
      } else {
        showNotification('System is in an UNSAFE state! Deadlock possible.', 'warning');
      }
    } catch (err) {
      showNotification('Error evaluating Banker\'s Safety algorithm.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run Banker's Resource-Request Algorithm
  const handleRunRequest = async () => {
    if (!processes.length || !resources.length) return;
    setEvaluatingRequest(true);
    try {
      const res = await deadlockAPI.bankers({
        processes,
        resources,
        available,
        allocation,
        maximum,
        processIndex: requestProcIdx,
        requestVector: requestVec,
        mode: 'request',
      });
      setRequestResult(res.data);
      if (res.data.granted) {
        showNotification(res.data.reason, 'success');
      } else {
        showNotification(res.data.reason, 'warning');
      }
    } catch (err) {
      showNotification('Error evaluating resource request.', 'error');
    } finally {
      setEvaluatingRequest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl">
              <Calculator className="w-6 h-6" />
            </div>
            <span>Banker's Algorithm (Deadlock Avoidance)</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Simulate OS resource safety checks, dynamically auto-compute the Need Matrix, and evaluate real-time resource requests.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync DB */}
          <button
            onClick={() => {
              syncWithDB(true);
              setSafetyResult(null);
              setRequestResult(null);
            }}
            disabled={isLoadingDB}
            className="px-4 py-2.5 rounded-2xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 flex items-center gap-2 transition-all shadow-xs"
          >
            {isLoadingDB ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>Sync Live DB</span>
          </button>

          {/* Guide Toggle */}
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 flex items-center gap-2 transition-all shadow-xs"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" />
            <span>{showGuide ? 'Hide Guide' : 'How It Works'}</span>
          </button>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  loadPreset(e.target.value);
                  setSafetyResult(null);
                  setRequestResult(null);
                }
              }}
              defaultValue=""
              className="bg-transparent text-xs text-slate-700 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Load Preset Example...</option>
              <option value="safe">Banker's Safe State (5 Processes)</option>
              <option value="deadlock">Unsafe State (Deadlock Prone)</option>
              <option value="simple">Simple 3-Process System</option>
            </select>
          </div>

          {/* Run Safety Check */}
          <button
            onClick={handleRunSafety}
            disabled={loading}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-5 h-5 fill-white" />
                <span>Run Safety Algorithm</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Guide Card (Collapsible) */}
      {showGuide && (
        <div className="bg-gradient-to-r from-indigo-50 via-sky-50 to-emerald-50 p-6 rounded-3xl border border-indigo-100 text-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>OS Educational Summary: Banker's Avoidance Theory</span>
            </h2>
            <button onClick={() => setShowGuide(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Close
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-white p-4 rounded-2xl border border-indigo-100 space-y-1 shadow-xs">
              <div className="font-extrabold text-indigo-700">1. Allocation Matrix</div>
              <p className="text-slate-600">Instances currently allocated to each process.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-blue-100 space-y-1 shadow-xs">
              <div className="font-extrabold text-blue-700">2. Maximum Matrix</div>
              <p className="text-slate-600">Maximum instances process may ever demand to finish.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-amber-100 space-y-1 shadow-xs">
              <div className="font-extrabold text-amber-700">3. Need Matrix (Auto)</div>
              <p className="text-slate-600">$\text{Need}[i][j] = \text{Max}[i][j] - \text{Alloc}[i][j]$.</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-1 shadow-xs">
              <div className="font-extrabold text-emerald-700">4. Available Vector</div>
              <p className="text-slate-600">Unallocated instances ready for assignment.</p>
            </div>
          </div>
        </div>
      )}

      {/* Available Vector Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-emerald-800 uppercase tracking-wider">
            Available Resource Vector [Available[j]]
          </h3>
          <span className="text-[10px] text-slate-400 font-bold">Unallocated free instances right now</span>
        </div>
        <div className="flex flex-wrap gap-3">
          {resources.map((r, idx) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">{r}</span>
              <input
                type="number"
                min="0"
                value={available[idx] ?? 0}
                onChange={(e) => {
                  updateAvailableVal(idx, e.target.value);
                  setSafetyResult(null);
                  setRequestResult(null);
                }}
                className="w-16 text-center bg-emerald-50 border border-emerald-200 rounded-xl px-2 py-2 text-emerald-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          ))}
          {resources.length === 0 && (
            <span className="text-xs text-slate-400 italic">No resources defined. Click "Sync Live DB".</span>
          )}
        </div>
      </div>

      {/* Three Matrices: Allocation, Maximum, and Need (Auto Computed) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Allocation Matrix */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
              Allocation Matrix (Currently Held)
            </p>
            <span className="text-[10px] text-slate-400 font-mono">Editable</span>
          </div>
          <EditableMatrix
            label="Allocation Matrix"
            color="indigo"
            processes={processes}
            resources={resources}
            matrix={allocation}
            onChange={(r, c, v) => {
              updateAllocationCell(r, c, v);
              setSafetyResult(null);
              setRequestResult(null);
            }}
          />
        </div>

        {/* Maximum Matrix */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
              Maximum Matrix (Max Demand)
            </p>
            <span className="text-[10px] text-slate-400 font-mono">Editable</span>
          </div>
          <EditableMatrix
            label="Maximum Matrix"
            color="blue"
            processes={processes}
            resources={resources}
            matrix={maximum}
            onChange={(r, c, v) => {
              updateMaximumCell(r, c, v);
              setSafetyResult(null);
              setRequestResult(null);
            }}
          />
        </div>

        {/* Need Matrix (Read-Only, Auto Computed) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-1">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
              Need Matrix (Auto: Max &minus; Alloc)
            </p>
            <span className="text-[10px] text-amber-600 font-mono font-bold">Auto-Calculated</span>
          </div>
          <EditableMatrix
            label="Need Matrix (Need = Max - Alloc)"
            color="amber"
            processes={processes}
            resources={resources}
            matrix={needMatrix}
            readOnly={true}
          />
        </div>
      </div>

      {/* Big Action: Evaluate Safety Button */}
      <div className="flex justify-center pt-2">
        <button
          onClick={handleRunSafety}
          disabled={loading}
          className="w-full sm:w-auto px-10 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-base shadow-xl shadow-emerald-500/25 transition-all flex items-center justify-center gap-3 cursor-pointer"
        >
          {loading ? (
            <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
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
          {/* Status Banner */}
          <div
            className={`p-8 rounded-3xl border-2 ${
              safetyResult.isSafe
                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 shadow-md'
                : 'bg-red-50/90 border-red-300 text-red-950 shadow-md'
            }`}
          >
            <div className="flex items-start gap-4">
              {safetyResult.isSafe ? (
                <CheckCircle className="w-10 h-10 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-3">
                <h2 className="text-xl font-black tracking-wide">
                  {safetyResult.isSafe ? 'SYSTEM IS IN A SAFE STATE ✅' : 'SYSTEM IS IN AN UNSAFE STATE ⚠️'}
                </h2>
                <p className="text-sm font-medium text-slate-800 leading-relaxed">
                  {safetyResult.explanation}
                </p>

                {safetyResult.isSafe && (
                  <div className="pt-3 flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-black text-emerald-900 uppercase tracking-wider">
                      Safe Execution Sequence:
                    </span>
                    <div className="flex items-center gap-2 font-mono flex-wrap">
                      {safetyResult.safeSequence.map((p, idx) => (
                        <React.Fragment key={p}>
                          <span className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white font-black text-sm shadow-xs border border-emerald-700">
                            {p}
                          </span>
                          {idx < safetyResult.safeSequence.length - 1 && (
                            <ArrowRight className="w-4 h-4 text-emerald-700 font-bold" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step-by-Step Execution Trace */}
          {safetyResult.steps?.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ChevronRight className="w-4 h-4 text-emerald-600" />
                <span>Banker's Safety Step-by-Step Execution Trace</span>
              </h3>
              <div className="space-y-3">
                {safetyResult.steps.map((s, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1 font-mono"
                  >
                    <div className="flex items-center justify-between text-slate-700 font-bold border-b border-slate-200 pb-1.5 mb-1.5">
                      <span className="text-emerald-700">
                        Step {s.step}: {s.title || (s.process ? `Allocating to Process ${s.process}` : '')}
                      </span>
                      {s.canAllocate && (
                        <span className="text-emerald-600 font-sans font-bold">
                          ✓ NEED &le; WORK
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 font-sans leading-normal font-medium">{s.description}</p>
                    {s.newWork && (
                      <p className="text-slate-500 font-sans pt-0.5">
                        New Work Vector: [{s.newWork.join(', ')}]
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resource Request Algorithm Simulator */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div>
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <SendHorizontal className="w-5 h-5 text-indigo-600" />
            <span>Banker's Resource-Request Algorithm Tester</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Test if allocating additional resources to a process right now leaves the system in a safe state.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs">
          {/* Process Selector */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl space-y-1.5">
            <label className="block font-bold text-slate-700">Requesting Process:</label>
            <select
              value={requestProcIdx}
              onChange={(e) => {
                setRequestProcIdx(Number(e.target.value));
                setRequestResult(null);
              }}
              className="bg-white border-2 border-indigo-200 rounded-xl px-3 py-1.5 text-slate-900 focus:outline-none focus:border-indigo-600 font-mono font-bold text-sm"
            >
              {processes.map((p, idx) => (
                <option key={p} value={idx}>{p}</option>
              ))}
            </select>
          </div>

          {/* Request Vector Inputs */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl">
            {resources.map((r, rIdx) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <span className="font-bold text-slate-600 text-[10px]">Req {r}:</span>
                <input
                  type="number"
                  min="0"
                  value={requestVec[rIdx] ?? 0}
                  onChange={(e) => {
                    const newVec = [...requestVec];
                    newVec[rIdx] = Math.max(0, parseInt(e.target.value) || 0);
                    setRequestVec(newVec);
                    setRequestResult(null);
                  }}
                  className="w-16 bg-white border border-indigo-300 rounded-xl py-1 px-2 text-center text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-indigo-600"
                />
              </div>
            ))}
          </div>

          {/* Evaluate Button */}
          <button
            onClick={handleRunRequest}
            disabled={evaluatingRequest}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            {evaluatingRequest ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Evaluate Resource Request</span>
            )}
          </button>
        </div>

        {/* Request Result Display */}
        {requestResult && (
          <div
            className={`p-5 rounded-2xl border-2 text-xs font-mono ${
              requestResult.granted
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-red-50 border-red-300 text-red-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-black text-sm">
                {requestResult.granted ? 'REQUEST GRANTED ✅' : 'REQUEST DENIED ❌'}
              </span>
            </div>
            <p className="mt-1 font-sans text-xs leading-relaxed">{requestResult.reason}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankersAlgorithmPage;
