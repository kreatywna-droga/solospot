# G1-28 Architecture Decision — Production Canvas Commands & Grouping Workflow

## 1. Current Architecture
The Vector Editing subsystem currently provides basic shape DTOs (`VectorDomainModel.ts`), CSG boolean operations (`VectorBooleanEngine.ts`), basic shape manipulations (`VectorEditingEngine.ts`), state management with history (`VectorWorkspaceController.ts`), and DTO-to-canvas rendering (`VectorRenderingBridge.ts` & `CanvasRenderer.ts`).

However, interactive canvas movements, shape duplication, shape grouping/ungrouping, and keyboard shortcuts (`Delete`, `Ctrl+Z`, `Ctrl+Y`, `Ctrl+G`, `Ctrl+Shift+G`, `Ctrl+D`) are disconnected or missing from the controller and history pipeline.

## 2. Problem
1. **Grouping Disconnect:** Domain functions `groupShapes` and `ungroupShape` exist, but `VectorWorkspaceController` has no action dispatchers (`groupSelectedNodes`, `ungroupSelectedNodes`). `VectorToolbar` group/ungroup buttons are no-ops, and `ShapeGroupNode` rendering and history entries are not tracked.
2. **Missing Keyboard Workflow:** Canvas interactions rely solely on manual button clicks; key combinations (`Delete`, `Ctrl+Z`, `Ctrl+Y`, `Ctrl+G`, `Ctrl+Shift+G`, `Ctrl+D`) do not trigger workspace state transformers.
3. **Missing Duplication & Movement Controller Dispatchers:** Duplicating or dragging shapes on canvas cannot be performed safely through `VectorWorkspaceController` with atomic `HistoryStack` pushes.

## 3. Root Cause
- `VectorWorkspaceController.ts` lacked controller action wrappers for grouping, ungrouping, duplicating, and translating nodes.
- `VectorWorkspace.tsx` lacked container keyboard event listeners and mouse drag interaction handlers.

## 4. Proposed Architecture
Extend `VectorWorkspaceController.ts` with pure functional state transformers:
- `groupSelectedNodes(state, groupId?)`: Groups selected nodes into a `ShapeGroupNode`, replaces original nodes at minimum z-index slot, selects group node, pushes `Group Nodes` to `HistoryStack`.
- `ungroupSelectedNodes(state)`: Un-groups selected `ShapeGroupNode`s back into child nodes with relative transform restoration, replaces group node at z-index slot, selects children, pushes `Ungroup Nodes` to `HistoryStack`.
- `duplicateSelectedNodes(state, offsetX?, offsetY?)`: Duplicates selected nodes with spatial offset and unique collision-safe IDs, selects duplicates, pushes `Duplicate Nodes` to `HistoryStack`.
- `moveSelectedNodes(state, dx, dy)`: Translates selected nodes by `(dx, dy)`, pushes `Move Nodes` to `HistoryStack`.

Extend `VectorWorkspace.tsx` with:
- Global/Container Keyboard Event Listener for `Delete`, `Backspace`, `Ctrl+Z`, `Ctrl+Y` / `Ctrl+Shift+Z`, `Ctrl+G`, `Ctrl+Shift+G`, `Ctrl+D`.
- Mouse Drag Handler (`onMouseDown`, `onMouseMove`, `onMouseUp`) to interactively translate shapes on canvas.

Extend `VectorRenderingBridge.ts`:
- Support recursive `ShapeGroupNode` render command compilation (rendering group children with cumulative parent group transforms and opacities).

## 5. Data Flow
```
User Keypress / Mouse Drag
    ↓
VectorWorkspace.tsx (Keyboard Listener / Drag Handler)
    ↓
VectorWorkspaceController (groupSelectedNodes / duplicateSelectedNodes / moveSelectedNodes)
    ↓
VectorEditingEngine (groupShapes / ungroupShape / duplicateShape / moveShape)
    ↓
VectorDocumentSnapshot (Nodes Array & Selected IDs)
    ↓
HistoryStack (Pushed entry with human-readable label)
    ↓
VectorRenderingBridge (Compiles VectorNode & ShapeGroupNode DTOs → RendererCommand[])
    ↓
RenderCommandExecutor → CanvasRenderer → Canvas 2D Surface
```

## 6. State Ownership
- `VectorWorkspaceState` inside `VectorWorkspace.tsx` (`useState`). Single Source of Truth (SSOT).

## 7. Domain Ownership
- `VectorEditingEngine` in `packages/authoring-studio/src/vector/VectorEditingEngine.ts`. Pure domain math and shape transformation functions.

## 8. Document Ownership
- `VectorDocumentSnapshot` (`readonly nodes: ReadonlyArray<VectorNode>`, `readonly selectedIds: ReadonlyArray<string>`).

## 9. History Ownership
- `HistoryStack<VectorDocumentSnapshot>` managed inside `VectorWorkspaceState`.

## 10. Rendering Ownership
- `VectorRenderingBridge` (DTO compilation) and `CanvasRenderer` / `RenderCommandExecutor` (canvas execution).

## 11. Error Boundary
- All controller dispatchers are wrapped in `try...catch`. Any unexpected exception during grouping, ungrouping, duplicating, or moving returns the input `state` unmodified.

## 12. Transaction Boundary
- Each user command (Group, Ungroup, Duplicate, Move, Delete) forms an atomic transaction. Either the entire snapshot updates and a `HistoryStack` entry is pushed, or the operation safely rolls back.

## 13. Recovery Strategy
- In case of domain exception or invalid state input, `VectorWorkspaceController` catches the error and cleanly returns the unchanged `state`.

## 14. Alternatives
- Alternative A: Perform grouping and duplication in React component state directly without controller functions.
- Alternative B: Use imperative canvas DOM events to mutate node objects in-place.

## 15. Rejected Alternatives
- Rejected Alternative A: Violates SSOT and bypasses `HistoryStack` recording.
- Rejected Alternative B: Violates immutability, breaks Undo/Redo, and violates ADR governance rules (DECISION-042/043/044/045).

## 16. Why Chosen Solution is Safest
- Preserves pure functional architecture, maintains strict immutability, guarantees complete `HistoryStack` undo/redo compatibility, and isolates domain logic from UI rendering.
