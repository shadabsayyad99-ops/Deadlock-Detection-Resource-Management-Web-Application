/**
 * Resource Allocation Graph (RAG) Cycle Detection Algorithm
 * 
 * Nodes:
 * - Processes (P1, P2, ...)
 * - Resources (R1, R2, ...)
 * 
 * Directed Edges:
 * - Allocation: Resource Rj -> Process Pi (if allocation[i][j] > 0)
 * - Request: Process Pi -> Resource Rj (if request[i][j] > 0)
 * 
 * Returns:
 * - hasCycle: boolean
 * - cycles: Array of cycle paths (e.g. ['P1 -> R2 -> P2 -> R1 -> P1'])
 * - nodes: List of graph nodes with types
 * - edges: List of directed graph edges
 * - educationalNote: Important OS note regarding single vs multiple instances
 */

function detectCyclesInRAG(processes, resources, allocation, request, totalInstances = []) {
  const nodes = [];
  const edges = [];
  const adj = new Map();

  // Helper to add node
  processes.forEach(p => {
    nodes.push({ id: p, label: p, type: 'process' });
    adj.set(p, []);
  });

  resources.forEach((r, idx) => {
    const instances = totalInstances[idx] !== undefined ? totalInstances[idx] : 1;
    nodes.push({ id: r, label: `${r} (${instances} inst)`, type: 'resource', instances });
    adj.set(r, []);
  });

  // Build edges
  // 1. Allocation Edges: Resource -> Process
  for (let i = 0; i < processes.length; i++) {
    for (let j = 0; j < resources.length; j++) {
      if (allocation[i][j] > 0) {
        const from = resources[j];
        const to = processes[i];
        edges.push({
          id: `alloc-${from}-${to}`,
          source: from,
          target: to,
          type: 'allocation',
          label: `Allocated (${allocation[i][j]})`
        });
        adj.get(from).push(to);
      }
    }
  }

  // 2. Request Edges: Process -> Resource
  for (let i = 0; i < processes.length; i++) {
    for (let j = 0; j < resources.length; j++) {
      if (request[i][j] > 0) {
        const from = processes[i];
        const to = resources[j];
        edges.push({
          id: `req-${from}-${to}`,
          source: from,
          target: to,
          type: 'request',
          label: `Requests (${request[i][j]})`
        });
        adj.get(from).push(to);
      }
    }
  }

  // DFS Cycle Detection
  const visited = new Map();
  const recStack = new Map();
  const cyclesFound = [];
  const path = [];

  nodes.forEach(n => {
    visited.set(n.id, false);
    recStack.set(n.id, false);
  });

  function dfs(currNode) {
    visited.set(currNode, true);
    recStack.set(currNode, true);
    path.push(currNode);

    const neighbors = adj.get(currNode) || [];
    for (const neighbor of neighbors) {
      if (!visited.get(neighbor)) {
        dfs(neighbor);
      } else if (recStack.get(neighbor)) {
        // Cycle detected!
        const cycleStartIndex = path.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cyclePath = path.slice(cycleStartIndex).concat(neighbor);
          const cycleStr = cyclePath.join(' → ');
          if (!cyclesFound.includes(cycleStr)) {
            cyclesFound.push(cycleStr);
          }
        }
      }
    }

    recStack.set(currNode, false);
    path.pop();
  }

  nodes.forEach(n => {
    if (!visited.get(n.id)) {
      dfs(n.id);
    }
  });

  // Educational clarification regarding single vs multi instance
  let hasMultiInstance = false;
  resources.forEach((r, idx) => {
    if (totalInstances[idx] > 1) {
      hasMultiInstance = true;
    }
  });

  let educationalNote = '';
  if (cyclesFound.length > 0) {
    if (hasMultiInstance) {
      educationalNote = 'Note: A cycle was detected in the Resource Allocation Graph. Because some resources have MULTIPLE instances, a cycle is a NECESSARY condition for deadlock, but NOT a SUFFICIENT condition. Run the full Deadlock Detection Algorithm to confirm if a true deadlock exists.';
    } else {
      educationalNote = 'Note: A cycle was detected in the Resource Allocation Graph. Since all resources have SINGLE instances, a cycle is BOTH a necessary and sufficient condition for deadlock!';
    }
  } else {
    educationalNote = 'No cycles detected in the Resource Allocation Graph. The system currently has no circular wait dependencies.';
  }

  return {
    hasCycle: cyclesFound.length > 0,
    cycles: cyclesFound,
    nodes,
    edges,
    educationalNote
  };
}

module.exports = { detectCyclesInRAG };
