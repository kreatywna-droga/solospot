# TASK WF-HACP-PROD-003 — DIRECTED ACYCLIC GRAPH (DAG)

**TASK ID:** WF-HACP-PROD-003  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DATE:** 2026-08-20  

---

## EXECUTION TASK GRAPH (DAG)

```
[Phase 0: Runtime Safety & Baseline]
       │
       ▼
[Phase 1: Discovery (5 Candidates)]
       │
       ▼
[Phase 2: Autonomous Selection (CAND-001)]
       │
       ▼
[Phase 3: Architectural Check & 3-Layer ADR]
       │
       ▼
[Phase 4 & 5: Workforce Planning & Model Seat Selection]
       │
       ▼
[Phase 6 & 7: Implementation Plan & DAG Creation]
       │
       ▼
[Phase 8: Baseline Snapshot & Baseline Test Run]
       │
       ▼
[Phase 9: Developer Implementation]
       │
       ▼
[Phase 10 & 11: Tester Testing & Adversarial Verification]
       │
       ├─────────────────────────────────┐
       ▼ (If Defect Discovered)          ▼ (If PASS)
[Phase 12: Rework Request & Fix]   [Phase 14: Regression Reconciliation]
       │                                 │
       ▼                                 ▼
[Phase 13: Retest]                 [Phase 15 & 16: Suppression & Scope Audit]
       │                                 │
       └─────────────────────────────────┤
                                         ▼
                           [Phase 17 & 18: Integration & Failure Injection / Rollback]
                                         │
                                         ▼
                           [Phase 19 & 20: Independent Audit & Evidence Matrix]
                                         │
                                         ▼
                           [Phase 21 & 22: B13 Governance & Safe Commit]
                                         │
                                         ▼
                           [Phase 23 & 24: Post-Commit Verification & Final Self-Verification]
                                         │
                                         ▼
                           [Phase 25: Controlled Stop]
```

---

## NODE CONSTRAINTS & GUARANTEES

- **Forward Progressing:** Acyclic graph guarantee.
- **Rework Gate:** Phase 12-13 executes if Tester detects defects.
- **Failure Injection Gate:** Phase 18 verifies failure detection, state consistency, and rollback recovery.
- **B13 Governance Gate:** Phase 22 (Commit) executes ONLY if Phase 21 decision is `COMMIT`.
- **Termination:** Phase 25 produces `CONTROLLED STOP`.
