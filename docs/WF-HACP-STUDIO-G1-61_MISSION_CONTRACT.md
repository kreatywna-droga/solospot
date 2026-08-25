# G1-61 Mission Contract

- **Primary Subsystem**: `StorefrontAnalyticsTelemetryBridgeEngine.ts`
- **Invariants**:
  - `VectorDocumentSnapshot` & `MultiPageSiteDocument` are SSOT.
  - Headless: Pure TS, ZERO DOM/React imports in domain layer.
  - No Fake Claims: Clean telemetry boundary (`READY_FOR_DISPATCH` -> `DISPATCH_COMPLETED`) connecting to `/api/diagnostics`.
  - 1 HistoryStack commit per telemetry batch dispatch.
  - Full recovery on session serialization / restoration.
