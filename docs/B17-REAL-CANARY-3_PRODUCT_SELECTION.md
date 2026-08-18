# B17-REAL-CANARY-3 — PRODUCT DISCOVERY & SELECTION

## 1. 5 Real Product Candidates

### Candidate 1: Complete Storefront Order Lifecycle & Tracking Workflow
- **Candidate ID**: `CANARY3-CAND-01`
- **Category**: End-to-End Commerce & Order Management Workflow
- **Affected Layers**: UI (`/checkout`, `/order/[id]`), API (`/api/store/checkout`, `/api/store/order/[id]`), Orchestration (`OrderRuntime.getInstance()`), Domain (`OrderProcessingEngine`, `PaymentEngine`), Persistence/State.
- **Current Behavior**: `POST /api/store/checkout` does not forward coupons from the body, and creates orders in a transient `new OrderRuntime()` instance. When the user navigates to `/store/[slug]/order/[id]`, `GET /api/store/order/[id]` uses a separate transient instance and returns 404 "Order not found".
- **Expected Behavior**: Unified `OrderRuntime` lifecycle with shared order state across route handlers, full coupon and item price forwarding, real order status retrieval, and verified tracking state transitions (`PAYMENT_PENDING` -> `PAID` -> `PROCESSING` -> `READY_FOR_FULFILLMENT` -> `FULFILLED`).
- **User Value**: CRITICAL (Enables customers to place real orders, make payments, track progress, and view receipts).
- **Reproduction**: Place order via checkout API $\rightarrow$ query GET order status API $\rightarrow$ 404 Order not found.
- **Complexity**: Moderate-High (multi-layer, cross-route, event bus, state machine).
- **Risk**: Low-Moderate (controlled, pure orchestration & state).
- **Reversibility**: 100%.
- **Architectural Fit**: 100% conforms to Next.js route handlers & commerce-engine domain models.
- **Testability**: Extremely high with unit, route, E2E, and adversarial suites.

---

### Candidate 2: Product Inventory Availability & Backorder Reservation
- **Candidate ID**: `CANARY3-CAND-02`
- **Category**: Inventory Management Flow
- **Affected Layers**: `packages/commerce-engine/src/InventoryEngine.ts`, `CartRuntime.ts`, `OrderProcessingEngine.ts`.
- **Current Behavior**: Stock levels are validated in cart but not reserved during checkout.
- **Expected Behavior**: Atomic stock reservation upon order creation and release on cancellation.
- **User Value**: High.
- **Complexity**: Moderate.
- **Risk**: Low.
- **Reversibility**: 100%.

---

### Candidate 3: Customer Account Profile & Order History Dashboard
- **Candidate ID**: `CANARY3-CAND-03`
- **Category**: Customer Account Experience
- **Affected Layers**: `CustomerAccountEngine.ts`, customer dashboard UI, `/api/store/customer/orders`.
- **Current Behavior**: Customer orders are retrieved in-memory without persistent linking to customer accounts.
- **Expected Behavior**: Authenticated customer can view all past orders and tracking links.
- **User Value**: Moderate-High.
- **Complexity**: Moderate.
- **Risk**: Low.
- **Reversibility**: 100%.

---

### Candidate 4: Authoring Studio Section Drag-and-Drop & Reordering Pipeline
- **Candidate ID**: `CANARY3-CAND-04`
- **Category**: Authoring Studio Editor Flow
- **Affected Layers**: `packages/builder-core/src/BuilderDocument.ts`, `HistoryStack.ts`, LayerTree UI.
- **Current Behavior**: Manual section index swap requires explicit history push.
- **Expected Behavior**: Document transaction with automated undo/redo.
- **User Value**: Moderate.
- **Complexity**: High.
- **Risk**: Moderate.
- **Reversibility**: 100%.

---

### Candidate 5: Tenant Domain Resolution & Security Context Routing
- **Candidate ID**: `CANARY3-CAND-05`
- **Category**: Multi-Tenant Routing Flow
- **Affected Layers**: `StoreRepository.ts`, `TenantContextBuilder.ts`, Next.js middleware.
- **Current Behavior**: Slug-only resolution without custom domain fallback.
- **Expected Behavior**: Multi-tenant host header parsing and domain resolution.
- **User Value**: Moderate.
- **Complexity**: Moderate.
- **Risk**: Moderate.
- **Reversibility**: 100%.

---

## 2. Product Prioritization Matrix

| Candidate ID | User Value (1-5) | User Impact (1-5) | Arch Value (1-5) | Complexity (1-5) | Risk (1-5) | Reversibility (1-5) | Testability (1-5) | Total Weighted Score |
|---|---|---|---|---|---|---|---|---|
| **CAND-01** (Order Lifecycle) | 5 | 5 | 5 | 3 | 2 | 5 | 5 | **92 / 100** |
| **CAND-02** (Inventory Reservation) | 4 | 4 | 4 | 3 | 2 | 5 | 5 | **82 / 100** |
| **CAND-03** (Customer Orders) | 3 | 3 | 4 | 3 | 2 | 5 | 4 | **72 / 100** |
| **CAND-04** (Studio Reordering) | 3 | 3 | 4 | 4 | 3 | 4 | 4 | **68 / 100** |
| **CAND-05** (Tenant Domains) | 3 | 3 | 3 | 3 | 3 | 4 | 4 | **64 / 100** |

---

## 3. Autonomous Selection

- **PRIMARY WORKFLOW**: **`CANARY3-CAND-01`** (Complete Storefront Order Lifecycle & Tracking Workflow).
- **BACKUP CANDIDATE 1**: **`CANARY3-CAND-02`** (Product Inventory Availability & Backorder Reservation).
- **BACKUP CANDIDATE 2**: **`CANARY3-CAND-03`** (Customer Account Profile & Order History Dashboard).

### Why Primary:
1. Completes the critical customer purchase and post-purchase journey from UI checkout to server-side order tracking and status updates.
2. Resolves the architectural disconnect between `POST /api/store/checkout` and `GET /api/store/order/[id]`.
3. Directly testable end-to-end with 7 rich user workflows, 10 adversarial chaos tests, and full failure injection.
