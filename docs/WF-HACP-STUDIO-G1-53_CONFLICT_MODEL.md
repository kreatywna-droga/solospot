# WF-HACP-STUDIO-G1-53: Conflict Classification Model

## Conflict Types & Severities
1. `DIRECT_CONFLICT` (HIGH): Multiple constraint edges targeting the same axis of the same node.
2. `CYCLE_CONFLICT` (CRITICAL): Circular dependency chain between 2 or more nodes.
3. `OVER_CONSTRAINED` (HIGH): Conflicting constraints over-specifying geometry.
4. `UNSATISFIABLE` (MEDIUM): Geometric layout bounds impossible to fulfill simultaneously.
5. `INVALID_REFERENCE` (HIGH): Constraint edge pointing to missing source or target node ID.
6. `LOCKED_NODE_CONFLICT` (CRITICAL): Constraint edge attempting to mutate a locked node.
7. `GEOMETRY_BOUNDARY_CONFLICT` (CRITICAL): Transform containing `NaN`, `Infinity`, or invalid negative dimensions.
