const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Process = require('./models/Process');
const Resource = require('./models/Resource');
const Simulation = require('./models/Simulation');

const seedData = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/deadlock_system';
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing
    await User.deleteMany({});
    await Process.deleteMany({});
    await Resource.deleteMany({});
    await Simulation.deleteMany({});

    // Hash admin password
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('shahadabvit@848281', salt);

    // Create Single System Admin User
    const adminUser = await User.create({
      name: 'shahadab sayyad',
      email: 'shahadab.sayyad@deadlockguard.com',
      password: adminPassword,
      role: 'Admin'
    });

    console.log('Single System Admin created: shahadab sayyad (Password: shahadabvit@848281)');

    // Create Sample Processes for Admin
    const sampleProcesses = [
      { processId: 'P0', name: 'Web Server Process', priority: 1, status: 'RUNNING', userId: adminUser._id },
      { processId: 'P1', name: 'Database Query Engine', priority: 2, status: 'WAITING', userId: adminUser._id },
      { processId: 'P2', name: 'Background Backup Task', priority: 3, status: 'READY', userId: adminUser._id },
      { processId: 'P3', name: 'Analytics Worker', priority: 2, status: 'BLOCKED', userId: adminUser._id }
    ];
    await Process.insertMany(sampleProcesses);

    // Create Sample Resources for Admin
    const sampleResources = [
      { resourceId: 'R1', name: 'CPU Core', totalInstances: 3, availableInstances: 1, userId: adminUser._id },
      { resourceId: 'R2', name: 'Printer Unit', totalInstances: 2, availableInstances: 0, userId: adminUser._id },
      { resourceId: 'R3', name: 'Memory Buffer', totalInstances: 4, availableInstances: 2, userId: adminUser._id }
    ];
    await Resource.insertMany(sampleResources);

    // Create Sample Simulations
    const sampleSimulations = [
      {
        name: 'Operating Systems Lab 1 - Safe State Scenario',
        userId: adminUser._id,
        processes: ['P0', 'P1', 'P2'],
        resources: ['R1', 'R2', 'R3'],
        allocationMatrix: [[0, 1, 0], [2, 0, 0], [3, 0, 2]],
        requestMatrix: [[0, 0, 0], [2, 0, 2], [0, 0, 0]],
        maxMatrix: [[7, 5, 3], [3, 2, 2], [9, 0, 2]],
        availableVector: [3, 3, 2],
        result: 'SAFE',
        safeSequence: ['P2', 'P1', 'P3'],
        deadlockedProcesses: [],
        recoveryAction: 'None',
        recoveryStatus: 'N/A'
      },
      {
        name: 'Operating Systems Lab 2 - Classic Circular Wait Deadlock',
        userId: adminUser._id,
        processes: ['P1', 'P2'],
        resources: ['R1', 'R2'],
        allocationMatrix: [[1, 0], [0, 1]],
        requestMatrix: [[0, 1], [1, 0]],
        maxMatrix: [[1, 1], [1, 1]],
        availableVector: [0, 0],
        result: 'DEADLOCKED',
        deadlockedProcesses: ['P1', 'P2'],
        safeSequence: [],
        recoveryAction: 'Process Termination (P1)',
        recoveryStatus: 'Successful'
      }
    ];
    await Simulation.insertMany(sampleSimulations);

    console.log('Sample processes, resources, and simulations seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error.message);
    process.exit(1);
  }
};

seedData();
