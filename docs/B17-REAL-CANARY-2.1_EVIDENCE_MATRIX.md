# B17-REAL-CANARY-2.1 — FORENSIC EVIDENCE MATRIX

| Claim ID | Subject | Stated Claim | Physical Proof | Scope | Audit Verdict |
|---|---|---|---|---|---|
| **C-001** | Baseline Verified | Baseline commit `beb8282` verified | `git rev-parse 84e68bc~1` = `beb8282...` | Git Lineage | **VERIFIED** |
| **C-002** | Final Verified | Commit `84e68bc` exists and contains clean tree | `git log -n 1 84e68bc` | Git History | **VERIFIED** |
| **C-003** | 14 New Tests | 14 new test cases added | `docs/B17-REAL-CANARY-2.1_TEST_IDENTITY.md` | Workspace | **VERIFIED** |
| **C-004** | 0 Removed Tests | Zero tests removed or deleted | Test inventory diff | Workspace | **VERIFIED** |
| **C-005** | 0 PASS→FAIL | Zero passing tests regressed to fail | Full test run `task-359` | Entire Monorepo | **VERIFIED** |
| **C-006** | Multi-Layer Flow | UI $\rightarrow$ Adapter $\rightarrow$ API $\rightarrow$ Domain works end-to-end | `order-e2e-multilayer.test.ts` (5/5 PASS) | Multi-Layer | **VERIFIED** |
| **C-007** | Pricing Correct | Accurate grandTotalGross computed from real items | Verified in `OrderRuntime.ts:180` and `E2E-01` | Commerce Flow | **VERIFIED** |
| **C-008** | Coupon Correct | `SAVE10` coupon correctly applies 10% discount | Verified in `OrderRuntime.test.ts` & `E2E-02` | Discounts | **VERIFIED** |
| **C-009** | Concurrency Safe | Concurrent checkouts with same correlationId deduplicated | `ADV-01` in `order-adversarial-multilayer.test.ts` | Concurrency | **VERIFIED** |
| **C-010** | Tenant Isolation | Cross-tenant order access blocked via RLS | `ADV-02` in `order-adversarial-multilayer.test.ts` | Security | **VERIFIED** |
| **C-011** | Failure Rollback Safe | Injected fault triggered 12 failures; clean rollback verified | Phase 12 failure injection log | Reliability | **VERIFIED** |
| **C-012** | No Suppressions | Zero `@ts-ignore`, `@ts-expect-error`, `test.skip` | Grep search across repository diff | Diff | **VERIFIED** |
| **C-013** | Commit Correct | Commit matches Canary 2 scope exactly | `git diff --stat 84e68bc~1 84e68bc` | Version Control | **VERIFIED** |
| **C-014** | Post-Commit Verified | Post-commit test suite passes with 100% precision | Exit code 0 on `npx vitest run` | Production | **VERIFIED** |
| **C-015** | Discovery Integrity | Vitest discovery pattern unaltered | `vitest.config.ts` | Tooling | **VERIFIED** |
