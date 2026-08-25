# G1-56 Mission Contract

- **Primary Subsystem**: `PageBuilderCanvasRuntimeAdapter.ts`
- **Invariants**:
  - `VectorDocumentSnapshot` is SSOT.
  - Headless: Pure TS, ZERO DOM/React imports in domain layer.
  - 1 HistoryStack commit per mutating UI operation.
  - 0 HistoryStack commits on preview / scaling / selection.
  - Complete rollback on failure via `VectorTransactionRecoveryEngine`.
