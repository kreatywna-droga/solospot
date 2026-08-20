# TASK WF-HACP-STUDIO-G1-36 — TEST INVENTORY BASELINE

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**BASELINE COMMIT:** b16bbf7 (G1-35)

---

## Baseline State (verified Phase 0, prior to any G1-36 change)

### Vector + Rendering Suite
| Suite | Tests | PASS | FAIL | Notes |
|:---|:---:|:---:|:---:|:---|
| Vector domain (all `src/vector` + `src/rendering` files) | 482 | 479 | 3 | 3 = pre-existing baseline failures |
| G1-35 SVG Exporter | 38 | 38 | 0 | 15F / 12A / 8E2E / 3FI |
| G1-33 Marquee | 57 | 57 | 0 | committed |
| G1-34 Pen | 25 | 25 | 0 | committed |

### Pre-existing Baseline Failures (documented, NOT masked, NOT fixed — out of scope)
| File | Test | Root Cause (documented) |
|:---|:---|:---|
| `ShapeGrouping.test.ts` | groups multiple shapes into a ShapeGroupNode | stroke-bounds off-by-one: expected 10 got 9 |
| `ShapeGrouping.test.ts` | ungroups a ShapeGroupNode with relative transform restoration | stroke-bounds off-by-one: expected 20 got 19 |
| `ShapeTransform.test.ts` | aligns multiple shapes to left/center/right/top/middle/bottom | stroke-bounds off-by-one: expected 10 got 9 |

### Other Subsystems (untouched by G1-36)
| Suite | Tests | Result |
|:---|:---:|:---|
| Scene + Camera + Viewport + Guides + Selection + Navigation + Interaction | 112 | 112 PASS |
| Camera + Viewport (Candidate A infrastructure) | 35 | 35 PASS |

### Baseline Working-Tree Condition (pre-existing, out of scope)
- ~150 modified/untracked files unrelated to G1-36 (docs, inspector, ui, many Shape*/Vector* tests,
  S11 executor files `RendererCommand.ts` / `CanvasRenderer.ts` / `CanvasRenderSurface.ts` /
  `VectorDocumentSerializer.ts`, etc.).
- Only `VectorRenderingBridge.ts` is tracked in `src/rendering/`; the rest of the S18 executor stack
  has no committed baseline (repo precedent: G-sprints commit only the tracked bridge + tests).

— END OF TEST INVENTORY BASELINE —