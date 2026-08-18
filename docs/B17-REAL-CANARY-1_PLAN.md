# B17-REAL-CANARY-1 — IMPLEMENTATION & VALIDATION PLAN

## 1. Intent
Fix the multi-product shopping cart crash in `packages/commerce-engine/src/CartRuntime.ts`, allowing multiple distinct products to be added, recalculated, updated, and removed seamlessly with full tax and totals accuracy.

---

## 2. Requirements & Scope
1. **Multi-Product Support in `CartManager.recalculate`**:
   - If a product is provided in the `products` map, update item unit prices, recalculate gross/net/tax totals according to fresh product pricing.
   - If a product is NOT in the `products` map (e.g. during incremental addition via `addItem` or partial updates), use the item's existing `unitPriceGross`, calculate net price with default/proportional VAT rate, and compute item gross/net/tax totals without throwing `Product not found`.
   - If an item has neither a mapped product nor an existing `unitPriceGross`, throw a clear domain error.
2. **Multi-Product Support in `CartManager.addItem`**:
   - Allow adding product B when product A already exists in the cart.
   - Accurately compute subtotalGross, subtotalNet, taxTotal, discountGross, and grandTotalGross across all items.
3. **Cart Operations**:
   - Provide `CartManager.removeItem(cart, productId)` to immutably remove an item and recalculate totals.
   - Provide `CartManager.updateQuantity(cart, productId, quantity, productsMap?)` to adjust item quantities or remove item when quantity <= 0.
4. **No Suppressions or Rule Violations**:
   - Zero `@ts-ignore`, zero `@ts-expect-error`, zero test skipping.
   - Maintain 100% strict TypeScript types and Zod schema validation (`CartSchema.parse`).

---

## 3. Success Criteria
- [x] Adding 2+ distinct products to a cart succeeds with 100% precision.
- [x] Subtotal gross/net and tax calculations across multiple distinct items are mathematically accurate.
- [x] Discounter (`SAVE10`) applies accurately across multi-item subtotals.
- [x] `removeItem` and `updateQuantity` work immutably.
- [x] 100% of affected package tests (`packages/commerce-engine/src/*.test.ts`) pass.
- [x] Zero regressions introduced to existing passing test suite.

---

## 4. Rollback Plan
If any step in validation or audit fails:
- Execute `git checkout -- packages/commerce-engine/src/CartRuntime.ts packages/commerce-engine/src/commerce-engine.test.ts packages/commerce-engine/src/cart-runtime.test.ts`
- Verify clean git status via `git status -uno`.

---

## 5. Validation & Audit Plan
- **Deterministic Validation**:
  - Run `vitest` against `packages/commerce-engine/src/commerce-engine.test.ts` and newly created `packages/commerce-engine/src/cart-runtime.test.ts`.
  - Run `vitest` across all commerce test suites.
- **Adversarial Testing**:
  - Test zero quantity, negative quantity, invalid IDs, missing products map, repeated adds, multiple different tax rates, empty cart recalculation.
- **Independent Auditor**:
  - Verify diff, verify zero suppressions, check regression reconciliation.
- **B13 Governor Decision**:
  - Issue COMMIT / HOLD / REJECT verdict based on verifiable evidence.
