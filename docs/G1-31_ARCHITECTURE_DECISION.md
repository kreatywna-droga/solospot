# G1-31 ARCHITECTURE DECISION LOG — INTERACTIVE CANVAS DRAG & RESIZE VERTICAL SLICE

- **Task ID:** G1-31-AUTONOMOUS-PRODUCT-EVOLUTION
- **Feature:** Interactive Canvas Mouse Drag Move & Handle Resize Vertical Slice
- **Date:** 2026-08-17

---

## Architectural Answers to the 14 Governance Questions

### 1. Gdzie znajduje się feature? (Feature Location)
- **Domain Layer:** [`VectorEditingEngine.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/vector/VectorEditingEngine.ts) & [`VectorGeometry.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/vector/VectorGeometry.ts) (Pure TS transform math, resize handle calculation, bounding box math).
- **Controller Layer:** [`VectorWorkspaceController.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/vector/VectorWorkspaceController.ts) (State dispatchers: `resizeSelectedNodes`, `moveSelectedNodes`, `commitDragTransaction`).
- **UI Layer:** [`VectorWorkspace.tsx`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/ui/components/vector/VectorWorkspace.tsx) & [`VectorHandlesOverlay.tsx`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/ui/components/vector/VectorHandlesOverlay.tsx) (React viewport event listeners for `onMouseDown`, `onMouseMove`, `onMouseUp`, handle hit-testing).

### 2. Kto jest właścicielem stanu? (State Owner)
- `VectorWorkspaceState` inside `VectorWorkspaceController` owns the document snapshot (`nodes`, `selectedIds`) and `HistoryStack`.
- `VectorWorkspace.tsx` maintains transient drag interaction state (`isDragging`, `dragStartPos`, `activeHandle`, `initialNodesSnapshot`) only while the mouse button is held down.

### 3. Kto wykonuje mutację? (Mutation Executor)
- Pure functional dispatchers in `VectorWorkspaceController.ts` (`moveSelectedNodes`, `resizeSelectedNodes`) execute immutable state transformations by creating fresh `VectorDocumentSnapshot` objects.

### 4. Jaki jest SSOT? (Single Source of Truth)
- `VectorWorkspaceState.snapshot` is the exclusive Single Source of Truth for vector document nodes and selection.

### 5. Jak działa undo? (Undo Mechanism)
- `undoVectorAction(state)` pops the top snapshot from `HistoryStack` and restores the exact previous document nodes and selection IDs.

### 6. Jak działa redo? (Redo Mechanism)
- `redoVectorAction(state)` advances the `HistoryStack` pointer and restores the forward document snapshot.

### 7. Jak feature wpływa na selection? (Selection Behavior)
- Moving or resizing selected shapes preserves `selectedIds`.
- Clicking a resize handle on an already selected shape keeps that shape selected throughout the drag operation.

### 8. Jak feature wpływa na persistence? (Persistence Behavior)
- Once the drag completes (`onMouseUp`), the updated snapshot is immediately serializable via `VectorDocumentSerializer.serializeVectorDocument(snapshot)`.

### 9. Jak feature wpływa na rendering? (Rendering Pipeline)
- During mouse drag, `VectorRenderingBridge.buildRenderCommands()` compiles render commands for the updated transient node positions/dimensions at 60fps.
- `CanvasRenderer` executes commands to redraw the canvas surface instantly.

### 10. Jak feature reaguje na failure? (Failure Handling & Rollback)
- If an invalid transform coordinate (NaN, Infinity, or negative bounds) occurs during drag computation, `VectorGeometry.isValidNodeGeometry()` rejects the mutation, rolling back safely to the initial pre-drag snapshot without corrupting history.

### 11. Jak feature zachowuje immutability? (Immutability Preservation)
- All node transforms are updated using object spread syntax (`{ ...node, transform: { ...node.transform, ... } }`). Array inputs are never mutated in place.

### 12. Jak unikamy duplicate architecture? (Preventing Duplicate Architecture)
- We reuse existing `VectorGeometry`, `VectorEditingEngine`, `VectorWorkspaceController`, and `VectorRenderingBridge` APIs directly. No parallel state managers or secondary document trees are created.

### 13. Jakie istniejące API wykorzystujemy? (Reused APIs)
- `VectorEditingEngine.moveShape()`
- `VectorGeometry.computeBoundingBox()`, `VectorGeometry.isValidNodeGeometry()`, `VectorGeometry.pointInShape()`
- `VectorWorkspaceController.moveSelectedNodes()`, `VectorWorkspaceController.selectNodes()`
- `VectorRenderingBridge.buildRenderCommands()`, `CanvasRenderer.executeCommands()`

### 14. Jakie są granice runtime/browser/domain? (Architecture Boundaries)
- **Domain & Controller:** 100% pure TypeScript DTOs. ZERO DOM dependencies, ZERO React dependencies, ZERO `window` / `document` references.
- **UI Viewport (`VectorWorkspace.tsx`):** Handles browser React synthetic pointer events and maps screen coordinates to canvas world coordinates.
