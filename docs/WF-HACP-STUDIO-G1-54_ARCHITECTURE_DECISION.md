# G1-54 Architecture Decision Log

## ADR-G154-001: Transient Plan Immutability
- **Decision**: `VectorConstraintTransactionPlan` and optimistic preview snapshots are strictly transient derived data structures. The SSOT (`VectorDocumentSnapshot`) and `HistoryStack` remain untouched during `generatePlan`, `validatePlan`, and `previewPlan`.

## ADR-G154-002: Single-Commit Transaction Execution
- **Decision**: `executePlannedConstraintTransaction` executes all ordered operations in a single multi-step workflow via `VectorDeterministicWorkflowEngine`, resulting in exactly 1 `HistoryStack` transaction entry on success and 0 entries on preview/failure/cancel.

## ADR-G154-003: Deterministic Operation Priority Sorting
- **Decision**: Operations in a plan are ordered by:
  1. Priority (descending)
  2. Operation Type (`REMOVE_CONSTRAINT` [0] -> `ADD_CONSTRAINT` [1] -> `MODIFY_CONSTRAINT` [2] -> `MUTATE_NODE_TRANSFORM` [3])
  3. `targetNodeId` (alphabetical `localeCompare`)
  4. `id` (alphabetical `localeCompare`)
