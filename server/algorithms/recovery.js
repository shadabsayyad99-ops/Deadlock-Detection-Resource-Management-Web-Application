const { detectDeadlock } = require('./deadlockDetection');

/**
 * Deadlock Recovery Module
 * Supports:
 * 1. Process Termination
 * 2. Resource Preemption
 * 3. Automated Deadlock Recovery (Auto-Selection & Resolution)
 */

function recoverByTermination(processes, resources, available, allocation, request, processToTerminate) {
  const pIndex = processes.indexOf(processToTerminate);
  if (pIndex === -1) {
    return { success: false, message: `Process ${processToTerminate} not found.` };
  }

  // Create new state with process terminated
  const newProcesses = processes.filter((_, idx) => idx !== pIndex);
  const newAvailable = [...available];

  // Return allocated resources of terminated process back to Available vector
  for (let j = 0; j < resources.length; j++) {
    newAvailable[j] += allocation[pIndex][j];
  }

  const newAllocation = allocation.filter((_, idx) => idx !== pIndex);
  const newRequest = request.filter((_, idx) => idx !== pIndex);

  // Run deadlock detection on new state
  const detectionResult = detectDeadlock(newProcesses, resources, newAvailable, newAllocation, newRequest);

  return {
    strategy: 'Process Termination',
    terminatedProcess: processToTerminate,
    releasedResources: allocation[pIndex],
    newAvailable,
    newProcesses,
    newAllocation,
    newRequest,
    deadlockResolved: !detectionResult.deadlockDetected,
    detectionResult,
    message: !detectionResult.deadlockDetected
      ? `Recovery Successful! Process ${processToTerminate} was terminated and its allocated resources were reclaimed. Deadlock has been resolved.`
      : `Process ${processToTerminate} was terminated, but deadlock STILL EXISTS among remaining processes: ${detectionResult.deadlockedProcesses.join(', ')}.`
  };
}

function recoverByPreemption(processes, resources, available, allocation, request, victimProcess, resourceToPreempt, preemptCount = 1) {
  const pIndex = processes.indexOf(victimProcess);
  const rIndex = resources.indexOf(resourceToPreempt);

  if (pIndex === -1 || rIndex === -1) {
    return { success: false, message: 'Invalid process or resource specified for preemption.' };
  }

  const currentAllocated = allocation[pIndex][rIndex];
  if (currentAllocated <= 0) {
    return { success: false, message: `Process ${victimProcess} does not hold any instances of ${resourceToPreempt}.` };
  }

  const countToPreempt = Math.min(currentAllocated, preemptCount);

  // Copy state
  const newAvailable = [...available];
  const newAllocation = allocation.map(row => [...row]);
  const newRequest = request.map(row => [...row]);

  // Preempt
  newAllocation[pIndex][rIndex] -= countToPreempt;
  newAvailable[rIndex] += countToPreempt;
  // Add preempted resource to victim process request so it can try again later
  newRequest[pIndex][rIndex] += countToPreempt;

  // Run detection
  const detectionResult = detectDeadlock(processes, resources, newAvailable, newAllocation, newRequest);

  return {
    strategy: 'Resource Preemption',
    victimProcess,
    preemptedResource: resourceToPreempt,
    countPreempted: countToPreempt,
    newAvailable,
    newAllocation,
    newRequest,
    deadlockResolved: !detectionResult.deadlockDetected,
    detectionResult,
    message: !detectionResult.deadlockDetected
      ? `Recovery Successful! ${countToPreempt} instance(s) of ${resourceToPreempt} were preempted from Process ${victimProcess}. Deadlock has been resolved.`
      : `${countToPreempt} instance(s) of ${resourceToPreempt} were preempted from Process ${victimProcess}, but deadlock STILL EXISTS.`
  };
}

/**
 * Automated Deadlock Recovery Algorithm
 * Automatically identifies deadlocked processes, ranks them by resource holdings,
 * and terminates/preempts the optimal victims iteratively until deadlock is 100% resolved.
 */
function autoRecoverDeadlock(processes, resources, available, allocation, request, mode = 'termination') {
  let currProcesses = [...processes];
  let currAvailable = [...available];
  let currAllocation = allocation.map(row => [...row]);
  let currRequest = request.map(row => [...row]);

  const steps = [];
  const terminatedVictims = [];
  let iterations = 0;
  const maxIterations = processes.length;

  let initialDetection = detectDeadlock(currProcesses, resources, currAvailable, currAllocation, currRequest);

  if (!initialDetection.deadlockDetected) {
    return {
      autoMode: true,
      deadlockResolved: true,
      steps: ['System is already in a SAFE state. No recovery needed!'],
      terminatedVictims: [],
      newProcesses: currProcesses,
      newAvailable: currAvailable,
      newAllocation: currAllocation,
      newRequest: currRequest,
      message: 'Automated Recovery: System is already safe! No deadlock detected.'
    };
  }

  while (iterations < maxIterations) {
    const detection = detectDeadlock(currProcesses, resources, currAvailable, currAllocation, currRequest);
    if (!detection.deadlockDetected) {
      break;
    }

    const deadlockedProcs = detection.deadlockedProcesses;
    if (deadlockedProcs.length === 0) break;

    // Pick optimal victim: process among deadlocked that holds the MOST total allocated resources
    let bestVictimIndex = -1;
    let maxHeld = -1;

    deadlockedProcs.forEach(pName => {
      const idx = currProcesses.indexOf(pName);
      if (idx !== -1) {
        const totalHeld = currAllocation[idx].reduce((sum, v) => sum + v, 0);
        if (totalHeld > maxHeld) {
          maxHeld = totalHeld;
          bestVictimIndex = idx;
        }
      }
    });

    if (bestVictimIndex === -1) {
      bestVictimIndex = currProcesses.indexOf(deadlockedProcs[0]);
    }

    const victimName = currProcesses[bestVictimIndex];
    terminatedVictims.push(victimName);

    // Reclaim resources
    const reclaimed = [...currAllocation[bestVictimIndex]];
    for (let j = 0; j < resources.length; j++) {
      currAvailable[j] += currAllocation[bestVictimIndex][j];
    }

    steps.push(`Step ${iterations + 1}: Automatically terminated deadlocked victim process ${victimName}. Reclaimed resources: [${reclaimed.join(', ')}]. Updated Available: [${currAvailable.join(', ')}].`);

    // Remove victim from state
    currProcesses = currProcesses.filter((_, i) => i !== bestVictimIndex);
    currAllocation = currAllocation.filter((_, i) => i !== bestVictimIndex);
    currRequest = currRequest.filter((_, i) => i !== bestVictimIndex);

    iterations++;
  }

  const finalCheck = detectDeadlock(currProcesses, resources, currAvailable, currAllocation, currRequest);

  return {
    autoMode: true,
    deadlockResolved: !finalCheck.deadlockDetected,
    steps,
    terminatedVictims,
    newProcesses: currProcesses,
    newAvailable: currAvailable,
    newAllocation: currAllocation,
    newRequest: currRequest,
    message: !finalCheck.deadlockDetected
      ? `Automated Deadlock Recovery Successful! Terminated ${terminatedVictims.length} victim process(es): [${terminatedVictims.join(', ')}]. System is now 100% SAFE.`
      : `Automated Recovery completed ${iterations} steps, but deadlock persists.`
  };
}

module.exports = {
  recoverByTermination,
  recoverByPreemption,
  autoRecoverDeadlock
};
