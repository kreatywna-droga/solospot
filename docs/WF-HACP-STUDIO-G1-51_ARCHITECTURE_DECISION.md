# WF-HACP-STUDIO-G1-51 Architecture Decision Record (ADR)

## Decision Title
ADR-G1-51: Deterministic Snapshot-Derived Constraint Graph Resolution Architecture

## Context & Problem
Managing complex parent-child and node-to-node layout constraints requires an ordering mechanism to avoid race conditions, non-deterministic evaluation orders, or cyclic infinite loops.

## Decision
1. `VectorConstraintGraphEngine` derives `ConstraintGraph` dynamically on-demand from `VectorDocumentSnapshot`.
2. Topological sorting sorts nodes with zero in-degree alphabetically by `nodeId` to guarantee 100% determinism.
3. Graph resolution isolates transient mutations into an affected subgraph, preserving unaffected nodes byte-for-byte.
4. Pre-flight cycle detection halts evaluation cleanly, returning a structured `ConstraintGraphError` without polluting `HistoryStack`.
