import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Search, Terminal, Activity } from 'lucide-react';

const Navbar = () => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Search Input */}
      <div className="flex items-center gap-3 bg-slate-100/80 border border-slate-200 rounded-xl px-3.5 py-1.5 w-72 focus-within:border-indigo-400 focus-within:bg-white transition-all">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search processes, resources, simulations..."
          className="bg-transparent text-xs text-slate-700 focus:outline-none w-full placeholder:text-slate-400 font-medium"
        />
      </div>

      {/* Right Navbar items */}
      <div className="flex items-center gap-4">
        {/* System Time Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-600 font-semibold">
          <Activity className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          <span>{time}</span>
        </div>

        {/* Notifications Icon */}
        <button
          className="relative p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-slate-300 transition-all"
          title="System Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-white"></span>
        </button>

        {/* Console / Status Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold">
            {user?.role === 'Admin' ? 'Admin Node' : 'Student Node'}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
