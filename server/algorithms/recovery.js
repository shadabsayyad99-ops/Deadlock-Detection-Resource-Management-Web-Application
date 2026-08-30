const { detectDeadlock } = require('./deadlockDetection');

/**
 * Deadlock Recovery Module
 * Supports:
 * 1. Process Termination
 * 2. Resource Preemption
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

module.exports = {
  recoverByTermination,
  recoverByPreemption
};
