# B17-REAL-CANARY-2 — FORENSIC EVIDENCE MATRIX

| Claim ID | Layer | Stated Claim | Physical Proof | Scope | Status |
|---|---|---|---|---|---|
| **E-001** | Runtime Safety | Workspace root & environment isolated | CWD & Node/Vitest verified | Monorepo Root | **VERIFIED** |
| **E-002** | Baseline State | Baseline parent `beb8282` verified | `git rev-parse HEAD` = `beb8282...` | Git Lineage | **VERIFIED** |
| **E-003** | 3 Candidates | 3 real multi-layer candidates evaluated | `docs/B17-REAL-CANARY-2_INTENT.md` | Monorepo | **VERIFIED** |
| **E-004** | Candidate 1 Selection | Storefront End-to-End Pricing Pipeline selected | Crosses 4 distinct physical layers | Multi-Layer | **VERIFIED** |
| **E-005** | UI State Layer | `ADD_ITEM` accumulates quantity; `UPDATE_QUANTITY <= 0` removes item | Unit tests in `cart-store.test.ts` (8/8 pass) | `CartStore.tsx` | **VERIFIED** |
| **E-006** | Adapter Layer | `buildCartFromRequest` filters non-positive qty & maps catalog | Adapter execution in `cartAdapter.ts` | `cartAdapter.ts` | **VERIFIED** |
| **E-007** | Orchestration Layer | `OrderRuntime.checkout` computes item prices and real grand total | Unit tests in `order-runtime.test.ts` (6/6 pass) | `OrderRuntime.ts` | **VERIFIED** |
| **E-008** | Inflight Concurrency | Concurrent checkouts with same correlationId deduplicated | `ADV-01` in `order-adversarial-multilayer.test.ts` pass | `OrderRuntime.ts` | **VERIFIED** |
| **E-009** | Domain Integration | `OrderProcessingEngine` receives accurate subtotal/tax/grand totals | `OrderProcessingEngine.ts` | Domain Engine | **VERIFIED** |
| **E-010** | Payment Intent | `PaymentEngine` issues intent for real calculated amount | `PaymentEngine.ts` | Payment Engine | **VERIFIED** |
| **E-011** | 5 E2E Workflows | 5 real cross-layer E2E workflows pass | `order-e2e-multilayer.test.ts` (5/5 pass) | Multi-Layer E2E | **VERIFIED** |
| **E-012** | Adversarial Suite | 6 chaos edge cases pass | `order-adversarial-multilayer.test.ts` (6/6 pass) | Chaos Testing | **VERIFIED** |
| **E-013** | Regression Proof | Full repository test suite executed: 550 test files, 3357 passed | `task-318` log | Full Monorepo | **VERIFIED** |
| **E-014** | Zero Regressions | `PASS → FAIL = 0`, `REMOVED = 0` | Test identity diff | Full Monorepo | **VERIFIED** |
| **E-015** | Failure Injection | Failure injected into `executeCheckout` triggered 12 failures | `OrderRuntime.ts` | Reliability | **VERIFIED** |
| **E-016** | Rollback Proof | Clean rollback restored 100% passing state (14/14 files, 71/71 tests) | `npx vitest run` | Repository | **VERIFIED** |
| **E-017** | Zero Suppressions | 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 `test.skip` | Grep verification | Monorepo | **VERIFIED** |
| **E-018** | TypeScript Purity | 0 TypeScript errors in modified/created commerce & cart/order files | `npx tsc` output | Target Files | **VERIFIED** |
| **E-019** | B13 Authorization | Deterministic evidence satisfies all Canary 2 criteria | Governance Log | B13 Governor | **VERIFIED** |
| **E-020** | Scope Confinement | Zero changes outside cart, order, commerce-engine, and docs | Git diff audit | Monorepo | **VERIFIED** |
