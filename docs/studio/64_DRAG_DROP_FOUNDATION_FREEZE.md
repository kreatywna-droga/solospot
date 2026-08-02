# Sprint 6A — Drag & Drop Foundation Architecture Freeze

> **Status:** ✅ APPROVED
> **Data:** 2025
> **Sprint:** 6A — Drag & Drop Foundation
> **Cel:** Formalne utrwalenie architektury Drag & Drop Foundation przed rozpoczęciem Sprintu 6B — Smart Guides Foundation

---

## 1. Scope

Niniejszy Architecture Freeze obejmuje wszystkie moduły Drag & Drop Foundation zrealizowane w Sprincie 6A:

| Moduł | Sprint | Odpowiedzialność |
|-------|--------|-----------------|
| Drag & Drop Architecture | 6A (docs) | Architektura, odpowiedzialności, integracje |
| Drag & Drop Runtime Contracts | 6A (docs) | Przepływy, event contracts, synchronizacja |
| DragContext (koordynator) | 6A (architektura) | Zarządzanie sesją Drag & Drop |
| DragEngine (pure) | 6A (istniejący) | Obliczenia drop target, snapping, walidacja |

---

## 2. Diagram przepływu Drag Session

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       DRAG SESSION LIFECYCLE                            │
│                                                                         │
│  ┌──────────────┐                                                       │
│  │   IDLE       │                                                       │
│  │   (no drag)  │                                                       │
│  └──────┬───────┘                                                       │
│         │ mousedown on draggable section                                │
│         ▼                                                               │
│  ┌──────────────┐     DragEngine         ┌──────────────────────┐      │
│  │  VALIDATING  │─────validateDrag()─────│  VALID / INVALID     │      │
│  └──────┬───────┘                        └──────────────────────┘      │
│         │ VALID                                                         │
│         ▼                                                               │
│  ┌──────────────┐     DragEngine         ┌──────────────────────┐      │
│  │   STARTING   │─────createSession()───→│  DragSession(id)     │      │
│  └──────┬───────┘                        └──────────────────────┘      │
│         │ Session created                                               │
│         ▼                                                               │
│  ┌──────────────┐     DragEngine         ┌──────────────────────┐      │
│  │   DRAGGING   │◄────mousemove─────────│  computeDropTarget()  │      │
│  │   (ACTIVE)   │─────→snapDragToGrid() │  updateDropIndicator  │      │
│  └──┬───────┬───┘                        └──────────────────────┘      │
│     │       │                                                           │
│     │       │ mouseup                    Escape                        │
│     │       ▼                            ▼                              │
│     │  ┌──────────────┐           ┌──────────────┐                     │
│     │  │  COMMITTING  │           │  CANCELLING  │                     │
│     │  └──────┬───────┘           └──────┬───────┘                     │
│     │         │                          │                              │
│     │         ▼                          ▼                              │
│     │  ┌──────────────┐           ┌──────────────┐                     │
│     │  │  DISPATCHING │           │  CLEANING UP │                     │
│     │  │  Command Bus │           └──────┬───────┘                     │
│     │  └──────┬───────┘                  │                              │
│     │         │                          │                              │
│     │         ▼                          ▼                              │
│     │  ┌──────────────┐           ┌──────────────┐                     │
│     │  │  HISTORY +   │           │   CANCEL     │                     │
│     │  │  PREVIEW     │           │   COMPLETE   │                     │
│     │  └──────┬───────┘           └──────┬───────┘                     │
│     │         │                          │                              │
│     └─────────┼──────────────────────────┘                              │
│               ▼                                                         │
│        ┌──────────────┐                                                 │
│        │    IDLE      │                                                 │
│        │  (cleanup)   │                                                 │
│        └──────────────┘                                                 │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Diagram zależności

```
                    ┌──────────────────┐
                    │   DragContext    │  ← koordynator sesji
                    │  (koordynator)  │
                    └──┬───┬───┬───┬──┘
                       │   │   │   │
         ┌─────────────┘   │   │   └─────────────┐
         ▼                 ▼   ▼                  ▼
┌────────────────┐  ┌──────────────┐  ┌──────────────────┐
│   DragEngine   │  │    Canvas    │  │   Command Bus    │
│   (pure)       │  │  (prezent.)  │  │  (dispatch)      │
│                │  │              │  │                  │
│ computeDropTar │  │ Drag Overlay │  │ MOVE_SECTION     │
│ snapDragToGrid │  │ Ghost        │  │ REORDER          │
│ validateDrag   │  │ DropIndicat  │  │ MOVE_TO_PARENT   │
│ selectCommand  │  │ Cursor Track │  │                  │
└────────────────┘  └──────┬───────┘  └──────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Preview    │
                    │  Channel     │
                    │  (PostMess.) │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Runtime    │
                    │   (iframe)   │
                    └──────────────┘

    Zależności modułów:
    ──────────────────
    DragContext → DragEngine (obliczenia)
    DragContext → Canvas     (prezentacja overlay)
    DragContext → CommandBus (finalny drop)
    DragContext → Preview    (synchronizacja)
    DragEngine  → BuilderCommands (wybór komendy)
    DragEngine  → CanvasState (walidacja locked/hidden)
    Canvas      → DragContext (mousedown, mousemove, mouseup)
    Canvas      → Preview    (PostMessage drag events)

    Brak zależności zwrotnych:
    ─────────────────────────
    DragEngine  → DragContext  ❌ (nie importuje)
    Canvas      → DragEngine   ❌ (nie importuje)
    Runtime     → DragEngine   ❌ (nie zawiera logiki drag)
    Runtime     → DragContext  ❌ (nie importuje)
```

---

## 4. Integration Review Summary

### 8 Gates — Wyniki

| Gate | Wynik | Uzasadnienie |
|------|-------|-------------|
| **Gate 1 — No regression Studio Foundation** | ✅ PASS | 9 zamrożonych subsystemów nienaruszonych. Żadna istniejąca funkcja w builder-core/index.ts nie została zmodyfikowana. |
| **Gate 2 — No domain logic in Canvas** | ✅ PASS | Canvas pozostaje warstwą prezentacji. Drag Overlay, Ghost Element, Drop Indicator są wyłącznie wizualne. |
| **Gate 3 — No circular dependencies** | ✅ PASS | DragEngine nie importuje DragContext. Canvas nie importuje DragEngine. Runtime nie importuje DragContext/DragEngine. |
| **Gate 4 — Clean Runtime contracts** | ✅ PASS | Runtime komunikuje się przez PreviewChannel z istniejącymi typami wiadomości. |
| **Gate 5 — Command Bus compliance** | ✅ PASS | Finalny Drop: MOVE_SECTION, MOVE_SECTION_TO_PARENT, REORDER_SECTIONS. |
| **Gate 6 — Architecture docs match implementation** | ✅ PASS | Dokumentacja 61, 62 zgodna z istniejącym kodem. |
| **Gate 7 — Drag Session Lifecycle** | ✅ PASS | Pełny cykl: IDLE → VALIDATING → STARTING → DRAGGING → COMMITTING/CANCELLING → IDLE. |
| **Gate 8 — Runtime Isolation** | ✅ PASS | Runtime nie zawiera logiki Drag & Drop. Builder jest właścicielem interakcji. |

### Ogólna ocena

```
[x] ALL PASS — wszystkie bramki zaliczone
[ ] MINOR ISSUES — wymagane poprawki przed Architecture Freeze
[ ] FAIL — wymagane poprawki przed przejściem dalej
```

---

## 5. Accepted Decisions

| # | Decyzja | Uzasadnienie |
|---|---------|-------------|
| **D1** | DragContext jako jedyny koordynator | Centralizacja stanu sesji. Canvas jako warstwa prezentacji. |
| **D2** | DragEngine jako pure module | Obliczenia drop target, snapping, walidacja. Zero side effects. |
| **D3** | Istniejące komendy zamiast nowych | MOVE_SECTION, MOVE_SECTION_TO_PARENT, REORDER_SECTIONS wystarczające. |
| **D4** | PreviewChannel jako jedyny kanał Runtime | Brak alternatywnych kanałów komunikacji. |
| **D5** | DragSession jako tymczasowy byt | Żyje tylko podczas przeciągania. Usuwany po zakończeniu. |
| **D6** | DropTarget jako wynik obliczeń | Obliczany przy każdym move. Nie przechowywany jako stan. |
| **D7** | Pending command jako podgląd | Przewidywana komenda przed finalnym dispatch. |

---

## 6. Deferred Work — Sprint 6B (Smart Guides Foundation)

Następujące elementy zostały celowo przeniesione do Sprintu 6B:

| # | Element | Przeniesiono do | Uzasadnienie |
|---|---------|----------------|-------------|
| **W1** | Smart Guides (alignment guides) | Sprint 6B | Wymaga osobnej architektury i integracji z Drag Engine |
| **W2** | Constraint Engine | Sprint 9 | Zależny od Layout Engine i Smart Guides |
| **W3** | Multi-select drag | Sprint 6B+ | Wymaga rozszerzenia SelectionEngine |
| **W4** | Touch / Mobile support | Późniejszy | Wymaga testów na urządzeniach mobilnych |
| **W5** | Auto-scroll podczas drag | Sprint 6B | Wymaga integracji z Canvas scroll |
| **W6** | Animacje ghost elementu | Sprint 6B | Wymaga Framer Motion i optymalizacji |
| **W7** | Drop zone visual hints | Sprint 6B | Zaawansowane wizualne wskazówki dropu |

---

## 7. Lista ukończonych modułów (Sprint 6A)

| Moduł | Dokumentacja | Typ | Status |
|-------|:-----------:|:---:|:------:|
| Drag & Drop Architecture | 61_DRAG_DROP_ARCHITECTURE.md | Architektura | ✅ Frozen |
| Runtime Contracts | 62_DRAG_DROP_RUNTIME_CONTRACTS.md | Kontrakty | ✅ Frozen |
| DragContext (koordynator) | 61 + 62 | Architektura | ✅ Zdefiniowany |
| DragEngine (pure) | 61 + 62 (istniejący DragEngine.ts) | Core | ✅ Istnieje |
| DragSession | 62 | Typ | ✅ Zdefiniowany |
| DragEvent | 62 | Typ | ✅ Zdefiniowany |
| DragTarget | 62 | Typ | ✅ Zdefiniowany |
| DropTarget | 62 | Typ | ✅ Zdefiniowany |
| Canvas Drag Overlay | 61 | Prezentacja | ✅ Zdefiniowany |
| Ghost Element | 61 | Prezentacja | ✅ Zdefiniowany |
| Drop Indicator | 61 | Prezentacja | ✅ Zdefiniowany |
| Integration Review | 63_SPRINT6A_INTEGRATION_REVIEW.md | Review | ✅ 8 Gates PASS |

---

## 8. Final Decision

```
Data przeglądu: 2025
Przeglądający: Architecture Freeze Review

Decyzja:
[x] APPROVED — Drag & Drop Foundation zatwierdzony, Sprint 6A zamknięty
[ ] APPROVED WITH ACTIONS — wymagane działania przed zamknięciem
[ ] REJECTED — wymagane poprawki przed ponownym przeglądem

Uzasadnienie:
Wszystkie 8 Gates Integration Review przeszły pozytywnie.

Architektura Drag & Drop Foundation jest spójna z decyzjami projektowymi Studio Foundation:
- DragContext jako jedyny koordynator sesji
- DragEngine jako pure module (obliczenia, zero side effects)
- Canvas jako warstwa prezentacji (Drag Overlay, Ghost, Drop Indicator)
- Runtime przez PreviewChannel (PostMessage)
- Command Bus dla finalnego Drop (MOVE_SECTION, REORDER, MOVE_TO_PARENT)
- Brak nowych komend domenowych
- Brak regresji na 9 zamrożonych subsystemach

Deferred work (W1-W7) zostało przeniesione do Sprintu 6B i dalszych sprintów.

Sprint 6A jest gotowy do zamknięcia. Kolejny etap: Sprint 6B — Smart Guides Foundation.

Podpis: ________________________
Data: ________________________
```

---

## Załączniki

1. `docs/studio/61_DRAG_DROP_ARCHITECTURE.md` — Architektura
2. `docs/studio/62_DRAG_DROP_RUNTIME_CONTRACTS.md` — Runtime Contracts
3. `docs/studio/63_SPRINT6A_INTEGRATION_REVIEW.md` — Integration Review (8 Gates)
4. `packages/builder-core/src/DragEngine.ts` — Drag Engine (pure)
5. `packages/builder-core/src/CanvasState.ts` — DragState, BEGIN_DRAG, UPDATE_DRAG, END_DRAG
6. `packages/builder-core/src/BuilderContext.ts` — Dispatch CANVAS drag actions + preview sync
7. `packages/builder-core/src/BuilderCommands.ts` — MOVE_SECTION, MOVE_SECTION_TO_PARENT, REORDER_SECTIONS

