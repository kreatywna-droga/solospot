# TASK WF-HACP-STUDIO-G1-36 — REGRESSION RECONCILIATION

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## Reconciliation: Baseline → Final

| Metric | Baseline (b16bbf7) | Final (post-G1-36) | Delta |
|:---|:---:|:---:|:---:|
| Vector + Rendering tests | 482 | 535 | +53 (42 G136 + 11 other rendering tests counted in combined run) |
| Vector + Rendering PASS | 479 | 532 | +53 |
| Vector + Rendering FAIL | 3 | 3 | 0 (identical pre-existing files: ShapeGrouping ×2, ShapeTransform ×1) |
| G1-33 / G1-34 / G1-35 | 57 / 25 / 38 | 57 / 25 / 38 | 0 (all PASS) |
| Scene + Camera + Viewport + Guides + Selection + Navigation + Interaction | 112 | 112 | 0 (all PASS) |
| Pre-existing rendering + vector-integration | 82 | 82 | 0 (all PASS) |

## Per-Sprint Compatibility

| Sprint | Verification | Result |
|:---|:---|:---:|
| G1-35 (SVG Exporter) | VectorSvgExporterG135.test.ts 38/38 | PASS — no change to exporter |
| G1-34 (Pen Tool) | VectorPathPenG134.test.ts 25/25 | PASS — no change to pen/geometry |
| G1-33 (Marquee) | VectorMarqueeSelectionG133.test.ts 57/57 | PASS — no change to selection |

## PASS_TO_FAIL Audit

- Compared failure sets before/after: identical — the only failing tests are the 3 pre-existing
  baseline failures. **PASS_TO_FAIL = 0.**
- No test was removed or skipped: **REMOVED_TESTS = 0.**
- No new failures introduced by G1-36: **NEW_UNAUTHORIZED_FAILURES = 0.**
- Baseline failures were NOT fixed (out of scope — legacy `computeBoundingBox` stroke-bounds
  reconciliation) and remain unsuppressed and documented.

## Cross-Check with Existing Assertions

- `VectorDocumentLifecycle.test.ts:414` asserts `transformCmd.transform[4] === 30` (translate-x after
  paste). The new identity-matrix composition preserves `[1,0,0,1,30,40]` → PASS (verified in 82-test run).
- ShapeRendering / CanvasRenderer / VectorWorkspaceProductFlow assert command TYPES only → unaffected by
  additive optional fields → PASS.

— END OF REGRESSION RECONCILIATION —