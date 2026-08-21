# TASK WF-HACP-STUDIO-G1-39 — PLAN & CONTRACT

**TASK ID:** WF-HACP-STUDIO-G1-39-SELECTION-TRANSFORM-SYSTEM
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-39 — Professional Selection & Transform System
**PARENT:** WF-HACP-STUDIO-G1-38 (Vector Alignment Engine Expansion)
**BASELINE:** `7094a1b`

---

## 1. Mission

Implement the Professional Selection & Transform System in `VectorEditingEngine.ts` and `VectorWorkspaceController.ts` supporting selection state management (`setSelection`, `addToSelection`, `removeFromSelection`, `toggleSelection`, `clearSelection`, `computeSelectionBounds`), document-space movement, proportional and non-proportional scaling relative to center or custom origin, rotation around multi-object center or custom origin, composed matrix transformations, and strict `HistoryStack` transactionality.

## 2. Objective

Deliver pure, headless selection and transform operations with 100% integration across Viewport, SVG Exporter, Pen Tool, Rendering Bridge, and Alignment Engine.

## 3. Success Criteria

- Complete selection management API (`setSelection`, `addToSelection`, `removeFromSelection`, `toggleSelection`, `clearSelection`).
- Accurate tight bounding box calculation for single and multi-selection bounds (`computeSelectionBounds`).
- Proportional & non-proportional scaling (`scaleShapes`) and rotation (`rotateShapes`) relative to center or custom origin $(ox, oy)$.
- Composed matrix transformation (`transformShapesComposed`).
- History transactionality: preview = 0 history entries; 1 completed user transform = 1 `HistoryStack` entry.
- Deterministic test suite (`VectorTransformG139.test.ts`) with ≥ 20 feature, ≥ 10 integration, ≥ 10 E2E, ≥ 20 adversarial, and ≥ 5 failure injection tests (All PASS).
- PASS_TO_FAIL = 0, NEW_FAILURES = 0, REMOVED_TESTS = 0.

---

— END OF PLAN —
