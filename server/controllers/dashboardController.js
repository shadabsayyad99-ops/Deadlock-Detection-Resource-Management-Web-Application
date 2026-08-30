const Process = require('../models/Process');
const Resource = require('../models/Resource');
const Simulation = require('../models/Simulation');

const getDashboardStats = async (req, res) => {
  try {
    const userFilter = req.user.role === 'Admin' ? {} : { userId: req.user.userId };

    const totalProcesses = await Process.countDocuments(userFilter);
    const totalResources = await Resource.countDocuments(userFilter);
    
    const resources = await Resource.find(userFilter);
    let totalAllocatedInstances = 0;
    let totalAvailableInstances = 0;
    resources.forEach(r => {
      totalAvailableInstances += r.availableInstances;
      totalAllocatedInstances += (r.totalInstances - r.availableInstances);
    });

    const activeSimulations = await Simulation.countDocuments(userFilter);
    const deadlocksDetected = await Simulation.countDocuments({ ...userFilter, result: 'DEADLOCKED' });

    const simulations = await Simulation.find(userFilter);
    let deadlockedProcessesCount = 0;
    let successfulRecoveries = 0;

    simulations.forEach(sim => {
      if (sim.deadlockedProcesses) {
        deadlockedProcessesCount += sim.deadlockedProcesses.length;
      }
      if (sim.recoveryStatus === 'Successful' || sim.recoveryAction !== 'None') {
        successfulRecoveries++;
      }
    });

    res.json({
      totalProcesses,
      totalResources,
      allocatedResources: totalAllocatedInstances,
      availableResources: totalAvailableInstances,
      activeSimulations,
      deadlocksDetected,
      deadlockedProcesses: deadlockedProcessesCount,
      successfulRecoveries
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats.', error: error.message });
  }
};

const getRecentActivity = async (req, res) => {
  try {
    const userFilter = req.user.role === 'Admin' ? {} : { userId: req.user.userId };
    
    const recentSimulations = await Simulation.find(userFilter).sort({ createdAt: -1 }).limit(5);
    const recentProcesses = await Process.find(userFilter).sort({ createdAt: -1 }).limit(5);
    const recentResources = await Resource.find(userFilter).sort({ createdAt: -1 }).limit(5);

    res.json({
      recentSimulations,
      recentProcesses,
      recentResources
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching recent activity.', error: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getRecentActivity
};
