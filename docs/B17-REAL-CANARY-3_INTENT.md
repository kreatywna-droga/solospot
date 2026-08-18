# B17-REAL-CANARY-3 — AUTONOMOUS PRODUCT WORKFLOW INTENT

## 1. Intent Declaration
- **Task ID**: `B17-REAL-CANARY-3`
- **Program**: `B17 — HACP REAL CANARY`
- **Mission**: Full autonomous discovery, architecture, multi-layer implementation, E2E validation, adversarial testing, failure injection, regression analysis, and governance ratification of a real product workflow in WEB FACTOR.

---

## 2. Product Discovery & Evaluation
5 candidate workflows were discovered and evaluated:
1. **CANARY3-CAND-01 (Selected Primary)**: Complete Storefront Order Lifecycle & Tracking Workflow (UI Checkout $\rightarrow$ Route API $\rightarrow$ Shared OrderRuntime SSOT $\rightarrow$ Payment Webhook $\rightarrow$ Live Order Status Query $\rightarrow$ Post-Purchase Receipt & Fulfillment Tracking).
2. **CANARY3-CAND-02 (Backup 1)**: Product Inventory Availability & Backorder Reservation.
3. **CANARY3-CAND-03 (Backup 2)**: Customer Account Profile & Order History Dashboard.
4. **CANARY3-CAND-04**: Authoring Studio Section Drag-and-Drop Reordering.
5. **CANARY3-CAND-05**: Tenant Domain Resolution & Security Context Routing.

---

## 3. Autonomous Execution Objectives
- Eliminate the transient runtime disconnect between `POST /api/store/checkout` and `GET /api/store/order/[id]`.
- Provide `OrderRuntime.getInstance()` with persistent in-memory tenant state.
- Ensure end-to-end passing of real itemized prices, coupon discounts, status lookups, and state progression (`PAYMENT_PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY_FOR_FULFILLMENT` $\rightarrow$ `FULFILLED`).
- Verify with 7 real E2E workflows, 10 adversarial chaos tests, and full failure injection & rollback.
