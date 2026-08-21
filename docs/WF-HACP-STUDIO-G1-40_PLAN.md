# TASK WF-HACP-STUDIO-G1-40 — PLAN & CONTRACT

**TASK ID:** WF-HACP-STUDIO-G1-40-SNAPPING-ENGINE-DYNAMIC-GUIDES
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**MODE:** HACP NIGHT SHIFT TRAINING — LEVEL 2
**MILESTONE:** G1-40 — Vector Snapping Engine & Dynamic Alignment Guides
**BASELINE:** `92d44c9`

---

## 1. Plan Overview

Implement pure headless snapping geometry calculations (`VectorSnappingEngine.ts`) and workspace controller snapping actions (`VectorWorkspaceController.ts`) across a 5-stage pipeline with 2 recovery interruptions.

## 2. 5-Stage Execution Plan

1. **Stage 1 (Architecture & Foundations):** `VectorSnappingEngine.ts` DTOs, threshold math, edge/center/grid snapping primitives.
2. **Stage 2 (Core Domain & Guide Generation):** Dynamic guide line generation (`generateAlignmentGuides`) & rotated shape snap edge calculations.
   - *Controlled Interruption #1 executed & verified after Stage 2.*
3. **Stage 3 (Workspace Controller & Viewport Integration):** `moveSelectedNodesWithSnapping` & `scaleSelectedNodesWithSnapping` workspace actions + viewport screen-space guide mapping.
4. **Stage 4 (Runtime, History & SSOT Isolation):** Transient guide line isolation (`activeGuideLines`) from `HistoryStack` (0 history entries).
   - *Controlled Interruption #2 executed & verified after Stage 4.*
5. **Stage 5 (Validation, Hardening & Operational Surface):** `VectorSnappingG140.test.ts` (67 tests: 19 feature, 12 integration, 10 E2E, 21 adversarial, 5 failure injection — 100% PASS), 23 governance docs, read-only audit, B13 ratification, commit & post-commit verification.

---

— END OF PLAN —
