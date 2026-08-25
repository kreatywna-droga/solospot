# WF-HACP-STUDIO-G1-52 Mission Contract

## Directives
1. Implement `VectorConstraintSolverEngine.ts` with `resolveIncremental`, `solveConstraintClosure`, `solveAffectedNodes`, and `previewConstraintResolution`.
2. Differentiate `changedNodes`, `affectedNodes`, `resolvedNodes`, and `untouchedNodes` during incremental solving.
3. Implement iterative fixed-point loop with precision tolerance comparison (`isGeometryEqual`) and `maxIterations` termination.
4. Enforce locked node protection and bounds validation returning structured `SolverError`.
5. Add `executeConstraintSolveTransaction` to `VectorWorkflowOrchestrator`.
6. Implement 180 vitest unit & integration tests (`VectorConstraintSolverG152.test.ts`).
7. Preserve 0 scope violations (`WEB_FACTOR_SCOPE_VIOLATIONS = 0`).
