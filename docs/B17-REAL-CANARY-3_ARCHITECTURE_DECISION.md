# B17-REAL-CANARY-3 — ARCHITECTURAL DECISION

## 1. Context & Architectural Principles
The Storefront Order Lifecycle encompasses checkout submission, order invoicing, payment intent generation, webhook payment confirmation, order status lookups, and state progression.

---

## 2. Core Architectural Decisions

1. **OrderRuntime SSOT & Singleton Lifecycle**:
   - Provide `OrderRuntime.getInstance()` (and support default instances) so that Next.js route handlers (`POST /api/store/checkout` and `GET /api/store/order/[id]`) access the unified, persistent in-memory repository of orders and payment engines.
   - Maintain full tenant isolation with RLS enforcement in `OrderProcessingEngine.getOrder(tenantId, orderId)`.

2. **Checkout Route Enrichment (`src/app/api/store/checkout/route.ts`)**:
   - Extract `couponCode` and item pricing parameters from request body.
   - Delegate checkout execution strictly through `OrderRuntime.getInstance().checkout(store.tenantId, customerId, checkoutReq, correlationId)`.

3. **Order Status API (`src/app/api/store/order/[id]/route.ts`)**:
   - Delegate status lookups to `OrderRuntime.getInstance().getOrderStatus(store.tenantId, orderId)`.
   - Return 404 on missing order or cross-tenant security exceptions to avoid leaking order existence across tenants.

4. **Order Status Transition Support (`OrderRuntime.ts`)**:
   - Expose methods `confirmPayment(tenantId, orderId)`, `advanceOrderStatus(tenantId, orderId, nextState)`, and `getOrdersByTenant(tenantId)` to support complete lifecycle progression (from `PAYMENT_PENDING` $\rightarrow$ `PAID` $\rightarrow$ `PROCESSING` $\rightarrow$ `READY_FOR_FULFILLMENT` $\rightarrow$ `FULFILLED`).

5. **Client-Side Storefront Checkout (`src/app/store/[slug]/checkout/page.tsx`)**:
   - Forward `unitPriceGross` and `couponCode` in JSON body to ensure computed totals match UI cart totals.

---

## 3. Data Flow

```
[Storefront Checkout UI]
    │  (items with unitPriceGross, couponCode, shippingAddress)
    ▼
[POST /api/store/checkout]
    │  (extract slug -> StoreRepository -> tenantId)
    ▼
[OrderRuntime.getInstance().checkout]
    │  (CartManager.recalculate -> CheckoutManager.createOrder)
    ▼
[OrderProcessingEngine.createOrder & invoiceOrder]
    │  (CREATED -> PAYMENT_PENDING)
    ▼
[PaymentEngine.createPaymentIntent]
    │  (returns intent and redirectUrl)
    ▼
[Redirect to Payment / Success Page]
    │
    ▼
[GET /api/store/order/[id]?slug=...]
    │
    ▼
[OrderRuntime.getInstance().getOrderStatus]
    │  (verifies tenantId matches order.tenantId)
    ▼
[Order Details JSON Response] -> [OrderStatusPage UI Component]
```
