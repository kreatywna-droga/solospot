# B17-REAL-CANARY-1 — PRIMARY INTENT & DISCOVERY

## 1. Intent Statement
Execute the first autonomous real production-like canary for WEB FACTOR under the HACP (Universal Control Plane) governance protocol.
The objective is to identify, prioritize, reproduce, solve, deterministically validate, adversarially test, independently audit, govern, and commit a real, high-value, contained defect in the WEB FACTOR codebase with zero human steering.

---

## 2. Product Discovery & Evaluated Candidates

### Candidate 1: Multi-Product Shopping Cart Crash in `CartRuntime.ts`
- **Candidate ID**: `CANARY-CAND-01`
- **Location**: `packages/commerce-engine/src/CartRuntime.ts` (`CartManager.addItem` & `CartManager.recalculate`)
- **Description**: In `CartRuntime.ts`, when a user adds a product to a cart that already has an existing product, `CartManager.addItem` constructs `productsMap` containing only the new product (`new Map([[product.id, product]])`) and calls `this.recalculate(updatedCart, productsMap)`. `recalculate` iterates over all items in `updatedCart` (which includes previously added items) and throws `Error: Product not found: <existing_item_id>` because previous items are absent from `productsMap`.
- **User Value**: CRITICAL. Prevents any customer from buying more than 1 distinct product type in the online store. Adding item B when item A is in the cart completely crashes cart calculations and aborts checkout preparation.
- **Current Behavior**: Adding a second distinct product to a cart throws an uncaught error and crashes.
- **Expected Behavior**: Adding a second or subsequent distinct product to a cart recalculates totals correctly preserving/updating pricing and tax amounts without crashing.
- **Reproduction**:
  1. `let cart = createEmptyCart('tenant-1')`
  2. `cart = CartManager.addItem(cart, productA, 1)`
  3. `cart = CartManager.addItem(cart, productB, 1)`
  4. Result: Throws `Error: Product not found: <productA.id>`
- **Complexity**: Low / Controlled (approx. 15-25 lines of logic in `CartRuntime.ts`).
- **Risk**: Minimal. Pure domain calculation function with no external side effects.
- **Reversibility**: 100% reversible via standard git rollback.
- **Testability**: Highly testable via unit and integration tests with deterministic assertions.
- **Architectural Impact**: Zero. Strictly conforms to `packages/commerce-engine` SSOT and domain boundaries.

---

### Candidate 2: Incomplete Cart Reduction & Zero-Quantity Handling in `CartStore.tsx`
- **Candidate ID**: `CANARY-CAND-02`
- **Location**: `src/lib/cart/CartStore.tsx` (`cartReducer`)
- **Description**: `UPDATE_QUANTITY` action sets `{ quantity: 0 }` directly on `CartItem` without removing the item or sanitizing non-positive values, causing schema validation errors when passing items to `CartSchema` / `CartItemSchema`.
- **User Value**: Moderate. Leaves phantom items with 0 quantity in local UI state.
- **Current Behavior**: Item remains in items array with quantity 0.
- **Expected Behavior**: Quantity <= 0 should cleanly remove the item from the cart state or clamp appropriately.
- **Complexity**: Very Low.
- **Risk**: Very Low.
- **Reversibility**: 100%.
- **Testability**: High.
- **Architectural Impact**: None.

---

### Candidate 3: Missing Domain API Methods (`removeItem`, `updateQuantity`) in `CartManager`
- **Candidate ID**: `CANARY-CAND-03`
- **Location**: `packages/commerce-engine/src/CartRuntime.ts`
- **Description**: `CartManager` only provides `recalculate` and `addItem`. Removing an item or updating quantity requires external consumers to manually slice `cart.items` and invoke `recalculate` with a full products map.
- **User Value**: Moderate-High. Standardizes domain cart operations across storefront and headless API callers.
- **Current Behavior**: Consumers must do manual cart manipulation outside domain manager.
- **Expected Behavior**: `CartManager.removeItem(cart, productId)` and `CartManager.updateQuantity(cart, productId, quantity, productsMap?)` exposed as pure domain helper methods.
- **Complexity**: Low.
- **Risk**: Low.
- **Reversibility**: 100%.
- **Testability**: High.
- **Architectural Impact**: None.

---

## 3. Autonomous Selection & Rationale

### Selected Primary Canary Issue: `CANARY-CAND-01` (Multi-Product Shopping Cart Crash in `CartRuntime.ts`) with synergistic inclusion of `CANARY-CAND-03` domain enhancements (`removeItem`, `updateQuantity`).

### Rationale:
1. **User Value**: Highest among all candidates. A shopping cart that cannot hold more than one item is fundamentally broken for any real commerce scenario.
2. **Observability & Verifiability**: 100% deterministic reproduction before fix (reproduce crash with 2 distinct products) and after fix (subtotals, net/gross, taxes, and coupon discounts perfectly verified).
3. **Low Risk & Reversibility**: Isolated entirely to pure domain logic in `packages/commerce-engine/src/CartRuntime.ts`. Zero database migrations, zero external network dependencies, zero breaking API changes.
4. **Architectural Purity**: Preserves domain SSOT and strictly maintains package isolation.
