# G1-22 ARCHITECTURE PLAN: Vector Boolean Engine

## 1. Problem Statement
Authoring Studio's vector module provides domain models (`VectorDomainModel.ts`), geometry operations (`VectorGeometry.ts`), and basic editing (`VectorEditingEngine.ts`). However, it lacks Constructive Solid Geometry (CSG) operations — the ability to perform boolean logic (Union, Subtract, Intersect, Exclude) on paths to create complex composite shapes.

## 2. Existing Architecture
The Vector subsystem (`packages/authoring-studio/src/vector/`) is entirely headless. All mutations return new immutable DTOs (`VectorNode` / `PathNode`).

## 3. SSOT Identification
`VectorNode` (specifically `PathNode`) in `VectorDomainModel.ts`.

## 4. Current Gap
No engine to perform CSG operations: `Union`, `Subtract`, `Intersect`, `Exclude`.

## 5. Proposed Architecture
Introduce `packages/authoring-studio/src/vector/VectorBooleanEngine.ts`.
A pure static class offering CSG operations that take two `VectorNode` objects and return a newly constructed `PathNode` containing the combined geometry.

## 6. Data Flow
`VectorNode A` + `VectorNode B` → `VectorBooleanEngine.operation()` → `PathNode C`.
No DOM interaction. Immutable transformation.

## 7. Control Flow
Static invocation by upper layers (e.g., UI commands). No state is preserved within the engine.

## 8. API / Interface Contracts
```typescript
export type BooleanOperation = 'union' | 'subtract' | 'intersect' | 'exclude';

export class VectorBooleanEngine {
  public static performOperation(op: BooleanOperation, nodeA: VectorNode, nodeB: VectorNode): PathNode;
  public static union(nodeA: VectorNode, nodeB: VectorNode): PathNode;
  public static subtract(baseNode: VectorNode, subtractNode: VectorNode): PathNode;
  public static intersect(nodeA: VectorNode, nodeB: VectorNode): PathNode;
  public static exclude(nodeA: VectorNode, nodeB: VectorNode): PathNode;
}
```

## 9. Integration Points
Will be exported from `packages/authoring-studio/src/vector/index.ts`.

## 10. Error Handling
Throws an error if bounding boxes are invalid. Gracefully handles disjoint shapes in Union/Subtract.

## 11. Immutability / Mutation Rules
Inputs `nodeA` and `nodeB` are never mutated. A completely new `PathNode` is returned with a new unique ID.

## 12. Test Strategy
`packages/authoring-studio/src/vector/__tests__/VectorBooleanEngine.test.ts`.
- Happy paths: Union, Subtract, Intersect, Exclude.
- Edge cases: disjoint paths, identical paths.
- Immutability check.

## 13. Regression Risks
Zero regression risk. This is an additive extension.

## 14. Security / Boundary Considerations
Fully runs within isolated TS runtime. No browser dependencies.

## 15. ADR Compatibility
Follows `DECISION-042` and headless rules.

## 16. Implementation Plan
- **Milestone 1**: Implement `VectorBooleanEngine.ts` with naive bounding-box or basic path composition.
- **Milestone 2**: Write full test suite.
- **Milestone 3**: Export from barrel file.

## 17. Acceptance Criteria
- Engine provides 4 operations.
- 100% test coverage for the engine.
- Types match `VectorDomainModel`.
- Baseline tests remain green.

## [AGENT 2 AUDIT]
**STATUS**: PASS 🔒. The plan maintains pure headless SSOT transformation. No new runtime dependencies. Fits standard S18 Vector pipeline.
