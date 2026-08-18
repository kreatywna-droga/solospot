# B17-REAL-CANARY-2.1 — SCOPE & LINEAGE FORENSIC AUDIT

## 1. Commit Lineage
- **Baseline Git SHA**: `beb8282fd3d8d62120fc21053e70f135c4436e2f`
- **Final Git SHA**: `84e68bc679fb6235ed830e43999b6beec373b96c`
- **Parent Relationship**: `git rev-parse 84e68bc~1` = `beb8282fd3d8d62120fc21053e70f135c4436e2f` (Strictly linear parentage).

---

## 2. File Change Classification

| File Path | Role | Classification | Audit Findings |
|---|---|---|---|
| `packages/commerce-engine/src/OrderProcessingEngine.ts` | Domain Engine | **AUTHORIZED / NECESSARY** | Adds `totalsOverride` support to `createOrder` |
| `src/lib/cart/CartStore.tsx` | UI State | **AUTHORIZED / NECESSARY** | Fixes `ADD_ITEM` accumulation & zero-quantity removal |
| `src/lib/cart/cartAdapter.ts` | Adapter Layer | **AUTHORIZED / NECESSARY** | Fixes `buildCartFromRequest` filtration |
| `src/lib/order/OrderRuntime.ts` | Orchestration | **AUTHORIZED / NECESSARY** | Adds inflight promise deduplication & item pricing |
| `src/lib/cart/__tests__/cart-store.test.ts` | Unit Tests | **AUTHORIZED / SUPPORTING** | Tests accumulation & removal |
| `src/lib/order/__tests__/order-runtime.test.ts` | Unit Tests | **AUTHORIZED / SUPPORTING** | Tests priced checkout & discount |
| `src/lib/order/__tests__/order-e2e-multilayer.test.ts` | E2E Tests | **AUTHORIZED / SUPPORTING** | 5 real cross-layer E2E workflows |
| `src/lib/order/__tests__/order-adversarial-multilayer.test.ts` | Chaos Tests | **AUTHORIZED / SUPPORTING** | 6 multi-layer adversarial scenarios |
| `docs/B17-REAL-CANARY-2_*.md` (7 files) | Governance | **AUTHORIZED / GOVERNANCE** | Complete governance artifact package |

**Scope Verdict**: 100% confined to declared Canary #2 boundaries. Zero unauthorized files. Zero architectural bypasses.
