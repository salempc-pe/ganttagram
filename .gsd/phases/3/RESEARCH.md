# Research: Phase 3 - Dependency Robustness

## Current State Analysis

### 1. Cycle Detection
- **Issue**: No preemptive cycle detection. The scheduler relies on a `maxIterations` limit to stop infinite loops.
- **Impact**: Inconsistent data in Firestore if a cycle is introduced.
- **Solution**: Implement a Depth-First Search (DFS) algorithm to check for cycles before adding or updating a dependency.

### 2. TaskModal & Scheduler Alignment
- **Issue**: `TaskModal.jsx` implements its own date calculation logic in `handleAddDep` for new tasks. It uses a `while` loop to find working days which duplicates `scheduler.js` logic and is less precise.
- **Solution**: Refactor `TaskModal` to use a subset of `calculateAutoSchedule` or a specialized function from `scheduler.js` to calculate the "earliest allowed start date" for a new task.

### 3. Stability Loop & Persistence
- **Issue**: `useTasks.js` uses `updateDoc` in a loop, which is neither atomic nor efficient. Convergence failure (30 iterations) is not handled gracefully.
- **Solution**:
    - Use Firestore `writeBatch` for all updates in `resolveAndCommitScheduling`.
    - Increase the iteration limit slightly or make it proportional to the number of tasks.
    - Throw a specific error or return a status when convergence fails, and prevent the batch commit.

## Implementation Details

### Circular Dependency Utility
```javascript
export const detectCycle = (taskId, dependencyId, allDependencies) => {
    // DFS from dependencyId to taskId
}
```

### Scheduler Refactor
`scheduler.js` should probably expose `snapToPredecessors` or a similar logic so `TaskModal` can use it without needing a full `tasks` array if it's just creating one.

### Atomic Updates
Replace:
```javascript
for (const [id, data] of Object.entries(updates)) {
    await updateDoc(doc(...), data);
}
```
With:
```javascript
const batch = writeBatch(db);
// ... add to batch
await batch.commit();
```
