import React, { useState, useEffect } from 'react';
import { resourceAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { HardDrive, Plus, Search, Edit, Trash2, X } from 'lucide-react';

const ResourceManagement = () => {
  const [resources, setResources] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ resourceId: '', name: '', totalInstances: 1, availableInstances: 1 });
  const { showNotification } = useAuth();

  const fetchResources = async () => {
    try {
      const res = await resourceAPI.getAll();
      setResources(res.data);
    } catch (err) {
      showNotification('Failed to fetch resources', 'error');
    }
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleOpenModal = (resItem = null) => {
    if (resItem) {
      setEditingId(resItem._id);
      setFormData({
        resourceId: resItem.resourceId,
        name: resItem.name,
        totalInstances: resItem.totalInstances,
        availableInstances: resItem.availableInstances
      });
    } else {
      setEditingId(null);
      setFormData({ resourceId: `R${resources.length + 1}`, name: '', totalInstances: 1, availableInstances: 1 });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await resourceAPI.update(editingId, formData);
        showNotification('Resource updated successfully', 'success');
      } else {
        await resourceAPI.create(formData);
        showNotification('Resource created successfully', 'success');
      }
      setShowModal(false);
      fetchResources();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving resource', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await resourceAPI.delete(id);
        showNotification('Resource deleted successfully', 'info');
        fetchResources();
      } catch (err) {
        showNotification('Failed to delete resource', 'error');
      }
    }
  };

  const filteredResources = resources.filter(r =>
    r.resourceId.toLowerCase().includes(search.toLowerCase()) || r.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-blue-600" />
            <span>Resource Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure system hardware resources (CPUs, Memory, Printers, Scanners) and multi-instance capacities.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add New Resource</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2 w-full sm:w-80 shadow-xs">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Resource ID or Name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-xs text-slate-800 focus:outline-none w-full"
        />
      </div>

      {/* Resources Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-mono tracking-wider">
              <tr>
                <th className="p-4">Resource ID</th>
                <th className="p-4">Resource Name</th>
                <th className="p-4">Total Instances</th>
                <th className="p-4">Allocated Instances</th>
                <th className="p-4">Available Instances</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredResources.length > 0 ? (
                filteredResources.map((resItem) => {
                  const allocated = resItem.totalInstances - resItem.availableInstances;
                  return (
                    <tr key={resItem._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-4 font-mono font-bold text-blue-600">{resItem.resourceId}</td>
                      <td className="p-4 font-bold">{resItem.name}</td>
                      <td className="p-4 font-mono font-bold text-slate-800">{resItem.totalInstances}</td>
                      <td className="p-4 font-mono font-bold text-purple-600">{allocated}</td>
                      <td className="p-4 font-mono font-bold text-emerald-600">{resItem.availableInstances}</td>
                      <td className="p-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenModal(resItem)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Edit Resource"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(resItem._id)}
                          className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                          title="Delete Resource"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 italic">
                    No resources configured yet.
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
                {editingId ? 'Edit Resource' : 'Add New Resource'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Resource ID</label>
                <input
                  type="text"
                  required
                  disabled={!!editingId}
                  value={formData.resourceId}
                  onChange={(e) => setFormData({ ...formData, resourceId: e.target.value })}
                  placeholder="e.g. R1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Resource Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Laser Printer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Total Instances</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.totalInstances}
                    onChange={(e) => setFormData({ ...formData, totalInstances: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Available Instances</label>
                  <input
                    type="number"
                    min="0"
                    max={formData.totalInstances}
                    required
                    value={formData.availableInstances}
                    onChange={(e) => setFormData({ ...formData, availableInstances: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500"
                  />
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
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold shadow-md shadow-blue-500/20"
                >
                  Save Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagement;
