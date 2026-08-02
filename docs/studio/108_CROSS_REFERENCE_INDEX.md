# Master Cross-Reference Index — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 108_CROSS_REFERENCE_INDEX.md  
> **Status:** Active Reference Index  
> **Zależności:** 77_ADR_INDEX.md, 99_MASTER_DOCUMENT_INDEX.md  
>  
> **Proces:** Centralny Indeks Odwołań, Zależności i Powiązań Dokumentacji

---

## 1. Centralny Indeks Powiązań Dokumentów

| # | Nazwa Dokumentu | Dokumenty Nadrzędne | Dokumenty Zależne | Powiązany ADR | Powiązany Subsystem | Powiązana Checklista / Roadmapa |
|---|-----------------|---------------------|-------------------|---------------|---------------------|----------------------------------|
| `51` | `51_RADIUS_PROPERTY_SPECIFICATION.md` | `31_LAYOUT_SPEC` | `52_RADIUS_CMD` | `ADR-008` | Radius Engine | `37_ROADMAP`, `60_CHECKLIST` |
| `52` | `52_RADIUS_COMMANDS.md` | `51_RADIUS_SPEC` | `52_RADIUS_CMD` | `ADR-008` | Radius Engine | `62_TRACEABILITY_MATRIX` |
| `53` | `53_CANVAS_COMPLETION_SPECIFICATION.md` | `03_CANVAS_ENG` | `54_CANVAS_PLAN` | `ADR-009` | Canvas Completion | `37_ROADMAP`, `68_PERF_BUDGET` |
| `54` | `54_CANVAS_INTEGRATION_PLAN.md` | `53_CANVAS_SPEC` | `55_SELECTION_SPEC`| `ADR-009` | Canvas Completion | `62_TRACEABILITY_MATRIX` |
| `55` | `55_SELECTION_ENGINE_SPEC.md` | `04_SELECTION_SYS` | `56_OVERLAY_ARCH` | `ADR-009` | Canvas Completion | `60_SUBSYSTEM_CHECKLIST` |
| `56` | `56_OVERLAY_ARCHITECTURE.md` | `53_CANVAS_SPEC` | `57_TEST_STRATEGY`| `ADR-009` | Canvas Completion | `68_PERFORMANCE_BUDGET` |
| `57` | `57_CANVAS_TEST_STRATEGY.md` | `53_CANVAS_SPEC` | `58_ARCH_REVIEW` | `ADR-009` | Canvas Completion | `70_ARCH_REVIEW_CHECKLIST` |
| `58` | `58_CANVAS_ARCHITECTURE_REVIEW.md` | `53_CANVAS_SPEC` | `58_ARCH_REVIEW` | `ADR-009` | Canvas Completion | `64_RELEASE_READINESS` |
| `59` | `59_BUILDER_SUBSYSTEM_TEMPLATE.md` | `36_ENG_PROCESS` | Wszystkie Subsystemy| `ADR-001` | Core Framework | `60_SUBSYSTEM_CHECKLIST` |
| `60` | `60_SUBSYSTEM_CHECKLIST.md` | `36_ENG_PROCESS` | `59_TEMPLATE` | `ADR-001` | Quality Framework | `99_IMPLEMENTATION_CHECKLIST` |
| `65` | `65_ARCHITECTURE_PRINCIPLES.md` | `01_STUDIO_ARCH` | Wszystkie Dokumenty| `ADR-001` | Governance | `86_CONSISTENCY_RULES` |
| `77` | `77_ADR_INDEX.md` | `01_STUDIO_ARCH` | `80_DECISION_LOG` | Wszystkie ADR | All Subsystems | `62_TRACEABILITY_MATRIX` |
| `99` | `99_MASTER_DOCUMENT_INDEX.md` | `00_VISION` | Wszystkie Pliki | Wszystkie ADR | All Subsystems | `100_COVERAGE_REPORT` |
