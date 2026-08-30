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
 * - workHistory: Step by step trace of execution
 * - summaryExplanation: Human-readable educational explanation
 */
function detectDeadlock(processes, resources, available, allocation, request) {
  const n = processes.length;
  const m = resources.length;

  const work = [...available];
  const finish = new Array(n).fill(false);

  // If a process has zero allocations across all resources, it doesn't hold anything.
  // Standard detection algorithm: if Allocation[i] == 0, Finish[i] = true (or can be treated as finished initially if no request, but standard formulation checks if Request[i] <= Work).
  // Standard OS algorithm (Silberschatz):
  // 1. Work = Available
  // For i = 0..n-1, if Allocation[i] != 0 -> Finish[i] = false; else Finish[i] = true.
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

          // Work = Work + Allocation[i]
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
            description: `Process ${processes[i]} request [${request[i].join(', ')}] <= Work [${oldWork.join(', ')}]. Process ${processes[i]} can finish and release its allocation [${allocation[i].join(', ')}]. Updated Work = [${work.join(', ')}].`
          });
        } else {
          steps.push({
            step: stepNum++,
            process: processes[i],
            processIndex: i,
            request: [...request[i]],
            canSatisfy: false,
            work: [...work],
            description: `Process ${processes[i]} request [${request[i].join(', ')}] exceeds available Work [${work.join(', ')}]. Process must wait.`
          });
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

  // Generate clear educational explanation
  let summaryExplanation = '';
  if (deadlockDetected) {
    summaryExplanation = `Deadlock Detected! The system is in a deadlock state involving ${deadlockedProcesses.length} process(es): ${deadlockedProcesses.join(', ')}. `;
    summaryExplanation += `These processes are waiting for resources that are held by each other, causing a circular wait condition. None of these processes can proceed to release their allocated resources.`;
  } else {
    summaryExplanation = `No Deadlock Detected. All processes (${processes.join(', ')}) were able to complete successfully in sequence without circular dependencies.`;
  }

  return {
    deadlockDetected,
    deadlockedProcesses,
    safeProcesses,
    finalWork: work,
    steps,
    summaryExplanation
  };
}

module.exports = { detectDeadlock };
