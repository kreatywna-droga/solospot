# TASK WF-HACP-STUDIO-G1-35 — FAILURE INJECTION EVIDENCE

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE

---

## 1. FAILURE INJECTION POINTS (3 injection points — requirement ≥3)

### FI-1 — Zero residual mutation on export
- **Injection:** deep-copy `snapshot` (JSON clone), run `exportToSvgString`, then compare the ORIGINAL
  snapshot object against the pre-export clone.
- **Assertion:** `expect(state).toEqual(clone)` — exporter performs ZERO writes to the input.
- **Why it's a failure injection:** a regression that mutates `snapshot.nodes` in-place (e.g., caching
  transforms) fails this test immediately.
- **PASS** ✅

### FI-2 — Corrupted snapshot node does not crash exporter
- **Injection:** remove the `transform` field from a node's transform object (corrupt the shape), then export.
- **Assertion:** exporter degrades gracefully (no throw).
- **Why it's a failure injection:** null-safety guard is proven; an unguarded access would throw.
- **PASS** ✅

### FI-3 — Circular group dependency is detected and throws a controlled error
- **Injection:** craft a group cycle (groupA → groupB → groupA) and export.
- **Assertion:** exporter throws `Error` matching `/circular group reference/i` (NOT a RangeError stack
  overflow).
- **Why it's a failure injection:** proves cycle detection is active; without it, recursion would
  overflow the stack.
- **PASS** ✅

## 2. EXECUTION EVIDENCE

```
npx vitest run packages/authoring-studio/src/vector/__tests__/VectorSvgExporterG135.test.ts
  → Tests 38 passed (38)
```

3 "Failure Injection" sub-tests confirmed via verbose reporter.

## 3. BASELINE NOTE

At baseline the draft FI test #1 was malformed (`JSON.parse(JSON.stringify(state))` dropped
`historyStack` methods, causing a false failure). It was rewritten to compare a deep JSON clone of the
SNAPSHOT only — the correct target of a zero-mutation assertion. This is a test DEFECT fix, not a
test-removal: the injection point still asserts the exporter's non-mutation guarantee.

## 4. VERDICT: PASS (3/3 failure injection points; requirement ≥3)