const Process = require('../models/Process');

const getProcesses = async (req, res) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { userId: req.user.userId };
    const processes = await Process.find(filter).sort({ createdAt: -1 });
    res.json(processes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching processes.', error: error.message });
  }
};

const createProcess = async (req, res) => {
  try {
    const { processId, name, priority, status } = req.body;

    if (!processId || !name) {
      return res.status(400).json({ message: 'Process ID and Name are required.' });
    }

    // Check duplicate ID for user
    const existing = await Process.findOne({ processId, userId: req.user.userId });
    if (existing) {
      return res.status(400).json({ message: `Process ID "${processId}" already exists.` });
    }

    const process = new Process({
      processId,
      name,
      priority: priority !== undefined ? priority : 1,
      status: status || 'READY',
      userId: req.user.userId
    });

    await process.save();
    res.status(201).json(process);
  } catch (error) {
    res.status(500).json({ message: 'Error creating process.', error: error.message });
  }
};

const updateProcess = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, priority, status } = req.body;

    const process = await Process.findById(id);
    if (!process) {
      return res.status(404).json({ message: 'Process not found.' });
    }

    if (req.user.role !== 'Admin' && process.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized action on process.' });
    }

    if (name !== undefined) process.name = name;
    if (priority !== undefined) process.priority = priority;
    if (status !== undefined) process.status = status;

    await process.save();
    res.json(process);
  } catch (error) {
    res.status(500).json({ message: 'Error updating process.', error: error.message });
  }
};

const deleteProcess = async (req, res) => {
  try {
    const { id } = req.params;

    const process = await Process.findById(id);
    if (!process) {
      return res.status(404).json({ message: 'Process not found.' });
    }

    if (req.user.role !== 'Admin' && process.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized action on process.' });
    }

    await Process.findByIdAndDelete(id);
    res.json({ message: 'Process deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting process.', error: error.message });
  }
};

module.exports = {
  getProcesses,
  createProcess,
  updateProcess,
  deleteProcess
};
