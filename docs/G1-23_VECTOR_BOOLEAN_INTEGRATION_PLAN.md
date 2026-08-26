# G1-23 VECTOR BOOLEAN INTEGRATION PLAN

## 1. Architectural Context & Audit
The `VectorBooleanEngine` currently exists as an isolated utility in the domain logic. It accurately processes CSG operations and outputs a `PathNode`, but this node is never integrated into the document SSOT or exposed to the user.

1. **Czy VectorBooleanEngine jest faktycznie używany?** No, it was only tested in unit tests.
2. **Czy istnieje publiczny punkt wejścia?** No UI/Controller connects to it.
3. **Czy wynik operacji boolean może zostać zapisany w modelu?** Yes, it produces a standard `PathNode` conforming to `VectorDomainModel.ts`.
4. **Czy wynik może zostać przekazany do renderera?** Yes, `VectorRenderingBridge` inherently supports `PathNode` generation.
5. **Czy transformacje są zachowane?** Yes, transformations map correctly into the bounds of the new PathNode.
6. **Czy istnieje problem z układem współrzędnych?** Yes, coordinate offsets. `PathNode` coordinates (`x`, `y`) must be correctly anchored so the `d` path string operates in local space or absolute space consistently.
7. **Czy istnieją problemy z degeneracją geometrii?** Disjoint intersections yield empty bounding boxes/paths.
8. **Czy operacje są deterministyczne?** Yes.
9. **Czy operacje są niemutowalne?** Yes, it returns a strictly new immutable node.

## 2. Independent Architectural Decision (Agent 2)
**DECISION:** `C. zintegrowany przez istniejący pipeline` + `D. rozszerzenie UI/Commands`

The `VectorBooleanEngine` must act as an interactive *Command* invoked by the user, similarly to grouping/ungrouping in `VectorEditingEngine`. The user selects multiple nodes, selects a boolean action, the action computes the new composite node, and the old nodes are deleted and replaced by the new node in the Document state. The standard React component + Redux/Zustand dispatch loop will route the updated Document to the `VectorRenderingBridge` and `CanvasRenderer`.

## 3. Integration Design

### 3.1 Flow
**USER / MODEL:** User selects 2+ nodes and clicks a Boolean Action in the Toolbar/Inspector.
**VECTOR GEOMETRY:** Controller calls `VectorBooleanEngine`.
**BOOLEAN OPERATION:** Engine calculates new `PathNode` bounds and `d` path string.
**RESULT GEOMETRY:** `PathNode` replaces the selected nodes in the SSOT.
**MODEL / BRIDGE:** Store updates. The new tree reaches `VectorRenderingBridge`.
**VECTOR RENDERING:** Bridge converts `PathNode` into `DRAW_PATH` command.
**CANVAS RENDERER:** Native 2D canvas parses and fills the SVG path.

### 3.2 Required Operations
The engine must support:
- `UNION`
- `INTERSECT`
- `SUBTRACT`
- `XOR` (Mapped to `exclude` logic)

### 3.3 Geometry Constraints
- **Empty result:** Intersecting disjoint shapes yields a `PathNode` with zero width/height and empty `d`.
- **Invalid geometry:** Throws or returns an empty path gracefully.
- **Identical shapes:** Yields exact copy for Union/Intersect, empty for Subtract/XOR.

### 3.4 Implementation Steps
1. Refactor `VectorBooleanEngine.ts` to explicitly map `xor` operation and handle local coordinate alignment for the `d` strings.
2. Update `VectorToolbarProps` and `VectorToolbar.tsx` to expose `Union`, `Subtract`, `Intersect`, `XOR` buttons conditionally when 2+ nodes are selected.
3. Update `VectorInspectorPanel.tsx` or the Parent Controller (e.g., `VectorEditor`) to dispatch the CSG creation to the Model, removing the selected nodes and inserting the result.
4. Add comprehensive Integration tests verifying `CanvasRenderer` successfully draws the produced boolean `d` string.
5. Create `docs/G1-23_AUTONOMOUS_RECOVERY_INTEGRATION_FINAL_REPORT.md`.

## 4. Test Strategy
We will add `VectorIntegration.test.ts` or similar bridge tests that:
- Generate a Boolean Node.
- Pass it to `VectorRenderingBridge`.
- Ensure a valid `DRAW_PATH` command is compiled with the exact coordinates and string. 
- Ensure immutability across the SSOT operation.
