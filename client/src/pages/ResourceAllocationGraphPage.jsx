import React, { useState } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import { GitFork, AlertTriangle, CheckCircle, RefreshCw, Play, Database, Sparkles } from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EditableMatrix from '../components/EditableMatrix';

const PROCESS_X = 120;
const RESOURCE_X = 480;
const Y_GAP = 130;

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

  // Build Graph
  const buildGraph = async () => {
    if (!processes.length || !resources.length) {
      showNotification('Configure processes and resources first.', 'warning');
      return;
    }
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

      // Process nodes (circles)
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
            width: 72,
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(99,102,241,0.2)',
          },
        });
      });

      // Resource nodes (rectangles)
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
            width: 96,
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '11px',
            whiteSpace: 'pre-wrap',
            boxShadow: '0 4px 12px rgba(245,158,11,0.2)',
          },
        });
      });

      // Edges: allocation (green) & request (red)
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
        showNotification('⚠ Potential Deadlock Cycle Detected in RAG!', 'warning');
      } else {
        showNotification('No cycles detected in Resource Allocation Graph.', 'success');
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
            <span>Interactive Resource Allocation Graph (RAG)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Visual directed graph reflecting live system allocation and requests with cycle detection.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => syncWithDB(true)}
            disabled={isLoadingDB}
            className="px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 flex items-center gap-2"
          >
            {isLoadingDB ? (
              <div className="w-3.5 h-3.5 border-2 border-indigo-300 border-t-indigo-700 rounded-full animate-spin" />
            ) : (
              <Database className="w-3.5 h-3.5" />
            )}
            Sync from DB
          </button>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  loadPreset(e.target.value);
                  setCycleResult(null);
                  setNodes([]);
                  setEdges([]);
                }
              }}
              defaultValue=""
              className="bg-transparent text-xs text-slate-700 font-bold focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Load Preset...</option>
              <option value="deadlock">Classic Deadlock</option>
              <option value="safe">Banker's Safe State</option>
              <option value="simple">Simple 3-Process System</option>
            </select>
          </div>

          <button
            onClick={buildGraph}
            disabled={buildingGraph}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-400/20 flex items-center gap-2"
          >
            {buildingGraph ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Build Graph</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Total Instances Row */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <p className="text-xs font-extrabold text-amber-700 uppercase tracking-wider mb-3">
          Total Hardware Instances per Resource [TotalInstances[j]]
        </p>
        <div className="flex flex-wrap gap-3">
          {resources.map((r, idx) => (
            <div key={r} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-slate-500">{r}</span>
              <input
                type="number"
                min="1"
                value={totalInstances[idx] ?? 1}
                onChange={(e) => {
                  updateTotalInstanceVal(idx, e.target.value);
                  setCycleResult(null);
                }}
                className="w-16 text-center bg-amber-50 border border-amber-200 rounded-xl px-2 py-2 text-amber-800 font-extrabold text-sm focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>
          ))}
          {resources.length === 0 && (
            <span className="text-xs text-slate-400 italic">No resources defined. Click "Sync from DB".</span>
          )}
        </div>
      </div>

      {/* Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
            Allocation — Resource &rarr; Process (holds)
          </p>
          <EditableMatrix
            label="Allocation Matrix"
            color="emerald"
            processes={processes}
            resources={resources}
            matrix={allocation}
            onChange={(r, c, v) => {
              updateAllocationCell(r, c, v);
              setCycleResult(null);
            }}
          />
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">
            Request — Process &rarr; Resource (waiting)
          </p>
          <EditableMatrix
            label="Request Matrix"
            color="rose"
            processes={processes}
            resources={resources}
            matrix={request}
            onChange={(r, c, v) => {
              updateRequestCell(r, c, v);
              setCycleResult(null);
            }}
          />
        </div>
      </div>

      {/* Cycle Status Banner */}
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

      {/* Graph Legend */}
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
          <span className="text-slate-700 font-semibold">Allocation (Resource &rarr; Process)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-red-500 inline-block" />
          <span className="text-slate-700 font-semibold">Request (Process &rarr; Resource)</span>
        </div>
      </div>

      {/* React Flow Viewport */}
      <div className="bg-white rounded-3xl border border-slate-200 h-[520px] relative overflow-hidden shadow-sm">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <GitFork className="w-12 h-12 opacity-30" />
            <p className="text-sm font-medium">Click <strong>Build Graph</strong> above to render the current system</p>
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
