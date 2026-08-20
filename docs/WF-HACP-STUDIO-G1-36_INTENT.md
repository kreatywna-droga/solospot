# TASK WF-HACP-STUDIO-G1-36 — INTENT

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## 1. Intent of This Sprint

Restore correctness in the on-canvas vector rendering pipeline so that what a user sees in the
Authoring Studio canvas is exactly what the SVG exporter (G1-35) produces. G1-36 is **not** a
feature-creation sprint; it is a **fidelity-parity** sprint that eliminates a documented rendering
defect discovered through physical code inspection at Phase 1/2 of this sprint.

## 2. Root-Cause Defect (Evidence-Driven)

`packages/authoring-studio/src/rendering/VectorRenderingBridge.ts` (baseline b16bbf7) compiled
`SET_TRANSFORM` with **rotation and skew hardcoded to 0** and dropped stroke dash/join/miter and
gradient fill data, while `VectorSvgExporter` (G1-35) correctly emitted `rotate(deg cx cy)`,
`stroke-dasharray`, `stroke-linejoin`, gradients, etc. Net effect: every rotated, skewed, dashed, or
gradient-filled shape renders differently on canvas than in exported SVG — a correctness defect that
affects all G1-31..G1-35 editor workflows (drag, marquee, pen, boolean, export).

## 3. Intent Boundaries (NOT Intended)

- No roadmap invention; no GAP-07 assumption; no pre-assumed feature.
- No change to SSOT, history stack, or serialization.
- No change to the Scene/Camera stack (S19-S23).
- No fix to the 3 pre-existing ShapeGrouping/ShapeTransform baseline failures (legacy reconciliation,
  documented, out of scope).
- No auto-start of G1-37. RUN_TERMINATION = CONTROLLED_STOP.

## 4. Intended Outcome

- `SET_TRANSFORM` carries the full affine matrix matching SVG transform semantics
  `translate(x,y) rotate(deg cx cy) scale(sx,sy) skewX(...) skewY(...)`.
- `DRAW_*` commands carry stroke fidelity (dashArray, dashOffset, lineJoin, miterLimit, lineCap,
  stroke opacity) and fill fidelity (linear/radial gradient references, fill opacity).
- Null/NaN/Infinity hardening so the compiler never emits a non-finite matrix.
- A committed test suite (≥15F / ≥7E2E / ≥15A / ≥3FI) that locks in the parity.

— END OF INTENT —