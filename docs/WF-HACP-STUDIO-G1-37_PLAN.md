# TASK WF-HACP-STUDIO-G1-37 — PLAN & CONTRACT

**TASK ID:** WF-HACP-STUDIO-G1-37-VECTOR-VIEWPORT-CONTROLLER
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-37 — Vector Viewport & Camera Controller
**PARENT:** WF-HACP-STUDIO-G1-36 (VectorRenderingBridge Transform & Stroke Fidelity)
**BASELINE:** `1de4518`

---

## 1. Mission

Implement a pure, headless vector viewport engine (`VectorViewportController.ts`) and integrate camera transformations into the vector canvas rendering bridge (`VectorRenderingBridge.ts`), enabling viewport zoom, pan, focal point scaling, reset, fit-to-screen, fit-to-selection, and coordinate translation between viewport screen space and document SSOT canvas space.

## 2. Objective

Provide complete canvas camera navigation while guaranteeing zero SSOT mutation, zero HistoryStack growth, and zero SVG export divergence during pure viewport actions.

## 3. Success Criteria

- Pure headless viewport engine (`VectorViewportController.ts`) with immutable `VectorViewportState`.
- Zoom scale clamping `[0.05, 50.0]`.
- Focal point zooming preserving cursor invariant in screen space.
- Fit-to-screen & fit-to-selection bounds calculations.
- Bidirectional coordinate translation (`canvasToViewportPoint`, `viewportToCanvasPoint`, `viewportToCanvasBounds`, `canvasToViewportBounds`).
- `VectorRenderingBridge` affine matrix composition (`T_viewport · T_node`).
- Deterministic test suite (`VectorViewportG137.test.ts`) with ≥ 12 feature, ≥ 7 E2E, ≥ 15 adversarial, ≥ 3 failure injection tests (All PASS).
- PASS_TO_FAIL = 0, NEW_FAILURES = 0, REMOVED_TESTS = 0.

## 4. Affected Layers & Packages

| Layer | Package | Files | Action |
|:---|:---|:---|:---|
| Vector Subsystem | `packages/authoring-studio/src/vector` | `VectorViewportController.ts` | NEW |
| Vector Barrel Export | `packages/authoring-studio/src/vector` | `index.ts` | MODIFY |
| Rendering Compiler | `packages/authoring-studio/src/rendering` | `VectorRenderingBridge.ts` | MODIFY |
| Test Suite | `packages/authoring-studio/src/vector/__tests__` | `VectorViewportG137.test.ts` | NEW |

---

— END OF PLAN —
