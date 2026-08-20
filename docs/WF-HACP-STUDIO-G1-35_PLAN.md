# TASK WF-HACP-STUDIO-G1-35 — PLAN & CONTRACT

**TASK ID:** WF-HACP-STUDIO-G1-35
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING

---

## 1. FEATURE CONTRACT — SVG EXPORTER & DOCUMENT PERSISTENCE VERTICAL SLICE

### 1.1 Deliverable
A pure, headless SVG Exporter (`VectorSvgExporter`) that converts a `VectorDocumentSnapshot` into a
valid SVG string, integrated with the Vector barrel and verified against a persistence roundtrip.

### 1.2 Required Capabilities
| ID | Capability | Physical Contract |
|:---|:---|:---|
| F1 | Valid SVG shell | `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 W H">` … `</svg>` |
| F2 | Rectangle export | `<rect x y width height rx ry>` with fill/stroke/transform |
| F3 | Ellipse export | `<ellipse cx cy rx ry>` |
| F4 | Line export | `<line x1 y1 x2 y2>` with local-coordinate transform |
| F5 | Polygon export | `<polygon points="...">` via `VectorGeometry.polygonGeometry` |
| F6 | Path export | `<path d="...">` (G1-34 pen tool collaboration) |
| F7 | Group export | `<g>` container; children keep ABSOLUTE transforms (no double-translate) |
| F8 | Gradient defs | `<linearGradient>` / `<radialGradient>` deduplicated in `<defs>`; `url(#id_fill)` references |
| F9 | Stroke attributes | width, color, opacity, linecap, linejoin, miterlimit, dasharray, dashoffset |
| F10 | Node/fill opacity | `opacity`, `fill-opacity`, `stroke-opacity` |
| F11 | Transform attribute | translate / rotate(center) / scale / skewX / skewY |
| F12 | Visibility filter | invisible nodes omitted from output |
| F13 | Persistence roundtrip | serialize → restore → export produces identical SVG (collaboration with G1-29 serializer) |

### 1.3 Robustness Contract (Adversarial + Failure Injection)
| ID | Contract |
|:---|:---|
| R1 | Corrupted node (missing transform/fill/stroke/sides/d) never crashes the exporter |
| R2 | Circular group reference throws a CONTROLLED error (no stack overflow) |
| R3 | Zero residual mutation: exporter never mutates the input snapshot |
| R4 | Extreme / negative / zero dimensions handled without exception |

### 1.4 Test Mandate
- ≥15 feature tests — **DELIVERED: 15**
- ≥5 E2E workflows — **DELIVERED: 8** (incl. 3 Document-Persistence roundtrips)
- ≥12 adversarial scenarios — **DELIVERED: 12**
- ≥3 failure injection points with rollback verification — **DELIVERED: 3**

## 2. WORK PLAN

| Step | Action | Status |
|:---|:---|:---|
| 1 | Physical discovery baseline (git, test inventory, subsystems) | DONE |
| 2 | Candidate evaluation & selection (evidence-driven) | DONE → Candidate B |
| 3 | Harden `VectorSvgExporter.ts` (null-safety, cycle detection, group transform fix) | DONE |
| 4 | Complete `VectorSvgExporterG135.test.ts` (fix malformed FI test, add persistence E2E) | DONE → 38 tests |
| 5 | G1-33 compatibility fix (`bun:test` → `vitest`) | DONE |
| 6 | Barrel integration (`index.ts` exports serializer + exporter) | DONE |
| 7 | Full regression (vector + camera + viewport-preview + builder-core) | DONE |
| 8 | 18 mandatory governance artifacts | DONE |
| 9 | Independent read-only audit + B13 verdict | DONE |
| 10 | Selective commit (G1-35 scope only) + post-commit verification | DONE |

## 3. SCOPE BOUNDARY

IN: `VectorSvgExporter.ts`, `VectorSvgExporterG135.test.ts`, `index.ts` (additive exports),
`VectorMarqueeSelectionG133.test.ts` (import-only compatibility fix), 18 docs.

OUT: Candidate A, media export subsystem, G1-34 engine/geometry behavior, G1-36 auto-start.