# TASK WF-HACP-STUDIO-G1-40 — STAGE MAP

**TASK ID:** WF-HACP-STUDIO-G1-40-SNAPPING-ENGINE-DYNAMIC-GUIDES
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**MODE:** HACP NIGHT SHIFT TRAINING — LEVEL 2
**MILESTONE:** G1-40 — Vector Snapping Engine & Dynamic Alignment Guides

---

## Stage Execution Breakdown (5 Stages)

| Stage | Objective | Primary Files / Inputs | Outputs | Checkpoint / Recovery |
|:---:|:---|:---|:---|:---:|
| **Stage 1** | **Architecture & Foundations** | `VectorSnappingEngine.ts` (NEW) | Pure snapping DTOs (`SnapResult`, `GuideLine`) and edge/center/grid math primitives. | **CP-01** (Complete) |
| **Stage 2** | **Core Domain & Guide Generation** | `VectorSnappingEngine.ts` (MODIFY) | Dynamic guide line generator (`generateAlignmentGuides`) & rotated shape snap edges. | **CP-02** (Complete) $\rightarrow$ **Recovery #1** |
| **Stage 3** | **Subsystem Integration** | `VectorWorkspaceController.ts` (MODIFY) | `moveSelectedNodesWithSnapping` & `scaleSelectedNodesWithSnapping` workspace actions + Viewport screen mapping. | **CP-03** (Complete) |
| **Stage 4** | **Runtime, History & SSOT Isolation** | `VectorWorkspaceState` | Transient `activeGuideLines` state isolated from `HistoryStack` (0 history entries). | **CP-04** (Complete) $\rightarrow$ **Recovery #2** |
| **Stage 5** | **Validation, Hardening & Surface** | `VectorSnappingG140.test.ts` (NEW) | 67 tests (19 Feature, 12 Integration, 10 E2E, 21 Adversarial, 5 Failure Injection — 100% PASS), 23 governance docs, B13 ratification, commit & post-commit verification. | **CP-05** (Complete) |

---

— END OF STAGE MAP —
