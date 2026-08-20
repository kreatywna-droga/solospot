# TASK WF-HACP-STUDIO-G1-35 — TEST INVENTORY FINAL

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**TEST RUNNER:** Vitest (`npx vitest run`)
**DATE:** 2026-08-20

---

## 1. G1-35 VERTICAL SLICE TEST SUITE (VectorSvgExporterG135.test.ts)

| Category | Required | Delivered | PASS |
|:---|:---:|:---:|:---:|
| Feature Tests | ≥15 | 15 | 15 |
| Adversarial Scenarios | ≥12 | 12 | 12 |
| E2E Workflows | ≥5 | 8 | 8 |
| Failure Injection | ≥3 | 3 | 3 |
| **TOTAL** | | **38** | **38/38 PASS** |

## 2. FINAL PHYSICAL STATE — ALL SUITES

### Vector (24 files, 482 tests)
| Test File | Tests | Status |
|:---|:---:|:---|
| VectorSvgExporterG135.test.ts | 38 | **38/38 PASS** (NEW G1-35) |
| VectorMarqueeSelectionG133.test.ts | 57 | **57/57 PASS** (compat fix applied) |
| ShapeGrouping.test.ts | 3 | 1 PASS / **2 pre-existing baseline failures** |
| ShapeTransform.test.ts | 2 | 1 PASS / **1 pre-existing baseline failure** |
| VectorPathPenG134.test.ts | 25 | PASS |
| Other 19 vector files | 357 | PASS |
| **Vector total** | **482** | **479 PASS / 3 documented baseline failures** |

### Camera + Viewport
| Suite | Test files | Tests | Status |
|:---|:---:|:---:|:---|
| `src/camera` + `src/viewport-preview` | 16 | 35 | **35 PASS** |

### Combined (vector + camera + viewport)
**517 tests → 514 PASS → 3 documented pre-existing baseline failures.**

## 3. DELTA SUMMARY

| Metric | Value |
|:---|:---|
| ADDED_TESTS (G1-35) | 38 |
| PASS_TO_FAIL | 0 |
| FAIL_TO_PASS | 4 (G133 suite load-fail → 57 PASS; G135 FI #1 → PASS) |
| REMOVED_TESTS | 0 |
| NEW_UNAUTHORIZED_FAILURES | 0 |
| PRE-EXISTING BASELINE FAILURES | 3 (documented, unchanged, unsuppressed) |

## 4. SUPPRESSION AUDIT

`grep` for `test.skip|it.skip|test.only|describe.skip|@ts-ignore|@ts-expect-error|@ts-nocheck` in the
G1-35 vector scope: **0 hits**. No suppressions introduced.