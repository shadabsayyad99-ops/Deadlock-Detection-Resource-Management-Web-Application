const User = require('../models/User');
const Process = require('../models/Process');
const Resource = require('../models/Resource');
const Simulation = require('../models/Simulation');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users.', error: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.userId) {
      return res.status(400).json({ message: 'Cannot delete your own admin account.' });
    }
    await User.findByIdAndDelete(id);
    await Process.deleteMany({ userId: id });
    await Resource.deleteMany({ userId: id });
    await Simulation.deleteMany({ userId: id });
    res.json({ message: 'User and all associated data deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user.', error: error.message });
  }
};

const getAllSimulationsAdmin = async (req, res) => {
  try {
    const simulations = await Simulation.find().populate('userId', 'name email role').sort({ createdAt: -1 });
    res.json(simulations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching admin simulations.', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAllSimulationsAdmin
};
