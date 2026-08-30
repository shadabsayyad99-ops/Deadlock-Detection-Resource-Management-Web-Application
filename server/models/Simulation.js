const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  processes: [{ type: String }],
  resources: [{ type: String }],
  allocationMatrix: [[{ type: Number }]],
  requestMatrix: [[{ type: Number }]],
  maxMatrix: [[{ type: Number }]],
  availableVector: [{ type: Number }],
  result: {
    type: String,
    enum: ['SAFE', 'DEADLOCKED', 'UNSAFE'],
    required: true
  },
  deadlockedProcesses: [{ type: String }],
  safeSequence: [{ type: String }],
  recoveryAction: {
    type: String,
    default: 'None'
  },
  recoveryStatus: {
    type: String,
    default: 'N/A'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Simulation', simulationSchema);
