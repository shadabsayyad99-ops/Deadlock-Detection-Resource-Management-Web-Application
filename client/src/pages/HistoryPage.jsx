import React, { useState, useEffect } from 'react';
import { simulationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { History, Search, Filter, Trash2, Eye, X } from 'lucide-react';

const HistoryPage = () => {
  const [simulations, setSimulations] = useState([]);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState('ALL');
  const [selectedSim, setSelectedSim] = useState(null);
  const { showNotification } = useAuth();

  const fetchHistory = async () => {
    try {
      const res = await simulationAPI.getAll();
      setSimulations(res.data);
    } catch (err) {
      showNotification('Failed to load simulation history', 'error');
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Delete this simulation record?')) {
      try {
        await simulationAPI.delete(id);
        showNotification('Simulation history record deleted', 'info');
        fetchHistory();
      } catch (err) {
        showNotification('Error deleting record', 'error');
      }
    }
  };

  const filtered = simulations.filter(sim => {
    const matchesSearch = sim.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filterResult === 'ALL' || sim.result === filterResult;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-600" />
            <span>Simulation Execution History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Historical log of all executed deadlock detection runs and recovery interventions saved in MongoDB.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2 w-full sm:w-80 shadow-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search simulation name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterResult}
            onChange={(e) => setFilterResult(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium shadow-xs"
          >
            <option value="ALL">All Results</option>
            <option value="SAFE">SAFE Only</option>
            <option value="DEADLOCKED">DEADLOCKED Only</option>
            <option value="UNSAFE">UNSAFE Only</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-mono tracking-wider">
              <tr>
                <th className="p-4">Simulation Name</th>
                <th className="p-4">Processes</th>
                <th className="p-4">Resources</th>
                <th className="p-4">Result</th>
                <th className="p-4">Recovery Action</th>
                <th className="p-4">Created At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.length > 0 ? (
                filtered.map((sim) => (
                  <tr key={sim._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-bold text-indigo-600">{sim.name}</td>
                    <td className="p-4 font-mono">{sim.processes.join(', ')}</td>
                    <td className="p-4 font-mono">{sim.resources.join(', ')}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                        sim.result === 'SAFE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {sim.result}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-medium">{sim.recoveryAction || 'None'}</td>
                    <td className="p-4 text-slate-400 font-mono">{new Date(sim.createdAt).toLocaleString()}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => setSelectedSim(sim)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(sim._id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-400 italic">
                    No simulation records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulation Detail Modal */}
      {selectedSim && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 border border-slate-200 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">{selectedSim.name}</h3>
              <button onClick={() => setSelectedSim(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-500 block">Result:</span>
                <span className="font-bold text-indigo-600">{selectedSim.result}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Date Executed:</span>
                <span className="text-slate-800 font-semibold">{new Date(selectedSim.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Deadlocked Processes:</span>
              <p className="font-mono font-bold text-red-600">
                {selectedSim.deadlockedProcesses && selectedSim.deadlockedProcesses.length > 0 ? selectedSim.deadlockedProcesses.join(', ') : 'None'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
