# Sprint 6 Step 6 — Commerce Product Experience

## Status: ✅ ACCEPTED (PM24 & PM25 PASS)

## Scope
- Storefront Cart (Cart UI + LocalStorage + CartManager delegation)
- Checkout Experience (CheckoutFlow + PaymentEngine + PaymentFactory)
- Order Experience (OrderProcessingEngine status)
- Commerce API (tenant-scoped POST /api/store/checkout)
- Guest Checkout (no Customer Account)

## Checklist

### Faza 1 — Commerce API ✅
- [x] Create `src/app/api/store/checkout/route.ts` — POST, tenant-scoped, thin orchestration
- [x] Create `src/lib/order/OrderRuntime.ts` — DTO wrapper (zero business logic)

### Faza 2 — Cart Runtime Integration ✅
- [x] Create `src/lib/cart/CartStore.tsx` — React Context + useReducer + LocalStorage
- [x] Create `src/lib/cart/cartAdapter.ts` — Product → CommerceProduct mapping

### Faza 3 — Storefront ✅
- [x] Create `/store/[slug]/cart` — cart CRUD, quantities, LocalStorage
- [x] Create `/store/[slug]/checkout` — address form → POST /api/store/checkout
- [x] Create `/store/[slug]/order/[id]` — order status from OrderProcessingEngine
- [x] Create `/store/[slug]/order/success` — order confirmation

### Faza 4 — Builder Integration ✅
- [x] CartSection (Navbar cart badge) + "Add to Cart" event in ProductGridSection
- [x] Navbar badge reactive via `useCart()` (CartStore only, no business logic)
- [x] ProductGrid "Do koszyka" delegates to CartStore dispatch (no price/checkout logic)
- [x] `CartProvider` wraps storefront in `/store/[slug]/page.tsx`; Runtime Preview unchanged

### Faza 5 — Testy (node env, bez jsdom) ✅
- [x] cart-store.test.ts — 7 tests
- [x] order-runtime.test.ts — 5 tests
- [x] checkout-route.test.ts — 6 tests
- [x] order-integration.test.ts (Webhook → Payment.Completed → Order → Status) — 2 tests
- [x] `npx tsc --noEmit` — 0 errors
- [x] `npx vitest run` — 0 failed (190 files / 1922 tests)
- [x] `npm run build` — GREEN

### Faza 6 — Dokumentacja ✅
- [x] `TODO_SPRINT6_STEP6.md`
- [x] `TODO_SPRINT6_STEP6.progress.md`
- [x] `docs/studio/115_SPRINT6_STEP6_COMPLETION_REPORT.md`

## Exit Criteria
- [ ] Cart works with LocalStorage persistence
- [ ] Checkout creates orders via OrderProcessingEngine
- [ ] Payment goes through PaymentEngine + PaymentFactory
- [ ] Order status read from OrderProcessingEngine
- [ ] Commerce API is tenant-scoped
- [ ] All tests pass: vitest + tsc --noEmit
- [ ] No business logic duplication from commerce-engine
- [ ] Documentation complete
