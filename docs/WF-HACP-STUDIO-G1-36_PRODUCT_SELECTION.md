# TASK WF-HACP-STUDIO-G1-36 — PRODUCT SELECTION

**TASK ID:** WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**BASELINE:** b16bbf7 (G1-35)

---

## 1. Discovery Summary

Phase 1–2 discovered that the repo runs TWO parallel, non-integrated stacks:
- **Scene stack (S19–S23):** scene / camera / guides / selection / navigation / interaction /
  viewport-preview — operates on `Scene`/`Camera`/`BuilderDocument`; **zero `Vector` integration**.
- **Vector stack (S18 / G1-26…G1-35):** `VectorDocumentSnapshot` is SSOT; no camera, no snapping.

Physical defect found in `VectorRenderingBridge.ts` (tracked, baseline): `SET_TRANSFORM` matrix
hardcodes rotation/skew to 0 (lines 37-44); fill uses only `fill?.color` (no gradients); stroke drops
dashArray/lineJoin/miterLimit/dashOffset. The G1-35 SVG exporter handles all of these — so canvas
render ≠ exported SVG for rotated/skewed/dashed/gradient shapes.

## 2. Candidates (6, all physically evidenced)

| ID | Candidate | Evidence Basis | Impact | Size | Risk | Score |
|:---:|:---|:---|:---:|:---:|:---:|:---:|
| C-01 | **VectorRenderingBridge Transform & Stroke Fidelity** (parity with SVG exporter) | bridge hardcodes rot/skew=0; drops dash/join/miter/gradients | High | S | Low | **5.00** |
| C-02 | Vector Zoom / Pan (camera controls on vector canvas) | no camera integration in vector stack; Scene stack has camera | Med | L | Med | 3.70 |
| C-03 | Vector Snapping (edge/center/angle) | no snapping in vector stack; guides exist in Scene stack | Med | M | Med | 3.95 |
| C-04 | Boolean CSG (union/intersect/difference) | VectorBooleanEngine exists but untracked/immature | High | L | High | 3.40 |
| C-05 | Align-to-artboard / distribute | editor ops missing; transforms already present | Low | M | Low | 2.55 |
| C-06 | Skew UI operation | transform model supports skew; no UI/controller path | Low | S | Low | 2.25 |

## 3. Selection Decision

**SELECTED CANDIDATE-01: VectorRenderingBridge Transform & Stroke Fidelity (Rendering Parity with
VectorSvgExporter).**

### Selection Reason
- Highest score (5.00) and the ONLY candidate addressing a **correctness defect affecting every
  prior workflow** (drag, marquee, pen, boolean, export) — high value at minimal size/risk.
- Zero dependency risk: confined to the tracked bridge + additive optional DTO fields + a new test
  suite; SSOT, history, serialization, and UI untouched.
- Directly continues G1-35 (exporter) by making the on-canvas compiler match the export reference.
- Independence from Scene stack (camera/snapping candidates) keeps G1-36 safely headless.

### Scoring Model
Score = 0.35·Impact + 0.25·(1/Risk) + 0.20·(1/Size) + 0.20·Coherence — normalized to 0-5.
C-01: impact 5, risk 1 (low), size 5 (small), coherence 5 → 5.00.

## 4. Task ID Authority

Task ID: **WF-HACP-STUDIO-G1-36-VECTOR-RENDERING-FIDELITY** — derived from the selected candidate
name, matching the G1-35 `WF-HACP-STUDIO-G1-35` naming convention.

— END OF PRODUCT SELECTION —