# TASK WF-HACP-STUDIO-G1-35 — ADVERSARIAL EVIDENCE

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE

---

## 1. ADVERSARIAL SCENARIO INVENTORY (12 scenarios — requirement ≥12)

| # | Scenario | Expected | Actual | PASS |
|:---|:---|:---|:---|:---|
| 1 | Empty transform `{}` | export succeeds, no transform attribute | `transform=""` omitted | ✅ |
| 2 | Missing fill on rect | no crash; default fill not emitted | fill attr omitted | ✅ |
| 3 | Extreme coordinates (1e9) | valid SVG, no overflow/exception | emitted | ✅ |
| 4 | Negative dimensions | absolute value used (no invalid SVG) | `width=abs` | ✅ |
| 5 | Deeply nested groups | controlled depth, valid `<g>` nesting | emitted | ✅ |
| 6 | Duplicate gradient id across nodes | single `<defs>` entry (dedup) | one def | ✅ |
| 7 | Gradient stops missing offset/color | stops filtered/skipped, no crash | skipped | ✅ |
| 8 | Missing stroke | stroke attr omitted, no crash | emitted w/o stroke | ✅ |
| 9 | Zero stroke width | exported with `stroke-width="0"` | emitted | ✅ |
| 10 | Group with all children invisible | empty `<g>` or omitted; no crash | omitted | ✅ |
| 11 | Invalid shape type | handled gracefully (return empty), no throw | empty | ✅ |
| 12 | Empty path `d` | `d=""` handled, no crash | emitted | ✅ |

## 2. EXECUTION EVIDENCE

All 12 adversarial scenarios are sub-tests of `VectorSvgExporterG135.test.ts`, executed within the
single suite run:

```
npx vitest run packages/authoring-studio/src/vector/__tests__/VectorSvgExporterG135.test.ts
  → Tests 38 passed (38)
```

Count verified by verbose reporter: 12 "Adversarial Scenarios" tests, all ✓.

## 3. VERDICT: PASS (12/12 adversarial scenarios; requirement ≥12)