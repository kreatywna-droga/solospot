# TASK WF-HACP-STUDIO-G1-34 — TASK INTENT & CHARTER

**TASK ID:** WF-HACP-STUDIO-G1-34  
**PROGRAM:** WEB FACTOR AUTONOMOUS PRODUCT DEVELOPMENT  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**DOMAIN:** AUTHORING STUDIO / VECTOR EDITING  
**ROADMAP:** G1 — Authoring Studio Vector Editing  
**PARENT:** G1-33 — Canvas Marquee Rectangle Drag Selection (GAP-05)  
**GAP:** GAP-06  
**MISSION:** Path Pen Tool — Bezier Curve Drawing & Node Editing  

---

## 1. MISSION STATEMENT

Implement a professional Path Pen workflow supporting:
1. **Path Creation:** Pen tool activation, straight/Bezier anchor placement, live transient preview, finishing open paths, closing paths, and cancelling active drawing without document mutation.
2. **Bezier Geometry:** Cubic Bezier segments with anchor points, incoming/outgoing control handles, corner vs. smooth node types, and deterministic SVG path conversion.
3. **Node Editing:** Selecting nodes, moving anchors/handles, converting node types (corner/smooth), inserting nodes into existing segments, and deleting nodes while maintaining valid path topology.
4. **Selection Integration:** Full integration with existing `VectorWorkspaceState` selection system and zero regression of G1-33 marquee drag selection.
5. **Transactional History:** Live pointer movements do not pollute history; committed actions participate in `HistoryStack`; undo/redo perfectly restores path geometry.
6. **Serialization & Rendering:** Lossless document roundtrip through `VectorDocumentSerializer` and transient/committed rendering via `VectorRenderingBridge`.

---

## 2. KEY CONSTRAINTS & PRINCIPLES

1. **NO SECOND PARALLEL ARCHITECTURE:** Extend existing `VectorDomainModel`, `VectorGeometry`, `VectorEditingEngine`, `VectorWorkspaceController`, `VectorDocumentSerializer`, and `VectorRenderingBridge`.
2. **EDITOR vs RUNTIME SEPARATION:** Zero DOM, zero React, zero `requestAnimationFrame`, zero browser APIs in `packages/authoring-studio/src/vector`.
3. **ZERO SUPPRESSION POLICY:** `@ts-ignore`, `@ts-expect-error`, `test.skip`, `it.only` strictly forbidden.
4. **REGRESSION LAW:** `PASS → FAIL = 0`, `REMOVED_TESTS = 0`.
5. **CONTROLLED TERMINATION:** Execution finishes cleanly with `CONTROLLED_STOP`.
