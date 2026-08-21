# TASK WF-HACP-STUDIO-G1-38 — PLAN & CONTRACT

**TASK ID:** WF-HACP-STUDIO-G1-38-VECTOR-ALIGNMENT-ENGINE
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-38 — Vector Alignment Engine Expansion
**PARENT:** WF-HACP-STUDIO-G1-37 (Vector Viewport & Camera Controller)
**BASELINE:** `653d78a`

---

## 1. Mission

Expand the Vector Alignment Engine in `VectorEditingEngine.ts` and `VectorWorkspaceController.ts` with canvas/artboard relative alignment (`alignShapesToCanvas`), fixed pixel gap distribution (`distributeShapesWithGap`), and multi-column grid layout arrangement (`arrangeShapesInGrid`).

## 2. Objective

Deliver pure, headless canvas alignment and grid layout operations with full transactionality on `HistoryStack`, preserving document SSOT, SVG exporter parity, rendering bridge fidelity, and viewport coordinate translation.

## 3. Success Criteria

- `VectorEditingEngine.alignShapesToCanvas` supports `left`, `center`, `right`, `top`, `middle`, `bottom` canvas alignment.
- `VectorEditingEngine.distributeShapesWithGap` maintains exact pixel gap spacing along horizontal/vertical axes.
- `VectorEditingEngine.arrangeShapesInGrid` lays out shapes into regular multi-column grid structures.
- Workspace controller actions (`alignSelectedNodesToCanvas`, `distributeSelectedNodesWithGap`, `arrangeSelectedNodesInGrid`) commit clean `HistoryStack` entries with undo/redo support.
- Deterministic test suite (`VectorAlignmentG138.test.ts`) with ≥ 15 feature, ≥ 8 integration, ≥ 8 E2E, ≥ 16 adversarial, and ≥ 4 failure injection tests (All PASS).
- PASS_TO_FAIL = 0, NEW_FAILURES = 0, REMOVED_TESTS = 0.

---

— END OF PLAN —
