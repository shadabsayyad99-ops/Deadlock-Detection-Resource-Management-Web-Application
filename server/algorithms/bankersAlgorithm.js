/**
 * Banker's Algorithm for Deadlock Avoidance
 * 
 * Need Matrix = Maximum Matrix - Allocation Matrix
 * 
 * Safety Algorithm:
 * 1. Work = Available, Finish[i] = false for i = 0..n-1
 * 2. Find an i such that Finish[i] == false AND Need[i] <= Work
 *    If no such i exists, go to step 4.
 * 3. Work = Work + Allocation[i], Finish[i] = true, add process i to safeSequence, go to step 2.
 * 4. If Finish[i] == true for all i, system is SAFE, else UNSAFE.
 */

function calculateNeed(maximum, allocation, n, m) {
  const rows = n || (maximum ? maximum.length : 0);
  const cols = m || (maximum && maximum[0] ? maximum[0].length : 0);
  const need = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const maxVal = Number(maximum?.[i]?.[j]) || 0;
      const allocVal = Number(allocation?.[i]?.[j]) || 0;
      need[i][j] = Math.max(0, maxVal - allocVal);
    }
  }
  return need;
}

function checkSafety(processes, resources, rawAvailable, rawAllocation, rawMaximum, rawNeed = null) {
  const n = processes.length;
  const m = resources.length;

  // Ensure all values are parsed as clean numbers
  const available = Array.from({ length: m }, (_, j) => Number(rawAvailable?.[j]) || 0);
  const allocation = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => Number(rawAllocation?.[i]?.[j]) || 0)
  );
  const maximum = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => Number(rawMaximum?.[i]?.[j]) || 0)
  );

  const need = rawNeed
    ? rawNeed.map(row => row.map(v => Number(v) || 0))
    : calculateNeed(maximum, allocation, n, m);

  const work = [...available];
  const finish = new Array(n).fill(false);
  const safeSequence = [];
  const steps = [];

  let stepNum = 1;
  steps.push({
    step: stepNum++,
    title: 'Initial Safety Check State',
    work: [...work],
    finish: [...finish],
    safeSequence: [],
    description: `Need Matrix computed. Initial Work Vector = [${work.join(', ')}].`
  });

  let count = 0;
  while (count < n) {
    let found = false;
    for (let i = 0; i < n; i++) {
      if (!finish[i]) {
        // Check if Need[i] <= Work
        let canAllocate = true;
        for (let j = 0; j < m; j++) {
          if (need[i][j] > work[j]) {
            canAllocate = false;
            break;
          }
        }

        if (canAllocate) {
          found = true;
          finish[i] = true;
          safeSequence.push(processes[i]);
          count++;

          const oldWork = [...work];
          for (let j = 0; j < m; j++) {
            work[j] += allocation[i][j];
          }

          steps.push({
            step: stepNum++,
            process: processes[i],
            processIndex: i,
            need: [...need[i]],
            allocation: [...allocation[i]],
            canAllocate: true,
            previousWork: oldWork,
            newWork: [...work],
            currentSequence: [...safeSequence],
            description: `Process ${processes[i]}: Need [${need[i].join(', ')}] <= Work [${oldWork.join(', ')}]. Process executes and releases allocation [${allocation[i].join(', ')}]. New Work = [${work.join(', ')}].`
          });
          break; // restart scan from beginning to maintain standard Banker's evaluation order
        }
      }
    }

    if (!found) {
      break;
    }
  }

  const isSafe = count === n;

  return {
    isSafe,
    safeSequence: isSafe ? safeSequence : [],
    need,
    steps,
    workHistory: steps,
    explanation: isSafe
      ? `System is in a SAFE STATE. A safe sequence exists: ${safeSequence.join(' → ')}.`
      : `System is in an UNSAFE STATE! No safe execution sequence exists for all processes. Granting further requests may lead to deadlock.`
  };
}

/**
 * Resource Request Algorithm for Banker's
 * Checks if a specific process's request can be safely granted.
 */
function requestResource(processes, resources, rawAvailable, rawAllocation, rawMaximum, processIndex, rawRequestVector) {
  const n = processes.length;
  const m = resources.length;

  const available = Array.from({ length: m }, (_, j) => Number(rawAvailable?.[j]) || 0);
  const allocation = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => Number(rawAllocation?.[i]?.[j]) || 0)
  );
  const maximum = Array.from({ length: n }, (_, i) =>
    Array.from({ length: m }, (_, j) => Number(rawMaximum?.[i]?.[j]) || 0)
  );
  const requestVector = Array.from({ length: m }, (_, j) => Number(rawRequestVector?.[j]) || 0);

  const need = calculateNeed(maximum, allocation, n, m);

  // Step 1: Check if Request <= Need
  for (let j = 0; j < m; j++) {
    if (requestVector[j] > need[processIndex][j]) {
      return {
        granted: false,
        reason: `Error: Process ${processes[processIndex]} exceeded its maximum claim (Request [${requestVector.join(', ')}] > Need [${need[processIndex].join(', ')}]).`
      };
    }
  }

  // Step 2: Check if Request <= Available
  for (let j = 0; j < m; j++) {
    if (requestVector[j] > available[j]) {
      return {
        granted: false,
        reason: `Process ${processes[processIndex]} must wait: Resources not available (Request [${requestVector.join(', ')}] > Available [${available.join(', ')}]).`
      };
    }
  }

  // Step 3: Pretend to allocate requested resources
  const tempAvailable = [...available];
  const tempAllocation = allocation.map(row => [...row]);
  const tempNeed = need.map(row => [...row]);

  for (let j = 0; j < m; j++) {
    tempAvailable[j] -= requestVector[j];
    tempAllocation[processIndex][j] += requestVector[j];
    tempNeed[processIndex][j] -= requestVector[j];
  }

  // Step 4: Run Safety Algorithm on tentative state
  const safetyResult = checkSafety(processes, resources, tempAvailable, tempAllocation, maximum, tempNeed);

  if (safetyResult.isSafe) {
    return {
      granted: true,
      reason: `Resource request granted safely to Process ${processes[processIndex]}. System remains in a SAFE state with sequence: ${safetyResult.safeSequence.join(' → ')}.`,
      newAvailable: tempAvailable,
      newAllocation: tempAllocation,
      newNeed: tempNeed,
      safeSequence: safetyResult.safeSequence,
      steps: safetyResult.steps
    };
  } else {
    return {
      granted: false,
      reason: `Resource request DENIED. Allocating [${requestVector.join(', ')}] to Process ${processes[processIndex]} would leave the system in an UNSAFE state.`,
      safetyCheck: safetyResult
    };
  }
}

module.exports = {
  calculateNeed,
  checkSafety,
  requestResource
};
