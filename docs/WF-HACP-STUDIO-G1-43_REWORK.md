# WF-HACP-STUDIO-G1-43 Real Rework Events Log

## Rework Event #1: VectorBooleanEngine CSG Method Name Alignment
- **Problem**: `VectorBooleanTopologyEngine` initially called fictitious `VectorBooleanEngine.combineShapes`.
- **Detection**: Caught during TypeScript compilation.
- **Root Cause**: `VectorBooleanEngine` exports `performOperation(op, nodeA, nodeB)`.
- **Architectural Decision**: Align `VectorBooleanTopologyEngine` to call `performOperation`.
- **Correction**: Replaced calls in `VectorBooleanTopologyEngine.ts`.
- **Retest**: Resolved TS compiler error.
- **Regression Verification**: 0 regression impact.

## Rework Event #2: PathNode Domain Model Interface Extension
- **Problem**: `PathNode` interface lacked `cornerRadius` property, causing compiler errors when storing smoothed path corner radii.
- **Detection**: Caught during TypeScript compilation.
- **Root Cause**: `CornerRadius` was defined on `RectangleNode` but omitted from `PathNode`.
- **Architectural Decision**: Add optional `readonly cornerRadius?: CornerRadius;` to `PathNode` in `VectorDomainModel.ts`.
- **Correction**: Updated `VectorDomainModel.ts`.
- **Retest**: Resolved all TS compiler errors in `VectorPathEngine` and `VectorPathTopologyG143.test.ts`.
- **Regression Verification**: 0 regression impact.

## Rework Event #3: Multi-Path ID Query in E2E Sequential Boolean Operations
- **Problem**: Test assertion in `E2E-07` searched for `n.type === 'path'` when selecting newly created topology shape.
- **Detection**: Caught during Stage 07 test execution.
- **Root Cause**: `p1` was also a `'path'`, so `find(n => n.type === 'path')` returned `p1` instead of newly generated `path_topo_` node.
- **Architectural Decision**: Target newly generated boolean topology shapes explicitly using `n.id.startsWith('path_topo_')`.
- **Correction**: Updated `E2E-07` in `VectorPathTopologyG143.test.ts`.
- **Retest**: All 70 tests passed 100%.
- **Regression Verification**: 0 regression impact.
