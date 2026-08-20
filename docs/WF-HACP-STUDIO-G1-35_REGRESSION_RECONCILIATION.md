# TASK WF-HACP-STUDIO-G1-35 — REGRESSION RECONCILIATION

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE

---

## 1. RECONCILIATION TABLE

| Dimension | Baseline (physical, c066708) | Final (G1-35) | Delta | Verdict |
|:---|:---|:---|:---|:---|
| Vector tests run | 422 | 482 | +60 (G133 suite now loads: +57; G135 E2E: +3) | ADDED |
| Vector PASS | 418 | 479 | +61 | PASS |
| Vector FAIL | 4 (1 suite-load + 3 shape) | 3 (3 shape) | −1 (G133 load-fail fixed) | FAIL_TO_PASS |
| Camera+Viewport | 35 PASS | 35 PASS | 0 | PASS |
| Combined | 457 tests / 453 PASS / 4 fail | 517 tests / 514 PASS / 3 fail | +60 tests / +61 PASS / −1 fail | PASS |

## 2. PRE-EXISTING BASELINE FAILURES (3) — NOT REGRESSIONS

The 3 ShapeGrouping/ShapeTransform failures are acknowledged in G1-34's OWN `TEST_INVENTORY_FINAL`
("Other Vector Tests (14 files) | 116 | 113 | 3"). They were failing before G1-35 and remain unchanged:

| Failure | Root cause | Why untouched |
|:---|:---|:---|
| ShapeGrouping: expected 10, got 9 | `computeBoundingBox` stroke-expands by `width/2` (default stroke 2 → ±1) | Failing at baseline; not in G1-35 scope; reconciling silently would violate zero-suppression |
| ShapeGrouping: expected 20, got 19 | same stroke-bounds expansion | same |
| ShapeTransform: expected 10, got 9 | same stroke-bounds expansion | same |

PASS_TO_FAIL = 0: no test that passed at baseline fails at final. These 3 were ALREADY failing.

## 3. PASS_TO_FAIL / REMOVED_TESTS PROOF

```
PASS_TO_FAIL   = 0    (every baseline-passing test still passes at final)
REMOVED_TESTS  = 0    (no it()/test() removed anywhere; G135 grew 35→38)
NEW_FAILURES   = 0    (all final failures pre-date G1-35)
```

## 4. VERDICT: RECONCILED — green apart from 3 documented pre-existing baseline failures