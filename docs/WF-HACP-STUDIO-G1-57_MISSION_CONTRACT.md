# G1-57 Mission Contract

- **Primary Subsystem**: `MultiPageNavigationRouterEngine.ts`
- **Invariants**:
  - `VectorDocumentSnapshot` is SSOT.
  - Headless: Pure TS, ZERO DOM/React imports in domain layer.
  - 1 HistoryStack commit per mutating route/nav action.
  - 0 HistoryStack commits on preview / export.
  - Complete rollback on failure via `VectorTransactionRecoveryEngine`.
