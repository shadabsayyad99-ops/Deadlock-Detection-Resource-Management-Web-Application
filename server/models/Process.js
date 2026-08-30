const mongoose = require('mongoose');

const processSchema = new mongoose.Schema({
  processId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  priority: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['READY', 'RUNNING', 'WAITING', 'BLOCKED', 'COMPLETED', 'DEADLOCKED'],
    default: 'READY'
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

module.exports = mongoose.model('Process', processSchema);
