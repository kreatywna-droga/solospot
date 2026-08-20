# TASK WF-HACP-STUDIO-G1-36 — TASK GRAPH

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## Dependency Graph

```
b16bbf7 (G1-35)                          # committed baseline, verified
   │
   ├── Phase 0  Baseline verification ────────────┐
   ├── Phase 1  Roadmap & product discovery ──────┤
   ├── Phase 2  Candidate discovery (6 candidates) │
   ├── Phase 3  Selection (C-01, score 5.00) ─────┤
   ├── Phase 4  Contract (PLAN + PRODUCT_SELECTION)│
   ├── Phase 5  Implementation
   │            ├─ RendererCommand.ts  (additive optional fields + GradientFillDTO)
   │            ├─ VectorRenderingBridge.ts  (buildAffineTransform / fillFields / strokeFields / hardening)
   │            └─ CanvasRenderer.ts    (guarded consumption — working tree, uncommitted per precedent)
   ├── Phase 6  Testing
   │            └─ VectorRenderingFidelityG136.test.ts  (16F / 7E2E / 16A / 3FI)
   ├── Phase 7  Regression (vector+rendering 535: 532P/3F-baseline; G133/134/135 120P; scene+camera 112P)
   ├── Phase 8  Rework (1 fix: gradient-stop filter hardening)
   ├── Phase 9  Failure injection (3/3 PASS)
   ├── Phase 10 Independent audit (APPROVE — 8/8 PASS)
   ├── Phase 11 B13 (COMMIT)
   └── Phase 12 Commit + post-commit verification
        └── docs/WF-HACP-STUDIO-G1-36_*.md (18 artifacts)
```

## Work Breakdown

| Work Item | Depends On | Effort | Status |
|:---|:---|:---:|:---:|
| Baseline verify | b16bbf7 | S | DONE |
| Discovery (roadmap + code) | — | M | DONE |
| Candidate discovery | — | M | DONE |
| Selection C-01 | — | S | DONE |
| PLAN + PRODUCT_SELECTION | Selection | S | DONE |
| RendererCommand extension | — | S | DONE |
| Bridge rewrite | RendererCommand | M | DONE |
| CanvasRenderer consumption | Bridge | S | DONE |
| G136 test suite | Bridge | M | DONE |
| Regression run | Tests | M | DONE |
| Rework (stop filter) | Regression | S | DONE |
| FI verification | Tests | S | DONE |
| Independent audit | All | M | DONE |
| B13 ratification | Audit | S | DONE |
| Selective commit | B13 | S | DONE |
| Post-commit verification | Commit | S | DONE |
| 18 governance docs | All | M | DONE |

## Critical Path

Selection → PLAN → RendererCommand → Bridge → Tests → Regression → Rework → Audit → B13 → Commit → Docs

— END OF TASK GRAPH —