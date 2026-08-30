import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Shield, Users, Trash2 } from 'lucide-react';

const AdminPage = () => {
  const [users, setUsers] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const { showNotification } = useAuth();

  const fetchAdminData = async () => {
    try {
      const [uRes, sRes] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getSimulations()
      ]);
      setUsers(uRes.data);
      setSimulations(sRes.data);
    } catch (err) {
      showNotification('Error loading admin portal data', 'error');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (window.confirm('Are you sure you want to delete this user and all associated processes/resources?')) {
      try {
        await adminAPI.deleteUser(id);
        showNotification('User deleted successfully', 'info');
        fetchAdminData();
      } catch (err) {
        showNotification(err.response?.data?.message || 'Failed to delete user', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-600" />
          <span>System Administration Portal</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage system users, oversee platform simulations, and exercise administrative control.
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4 p-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <span>Registered System Users ({users.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase font-mono tracking-wider">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
                <th className="p-3">Registered At</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {users.map((u) => (
                <tr key={u._id} className="hover:bg-slate-50/80">
                  <td className="p-3 font-bold text-slate-900">{u.name}</td>
                  <td className="p-3 font-mono text-indigo-600 font-semibold">{u.email}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      u.role === 'Admin' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
