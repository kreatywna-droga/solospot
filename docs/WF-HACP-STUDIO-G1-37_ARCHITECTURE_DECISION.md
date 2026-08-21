# TASK WF-HACP-STUDIO-G1-37 — ARCHITECTURE DECISION LOG

**TASK ID:** WF-HACP-STUDIO-G1-37-VECTOR-VIEWPORT-CONTROLLER
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-37 — Vector Viewport & Camera Controller

---

## Decision ADR-G1-37-01 — Transient Presentation Viewport vs Immutable SSOT Document

### Context
Authoring Studio requires canvas navigation (zoom, pan, fit-to-selection) for vector editing. Two architectural approaches were evaluated:
1. **Option A (MUTATION):** Storing canvas zoom and pan directly inside `VectorDocumentSnapshot` or node transforms.
2. **Option B (PROJECTION - CHOSEN):** Treating `VectorViewportState` as a pure, transient presentation projection state separate from the immutable document SSOT (`VectorDocumentSnapshot`).

### Decision
Option B is selected.
- `VectorDocumentSnapshot` remains the single source of truth (SSOT) for node geometry in canvas space (0,0 document origin).
- `VectorViewportState` is an immutable, read-only presentation projection snapshot (`zoom`, `panX`, `panY`, `viewportWidth`, `viewportHeight`).
- Pure viewport actions (zoom in/out, pan, fit-to-screen) mutate ONLY `VectorViewportState`.
- Pure viewport actions DO NOT mutate `VectorDocumentSnapshot` and DO NOT push entries onto `HistoryStack`.
- `VectorSvgExporter` operates directly on `VectorDocumentSnapshot` in document canvas space, guaranteeing 100% viewport-agnostic exports.

### Matrix Composition Formula
In `VectorRenderingBridge.ts`, the combined affine transform matrix $T_{combined}$ is computed as:
$$T_{combined} = T_{viewport} \cdot T_{node}$$
Where $T_{viewport} = \begin{pmatrix} zoom & 0 & panX \\ 0 & zoom & panY \\ 0 & 0 & 1 \end{pmatrix}$ and $T_{node}$ is the node's affine transform.

---

— END OF ARCHITECTURE DECISION LOG —
