# G1-32 PRODUCT SELECTION REPORT

- **Task ID:** `G1-32-VISUAL-DOCUMENT-STRUCTURE-LAYER-MANAGEMENT`
- **Parent Task:** `G1-31-AUTONOMOUS-PRODUCT-EVOLUTION`
- **Previous Verified Task:** `G1-31.1-INDEPENDENT-VERIFICATION-AUDIT`
- **Selected Feature:** **GAP-04: Visual Document Structure & Layer Management Vertical Slice (`VectorLayersPanel`)**

---

## 1. Executive Summary & Selection Rationale

Following the independent verification and ratification of G1-31 (`Interactive Canvas Mouse Drag & Handle Resize Vertical Slice`), the AI agent executed Phase 3 Product Capability Mapping and Phase 4 Gap Discovery across 14 capability categories.

Out of 16 real product gaps identified, **GAP-04 (Visual Document Structure & Layer Management Vertical Slice)** emerged as the highest priority product gap (Score: 4.8 / 5.0).

Now that users can interactively drag, move, resize, rotate, flip, and create shapes on the canvas, providing a dedicated visual **Layers Panel** is essential for document navigation, multi-layer selection, z-order control, visibility/lock toggling, and shape renaming.

---

## 2. Feature Selection Matrix

| Gap ID | Feature Description | Category | Value (1-5) | Impact (1-5) | Arch Fit (1-5) | Complexity | Risk | Score | Selection Status |
|--------|---------------------|----------|:-----------:|:------------:|:--------------:|:----------:|:----:|:-----:|:----------------:|
| **GAP-04** | **Visual Layer Management Panel & Node Controls** | **Layer Mgmt (F)** | **5** | **5** | **5** | **3** | **1** | **4.8** | **PRIMARY FEATURE** |
| **GAP-05** | Canvas Marquee Rectangle Drag Selection | Selection (C) | 4 | 4 | 4 | 3 | 2 | 4.0 | BACKUP #1 |
| **GAP-08** | Visual History Stack Timeline Panel | History (I) | 4 | 3 | 5 | 2 | 1 | 3.9 | BACKUP #2 |
| **GAP-09** | Viewport Zoom-to-Cursor & Pan Dragging | UX / Tooling (N) | 4 | 4 | 3 | 4 | 2 | 3.6 | Evaluated |
| **GAP-01** | Interactive Drag-to-Create Shape Tool Flow | Interaction (L) | 4 | 3 | 4 | 3 | 2 | 3.5 | Evaluated |

---

## 3. Scope of Primary Feature (G1-32 Vertical Slice)

The `VectorLayersPanel` vertical slice will deliver end-to-end integration across all system layers:

1. **Visual Layer Hierarchy Tree:** Displays a structured list of all nodes in the document snapshot in top-to-bottom z-index visual order.
2. **Bi-Directional Selection Synchronization:**
   - Clicking a layer row in `VectorLayersPanel` selects that node on the Canvas and updates `VectorInspectorPanel`.
   - Selecting a node on the Canvas automatically highlights its row in `VectorLayersPanel`.
3. **Layer Row Node Controls:**
   - **Eye Button (Visibility):** One-click toggle for node `visible` state (`toggleSelectedNodesVisibility`).
   - **Padlock Button (Lock):** One-click toggle for node `locked` state (`toggleSelectedNodesLock`).
   - **Z-Order Quick Buttons:** Bring Forward, Send Backward, Bring to Front, Send to Back for the highlighted layer.
4. **Layer Renaming:** Double-clicking or editing layer name updates node `name` property with full history tracking and undo/redo support.
5. **Group Tree Representation:** Displays grouped nodes (`ShapeGroupNode`) with expand/collapse hierarchy support.
6. **Full Layer Architecture Integration:** USER CLICK / REORDER → UI (`VectorLayersPanel`) → CONTROLLER (`VectorWorkspaceController`) → DOMAIN (`VectorEditingEngine`) → DOCUMENT (`VectorDocumentSnapshot`) → HISTORY (`HistoryStack`) → PERSISTENCE → CANVAS RENDERING.
