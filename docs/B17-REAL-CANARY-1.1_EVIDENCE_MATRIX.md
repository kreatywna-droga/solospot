# B17-REAL-CANARY-1.1 — FORENSIC EVIDENCE MATRIX

| Claim ID | Subject | Stated Claim | Physical Proof | Scope | Verified Status |
|---|---|---|---|---|---|
| **C-001** | Runtime Safety | Workspace root isolated | CWD check & path validation | Workspace Root | **VERIFIED** |
| **C-002** | Baseline Commit | Git parent commit is `8d9f45a` | `git rev-parse HEAD~1` = `8d9f45a1b2a30546afc44ab7d3fb214ec6296897` | Repository | **VERIFIED** |
| **C-003** | Baseline Inventory | 546 files (522 pass, 24 fail; 3330 pass, 37 fail) | `task-23` log baseline reconciliation | Full Workspace | **VERIFIED** |
| **C-004** | 3 Candidates | 3 real issues evaluated | `docs/B17-REAL-CANARY-1_INTENT.md` | Monorepo | **VERIFIED** |
| **C-005** | Candidate 01 Reproducibility | Multi-item cart crashed on `productsMap` isolation | Physical reproduction in `CartRuntime.ts:150` | `CartRuntime.ts` | **VERIFIED** |
| **C-006** | Autonomous Selection | Candidate 01 selected with clear value profile | Documented rationale | Governance | **VERIFIED** |
| **C-007** | Plan Generated | Structured plan authored | `docs/B17-REAL-CANARY-1_PLAN.md` | Governance | **VERIFIED** |
| **C-008** | Task Graph | 11-node acyclic graph defined | `docs/B17-REAL-CANARY-1_TASK_GRAPH.md` | Governance | **VERIFIED** |
| **C-009** | Role Selection | Segregated roles across pipeline | HACP task log | Protocol | **VERIFIED** |
| **C-010** | Model Selection | Gemini 3.7 model seat utilized | System runtime metadata | Control Plane | **VERIFIED** |
| **C-011** | Implementation | Clean fix in `CartRuntime.ts` | Physical diff in commit `beb8282` | `CartRuntime.ts` | **VERIFIED** |
| **C-012** | 43/43 Tests | 9/9 files & 43/43 tests pass in `commerce-engine` | `npx vitest run packages/commerce-engine/` exit code 0 | `commerce-engine` | **VERIFIED** |
| **C-013** | Storefront Tests | CartStore and OrderRuntime tests pass | `npx vitest run src/lib/cart/ src/lib/order/` exit code 0 | `src/lib/cart/order` | **VERIFIED** |
| **C-014** | Full Monorepo | Full regression run executed | `task-136` log (548 files, 3343 pass) | Entire Monorepo | **VERIFIED** |
| **C-015** | 0 Regressions | Zero PASS→FAIL transitions | Test identity mapping | Full Monorepo | **VERIFIED** |
| **C-016** | 6 Chaos Scenarios | 6/6 adversarial edge cases pass | `cart-runtime.adversarial.test.ts` (6 tests pass) | `CartRuntime.ts` | **VERIFIED** |
| **C-017** | Rollback Proof | Simulated failure detected and rolled back cleanly | Error injected, 4 tests failed, rolled back to 100% pass | `CartRuntime.ts` | **VERIFIED** |
| **C-018** | Zero Partial State | No dirty state left after rollback | `git status` clean diff | Repository | **VERIFIED** |
| **C-019** | Independent Audit | Agent 2 Auditor issued PASS recommendation | `docs/B17-REAL-CANARY-1_AUDIT.md` | Governance | **VERIFIED** |
| **C-020** | B13 Decision | B13 authorized COMMIT | Documented B13 review | Governance | **VERIFIED** |
| **C-021** | Commit SHA | Changes committed under `beb8282` | `git show beb8282` exists in git history | Git History | **VERIFIED** |
| **C-022** | Post-Commit | Post-commit tests executed and verified | Clean exit code 0 on `vitest` | Monorepo | **VERIFIED** |
| **C-023** | No Suppressions | Zero `@ts-ignore` / `@ts-expect-error` / `skip` | Physical grep on diff | Diff | **VERIFIED** |
| **C-024** | Scope Integrity | No edits outside commerce-engine / docs | `git diff --stat` | Monorepo | **VERIFIED** |
| **C-025** | Final State Correctness | Expected behavior matches actual behavior | Multi-product calculations accurate | Production | **VERIFIED** |
