# TASK WF-HACP-STUDIO-G1-36 — TEST INVENTORY FINAL

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## Final Physical State (after G1-36 changes)

### New G1-36 Suite — `packages/authoring-studio/src/vector/__tests__/VectorRenderingFidelityG136.test.ts`
| Category | Requirement | Actual | Status |
|:---|:---:|:---:|:---:|
| Feature tests | ≥15 | 16 | PASS |
| E2E workflows | ≥7 | 7 | PASS |
| Adversarial scenarios | ≥15 | 16 | PASS |
| Failure injection | ≥3 | 3 | PASS |
| **Total** | — | **42** | **42/42 PASS** |

### Regression — Full Vector + Rendering
| Suite | Tests | PASS | FAIL | Notes |
|:---|:---:|:---:|:---:|:---|
| Vector + Rendering (31 files incl. G136) | 535 | 532 | 3 | FAIL = exactly the 3 pre-existing baseline failures |
| G1-33 / G1-34 / G1-35 committed suites | 120 | 120 | 0 | 57 / 25 / 38 |
| Pre-existing rendering + vector-integration tests | 82 | 82 | 0 | ShapeRendering, CanvasRenderer, VectorIntegration, VectorDocumentLifecycle, VectorWorkspaceProductFlow |
| Scene + Camera + Viewport + Guides + Selection + Navigation + Interaction | 112 | 112 | 0 | untouched by G1-36 |
| Camera + Viewport (Candidate A infra) | 35 | 35 | 0 | untouched |

### Governance Metrics
| Metric | Value |
|:---|:---|
| PASS_TO_FAIL | 0 (no previously-passing test now fails) |
| REMOVED_TESTS | 0 |
| NEW_UNAUTHORIZED_FAILURES | 0 |
| Suppressions (`skip/only/ts-ignore/ts-expect-error/ts-nocheck`) | 0 |
| FAIL_TO_PASS | 0 (no baseline failure fixed — out of scope, correctly left failing) |

### Pre-existing Baseline Failures (unchanged, documented, unsuppressed)
| File | Tests | Status |
|:---|:---:|:---|
| ShapeGrouping | 2 | FAIL (baseline, stroke-bounds off-by-one) |
| ShapeTransform | 1 | FAIL (baseline, stroke-bounds off-by-one) |

— END OF TEST INVENTORY FINAL —