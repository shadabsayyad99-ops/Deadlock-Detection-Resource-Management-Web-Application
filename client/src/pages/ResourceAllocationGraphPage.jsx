import React, { useState, useEffect } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { GitFork, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
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

  const [processes] = useState(['P1', 'P2', 'P3']);
  const [resources] = useState(['R1', 'R2', 'R3']);
  const [totalInstances] = useState([2, 1, 2]);

  const [allocation] = useState([
    [1, 0, 1],
    [0, 1, 0],
    [1, 0, 0]
  ]);

  const [request] = useState([
    [0, 1, 0],
    [1, 0, 1],
    [0, 0, 1]
  ]);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [cycleResult, setCycleResult] = useState(null);

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

      processes.forEach((p, idx) => {
        flowNodes.push({
          id: p,
          data: { label: p },
          position: { x: 100, y: 100 + idx * 120 },
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
            boxShadow: '0 4px 6px -1px rgba(99, 102, 241, 0.15)'
          }
        });
      });

      resources.forEach((r, idx) => {
        const inst = totalInstances[idx] !== undefined ? totalInstances[idx] : 1;
        flowNodes.push({
          id: r,
          data: { label: `${r}\n(${inst} inst)` },
          position: { x: 450, y: 100 + idx * 120 },
          style: {
            background: '#ffffff',
            color: '#d97706',
            border: '2px solid #f59e0b',
            borderRadius: '12px',
            width: 90,
            height: 70,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            fontWeight: 'bold',
            fontSize: '12px',
            whiteSpace: 'pre-wrap',
            boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.15)'
          }
        });
      });

      res.data.edges.forEach((e) => {
        const isAlloc = e.type === 'allocation';
        flowEdges.push({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          style: {
            stroke: isAlloc ? '#10b981' : '#ef4444',
            strokeWidth: 2
          },
          labelStyle: { fill: isAlloc ? '#059669' : '#dc2626', fontSize: 10, fontWeight: 'bold' }
        });
      });

      setNodes(flowNodes);
      setEdges(flowEdges);

      if (res.data.hasCycle) {
        showNotification('Potential Deadlock Cycle Detected in RAG!', 'warning');
      } else {
        showNotification('No cycles detected in Resource Allocation Graph.', 'success');
      }
    } catch (err) {
      showNotification('Failed to generate Resource Allocation Graph', 'error');
    }
  };

  useEffect(() => {
    buildGraph();
  }, []);

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
            Visual directed graph representing Process-Resource dependencies and automated cycle detection.
          </p>
        </div>

        <button
          onClick={buildGraph}
          className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Graph</span>
        </button>
      </div>

      {/* Cycle Status Banner */}
      {cycleResult && (
        <div className={`p-5 rounded-2xl border text-xs ${
          cycleResult.hasCycle ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex items-start gap-3">
            {cycleResult.hasCycle ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="font-bold text-sm">
                {cycleResult.hasCycle ? '⚠ Potential Deadlock Cycle Detected' : 'No Graph Cycles Detected'}
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

      {/* Legend & Instructions */}
      <div className="flex items-center gap-6 text-xs font-mono bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded-full bg-white border-2 border-indigo-600 inline-block"></span>
          <span className="text-slate-700 font-semibold">Process Node (Circle)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-3 rounded bg-white border-2 border-amber-500 inline-block"></span>
          <span className="text-slate-700 font-semibold">Resource Node (Rectangle)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-emerald-500 inline-block"></span>
          <span className="text-slate-700 font-semibold">Allocation (Resource → Process)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-6 h-0.5 bg-red-500 inline-block"></span>
          <span className="text-slate-700 font-semibold">Request (Process → Resource)</span>
        </div>
      </div>

      {/* React Flow Container */}
      <div className="bg-white rounded-3xl border border-slate-200 h-[500px] relative overflow-hidden shadow-sm">
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
      </div>
    </div>
  );
};

export default ResourceAllocationGraphPage;
