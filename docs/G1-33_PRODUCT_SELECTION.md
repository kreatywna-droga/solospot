# G1-33 PRODUCT SELECTION: CANVAS MARQUEE RECTANGLE DRAG SELECTION

- **Task ID:** `G1-33-CANVAS-MARQUEE-RECTANGLE-SELECTION`
- **Feature Gap Selected:** `GAP-05 — Canvas Marquee Rectangle Drag Selection Vertical Slice`
- **Date:** 2026-08-17

---

## 1. Why This Feature (User Value)

In professional vector graphics editors (such as Figma, Illustrator, Inkscape, Sketch), marquee rectangle drag selection is the fundamental spatial selection mechanism.
Currently, WEB FACTOR vector editor supports:
- Single-shape point clicking on canvas.
- Layer panel multi-selection row clicks.
- Interactive mouse dragging/moving (`G1-31`).
- Visual layer management (`G1-32`).

However, users cannot click and drag a rectangular bounding marquee on the canvas to visually select multiple shapes at once. This forces users to click shapes one-by-one or use the layer list. Adding canvas marquee selection delivers immediate high user value for multi-shape manipulation.

---

## 2. Product Capability Map (Categories A–N)

| Category | Capability Area | Current Status | G1-33 Impact |
|:---:|---|:---:|---|
| **A** | Document Model & Snapshots | IMPLEMENTED | Unchanged (SSOT preserved) |
| **B** | Single & Multi-Selection | PARTIAL | Upgraded to spatial 2D marquee selection |
| **C** | Transform & Manipulation | IMPLEMENTED | Manipulates marquee-selected sets |
| **D** | Layout & Alignment | IMPLEMENTED | Operates on marquee-selected nodes |
| **E** | Layer Management | IMPLEMENTED | Bi-directionally synced with marquee selection |
| **F** | Shape Grouping | IMPLEMENTED | Group bounds hit-tested during marquee |
| **G** | Clipboard | IMPLEMENTED | Copy/cut marquee-selected nodes |
| **H** | History & Undo/Redo | IMPLEMENTED | Marquee commit state integrated cleanly |
| **I** | Persistence | IMPLEMENTED | Selected IDs serializable in snapshots |
| **J** | Canvas Rendering | IMPLEMENTED | Adds semi-transparent marquee overlay |
| **K** | User Pointer Interaction | PARTIAL | Adds `marquee` drag mode to canvas pointer events |
| **L** | Boolean CSG Operations | IMPLEMENTED | Can operate on marquee-selected shapes |
| **M** | Tooling & Inspector | IMPLEMENTED | Inspector updates for marquee multi-selection |
| **N** | Canvas Geometry Engine | IMPLEMENTED | Adds normalized box intersection / containment |

---

## 3. Selection Semantics

- **Default Selection Mode:** Partial intersection (any shape whose bounding box touches or intersects the marquee box is selected).
- **Modifier Keys:**
  - `Normal Drag`: Replaces current selection with the marquee-enclosed shapes.
  - `Shift + Drag`: Additive selection (adds marquee-enclosed shapes to existing selection, or toggles).
- **Exclusion Filters:**
  - `Hidden shapes` (`visible === false`): Excluded from marquee selection.
  - `Locked shapes` (`locked === true`): Excluded from marquee selection.
  - `Groups` (`type === 'group'`): If group bounding box intersects, the group node ID is selected.
- **Transient Preview:** During mouse drag, marquee selection highlights candidate shapes live while rendering a dashed bounding box overlay.

---

## 4. Alternative Backups Considered
- **Backup 1 (GAP-06):** Polygon Star & Regular Polygon Vertex Count Tooling.
- **Backup 2 (GAP-07):** Canvas Zoom & Pan Navigation Controls.
- **Decision:** GAP-05 is chosen because spatial multi-selection is a core prerequisite for high-velocity graphic design workflows.
