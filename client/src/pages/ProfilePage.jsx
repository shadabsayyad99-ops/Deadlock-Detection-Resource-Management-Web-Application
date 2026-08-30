import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Mail, Key } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl font-black text-indigo-600">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{user?.name}</h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">User Profile Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <User className="w-4 h-4 text-indigo-600" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
              <span className="font-bold text-slate-800">{user?.name}</span>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Mail className="w-4 h-4 text-blue-600" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
              <span className="font-bold text-slate-800 font-mono">{user?.email}</span>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Shield className="w-4 h-4 text-purple-600" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Role</span>
              <span className="font-bold text-slate-800">{user?.role}</span>
            </div>
          </div>
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <Key className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Auth Token Security</span>
              <span className="font-bold text-emerald-700 font-mono">JWT Encrypted (bcrypt)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
