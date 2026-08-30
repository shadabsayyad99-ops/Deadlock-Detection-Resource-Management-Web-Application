const Resource = require('../models/Resource');

const getResources = async (req, res) => {
  try {
    const filter = req.user.role === 'Admin' ? {} : { userId: req.user.userId };
    const resources = await Resource.find(filter).sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching resources.', error: error.message });
  }
};

const createResource = async (req, res) => {
  try {
    const { resourceId, name, totalInstances, availableInstances } = req.body;

    if (!resourceId || !name || totalInstances === undefined) {
      return res.status(400).json({ message: 'Resource ID, Name, and Total Instances are required.' });
    }

    if (totalInstances < 0) {
      return res.status(400).json({ message: 'Total instances cannot be negative.' });
    }

    const existing = await Resource.findOne({ resourceId, userId: req.user.userId });
    if (existing) {
      return res.status(400).json({ message: `Resource ID "${resourceId}" already exists.` });
    }

    const avail = availableInstances !== undefined ? availableInstances : totalInstances;

    const resource = new Resource({
      resourceId,
      name,
      totalInstances,
      availableInstances: Math.min(avail, totalInstances),
      userId: req.user.userId
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Error creating resource.', error: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, totalInstances, availableInstances } = req.body;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    if (req.user.role !== 'Admin' && resource.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized action on resource.' });
    }

    if (name !== undefined) resource.name = name;
    if (totalInstances !== undefined) {
      if (totalInstances < 0) return res.status(400).json({ message: 'Total instances cannot be negative.' });
      resource.totalInstances = totalInstances;
    }
    if (availableInstances !== undefined) {
      if (availableInstances < 0) return res.status(400).json({ message: 'Available instances cannot be negative.' });
      resource.availableInstances = Math.min(availableInstances, resource.totalInstances);
    }

    await resource.save();
    res.json(resource);
  } catch (error) {
    res.status(500).json({ message: 'Error updating resource.', error: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const { id } = req.params;

    const resource = await Resource.findById(id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found.' });
    }

    if (req.user.role !== 'Admin' && resource.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Unauthorized action on resource.' });
    }

    await Resource.findByIdAndDelete(id);
    res.json({ message: 'Resource deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting resource.', error: error.message });
  }
};

module.exports = {
  getResources,
  createResource,
  updateResource,
  deleteResource
};
