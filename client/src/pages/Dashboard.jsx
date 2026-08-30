import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import {
  Cpu,
  HardDrive,
  Share2,
  CheckCircle,
  AlertTriangle,
  PlaySquare,
  RefreshCw,
  Activity,
  ArrowUpRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProcesses: 4,
    totalResources: 3,
    allocatedResources: 4,
    availableResources: 3,
    activeSimulations: 2,
    deadlocksDetected: 1,
    deadlockedProcesses: 2,
    successfulRecoveries: 1
  });
  const [activity, setActivity] = useState({
    recentSimulations: [],
    recentProcesses: [],
    recentResources: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, activityRes] = await Promise.all([
          dashboardAPI.getStats(),
          dashboardAPI.getActivity()
        ]);
        setStats(statsRes.data);
        setActivity(activityRes.data);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const resourceAllocationChartData = [
    { name: 'Allocated', value: stats.allocatedResources, fill: '#6366f1' },
    { name: 'Available', value: stats.availableResources, fill: '#10b981' }
  ];

  const deadlockHistoryData = [
    { label: 'Run 1', safe: 1, deadlock: 0 },
    { label: 'Run 2', safe: 0, deadlock: 1 },
    { label: 'Run 3', safe: 2, deadlock: 0 },
    { label: 'Run 4', safe: 1, deadlock: 1 },
    { label: 'Run 5', safe: 3, deadlock: 0 }
  ];

  const statCards = [
    { title: 'Total Processes', value: stats.totalProcesses, icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
    { title: 'Total Resources', value: stats.totalResources, icon: HardDrive, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
    { title: 'Allocated Instances', value: stats.allocatedResources, icon: Share2, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
    { title: 'Available Instances', value: stats.availableResources, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
    { title: 'Active Simulations', value: stats.activeSimulations, icon: PlaySquare, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
    { title: 'Deadlocks Detected', value: stats.deadlocksDetected, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
    { title: 'Deadlocked Processes', value: stats.deadlockedProcesses, icon: Activity, color: 'text-rose-600', bg: 'bg-rose-50 border-rose-100' },
    { title: 'Successful Recoveries', value: stats.successfulRecoveries, icon: RefreshCw, color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <span>Operating System Control Dashboard</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-700 font-bold border border-emerald-200">ONLINE</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time telemetry, process state monitoring, and deadlock detection statistics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/deadlock-detection"
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            <span>Run Detection</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
          <Link
            to="/simulation"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            Launch Scenario
          </Link>
        </div>
      </div>

      {/* 8 Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className={`p-4 rounded-2xl border ${card.bg} glass-card-hover flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className="mt-3">
                <span className={`text-2xl font-black ${card.color}`}>{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resource Allocation & Availability */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Resource Instance Distribution</h3>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">Allocated vs Available</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceAllocationChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {resourceAllocationChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
              <span className="text-slate-600 font-medium">Allocated ({stats.allocatedResources})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">Available ({stats.availableResources})</span>
            </div>
          </div>
        </div>

        {/* Deadlock Detection Telemetry */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Detection History Trend</h3>
            <span className="text-[10px] font-mono text-slate-400 font-semibold">Safe vs Deadlock Runs</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={deadlockHistoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Area type="monotone" dataKey="safe" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                <Area type="monotone" dataKey="deadlock" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 text-xs mt-2">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-600 font-medium">Safe Executions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-slate-600 font-medium">Deadlocked Executions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Recent Simulation Log</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-mono">
                <th className="pb-3">Simulation Name</th>
                <th className="pb-3">Processes</th>
                <th className="pb-3">Resources</th>
                <th className="pb-3">Detection Result</th>
                <th className="pb-3">Recovery Status</th>
                <th className="pb-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {activity.recentSimulations && activity.recentSimulations.length > 0 ? (
                activity.recentSimulations.map((sim) => (
                  <tr key={sim._id} className="hover:bg-slate-50/80">
                    <td className="py-3 font-semibold text-indigo-600">{sim.name}</td>
                    <td className="py-3 font-mono">{sim.processes.join(', ')}</td>
                    <td className="py-3 font-mono">{sim.resources.join(', ')}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        sim.result === 'SAFE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {sim.result}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 font-medium">{sim.recoveryAction || 'None'}</td>
                    <td className="py-3 text-slate-400 font-mono">{new Date(sim.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400 italic">
                    No recent simulations logged yet. Run a simulation scenario to populate history.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
