import React, { useState, useEffect, useCallback } from 'react';
import { deadlockAPI, processAPI, resourceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GitFork, AlertTriangle, CheckCircle, RefreshCw, Play, Database } from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EditableMatrix from '../components/EditableMatrix';

const zeroMatrix = (rows, cols) => Array.from({ length: rows }, () => new Array(cols).fill(0));

// Node layout helpers
const PROCESS_X = 120;
const RESOURCE_X = 480;
const Y_GAP = 130;

const ResourceAllocationGraphPage = () => {
  const { showNotification } = useAuth();

  const [processes, setProcesses] = useState([]);
  const [resources, setResources] = useState([]);
  const [totalInstances, setTotalInstances] = useState([]);
  const [allocation, setAllocation] = useState([]);
  const [request, setRequest] = useState([]);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [cycleResult, setCycleResult] = useState(null);
  const [loadingDB, setLoadingDB] = useState(false);
  const [buildingGraph, setBuildingGraph] = useState(false);

  // ── Load from DB ───────────────────────────────────────────────────────────
  const loadFromDB = useCallback(async () => {
    setLoadingDB(true);
    try {
      const [pRes, rRes] = await Promise.all([processAPI.getAll(), resourceAPI.getAll()]);
      const dbProcesses = pRes.data.map(p => p.processId);
      const dbResources = rRes.data.map(r => r.resourceId);
      const dbInstances = rRes.data.map(r => r.totalInstances ?? 1);

      if (dbProcesses.length === 0 || dbResources.length === 0) {
        showNotification('No data in DB. Loading example.', 'warning');
        loadExample();
        return;
      }

      setProcesses(dbProcesses);
      setResources(dbResources);
      setTotalInstances(dbInstances);
      setAllocation(zeroMatrix(dbProcesses.length, dbResources.length));
      setRequest(zeroMatrix(dbProcesses.length, dbResources.length));
      setNodes([]); setEdges([]); setCycleResult(null);
      showNotification(`Loaded ${dbProcesses.length} processes, ${dbResources.length} resources. Edit matrices then click Build Graph.`, 'success');
    } catch {
      showNotification('Could not load from DB. Loading example.', 'error');
      loadExample();
    } finally {
      setLoadingDB(false);
    }
  }, []);

  const loadExample = () => {
    setProcesses(['P1', 'P2', 'P3']);
    setResources(['R1', 'R2', 'R3']);
    setTotalInstances([2, 1, 2]);
    setAllocation([[1,0,1],[0,1,0],[1,0,0]]);
    setRequest([[0,1,0],[1,0,1],[0,0,1]]);
    setNodes([]); setEdges([]); setCycleResult(null);
    showNotification('Loaded RAG example. Click "Build Graph" to visualise.', 'info');
  };

  useEffect(() => { loadFromDB(); }, [loadFromDB]);

  // ── Matrix Handlers ────────────────────────────────────────────────────────
  const handleAllocationChange = (r, c, v) => {
    setAllocation(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? Math.max(0, v) : cell)));
    setCycleResult(null);
  };
  const handleRequestChange = (r, c, v) => {
    setRequest(prev => prev.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? Math.max(0, v) : cell)));
    setCycleResult(null);
  };
  const handleInstanceChange = (idx, val) => {
    setTotalInstances(prev => prev.map((v, i) => i === idx ? Math.max(1, parseInt(val) || 1) : v));
    setCycleResult(null);
  };

  // ── Build Graph ────────────────────────────────────────────────────────────
  const buildGraph = async () => {
    if (!processes.length || !resources.length) {
      showNotification('Load processes and resources first.', 'warning');
      return;
    }
    setBuildingGraph(true);
    try {
      const res = await deadlockAPI.cycles({ processes, resources, allocation, request, totalInstances });
      setCycleResult(res.data);

      const flowNodes = [];
      const flowEdges = [];

      // Process nodes — circles (indigo)
      processes.forEach((p, idx) => {
        flowNodes.push({
          id: p,
          data: { label: p },
          position: { x: PROCESS_X, y: 60 + idx * Y_GAP },
          style: {
            background: '#ffffff',
            color: '#4f46e5',
            border: '2.5px solid #6366f1',
            borderRadius: '50%',
            width: 72, height: 72,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', fontSize: '14px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
          }
        });
      });

      // Resource nodes — rounded squares (amber)
      resources.forEach((r, idx) => {
        const inst = totalInstances[idx] ?? 1;
        flowNodes.push({
          id: r,
          data: { label: `${r}\n(${inst} inst)` },
          position: { x: RESOURCE_X, y: 60 + idx * Y_GAP },
          style: {
            background: '#ffffff',
            color: '#d97706',
            border: '2.5px solid #f59e0b',
            borderRadius: '14px',
            width: 96, height: 72,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            textAlign: 'center',
            fontWeight: 'bold', fontSize: '11px',
            whiteSpace: 'pre-wrap',
            boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
          }
        });
      });

      // Edges
      res.data.edges.forEach((e) => {
        const isAlloc = e.type === 'allocation';
        flowEdges.push({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          markerEnd: { type: 'arrowclosed', color: isAlloc ? '#10b981' : '#ef4444' },
          style: { stroke: isAlloc ? '#10b981' : '#ef4444', strokeWidth: 2.5 },
          labelStyle: { fill: isAlloc ? '#059669' : '#dc2626', fontSize: 10, fontWeight: 'bold' },
          labelBgStyle: { fill: '#f8fafc', opacity: 0.85 },
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);

      if (res.data.hasCycle) {
        showNotification('⚠ Cycle detected in RAG — possible deadlock!', 'warning');
      } else {
        showNotification('No cycles found in the Resource Allocation Graph.', 'success');
      }
    } catch {
      showNotification('Failed to build graph.', 'error');
    } finally {
      setBuildingGraph(false);
    }
  };

  const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-amber-600" />
            <span>Resource Allocation Graph (RAG)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Edit matrices below, then click Build Graph to visualise and detect cycles.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadFromDB}
            disabled={loadingDB}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-2"
          >
            {loadingDB ? <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            Load from DB
          </button>

          <button
            onClick={loadExample}
            className="px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-200 flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Load Example
          </button>

          <button
            onClick={buildGraph}
            disabled={buildingGraph}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-400/20 flex items-center gap-2"
          >
            {buildingGraph ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play className="w-4 h-4 fill-white" /><span>Build Graph</span></>}
          </button>
        </div>
      </div>

      {/* Total Instances row */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wider mb-3">Total Instances per Resource</p>
        <div className="flex flex-wrap gap-3">
          {resources.map((r, idx) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">{r}</span>
              <input
                type="number" min="1"
                value={totalInstances[idx] ?? 1}
                onChange={e => handleInstanceChange(idx, e.target.value)}
                className="w-16 text-center bg-amber-50 border border-amber-200 rounded-xl px-2 py-2 text-amber-800 font-extrabold text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          ))}
          {resources.length === 0 && <span className="text-xs text-slate-400 italic">Load data first.</span>}
        </div>
      </div>

      {/* Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Allocation — Resource → Process (what each process holds)</p>
          <EditableMatrix label="Allocation" color="emerald" processes={processes} resources={resources} matrix={allocation} onChange={handleAllocationChange} />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Request — Process → Resource (what each process is waiting for)</p>
          <EditableMatrix label="Request" color="rose" processes={processes} resources={resources} matrix={request} onChange={handleRequestChange} />
        </div>
      </div>

      {/* Cycle Status Banner */}
      {cycleResult && (
        <div className={`p-5 rounded-2xl border text-xs ${cycleResult.hasCycle ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
          <div className="flex items-start gap-3">
            {cycleResult.hasCycle
              ? <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              : <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <h3 className="font-bold text-sm">
                {cycleResult.hasCycle ? '⚠ Potential Deadlock Cycle Detected' : '✓ No Graph Cycles Detected'}
              </h3>
              <p>{cycleResult.educationalNote}</p>
              {cycleResult.cycles?.length > 0 && (
                <div className="pt-1 font-mono font-bold text-amber-800">
                  Cycle Paths: {cycleResult.cycles.join(' | ')}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-xs font-mono bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-white border-2 border-indigo-600 inline-block" />
          <span className="text-slate-700 font-semibold">Process Node (Circle)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-3.5 rounded bg-white border-2 border-amber-500 inline-block" />
          <span className="text-slate-700 font-semibold">Resource Node (Rect)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-emerald-500 inline-block" />
          <span className="text-slate-700 font-semibold">Allocation (Resource → Process)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-red-500 inline-block" />
          <span className="text-slate-700 font-semibold">Request (Process → Resource)</span>
        </div>
      </div>

      {/* React Flow */}
      <div className="bg-white rounded-3xl border border-slate-200 h-[520px] relative overflow-hidden shadow-sm">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <GitFork className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">Edit the matrices above, then click <strong>Build Graph</strong></p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background color="#cbd5e1" gap={16} />
            <Controls />
          </ReactFlow>
        )}
      </div>
    </div>
  );
};

export default ResourceAllocationGraphPage;
