# WF-HACP-STUDIO-G1-52 Architecture Decision Record (ADR)

## Decision Title
ADR-G1-52: Incremental Iterative Fixed-Point Constraint Solver Architecture

## Decision
1. `VectorConstraintSolverEngine` performs incremental resolution, isolating affected subgraph closures and preserving untouched nodes byte-for-byte.
2. Iterative loop checks geometry convergence via `isGeometryEqual` epsilon comparison.
3. Locked nodes cannot be transformed by the solver.
4. Orchestrator integration commits 1 transaction on success, 0 on failure/preview.
