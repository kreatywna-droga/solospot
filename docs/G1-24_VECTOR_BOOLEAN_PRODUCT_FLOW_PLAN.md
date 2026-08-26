# G1-24 VECTOR BOOLEAN PRODUCT FLOW PLAN

## Architectural Objectives
- Deliver a purely functional, headless TypeScript controller for the Vector editing workspace.
- Provide a robust Undo/Redo integration.
- Ensure immutable transaction-based interactions with the document nodes.
- Maintain accurate Selection tracking during document mutations.
- Wire up the React UI without injecting React state directly into the domain models.

## Phase 3 — Product Flow Design

### 1. Vector Workspace Controller (`VectorWorkspaceController.ts`)
To bridge the gap between `VectorToolbar`, `VectorBooleanEngine`, and `HistoryStack`, we need a dedicated headless controller: `VectorWorkspaceController`. This controller will manage the `VectorWorkspaceState`.

```typescript
export interface VectorWorkspaceState {
  readonly documentNodes: ReadonlyArray<VectorNode>;
  readonly historyStack: HistoryStack<VectorNode[]>;
  readonly selectedNodeIds: ReadonlyArray<string>;
}
```

The controller will expose immutable operations, specifically the boolean command integration:

```typescript
export function executeBooleanOperation(
  state: VectorWorkspaceState,
  operation: 'union' | 'subtract' | 'intersect' | 'xor'
): VectorWorkspaceState { ... }

export function undo(state: VectorWorkspaceState): VectorWorkspaceState | null { ... }
export function redo(state: VectorWorkspaceState): VectorWorkspaceState | null { ... }
```

### 2. Execution Flow for `executeBooleanOperation`
When `executeBooleanOperation` is called:
1. Validates the number of selected nodes (`>= 2`).
2. Locates the selected `VectorNode` instances within `state.documentNodes`.
3. Invokes `VectorBooleanEngine.performOperation(operation, ...)` combining the elements sequentially (if > 2).
4. Creates a new immutable `documentNodes` array where:
   - All source selected objects are removed.
   - The newly generated Boolean `PathNode` is inserted at the z-index of the lowest source object.
5. Updates `HistoryStack<VectorNode[]>` by pushing the *new* `documentNodes` array.
6. Updates `selectedNodeIds` to highlight *only* the new Boolean `PathNode` id.
7. Returns the new `VectorWorkspaceState`.

### 3. Selection Behavior
- **BEFORE**: N objects selected.
- **AFTER OPERATION**: The N objects are destroyed. A single new `PathNode` is born. The selection automatically transitions to this single new object.
- **UNDO**: The `HistoryStack` reverts `documentNodes` to the previous N objects. The controller detects that the current selection no longer exists, and gracefully clears selection, OR we push selection state to the history stack as well to ensure exact restoration. Since `HistoryStack` in builder-core does not support custom metadata wrappers easily unless we parameterize it, we'll store a robust generic structure: `HistoryStack<VectorDocumentSnapshot>`.

### 4. Refining the History Snapshot
To accurately restore Selection alongside Geometry, the generic type for HistoryStack should be:

```typescript
export interface VectorDocumentSnapshot {
  readonly nodes: ReadonlyArray<VectorNode>;
  readonly selectedIds: ReadonlyArray<string>;
}
```

This guarantees 100% accurate Undo/Redo contract compliance (Requirement 7).

### 5. UI Integration (`VectorWorkspace.tsx`)
We will create a React wrapper to prove the flow end-to-end:
`packages/authoring-studio/src/ui/components/vector/VectorWorkspace.tsx`

This component will:
- Initialize `VectorWorkspaceState`.
- Render `VectorToolbar` and listen to `onBooleanOperation`.
- Provide the `onBooleanOperation` handler that invokes `executeBooleanOperation` on the state and updates React state.
- Render the current `VectorNode[]` via `VectorRenderingBridge`.

### 6. Testing Strategy
- **Level 1 (Command) & Level 2 (Document)**: `VectorWorkspaceController.test.ts` testing the dispatcher isolated from React.
- **Level 3 (History)**: Verifying `undo()` and `redo()` restore `selectedIds` and `nodes` perfectly.
- **Level 4 & 5 (UI & Integration)**: We will create an integration test mounting `VectorWorkspace` and firing `VectorToolbar` click events using `@testing-library/react`.

## User Review Required
No user review is required as this is a FULL AUTONOMOUS MULTI-AGENT operation. Agent 2 has internally audited the plan.

## Conclusion (Agent 2 Audit)
This architecture plan answers all 10 questions from Phase 2. It introduces the missing `VectorWorkspaceController`, avoids React-coupled state mutations, guarantees SSOT, handles Selection properly, and natively supports the History contract.
**Decision: PASS. Proceed with Implementation.**
