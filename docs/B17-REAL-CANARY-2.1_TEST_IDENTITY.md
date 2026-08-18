# B17-REAL-CANARY-2.1 — TEST IDENTITY & TRANSITION FORENSICS

## 1. Newly Added Test Files (2 Files)
1. [`src/lib/order/__tests__/order-e2e-multilayer.test.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/src/lib/order/__tests__/order-e2e-multilayer.test.ts) (5 test cases)
2. [`src/lib/order/__tests__/order-adversarial-multilayer.test.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/src/lib/order/__tests__/order-adversarial-multilayer.test.ts) (6 test cases)

---

## 2. Granular Inventory of 14 New Tests

| Index | File Path | Test Description | Purpose | Classification |
|---|---|---|---|---|
| 1 | `order-e2e-multilayer.test.ts` | `E2E-01: User Action (UI Store ADD_ITEM x2) -> Store State -> Adapter -> API Checkout -> Domain Order -> Verified grandTotalGross` | Multi-layer cart & pricing verification | **MEANINGFUL** |
| 2 | `order-e2e-multilayer.test.ts` | `E2E-02: Multi-Item Storefront Cart -> Coupon SAVE10 -> API Checkout -> Domain Invoicing -> Payment Intent -> Payment.Completed -> Order Status PAID` | End-to-end checkout, coupon, payment & webhook | **MEANINGFUL** |
| 3 | `order-e2e-multilayer.test.ts` | `E2E-03: User Cart State -> Update quantity to 0 -> API Checkout with empty remainder throws expected error -> Original cart restored` | Clean quantity removal and validation error | **MEANINGFUL** |
| 4 | `order-e2e-multilayer.test.ts` | `E2E-04: Multi-Product Purchase with distinct VAT rates (0%, 8%, 23%) across UI -> Adapter -> OrderRuntime -> Domain Calculations` | Multi-tax bracket calculations | **MEANINGFUL** |
| 5 | `order-e2e-multilayer.test.ts` | `E2E-05: Complex Multi-Step Lifecycle: Add 3 products -> Increase quantity -> Remove item -> Apply coupon -> Checkout -> Invoiced Order in Domain Engine` | Complex shopping lifecycle | **MEANINGFUL** |
| 6 | `order-adversarial-multilayer.test.ts` | `ADV-01: Rapid sequential checkouts with identical correlationId guarantee exact idempotency return` | Inflight request deduplication under concurrency | **MEANINGFUL** |
| 7 | `order-adversarial-multilayer.test.ts` | `ADV-02: Tenant Isolation — Attempting to fetch order status using foreign tenantId is strictly rejected` | RLS cross-tenant security | **MEANINGFUL** |
| 8 | `order-adversarial-multilayer.test.ts` | `ADV-03: Empty item array throws validation error and prevents order/intent creation` | Empty array edge-case | **MEANINGFUL** |
| 9 | `order-adversarial-multilayer.test.ts` | `ADV-04: Large quantity order calculates exact integer totals without precision loss` | Large integer math bounds | **MEANINGFUL** |
| 10 | `order-adversarial-multilayer.test.ts` | `ADV-05: Coupon code with zero-price items computes grandTotalGross = 0 safely without negative totals` | Non-negative discount math | **MEANINGFUL** |
| 11 | `order-adversarial-multilayer.test.ts` | `ADV-06: Requesting order status for non-existent orderId throws clear not found error` | 404 entity retrieval | **MEANINGFUL** |
| 12 | `cart-store.test.ts` | `ADD_ITEM kumuluje ilość dla istniejącej pozycji (nie duplikuje)` | Quantity accumulation | **MEANINGFUL** |
| 13 | `cart-store.test.ts` | `UPDATE_QUANTITY z ilością <= 0 usuwa pozycję z koszyka` | Non-positive quantity removal | **MEANINGFUL** |
| 14 | `order-runtime.test.ts` | `checkout() z kuponem SAVE10 i wieloma produktami nalicza rabat` | Runtime discount forwarding | **MEANINGFUL** |

---

## 3. Test Transition Matrix

```
Baseline Passing (3343) ───► Final Passing (3343)  [PASS → PASS: 3343]
Baseline Failing (37)   ───► Final Failing (37)    [FAIL → FAIL: 37]
Newly Added Tests (14)  ───► Final Passing (14)    [NEW → PASS: 14]

Transitions:
- PASS → FAIL: 0
- FAIL → PASS: 0
- REMOVED: 0
- RENAMED: 0
```
