# G1-60 Mission Contract

- **Primary Subsystem**: `StorefrontFormSubmissionBridgeEngine.ts`
- **Invariants**:
  - `VectorDocumentSnapshot` & `MultiPageSiteDocument` are SSOT.
  - Headless: Pure TS, ZERO DOM/React imports in domain layer.
  - No Fake Claims: Clean handoff boundary (`READY_FOR_HANDOFF` -> `HANDOFF_COMPLETED`) connecting to `/api/contact`.
  - 1 HistoryStack commit per form submission transaction.
  - Full recovery on validation throw or corrupted JSON restoration.
