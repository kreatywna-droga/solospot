# G1-55 Mission Contract

- **Primary Subsystem**: `PageBuilderInteractionEngine.ts`
- **Invariants**:
  - `VectorDocumentSnapshot` is SSOT.
  - Headless: Pure TS, NO DOM, NO React, ZERO Browser APIs.
  - 1 HistoryStack commit per mutating transaction.
  - 0 HistoryStack commits on preview / failure / cancellation.
  - Complete rollback on failure via `VectorTransactionRecoveryEngine`.
