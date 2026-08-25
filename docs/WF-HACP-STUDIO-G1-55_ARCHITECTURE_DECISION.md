# G1-55 Architecture Decision Record (ADR)

- **ADR-055**: Visual Page Builder interaction logic must be decoupled into headless `PageBuilderInteractionEngine.ts`.
- **SSOT Rules**: `VectorDocumentSnapshot` remains single source of truth (SSOT).
- **Transaction Safety**: All page builder operations delegate to `VectorWorkflowOrchestrator` and `HistoryStack`.
