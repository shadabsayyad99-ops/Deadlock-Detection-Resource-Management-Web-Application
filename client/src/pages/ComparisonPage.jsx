import React from 'react';
import { Columns } from 'lucide-react';

const ComparisonPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Columns className="w-5 h-5 text-purple-600" />
          <span>Deadlock Handling Strategies Comparison</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Comparative evaluation of Deadlock Detection, Banker's Avoidance, and Prevention techniques.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="p-4">Feature / Metric</th>
                <th className="p-4 text-indigo-600">Deadlock Detection</th>
                <th className="p-4 text-emerald-600">Banker's Avoidance</th>
                <th className="p-4 text-purple-600">Deadlock Prevention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-500">Core Approach</td>
                <td className="p-4">Allows deadlocks to happen, periodically runs detection algorithm</td>
                <td className="p-4">Dynamically inspects requests to guarantee system stays in Safe State</td>
                <td className="p-4">Imposes static constraints to invalidate 1 of 4 Coffman conditions</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-500">Resource Utilization</td>
                <td className="p-4 text-emerald-600 font-bold">Maximum (100% full utilization)</td>
                <td className="p-4 text-amber-600 font-bold">Moderate (Conservative allocation)</td>
                <td className="p-4 text-red-600 font-bold">Low (Resources held idle)</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-500">Prior Knowledge Required</td>
                <td className="p-4 font-mono text-indigo-600 font-semibold">None (Only current allocation & request)</td>
                <td className="p-4 font-mono text-emerald-600 font-semibold">High (Must know Maximum claim advance)</td>
                <td className="p-4 font-mono text-purple-600 font-semibold">None (Rules built into OS kernel)</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-500">Algorithm Time Complexity</td>
                <td className="p-4 font-mono font-bold">O(m × n²)</td>
                <td className="p-4 font-mono font-bold">O(m × n²) per request</td>
                <td className="p-4 font-mono font-bold">O(1) static runtime overhead</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-500">Key Advantages</td>
                <td className="p-4">No request delays; optimal performance when deadlocks are rare.</td>
                <td className="p-4">Never enters a deadlock state; no process abortion needed.</td>
                <td className="p-4">Extremely easy to implement (e.g. Total Resource Hierarchy).</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-500">Key Disadvantages</td>
                <td className="p-4">Recovery overhead is high (process termination / preemption).</td>
                <td className="p-4">Processes rarely know maximum resource demands in advance.</td>
                <td className="p-4">Drastically reduces system throughput and resource usage.</td>
              </tr>
              <tr className="hover:bg-slate-50/80">
                <td className="p-4 font-bold text-slate-500">Real-World OS Usage</td>
                <td className="p-4 font-bold text-indigo-600">Database Engines & Distributed Locks</td>
                <td className="p-4 font-bold text-emerald-600">Safety-Critical Real-time Systems</td>
                <td className="p-4 font-bold text-purple-600">Linux Kernel Mutex Lock Hierarchy</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparisonPage;
