# B17-REAL-CANARY-3 — PRODUCT CONTRACT & PLAN

## 1. User Story
As a storefront shopper, I want to checkout my cart with item prices and discounts, receive an order ID, pay via the payment gateway, and view the live status and details of my order at any time, with strict privacy and tenant isolation.

---

## 2. Requirements by Component

### Component 1: `src/lib/order/OrderRuntime.ts`
- Implement static `getInstance(): OrderRuntime` and `resetInstanceForTesting(): void`.
- Support `couponCode` and per-item pricing in `CheckoutRequestDTO`.
- Support order retrieval, status querying, payment confirmation, and lifecycle state advances.

### Component 2: `src/app/api/store/checkout/route.ts`
- Extract `couponCode` from request payload.
- Forward `unitPriceGross` and `taxRate` for each item.
- Delegate to `OrderRuntime.getInstance().checkout()`.

### Component 3: `src/app/api/store/order/[id]/route.ts`
- Delegate status lookup to `OrderRuntime.getInstance().getOrderStatus(store.tenantId, orderId)`.
- Enforce 404 response on cross-tenant access without revealing order existence.

### Component 4: `src/app/store/[slug]/checkout/page.tsx`
- Forward `price` as `unitPriceGross` and `couponCode` in POST payload.

---

## 3. Success Criteria
- [x] `POST /api/store/checkout` returns valid `orderId` and real `grandTotalGross`.
- [x] Subsequent `GET /api/store/order/[id]` returns the created `ProcessedOrder` with matching `grandTotalGross`, items, and `PAYMENT_PENDING` status.
- [x] Payment webhook triggers state transition to `PAID`.
- [x] Cross-tenant order status requests return 404.
- [x] 7 real E2E workflows pass.
- [x] 10 adversarial chaos tests pass.
- [x] Full failure injection and clean rollback proven.
- [x] Full regression suite passes with `PASS → FAIL = 0`.
