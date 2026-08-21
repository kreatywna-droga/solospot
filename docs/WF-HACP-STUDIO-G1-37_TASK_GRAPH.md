# TASK WF-HACP-STUDIO-G1-37 — TASK GRAPH

**TASK ID:** WF-HACP-STUDIO-G1-37-VECTOR-VIEWPORT-CONTROLLER
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-37 — Vector Viewport & Camera Controller

---

```mermaid
graph TD
    A["G1-36 Baseline Commit (1de4518)"] --> B["Phase 0: Forensic Discovery & Baseline Reconciliation"]
    B --> C["Phase 1: Candidate Evaluation & Selection (Candidate A: Vector Viewport)"]
    C --> D["Phase 2: Architecture Contract & ADR Ratification"]
    D --> E["Phase 3: Workforce & Model Routing"]
    E --> F["Phase 4: Implementation"]
    F --> F1["VectorViewportController.ts (NEW)"]
    F --> F2["VectorRenderingBridge.ts (MODIFY)"]
    F --> F3["index.ts Barrel Export (MODIFY)"]
    F1 --> G["Phase 5: Deterministic Testing (VectorViewportG137.test.ts)"]
    F2 --> G
    G --> H["Phase 6: Regression Reconciliation (565 PASS / 3 Baseline FAIL)"]
    H --> I["Phase 7: Adversarial & Failure Injection Verification"]
    I --> J["Phase 8: Rework Loop (Harden fitToSelection for corrupted nodes)"]
    J --> K["Phase 9: Independent Audit (APPROVE)"]
    K --> L["Phase 10: B13 Governance Authorization (COMMIT)"]
    L --> M["Phase 11: Post-Commit Verification"]
```

---

— END OF TASK GRAPH —
