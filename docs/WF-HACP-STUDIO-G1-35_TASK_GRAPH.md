# TASK WF-HACP-STUDIO-G1-35 — TASK GRAPH

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE

---

## 1. GRAPH (Topological Order)

```
T1 Phase 1 Discovery
 └─> T2 Phase 2 Candidate Evaluation
      └─> T3 Selection (Candidate B) + Contract
           └─> T4 Harden VectorSvgExporter
                ├─> T5 Null-safety & cycle detection
                └─> T6 Group transform fix
                     └─> T7 Complete G135 test suite (38 tests)
                          ├─> T8 Fix malformed FI test #1 (state clone)
                          ├─> T9 Add persistence roundtrip E2E (×3)
                          └─> T10 G1-33 compat fix (bun:test → vitest)
                               └─> T11 Barrel integration (index.ts)
                                    └─> T12 Full regression (vector+camera+viewport)
                                         └─> T13 18 governance artifacts
                                              └─> T14 Independent audit + B13
                                                   └─> T15 Selective commit + post-commit verify
                                                        └─> T16 FINAL_REPORT (CONTROLLED_STOP)
```

## 2. NODE STATUS

| Node | Description | Status | Evidence |
|:---|:---|:---|:---|
| T1 | Physical baseline discovery | DONE | `_TEST_INVENTORY_BASELINE.md` |
| T2 | Candidate evaluation | DONE | `_PRODUCT_SELECTION.md` |
| T3 | Selection + contract | DONE | `_PLAN.md` |
| T4–T6 | Exporter hardening | DONE | `VectorSvgExporter.ts` |
| T7–T9 | Test suite completion | DONE | `VectorSvgExporterG135.test.ts` (38/38) |
| T10 | G1-33 compat | DONE | `VectorMarqueeSelectionG133.test.ts` (57/57) |
| T11 | Barrel integration | DONE | `vector/index.ts` |
| T12 | Full regression | DONE | `_TEST_INVENTORY_FINAL.md`, `_REGRESSION_RECONCILIATION.md` |
| T13 | 18 artifacts | DONE | this suite |
| T14 | Audit + B13 | DONE | `_AUDIT.md` |
| T15 | Commit + verify | DONE | git log + `_EVIDENCE.md` |
| T16 | Final report | DONE | `_FINAL_REPORT.md` |

## 3. DEPENDENCIES

- `VectorSvgExporter` depends on `VectorGeometry` (polygonGeometry, committed G1-34) and
  `VectorDomainModel` (committed G1-34).
- `VectorDocumentSerializer` (G1-29, untracked) is consumed read-only for roundtrip E2E.
- `HistoryStack` (builder-core) is untouched; exporter never writes to it.