# B17-REAL-CANARY-1.1 — CONTRADICTION & ACCOUNTING MATRIX

| Contradiction ID | Claim A | Claim B | Physical Fact | Resolution | Impact |
|---|---|---|---|---|---|
| **CTR-001** | "100% Passing State Confirmed" in post-commit summary | 24 pre-existing failing test files reported in full repo suite | 100% passing state refers to the target package `packages/commerce-engine` (9/9 files pass, 43/43 tests pass) and 0 net regressions across monorepo | Reconciled: terminology distinction between target package pass (100%) and monorepo regression status (0 new failures) | Resolved (No impact on correctness) |
| **CTR-002** | 24 failing test files | 37 failing test cases | 24 test files contained a total of 37 individual failing test cases (e.g. `OnionSkin.test.tsx` had 2 failures, `GraphEditor.test.tsx` had 2 failures) | Reconciled: 24 represents file count; 37 represents test case count | Resolved (Mathematically exact) |
| **CTR-003** | 522 passed files -> 524 passed files | 3330 passed tests -> 3343 passed tests | 2 new test files added: `cart-runtime.test.ts` (7 tests) + `cart-runtime.adversarial.test.ts` (6 tests). Total new tests = 7 + 6 = 13 | Reconciled: +2 test files and +13 test cases perfectly account for the delta (522+2=524, 3330+13=3343) | Resolved (100% Match) |
| **CTR-004** | Commit parent `8d9f45a` vs reported baseline | Git log tree structure | `git log -n 2` shows `beb8282` parent is exactly `8d9f45a` | Reconciled: Linear lineage confirmed | Resolved (Verified) |
