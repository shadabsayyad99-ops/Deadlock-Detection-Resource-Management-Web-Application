import React, { useState, useEffect, useCallback } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import { GitFork, AlertTriangle, CheckCircle, RefreshCw, Database, Sparkles } from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EditableMatrix from '../components/EditableMatrix';

const ResourceAllocationGraphPage = () => {
  const { showNotification } = useAuth();
  const {
    processes,
    resources,
    totalInstances,
    allocation,
    request,
    isLoadingDB,
    syncWithDB,
    loadPreset,
    updateAllocationCell,
    updateRequestCell,
    updateTotalInstanceVal,
  } = useSystemState();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [cycleResult, setCycleResult] = useState(null);
  const [buildingGraph, setBuildingGraph] = useState(false);

  // Build Graph Nodes & Edges
  const buildGraph = useCallback(async (isSilent = false) => {
    if (!processes.length || !resources.length) return;
    setBuildingGraph(true);
    try {
      const res = await deadlockAPI.cycles({
        processes,
        resources,
        allocation,
        request,
        totalInstances,
      });
      setCycleResult(res.data);

      const flowNodes = [];
      const flowEdges = [];

      // Layout: Processes on left (column x=100), Resources on right (column x=450)
      const maxCount = Math.max(processes.length, resources.length);
      const ySpacing = 130;
      const startY = 80;
      const procOffset = ((maxCount - processes.length) * ySpacing) / 2;
      const resOffset  = ((maxCount - resources.length)  * ySpacing) / 2;

      // Process Nodes — Circles (Indigo/Blue)
      processes.forEach((p, idx) => {
        flowNodes.push({
          id: p,
          data: { label: p },
          position: { x: 100, y: startY + procOffset + idx * ySpacing },
          style: {
            background: '#ffffff',
            color: '#4f46e5',
            border: '2px solid #6366f1',
            borderRadius: '50%',
            width: 70,
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.15)',
          },
        });
      });

      // Resource Nodes — Rectangles (Amber/Orange) with instance count
      resources.forEach((r, idx) => {
        const inst = totalInstances[idx] !== undefined ? Number(totalInstances[idx]) : 1;

        // Calculate available instances for this resource
        let allocated = 0;
        for (let i = 0; i < processes.length; i++) {
          allocated += Number(allocation?.[i]?.[idx] ?? 0);
        }
        const avail = inst - allocated;

        flowNodes.push({
          id: r,
          data: {
            label: (
              <div style={{ textAlign: 'center', lineHeight: '1.3' }}>
                <div style={{ fontWeight: 'bold', fontSize: '13px', color: '#d97706' }}>{r}</div>
                <div style={{ fontSize: '10px', color: '#92400e' }}>Avail: {avail} / Total: {inst}</div>
              </div>
            ),
          },
          position: { x: 450, y: startY + resOffset + idx * ySpacing },
          style: {
            background: '#fffbeb',
            color: '#d97706',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            width: 120,
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '12px',
            boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.15)',
          },
        });
      });

      // Add edges from backend cycle detection result
      res.data.edges.forEach((e) => {
        const isAlloc = e.type === 'allocation';
        flowEdges.push({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          type: 'smoothstep',
          markerEnd: { type: 'arrowclosed', color: isAlloc ? '#10b981' : '#ef4444' },
          style: {
            stroke: isAlloc ? '#10b981' : '#ef4444',
            strokeWidth: 2,
          },
          labelStyle: {
            fill: isAlloc ? '#059669' : '#dc2626',
            fontSize: 10,
            fontWeight: 'bold',
          },
          labelBgStyle: { fill: '#ffffff', opacity: 0.9 },
          labelBgPadding: [3, 2],
          labelBgBorderRadius: 4,
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);

      if (!isSilent) {
        if (res.data.hasCycle) {
          showNotification('⚠ Potential Deadlock Cycle Detected in RAG!', 'warning');
        } else {
          showNotification('No cycles detected in Resource Allocation Graph.', 'success');
        }
      }
    } catch {
      if (!isSilent) showNotification('Failed to generate Resource Allocation Graph.', 'error');
    } finally {
      setBuildingGraph(false);
    }
  }, [processes, resources, allocation, request, totalInstances, showNotification]);

  // Auto-build graph whenever system state changes
  useEffect(() => {
    buildGraph(true);
  }, [buildGraph]);

  const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <GitFork className="w-5 h-5 text-amber-600" />
            <span>Interactive Resource Allocation Graph (RAG)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual directed graph representing Process–Resource dependencies with automated cycle detection.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync DB */}
          <button
            onClick={() => syncWithDB(true)}
            disabled={isLoadingDB}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-2 transition-all"
          >
            {isLoadingDB ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            <span>Sync Live DB</span>
          </button>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  loadPreset(e.target.value);
                  setCycleResult(null);
                }
              }}
              defaultValue=""
              className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Load Preset...</option>
              <option value="deadlock">Classic Deadlock (4 Processes)</option>
              <option value="safe">Banker's Safe State (5 Processes)</option>
              <option value="simple">Simple 3-Process System</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={() => buildGraph(false)}
            disabled={buildingGraph}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-2 transition-all"
          >
            {buildingGraph ? (
              <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>Refresh Graph</span>
          </button>
        </div>
      </div>

      {/* Cycle Detection Banner */}
      {cycleResult && (
        <div
          className={`p-5 rounded-2xl border text-xs ${
            cycleResult.hasCycle
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-start gap-3">
            {cycleResult.hasCycle ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="font-bold text-sm">
                {cycleResult.hasCycle
                  ? '⚠ Potential Deadlock Cycle Detected'
                  : '✓ No Graph Cycles Detected'}
              </h3>
              <p>{cycleResult.educationalNote}</p>
              {cycleResult.cycles && cycleResult.cycles.length > 0 && (
                <div className="pt-1 font-mono font-bold text-amber-800">
                  Detected Cycle Paths: {cycleResult.cycles.join(' | ')}
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
          <span className="w-10 h-4 rounded-md bg-amber-50 border-2 border-amber-500 inline-block" />
          <span className="text-slate-700 font-semibold">Resource Node (Rectangle)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-emerald-500 inline-block" />
          <span className="text-slate-700 font-semibold">Allocation Edge (R → P)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-red-500 inline-block" />
          <span className="text-slate-700 font-semibold">Request Edge (P → R)</span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="bg-white rounded-3xl border border-slate-200 h-[520px] relative overflow-hidden shadow-sm">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <GitFork className="w-12 h-12 opacity-30 animate-pulse" />
            <p className="text-sm font-medium">Building graph visualization...</p>
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

      {/* Editable Matrix Tables */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-base font-extrabold text-slate-900">
            Graph Data Tables (Live Synced)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Edit the matrices below — the graph above rebuilds automatically on every change.
          </p>
        </div>

        {/* Total Instances Row */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
            Total Resource Instances [TotalInstances[j]]
          </p>
          <div className="flex flex-wrap gap-3">
            {resources.map((r, idx) => (
              <div key={r} className="flex flex-col items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500">{r}</span>
                <input
                  type="number"
                  min="1"
                  value={totalInstances[idx] ?? 1}
                  onChange={(e) => updateTotalInstanceVal(idx, e.target.value)}
                  className="w-16 text-center bg-white border border-amber-300 rounded-xl px-2 py-1.5 text-amber-900 font-extrabold text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Allocation & Request Matrices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider pl-1">
              Allocation Matrix — what each process currently holds (R → P)
            </p>
            <EditableMatrix
              label="Allocation Matrix"
              color="emerald"
              processes={processes}
              resources={resources}
              matrix={allocation}
              onChange={updateAllocationCell}
            />
          </div>

          <div className="space-y-1">
            <p className="text-xs font-bold text-rose-700 uppercase tracking-wider pl-1">
              Request Matrix — what each process is waiting for (P → R)
            </p>
            <EditableMatrix
              label="Request Matrix"
              color="rose"
              processes={processes}
              resources={resources}
              matrix={request}
              onChange={updateRequestCell}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceAllocationGraphPage;
