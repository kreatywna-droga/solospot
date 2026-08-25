# WF-HACP-STUDIO-G1-52 Solver Model

## Core Solver Principles
1. **Incremental Subgraph Isolation**: `getAffectedSubgraph` extracts closure for mutated node IDs, keeping independent branches untouched.
2. **Iterative Convergence Loop**: Repeatedly evaluates graph layout until `isGeometryEqual(prev, next, tolerance)` is satisfied across all affected nodes or `maxIterations` is reached.
3. **Structured Diagnostics**: `SolverError` delivers explicit error codes (`MAX_ITERATIONS_EXCEEDED`, `LOCKED_NODE_CONFLICT`, `CONTRADICTORY_CONSTRAINTS`, `INVALID_BOUNDS`, `CYCLE_DETECTED`).
