# WF-HACP-STUDIO-G1-51 State Machine

```
[IDLE] 
  │
  ├──► buildConstraintGraph() ──► [GRAPH_BUILT]
  │                                    │
  │                                    ├──► detectCycle() == true ──► [ERROR_STATE] ──► [ROLLBACK / 0 COMMITS]
  │                                    │
  │                                    └──► detectCycle() == false ──► [TOPOLOGICAL_SORT]
  │                                                                         │
  │                                                                         ▼
  │                                                                [RESOLVE_SUBGRAPH]
  │                                                                         │
  │                                                                         ▼
  │                                                                [VALIDATE_BOUNDS]
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┴──► [COMMIT / 1 HISTORY ENTRY]
```
