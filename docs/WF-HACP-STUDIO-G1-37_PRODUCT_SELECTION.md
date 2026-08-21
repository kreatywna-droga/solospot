# TASK WF-HACP-STUDIO-G1-37 — PRODUCT SELECTION

**TASK ID:** WF-HACP-STUDIO-G1-37-VECTOR-VIEWPORT-CONTROLLER
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**BASELINE:** `1de4518` (G1-36)

---

## 1. Discovery Summary

Phase 1 discovered 5 real candidate improvements from the physical repository:

1. **Candidate A: Vector Viewport & Camera Controller** (Zoom, Pan, Focal Zoom, Fit-to-Bounds, Viewport Projection).
2. **Candidate B: Vector Canvas / Artboard Alignment & Custom Gap Distribution Engine**.
3. **Candidate C: Vector Snapping & Smart Guides Alignment Engine**.
4. **Candidate D: Vector CSG Compound Path Clipper Expansion**.
5. **Candidate E: Vector Transform Matrix Skew & Shear Controller Actions**.

## 2. Candidates Matrix & Scoring

| Candidate ID | Name | Impact | Risk | Size | Coherence | Score |
|:---:|:---|:---:|:---:|:---:|:---:|:---:|
| **Candidate A** | **Vector Viewport & Camera Controller** | High | Low | Medium | High | **4.85** |
| Candidate B | Vector Canvas Alignment & Spacing | High | Low | Medium | Med | 4.60 |
| Candidate C | Vector Snapping & Smart Guides | Med | Med | Large | Med | 4.30 |
| Candidate D | Vector CSG Compound Path Clipper | High | High | Large | Med | 4.10 |
| Candidate E | Vector Skew & Shear Controller | Low | Low | Small | Low | 3.80 |

## 3. Selection Decision & Rationale

**SELECTED CANDIDATE A: Vector Viewport & Camera Controller.**

- **Rationale:** Highest overall score (4.85). Following G1-36 (rendering bridge affine transform fidelity), viewport camera zoom/pan is the single most critical navigation feature needed to interact with complex vector documents.
- **Architectural Harmony:** Viewport state is held as an immutable presentation projection (`VectorViewportState`), keeping document SSOT (`VectorDocumentSnapshot`) 100% clean and viewport-agnostic.

---

— END OF PRODUCT SELECTION —
