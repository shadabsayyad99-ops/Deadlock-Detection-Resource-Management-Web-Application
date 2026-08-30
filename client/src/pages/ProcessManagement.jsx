import React, { useState, useEffect } from 'react';
import { processAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Cpu, Plus, Search, Filter, Edit, Trash2, X } from 'lucide-react';

const ProcessManagement = () => {
  const [processes, setProcesses] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ processId: '', name: '', priority: 1, status: 'READY' });
  const { showNotification } = useAuth();

  const fetchProcesses = async () => {
    try {
      const res = await processAPI.getAll();
      setProcesses(res.data);
    } catch (err) {
      showNotification('Failed to fetch processes', 'error');
    }
  };

  useEffect(() => {
    fetchProcesses();
  }, []);

  const handleOpenModal = (proc = null) => {
    if (proc) {
      setEditingId(proc._id);
      setFormData({ processId: proc.processId, name: proc.name, priority: proc.priority, status: proc.status });
    } else {
      setEditingId(null);
      setFormData({ processId: `P${processes.length + 1}`, name: '', priority: 1, status: 'READY' });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await processAPI.update(editingId, formData);
        showNotification('Process updated successfully', 'success');
      } else {
        await processAPI.create(formData);
        showNotification('Process created successfully', 'success');
      }
      setShowModal(false);
      fetchProcesses();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving process', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this process?')) {
      try {
        await processAPI.delete(id);
        showNotification('Process deleted successfully', 'info');
        fetchProcesses();
      } catch (err) {
        showNotification('Failed to delete process', 'error');
      }
    }
  };

  const statusBadge = (status) => {
    const styles = {
      READY: 'bg-blue-50 text-blue-700 border-blue-200',
      RUNNING: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      WAITING: 'bg-amber-50 text-amber-700 border-amber-200',
      BLOCKED: 'bg-purple-50 text-purple-700 border-purple-200',
      COMPLETED: 'bg-slate-100 text-slate-600 border-slate-200',
      DEADLOCKED: 'bg-red-50 text-red-700 border-red-200 animate-pulse'
    };
    return (
      <span className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase tracking-wider ${styles[status] || styles.READY}`}>
        {status}
      </span>
    );
  };

  const filteredProcesses = processes.filter(p => {
    const matchesSearch = p.processId.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <span>Process Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, configure, and monitor process states and execution priorities.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Process</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2 w-full sm:w-80 shadow-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Process ID or Name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-xs text-slate-800 focus:outline-none w-full"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium shadow-xs"
          >
            <option value="ALL">All Statuses</option>
            <option value="READY">READY</option>
            <option value="RUNNING">RUNNING</option>
            <option value="WAITING">WAITING</option>
            <option value="BLOCKED">BLOCKED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="DEADLOCKED">DEADLOCKED</option>
          </select>
        </div>
      </div>

      {/* Processes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-mono tracking-wider">
              <tr>
                <th className="p-4">Process ID</th>
                <th className="p-4">Process Name</th>
                <th className="p-4">Priority</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created At</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredProcesses.length > 0 ? (
                filteredProcesses.map((proc) => (
                  <tr key={proc._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-indigo-600">{proc.processId}</td>
                    <td className="p-4 font-bold">{proc.name}</td>
                    <td className="p-4 font-mono">P-{proc.priority}</td>
                    <td className="p-4">{statusBadge(proc.status)}</td>
                    <td className="p-4 font-mono text-slate-400">{new Date(proc.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(proc)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="Edit Process"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(proc._id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                        title="Delete Process"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                    No processes found matching query criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 border border-slate-200 shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {editingId ? 'Edit Process Details' : 'Create New Process'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Process ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formData.processId}
                  onChange={(e) => setFormData({ ...formData, processId: e.target.value })}
                  placeholder="e.g. P1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Process Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Memory Buffer Handler"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Priority Level</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Process Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-indigo-500 font-medium"
                  >
                    <option value="READY">READY</option>
                    <option value="RUNNING">RUNNING</option>
                    <option value="WAITING">WAITING</option>
                    <option value="BLOCKED">BLOCKED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="DEADLOCKED">DEADLOCKED</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold shadow-md shadow-indigo-500/20"
                >
                  Save Process
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessManagement;
