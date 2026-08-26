# G1-32 ARCHITECTURE DECISION LOG

- **Task ID:** `G1-32-VISUAL-DOCUMENT-STRUCTURE-LAYER-MANAGEMENT`
- **Parent Task:** `G1-31-AUTONOMOUS-PRODUCT-EVOLUTION`
- **Date:** 2026-08-17
- **Status:** **APPROVED & ARCHITECTURALLY RATIFIED** 🔒

---

## 18 Governance Questions & Architectural Answers

### 1. Where does the feature reside?
UI component resides in [`VectorLayersPanel.tsx`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/ui/components/vector/VectorLayersPanel.tsx). Controller logic resides in [`VectorWorkspaceController.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/vector/VectorWorkspaceController.ts).

### 2. Who owns the state?
`VectorWorkspaceState` (`{ snapshot: VectorDocumentSnapshot, historyStack: HistoryStack<VectorDocumentSnapshot> }`).

### 3. What is the Single Source of Truth (SSOT)?
`VectorWorkspaceState.snapshot.nodes` and `VectorWorkspaceState.snapshot.selectedIds`.

### 4. Who executes mutations?
`VectorWorkspaceController.ts` through pure, transactional dispatch functions (`updateNode`, `reorderSelectedNodes`, `toggleSelectedNodesLock`, `toggleSelectedNodesVisibility`, `selectNodes`).

### 5. How does UI communicate with controller?
`VectorLayersPanel` receives state (`snapshot`) and callback props from `VectorWorkspace` or parent editor layout. UI events (clicks, reorder buttons, eye/padlock toggles, name changes) trigger callback handlers that dispatch controller actions.

### 6. How does controller communicate with domain?
Controller invokes pure domain algorithms in [`VectorEditingEngine.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/vector/VectorEditingEngine.ts) and [`VectorGeometry.ts`](file:///c:/Users/HP/Documents/GOOGLE%20ANTIGRAVITY%20APK/WEB%20FACTOR/packages/authoring-studio/src/vector/VectorGeometry.ts).

### 7. How does selection work?
Bi-directional binding between `snapshot.selectedIds` and `VectorLayersPanel`. Selecting a row in the layer panel updates `snapshot.selectedIds`, which instantly highlights the node on the Canvas and updates `VectorInspectorPanel`.

### 8. How does history work?
Every layer action (reorder, rename, lock, hide) pushes an immutable snapshot onto `HistoryStack` with a human-readable command label (`'Reorder Layer'`, `'Rename Node'`, `'Toggle Lock'`, `'Toggle Visibility'`).

### 9. How does undo work?
`undoVectorAction(state)` pops the current snapshot from `HistoryStack` and restores the previous snapshot state.

### 10. How does redo work?
`redoVectorAction(state)` re-applies the next snapshot from `HistoryStack`.

### 11. How does persistence work?
`VectorDocumentSerializer.serializeVectorDocument()` serializes node names, z-order, locked, and visible flags into DTO JSON. `loadVectorDocument()` restores them intact.

### 12. How does rendering work?
`VectorRenderingBridge.buildRenderCommands()` compiles canvas render commands in exact z-index layer order, skipping hidden (`visible === false`) nodes.

### 13. How does rollback work?
Any exception thrown during layer operations returns the original unchanged `VectorWorkspaceState` with zero partial state.

### 14. How is immutability preserved?
Controller dispatches create new array and object references (`[...nodes]`, `{ ...node }`). Direct state mutation is strictly forbidden.

### 15. How do we avoid duplicate architecture?
`VectorLayersPanel` reuses pre-existing controller functions (`reorderSelectedNodes`, `toggleSelectedNodesLock`, `toggleSelectedNodesVisibility`, `updateNode`, `selectNodes`) without creating parallel state engines.

### 16. What existing APIs do we use?
`reorderSelectedNodes`, `toggleSelectedNodesLock`, `toggleSelectedNodesVisibility`, `updateNode`, `selectNodes`, `VectorRenderingBridge`, `VectorDocumentSerializer`.

### 17. What are runtime / browser / domain boundaries?
`VectorLayersPanel.tsx` is pure React JSX. Controller and Domain modules are 100% pure TypeScript without DOM or browser dependencies.

### 18. How does the feature impact G1-31 capabilities?
Complements G1-31 canvas mouse drag move and handle resize by allowing users to select, manage, reorder, lock, hide, and rename shapes visually in the document layer tree.
