# TASK WF-HACP-STUDIO-G1-39 — TASK GRAPH

**TASK ID:** WF-HACP-STUDIO-G1-39-SELECTION-TRANSFORM-SYSTEM
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-39 — Professional Selection & Transform System

---

```mermaid
graph TD
    A["G1-38 Baseline Commit (7094a1b)"] --> B["Phase 0: Forensic Discovery & Baseline Verification"]
    B --> C["Phase 1 & 2: Candidate Selection & Architecture Decision (Candidate A: Score 98.8)"]
    C --> D["Phase 3: Architecture Contract & ADR Ratification"]
    D --> E["Phase 4 & 5: Selection & Transform Implementation"]
    E --> E1["VectorEditingEngine.ts (MODIFY: scaleShapes, rotateShapes, transformShapesComposed, computeSelectionBounds)"]
    E --> E2["VectorWorkspaceController.ts (MODIFY: setSelection, moveSelectedNodes, scaleSelectedNodes, rotateSelectedNodes)"]
    E1 --> F["Phase 6..10: Integration Verification (Viewport, Pen, SVG, Alignment, History)"]
    E2 --> F
    F --> G["Phase 11..14: Deterministic Testing (VectorTransformG139.test.ts - 69 Tests)"]
    G --> H["Phase 15: Cross-Milestone Regression Reconciliation (689 PASS / 3 Baseline FAIL)"]
    H --> I["Phase 16: Rework Loop (Duplicate export cleanup & history label fix)"]
    I --> J["Phase 17: Independent Audit (APPROVE)"]
    J --> K["Phase 18: B13 Governance Authorization (COMMIT)"]
    K --> L["Phase 19: Commit & Post-Commit Verification"]
```

---

— END OF TASK GRAPH —
