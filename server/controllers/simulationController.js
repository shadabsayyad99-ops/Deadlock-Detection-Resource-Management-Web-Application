const Simulation = require('../models/Simulation');

const getSimulations = async (req, res) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { userId: req.user.userId };
    const simulations = await Simulation.find(filter).sort({ createdAt: -1 });
    res.json(simulations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching simulation history.', error: error.message });
  }
};

const getSimulationById = async (req, res) => {
  try {
    const { id } = req.params;
    const sim = await Simulation.findById(id);
    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found.' });
    }
    if (req.user.role !== 'Admin' && sim.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized access to simulation.' });
    }
    res.json(sim);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching simulation.', error: error.message });
  }
};

const createSimulation = async (req, res) => {
  try {
    const {
      name,
      processes,
      resources,
      allocationMatrix,
      requestMatrix,
      maxMatrix,
      availableVector,
      result,
      deadlockedProcesses,
      safeSequence,
      recoveryAction,
      recoveryStatus
    } = req.body;

    if (!name || !processes || !resources || !result) {
      return res.status(400).json({ message: 'Name, processes, resources, and result are required.' });
    }

    const sim = new Simulation({
      name,
      userId: req.user.userId,
      processes,
      resources,
      allocationMatrix,
      requestMatrix,
      maxMatrix,
      availableVector,
      result,
      deadlockedProcesses,
      safeSequence,
      recoveryAction,
      recoveryStatus
    });

    await sim.save();
    res.status(201).json(sim);
  } catch (error) {
    res.status(500).json({ message: 'Error saving simulation.', error: error.message });
  }
};

const deleteSimulation = async (req, res) => {
  try {
    const { id } = req.params;
    const sim = await Simulation.findById(id);
    if (!sim) {
      return res.status(404).json({ message: 'Simulation not found.' });
    }
    if (req.user.role !== 'Admin' && sim.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized action.' });
    }
    await Simulation.findByIdAndDelete(id);
    res.json({ message: 'Simulation deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting simulation.', error: error.message });
  }
};

module.exports = {
  getSimulations,
  getSimulationById,
  createSimulation,
  deleteSimulation
};
