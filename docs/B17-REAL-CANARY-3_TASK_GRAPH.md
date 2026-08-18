# B17-REAL-CANARY-3 — TASK GRAPH

```mermaid
graph TD
    T0[Task 0: Runtime Safety & Baseline Verification] --> T1[Task 1: Product Discovery & Candidate Prioritization]
    T1 --> T2[Task 2: Architectural Decision & Contract Definition]
    T2 --> T3[Task 3: OrderRuntime Singleton & Lifecycle Support]
    T3 --> T4[Task 4: Checkout API Route Enrichment]
    T4 --> T5[Task 5: Order Status API Route Alignment]
    T5 --> T6[Task 6: Storefront Checkout UI Payload Alignment]
    T6 --> T7[Task 7: Layer Unit & Integration Tests]
    T7 --> T8[Task 8: 7 Real Multi-Layer Product E2E Workflows]
    T8 --> T9[Task 9: 10 Adversarial Chaos Scenarios]
    T9 --> T10[Task 10: Failure Injection & Rollback Proof]
    T10 --> T11[Task 11: Full Monorepo Regression Reconciliation]
    T11 --> T12[Task 12: Independent Ratification Audit]
    T12 --> T13[Task 13: B13 Governance Decision]
    T13 --> T14[Task 14: Version Control Commit & Post-Commit Audit]
    T14 --> T15[Task 15: Product Readiness Classification]
```

## Task Node Specifications
- **T0**: Pre-canary baseline snapshot (`84e68bc`).
- **T1**: Product discovery evaluating 5 candidates.
- **T2**: Architectural decision for OrderRuntime SSOT and API routes.
- **T3**: Implement `OrderRuntime.getInstance()` and status management in `OrderRuntime.ts`.
- **T4**: Update `src/app/api/store/checkout/route.ts` with `couponCode` and `getInstance()`.
- **T5**: Update `src/app/api/store/order/[id]/route.ts` with `getInstance()`.
- **T6**: Update `src/app/store/[slug]/checkout/page.tsx` payload.
- **T7**: Validate unit test suites in `src/lib/order/` and `src/app/api/store/`.
- **T8**: Execute 7 real product E2E workflows in `src/lib/order/__tests__/order-lifecycle-e2e.test.ts`.
- **T9**: Execute 10 adversarial chaos tests in `src/lib/order/__tests__/order-lifecycle-adversarial.test.ts`.
- **T10**: Execute failure injection and rollback proof.
- **T11**: Reconcile full workspace regression suite (552 files, 3374+ tests).
- **T12**: Multi-agent independent forensic audit.
- **T13**: B13 Governor formal review.
- **T14**: Git commit and post-commit testing.
- **T15**: Final product readiness classification.
