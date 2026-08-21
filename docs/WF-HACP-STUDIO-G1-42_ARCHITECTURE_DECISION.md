# WF-HACP-STUDIO-G1-42 Architecture Decision & Dependency Graph

## Architectural Decisions Log (ADR)
- **DECISION-046**: `VectorEditingCommandSystem` is the SSOT for command validation and atomic document mutations.
- **DECISION-047**: `VectorWorkflowOrchestrator` delegates command execution strictly to `VectorEditingCommandSystem` and manages `HistoryStack` transaction boundaries.
- **DECISION-048**: Batch execution guarantees atomicity — partial failures revert document state to initial snapshot with 0 committed history stack entries.

## 3-Workstream Dependency Graph

```
WORKSTREAM A (Command Domain & Batch Engine)
├── VectorEditingCommandSystem.ts
└── VectorCommandPayload & VectorBatchCommand DTOs

WORKSTREAM B (Controller & Workflow Orchestration)
├── VectorWorkflowOrchestrator.ts
└── Keyboard Shortcut Handlers

WORKSTREAM C (Subsystem Integration)
├── VectorDocumentSerializer (G1-35)
├── VectorSvgExporter (G1-35)
├── VectorViewportController (G1-37)
├── VectorSnappingEngine (G1-40)
└── VectorTransformInteractionEngine (G1-41)
            │
            ▼
UNIFIED INTEGRATION GATE (Vector Editing Workflow Pipeline)
```
