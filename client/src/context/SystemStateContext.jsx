import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { processAPI, resourceAPI } from '../services/api';
import { useAuth } from './AuthContext';

const SystemStateContext = createContext();

const STORAGE_KEY = 'deadlock_guard_shared_state_v1';

// Standard fallback scenarios
export const PRESETS = {
  deadlock: {
    name: 'Classic Deadlock (4 Processes, 3 Resources)',
    processes: ['P0', 'P1', 'P2', 'P3'],
    resources: ['R1', 'R2', 'R3'],
    totalInstances: [7, 2, 6],
    available: [0, 0, 0],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 3],
      [2, 1, 1],
    ],
    request: [
      [0, 0, 0],
      [2, 0, 2],
      [0, 0, 1],
      [1, 0, 0],
    ],
    maximum: [
      [0, 1, 0],
      [4, 0, 2],
      [3, 0, 4],
      [3, 1, 1],
    ],
  },
  safe: {
    name: 'Banker Safe State (5 Processes, 3 Resources)',
    processes: ['P0', 'P1', 'P2', 'P3', 'P4'],
    resources: ['A', 'B', 'C'],
    totalInstances: [10, 5, 7],
    available: [3, 3, 2],
    allocation: [
      [0, 1, 0],
      [2, 0, 0],
      [3, 0, 2],
      [2, 1, 1],
      [0, 0, 2],
    ],
    request: [
      [0, 0, 0],
      [1, 0, 2],
      [0, 0, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    maximum: [
      [7, 5, 3],
      [3, 2, 2],
      [9, 0, 2],
      [2, 2, 2],
      [4, 3, 3],
    ],
  },
  simple: {
    name: 'Classic 3-Process System (P0, P1, P2)',
    processes: ['P0', 'P1', 'P2'],
    resources: ['R1', 'R2', 'R3'],
    totalInstances: [2, 1, 2],
    available: [0, 0, 1],
    allocation: [
      [1, 0, 1],
      [0, 1, 0],
      [1, 0, 0],
    ],
    request: [
      [0, 1, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    maximum: [
      [2, 1, 1],
      [1, 2, 1],
      [2, 0, 1],
    ],
  },
};

const zeroMatrix = (rows, cols) => Array.from({ length: rows }, () => new Array(cols).fill(0));

export const SystemStateProvider = ({ children }) => {
  const { user, showNotification } = useAuth();

  // Primary state
  const [processes, setProcesses] = useState(PRESETS.deadlock.processes);
  const [resources, setResources] = useState(PRESETS.deadlock.resources);
  const [totalInstances, setTotalInstances] = useState(PRESETS.deadlock.totalInstances);
  const [available, setAvailable] = useState(PRESETS.deadlock.available);
  const [allocation, setAllocation] = useState(PRESETS.deadlock.allocation);
  const [request, setRequest] = useState(PRESETS.deadlock.request);
  const [maximum, setMaximum] = useState(PRESETS.deadlock.maximum);

  const [isLoadingDB, setIsLoadingDB] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);

  // Load cached state from localStorage on initial render
  useEffect(() => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.processes && parsed.resources && parsed.allocation) {
          setProcesses(parsed.processes);
          setResources(parsed.resources);
          setTotalInstances(parsed.totalInstances || parsed.resources.map(() => 1));
          setAvailable(parsed.available || parsed.resources.map(() => 0));
          setAllocation(parsed.allocation);
          setRequest(parsed.request || zeroMatrix(parsed.processes.length, parsed.resources.length));
          setMaximum(parsed.maximum || zeroMatrix(parsed.processes.length, parsed.resources.length));
          setLastSyncTime(parsed.lastSyncTime || null);
        }
      }
    } catch (e) {
      console.error('Error reading cached system state:', e);
    }
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      const stateToSave = {
        processes,
        resources,
        totalInstances,
        available,
        allocation,
        request,
        maximum,
        lastSyncTime,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving system state to localStorage:', e);
    }
  }, [processes, resources, totalInstances, available, allocation, request, maximum, lastSyncTime]);

  /**
   * Sync with live database (Processes & Resources collections in MongoDB)
   * Intelligently merges current matrix values so user entries are NOT lost!
   */
  const syncWithDB = useCallback(async (notify = true) => {
    setIsLoadingDB(true);
    try {
      const [pRes, rRes] = await Promise.all([processAPI.getAll(), resourceAPI.getAll()]);
      const rawProcs = (pRes.data || []).sort((a, b) => {
        const numA = parseInt(String(a.processId).replace(/\D/g, '')) || 0;
        const numB = parseInt(String(b.processId).replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      const dbProcs = rawProcs.map((p) => p.processId);

      const rawRes = (rRes.data || []).sort((a, b) => {
        const numA = parseInt(String(a.resourceId).replace(/\D/g, '')) || 0;
        const numB = parseInt(String(b.resourceId).replace(/\D/g, '')) || 0;
        return numA - numB;
      });
      const dbRes = rawRes.map((r) => r.resourceId);
      const dbTotals = rawRes.map((r) => r.totalInstances ?? 1);
      const dbAvail = rawRes.map((r) => r.availableInstances ?? r.totalInstances ?? 0);

      if (dbProcs.length === 0 || dbRes.length === 0) {
        if (notify && showNotification) {
          showNotification('No processes or resources found in database yet. Add them in Process & Resource Management, or use textbook presets.', 'warning');
        }
        return false;
      }

      // Merge matrices: preserve values where (proc, res) match previous state
      const newAllocation = dbProcs.map((pName) => {
        const oldPIdx = processes.indexOf(pName);
        return dbRes.map((rName) => {
          const oldRIdx = resources.indexOf(rName);
          return oldPIdx !== -1 && oldRIdx !== -1 ? (allocation[oldPIdx]?.[oldRIdx] ?? 0) : 0;
        });
      });

      const newRequest = dbProcs.map((pName) => {
        const oldPIdx = processes.indexOf(pName);
        return dbRes.map((rName) => {
          const oldRIdx = resources.indexOf(rName);
          return oldPIdx !== -1 && oldRIdx !== -1 ? (request[oldPIdx]?.[oldRIdx] ?? 0) : 0;
        });
      });

      const newMaximum = dbProcs.map((pName) => {
        const oldPIdx = processes.indexOf(pName);
        return dbRes.map((rName) => {
          const oldRIdx = resources.indexOf(rName);
          return oldPIdx !== -1 && oldRIdx !== -1 ? (maximum[oldPIdx]?.[oldRIdx] ?? 1) : 1;
        });
      });

      setProcesses(dbProcs);
      setResources(dbRes);
      setTotalInstances(dbTotals);
      setAvailable(dbAvail);
      setAllocation(newAllocation);
      setRequest(newRequest);
      setMaximum(newMaximum);
      setLastSyncTime(new Date().toLocaleTimeString());

      if (notify && showNotification) {
        showNotification(`Synced ${dbProcs.length} processes and ${dbRes.length} resources from database!`, 'success');
      }
      return true;
    } catch (err) {
      if (notify && showNotification) {
        showNotification('Failed to fetch processes and resources from database.', 'error');
      }
      return false;
    } finally {
      setIsLoadingDB(false);
    }
  }, [processes, resources, allocation, request, maximum, showNotification]);

  // Load a preset scenario (Safe, Deadlock, Simple)
  const loadPreset = useCallback((presetKey) => {
    const p = PRESETS[presetKey];
    if (!p) return;
    setProcesses([...p.processes]);
    setResources([...p.resources]);
    setTotalInstances([...p.totalInstances]);
    setAvailable([...p.available]);
    setAllocation(p.allocation.map((r) => [...r]));
    setRequest(p.request.map((r) => [...r]));
    setMaximum(p.maximum.map((r) => [...r]));
    setLastSyncTime(null);
    if (showNotification) {
      showNotification(`Loaded preset: ${p.name}`, 'info');
    }
  }, [showNotification]);

  // Matrix cell update functions (immediately synced across all pages)
  const updateAllocationCell = useCallback((pIdx, rIdx, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    setAllocation((prev) =>
      prev.map((row, r) => row.map((cell, c) => (r === pIdx && c === rIdx ? val : cell)))
    );
  }, []);

  const updateRequestCell = useCallback((pIdx, rIdx, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    setRequest((prev) =>
      prev.map((row, r) => row.map((cell, c) => (r === pIdx && c === rIdx ? val : cell)))
    );
  }, []);

  const updateMaximumCell = useCallback((pIdx, rIdx, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    setMaximum((prev) =>
      prev.map((row, r) => row.map((cell, c) => (r === pIdx && c === rIdx ? val : cell)))
    );
  }, []);

  const updateAvailableVal = useCallback((rIdx, value) => {
    const val = Math.max(0, parseInt(value) || 0);
    setAvailable((prev) => prev.map((v, i) => (i === rIdx ? val : v)));
  }, []);

  const updateTotalInstanceVal = useCallback((rIdx, value) => {
    const val = Math.max(1, parseInt(value) || 1);
    setTotalInstances((prev) => prev.map((v, i) => (i === rIdx ? val : v)));
  }, []);

  /**
   * Automatically compute Available[j] = TotalInstances[j] - Sum(Allocation[i][j])
   */
  const autoComputeAvailable = useCallback(() => {
    if (!resources.length || !allocation.length) return;
    const computed = resources.map((_, rIdx) => {
      const allocatedSum = allocation.reduce((sum, row) => sum + (row[rIdx] || 0), 0);
      const total = totalInstances[rIdx] || 0;
      return Math.max(0, total - allocatedSum);
    });
    setAvailable(computed);
    if (showNotification) {
      showNotification(`Available vector auto-calculated: [${computed.join(', ')}]`, 'success');
    }
  }, [resources, allocation, totalInstances, showNotification]);

  /**
   * Apply recovery result (e.g. after victim process terminated or preempted)
   */
  const applyRecoveryResult = useCallback((newProcs, newAvail, newAlloc, newReq) => {
    if (newProcs) setProcesses(newProcs);
    if (newAvail) setAvailable(newAvail);
    if (newAlloc) setAllocation(newAlloc);
    if (newReq) setRequest(newReq);
    if (showNotification) {
      showNotification('Recovery changes applied to system state across all pages!', 'success');
    }
  }, [showNotification]);

  const value = {
    processes,
    resources,
    totalInstances,
    available,
    allocation,
    request,
    maximum,
    isLoadingDB,
    lastSyncTime,
    syncWithDB,
    loadPreset,
    updateAllocationCell,
    updateRequestCell,
    updateMaximumCell,
    updateAvailableVal,
    updateTotalInstanceVal,
    autoComputeAvailable,
    applyRecoveryResult,
    setProcesses,
    setResources,
    setAvailable,
    setAllocation,
    setRequest,
    setMaximum,
  };

  return (
    <SystemStateContext.Provider value={value}>
      {children}
    </SystemStateContext.Provider>
  );
};

export const useSystemState = () => {
  const context = useContext(SystemStateContext);
  if (!context) {
    throw new Error('useSystemState must be used within a SystemStateProvider');
  }
  return context;
};

export default SystemStateContext;
