import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Cpu,
  HardDrive,
  Share2,
  ShieldAlert,
  Calculator,
  GitFork,
  PlaySquare,
  RefreshCw,
  Lock,
  Columns,
  History,
  FileSpreadsheet,
  User,
  Shield,
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Processes', path: '/processes', icon: Cpu },
    { name: 'Resources', path: '/resources', icon: HardDrive },
    { name: 'Allocation Matrix', path: '/allocation', icon: Share2 },
    { name: 'Deadlock Detection', path: '/deadlock-detection', icon: ShieldAlert },
    { name: 'Banker\'s Algorithm', path: '/bankers-algorithm', icon: Calculator },
    { name: 'Resource Graph', path: '/resource-allocation-graph', icon: GitFork },
    { name: 'Simulation', path: '/simulation', icon: PlaySquare },
    { name: 'Recovery', path: '/recovery', icon: RefreshCw },
    { name: 'Prevention', path: '/prevention', icon: Lock },
    { name: 'Comparison', path: '/comparison', icon: Columns },
    { name: 'History', path: '/history', icon: History },
    { name: 'Reports', path: '/reports', icon: FileSpreadsheet },
    { name: 'Profile', path: '/profile', icon: User },
  ];

  if (user && user.role === 'Admin') {
    navItems.push({ name: 'Admin Portal', path: '/admin', icon: Shield });
  }

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 shrink-0 select-none shadow-sm">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <ShieldAlert className="w-6 h-6 text-white stroke-[2.5]" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            DeadLockGuard
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-semibold">
            OS Resource Engine
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 font-bold border border-indigo-100 shadow-sm'
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-700 shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
              <span className="inline-block px-1.5 py-0.2 text-[9px] font-mono rounded bg-white text-slate-500 border border-slate-200 font-semibold">
                {user?.role || 'User'}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
