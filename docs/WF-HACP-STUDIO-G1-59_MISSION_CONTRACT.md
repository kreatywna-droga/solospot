# G1-59 Mission Contract

- **Primary Subsystem**: `SitePublishingDeploymentBridgeEngine.ts`
- **Invariants**:
  - `VectorDocumentSnapshot` & `MultiPageSiteDocument` are SSOT.
  - Headless: Pure TS, ZERO DOM/React imports in domain layer.
  - No Fake Claims: Clean deployment handoff boundary (`READY_FOR_DEPLOYMENT` -> `HANDOFF_COMPLETED`).
  - 1 HistoryStack commit per publishing execution.
  - Rollback safety to previous known-good deployment artifact.
