import React, { useState, useEffect, useCallback } from 'react';
import { deadlockAPI, processAPI, resourceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GitFork, AlertTriangle, CheckCircle, RefreshCw, Plus, Trash2, Sparkles, Bot, HelpCircle } from 'lucide-react';
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
  const [resourceNames, setResourceNames] = useState(['CPU Core', 'Printer Unit', 'Memory Buffer']);
  const [totalInstances, setTotalInstances] = useState([3, 2, 4]);

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
  const [showGuide, setShowGuide] = useState(true);
  const [loadingData, setLoadingData] = useState(false);

  // Fetch real processes and resources from DB on mount
  const fetchDBData = async () => {
    setLoadingData(true);
    try {
      const [procRes, resRes] = await Promise.all([
        processAPI.getAll(),
        resourceAPI.getAll()
      ]);

      if (procRes.data && procRes.data.length > 0) {
        const pList = procRes.data.map(p => p.processId);
        setProcesses(pList);
      }

      if (resRes.data && resRes.data.length > 0) {
        const rList = resRes.data.map(r => r.resourceId);
        const rNames = resRes.data.map(r => r.name);
        const rTotals = resRes.data.map(r => r.totalInstances || 1);
        setResources(rList);
        setResourceNames(rNames);
        setTotalInstances(rTotals);
      }

      showNotification('Synced graph with database processes and resources', 'info');
    } catch (err) {
      console.error('Failed to fetch DB data for RAG', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    fetchDBData();
  }, []);

  // Ensure matrices match current process and resource array lengths
  useEffect(() => {
    const pCount = processes.length;
    const rCount = resources.length;

    setAllocation(prev => {
      const newMat = Array.from({ length: pCount }, (_, i) =>
        Array.from({ length: rCount }, (_, j) => (prev[i] && prev[i][j] !== undefined ? prev[i][j] : (i === j ? 1 : 0)))
      );
      return newMat;
    });

    setRequest(prev => {
      const newMat = Array.from({ length: pCount }, (_, i) =>
        Array.from({ length: rCount }, (_, j) => (prev[i] && prev[i][j] !== undefined ? prev[i][j] : (i !== j && (i + j) % 2 === 1 ? 1 : 0)))
      );
      return newMat;
    });
  }, [processes.length, resources.length]);

  // Preset Loaders
  const loadPreset = (type) => {
    if (type === 'safe') {
      setProcesses(['P0', 'P1', 'P2']);
      setResources(['R1', 'R2', 'R3']);
      setResourceNames(['CPU Core', 'Printer Unit', 'Memory Buffer']);
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
      setResourceNames(['CPU Core', 'Printer Unit']);
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
      setResourceNames(['CPU Core', 'Printer Unit', 'Memory Buffer']);
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
    showNotification(`Added process ${pName}`, 'info');
  };

  const removeProcess = () => {
    if (processes.length <= 1) {
      showNotification('Minimum 1 process required.', 'warning');
      return;
    }
    setProcesses(processes.slice(0, -1));
  };

  const addResource = () => {
    const rName = `R${resources.length + 1}`;
    setResources([...resources, rName]);
    setResourceNames([...resourceNames, `Resource ${resources.length + 1}`]);
    setTotalInstances([...totalInstances, 1]);
    showNotification(`Added resource ${rName}`, 'info');
  };

  const removeResource = () => {
    if (resources.length <= 1) {
      showNotification('Minimum 1 resource required.', 'warning');
      return;
    }
    setResources(resources.slice(0, -1));
    setResourceNames(resourceNames.slice(0, -1));
    setTotalInstances(totalInstances.slice(0, -1));
  };

  const buildGraph = useCallback(async () => {
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

      const pCount = processes.length || 1;
      const rCount = resources.length || 1;
      const pSpacing = Math.max(110, Math.min(160, 520 / pCount));
      const rSpacing = Math.max(110, Math.min(160, 520 / rCount));

      // 1. Process Nodes (Left Column X: 140)
      processes.forEach((p, idx) => {
        const isDeadlockedNode = res.data.hasCycle && res.data.cycles.some(cPath => cPath.includes(p));

        flowNodes.push({
          id: p,
          data: {
            label: (
              <div className="flex flex-col items-center justify-center">
                <span className="text-base font-black tracking-wide">{p}</span>
                {isDeadlockedNode && (
                  <span className="mt-1 px-1.5 py-0.5 rounded-md bg-red-600 text-white font-mono text-[9px] font-black uppercase tracking-wider shadow-xs">
                    DEADLOCK
                  </span>
                )}
              </div>
            )
          },
          position: { x: 140, y: 50 + idx * pSpacing },
          style: {
            background: isDeadlockedNode ? '#fef2f2' : '#ffffff',
            color: isDeadlockedNode ? '#991b1b' : '#312e81',
            border: isDeadlockedNode ? '4px solid #ef4444' : '3.5px solid #6366f1',
            borderRadius: '50%',
            width: 85,
            height: 85,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: isDeadlockedNode ? '0 0 25px rgba(239, 68, 68, 0.45)' : '0 10px 15px -3px rgba(99, 102, 241, 0.2)'
          }
        });
      });

      // 2. Resource Nodes (Right Column X: 540)
      resources.forEach((r, idx) => {
        const total = totalInstances[idx] !== undefined ? totalInstances[idx] : 1;
        const rName = resourceNames[idx] || r;
        let allocSum = 0;
        processes.forEach((_, pIdx) => {
          if (allocation[pIdx] && allocation[pIdx][idx] !== undefined) {
            allocSum += allocation[pIdx][idx];
          }
        });
        const avail = Math.max(0, total - allocSum);
        const isCycleResource = res.data.hasCycle && res.data.cycles.some(cPath => cPath.includes(r));

        flowNodes.push({
          id: r,
          data: {
            label: (
              <div className="flex flex-col items-center justify-center space-y-1 p-1">
                <span className="text-sm font-black text-amber-900">{r} ({rName})</span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100/80 text-amber-900 font-mono font-bold text-[11px] border border-amber-300">
                  Avail: {avail} / Total: {total}
                </span>
              </div>
            )
          },
          position: { x: 540, y: 50 + idx * rSpacing },
          style: {
            background: isCycleResource ? '#fffbeb' : '#ffffff',
            color: '#78350f',
            border: isCycleResource ? '4px solid #f59e0b' : '3.5px solid #d97706',
            borderRadius: '20px',
            width: 180,
            height: 85,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            boxShadow: isCycleResource ? '0 0 20px rgba(245, 158, 11, 0.35)' : '0 10px 15px -3px rgba(217, 119, 6, 0.2)'
          }
        });
      });

      // 3. Directed Edges (Curved Bezier Lines with Arrows)
      res.data.edges.forEach((e) => {
        const isAlloc = e.type === 'allocation';
        const isCycleEdge = res.data.hasCycle && res.data.cycles.some(cPath => cPath.includes(e.source) && cPath.includes(e.target));

        flowEdges.push({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          type: 'smoothstep',
          animated: true,
          style: {
            stroke: isCycleEdge ? '#ef4444' : (isAlloc ? '#10b981' : '#f59e0b'),
            strokeWidth: isCycleEdge ? 4 : 2.5
          },
          labelStyle: { fill: isCycleEdge ? '#dc2626' : (isAlloc ? '#059669' : '#d97706'), fontSize: 12, fontWeight: '900' }
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    } catch (err) {
      console.error('Failed to generate Resource Allocation Graph', err);
    }
  }, [processes, resources, resourceNames, allocation, request, totalInstances]);

  const autoRecoverFromRAG = async () => {
    try {
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
  }, [buildGraph]);

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
            Visual dependency diagram generated dynamically from database processes ({processes.join(', ')}) and resources ({resources.join(', ')}).
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

      {/* Easy Guide Banner */}
      {showGuide && (
        <div className="bg-gradient-to-r from-amber-50 via-sky-50 to-indigo-50 p-6 rounded-3xl border border-amber-100 text-slate-800 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-amber-950 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span>How the Resource Allocation Graph (RAG) Works:</span>
            </h2>
            <button onClick={() => setShowGuide(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
            <div className="bg-white p-3.5 rounded-2xl border border-indigo-100">
              <span className="font-extrabold text-indigo-700 block mb-1">1. Processes (Circles)</span>
              Represent active processes ({processes.slice(0, 4).join(', ')}...). Rendered on the left column.
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-amber-100">
              <span className="font-extrabold text-amber-700 block mb-1">2. Resources (Rectangles)</span>
              Represent system hardware ({resources.slice(0, 4).join(', ')}...). Shows Available / Total instances.
            </div>
            <div className="bg-white p-3.5 rounded-2xl border border-emerald-100">
              <span className="font-extrabold text-emerald-700 block mb-1">3. Directed Edges</span>
              <strong>Green Edge:</strong> Resource allocated to Process.<br />
              <strong>Amber/Red Edge:</strong> Process requesting Resource.
            </div>
          </div>
        </div>
      )}

      {/* Preset Loaders & Matrix Controls Toolbar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
            1-Click Educational Presets:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => loadPreset('safe')}
              className="px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-extrabold transition-all"
            >
              Preset 1: Safe Graph (No Deadlock)
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

        {/* Clear Process & Resource Dimension Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={addProcess}
            className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs border border-indigo-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
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
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 font-extrabold text-xs border border-amber-200 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Resource</span>
          </button>
          <button
            onClick={removeResource}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs border border-slate-200"
            title="Remove last resource"
          >
            <Trash2 className="w-4 h-4 text-red-500" />
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
          Total Resource Instances (Hardware Capacity)
        </h3>
        <div className="flex flex-wrap gap-4">
          {resources.map((resName, idx) => (
            <div key={resName} className="flex items-center gap-3 bg-amber-50/60 border border-amber-200 rounded-2xl px-5 py-3 shadow-xs">
              <span className="font-mono font-black text-sm text-amber-900">{resName} ({resourceNames[idx] || resName}):</span>
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
                {processes.map((p, pIdx) => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="w-20 text-left font-black text-slate-800 py-3 px-2 text-sm">{p}</td>
                    {resources.map((r, rIdx) => (
                      <td key={r} className="w-20 py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          value={allocation[pIdx] ? allocation[pIdx][rIdx] || 0 : 0}
                          onChange={(e) => handleCellChange('allocation', pIdx, rIdx, e.target.value)}
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

        {/* Request Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-base text-amber-700 border-b border-slate-100 pb-3">
            Request Edges (Process → Resource)
          </h3>
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
                {processes.map((p, pIdx) => (
                  <tr key={p} className="hover:bg-slate-50">
                    <td className="w-20 text-left font-black text-slate-800 py-3 px-2 text-sm">{p}</td>
                    {resources.map((r, rIdx) => (
                      <td key={r} className="w-20 py-2 px-1">
                        <input
                          type="number"
                          min="0"
                          value={request[pIdx] ? request[pIdx][rIdx] || 0 : 0}
                          onChange={(e) => handleCellChange('request', pIdx, rIdx, e.target.value)}
                          className="w-16 bg-amber-50/50 border-2 border-amber-200 focus:border-amber-600 rounded-xl py-2 px-1 text-center text-base font-extrabold text-amber-900 focus:outline-none focus:bg-white transition-all shadow-xs"
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
          <span className="w-6 h-0.5 bg-amber-500 inline-block"></span>
          <span className="text-slate-700 font-bold">Request Edge (Process → Resource)</span>
        </div>
      </div>

      {/* React Flow Graph Container */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 h-[650px] relative overflow-hidden shadow-md">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          fitViewOptions={{ padding: 0.25 }}
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
