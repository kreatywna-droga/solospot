# G1-58 Mission Contract

- **Primary Subsystem**: `StorefrontCartCheckoutDrawerEngine.ts`
- **Invariants**:
  - `VectorDocumentSnapshot` & `CartSessionDTO` are SSOT.
  - Headless: Pure TS, ZERO DOM/React imports in domain layer.
  - Monetary Math: Integer-cents calculations.
  - 1 HistoryStack commit per mutating transaction; 0 commits on drawer toggle / totals calculation.
  - Payment Boundary: Stops at validated `OrderIntentDTO` (zero fake payment success).
