/**
 * Deadlock Detection Algorithm
 * 
 * Inputs:
 * - processes: Array of process identifiers (e.g. ['P1', 'P2', 'P3'])
 * - resources: Array of resource identifiers (e.g. ['R1', 'R2', 'R3'])
 * - available: Array of numbers representing currently available instances for each resource
 * - allocation: Matrix (2D array) process x resource of allocated instances
 * - request: Matrix (2D array) process x resource of requested instances
 * 
 * Returns:
 * - deadlockDetected: boolean
 * - deadlockedProcesses: Array of process identifiers
 * - safeProcesses: Array of process identifiers
 * - steps: Step by step trace of execution
 * - summaryExplanation: Human-readable educational explanation
 */
function detectDeadlock(processes, resources, rawAvailable, rawAllocation, rawRequest) {
  const n = processes.length;
  const m = resources.length;

  const available = Array.from({ length: m }, (_, j) => Number(rawAvailable?.[j]) || 0);
  const allocation = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => Number(rawAllocation?.[i]?.[j]) || 0)
  );
  const request = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => Number(rawRequest?.[i]?.[j]) || 0)
  );

  const work = [...available];
  const finish = new Array(n).fill(false);

  // Silberschatz: If Allocation[i] == 0 for all j -> Finish[i] = true
  for (let i = 0; i < n; i++) {
    let hasAllocation = false;
    for (let j = 0; j < m; j++) {
      if (allocation[i][j] > 0) {
        hasAllocation = true;
        break;
      }
    }
    if (!hasAllocation) {
      finish[i] = true;
    }
  }

  const steps = [];
  let stepNum = 1;

  steps.push({
    step: stepNum++,
    title: 'Initial State',
    work: [...work],
    finish: [...finish],
    description: `Initialized Work vector to Available resources [${work.join(', ')}].`
  });

  let foundProcess = true;
  while (foundProcess) {
    foundProcess = false;

    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Check if Request[i] <= Work
        let canSatisfy = true;
        for (let j = 0; j < m; j++) {
          if (request[i][j] > work[j]) {
            canSatisfy = false;
            break;
          }
        }

        if (canSatisfy) {
          foundProcess = true;
          finish[i] = true;

          const oldWork = [...work];
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }

          steps.push({
            step: stepNum++,
            process: processes[i],
            processIndex: i,
            request: [...request[i]],
            allocation: [...allocation[i]],
            canSatisfy: true,
            previousWork: oldWork,
            newWork: [...work],
            finish: [...finish],
            description: `Process ${processes[i]} request [${request[i].join(', ')}] <= Work [${oldWork.join(', ')}]. Process finishes and releases allocation [${allocation[i].join(', ')}]. Updated Work = [${work.join(', ')}].`
          });
          break; // restart check from beginning
        }
      }
    }
  }

  const deadlockedProcesses = [];
  const safeProcesses = [];

  for (let i = 0; i < n; i++) {
    if (!finish[i]) {
      deadlockedProcesses.push(processes[i]);
    } else {
      safeProcesses.push(processes[i]);
    }
  }

  const deadlockDetected = deadlockedProcesses.length > 0;

  return {
    deadlockDetected,
    deadlockedProcesses,
    safeProcesses,
    workHistory: steps,
    steps,
    finishVector: finish,
    summaryExplanation: deadlockDetected
      ? `DEADLOCK DETECTED! Processes [${deadlockedProcesses.join(', ')}] are in a deadlock condition because their requests exceed currently available work and no other process can release resources.`
      : `NO DEADLOCK DETECTED. All processes can successfully complete and release their allocated resources in sequence.`
  };
}

module.exports = {
  detectDeadlock
};
