# G1-57 Architecture Decision Record (ADR)

- **ADR-057**: Multi-page site route management and navigation link binding must be implemented in headless `MultiPageNavigationRouterEngine.ts`.
- **SSOT Invariant**: Active page composition is mapped to `VectorDocumentSnapshot` SSOT upon route context switching.
