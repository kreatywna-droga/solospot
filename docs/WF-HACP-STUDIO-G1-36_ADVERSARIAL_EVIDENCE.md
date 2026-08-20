# TASK WF-HACP-STUDIO-G1-36 — ADVERSARIAL EVIDENCE

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## Adversarial Scenarios (16/16 PASS, ≥15 required)

All scenarios inject invalid/corrupt input or boundary conditions distinct from happy-path tests.

| # | Scenario | Input | Expected Guard Behavior | Result |
|:---:|:---|:---|:---|:---:|
| 1 | null node | `null` | returns `[]` without throwing | PASS |
| 2 | missing transform | node without transform | returns `[]` without throwing | PASS |
| 3 | invisible node | `visible: false` | returns `[]` | PASS |
| 4 | zero opacity node | `opacity: 0` | returns `[]` | PASS |
| 5 | NaN rotation | `rotationDeg: NaN` | finite matrix (coerced) | PASS |
| 6 | Infinity scale | `scaleX: Infinity` | finite matrix (coerced) | PASS |
| 7 | zero dimensions | width=0, height=0 | valid draw with 0 bounds | PASS |
| 8 | missing fill | `fill: undefined` | no fillStyle, no crash | PASS |
| 9 | fill type none | `fill.type = 'none'` | no fillStyle emitted | PASS |
| 10 | gradient, empty stops | `gradientStops: []` | no fillGradient; solid fallback color used | PASS |
| 11 | gradient, NaN/null/empty stops | stops with NaN offset, null entry, empty color | filtered to valid stops only | PASS |
| 12 | missing stroke | `stroke: undefined` | no strokeStyle, no crash | PASS |
| 13 | zero stroke width | `width: 0` | no strokeStyle emitted | PASS |
| 14 | dashArray with NaN | `[4, NaN, 2]` | filtered to `[4, 2]` | PASS |
| 15 | empty group | `children: []` | SAVE/RESTORE only, no throw | PASS |
| 16 | empty path d | `d: ''` | valid DRAW_PATH with empty d | PASS |

## Robustness Guarantees Exercised

- The compiler never throws on malformed input (guard-first design).
- The compiler never emits a non-finite matrix (NaN/Infinity coercion at the boundary).
- Optional fields only emitted when data is valid (no empty/`NaN`/null leakage into DTOs).

— END OF ADVERSARIAL EVIDENCE —