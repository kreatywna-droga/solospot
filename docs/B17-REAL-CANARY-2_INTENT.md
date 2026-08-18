# B17-REAL-CANARY-2 — PRIMARY INTENT & DISCOVERY

## 1. Intent Statement
Execute the second autonomous production-like canary for WEB FACTOR under HACP governance.
The objective of Canary #2 is to discover, plan, implement, and verify a **multi-layer** product defect that crosses component boundaries (UI State -> Adapter -> API -> Orchestration -> Domain -> Payment) without human steering, maintaining complete architectural compliance, full test coverage, and strict governance.

---

## 2. Multi-Layer Discovery & Candidate Evaluation

### Candidate 1: Storefront End-to-End Cart & Checkout Pricing Pipeline
- **Candidate ID**: `CANARY2-CAND-01`
- **Category**: Multi-Layer Commerce Flow
- **Affected Layers**:
  1. `UI State Layer` (`src/lib/cart/CartStore.tsx`): Quantity clobbering in `ADD_ITEM` and non-removal in `UPDATE_QUANTITY` with quantity <= 0.
  2. `Adapter Layer` (`src/lib/cart/cartAdapter.ts`): Translation of storefront items to commerce engine contracts with accurate tax rates and pricing.
  3. `API & Orchestration Layer` (`src/lib/order/OrderRuntime.ts` & `src/app/api/store/checkout/route.ts`): Hardcoded `unitPriceGross: 0` causing `0 PLN` order grand totals and zero payment intent amounts.
  4. `Domain & Payment Layer` (`packages/commerce-engine/src/CheckoutFlow.ts` & `PaymentEngine.ts`): Seamless order creation, invoicing, and payment processing for real calculated totals.
- **Current Behavior**: Adding an item already in the cart overwrites quantity instead of incrementing; updating quantity to 0 leaves phantom items; checkout API creates orders with 0 PLN grand total and charges 0 PLN.
- **Expected Behavior**: Adding items accumulates quantity; quantity <= 0 removes items; checkout API computes real totals based on item pricing and creates payment intents with accurate grandTotalGross.
- **User Value**: CRITICAL. Fixes the fundamental storefront purchase pipeline from UI item selection to payment gateway redirection.
- **Reproduction**:
  1. Dispatch `ADD_ITEM` twice for same product -> quantity remains 1 instead of 2.
  2. Call `OrderRuntime.checkout` with items -> produces `grandTotalGross: 0` instead of real item sum.
- **Complexity**: Moderate (crosses 4 layers, clean changes in ~3-4 files).
- **Risk**: Low. Pure orchestration and state handling.
- **Reversibility**: 100%.
- **Testability**: Extremely high with unit, integration, multi-layer E2E, and adversarial tests.
- **Architectural Fit**: 100% conforms to existing clean separation of concerns.

---

### Candidate 2: Customer Account Address Lifecycle & Tenant Boundary Flow
- **Candidate ID**: `CANARY2-CAND-02`
- **Category**: Identity & Address Multi-Layer Flow
- **Affected Layers**: `packages/commerce-engine/src/CustomerAccountEngine.ts`, `src/lib/auth/`, Storefront customer profile.
- **Current Behavior**: Address default switching operates in-memory; missing address validation in API boundary.
- **Expected Behavior**: End-to-end address management and validation.
- **User Value**: Moderate.
- **Complexity**: Low-Moderate.
- **Risk**: Low.
- **Reversibility**: 100%.
- **Testability**: High.
- **Architectural Fit**: Good.

---

### Candidate 3: Builder Section Layout Schema & Undo/Redo Synchronization
- **Candidate ID**: `CANARY2-CAND-03`
- **Category**: Authoring Studio Multi-Layer Flow
- **Affected Layers**: `packages/authoring-studio/src/inspector/`, `packages/builder-core/src/BuilderDocument.ts`, `HistoryStack.ts`.
- **Current Behavior**: Section layout adjustments in inspector update schema adapter but require manual history push.
- **Expected Behavior**: Coordinated two-way binding with automatic history stack capture.
- **User Value**: Moderate-High.
- **Complexity**: High (touches authoring studio inspector components).
- **Risk**: Moderate.
- **Reversibility**: 100%.
- **Testability**: High.
- **Architectural Fit**: Good.

---

## 3. Autonomous Selection & Multi-Layer Rationale

### Selected Primary Canary Issue: `CANARY2-CAND-01` (Storefront End-to-End Cart & Checkout Pricing Pipeline).

### Multi-Layer Justification:
1. **True Cross-Layer Flow**: Coordinates UI state (`CartStore.tsx`), DTO adapter (`cartAdapter.ts`), API orchestration (`OrderRuntime.ts`), and domain engines (`packages/commerce-engine/`).
2. **Critical User Value**: Enables real multi-item cart management in UI and real non-zero order payments during checkout.
3. **High Observability**: Verifiable via 5 distinct multi-layer E2E test flows from user cart click to payment provider intent.
4. **Architectural Purity**: Preserves all transaction boundaries, RLS tenant isolation, and strict schema validation.
