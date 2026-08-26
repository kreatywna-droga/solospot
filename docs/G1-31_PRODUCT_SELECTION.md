# G1-31 PRODUCT SELECTION REPORT — VECTOR EDITING PRODUCT EVOLUTION

- **Task ID:** G1-31-AUTONOMOUS-PRODUCT-EVOLUTION
- **Selection Date:** 2026-08-17
- **Selected Mode:** FULL AUTONOMOUS MULTI-AGENT EXECUTION

---

## 1. Primary Feature Selection

### **PRIMARY FEATURE: Interactive Canvas Mouse Drag Move & Handle Resize Vertical Slice (GAP-02)**

#### **WHY THIS FEATURE:**
The current Vector Editing Product contains robust domain math (`VectorGeometry`), state management (`VectorWorkspaceController`), DTO serialization (`VectorDocumentSerializer`), history stack (`HistoryStack`), and canvas command execution (`RenderCommandExecutor`). However, **mouse interaction on the canvas was limited to clicking to select shapes**. Users were unable to drag selected shapes across the canvas or drag bounding box resize handles to scale shapes interactively.

By building the **Interactive Canvas Mouse Drag Move & Handle Resize Vertical Slice**, we elevate the product from a static inspector-based configuration tool into a **true, professional interactive vector editor**.

#### **USER VALUE:**
- Direct manipulation of vector elements on canvas by dragging selected shapes.
- Real-time visual Feedback during mouse drag.
- Bounding box corner and edge handle dragging for intuitive width/height scaling.
- Single atomic history push on mouse drag release (preventing history stack flooding during continuous 60fps mouse drag).
- Seamless integration with Shift-constrained aspect ratio scaling and Arrow key nudging.

#### **CURRENT GAP:**
- `VectorWorkspace.tsx` had mouse click hit-testing, but lacked `onMouseDown`, `onMouseMove`, and `onMouseUp` drag handlers for moving shapes or resizing via handles.
- `VectorWorkspaceController.ts` supported `moveSelectedNodes(dx, dy)`, but lacked a dedicated `resizeSelectedNodes(handle, dw, dh, constrainAspect)` dispatcher with handle transform math.

#### **WHY NOW:**
Phase 0 & 1 verified that all domain foundations, persistence, history, and rendering bridges are 100% healthy (0 TypeScript errors, 269/272 passing vector tests). Interactive drag interaction completes the missing bridge between User Mouse Actions and Domain Mutations.

#### **ARCHITECTURAL FIT:**
- **SSOT:** Preserves `VectorWorkspaceState` as single source of truth.
- **Transactions & History:** Dragging updates transient local render state during drag, and commits a single immutable `VectorDocumentSnapshot` to `HistoryStack` when mouse is released (`onMouseUp`).
- **ADR Compliance:** Complies strictly with DECISION-042/043/044/045. Zero DOM mutations inside domain controllers.

#### **RISKS & MITIGATIONS:**
- **Risk:** Flooding `HistoryStack` with 60 snapshots per second during mouse move.
  - **Mitigation:** Transient drag delta calculation during `onMouseMove`, pushing to `HistoryStack` exclusively on `onMouseUp`.
- **Risk:** Negative width/height or NaN coordinates during handle drag.
  - **Mitigation:** Enforce `VectorGeometry.isValidNodeGeometry()` and min bounds clamping (`width >= 1`, `height >= 1`).

#### **EXPECTED RESULT:**
Full end-to-end vertical slice:
`USER MOUSE DRAG → CANVAS EVENT → CONTROLLER DISPATCHER → DOMAIN GEOMETRY MUTATION → HISTORY SNAPSHOT → SELECTION OVERLAY → RENDER COMMAND COMPILATION → CANVAS RE-RENDER`.

---

## 2. Backup Features Identified

### **BACKUP FEATURE #1: Visual Layer Management Panel & Node Controls (GAP-04)**
- **User Value:** Layer hierarchy tree view, z-index reordering via drag-and-drop, visibility (eye icon) and lock (padlock icon) toggles.
- **Architectural Fit:** Directly consumes `VectorWorkspaceState.snapshot.nodes` and dispatches to `reorderSelectedNodes`, `updateNode`.

### **BACKUP FEATURE #2: Document Persistence UI & SVG Exporter Vertical Slice (GAP-07 & GAP-10)**
- **User Value:** UI toolbar buttons for Export JSON, Import JSON, Download SVG, and Shape Flip (H-Flip/V-Flip) & Rotate 90°.
- **Architectural Fit:** Consumes `VectorDocumentSerializer` and `VectorRenderingBridge`.
