# TASK WF-HACP-STUDIO-G1-36 — FAILURE INJECTION

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## Failure Injection Cases (3/3 PASS, ≥3 required)

Controlled failures are injected at the compiler boundary and the matrix boundary to prove the
compiler is crash-proof and side-effect-free.

| # | Injection Point | Injection | Expected Recovery | Result |
|:---:|:---|:---|:---|:---:|
| 1 | State/boundary: corrupted node | node with `transform: null` (missing transform) | `buildRenderCommands` does NOT throw; returns `[]` | PASS |
| 2 | State: input mutation | full-featured rect node (transform + stroke + fill) | after compilation, `JSON.stringify(input)` is byte-identical (zero residual mutation) | PASS |
| 3 | Matrix boundary | rotation = 270° about center of 100×100 rect at origin | matrix `[~0,-1,1,~0,~0,100]` — local origin (0,0) maps to (0,100); no drift/NaN | PASS |

## Verification Method

- FI-1: assert `expect(() => buildRenderCommands(corrupted)).not.toThrow()` then assert `toEqual([])`.
- FI-2: snapshot input via `JSON.stringify` before/after compilation and assert equality (immutability contract).
- FI-3: symbolic derivation of rotate(270, 50, 50) mapping (0,0)→(0,100), asserted with eps=0.001.

## Result

All 3 injected failures were contained: the compiler returned safe outputs, produced no side effects,
and produced mathematically exact matrices at the rotation boundary.

— END OF FAILURE INJECTION —