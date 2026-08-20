# TASK WF-HACP-STUDIO-G1-36 — ARCHITECTURE DECISION

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## DECISION ADR-2026-G1-36-01: Bridge-as-Compiler Fidelity Contract

### Status
ACCEPTED — ratified by Architect (B13 COMMIT).

### Context
The `VectorRenderingBridge` is the read-only DTO compiler from `VectorNode` → `RendererCommand[]`.
G1-35 established `VectorSvgExporter` as the reference for visual semantics. The bridge diverged
(rotation/skew dropped, stroke/fill fidelity dropped). DECISION-042/043/045 govern strict separation:
bridge delegates to domain controllers, inspector edits data only, execution stays in builder-core.

### Decision
1. **Transform**: `buildAffineTransform` composes `T(x,y)·T(cx,cy)·R(θ)·T(-cx,-cy)·S(sx,sy)·Kx·Ky`
   where `cx = width/2`, `cy = height/2` — identical to SVG `rotate(deg cx cy)` semantics:
   - `a = sx·cos·(1+tanX·tanY) − sy·sin·tanY`
   - `b = sx·sin·(1+tanX·tanY) + sy·cos·tanY`
   - `c = sx·cos·tanX − sy·sin`
   - `d = sx·sin·tanX + sy·cos`
   - `e = x + cx − cos·cx + sin·cy`
   - `f = y + cy − sin·cx − cos·cy`
   Identity case (θ=0, s=1, k=0) ⇒ `[1,0,0,1,x,y]`; rotation 90° about center maps local origin
   correctly (verified symbolically + by test).
2. **Additivity**: all `RendererCommand` extensions are OPTIONAL additive fields
   (`fillGradient`, `fillOpacity`, `strokeOpacity`, `strokeDashArray`, `strokeDashOffset`,
   `strokeLineJoin`, `strokeMiterLimit`, `lineCap`). Dropping them restores prior behavior —
   enabling rollback without breaking existing consumers.
3. **Gradient handling**: linear/radial gradients emit a `GradientFillDTO` reference alongside a
   solid fallback color; invalid stops (null, non-numeric/NaN offset, empty color) are filtered.
4. **Hardening**: compiler is pure; never mutates input; guards NaN/Infinity to a finite matrix;
   invisible / zero-opacity / null-transform nodes compile to `[]`.
5. **Commit boundary**: consistent with repo precedent, G1-36 commits only tracked
   `VectorRenderingBridge.ts` + the new test suite. The pre-existing UNTRACKED S11 executor files
   (`RendererCommand.ts`, `CanvasRenderer.ts`) are extended in the working tree but remain uncommitted
   (no committed baseline; see AUDIT.md). Execution is unaffected — the feature's correctness is
   verified at the DTO level, matching how G1-35 verified at the export level.

### Consequences
- Canvas and SVG export now share identical visual semantics for transform + stroke + fill.
- Existing tests that assert only command TYPES (ShapeRendering, CanvasRenderer, VectorWorkspaceProductFlow,
  VectorDocumentLifecycle) remain green (verified 82/82 pre-existing rendering/vector-integration tests).
- `VectorDocumentLifecycle.test.ts:414` (`transformCmd.transform[4] === 30`) preserved: identity
  translation is unchanged by the new composition.

— END OF DECISION —