import React, { useState, useEffect } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GitFork, AlertTriangle, CheckCircle, RefreshCw, Plus, Trash2, Sparkles, Bot } from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const ResourceAllocationGraphPage = () => {
  const { showNotification } = useAuth();

  const [processes, setProcesses] = useState(['P0', 'P1', 'P2']);
  const [resources, setResources] = useState(['R1', 'R2', 'R3']);
  const [totalInstances, setTotalInstances] = useState([2, 1, 2]);

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

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [cycleResult, setCycleResult] = useState(null);
  const [recoveryLog, setRecoveryLog] = useState(null);

  // Preset Loaders
  const loadPreset = (type) => {
    if (type === 'safe') {
      setProcesses(['P0', 'P1', 'P2']);
      setResources(['R1', 'R2', 'R3']);
      setTotalInstances([3, 3, 2]);
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
      showNotification('Loaded Safe Graph Preset (No Deadlock Cycles)', 'success');
    } else if (type === 'deadlock') {
      setProcesses(['P0', 'P1']);
      setResources(['R1', 'R2']);
      setTotalInstances([1, 1]);
      setAllocation([
        [1, 0],
        [0, 1]
      ]);
      setRequest([
        [0, 1],
        [1, 0]
      ]);
      showNotification('Loaded Circular Deadlock Graph Preset', 'warning');
    } else if (type === 'multi') {
      setProcesses(['P0', 'P1', 'P2', 'P3']);
      setResources(['R1', 'R2', 'R3']);
      setTotalInstances([2, 2, 2]);
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
      showNotification('Loaded Multi-Process Multi-Resource Graph Preset', 'info');
    }
    setRecoveryLog(null);
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
    setRecoveryLog(null);
  };

  const handleTotalInstanceChange = (rIdx, val) => {
    const numVal = Math.max(1, parseInt(val) || 1);
    const newTotals = [...totalInstances];
    newTotals[rIdx] = numVal;
    setTotalInstances(newTotals);
    setRecoveryLog(null);
  };

  const addProcess = () => {
    const pName = `P${processes.length}`;
    setProcesses([...processes, pName]);
    setAllocation([...allocation, new Array(resources.length).fill(0)]);
    setRequest([...request, new Array(resources.length).fill(0)]);
    showNotification(`Added process ${pName}`, 'info');
  };

  const removeProcess = () => {
    if (processes.length <= 1) return;
    setProcesses(processes.slice(0, -1));
    setAllocation(allocation.slice(0, -1));
    setRequest(request.slice(0, -1));
  };

  const addResource = () => {
    const rName = `R${resources.length + 1}`;
    setResources([...resources, rName]);
    setTotalInstances([...totalInstances, 1]);
    setAllocation(allocation.map(row => [...row, 0]));
    setRequest(request.map(row => [...row, 0]));
    showNotification(`Added resource ${rName}`, 'info');
  };

  const buildGraph = async () => {
    try {
      const res = await deadlockAPI.cycles({
        processes,
        resources,
        allocation,
        request,
        totalInstances
      });
      setCycleResult(res.data);

      const flowNodes = [];
      const flowEdges = [];

      // Calculate process allocation totals for node positioning
      processes.forEach((p, idx) => {
        flowNodes.push({
          id: p,
          data: { label: `${p}` },
          position: { x: 120, y: 80 + idx * 130 },
          style: {
            background: '#ffffff',
            color: '#312e81',
            border: '3px solid #6366f1',
            borderRadius: '50%',
            width: 75,
            height: 75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '15px',
            boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.2)'
          }
        });
      });

      resources.forEach((r, idx) => {
        const total = totalInstances[idx] !== undefined ? totalInstances[idx] : 1;
        // calculate allocated
        let allocSum = 0;
        processes.forEach((_, pIdx) => {
          if (allocation[pIdx] && allocation[pIdx][idx] !== undefined) {
            allocSum += allocation[pIdx][idx];
          }
        });
        const avail = Math.max(0, total - allocSum);

        flowNodes.push({
          id: r,
          data: { label: `${r}\n[Avail: ${avail} / Total: ${total}]` },
          position: { x: 500, y: 80 + idx * 130 },
          style: {
            background: '#ffffff',
            color: '#78350f',
            border: '3px solid #f59e0b',
            borderRadius: '16px',
            width: 140,
            height: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontWeight: '800',
            fontSize: '13px',
            whiteSpace: 'pre-wrap',
            boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.2)'
          }
        });
      });

      res.data.edges.forEach((e) => {
        const isAlloc = e.type === 'allocation';
        const isCycleEdge = res.data.hasCycle && res.data.cycles.some(cPath => cPath.includes(e.source) && cPath.includes(e.target));

        flowEdges.push({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          style: {
            stroke: isCycleEdge ? '#dc2626' : (isAlloc ? '#10b981' : '#f59e0b'),
            strokeWidth: isCycleEdge ? 4 : 2.5
          },
          labelStyle: { fill: isCycleEdge ? '#dc2626' : (isAlloc ? '#059669' : '#d97706'), fontSize: 12, fontWeight: '900' }
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);

      if (res.data.hasCycle) {
        showNotification('Deadlock Cycle Detected in Resource Allocation Graph!', 'warning');
      } else {
        showNotification('No cycles detected in Resource Allocation Graph.', 'success');
      }
    } catch (err) {
      showNotification('Failed to generate Resource Allocation Graph', 'error');
    }
  };

  const autoRecoverFromRAG = async () => {
    try {
      // Calculate available vector
      const avail = resources.map((_, rIdx) => {
        let total = totalInstances[rIdx] || 1;
        let used = 0;
        processes.forEach((_, pIdx) => {
          used += allocation[pIdx][rIdx] || 0;
        });
        return Math.max(0, total - used);
      });

      const res = await deadlockAPI.recover({
        processes,
        resources,
        available: avail,
        allocation,
        request,
        strategy: 'auto'
      });

      setRecoveryLog(res.data);
      if (res.data.deadlockResolved) {
        showNotification('Automated Recovery Successful! Deadlock resolved.', 'success');
        if (res.data.newProcesses) {
          setProcesses(res.data.newProcesses);
          setAllocation(res.data.newAllocation);
          setRequest(res.data.newRequest);
        }
      }
    } catch (err) {
      showNotification('Error running automated recovery from RAG.', 'error');
    }
  };

  useEffect(() => {
    buildGraph();
  }, [processes, resources, allocation, request, totalInstances]);

  const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
              <GitFork className="w-6 h-6" />
            </div>
            <span>Interactive Resource Allocation Graph (RAG)</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Visual directed dependency graph built dynamically from user process and resource inputs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={autoRecoverFromRAG}
            className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <Bot className="w-4 h-4" />
            <span>🤖 Auto Recover System</span>
          </button>
          <button
            onClick={buildGraph}
            className="px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Preset Scenario Loaders & Graph Controls */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
            1-Click Graph Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadPreset('safe')}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold transition-all"
            >
              Preset 1: Safe Graph (No Cycles)
            </button>
            <button
              onClick={() => loadPreset('deadlock')}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-extrabold transition-all"
            >
              Preset 2: Circular Deadlock Cycle
            </button>
            <button
              onClick={() => loadPreset('multi')}
              className="px-4 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-extrabold transition-all"
            >
              Preset 3: Multi-Resource Graph
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          >
            <Trash2 className="w-4 h-4 text-red-500" />
          </button>
          <button
            onClick={addResource}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs border border-slate-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-amber-600" />
            <span>+ Resource</span>
          </button>
        </div>
      </div>

      {/* Cycle Status Banner */}
      {cycleResult && (
        <div className={`p-6 rounded-3xl border-2 text-sm ${
          cycleResult.hasCycle ? 'bg-red-50 border-red-300 text-red-950 shadow-md' : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-sm'
        }`}>
          <div className="flex items-start gap-4">
            {cycleResult.hasCycle ? (
              <AlertTriangle className="w-8 h-8 text-red-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-8 h-8 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-2">
              <h3 className="font-black text-base">
                {cycleResult.hasCycle ? '⚠️ DEADLOCK CIRCULAR WAIT DETECTED IN RAG GRAPH' : '✅ NO DEADLOCK CYCLES DETECTED'}
              </h3>
              <p className="text-xs font-medium text-slate-800 leading-relaxed">{cycleResult.educationalNote}</p>
              {cycleResult.cycles && cycleResult.cycles.length > 0 && (
                <div className="pt-2 flex items-center gap-2 font-mono font-black text-xs text-red-800 flex-wrap">
                  <span>Detected Cycle Paths:</span>
                  {cycleResult.cycles.map((cPath, idx) => (
                    <span key={idx} className="px-3 py-1 bg-red-600 text-white rounded-lg border border-red-700">
                      {cPath}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Total Resource Instances Input */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
          Total Resource Instances (Total Units in System)
        </h3>
        <div className="flex flex-wrap gap-4">
          {resources.map((resName, idx) => (
            <div key={resName} className="flex items-center gap-3 bg-amber-50/60 border border-amber-200 rounded-2xl px-5 py-3 shadow-xs">
              <span className="font-mono font-black text-sm text-amber-900">{resName}:</span>
              <input
                type="number"
                min="1"
                value={totalInstances[idx] || 1}
                onChange={(e) => handleTotalInstanceChange(idx, e.target.value)}
                className="w-20 bg-white border-2 border-amber-300 rounded-xl py-2 px-3 text-center text-base font-mono font-extrabold text-slate-900 focus:outline-none focus:border-amber-600 shadow-xs"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Editable Matrix Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Allocation Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-base text-indigo-700 border-b border-slate-100 pb-3">
            Allocation Edges (Resource → Process)
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
            Request Edges (Process → Resource)
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

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-xs font-mono bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-white border-2 border-indigo-600 inline-block"></span>
          <span className="text-slate-700 font-bold">Process Node (Circle)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 rounded bg-white border-2 border-amber-500 inline-block"></span>
          <span className="text-slate-700 font-bold">Resource Node (Rectangle)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-emerald-500 inline-block"></span>
          <span className="text-slate-700 font-bold">Allocation Edge (Resource → Process)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-red-500 inline-block"></span>
          <span className="text-slate-700 font-bold">Request Edge (Process → Resource)</span>
        </div>
      </div>

      {/* React Flow Graph Container */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 h-[550px] relative overflow-hidden shadow-md">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
        >
          <Background color="#cbd5e1" gap={20} size={1.5} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Auto Recovery Log */}
      {recoveryLog && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>Automated RAG Recovery Execution Log</span>
            </h3>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium text-xs">
            {recoveryLog.message}
          </div>

          {recoveryLog.steps && recoveryLog.steps.map((st, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
              {st}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResourceAllocationGraphPage;
