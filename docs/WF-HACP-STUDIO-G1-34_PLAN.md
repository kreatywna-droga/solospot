# TASK WF-HACP-STUDIO-G1-34 — IMPLEMENTATION PLAN

**TASK ID:** WF-HACP-STUDIO-G1-34  
**FEATURE:** Path Pen Tool — Bezier Curve Drawing & Node Editing  
**DATE:** 2026-08-20  

---

## 1. IN-SCOPE FILES TO MODIFY / CREATE

1. `packages/authoring-studio/src/vector/VectorDomainModel.ts` (MODIFY: Extend `PathNode` with `VectorPathAnchor`, `VectorPathData`, `VectorNodeType`).
2. `packages/authoring-studio/src/vector/VectorGeometry.ts` (MODIFY: Add Bezier path math utilities `pathDataToSvgPath`, `svgPathToPathData`, cubic Bezier point sampling).
3. `packages/authoring-studio/src/vector/VectorPenEngine.ts` (NEW: Pure Pen Tool drawing session & node editing engine).
4. `packages/authoring-studio/src/vector/VectorWorkspaceController.ts` (MODIFY: Add Pen tool drawing actions & node editing methods).
5. `packages/authoring-studio/src/vector/VectorDocumentSerializer.ts` (MODIFY: Preserve `pathData` in document roundtrip).
6. `packages/authoring-studio/src/vector/index.ts` (MODIFY: Export new Pen Engine types & functions).
7. `packages/authoring-studio/src/vector/__tests__/VectorPathPenG134.test.ts` (NEW: Comprehensive G1-34 unit, integration, E2E, adversarial, and failure injection test suite).

---

## 2. STAGE EXECUTION PLAN

- **STAGE 1:** Update `VectorDomainModel.ts` & `VectorGeometry.ts`.
- **STAGE 2:** Implement `VectorPenEngine.ts`.
- **STAGE 3:** Integrate Pen actions into `VectorWorkspaceController.ts`.
- **STAGE 4:** Update `VectorDocumentSerializer.ts` and `VectorRenderingBridge.ts`.
- **STAGE 5:** Create `VectorPathPenG134.test.ts` with 50+ tests covering 7 E2E workflows, 12+ adversarial scenarios, and 3 failure injection points.
- **STAGE 6:** Execute regression test suite (`bun test packages/authoring-studio/src/vector/__tests__`).
- **STAGE 7:** Independent Auditor verification & B13 decision (`COMMIT`).
