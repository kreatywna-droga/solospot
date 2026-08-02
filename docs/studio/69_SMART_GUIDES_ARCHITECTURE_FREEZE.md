# Smart Guides Foundation — Architecture Freeze

> **Status:** ✅ APPROVED
> **Data:** 2025
> **Sprint:** 6B — Smart Guides Foundation
> **Cel:** Formalne utrwalenie architektury Smart Guide Engine przed rozpoczęciem Sprintu 6C — Constraint Engine

---

## 1. Scope

Niniejszy Architecture Freeze obejmuje wszystkie moduły Smart Guide Engine zrealizowane w Sprincie 6B:

| Moduł | Sprint | Odpowiedzialność |
|-------|--------|-----------------|
| Smart Guide Types Specification | 6B (docs) | Definicja typów prowadnic, modeli danych, konfiguracji |
| Smart Guide Commands | 6B (docs) | Kontrakt: DragEngine → SmartGuideEngine → Canvas |
| Smart Guide Runtime Contracts | 6B (docs) | Przepływ renderowania, selekcji, aktualizacji |
| SmartGuideTypes | 6B (builder-core) | Model domenowy: GuideType, ElementBounds, SmartGuide, SnapGuidance |
| SmartGuideEngine | 6B (builder-core) | Silnik obliczeniowy: 4 kalkulatory + agregator |
| SmartGuidesOverlay | 6B (React UI) | Renderowanie SVG prowadnic na Canvasie |
| useSmartGuides | 6B (React UI) | Hook mostujący DragContext → Engine → Overlay |
| GuidesToggle | 6B (React UI) | UI przełącznik widoczności prowadnic |

---

## 2. Reviewed Artifacts

### Dokumentacja (docs/studio/)

| Artifakt | Wersja | Uwagi |
|----------|--------|-------|
| `65_SMART_GUIDES_SPECIFICATION.md` | Sprint 6B | Specyfikacja typów prowadnic i architektury |
| `66_SMART_GUIDES_COMMANDS.md` | Sprint 6B | Kontrakt komend i przepływu danych |
| `67_SMART_GUIDES_RUNTIME_CONTRACTS.md` | Sprint 6B | Kontrakty runtime |
| `68_SPRINT6B_INTEGRATION_REVIEW.md` | Sprint 6B | Wyniki Integration Review (6 Gates) |

### builder-core (packages/builder-core/src/)

| Artifakt | Wersja | Uwagi |
|----------|--------|-------|
| `SmartGuideTypes.ts` | Sprint 6B (NEW) | Model domenowy: GuideType, ElementBounds, SmartGuide, SnapGuidance, SmartGuideConfig |
| `SmartGuideEngine.ts` | Sprint 6B (NEW) | Silnik: AlignmentCalculator, CenterCalculator, DistanceCalculator, SpacingCalculator, SnapCalculator, GuideAggregator |
| `index.ts` | Sprint 6B (MOD) | Publiczny export SmartGuideTypes i SmartGuideEngine |
| `__tests__/smart-guide-engine.test.ts` | Sprint 6B (NEW) | 28 testów, pełne pokrycie |

### React UI (src/components/builder/canvas/guides/)

| Artifakt | Wersja | Uwagi |
|----------|--------|-------|
| `SmartGuidesOverlay.tsx` | Sprint 6B (NEW) | SVG overlay — pure presentation |
| `useSmartGuides.ts` | Sprint 6B (NEW) | Hook — bridge między DragContext a Engine |
| `GuidesToggle.tsx` | Sprint 6B (NEW) | UI toggle — włącz/wyłącz prowadnice |

---

## 3. Integration Review Summary

### 6 Gates — Wyniki

| Gate | Wynik | Uzasadnienie |
|------|-------|-------------|
| **Gate 1 — Pure Function Architecture** | ✅ PASS | SmartGuideEngine w 100% pure TypeScript, zero zależności od React/DOM/Canvas. Wszystkie funkcje deterministyczne. |
| **Gate 2 — Calculator Modularity** | ✅ PASS | 4 kalkulatory (Alignment, Center, Distance, Spacing) + SnapCalculator + GuideAggregator. Każdy implementuje GuideCalculator interface. |
| **Gate 3 — Test Coverage** | ✅ PASS | 28 testów: 6 Alignment, 3 Center, 4 Distance, 3 Spacing, 3 Snap, 11 E2E. Pełne pokrycie edge cases. |
| **Gate 4 — Public API** | ✅ PASS | Wszystkie typy i engine wyeksportowane z builder-core. Kalkulatory wewnętrzne nie są eksportowane. |
| **Gate 5 — Canvas Integration** | ✅ PASS | Zero logiki prowadnic w BuilderCanvas.tsx. Canvas tylko renderuje SVG overlay. |
| **Gate 6 — Architecture Conformance** | ✅ PASS | Pełna zgodność z DR-SMARTGUIDE-001–005 i DR-CANVAS-COMP-001. |

### Ogólna ocena

```
[x] ALL PASS — wszystkie bramki zaliczone
[ ] MINOR ISSUES — wymagane poprawki przed Architecture Freeze
[ ] FAIL — wymagane poprawki przed przejściem dalej
```

---

## 4. Accepted Decisions

Następujące decyzje architektoniczne zostają utrzymane:

| # | Decyzja | Uzasadnienie |
|---|---------|-------------|
| **D1** | Pure computation engine w builder-core | SmartGuideEngine jest w 100% pure TypeScript. Zero zależności od React, DOM, Canvas. Może być testowany bez środowiska przeglądarki. |
| **D2** | Modular calculators z GuideCalculator interface | Każdy kalkulator implementuje wspólny interfejs. Nowe typy prowadnic mogą być dodane bez modyfikacji istniejących kalkulatorów. |
| **D3** | SVG overlay z pointer-events: none | SVG jest deklaratywny i bezpieczny. pointer-events: none zapewnia, że prowadnice nie przeszkadzają w interakcjach. |
| **D4** | Delegacja snapa do DragEngine | SmartGuideEngine oblicza snap guidance, ale nie aplikuje go. DragEngine jest odpowiedzialny za nałożenie offsetu na pozycję elementu. |
| **D5** | Konfiguracja przez CanvasState (GridConfig) | Konfiguracja prowadnic jest przechowywana w CanvasState. Żaden dedykowany store nie jest potrzebny. |
| **D6** | Extensible przez rejestrację kalkulatorów w konstruktorze | SmartGuideEngine przyjmuje opcjonalną tablicę kalkulatorów w konstruktorze. Nowe kalkulatory mogą być dodane z zewnątrz. |

---

## 5. Accepted Minor Issues

Brak.

---

## 6. Deferred Work

Następujące elementy zostały celowo przeniesione do kolejnych sprintów:

| # | Element | Przeniesiono do | Uzasadnienie |
|---|---------|----------------|-------------|
| **W1** | Prowadnice ANCHOR dla Constraint Engine | Sprint 6C | Constraint Engine doda nowy typ GuideType.ANCHOR, który będzie renderowany przez ten sam SmartGuidesOverlay. |
| **W2** | Prowadnice MARGIN (padding/margin indicators) | Sprint 6C | Wymaga integracji z LayoutEngine — pokazywanie padding/margin podczas dragu wewnątrz kontenera. |
| **W3** | Shift podczas dragu tymczasowo wyłącza snap | Sprint 6C | Standardowe zachowanie w Figmie. Wymaga modyfikacji DragEngine i KeyboardController. |
| **W4** | Rulers (linijki) na Canvasie | Późniejszy | Wymaga nowego kalkulatora RulerCalculator. Nie jest wymagane dla MVP. |

---

## 7. Final Decision

```
Data przeglądu: 2025
Przeglądający: Architecture Freeze Review

Decyzja:
[x] APPROVED — Smart Guide Engine zatwierdzony, Sprint 6B zamknięty
[ ] APPROVED WITH ACTIONS — wymagane działania przed zamknięciem
[ ] REJECTED — wymagane poprawki przed ponownym przeglądem

Uzasadnienie:
Wszystkie 6 Gates Integration Review przeszły pozytywnie.

Architektura Smart Guide Engine jest spójna z decyzjami projektowymi Layout, Grid, Overflow,
Border, Radius i Drag & Drop:
- SmartGuideTypes jako centralny model domenowy w builder-core
- SmartGuideEngine jako pure computation engine
- Modular calculators z GuideCalculator interface — extensible
- SVG overlay jako warstwa prezentacji — zero logiki
- useSmartGuides hook jako most między DragContext a Engine
- Brak własnych komend — delegacja do DragEngine

Zaakceptowane minor issues: brak.
Deferred work (W1-W4) zostało przeniesione do Sprintu 6C i dalszych sprintów.

Smart Guide Engine jest szóstym subsystemem Canvas, który przeszedł pełny 8-fazowy proces
inżynierski. Potwierdza to dojrzałość procesu i architektury Studio.

Sprint 6B jest gotowy do zamknięcia. Kolejny etap: Sprint 6C — Constraint Engine.

Podpis: ________________________
Data: ________________________
```

---

## Załączniki

1. `docs/studio/65_SMART_GUIDES_SPECIFICATION.md` — Specyfikacja prowadnic
2. `docs/studio/66_SMART_GUIDES_COMMANDS.md` — Kontrakt komend
3. `docs/studio/67_SMART_GUIDES_RUNTIME_CONTRACTS.md` — Kontrakty runtime
4. `docs/studio/68_SPRINT6B_INTEGRATION_REVIEW.md` — Integration Review
5. `packages/builder-core/src/SmartGuideTypes.ts` — Model domenowy
6. `packages/builder-core/src/SmartGuideEngine.ts` — Silnik obliczeniowy
7. `packages/builder-core/src/__tests__/smart-guide-engine.test.ts` — Testy (28 testów)
8. `src/components/builder/canvas/guides/SmartGuidesOverlay.tsx` — SVG overlay
9. `src/components/builder/canvas/guides/useSmartGuides.ts` — Hook
10. `src/components/builder/canvas/guides/GuidesToggle.tsx` — UI toggle
