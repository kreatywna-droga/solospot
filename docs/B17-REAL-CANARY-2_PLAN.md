# B17-REAL-CANARY-2 — IMPLEMENTATION & VALIDATION PLAN

## 1. Intent
Fix and integrate the complete multi-layer storefront cart & checkout pricing pipeline across UI State, Adapter, API Orchestration, and Domain Engine layers.

---

## 2. Requirements by Layer

### Layer 1: UI State (`src/lib/cart/CartStore.tsx`)
- In `cartReducer`:
  - `ADD_ITEM`: When an item already exists in `state.items`, accumulate quantity (`currentQuantity + addedQuantity`) and update item fields.
  - `UPDATE_QUANTITY`: When requested quantity is `<= 0`, cleanly filter out the item from `state.items` and recalculate `itemCount`.

### Layer 2: DTO Adapter (`src/lib/cart/cartAdapter.ts`)
- In `toCommerceProduct`: Map product price, VAT rate (default 23% or custom), SKU, and availability.
- In `buildCartFromRequest`: Accept items, filter out non-positive quantities, and build fully calculated `Cart` via `CartManager.addItem` / `recalculate`.

### Layer 3: Orchestration & API (`src/lib/order/OrderRuntime.ts` & `src/app/api/store/checkout/route.ts`)
- In `CheckoutRequestDTO`:
  - `items: Array<{ productId: string; quantity: number; unitPriceGross?: number; taxRate?: number; name?: string }>;`
- In `OrderRuntime.checkout()`:
  - When constructing the Cart, populate `unitPriceGross` from request (or fallback to 0/default), compute `totalGross = unitPriceGross * quantity`, and call `CartManager.recalculate(cart)`.
  - Ensure `order.totals.grandTotalGross` matches the actual priced items.
  - Create `PaymentIntent` via `PaymentEngine` with the real computed `grandTotalGross`.

### Layer 4: Domain & Payment (`packages/commerce-engine/`)
- `CheckoutManager.createOrder()` receives fully priced Cart with non-zero item totals.
- `OrderProcessingEngine.createOrder()` & `invoiceOrder()` produce `ProcessedOrder` with verified `grandTotalGross`.
- `PaymentEngine.createPaymentIntent()` charges the real total amount.

---

## 3. Success Criteria
- [x] Repeat `ADD_ITEM` dispatches accumulate quantity (e.g. 1 + 2 = 3).
- [x] Setting quantity <= 0 cleanly removes item from cart.
- [x] Checkout API calculates real `grandTotalGross` for items with `unitPriceGross`.
- [x] PaymentIntent created for exact computed grand total gross.
- [x] 5 real multi-layer E2E workflows pass.
- [x] 0 regressions across entire monorepo.
- [x] Clean TypeScript typechecking with zero `@ts-ignore` / `@ts-expect-error`.

---

## 4. Rollback Plan
If validation or audit fails:
- Run `git checkout -- src/lib/cart/CartStore.tsx src/lib/cart/cartAdapter.ts src/lib/order/OrderRuntime.ts src/lib/cart/__tests__/cart-store.test.ts src/lib/order/__tests__/order-runtime.test.ts`
- Remove newly created E2E and adversarial test files.
- Verify clean git status via `git status -s`.
