# Sprint 6 Step 6 — Commerce Product Experience (TODO)

> Status: ✅ ACCEPTED (PM25 PASS)
> Zatwierdzony plan z korektami (Guest Checkout, cienkie UI, pełne użycie commerce-engine)

## Zasady architektoniczne (Korekty zatwierdzone)
1. CartStore = tylko stan UI + LocalStorage + delegacja do `CartRuntime`/`CartManager` — BEZ logiki koszyka
2. `/api/store/checkout` = wyłącznie orkiestracja (CheckoutFlow → OrderProcessingEngine → PaymentEngine → PaymentFactory) — BEZ logiki biznesowej w Route Handlerze
3. CartSection NIE rozbudowuje ProductGridSection — zdarzenie "Add to Cart" → CartRuntime → CartStore → Navbar Badge
4. Zakres Step 6 = Guest Checkout + zapis zamówienia + status zamówienia (pełny Customer Runtime w osobnym sprincie)
5. Testy: node env, bez jsdom; obowiązkowo test Webhook → Payment.Completed → OrderProcessingEngine → Order Status

## Kolejność implementacji

### Faza 1 — Commerce API ✅
- [x] 1.1 Utworzyć `src/app/api/store/checkout/route.ts` (POST, tenant-scoped, orkiestracja)
- [x] 1.2 Utworzyć `src/lib/order/OrderRuntime.ts` (cienki wrapper wokół CheckoutFlow/OrderProcessingEngine/PaymentEngine — mapowanie DTO, zero logiki biznesowej)

### Faza 2 — Cart Runtime Integration ✅
- [x] 2.1 Utworzyć `src/lib/cart/CartStore.tsx` (client-side store: LocalStorage persistence + React context, delegacja do CartManager)
- [x] 2.2 Utworzyć `src/lib/cart/cartAdapter.ts` (mapowanie `Product` → `commerce-engine Product` dla CartManager)

### Faza 3 — Storefront ✅
- [x] 3.1 Utworzyć `src/app/store/[slug]/cart/page.tsx` (koszyk: CRUD, ilości, LocalStorage)
- [x] 3.2 Utworzyć `src/app/store/[slug]/checkout/page.tsx` (checkout: adres + PaymentFactory/CheckoutFlow/PaymentEngine)
- [x] 3.3 Utworzyć `src/app/store/[slug]/order/[id]/page.tsx` (status ze OrderProcessingEngine)
- [x] 3.4 Utworzyć `src/app/store/[slug]/order/success/page.tsx` (potwierdzenie)

### Faza 4 — Builder Integration ✅
- [x] 4.1 Utworzyć CartSection (Navbar cart badge z licznikiem) + zdarzenie "Add to Cart" w ProductGridSection

### Faza 5 — Testy (node env, bez jsdom) ✅
- [x] 5.1 `src/lib/cart/__tests__/cart-store.test.ts`
- [x] 5.2 `src/lib/order/__tests__/order-runtime.test.ts` (Checkout → PaymentEngine → OrderProcessingEngine)
- [x] 5.3 `src/app/api/store/checkout/__tests__/checkout-route.test.ts`
- [x] 5.4 Webhook → Payment.Completed → OrderProcessingEngine → Order Status test
- [x] 5.5 `npx tsc --noEmit` — 0 errors
- [x] 5.6 `npx vitest run` — 0 failed
- [x] 5.7 `npm run build` — GREEN

### Faza 6 — Dokumentacja ✅
- [x] 6.1 `TODO_SPRINT6_STEP6.md`
- [x] 6.2 `TODO_SPRINT6_STEP6.progress.md`
- [x] 6.3 `docs/studio/115_SPRINT6_STEP6_COMPLETION_REPORT.md` (z sekcją Reused Components)

## Bramka końcowa
- `npx vitest run` → 0 failed (190 files / 1922 tests)
- `npx tsc --noEmit` → 0 errors
- `npm run build` → GREEN

