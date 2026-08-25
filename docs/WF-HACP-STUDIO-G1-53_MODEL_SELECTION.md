# WF-HACP-STUDIO-G1-53: Model Selection & Domain Mapping

- **Primary Domain**: Authoring Studio / Vector Domain (`packages/authoring-studio/src/vector`).
- **Core Abstractions**:
  - `VectorConstraintConflictResolutionEngine`
  - `ConflictItem`, `ConflictReport`, `ConflictClassificationType`, `ConflictSeverity`, `ConflictResolutionStrategy`, `ConflictResolutionResult`
  - `VectorDocumentSnapshot` with `constraintEdges`
