const { detectDeadlock } = require('../algorithms/deadlockDetection');
const { checkSafety, requestResource } = require('../algorithms/bankersAlgorithm');
const { detectCyclesInRAG } = require('../algorithms/cycleDetection');
const { recoverByTermination, recoverByPreemption, autoRecoverDeadlock } = require('../algorithms/recovery');
const Simulation = require('../models/Simulation');

const runDetection = async (req, res) => {
  try {
    const { processes, resources, available, allocation, request, simulationName } = req.body;

    if (!processes || !resources || !available || !allocation || !request) {
      return res.status(400).json({ message: 'Missing required inputs (processes, resources, available, allocation, request).' });
    }

    const result = detectDeadlock(processes, resources, available, allocation, request);

    // Save simulation record if requested or provided
    let savedSimulation = null;
    if (simulationName) {
      const sim = new Simulation({
        name: simulationName,
        userId: req.user.userId,
        processes,
        resources,
        allocationMatrix: allocation,
        requestMatrix: request,
        availableVector: available,
        result: result.deadlockDetected ? 'DEADLOCKED' : 'SAFE',
        deadlockedProcesses: result.deadlockedProcesses,
        safeSequence: result.safeProcesses
      });
      savedSimulation = await sim.save();
    }

    res.json({
      ...result,
      simulationId: savedSimulation ? savedSimulation._id : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error running deadlock detection.', error: error.message });
  }
};

const runBankers = async (req, res) => {
  try {
    const { processes, resources, available, allocation, maximum, processIndex, requestVector, mode } = req.body;

    if (!processes || !resources || !available || !allocation || !maximum) {
      return res.status(400).json({ message: 'Missing required inputs for Banker\'s Algorithm.' });
    }

    if (mode === 'request') {
      if (processIndex === undefined || !requestVector) {
        return res.status(400).json({ message: 'Process index and request vector are required for request mode.' });
      }
      const requestResult = requestResource(processes, resources, available, allocation, maximum, processIndex, requestVector);
      return res.json(requestResult);
    } else {
      // Default: Safety Check
      const safetyResult = checkSafety(processes, resources, available, allocation, maximum);
      return res.json(safetyResult);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error running Banker\'s Algorithm.', error: error.message });
  }
};

const runCycleDetection = async (req, res) => {
  try {
    const { processes, resources, allocation, request, totalInstances } = req.body;

    if (!processes || !resources || !allocation || !request) {
      return res.status(400).json({ message: 'Missing graph inputs (processes, resources, allocation, request).' });
    }

    const ragResult = detectCyclesInRAG(processes, resources, allocation, request, totalInstances);
    res.json(ragResult);
  } catch (error) {
    res.status(500).json({ message: 'Error performing cycle detection on RAG.', error: error.message });
  }
};

const runRecovery = async (req, res) => {
  try {
    const { processes, resources, available, allocation, request, strategy, targetProcess, preemptResource, count } = req.body;

    if (!processes || !resources || !available || !allocation || !request || !strategy) {
      return res.status(400).json({ message: 'Missing recovery inputs.' });
    }

    let recoveryResult;
    if (strategy === 'auto') {
      recoveryResult = autoRecoverDeadlock(processes, resources, available, allocation, request);
    } else if (strategy === 'termination') {
      if (!targetProcess) return res.status(400).json({ message: 'Process to terminate must be specified.' });
      recoveryResult = recoverByTermination(processes, resources, available, allocation, request, targetProcess);
    } else if (strategy === 'preemption') {
      if (!targetProcess || !preemptResource) return res.status(400).json({ message: 'Target process and resource must be specified for preemption.' });
      recoveryResult = recoverByPreemption(processes, resources, available, allocation, request, targetProcess, preemptResource, count || 1);
    } else {
      return res.status(400).json({ message: 'Invalid recovery strategy specified. Use "auto", "termination", or "preemption".' });
    }

    res.json(recoveryResult);
  } catch (error) {
    res.status(500).json({ message: 'Error performing deadlock recovery.', error: error.message });
  }
};

module.exports = {
  runDetection,
  runBankers,
  runCycleDetection,
  runRecovery
};
