import React from 'react';
import { FileSpreadsheet, Printer } from 'lucide-react';

const ReportsPage = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm print:hidden">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
            <span>Simulation Reports & Documentation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate formal course project reports and export simulation audit results.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Export PDF Report</span>
          </button>
        </div>
      </div>

      {/* Formal Printable Document Layout */}
      <div className="bg-white border border-slate-200 p-8 rounded-3xl space-y-6 text-slate-800 shadow-sm print:p-0 print:border-none print:shadow-none">
        {/* Document Header */}
        <div className="border-b border-slate-200 print:border-black pb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent print:text-black print:bg-none">
              DeadLockGuard Report
            </h2>
            <p className="text-xs text-slate-500 print:text-slate-600 font-mono mt-1 font-medium">
              Operating System Deadlock Analysis & Telemetry System
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-500 print:text-slate-700">
            <p><strong>Report Date:</strong> {new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> AUDITED</p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="space-y-2">
          <h3 className="text-sm font-bold text-indigo-600 print:text-black uppercase tracking-wider">1. Executive Summary</h3>
          <p className="text-xs text-slate-700 print:text-slate-800 leading-relaxed font-medium">
            This document certifies the deadlock detection and resource allocation simulation conducted by DeadLockGuard platform.
            The simulation evaluated system processes against available hardware resources using the standard Operating System Deadlock Detection and Banker's Avoidance algorithms.
          </p>
        </div>

        {/* System Configuration Table */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-indigo-600 print:text-black uppercase tracking-wider">2. Resource Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 print:bg-slate-100 rounded-2xl border border-slate-200 print:border-slate-300">
              <span className="font-bold text-slate-500 print:text-slate-600 block mb-1">Active Processes:</span>
              <p className="font-bold text-slate-900 print:text-black">P1 (Web Server), P2 (DB Engine), P3 (Backup Task), P4 (Worker)</p>
            </div>
            <div className="p-3 bg-slate-50 print:bg-slate-100 rounded-2xl border border-slate-200 print:border-slate-300">
              <span className="font-bold text-slate-500 print:text-slate-600 block mb-1">Resource Vector:</span>
              <p className="font-bold text-slate-900 print:text-black">R1 = 3 cores, R2 = 2 printers, R3 = 4 buffers</p>
            </div>
          </div>
        </div>

        {/* Audit Results */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-indigo-600 print:text-black uppercase tracking-wider">3. Deadlock Algorithm Results</h3>
          <div className="p-4 bg-slate-50 print:bg-slate-50 rounded-2xl border border-slate-200 print:border-slate-300 text-xs font-mono space-y-2">
            <p><strong>Detection Algorithm Status:</strong> SAFE</p>
            <p><strong>Banker's Safety Sequence:</strong> P2 → P1 → P3 → P4</p>
            <p><strong>Deadlocked Processes:</strong> None (0 processes affected)</p>
            <p><strong>Recovery Action Executed:</strong> N/A (System operating in normal state)</p>
          </div>
        </div>

        {/* Signatures */}
        <div className="pt-8 border-t border-slate-200 print:border-black flex justify-between text-xs font-mono text-slate-500 print:text-slate-800">
          <div>
            <p className="border-t border-slate-300 print:border-slate-400 pt-2 w-48 font-bold">System Administrator</p>
          </div>
          <div>
            <p className="border-t border-slate-300 print:border-slate-400 pt-2 w-48 font-bold text-right">OS Laboratory Verifier</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
