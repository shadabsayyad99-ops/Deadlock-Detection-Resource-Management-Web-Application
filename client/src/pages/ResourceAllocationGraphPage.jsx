import React, { useState, useEffect, useMemo } from 'react';
import { deadlockAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSystemState } from '../context/SystemStateContext';
import {
  GitFork,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Database,
  Sparkles,
  Calculator,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Handle,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import EditableMatrix from '../components/EditableMatrix';

// ── Custom Node Components with Upper & Lower Tracks ────────────────────────
// Process Node: Circle (Indigo or Red glow if deadlocked)
const ProcessNode = ({ data }) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-full transition-all select-none ${
        data.inCycle
          ? 'bg-rose-50 border-3 border-rose-500 shadow-xl shadow-rose-300/40 text-rose-950 ring-4 ring-rose-200'
          : 'bg-white border-2 border-indigo-500 shadow-md shadow-indigo-100 text-indigo-950'
      }`}
      style={{ width: 80, height: 80 }}
    >
      {/* Target handle on right (for incoming Allocation R -> P) */}
      <Handle
        type="target"
        position={Position.Right}
        id="in"
        style={{
          top: '32%',
          right: -5,
          background: '#059669',
          width: 10,
          height: 10,
          border: '2px solid #ffffff',
          boxShadow: '0 0 4px rgba(5, 150, 105, 0.6)',
        }}
      />
      {/* Source handle on right (for outgoing Request P -> R) */}
      <Handle
        type="source"
        position={Position.Right}
        id="out"
        style={{
          top: '68%',
          right: -5,
          background: '#dc2626',
          width: 10,
          height: 10,
          border: '2px solid #ffffff',
          boxShadow: '0 0 4px rgba(220, 38, 38, 0.6)',
        }}
      />
      <span className="font-black text-base tracking-tight">{data.label}</span>
      <span
        className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 ${
          data.inCycle ? 'bg-rose-600 text-white font-extrabold' : 'bg-indigo-100 text-indigo-700'
        }`}
      >
        {data.inCycle ? 'DEADLOCKED' : 'PROCESS'}
      </span>
    </div>
  );
};

// Resource Node: Rounded rectangle card (Amber)
const ResourceNode = ({ data }) => {
  return (
    <div
      className={`relative flex flex-col justify-center rounded-2xl p-3 px-4 transition-all select-none ${
        data.inCycle
          ? 'bg-amber-50 border-3 border-amber-500 shadow-xl shadow-amber-200/40 ring-4 ring-amber-200'
          : 'bg-white border-2 border-amber-400 shadow-md shadow-amber-100'
      }`}
      style={{ width: 144, height: 74 }}
    >
      {/* Source handle on left (for outgoing Allocation R -> P) */}
      <Handle
        type="source"
        position={Position.Left}
        id="out"
        style={{
          top: '32%',
          left: -5,
          background: '#059669',
          width: 10,
          height: 10,
          border: '2px solid #ffffff',
          boxShadow: '0 0 4px rgba(5, 150, 105, 0.6)',
        }}
      />
      {/* Target handle on left (for incoming Request P -> R) */}
      <Handle
        type="target"
        position={Position.Left}
        id="in"
        style={{
          top: '68%',
          left: -5,
          background: '#dc2626',
          width: 10,
          height: 10,
          border: '2px solid #ffffff',
          boxShadow: '0 0 4px rgba(220, 38, 38, 0.6)',
        }}
      />
      <div className="flex items-center justify-between">
        <span className="font-black text-base text-amber-950">{data.label}</span>
        <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
          Total: {data.total}
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-[11px] font-bold">
        <span className="text-slate-500">Available:</span>
        <span
          className={`font-black px-1.5 py-0.2 rounded ${
            data.available === 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {data.available} free
        </span>
      </div>
    </div>
  );
};

// Registered outside component so React Flow does not re-mount on re-render
const nodeTypes = {
  processNode: ProcessNode,
  resourceNode: ResourceNode,
};

// ── Main Component ─────────────────────────────────────────────────────────
const ResourceAllocationGraphPage = () => {
  const { showNotification } = useAuth();
  const {
    processes,
    resources,
    totalInstances,
    available,
    allocation,
    request,
    isLoadingDB,
    syncWithDB,
    loadPreset,
    updateAllocationCell,
    updateRequestCell,
    updateTotalInstanceVal,
    autoComputeAvailable,
  } = useSystemState();

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [cycleResult, setCycleResult] = useState(null);
  const [buildingGraph, setBuildingGraph] = useState(false);
  const [edgeFilter, setEdgeFilter] = useState('all'); // 'all' | 'allocations' | 'requests' | 'cycles'

  // Breakdown lists of allocations and requests
  const allocationSummary = useMemo(() => {
    const list = [];
    processes.forEach((p, pIdx) => {
      resources.forEach((r, rIdx) => {
        const val = Number(allocation?.[pIdx]?.[rIdx] || 0);
        if (val > 0) {
          list.push({ process: p, resource: r, count: val });
        }
      });
    });
    return list;
  }, [processes, resources, allocation]);

  const requestSummary = useMemo(() => {
    const list = [];
    processes.forEach((p, pIdx) => {
      resources.forEach((r, rIdx) => {
        const val = Number(request?.[pIdx]?.[rIdx] || 0);
        if (val > 0) {
          list.push({ process: p, resource: r, count: val });
        }
      });
    });
    return list;
  }, [processes, resources, request]);

  // Stable dependency key: only re-build when input matrices or filter change!
  // This completely eliminates any infinite blinking or re-render loop!
  const stateKey = useMemo(() => {
    return JSON.stringify({
      p: processes,
      r: resources,
      tot: totalInstances,
      alloc: allocation,
      req: request,
      f: edgeFilter,
    });
  }, [processes, resources, totalInstances, allocation, request, edgeFilter]);

  useEffect(() => {
    let isCancelled = false;

    const runBuild = async () => {
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

        if (isCancelled) return;
        const data = res.data;
        setCycleResult(data);

        // Compute cycle nodes and cycle edges
        const inCycleNodes = new Set();
        const inCycleEdges = new Set();
        (data.cycles || []).forEach((cStr) => {
          const parts = cStr.split(' → ').map((s) => s.trim());
          parts.forEach((p) => inCycleNodes.add(p));
          for (let i = 0; i < parts.length - 1; i++) {
            inCycleEdges.add(`${parts[i]}->${parts[i + 1]}`);
          }
        });

        // Compute available per resource
        const availMap = resources.map((_, rIdx) => {
          const tot = Number(totalInstances?.[rIdx] ?? 1);
          const allocatedSum = allocation.reduce((sum, row) => sum + (Number(row?.[rIdx]) || 0), 0);
          return Math.max(0, tot - allocatedSum);
        });

        const flowNodes = [];
        const flowEdges = [];

        // Vertical spacing and alignment
        const maxCount = Math.max(processes.length, resources.length);
        const ySpacing = 140;
        const startY = 70;
        const procOffset = ((maxCount - processes.length) * ySpacing) / 2;
        const resOffset = ((maxCount - resources.length) * ySpacing) / 2;

        // Process Nodes (Circles on Left Column)
        processes.forEach((p, idx) => {
          flowNodes.push({
            id: p,
            type: 'processNode',
            data: {
              label: p,
              inCycle: inCycleNodes.has(p),
            },
            position: { x: 80, y: startY + procOffset + idx * ySpacing },
          });
        });

        // Resource Nodes (Rectangles on Right Column)
        resources.forEach((r, idx) => {
          const tot = Number(totalInstances[idx] ?? 1);
          const avail = availMap[idx] ?? 0;
          flowNodes.push({
            id: r,
            type: 'resourceNode',
            data: {
              label: r,
              total: tot,
              available: avail,
              inCycle: inCycleNodes.has(r),
            },
            position: { x: 500, y: startY + resOffset + idx * ySpacing },
          });
        });

        // Edges: Allocation connects out(top) -> in(top), Request connects out(bottom) -> in(bottom)
        (data.edges || []).forEach((e) => {
          const isAlloc = e.type === 'allocation';
          const isCycleEdge = inCycleEdges.has(`${e.source}->${e.target}`);

          if (edgeFilter === 'allocations' && !isAlloc) return;
          if (edgeFilter === 'requests' && isAlloc) return;
          if (edgeFilter === 'cycles' && !isCycleEdge) return;

          flowEdges.push({
            id: e.id,
            source: e.source,
            sourceHandle: 'out',
            target: e.target,
            targetHandle: 'in',
            type: 'bezier',
            animated: true,
            markerEnd: {
              type: 'arrowclosed',
              color: isAlloc ? '#059669' : '#dc2626',
              width: 18,
              height: 18,
            },
            style: {
              stroke: isAlloc ? '#059669' : '#dc2626',
              strokeWidth: isCycleEdge ? 3.5 : 2.5,
              opacity: edgeFilter === 'cycles' ? (isCycleEdge ? 1 : 0.25) : 1,
            },
            label: isAlloc
              ? `Allocated: ${e.label.replace(/\D/g, '') || 1}`
              : `Requests: ${e.label.replace(/\D/g, '') || 1}`,
            labelStyle: {
              fill: isAlloc ? '#047857' : '#991b1b',
              fontSize: 10,
              fontWeight: '900',
            },
            labelBgStyle: {
              fill: isAlloc ? '#ecfdf5' : '#fff1f2',
              stroke: isAlloc ? '#6ee7b7' : '#fca5a5',
              strokeWidth: 1.5,
              opacity: 0.95,
            },
            labelBgPadding: [6, 3],
            labelBgBorderRadius: 6,
          });
        });

        setNodes(flowNodes);
        setEdges(flowEdges);
      } catch (err) {
        console.error('Failed to build graph:', err);
      } finally {
        if (!isCancelled) setBuildingGraph(false);
      }
    };

    runBuild();

    return () => {
      isCancelled = true;
    };
  }, [stateKey]); // Only re-runs when inputs change! No infinite blinking!

  const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-2xl">
              <GitFork className="w-6 h-6" />
            </div>
            <span>Interactive Resource Allocation Graph (RAG)</span>
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Visual directed graph representing Process&ndash;Resource dependencies with separate tracks for Allocations and Requests.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Sync Live DB */}
          <button
            onClick={() => syncWithDB(true)}
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

          {/* Auto Compute Available */}
          <button
            onClick={autoComputeAvailable}
            className="px-4 py-2.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs border border-emerald-200 flex items-center gap-2 transition-all shadow-xs"
            title="Compute Available vector from Total - Sum(Allocation)"
          >
            <Calculator className="w-3.5 h-3.5 text-emerald-600" />
            <span>Auto-Compute Avail</span>
          </button>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-1.5 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <select
              onChange={(e) => {
                if (e.target.value) {
                  loadPreset(e.target.value);
                  setCycleResult(null);
                }
              }}
              defaultValue=""
              className="bg-transparent text-xs text-slate-700 font-extrabold focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Load Preset Scenario...</option>
              <option value="deadlock">Active 4-Process Deadlock (P0&ndash;P3)</option>
              <option value="simple">Classic 3-Process System (P0, P1, P2)</option>
              <option value="safe">Banker's Safe State (5 Processes)</option>
            </select>
          </div>

          {/* Refresh Graph Button */}
          <button
            onClick={() => {
              // Trigger build manually
              setEdgeFilter((f) => (f === 'all' ? 'all ' : 'all'));
            }}
            disabled={buildingGraph}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs shadow-md shadow-amber-400/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            {buildingGraph ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Refresh Graph</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cycle Detection Status Banner */}
      {cycleResult && (
        <div
          className={`p-5 rounded-2xl border text-xs ${
            cycleResult.hasCycle
              ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-xs'
              : 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
          }`}
        >
          <div className="flex items-start gap-3">
            {cycleResult.hasCycle ? (
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-black text-sm">
                  {cycleResult.hasCycle
                    ? '⚠ Potential Deadlock Cycle Detected in Graph'
                    : '✓ No Circular Wait Detected in Graph'}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/80 border border-amber-200 text-amber-900 font-bold">
                  {edges.length} Active Edges Shown
                </span>
              </div>
              <p className="leading-relaxed">{cycleResult.educationalNote}</p>
              {cycleResult.cycles?.length > 0 && (
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <span className="font-mono font-black text-amber-900 text-xs">Detected Cycle Paths:</span>
                  {cycleResult.cycles.map((c, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-amber-100 text-amber-950 border border-amber-300 font-mono font-black text-[11px] shadow-2xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Legend & Filter Controls Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Visual Legend */}
        <div className="flex flex-wrap items-center gap-5 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-white border-2 border-indigo-600 inline-block" />
            <span className="text-slate-800 font-bold">Process (Circle)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-4 rounded-md bg-amber-50 border-2 border-amber-500 inline-block" />
            <span className="text-slate-800 font-bold">Resource (Rectangle)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 bg-emerald-600 rounded inline-block" />
            <span className="text-emerald-800 font-black">Allocation (R &rarr; P, Upper Track)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-5 h-1 bg-rose-600 rounded inline-block" />
            <span className="text-rose-800 font-black">Request (P &rarr; R, Lower Track)</span>
          </div>
        </div>

        {/* Edge Visibility Filter Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Show:</span>
          <button
            onClick={() => setEdgeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              edgeFilter === 'all'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Edges
          </button>
          <button
            onClick={() => setEdgeFilter('allocations')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              edgeFilter === 'allocations'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            Allocations Only
          </button>
          <button
            onClick={() => setEdgeFilter('requests')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              edgeFilter === 'requests'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-700'
            }`}
          >
            Requests Only
          </button>
          {cycleResult?.hasCycle && (
            <button
              onClick={() => setEdgeFilter('cycles')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
                edgeFilter === 'cycles'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-800'
              }`}
            >
              Cycle Edges Only
            </button>
          )}
        </div>
      </div>

      {/* React Flow Graph Visual Canvas */}
      <div className="bg-white rounded-3xl border border-slate-200 h-[560px] relative overflow-hidden shadow-sm">
        {nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3">
            <GitFork className="w-12 h-12 opacity-30 animate-pulse" />
            <p className="text-sm font-medium">Building graph visualization...</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background color="#cbd5e1" gap={16} />
            <Controls />
          </ReactFlow>
        )}
      </div>

      {/* Explanatory Breakdown: "Who Holds What" & "Who Is Waiting For What" */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Allocations Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2.5">
            <div className="flex items-center gap-2 text-emerald-800">
              <ArrowLeft className="w-4 h-4 text-emerald-600" />
              <h3 className="font-black text-sm uppercase tracking-wide">
                Current Allocations (Resource &rarr; Process)
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
              {allocationSummary.length} Active Holdings
            </span>
          </div>

          {allocationSummary.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No resources currently allocated.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {allocationSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-emerald-50/60 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-mono font-bold"
                >
                  <div className="flex items-center gap-1.5 text-emerald-950">
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px]">
                      {item.resource}
                    </span>
                    <span className="text-emerald-600">&rarr;</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 text-[10px]">
                      {item.process}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px]">
                    {item.count} units
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Requests Card */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-rose-100 pb-2.5">
            <div className="flex items-center gap-2 text-rose-800">
              <ArrowRight className="w-4 h-4 text-rose-600" />
              <h3 className="font-black text-sm uppercase tracking-wide">
                Waiting Requests (Process &rarr; Resource)
              </h3>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-50 text-rose-800 font-extrabold border border-rose-200">
              {requestSummary.length} Blocked Requests
            </span>
          </div>

          {requestSummary.length === 0 ? (
            <p className="text-xs text-emerald-600 font-bold">No processes are waiting for resources.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {requestSummary.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between bg-rose-50/60 border border-rose-200 px-3 py-2 rounded-xl text-xs font-mono font-bold"
                >
                  <div className="flex items-center gap-1.5 text-rose-950">
                    <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 text-[10px]">
                      {item.process}
                    </span>
                    <span className="text-rose-600">&rarr;</span>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[10px]">
                      {item.resource}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[10px]">
                    {item.count} units
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Editable Matrix Data Tables (Live Synced with all pages) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Graph Data Tables (Live Synchronized Across All Pages)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Editing any cell here immediately redraws the graph above and synchronizes with Deadlock Detection, Banker's, and Recovery.
            </p>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-xl border border-slate-200">
            {processes.length} Processes &bull; {resources.length} Resources
          </span>
        </div>

        {/* Total Instances Row */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-black text-amber-800 uppercase tracking-wider">
              Total Hardware Instances [TotalInstances[j]]
            </p>
            <span className="text-[11px] text-slate-500">
              Available is calculated as Total &minus; Allocated
            </span>
          </div>
          <div className="flex flex-wrap gap-4">
            {resources.map((r, idx) => (
              <div
                key={r}
                className="flex items-center gap-2 bg-white border border-amber-300 rounded-xl px-3 py-1.5 shadow-2xs"
              >
                <span className="font-mono font-black text-xs text-amber-900">{r}:</span>
                <input
                  type="number"
                  min="1"
                  value={totalInstances[idx] ?? 1}
                  onChange={(e) => updateTotalInstanceVal(idx, e.target.value)}
                  className="w-14 text-center bg-transparent font-extrabold text-sm text-slate-900 focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Allocation & Request Matrices Side-by-Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          <div className="space-y-1">
            <p className="text-xs font-black text-emerald-800 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Allocation Matrix &mdash; What Each Process Holds (R &rarr; P)</span>
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
            <p className="text-xs font-black text-rose-800 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
              <span>Request Matrix &mdash; What Each Process is Waiting For (P &rarr; R)</span>
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
