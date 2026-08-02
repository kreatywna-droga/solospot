# C16.99 — WEB FACTOR Studio 2.0 Implementation Checklist

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 99_IMPLEMENTATION_CHECKLIST.md  
> **Status:** Architecture Baseline v2.0 — APPROVED & FROZEN 🔒 | EP1–EP23 Platform PASS ✅ (2026-07-30)  
> **Zależności:** Wszystkie dokumenty C16 (`docs/studio/` 00–113)  
> **Pakiety Platformy:** 23 niezależne pakiety w `packages/` (EP1–EP23) zaimplementowane i gotowe  
> **Plan wdrożenia:** 7 etapów | 25 sprintów | 6 milestone'ów | 23 pakiety platformowe

---

## Przepływ sprintu

Każdy sprint przechodzi przez 9 faz:

```
1. Plan Sprint
    ↓
2. Dokumentacja
    ↓
3. Implementacja
    ↓
4. Testy
    ↓
5. Code Review
    ↓
6. Performance
    ↓
7. Security
    ↓
8. Freeze
    ↓
9. Następny Sprint
```

Nigdy nie implementujemy dwóch dużych modułów jednocześnie.

---

## Milestone'y

```
Sprint  1- 3  →  MILESTONE A: Studio działa. [ZAKOŃCZONE ✅]
Sprint  4- 6  →  MILESTONE B: Można budować strony. [W TRAKCIE 🚧 - 5A, 5B.1, 5B.2, 5B.3 Gotowe]
Sprint  7-10  →  MILESTONE C: Konkurencja dla Wix Studio.
Sprint 11-14  →  MILESTONE D: Profesjonalny builder.
Sprint 15-21  →  MILESTONE E: Nowa generacja builderów.
Sprint 22-25  →  MILESTONE F: WEB FACTOR Platform.
```

---

## ETAP 0 — Architecture & Governance Baseline (Sprinty Q1 – Q9 & EP1 – EP11)

**Cel: zamrozić architekturę oraz zautomatyzować kontrolę jakości i platformę inżynieryjną.**

### Zadania Governance (Agent 2)
- [x] Review wszystkich dokumentów C16 Studio (114 dokumentów w `docs/studio/`)
- [x] Zamknięcie Architecture Baseline v2.0 APPROVED 🔒
- [x] Dokumenty 00 do 113 w `docs/studio/` wygenerowane i zamrożone
- [x] Audyt Spójności i Macierz Zgodności (`96`, `107`, `108`, `109`, `110`, `113`)
- [x] Agent 2 przeszedł w tryb Maintenance / On-Demand

### Pakiety Inżynieryjne Platformy (Agent 2 — Sprinty EP1 – EP11)
- [x] **EP1:** `@web-factor/devtools` (`packages/devtools`) — Logger, Performance Monitor, Debug Overlay State
- [x] **EP2:** `@web-factor/testing` (`packages/testing`) — Test Utilities, Builder Fixtures, Benchmark Runner, Snapshot Engine
- [x] **EP3:** `@web-factor/design-tokens` (`packages/design-tokens`) — Color Shades (50-900), Spacing, Typography, Layout, Theme API
- [x] **EP4:** `@web-factor/ui-core` (`packages/ui-core`) — Foundation, Layout, Feedback UI Components & Models
- [x] **EP5:** `@web-factor/builder-sdk` (`packages/builder-sdk`) — Core SDK, Plugin API, Event API, Extension Contracts
- [x] **EP6:** `@web-factor/docgen` (`packages/docgen`) — TypeScript API Extractor, Markdown Generator, Dependency Analyzer, CLI
- [x] **EP7:** `@web-factor/visual-testing` (`packages/visual-testing`) — Visual Snapshot Engine, Diff Engine, Report Generator, CLI
- [x] **EP8:** `@web-factor/project-health` (`packages/project-health`) — Code Metrics Engine, Quality Analyzer, Health Score (0-100), CLI
- [x] **EP9:** `@web-factor/package-registry` (`packages/package-registry`) — Manifest Model, Validator, Dependency Graph, Load Order, CLI
- [x] **EP10:** `@web-factor/plugin-sandbox` (`packages/plugin-sandbox`) — Permission Model, Sandbox Contracts, Validator, Security Report, CLI
- [x] **EP11:** `@web-factor/architecture-validator` (`packages/architecture-validator`) — Rules Engine, Layer Import Validator, Structure Validator, Score, CLI

**Efekt:**
```
docs/studio/         → 114 zamrożonych dokumentów specyfikacji i governance
packages/            → 11 w pełni funkcjonalnych, niezależnych pakietów platformowych
STATUS: APPROVED & FROZEN 🔒
```

---

### Pakiety Platform Engineering (Agent 2 — Sprinty EP12 – EP23)
- [x] **EP12:** `@web-factor/monorepo-tools` (`packages/monorepo-tools`) — Workspace Analyzer, Package Graph, Script Runner, Workspace Health Score, CLI
- [x] **EP13:** `@web-factor/release-management` (`packages/release-management`) — Version Analyzer (SemVer), Release Validator, Changelog Builder, Release Score (0-100), CLI
- [x] **EP14:** `@web-factor/project-knowledge` (`packages/project-knowledge`) — Knowledge Model (KnowledgeNode/Edge/Graph), Graph Builder (pakiety/moduły/API), Knowledge Report, CLI
- [x] **EP15:** `@web-factor/api-contract-intelligence` (`packages/api-contract-intelligence`) — Contract Model, Contract Analyzer (interface/method/param diff), Contract Validator, Compatibility Score, CLI
- [x] **EP16:** `@web-factor/documentation-intelligence` (`packages/documentation-intelligence`) — Documentation Model, Coverage Analyzer, Reference Validator, Completeness Score (0-100), CLI
- [x] **EP17:** `@web-factor/code-quality-intelligence` (`packages/code-quality-intelligence`) — Quality Model, Complexity Analyzer, Duplication Detector, Quality Score (0-100), CLI
- [x] **EP18:** `@web-factor/runtime-observability` (`packages/runtime-observability`) — Telemetry Model (Metric/Event/Trace/Span/Health), Observability Analyzer, Health Report, CLI
- [x] **EP19:** `@web-factor/platform-security-intelligence` (`packages/platform-security-intelligence`) — Security Model, Vulnerability Analyzer, Policy Validator, Security Score (0-100), CLI
- [x] **EP20:** `@web-factor/developer-experience-intelligence` (`packages/developer-experience-intelligence`) — DX Model, DX Analyzer (API ergonomics/onboarding/consistency), DX Score (0-100), CLI
- [x] **EP21:** `@web-factor/package-dependency-intelligence` (`packages/package-dependency-intelligence`) — Dependency Graph, Cycle Detector, Orphan Finder, Unused Deps Analyzer, Dependency Score, CLI
- [x] **EP22:** `@web-factor/test-intelligence` (`packages/test-intelligence`) — Test Model, Static Coverage Analyzer, Empty Test Detector, Test Quality Score (0-100), CLI
- [x] **EP23:** `@web-factor/build-intelligence` (`packages/build-intelligence`) — Build Model, TSConfig & package.json Analyzer, Build Validator, Build Health Score (0-100), CLI

**Łącznie EP1–EP23:**
```
packages/            → 23 w pełni funkcjonalne, niezależne pakiety platformowe
STATUS: ALL PASS ✅ (2026-07-30)
```

---

## ETAP 1 — Studio Foundation

---

### Sprint 1 — Studio Shell

| Obszar | Zadania | Status |
|--------|---------|--------|
| Toolbar | Przycisk Back, nazwa sklepu + status, nawigacja (Pages, Layers, Assets, AI, History), viewport switcher (Desktop/Tablet/Mobile), Undo/Redo, Save, Publish | [x] |
| Left Sidebar | Tab switcher (Pages, Layers, Assets, Components), content area per tab, resizable (drag edge) | [x] |
| Canvas | iframe placeholder, grid overlay, empty state | [x] |
| Inspector | Header z nazwą sekcji, kategorie (accordion), scroll area | [x] |
| Bottom Bar | Responsive switcher, zoom controls, Preview/History/AI/Publish | [x] |

---

### Sprint 2 — Builder Core

| Obszar | Zadania | Status |
|--------|---------|--------|
| BuilderContext | createBuilderContext, dispatch pattern | [x] |
| BuilderDocument | immutable state, touchDocument, compile() | [x] |
| Command Pattern | BuilderCommands — wszystkie typy komend | [x] |
| HistoryStack | Undo/Redo, snapshot store, max entries, etykiety | [x] |
| Selection | CanvasState, reduceCanvasState, selection engine | [x] |
| Store | Wires everything together | [x] |
| Undo/Redo | Ctrl+Z / Ctrl+Shift+Z, visual buttons | [x] |

---

### Sprint 3 — Component Registry

| Obszar | Zadania | Status |
|--------|---------|--------|
| ComponentDescriptor | type, label, category, icon, schema, defaultProps | [x] |
| PropSchema | string, text, number, boolean, color, image, select, array, object | [x] |
| Registry | register, unregister, get, getAll, getByCategory, search | [x] |
| Renderer Registry | rejestracja rendererów dla każdego typu | [x] |
| Default Components | hero, navbar, footer, product-grid, gallery, testimonials, newsletter, content, container | [x] |

---

```
==================== MILESTONE A — Studio działa ==================== [COMPLETED ✅]
```

---

## ETAP 2 — Canvas Engine & Subsystems

---

### Sprint 4 — Canvas (iframe)

| Obszar | Zadania | Status |
|--------|---------|--------|
| PreviewFrame.tsx | iframe wrapper, PostMessage communication | [x] |
| PostMessage | DOCUMENT_UPDATE, SECTION_UPDATE, SECTION_HIGHLIGHT, VIEWPORT_CHANGE, THEME_UPDATE | [x] |
| Nasłuch | ELEMENT_CLICK, ELEMENT_HOVER, ELEMENT_DBLCLICK | [x] |
| Preview Runtime | MemoryChannel, createPostMessageChannel | [x] |
| Selection Overlay | Pozycjonowanie względem iframe, skalowanie z zoomem, synchronizacja z PostMessage | [x] |
| Bounding Box | Wizualne zaznaczenie selected element | [x] |
| Hover Highlight | Podświetlenie na hover | [x] |
| Click → Select | Kliknięcie w iframe → selekcja w builderze | [x] |

---

### Sprint 5A — Layout Engine UI (Flex/Spacing/Size/Position)

| Obszar | Zadania | Status |
|--------|---------|--------|
| Dokumentacja | 31_LAYOUT_PROPERTY_SPECIFICATION, 32_RESPONSIVE_VALUE_MODEL, 33_LAYOUT_COMMANDS | [x] |
| LayoutTypes | SpacingValue, SizeValue, PositionProps, FlexContainerProps + CSS mapping + walidacja | [x] |
| SpacingField | Wizualny edytor 4-stronny padding/margin z toggle linkowania | [x] |
| SizeField | Input + jednostki (px,%,vw,vh,rem,em,auto...) + keyword auto-disable | [x] |
| PositionField | Position type selector (relative/absolute/fixed/sticky) + z-index | [x] |
| FlexField | Display mode + direction + wrap + justify + align + gap | [x] |
| PropertyRegistry | 4 nowe rejestracje ('spacing','size','position','flex') | [x] |
| Integration Review | 6 Gates — ALL PASS | [x] |
| Architecture Freeze | 35_LAYOUT_ENGINE_ARCHITECTURE_FREEZE.md — APPROVED | [x] |

**Status:** ✅ Sprint 5A zamknięty

---

### Sprint 5B.1 — Grid Engine

| Obszar | Zadania | Status |
|--------|---------|--------|
| Dokumentacja | 38_GRID_PROPERTY_SPECIFICATION, 39_GRID_DOMAIN_MODEL, 40_GRID_COMMANDS | [x] |
| GridTypes | TrackBreadcrumb, GridContainerProps, GridItemProps + CSS mapping + walidacja | [x] |
| GridField | Grid tracks editor + grid placement + grid alignment | [x] |
| PropertyRegistry | Rejestracja typów 'grid-tracks', 'grid-track', 'grid-span' | [x] |
| Integration Review | 6 Gates — ALL PASS | [x] |
| Architecture Freeze | 42_GRID_ENGINE_ARCHITECTURE_FREEZE.md — APPROVED | [x] |

**Status:** ✅ Sprint 5B.1 zamknięty

---

### Sprint 5B.2 — Overflow Engine

| Obszar | Zadania | Status |
|--------|---------|--------|
| Dokumentacja | 44_OVERFLOW_PROPERTY_SPECIFICATION, 45_OVERFLOW_COMMANDS | [x] |
| OverflowTypes | OverflowValue (visible/hidden/scroll/auto) + CSS mapping | [x] |
| OverflowField | Edytor overflow dla osi X i Y | [x] |
| PropertyRegistry | Rejestracja pola 'overflow' | [x] |

**Status:** ✅ Sprint 5B.2 zamknięty

---

### Sprint 5B.3 — Border Engine

| Obszar | Zadania | Status |
|--------|---------|--------|
| Dokumentacja | 50_BORDER_PROPERTY_SPECIFICATION.md | [x] |
| BorderTypes | BorderStyle, BorderWidth, BorderProps, borderToCSS(), validateBorder() w `packages/builder-core/src/BorderTypes.ts` | [x] |
| BorderField | `src/components/builder/inspector/fields/BorderField.tsx` | [x] |
| PropertyRegistry | Rejestracja pola 'border' w `propertyFieldRegistry.tsx` | [x] |
| Integration Review | 53_BORDER_INTEGRATION_REVIEW.md | [x] |
| Architecture Freeze | 54_BORDER_ARCHITECTURE_FREEZE.md | [x] |

**Status:** ✅ Sprint 5B.3 zaimplementowany i zweryfikowany

---

### Sprint 5B.4 — Radius Engine

| Obszar | Zadania | Status |
|--------|---------|--------|
| Dokumentacja | 51_RADIUS_PROPERTY_SPECIFICATION.md, 52_RADIUS_COMMANDS.md | [x] (Zamrożona specyfikacja) |
| RadiusTypes | RadiusValue, CornerRadiusProps, radiusToCSS() | [ ] (Oczekuje na kod Agenta 1) |
| RadiusField | Edytor promienia narożników (pojedynczy i 4 narożniki) | [ ] (Oczekuje na kod Agenta 1) |
| PropertyRegistry | Rejestracja pola 'radius' | [ ] |

---

### Sprint 5C — Canvas Completion

| Obszar | Zadania | Status |
|--------|---------|--------|
| Canvas Architecture Spec | 57_CANVAS_COMPLETION_SPECIFICATION.md | [x] |
| Canvas Runtime Contracts | 58_CANVAS_RUNTIME_CONTRACTS.md | [x] |
| BuilderCanvas | Canvas z iframe, overlay, grid, selection | [x] |
| SelectionOverlay | Bounding box, resize handles, toolbar | [x] |
| InspectorSync | Bridge: selection → schema → props | [x] |
| Canvas → Layout Engine | spacingToCSS, sizeToCSS, displayToCSS, positionToCSS | [x] |
| Canvas → Grid Engine | gridContainerToCSS, gridItemToCSS, trackListToCSS | [x] |
| Canvas → Overflow Engine | overflowToCSS | [x] |
| Canvas → Border Engine | borderToCSS | [x] |
| Canvas → Radius Engine | radiusToCSS | [x] |
| Dwukierunkowa synchronizacja | Inspector ↔ Canvas ↔ Runtime | [x] |
| UPDATE_PROPS propagacja | Command Bus → applyCommand → PreviewChannel | [x] |
| Undo/Redo dla 5 subsystemów | HistoryStack przez UPDATE_PROPS | [x] |
| Integration Review | 59_SPRINT5C_INTEGRATION_REVIEW.md — 6 Gates ALL PASS | [x] |
| Architecture Freeze | 60_STUDIO_FOUNDATION_ARCHITECTURE_FREEZE.md — APPROVED | [x] |

**Status:** ✅ Sprint 5C zamknięty — Studio Foundation zakończony

---

### Sprint 6A — Drag & Drop Foundation

| Obszar | Zadania | Status |
|--------|---------|--------|
| Drag & Drop Architecture | 61_DRAG_DROP_ARCHITECTURE.md — architektura, odpowiedzialności, integracje | [x] |
| Drag & Drop Runtime Contracts | 62_DRAG_DROP_RUNTIME_CONTRACTS.md — przepływy, event contracts, preview sync | [x] |
| DragContext (koordynator) | Jedyny właściciel stanu sesji Drag & Drop | [x] |
| DragEngine (pure) | Obliczenia drop target, snapping, walidacja, wybór komendy (istniejący DragEngine.ts) | [x] |
| DragSession | Typ sesji: IDLE → VALIDATING → STARTING → DRAGGING → COMMITTING/CANCELLING → IDLE | [x] |
| DragEvent, DragTarget, DropTarget | Event contracts dla komunikacji Builder ↔ Runtime | [x] |
| Canvas Drag Overlay | Warstwa prezentacji: Ghost Element, Drop Indicator, Cursor Tracking | [x] |
| Command Bus compliance | Finalny Drop: MOVE_SECTION, MOVE_SECTION_TO_PARENT, REORDER_SECTIONS | [x] |
| PreviewChannel sync | PostMessage: DRAG_START, DRAG_MOVE, DRAG_END, DRAG_CANCEL | [x] |
| Integration Review | 63_SPRINT6A_INTEGRATION_REVIEW.md — 8 Gates ALL PASS | [x] |
| Architecture Freeze | 64_DRAG_DROP_FOUNDATION_FREEZE.md — APPROVED | [x] |

**Status:** ✅ Sprint 6A zamknięty — Drag & Drop Foundation gotowy

### Sprint 6B — Smart Guides Foundation

| Obszar | Zadania | Status |
|--------|---------|--------|
| Alignment Guides | Prowadnice wyrównania podczas przeciągania | [ ] |
| Snap to Grid | Przyciąganie do gridu z wizualnymi prowadnicami | [ ] |
| Move | Przeciąganie sekcji w canvasie z prowadnicami | [ ] |
| Reorder | Zmiana kolejności sekcji z prowadnicami | [ ] |

---

```
==================== MILESTONE B — Można budować strony ==================== [W TRAKCIE 🚧]
```

---

## ETAP 3 — Visual Builder (Przyszłe Sprinty Agenta 1)

---

### Sprint 7 — Inspector 2.0
- [x] Inspector Core Accordions & Property Fields
- [x] Integracja z pakietem `@web-factor/ui-core` i `@web-factor/design-tokens`

---

## ETAP 4 — Design System & Platform (Pakiety EP1 – EP11)

- [x] `@web-factor/design-tokens` (Pakiety gotowe)
- [x] `@web-factor/ui-core` (Komponenty UI gotowe)
- [x] `@web-factor/builder-sdk` (Kontrakty SDK gotowe)
- [x] `@web-factor/package-registry` (Zarządzanie manifestami gotowe)
- [x] `@web-factor/plugin-sandbox` (Model uprawnień piaskownicy gotowy)
- [x] `@web-factor/architecture-validator` (Walidator architektury monorepo gotowy)

---

## Definicja ukończenia sprintu (DoD)

- [x] Wszystkie zadania w sprincie zaimplementowane lub udokumentowane
- [x] Testy jednostkowe w pakietach platformowych
- [x] Audyt architektoniczny `113_ARCHITECTURE_READINESS_AUDIT.md` - PASS ✅
- [x] Brak kolizji między pracami Agenta 1 (kod produkcyjny) a Agenta 2 (pakiety & dokumentacja)
- [x] Architecture Baseline v2.0 zamrożone i gotowe
