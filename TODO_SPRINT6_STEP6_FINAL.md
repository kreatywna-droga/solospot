# Sprint 6 Step 6 — Finalization & Stabilization (Agent 1)

Status: IN PROGRESS

## Plan zatwierdzony przez Architekta (z korektami)

### Krok 1 — Testy (Zadanie A)
- [ ] Export `cartReducer` w `src/lib/cart/CartStore.tsx` (dostęp dla testów)
- [ ] Utworzyć `src/lib/cart/__tests__/cart-store.test.ts`
- [ ] Utworzyć `src/lib/order/__tests__/order-runtime.test.ts`
- [ ] Utworzyć `src/app/api/store/checkout/__tests__/checkout-route.test.ts`
- [ ] Utworzyć `src/lib/order/__tests__/order-integration.test.ts` (Cart → Checkout → Payment.Completed → OrderProcessingEngine → PAID)
- [ ] Test idempotencji `OrderRuntime.checkout()` (podwójne kliknięcie "Zapłać" nie tworzy dwóch zamówień)
- [ ] Test błędnej walidacji wejścia dla `/api/store/checkout`

### Krok 2 — Quality Gates (Zadanie B)
- [ ] `npx vitest run` → 0 failed
- [ ] `npx tsc --noEmit` → 0 errors
- [ ] `npm run build` → GREEN

### Krok 3 — Cleanup (Zadanie C)
- [ ] Usunąć martwe importy
- [ ] Usunąć TODO/FIXME/HACK pozostawione podczas Step 6
- [ ] Usunąć nieużywane helpery i feature flagi
- [ ] Usunąć nieużywane eksporty
- [ ] Sprawdzić, czy nie ma helperów używanych tylko przez testy

### Krok 4 — Dokumentacja (Zadanie D)
- [ ] Zaktualizować `TODO_SPRINT6_STEP6.md`
- [ ] Zaktualizować `TODO_SPRINT6_STEP6.progress.md`
- [ ] Utworzyć `docs/studio/116_SPRINT6_STEP6_FINAL_COMPLETION_REPORT.md`

### Krok 5 — Przekazanie do PM20
- [ ] Raport Agenta 1
- [ ] Logi z vitest / tsc / build
- [ ] Przekazanie Agentowi 2 (odbiór architektoniczny)

