# Milestone v2.0 — WEB FACTOR Studio Builder Capability Baseline

> **Status:** 📝 Draft — Propozycja do dyskusji  
> **Data:** 2025  
> **Cel:** Zdefiniowanie celu końcowego serii Sprintów 5B (Overflow, Border, Radius) oraz domknięcia Canvas  
> **Zależności:** MILESTONE_v1.md, 37_STUDIO_SUBSYSTEM_ROADMAP.md, 30_PRODUCT_EVOLUTION.md

---

## 1. Pytanie strategiczne

> **Co ma być możliwe w Studio po zakończeniu całej serii Sprintów 5B oraz domknięciu Canvas?**

Odpowiedź na to pytanie określa, czy kolejne subsystemy faktycznie przybliżają projekt do zamierzonej funkcjonalności, czy tylko zwiększają liczbę ukończonych sprintów.

---

## 2. Definicja Milestone v2.0

Milestone v2.0 oznacza, że **WEB FACTOR Studio osiąga stan, w którym użytkownik może wykonać pełny cykl edycji wizualnej** — od wyboru komponentu, przez edycję wszystkich podstawowych właściwości layoutu, po podgląd na żywo w Canvasie.

### Jedno zdanie:

> **"Użytkownik może kliknąć sekcję w Canvasie, edytować dowolną właściwość layoutu w Inspectorze, i zobaczyć efekt natychmiast — bez przeładowania strony."**

---

## 3. Zakres Milestone v2.0

### 3.1 Subsystemy objęte

| # | Subsystem | Sprint | Status początkowy | Wymagany status |
|---|-----------|--------|:-----------------:|:----------------:|
| 1 | Studio Shell | Sprint 1 | 🔒 Frozen | 🔒 Frozen |
| 2 | Builder Core | Sprint 2 | 🔒 Frozen | 🔒 Frozen |
| 3 | Component Registry | Sprint 3 | 🔒 Frozen | 🔒 Frozen |
| 4 | **Canvas (iframe)** | Sprint 4 | 🚧 In Progress | ✅ **Ukończony** |
| 5 | Layout Engine | Sprint 5A | 🔒 Architecture Freeze | 🔒 Frozen |
| 6 | Grid Engine | Sprint 5B.1 | 🔒 Architecture Freeze | 🔒 Frozen |
| 7 | **Overflow** | Sprint 5B.2 | ✅ 🔒 (Architecture Freeze) | 🔒 Architecture Freeze |
| 8 | **Border** | Sprint 5B.3 | 📝 Planned | 🔒 Architecture Freeze |
| 9 | **Radius** | Sprint 5B.4 | 📝 Planned | 🔒 Architecture Freeze |

### 3.2 Co NIE wchodzi w zakres Milestone v2.0

| Element | Powód wykluczenia | Planowany sprint |
|---------|-------------------|:----------------:|
| Drag & Drop | Wymaga Canvas + Smart Guides | Sprint 5C |
| Smart Guides | Wymaga Canvas + Drag & Drop | Sprint 6 |
| Inspector 2.0 | Wykracza poza layout properties | Sprint 7 |
| Constraint Engine | Wymaga stabilnego Canvas | Sprint 9 |
| Responsive Engine | Wymaga UI breakpointów | Sprint 10 |
| AI Assistant | Phase 2 produktu | Sprint 19 |
| Animacje | Phase 2 produktu | Sprint 16 |

---

## 4. User Stories — co użytkownik może zrobić

### 4.1 Podstawowa edycja layoutu

```
Jako użytkownik Studio,
chcę móc edytować wszystkie podstawowe właściwości layoutu sekcji,
aby kontrolować wygląd strony bez pisania CSS.
```

**Kryteria akceptacji:**
- [ ] Mogę ustawić `display: flex` / `grid` / `block` / `none`
- [ ] Mogę ustawić padding i margin (4 strony, linked toggle)
- [ ] Mogę ustawić width i height (z jednostkami: px, %, vw, vh, rem, auto...)
- [ ] Mogę ustawić position (relative, absolute, fixed, sticky) + z-index
- [ ] Mogę ustawić flex direction, wrap, justify, align, gap
- [ ] Mogę ustawić grid template columns/rows (tracki)
- [ ] Mogę ustawić grid placement (column/row span)
- [ ] Mogę ustawić grid alignment (justify/align content/items)
- [ ] **Mogę ustawić overflow (visible, hidden, scroll, auto)**
- [ ] **Mogę ustawić border (style, width, color)**
- [ ] **Mogę ustawić border-radius**

### 4.2 Wizualna interakcja z Canvasem

```
Jako użytkownik Studio,
chcę widzieć moje zmiany na żywo w Canvasie,
aby edycja była intuicyjna i natychmiastowa.
```

**Kryteria akceptacji:**
- [ ] Canvas ładuje stronę w iframe z poprawnym CSS
- [ ] Kliknięcie w element w Canvasie → selekcja w Builderze
- [ ] Zmiana właściwości w Inspectorze → natychmiastowa aktualizacja Canvasu
- [ ] Overlay (bounding box, resize handles) działa poprawnie
- [ ] Hover highlight działa poprawnie
- [ ] Zoom (25%–200%) działa płynnie
- [ ] Viewport switcher (Desktop/Tablet/Mobile) zmienia szerokość Canvasu

### 4.3 Historia i cofanie zmian

```
Jako użytkownik Studio,
chcę móc cofnąć i przywrócić zmiany,
aby eksperymentować bez ryzyka.
```

**Kryteria akceptacji:**
- [ ] Każda zmiana właściwości tworzy wpis w historii
- [ ] Ctrl+Z cofa ostatnią zmianę
- [ ] Ctrl+Shift+Z przywraca cofniętą zmianę
- [ ] Historia ma etykiety (np. "Changed padding", "Set display: flex")
- [ ] Przyciski Undo/Redo w toolbarze są aktywne/dezaktywne

---

## 5. Mapowanie na subsystemy

| User Story | Subsystem | Sprint | Status |
|-----------|-----------|--------|:------:|
| display: flex/grid/block | Layout Engine | 5A | ✅ |
| padding/margin | Layout Engine | 5A | ✅ |
| width/height | Layout Engine | 5A | ✅ |
| position + z-index | Layout Engine | 5A | ✅ |
| flex direction/wrap/justify/align/gap | Layout Engine | 5A | ✅ |
| grid template columns/rows | Grid Engine | 5B.1 | ✅ |
| grid placement | Grid Engine | 5B.1 | ✅ |
| grid alignment | Grid Engine | 5B.1 | ✅ |
| **overflow** | **Overflow** | **5B.2** | ✅ 🔒 |
| **border** | **Border** | **5B.3** | ⏳ |
| **border-radius** | **Radius** | **5B.4** | ⏳ |
| Canvas iframe + live preview | Canvas | 4 | 🚧 |
| Selection + overlay | Canvas | 4 | ✅ (częściowo) |
| Viewport switcher | Canvas | 4 | 🚧 |
| Undo/Redo | Builder Core | 2 | ✅ |

---

## 6. Zależności między subsystemami

```
                    ┌─────────────────────────────┐
                    │      Milestone v2.0          │
                    │  "Pełna edycja wizualna"     │
                    └─────────────────────────────┘
                                │
         ┌──────────────────────┼──────────────────────┐
         │                      │                      │
         ▼                      ▼                      ▼
   ┌──────────┐          ┌──────────┐          ┌──────────┐
   │  Layout  │          │  Canvas  │          │  Builder │
   │  Engine  │          │ (iframe) │          │   Core   │
   │  (5A)    │          │  (4)     │          │   (2)    │
   └────┬─────┘          └────┬─────┘          └────┬─────┘
        │                     │                     │
        ├── Overflow (5B.2)   │                     │
        ├── Border   (5B.3)   │                     │
        └── Radius   (5B.4)   │                     │
                               │                     │
                               └─────────────────────┘
                                      │
                                      ▼
                              ┌──────────────┐
                              │   History    │
                              │  (Undo/Redo) │
                              └──────────────┘
```

### Kluczowe zależności:

| Zależność | Typ | Uzasadnienie |
|-----------|-----|-------------|
| Overflow → LayoutTypes | Silna | OverflowProps już istnieją w LayoutTypes.ts — model gotowy |
| Border → LayoutTypes | Silna | Border wymaga nowego modelu domenowego (nowy plik lub rozszerzenie) |
| Radius → LayoutTypes | Silna | Radius wymaga nowego modelu domenowego |
| Canvas → Layout Engine | Silna | Canvas renderuje CSS wygenerowany przez Layout Engine |
| Canvas → Selection | Silna | Kliknięcie w Canvas → selekcja → Inspector |
| Canvas → PostMessage | Silna | Komunikacja między iframe a Builderem |

---

## 7. Kryteria uznania Milestone v2.0 za zakończony

- [ ] **Wszystkie 9 subsystemów** w stanie 🔒 Frozen lub 🔒 Architecture Freeze
- [ ] **Canvas (iframe) ukończony** — live preview, selection, overlay, zoom, viewport switcher
- [ ] **Overflow** — Architecture Freeze (Sprint 5B.2)
- [ ] **Border** — Architecture Freeze (Sprint 5B.3)
- [ ] **Radius** — Architecture Freeze (Sprint 5B.4)
- [ ] **Pełny cykl edycji działa** — kliknij w Canvas → edytuj w Inspectorze → zobacz efekt na żywo
- [ ] **Wszystkie 11 właściwości layoutu** dostępne w Inspectorze (spacing, size, position, flex, grid, overflow, border, radius)
- [ ] **Undo/Redo** działa dla wszystkich zmian layoutu
- [ ] **Testy jednostkowe** przechodzą dla wszystkich subsystemów (w izolacji od infra issues)
- [ ] **Integration Review** dla każdego subsystemu — 6 Gates ALL PASS
- [ ] **Architecture Freeze** dla każdego subsystemu — APPROVED

---

## 8. Plan osiągnięcia Milestone v2.0

### Sprint 5B.2 — Overflow (test skalowalności procesu) — ✅ ZAMKNIĘTY

| Faza | Artefakt | Status |
|------|----------|:------:|
| 1. Specification | 44_OVERFLOW_PROPERTY_SPECIFICATION.md | ✅ |
| 2. Contracts | 45_OVERFLOW_COMMANDS.md | ✅ |
| 3. Domain Model | Rozszerzenie LayoutTypes.ts (istnieje) | ✅ |
| 4. Core Implementation | Walidacja + CSS mapping dla overflow | ✅ |
| 5. Registry | Rejestracja 'overflow' w PropertyRegistry | ✅ |
| 6. React UI | OverflowField.tsx | ✅ |
| 7. Integration Review | 46_SPRINT5B2_INTEGRATION_REVIEW.md | ✅ |
| 8. Architecture Freeze | 47_OVERFLOW_ARCHITECTURE_FREEZE.md | ✅ — APPROVED |

**Cel Sprintu 5B.2:** ✅ Osiągnięty — proces 8-fazowy jest efektywny również dla małych subsystemów.

### Sprint 5B.3 — Border

| Faza | Artefakt | Status początkowy |
|------|----------|:-----------------:|
| 1. Specification | 48_BORDER_PROPERTY_SPECIFICATION.md | ⏳ Nowy |
| 2. Contracts | 49_BORDER_COMMANDS.md | ⏳ Nowy |
| 3. Domain Model | BorderTypes.ts (nowy plik) | ⏳ Nowy |
| 4. Core Implementation | Walidacja + CSS mapping dla border | ⏳ Nowe |
| 5. Registry | Rejestracja 'border' w PropertyRegistry | ⏳ Nowe |
| 6. React UI | BorderField.tsx | ⏳ Nowy |
| 7. Integration Review | 50_SPRINT5B3_INTEGRATION_REVIEW.md | ⏳ Nowy |
| 8. Architecture Freeze | 51_BORDER_ARCHITECTURE_FREEZE.md | ⏳ Nowy |

### Sprint 5B.4 — Radius

| Faza | Artefakt | Status początkowy |
|------|----------|:-----------------:|
| 1. Specification | 52_RADIUS_PROPERTY_SPECIFICATION.md | ⏳ Nowy |
| 2. Contracts | 53_RADIUS_COMMANDS.md | ⏳ Nowy |
| 3. Domain Model | RadiusTypes.ts (nowy plik) | ⏳ Nowy |
| 4. Core Implementation | Walidacja + CSS mapping dla radius | ⏳ Nowe |
| 5. Registry | Rejestracja 'radius' w PropertyRegistry | ⏳ Nowe |
| 6. React UI | RadiusField.tsx | ⏳ Nowy |
| 7. Integration Review | 54_SPRINT5B4_INTEGRATION_REVIEW.md | ⏳ Nowy |
| 8. Architecture Freeze | 55_RADIUS_ARCHITECTURE_FREEZE.md | ⏳ Nowy |

### Sprint 5C — Canvas Completion

| Obszar | Zadania | Status początkowy |
|--------|---------|:-----------------:|
| PreviewFrame.tsx | iframe wrapper, PostMessage communication | ◐ W trakcie |
| PostMessage | DOCUMENT_UPDATE, SECTION_UPDATE, SECTION_HIGHLIGHT, VIEWPORT_CHANGE, THEME_UPDATE | ◐ W trakcie |
| Nasłuch | ELEMENT_CLICK, ELEMENT_HOVER, ELEMENT_DBLCLICK | ◐ W trakcie |
| Preview Runtime | MemoryChannel, createPostMessageChannel | ◐ W trakcie |
| Selection Overlay | Pozycjonowanie względem iframe, skalowanie z zoomem | ✅ Gotowe |
| Bounding Box | Wizualne zaznaczenie selected element | ✅ Gotowe |
| Hover Highlight | Podświetlenie na hover | ✅ Gotowe |
| Click → Select | Kliknięcie w iframe → selekcja w builderze | ✅ Gotowe |
| **Viewport** | Desktop/Tablet/Mobile, płynne przejścia, device frames | ⏳ Do zrobienia |
| **Zoom** | 25%–200%, Ctrl+Scroll, fit to width, presety | ⏳ Do zrobienia |
| **Grid Overlay** | 12-kolumnowy grid overlay, snap to grid | ⏳ Do zrobienia |
| **Cleanup** | Usunięcie wireframe SectionBlock, czyszczenie starych komponentów | ⏳ Do zrobienia |

---

## 9. Co Milestone v2.0 umożliwia dalej

Po osiągnięciu Milestone v2.0, projekt będzie gotowy na:

### Sprint 5C — Drag & Drop
- Przeciąganie sekcji w Canvasie
- Reorder sekcji
- Insert z panelu komponentów
- Ghost preview, drop zones, drag handles

### Sprint 6 — Smart Guides
- Alignment guides
- Spacing guides
- Center guides
- Snap to grid / elements
- Distance indicators

### Sprint 7 — Inspector 2.0
- Pełny Inspector z kategoriami (Typography, Background, Effects, SEO, Accessibility)
- Batch editing dla multi-select
- Wszystkie field types (StringField, NumberField, ColorField, SelectField, itd.)

### Sprint 9 — Constraint Engine
- Left/Right/Top/Bottom/Stretch/Center/Scale
- Per-breakpoint constraints

### Sprint 10 — Responsive Engine
- Desktop/Tablet/Mobile breakpoints
- Simultaneous view
- Hide/Override per breakpoint

---

## 10. Mierniki sukcesu Milestone v2.0

| Metryka | Target | Jak mierzyć |
|---------|--------|-------------|
| Czas pełnego cyklu edycji | < 30s | Od kliknięcia w Canvas do zmiany właściwości i zobaczenia efektu |
| Liczba edytowalnych właściwości layoutu | 11 | Spacing, Size, Position, Flex, Grid, Overflow, Border, Radius |
| Canvas → Inspector → Canvas latency | < 50ms | Performance measurement |
| Undo/Redo reliability | 100% | Testy automatyczne |
| Testy jednostkowe | ≥ 80% pokrycia | Dla każdego subsystemu |
| Integration Review Gates | ALL PASS | 6 Gates per subsystem |
| Architecture Freeze | APPROVED | Dla każdego subsystemu |

---

## 11. Ryzyka i mitigacje

| Ryzyko | Prawdopodobieństwo | Wpływ | Mitigacja |
|--------|:------------------:|:-----:|-----------|
| Canvas opóźnia się i blokuje Sprint 5C | 🟡 Medium | 🔴 Wysoki | Priorytetyzacja Canvas w Sprint 5C; równoległa praca nad 5B.2–5B.4 |
| Overflow okazuje się większy niż zakładano | 🟢 Niskie | 🟡 Średni | Model już istnieje w LayoutTypes.ts — zakres jest mały |
| Border/Radius wymagają zmian w LayoutTypes | 🟡 Medium | 🟡 Średni | Nowe pliki (BorderTypes.ts, RadiusTypes.ts) — brak refactoringu istniejącego kodu |
| Infra testowa nadal nie działa | 🟡 Medium | 🟡 Średni | Osobne zadanie — testy jednostkowe w izolacji |
| Pre-existing TS error w mission-control | 🟢 Niskie | 🟢 Niski | Niezwiązane z subsystemami Studio |

---

## 12. Podsumowanie

Milestone v2.0 to **moment, w którym Studio przestaje być zbiorem subsystemów, a staje się narzędziem** — użytkownik może wykonać pełny cykl edycji wizualnej bez wychodzenia poza Studio.

### Co odróżnia Milestone v2.0 od v1.0:

| Aspekt | v1.0 | v2.0 |
|--------|------|------|
| Perspektywa | Architektoniczna | **Użytkownika** |
| Pytanie | "Czy architektura jest stabilna?" | **"Czy użytkownik może edytować stronę?"** |
| Subsystemy | 6 (w tym 2 Architecture Freeze) | 9 (wszystkie 🔒) |
| Canvas | 🚧 In Progress | ✅ Ukończony |
| Właściwości layoutu | 8 (spacing, size, position, flex, grid) | **11 (+ overflow, border, radius)** |
| Proces | Zweryfikowany na 2 subsystemach | **Zweryfikowany na 5 subsystemach** |

### Następny krok po Milestone v2.0:

```
Milestone v2.0
    ↓
Sprint 5C — Drag & Drop + Canvas Completion
    ↓
Sprint 6  — Smart Guides
    ↓
Sprint 7  — Inspector 2.0
    ↓
Sprint 9  — Constraint Engine
    ↓
Sprint 10 — Responsive Engine
    ↓
Milestone B: "Można budować strony."  ← Cel z roadmapy (37_STUDIO_SUBSYSTEM_ROADMAP.md)
```

---

## Załączniki

1. `docs/studio/MILESTONE_v1.md` — Poprzedni milestone
2. `docs/studio/37_STUDIO_SUBSYSTEM_ROADMAP.md` — Pełna roadmapa
3. `docs/studio/30_PRODUCT_EVOLUTION.md` — Produktowa strategia rozwoju
4. `docs/studio/17_STUDIO_GOLDEN_FLOW.md` — Główny przepływ użytkownika

---

```
Milestone v2.0 — WEB FACTOR Studio Builder Capability Baseline
Status: 📝 Draft — Propozycja do dyskusji
Data: 2025

Podpis: ________________________
```

