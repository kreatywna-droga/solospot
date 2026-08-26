# Sprint 6 Step 6 — Progress

## Status: ✅ ACCEPTED (PM24 & PM25 PASS)

### Faza 1 — Commerce API
- [x] Create `src/app/api/store/checkout/route.ts` (POST, tenant-scoped, thin orchestration)
- [x] Create `src/lib/order/OrderRuntime.ts` (DTO wrapper, zero business logic)

### Faza 2 — Cart Runtime Integration
- [x] Create `src/lib/cart/CartStore.tsx` (React Context + useReducer + LocalStorage)
- [x] Create `src/lib/cart/cartAdapter.ts` (Product → CommerceProduct mapping)

### Faza 3 — Storefront
- [x] Create `/store/[slug]/cart` page
- [x] Create `/store/[slug]/checkout` page
- [x] Create `/store/[slug]/order/[id]` page
- [x] Create `/store/[slug]/order/success` page

### Faza 4 — Builder Integration
- [x] CartSection (Navbar cart badge) + "Add to Cart" event
- [x] Navbar badge reactive via `useCart()` (CartStore only, no business logic)
- [x] ProductGrid "Do koszyka" delegates to CartStore dispatch (no price/checkout logic)
- [x] `CartProvider` wraps storefront in `/store/[slug]/page.tsx`; Runtime Preview unchanged

### Faza 5 — Testy
- [x] cart-store.test.ts — 7 tests
- [x] order-runtime.test.ts — 5 tests
- [x] checkout-route.test.ts — 6 tests
- [x] order-integration.test.ts (Webhook → Payment → Order → Status) — 2 tests
- [x] `npx tsc --noEmit` — 0 errors
- [x] `npx vitest run` — 0 failed (190 files / 1922 tests)
- [x] `npm run build` — GREEN

### Faza 6 — Dokumentacja
- [x] `TODO_SPRINT6_STEP6.md`
- [x] `TODO_SPRINT6_STEP6.progress.md`
- [x] `docs/studio/115_SPRINT6_STEP6_COMPLETION_REPORT.md`

## Exit Criteria Status
- [x] Faza 1-3 (Commerce API, Cart, Storefront) — ✅ COMPLETE
- [x] Faza 4 (Builder Integration) — ✅ COMPLETE
- [x] Faza 5 (Tests) — ✅ COMPLETE (all gates GREEN)
- [x] Faza 6 (Documentation) — ✅ ACCEPTED

> ✅ **Formal status: ACCEPTED** — Final architectural & evidence verification (Agent 2 / PM25) completed with PASS.
> Sprint 6 is formally closed and ready for Sprint 7 transition.
