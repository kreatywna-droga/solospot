# G1-56 Architecture Decision Record (ADR)

- **ADR-056**: Visual Page Builder canvas runtime logic must be decoupled into headless `PageBuilderCanvasRuntimeAdapter.ts`.
- **UI Boundary Rule**: UI dispatches operate through clean adapter methods without embedding business logic inside React components.
- **SSOT Invariant**: `VectorDocumentSnapshot` remains single source of truth (SSOT).
