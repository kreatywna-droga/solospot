# WF-HACP-STUDIO-G1-53: Architectural Decision Record (ADR)

## Decision Key
`ADR-G1-53-CONFLICT-RESOLUTION-SSOT`

## Context
Authoring Studio requires conflict detection and resolution over complex vector constraint graphs.

## Decisions Made
1. **SSOT Rule**: `VectorDocumentSnapshot` is the single source of truth for all persistent document state, including `constraintEdges`. `ConflictReport` and `ConflictItem` are transient derived data structures.
2. **Resolution Pipeline**: Resolution follows a deterministic pipeline: `detectConflicts` -> `classifyConflict` -> `buildConflictReport` -> `resolveConflicts` -> `resolveIncremental` (solver) -> `executeWorkflow` (commit/rollback).
3. **Immutability Invariant**: Conflict detection and resolution return new immutable snapshot objects without mutating input snapshots.
