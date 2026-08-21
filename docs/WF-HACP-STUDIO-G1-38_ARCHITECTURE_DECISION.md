# TASK WF-HACP-STUDIO-G1-38 — ARCHITECTURE DECISION LOG

**TASK ID:** WF-HACP-STUDIO-G1-38-VECTOR-ALIGNMENT-ENGINE
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING
**MILESTONE:** G1-38 — Vector Alignment Engine Expansion

---

## Decision ADR-G1-38-01 — Canvas Alignment & Grid Layout Model

### Context
Authoring Studio requires layout alignment and distribution primitives. Alignment can be relative to a multi-shape selection bounding box or relative to canvas/artboard bounds.

### Decision
1. `VectorDocumentSnapshot` remains the single source of truth (SSOT) for all node geometry.
2. `alignShapesToCanvas` computes target coordinates relative to explicit or default canvas bounds (`{ x: 0, y: 0, width: 1920, height: 1080 }`).
3. `distributeShapesWithGap` positions shapes sequentially along horizontal or vertical axes with explicit pixel gap spacing `gapPx`.
4. `arrangeShapesInGrid` places shapes in a structured multi-column grid layout.
5. All alignment and grid layout operations mutate shape `transform` DTOs in `VectorDocumentSnapshot` and record transactional history entries on `HistoryStack`.
6. Locked shapes are skipped during alignment and layout distribution operations.

---

— END OF ARCHITECTURE DECISION LOG —
