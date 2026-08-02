# Master Document Index — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 99_MASTER_DOCUMENT_INDEX.md  
> **Status:** Active Master Index  
> **Zależności:** Wszystkie dokumenty w `docs/studio/` (00 – 100)  
>  
> **Proces:** Główny Indeks Dokumentacji Architektonicznej i Zarządczej

---

## 1. Główny Indeks Dokumentacji Studio (00 – 100)

### Sekcja 1: Foundation (Wizja i Architektura Podstawowa)
| # | Nazwa Dokumentu | Status | Kategoria | Krótkie Przeznaczenie |
|---|-----------------|--------|-----------|-----------------------|
| `00` | `00_STUDIO_VISION.md` | APPROVED | Foundation | Wizja produktu i cele rynkowe edytora. |
| `01` | `01_STUDIO_ARCHITECTURE.md` | APPROVED | Foundation | Główny schemat architektury modułowej. |
| `02` | `02_UI_LAYOUT.md` | APPROVED | Foundation | Układ i zarys interfejsu Studio Shell. |
| `03` | `03_CANVAS_ENGINE.md` | APPROVED | Foundation | Architektura obszaru roboczego Canvas. |
| `04` | `04_SELECTION_SYSTEM.md` | APPROVED | Foundation | Podstawowy model systemu zaznaczania. |
| `05` | `05_DRAG_DROP_ENGINE.md` | APPROVED | Foundation | Specyfikacja silnika Przeciągnij i Upuść. |
| `06` | `06_LAYOUT_ENGINE.md` | APPROVED | Foundation | Zarys podsystemu układy stron. |
| `07` | `07_INSPECTOR.md` | APPROVED | Foundation | Specyfikacja prawego panelu Inspectora. |
| `08` | `08_COMPONENT_SYSTEM.md` | APPROVED | Foundation | Architektura Rejestru Komponentów. |

### Sekcja 2: Builder (Subsystemy Budowania)
| # | Nazwa Dokumentu | Status | Kategoria | Krótkie Przeznaczenie |
|---|-----------------|--------|-----------|-----------------------|
| `31` | `31_LAYOUT_PROPERTY_SPECIFICATION.md` | APPROVED | Builder | Specyfikacja Flexbox/Spacing/Size/Position. |
| `38` | `38_GRID_PROPERTY_SPECIFICATION.md` | APPROVED | Builder | Specyfikacja dwuwymiarowej siatki CSS Grid. |
| `44` | `44_OVERFLOW_PROPERTY_SPECIFICATION.md` | APPROVED | Builder | Specyfikacja przycinania zawartości Overflow. |
| `50` | `50_BORDER_PROPERTY_SPECIFICATION.md` | IN PROGRESS | Builder | Specyfikacja obramowań Border Engine. |
| `51` | `51_RADIUS_PROPERTY_SPECIFICATION.md` | APPROVED | Builder | Specyfikacja zaokrągleń Radius Engine. |
| `53` | `53_CANVAS_COMPLETION_SPECIFICATION.md` | APPROVED | Builder | Specyfikacja domknięcia silnika Canvasu. |

### Sekcja 3: Runtime (Silnik Wykonawczy i Renderowanie)
| # | Nazwa Dokumentu | Status | Kategoria | Krótkie Przeznaczenie |
|---|-----------------|--------|-----------|-----------------------|
| `28` | `28_RUNTIME_EXECUTION_MODEL.md` | APPROVED | Runtime | Model wykonawczy renderera stron Iframe. |
| `32` | `32_RESPONSIVE_VALUE_MODEL.md` | APPROVED | Runtime | Model reaktywności dla breakpointów. |

### Sekcja 4: Governance (Zarządzanie i Standardy)
| # | Nazwa Dokumentu | Status | Kategoria | Krótkie Przeznaczenie |
|---|-----------------|--------|-----------|-----------------------|
| `65` | `65_ARCHITECTURE_PRINCIPLES.md` | APPROVED | Governance | 10 nadrzędnych zasad architektonicznych. |
| `66` | `66_PROPERTY_EVOLUTION_GUIDE.md` | APPROVED | Governance | Poradnik ewolucji właściwości wizualnych. |
| `67` | `67_BACKWARD_COMPATIBILITY_POLICY.md` | APPROVED | Governance | Polityka wstecznej kompatybilności. |
| `71` | `71_DOCUMENTATION_STYLE_GUIDE.md` | APPROVED | Governance | Standard tworzenia dokumentacji i metadanych. |
| `72` | `72_DOCUMENT_LIFECYCLE.md` | APPROVED | Governance | 8-etapowy cykl życia dokumentów. |
| `73` | `73_VERSIONING_POLICY.md` | APPROVED | Governance | Polityka wersjonowania Semantic Versioning. |
| `74` | `74_MODULE_DEPENDENCY_GUIDE.md` | APPROVED | Governance | Mapa zależności i zakazanych powiązań. |
| `75` | `75_ARCHITECTURE_GLOSSARY.md` | APPROVED | Governance | Oficjalny słownik pojęć architektonicznych. |
| `83` | `83_ARCHITECTURE_CHANGE_MANAGEMENT.md` | APPROVED | Governance | Proces zarządzania zmianami architektury. |
| `84` | `84_SUBSYSTEM_LIFECYCLE.md` | APPROVED | Governance | 10-etapowy cykl życia subsystemu. |
| `85` | `85_EXTENSION_GUIDELINES.md` | APPROVED | Governance | Wytyczne tworzenia rozszerzeń Buildera. |
| `86` | `86_ARCHITECTURE_CONSISTENCY_RULES.md` | APPROVED | Governance | Reguły spójności i przykłady naruszeń. |
| `87` | `87_PROJECT_SCALABILITY_GUIDE.md` | APPROVED | Governance | Przewodnik skalowania wydajnościowego. |
| `88` | `88_GOVERNANCE_REVIEW_PROCESS.md` | APPROVED | Governance | Proces okresowych przeglądów jakości. |

### Sekcja 5: ADR (Decyzje Architektoniczne)
| # | Nazwa Dokumentu | Status | Kategoria | Krótkie Przeznaczenie |
|---|-----------------|--------|-----------|-----------------------|
| `77` | `77_ADR_INDEX.md` | APPROVED | ADR | Centralny indeks wszystkich rekordów ADR. |
| `80` | `80_DECISION_LOG.md` | APPROVED | ADR | Centralny rejestr decyzji projektowych. |

### Sekcja 6: Sprint Documentation (Dokumentacja Sprintowa)
| # | Nazwa Dokumentu | Status | Kategoria | Krótkie Przeznaczenie |
|---|-----------------|--------|-----------|-----------------------|
| `34` | `34_SPRINT5A_INTEGRATION_REVIEW.md` | APPROVED | Sprint Doc | Odbiór integracji Layout Engine. |
| `35` | `35_LAYOUT_ENGINE_ARCHITECTURE_FREEZE.md` | APPROVED | Sprint Doc | Zamrożenie architektury Layout Engine. |
| `41` | `41_SPRINT5B1_INTEGRATION_REVIEW.md` | APPROVED | Sprint Doc | Odbiór integracji Grid Engine. |
| `42` | `42_GRID_ENGINE_ARCHITECTURE_FREEZE.md` | APPROVED | Sprint Doc | Zamrożenie architektury Grid Engine. |
| `45` | `45_OVERFLOW_COMMANDS.md` | APPROVED | Sprint Doc | Kontrakty komend Overflow Engine. |
| `52` | `52_RADIUS_COMMANDS.md` | APPROVED | Sprint Doc | Kontrakty komend Radius Engine. |

### Sekcja 7: Quality (Kontrola Jakości i Metryki)
| # | Nazwa Dokumentu | Status | Kategoria | Krótkie Przeznaczenie |
|---|-----------------|--------|-----------|-----------------------|
| `59` | `59_BUILDER_SUBSYSTEM_TEMPLATE.md` | APPROVED | Quality | Szablon dokumentacji subsystemu. |
| `60` | `60_SUBSYSTEM_CHECKLIST.md` | APPROVED | Quality | Checklista realizacji subsystemu. |
| `61` | `61_PROPERTY_DESIGN_GUIDELINES.md` | APPROVED | Quality | Wytyczne projektowania właściwości. |
| `62` | `62_BUILDER_TRACEABILITY_MATRIX.md` | APPROVED | Quality | Macierz śledzenia wymagań. |
| `63` | `63_ENGINEERING_METRICS.md` | APPROVED | Quality | System metryk inżynieryjnych. |
| `64` | `64_RELEASE_READINESS.md` | APPROVED | Quality | Kryteria gotowości wydaniowej. |
| `68` | `68_PERFORMANCE_BUDGET.md` | APPROVED | Quality | Budżet wydajności i limity czasowe. |
| `69` | `69_BUILDER_RISK_REGISTER.md` | APPROVED | Quality | Rejestr ryzyk architektonicznych. |
| `70` | `70_ARCHITECTURE_REVIEW_CHECKLIST.md` | APPROVED | Quality | Checklista przeglądu architektonicznego. |
| `76` | `76_DOCUMENTATION_AUDIT_CHECKLIST.md` | APPROVED | Quality | Checklista audytu dokumentacji. |
| `89` | `89_ARCHITECTURE_COMPLIANCE_SPEC.md` | APPROVED | Quality | Specyfikacja kontroli zgodności. |
| `90` | `90_DOCUMENTATION_LINTER_SPEC.md` | APPROVED | Quality | Specyfikacja lintera dokumentacji. |
| `92` | `92_CI_QUALITY_GATES.md` | APPROVED | Quality | Specyfikacja bramek jakości CI/CD. |
| `93` | `93_ENGINEERING_AUDIT_FRAMEWORK.md` | APPROVED | Quality | Framework audytu inżynieryjnego. |
| `94` | `94_PROJECT_MATURITY_MODEL.md` | APPROVED | Quality | Model dojrzałości projektu. |
| `96` | `96_ARCHITECTURE_COMPLIANCE_MATRIX.md` | APPROVED | Quality | Macierz zgodności standardów. |

### Sekcja 8: Operations (Operacje, Roadmapy i Runbook)
| # | Nazwa Dokumentu | Status | Kategoria | Krótkie Przeznaczenie |
|---|-----------------|--------|-----------|-----------------------|
| `37` | `37_STUDIO_SUBSYSTEM_ROADMAP.md` | APPROVED | Operations | Główny harmonogram subsystemów. |
| `78` | `78_ARCHITECTURE_TIMELINE.md` | APPROVED | Operations | Chronologiczny przebieg rozwoju. |
| `81` | `81_FUTURE_SUBSYSTEM_ROADMAP.md` | APPROVED | Operations | Roadmapa przyszłych subsystemów. |
| `82` | `82_PROJECT_HEALTH_DASHBOARD.md` | APPROVED | Operations | Specyfikacja dashboardu kondycji. |
| `91` | `91_REPOSITORY_STRUCTURE_STANDARD.md` | APPROVED | Operations | Standard struktury repozytorium. |
| `95` | `95_ENGINEERING_AUTOMATION_ROADMAP.md` | APPROVED | Operations | Roadmapa wdrożenia automatyzacji. |
| `97` | `97_RELEASE_GOVERNANCE.md` | APPROVED | Operations | Proces zatwierdzania wydań. |
| `98` | `98_OPERATIONAL_RUNBOOK.md` | APPROVED | Operations | Podręcznik prowadzenia projektu. |
| `99` | `99_MASTER_DOCUMENT_INDEX.md` | APPROVED | Operations | Centralny indeks wszystkich dokumentów. |
| `100`| `100_DOCUMENTATION_COVERAGE_REPORT.md` | APPROVED | Operations | Raport pokrycia dokumentacyjnego. |
