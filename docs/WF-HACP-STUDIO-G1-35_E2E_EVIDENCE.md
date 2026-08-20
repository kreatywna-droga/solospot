# TASK WF-HACP-STUDIO-G1-35 — E2E EVIDENCE

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**TEST RUNNER:** Vitest (`npx vitest run`)

---

## 1. E2E WORKFLOW INVENTORY (8 workflows — requirement ≥5)

| # | Workflow | Assertion Summary | PASS |
|:---|:---|:---|:---|
| 1 | Create document → add rectangle+ellipse+line → export | SVG contains `<rect>`, `<ellipse>`, `<line>` | ✅ |
| 2 | Selection modification does not affect export output | `export(svg1) === export(svg2)` for different `selectedIds` | ✅ |
| 3 | Visibility toggle hides shapes from export | visible rect present; `visible:false` rect absent | ✅ |
| 4 | Grouping nodes exports as nested SVG | `<g>` contains both child ids | ✅ |
| 5 | Layer reordering affects SVG render order | id positions swap with node order | ✅ |
| 6 | **Serialize → restore → export roundtrip fidelity** | `serializeVectorDocument` → `restoreVectorDocument` → export → `svg2 === svg1` (byte-identical) | ✅ |
| 7 | **Persist gradient document → restore → export gradient intact** | `<linearGradient>`, `url(#r1_fill)`, `stop-color="red"` survive roundtrip | ✅ |
| 8 | **Group export does not double-apply group transform** | group at (10,20) + child at (10,20) → output contains `translate(10, 20)` and NOT `translate(20, 40)` | ✅ |

## 2. EXECUTION EVIDENCE

```
npx vitest run packages/authoring-studio/src/vector/__tests__/VectorSvgExporterG135.test.ts
  → Test Files 1 passed (1)
  → Tests 38 passed (38)
```

E2E count = 8 (subset of the 38). Document Persistence vertical slice (workflows 6–8) is covered.

## 3. VERDICT: PASS (8/8 E2E workflows; requirement ≥5)