# G1-33 ARCHITECTURE DECISION LOG (ADR): CANVAS MARQUEE RECTANGLE DRAG SELECTION

- **Task ID:** `G1-33-CANVAS-MARQUEE-RECTANGLE-SELECTION`
- **Feature Gap:** `GAP-05 — Canvas Marquee Rectangle Drag Selection Vertical Slice`
- **Date:** 2026-08-17
- **Status:** APPROVED & RATIFIED 🔒

---

## 1. Governance Architectural Decisions

1. **Where does marquee interaction live?**
   - Headless geometric hit-testing logic lives in `VectorGeometry.ts` (`boxIntersectsBox`, `nodeIntersectsMarquee`, `nodeContainedInMarquee`).
   - Headless state updates live in `VectorWorkspaceController.ts` (`selectNodesInMarquee`).
   - Pointer lifecycle handlers and transient canvas rendering live in `VectorWorkspace.tsx`.
2. **Who owns drag state?**
   - Active drag mode (`'none' | 'move' | 'resize' | 'marquee'`) and marquee coordinates (`startPos`, `currentPos`) are transient UI state within `VectorWorkspace.tsx`.
3. **Who owns selection state?**
   - `VectorWorkspaceState.snapshot.selectedIds` is the single source of truth (SSOT).
4. **What is the SSOT?**
   - `VectorWorkspaceState` (`{ snapshot, historyStack }`).
5. **Is marquee a document mutation?**
   - No. Selecting nodes does not alter node geometry, hierarchy, or properties. It updates `snapshot.selectedIds`.
6. **Does marquee create a history entry?**
   - Moving or editing selected shapes pushes history entries. Marquee selection update does not pollute the undo stack per pointer move. Selection is committed cleanly on pointer up.
7. **When is selection committed?**
   - On `handleMouseUp` (pointer release). Live preview updates `selectedIds` during drag.
8. **Is drag preview transient?**
   - Yes. Intermediate mouse moves update UI state without writing to disk or history.
9. **How does undo work?**
   - Shape mutations made to marquee-selected sets undo and redo cleanly through `HistoryStack`.
10. **How does redo work?**
    - Redo replays the snapshot including `selectedIds`.
11. **How does persistence work?**
    - `VectorDocumentSerializer.serializeVectorDocument` saves nodes. Selection is transient or restored cleanly upon file load.
12. **How does rendering work?**
    - During active marquee drag, `VectorWorkspace.tsx` emits a transient `DRAW_RECT` command with semi-transparent fill (`rgba(14, 165, 233, 0.1)`) and stroke (`#0ea5e9`, dashed) to the Canvas surface.
13. **How does the selection overlay work?**
    - Selected shapes receive bounding box strokes and 8 resize handle square overlays.
14. **How do locked nodes behave?**
    - Locked nodes (`locked === true`) are filtered out and ignored during marquee selection hit-testing.
15. **How do hidden nodes behave?**
    - Hidden nodes (`visible === false`) are filtered out and ignored during marquee selection hit-testing.
16. **How do grouped nodes behave?**
    - If a `ShapeGroupNode` bounding box intersects the marquee box, the group's ID is selected as a single atomic entity.
17. **How do nested groups behave?**
    - Hit-testing tests top-level root nodes in the snapshot array. Nested children inside a group select their parent group ID.
18. **How do modifier keys work?**
    - `Normal drag`: Replaces current selection with enclosed nodes.
    - `Shift + Drag`: Additive selection (union of current selection and marquee enclosed nodes).
19. **How do we avoid duplicate selection architecture?**
    - We reuse `selectNodes` and `VectorGeometry.computeBoundingBox` without creating redundant selection stores.
20. **How is immutability preserved?**
    - All controller functions return new immutable snapshot and state objects with zero in-place mutations.
21. **How are failures handled?**
    - All controller operations wrap calculations in transactional `try...catch` blocks, returning the previous state unharmed in case of failure.
22. **How do we avoid partial state?**
    - Failed hit-testing returns the original selection state with **NO PARTIAL STATE**.
23. **What existing APIs are reused?**
    - `VectorGeometry.computeBoundingBox`, `selectNodes`, `VectorRenderingBridge`, `RenderCommandExecutor`.
24. **What are the UI / Controller / Domain boundaries?**
    - UI (`VectorWorkspace.tsx`) captures mouse events and paints the overlay. Controller (`VectorWorkspaceController.ts`) computes new state. Domain (`VectorGeometry.ts`) computes bounding boxes and intersections.
25. **What are the Browser / Runtime boundaries?**
    - Pure TypeScript in controller/geometry (zero DOM/window dependencies). DOM event listeners are isolated exclusively in the React UI layer.

---

## 2. Agent 2 Design Audit Verdict: **PASS** ✅
- State ownership is strictly unified.
- Zero type suppressions.
- ADR compliance: Fully compliant with `DECISION-042..045`.
