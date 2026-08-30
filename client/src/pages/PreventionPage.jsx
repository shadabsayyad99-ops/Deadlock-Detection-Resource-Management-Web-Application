import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';

const PreventionPage = () => {
  const [selectedStrategy, setSelectedStrategy] = useState('hold_wait');
  const [simMessage, setSimMessage] = useState('');

  const conditions = [
    {
      id: 'mutual_exclusion',
      title: '1. Mutual Exclusion',
      desc: 'At least one resource must be held in a non-shareable mode (only one process can use it at a time).',
      prevention: 'Make resources shareable (e.g. Read-only files). However, hardware like printers inherently cannot be shared simultaneously.',
      feasible: 'Hard to eliminate for non-shareable hardware.'
    },
    {
      id: 'hold_wait',
      title: '2. Hold and Wait',
      desc: 'A process must be holding at least one resource and waiting to acquire additional resources held by others.',
      prevention: 'Require processes to request all required resources at once before execution begins (or release current resources before requesting new ones).',
      feasible: 'Feasible, but can lead to low resource utilization.'
    },
    {
      id: 'no_preemption',
      title: '3. No Preemption',
      desc: 'Resources cannot be preempted; a resource can only be released voluntarily by the process after completing its task.',
      prevention: 'If a process requesting additional resources is denied, all currently held resources are automatically preempted.',
      feasible: 'Feasible for CPU registers and memory, harder for printers/disks.'
    },
    {
      id: 'circular_wait',
      title: '4. Circular Wait',
      desc: 'A closed chain of processes exists, such that each process holds one or more resources needed by the next process in the chain.',
      prevention: 'Impose a strict total ordering of all resource types (e.g., F(R1) = 1, F(R2) = 2). Processes must request resources in strictly increasing order.',
      feasible: 'Most practical and widely implemented OS prevention technique!'
    }
  ];

  const handleSimulatePrevention = (stratId) => {
    setSelectedStrategy(stratId);
    if (stratId === 'hold_wait') {
      setSimMessage('Strategy Applied: Hold & Wait Broken! Processes now allocate 100% of required resources prior to execution start. No process holds resources while waiting.');
    } else if (stratId === 'no_preemption') {
      setSimMessage('Strategy Applied: Preemption Enabled! If Process P2 requests R1 and R1 is unavailable, P2 is forced to surrender all its held resources back to the pool.');
    } else if (stratId === 'circular_wait') {
      setSimMessage('Strategy Applied: Strict Resource Hierarchy Enforced! Ordering: R1 < R2 < R3. Process P2 cannot request R1 while holding R2 because 1 < 2 violates total ordering.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-600" />
          <span>Deadlock Prevention & Coffman Conditions</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Deadlock prevention algorithms work by ensuring that at least one of the four necessary conditions cannot hold.
        </p>
      </div>

      {/* 4 Conditions Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {conditions.map((cond) => (
          <div key={cond.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-indigo-600">{cond.title}</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                Necessary Condition
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium">{cond.desc}</p>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <span className="font-bold text-emerald-700 block">Prevention Protocol:</span>
              <p className="text-slate-600">{cond.prevention}</p>
            </div>
            <div className="text-[11px] text-slate-500 italic">
              <strong>OS Feasibility:</strong> {cond.feasible}
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Prevention Simulator */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Interactive Prevention Strategy Simulator</span>
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => handleSimulatePrevention('hold_wait')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedStrategy === 'hold_wait' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Break Hold and Wait
          </button>

          <button
            onClick={() => handleSimulatePrevention('no_preemption')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedStrategy === 'no_preemption' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Enable Resource Preemption
          </button>

          <button
            onClick={() => handleSimulatePrevention('circular_wait')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedStrategy === 'circular_wait' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Break Circular Wait (Resource Ordering R1 &lt; R2 &lt; R3)
          </button>
        </div>

        {simMessage && (
          <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs font-mono font-semibold">
            {simMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default PreventionPage;
