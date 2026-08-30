const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  resourceId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  totalInstances: {
    type: Number,
    required: true,
    min: 0
  },
  availableInstances: {
    type: Number,
    required: true,
    min: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Resource', resourceSchema);
