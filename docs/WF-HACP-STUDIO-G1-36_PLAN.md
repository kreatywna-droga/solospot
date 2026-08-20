# TASK WF-HACP-STUDIO-G1-36 — PLAN & CONTRACT

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-36 — VectorRenderingBridge Transform & Stroke Fidelity (Parity with VectorSvgExporter)
**PARENT:** WF-HACP-STUDIO-G1-35 (SVG Exporter & Document Persistence)
**BASELINE:** b16bbf7

---

## 1. MISSION

Bring the on-canvas `VectorRenderingBridge` to parity with the SVG exporter (G1-35). A VectorNode
compiled into `RendererCommand[]` must visually match its `VectorSvgExporter` output for:
(1) full affine transform (translate + rotate-about-center + scale + skew),
(2) stroke attributes (dashArray, dashOffset, lineJoin, miterLimit, lineCap, stroke opacity),
(3) fill fidelity (gradient linear/radial references, fill opacity, node opacity).

## 2. OBJECTIVE

Currently `VectorRenderingBridge.buildRenderCommands` ignores `rotationDeg`, `skewX`, `skewY`
(hardcodes 0 in the matrix) and drops gradients / dash arrays / joins / miter limits. The SVG exporter
handles all of these. G1-36 fixes the bridge to be a faithful on-canvas compiler.

## 3. BUSINESS VALUE

- What-you-see-is-what-you-export: rotated/skewed/dashed/gradient shapes no longer render differently
  on canvas vs exported SVG.
- Removes a correctness defect affecting every G1-31..G1-35 editor workflow (drag, marquee, pen, boolean).

## 4. SUCCESS CRITERIA

- Bridge compiles full affine matrix: `SET_TRANSFORM` includes rotation + skew + scale + translate
  (matches SVG `translate(x,y) rotate(deg cx cy) scale(sx,sy) skewX(...) skewY(...)`).
- Draw* commands carry stroke fidelity fields (dashArray, dashOffset, lineJoin, miterLimit, lineCap, opacity).
- Gradient fills emit a gradient reference (compatible with `VectorFill` linear/radial) in Draw commands.
- ≥15 feature, ≥7 E2E, ≥15 adversarial, ≥3 failure-injection tests — all PASS.
- PASS_TO_FAIL = 0; REMOVED_TESTS = 0; UNAUTHORIZED_FAILURES = 0.
- G1-33 marquee, G1-34 pen, G1-35 exporter suites remain green.

## 5. DEPENDENCIES

- `VectorDomainModel` (G1-34, tracked) — `VectorTransform`, `VectorFill`, `VectorStroke`.
- `VectorGeometry` (G1-34, tracked) — `polygonGeometry` reused for polygon points.
- `RendererCommand` (S11) — Draw* DTOs; extended with OPTIONAL additive fields.
- `CanvasRenderer` (S11) — executes commands; extended to consume new optional fields (guarded).
- `VectorSvgExporter` (G1-35) — reference semantics for transform/style fidelity.

## 6. AFFECTED LAYERS / PACKAGES

| Layer | Package | Files |
|:---|:---|:---|
| Domain | `packages/authoring-studio/src/vector` | `VectorDomainModel.ts` (read-only) |
| Compiler | `packages/authoring-studio/src/vector` | `VectorRenderingBridge.ts` (in `rendering/`) |
| DTO | `packages/authoring-studio/src/rendering` | `RendererCommand.ts` (additive optional fields) |
| Executor | `packages/authoring-studio/src/rendering` | `CanvasRenderer.ts` (guard-based consumption) |
| Tests | `packages/authoring-studio/src/vector/__tests__` | `VectorRenderingFidelityG136.test.ts` (new) |

## 7. SSOT / HISTORY / SERIALIZATION / RENDERING / UI IMPACT

- SSOT: unchanged — `VectorDocumentSnapshot` remains SSOT; bridge is read-only compiler.
- HISTORY: unchanged — no history writes.
- SERIALIZATION: unchanged — no serializer changes.
- RENDERING: core impact — `SET_TRANSFORM` matrix, Draw* fidelity fields, gradient refs.
- UI: none — headless vertical slice.

## 8. SECURITY IMPACT

None. Pure headless TypeScript; no I/O, no eval, no DOM in compiled output.

## 9. REGRESSION REQUIREMENTS

Full vector + rendering + camera/viewport suites:
G1-33 (57), G1-34 (25), G1-35 (38), ShapeRendering (5), VectorIntegration (1), VectorDocumentLifecycle (rendering asserts), rendering suite. PASS_TO_FAIL = 0.

## 10. TEST REQUIREMENTS

- FEATURE_TESTS ≥ 15
- E2E_WORKFLOWS ≥ 7
- ADVERSARIAL_SCENARIOS ≥ 15
- FAILURE_INJECTION ≥ 3 (one on state/boundary: corrupted node / matrix boundary)

## 11. ROLLBACK REQUIREMENTS

- All `RendererCommand` additions are OPTIONAL fields — dropping them restores old behavior.
- Bridge changes isolated to `VectorRenderingBridge.ts`.
- Full suite re-run at post-commit to confirm green.

## 12. SCOPE BOUNDARY

IN: transform matrix fidelity, stroke attribute fidelity, gradient fill refs in bridge + CanvasRenderer
guarded consumption + new test suite.

OUT: Vector Zoom/Pan (C-02), Snapping (C-03), real boolean CSG (C-04), align-to-artboard (C-05),
skew UI op (C-06), media export subsystem, G1-37 auto-start.