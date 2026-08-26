# G1-50 REWORK LOG

## Rework 1
- **Stage**: 8
- **Description**: Deeply nested groups do not propagate constraints because applyGroupConstraints was shallow.
- **Resolution**: Implemented recursive applyGroupConstraints in VectorConstraintLayoutEngine so when a child is a group, its constraints are calculated relative to the parent group, and then its own children are recursively updated relative to the child group's new bounds.

## Rework 2
- **Stage**: 11
- **Description**: Domain Model added constraints field to BaseVectorNode, but serialization and deserialization functions were stripping or ignoring it.
- **Resolution**: Updated VectorWorkspaceController JSON serialization/deserialization to retain the constraints field.

## Rework 3
- **Stage**: 15
- **Description**: Adversarial testing revealed that if a parent is scaled to 0 width, child elements with SCALE constraints encounter divide-by-zero leading to NaN bounds.
- **Resolution**: Updated VectorConstraintLayoutEngine.ts to include safeguards: if (pOldW === 0) return { x: cx, width: cw }; preventing NaN propagation.
