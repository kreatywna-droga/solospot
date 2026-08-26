# G1-27 Architecture Decision — Vector Layer Reorder & Alignment Vertical Slice

## 1. Architectural Overview & Ownership Trace

| Question | Architectural Answer / Owner |
|---|---|
| **1. Who owns the state?** | `VectorWorkspaceState` inside `VectorWorkspace.tsx` (`useState`). Single Source of Truth (SSOT). |
| **2. Who executes the operation?** | `VectorEditingEngine.reorderShapes()` and `VectorEditingEngine.alignShapes()` in `packages/authoring-studio/src/vector/VectorEditingEngine.ts`. |
| **3. Who updates the snapshot?** | `reorderSelectedNodes()` and `alignSelectedNodes()` in `packages/authoring-studio/src/vector/VectorWorkspaceController.ts`. |
| **4. Who creates the HistoryStack entry?** | `VectorWorkspaceController` pushes a new `VectorDocumentSnapshot` with a human-readable label (e.g., `Layer bringToFront`, `Align center`) onto `HistoryStack`. |
| **5. Who causes rendering?** | `VectorWorkspace.tsx` `useEffect` triggered by `workspaceState.snapshot` change. Calls `VectorRenderingBridge.buildRenderCommands()` and `RenderCommandExecutor.executeCommands()`. |
| **6. How does UI learn about changes?** | React state `workspaceState` update triggers automatic component re-render of canvas and toolbar enable/disable states. |
| **7. What happens on error?** | `try...catch` in controller returns unchanged `state`, ensuring document, history, selection, and canvas remain uncorrupted. |
| **8. How does undo work?** | `undoVectorAction()` pops previous `VectorDocumentSnapshot` from `HistoryStack`, restoring exact prior layer order, shape transforms, and selection. |
| **9. How does redo work?** | `redoVectorAction()` advances to next `VectorDocumentSnapshot` in `HistoryStack`. |
| **10. How is immutability preserved?** | Pure functional state transformers return new object copies (`[...nodes]`, `{ ...snapshot }`). No in-place mutations. |

## 2. Component API Contracts

### Controller Extensions (`VectorWorkspaceController.ts`)

```typescript
export function reorderSelectedNodes(
  state: VectorWorkspaceState,
  action: LayerReorderAction
): VectorWorkspaceState;

export function alignSelectedNodes(
  state: VectorWorkspaceState,
  alignment: AlignmentType
): VectorWorkspaceState;
```

### Toolbar Extensions (`VectorToolbar.tsx`)

Props updated to include:
- `onReorderNodes?: (action: LayerReorderAction) => void;`
- `onAlignNodes?: (alignment: AlignmentType) => void;`

Rendered buttons:
- Layer Reorder: `bringToFront`, `bringForward`, `sendBackward`, `sendToBack` (enabled when `>= 1` shape selected).
- Layer Alignment: `alignLeft`, `alignCenter`, `alignRight`, `alignTop`, `alignMiddle`, `alignBottom` (enabled when `>= 2` shapes selected).

## 3. Failure Safety Contracts

- Reordering with 0 selected nodes: returns identity `state`.
- Aligning with < 2 selected nodes: returns identity `state`.
- Reordering non-existent node ID: returns identity `state`.
- Runtime exception in domain engine: caught safely by `try...catch`, returns unchanged `state`.
