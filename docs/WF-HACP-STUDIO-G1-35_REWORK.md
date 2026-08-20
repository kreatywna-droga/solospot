# TASK WF-HACP-STUDIO-G1-35 — REWORK LOG

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE

---

## 1. REWORK ITEMS

| ID | Item | Root cause | Action | Result |
|:---|:---|:---|:---|:---|
| RW-01 | Draft FI test #1 failed at baseline | Malformed: `JSON.parse(JSON.stringify(state))` clones the full state (including `historyStack` methods, which JSON drops), producing a false mismatch | Rewrote to deep-clone the SNAPSHOT (`state.snapshot`) via `structuredClone` and assert zero residual mutation of `snapshot` | PASS |
| RW-02 | Corrupted-node FI test threw | Original test injected `undefined` transform, but exporter was not yet null-safe | Added `DEFAULT_TRANSFORM_FALLBACK` + null-guards in `getTransformAttribute`/`renderNode`; test now asserts graceful degradation | PASS |
| RW-03 | Cycle detection stack overflow | Recursive `renderNode` without ancestor guard | Added `ancestors: Set<string>` cycle detection throwing controlled `Error("circular group reference detected")`; test asserts `/circular group reference/i` | PASS |
| RW-04 | `buildDefs` recursion could loop on cyclic gradient refs | Unbounded traversal of gradient definitions | Added visited-set guard in `buildDefs`; duplicate-id dedup | PASS |
| RW-05 | Group double-translation bug | Exporting group transform onto children contradicts the absolute-coordinate domain model | Group is now an opacity/visibility container; children keep absolute transforms (matches `VectorRenderingBridge`); E2E test 8 added | PASS |
| RW-06 | G1-33 suite failed to LOAD | `import ... from 'bun:test'` incompatible with vitest | Import changed to `'vitest'` (necessary compatibility; zero test-semantics change) | PASS (57/57) |

## 2. REVERTS

None. No implementation was rolled back.

## 3. OPEN ITEMS

- 3 pre-existing ShapeGrouping/ShapeTransform baseline failures remain UNFIXED (out of scope, documented).
  Their root cause (stroke-bounds expansion) is noted for a future sprint if the Architect authorizes
  legacy-test reconciliation.

## 4. VERDICT: REWORK COMPLETE — no open G1-35 items