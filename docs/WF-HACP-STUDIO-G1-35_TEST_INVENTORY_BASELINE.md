# TASK WF-HACP-STUDIO-G1-35 — TEST INVENTORY BASELINE

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**TEST RUNNER:** Vitest (`npx vitest run`)
**DATE:** 2026-08-20

---

## 1. PHYSICAL BASELINE (commit `c066708`, G1-34)

Forensic recovery note: G1-34's report claimed **441/444 PASS**. Physical verification at `c066708`
shows **422 vector tests, 418 PASS, 4 failures** (incl. 1 suite LOAD failure). Report numbers are not
trusted; the physical run is authoritative.

### Vector test files — physical baseline
| Test File | Tests | Status |
|:---|:---:|:---|
| VectorMarqueeSelectionG133.test.ts | 57 | **FAILED TO LOAD** (`bun:test` import, incompatible with vitest) |
| ShapeGrouping.test.ts | 3 | 1 PASS / 2 FAIL (stroke-bounds off-by-one) |
| ShapeTransform.test.ts | 2 | 1 PASS / 1 FAIL (stroke-bounds off-by-one) |
| VectorPathPenG134.test.ts | 25 | PASS |
| VectorSvgExporterG135.test.ts | 35 | 34 PASS / 1 FAIL (malformed failure-injection test) |
| Other 19 vector test files | 300 | PASS |
| **Vector total (physical)** | **422** | **418 PASS / 4 fail** |

### Camera + Viewport (Candidate A infrastructure)
| Suite | Test files | Tests | Status |
|:---|:---:|:---:|:---|
| `src/camera` + `src/viewport-preview` | 16 | 35 | **35 PASS** |

## 2. BASELINE FAILURE ROOT CAUSES

| Failure | Root cause | Classification |
|:---|:---|:---|
| G133 load failure | `import { describe, it, expect, beforeEach } from 'bun:test'` — vitest cannot resolve `bun:test` | Pre-existing defect (necessary-compatibility fix planned) |
| ShapeGrouping ×2 | tests assert raw geometry (10/20); `computeBoundingBox` now stroke-expands by `stroke.width/2` (default stroke 2 → ±1) | Pre-existing baseline failure, acknowledged in G1-34 `TEST_INVENTORY_FINAL` ("Other Vector Tests 116|113|3") |
| ShapeTransform ×1 | same stroke-bounds expansion (10 vs 9) | Pre-existing baseline failure, acknowledged in G1-34 |
| G135 FI test #1 | malformed test: `JSON.parse(JSON.stringify(state))` clone compared to state containing `historyStack` methods (functions are dropped by JSON) | Draft test defect — fixed in G1-35 |

## 3. G1-35 ADDITIONS (in G1-35 scope)

| File | Added | Baseline→Final |
|:---|:---|:---|
| VectorSvgExporterG135.test.ts | +3 E2E (persistence roundtrips) | 35 → 38 tests |
| VectorMarqueeSelectionG133.test.ts | 0 (import only: `bun:test`→`vitest`) | load-fail → 57 tests counted |