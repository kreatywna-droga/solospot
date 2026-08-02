# Sprint 6A — Drag & Drop Architecture

> **Status:** ✅ Zatwierdzone
> **Sprint:** 6A — Drag & Drop Foundation
> **Cel:** Definicja architektury systemu Drag & Drop, odpowiedzialności modułów, integracji z Canvas, Runtime i Component Registry
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 03_CANVAS_ENGINE.md, 05_DRAG_DROP_ENGINE.md, 60_STUDIO_FOUNDATION_ARCHITECTURE_FREEZE.md

---

## 1. Architektura Drag & Drop

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BUILDER STUDIO                                   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     DRAG CONTEXT (koordynator)                    │   │
│  │                                                                   │   │
│  │  - Zarządza sesją przeciągania (DragSession)                      │   │
│  │  - Przechowuje stan: DragState                                    │   │
│  │  - Koordynuje DragEngine → Canvas → Runtime                       │   │
│  │  - Jedyny właściciel stanu sesji                                  │   │
│  └──────────────────────┬──────────────────────────────────────────┘   │
│                         │                                                │
│         ┌───────────────┼───────────────┐                                │
│         ▼               ▼               ▼                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                         │
│  │ DragEngine │  │   Canvas   │  │  Command   │                         │
│  │  (pure)    │  │  (prezent) │  │   Bus      │                         │
│  │            │  │            │  │            │                         │
│  │ obliczenia │  │ Drag Overlay│  │ MOVE_SECT  │                         │
│  │ drop target│  │ Ghost      │  │ REORDER    │                         │
│  │ snapping   │  │ Cursor     │  │ MOVE_TO_PAR│                         │
│  │ walidacja  │  │ Highlight  │  │            │                         │
│  └────────────┘  └────────────┘  └────────────┘                         │
│                         │                                                │
│                         ▼                                                │
│                  ┌────────────┐                                          │
│                  │  Runtime   │                                          │
│                  │ (iframe)   │                                          │
│                  │            │                                          │
│                  │ PostMessage│                                          │
│                  │ drag events│                                          │
│                  └────────────┘                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Zasady architektoniczne

| Zasada | Opis |
|--------|------|
| **DragContext jako jedyny koordynator** | DragContext jest jedynym właścicielem stanu sesji Drag & Drop. Canvas nie przechowuje własnej logiki biznesowej przeciągania. |
| **DragEngine pozostaje pure** | DragEngine odpowiada wyłącznie za obliczenia: DropTarget, DragTarget, snapping, walidację, wybór komendy. Nie wysyła PostMessage, nie zarządza historią, nie aktualizuje Runtime, nie modyfikuje dokumentu. |
| **Canvas jako warstwa prezentacji** | Canvas odpowiada za Drag Overlay, Ghost Element, Highlight Drop Target, Cursor Tracking. Nie implementuje logiki przeciągania. |
| **Runtime przez PreviewChannel** | Synchronizacja Runtime odbywa się wyłącznie przez istniejący PreviewChannel i zdefiniowane kontrakty. Bez alternatywnych kanałów komunikacji. |
| **Command Bus dla finalnego Drop** | Drop kończy się wyłącznie istniejącymi komendami: MOVE_SECTION, MOVE_SECTION_TO_PARENT, REORDER_SECTIONS. Sprint 6A nie wprowadza nowych komend domenowych. |

---

## 2. Odpowiedzialności modułów

### 2.1 DragContext

```
┌───────────────────────────────────────────────┐
│               DragContext                      │
│                                               │
│  Odpowiedzialności:                           │
│  - Tworzy i zarządza DragSession              │
│  - Przechowuje DragState (aktualny stan)      │
│  - Koordynuje DragEngine → Canvas → Runtime   │
│  - Obsługuje zdarzenia: start, move, drop,    │
│    cancel, keydown (Escape)                   │
│  - Deleguje obliczenia do DragEngine          │
│  - Inicjuje finalny dispatch przez CommandBus │
│                                               │
│  Nie odpowiada za:                            │
│  - Renderowanie overlay (Canvas)              │
│  - Obliczenia drop target (DragEngine)        │
│  - Generowanie CSS (LayoutEngine)             │
│  - Zarządzanie historią (HistoryStack)        │
└───────────────────────────────────────────────┘
```

### 2.2 DragEngine (pure)

```
┌───────────────────────────────────────────────┐
│               DragEngine (pure)                │
│                                               │
│  Odpowiedzialności:                           │
│  - computeDropTarget() — oblicza target       │
│    na podstawie pozycji kursora               │
│  - computeDragTarget() — określa źródło drag  │
│  - snapDragToGrid() — przyciąganie do gridu   │
│  - validateDrag() — czy drag jest dozwolony   │
│    (locked, hidden, disabled)                 │
│  - selectCommand() — wybiera komendę          │
│    (MOVE_SECTION, REORDER, MOVE_TO_PARENT)    │
│                                               │
│  Nie odpowiada za:                            │
│  - Wysyłanie PostMessage                      │
│  - Zarządzanie historią                       │
│  - Modyfikację dokumentu                      │
│  - Renderowanie UI                            │
└───────────────────────────────────────────────┘
```

### 2.3 Canvas (warstwa prezentacji)

```
┌───────────────────────────────────────────────┐
│               Canvas (prezentacja)             │
│                                               │
│  Odpowiedzialności:                           │
│  - Drag Overlay — warstwa nad iframe          │
│  - Ghost Element — klon przeciąganej sekcji   │
│  - Highlight Drop Target — podświetlenie      │
│  - Cursor Tracking — śledzenie pozycji myszy  │
│  - Drop Indicator — linia wskazująca miejsce  │
│                                               │
│  Nie odpowiada za:                            │
│  - Obliczenia drop target (DragEngine)        │
│  - Logikę biznesową przeciągania              │
│  - Zarządzanie stanem sesji (DragContext)     │
└───────────────────────────────────────────────┘
```

### 2.4 Runtime (iframe)

```
┌───────────────────────────────────────────────┐
│               Runtime (iframe)                 │
│                                               │
│  Odpowiedzialności:                           │
│  - Nasłuchuje na PostMessage drag events      │
│  - Aktualizuje podgląd podczas przeciągania   │
│  - Wysyła pozycję kursora do Buildera         │
│                                               │
│  Nie odpowiada za:                            │
│  - Logikę Drag & Drop                         │
│  - Obliczenia drop target                     │
│  - Zarządzanie sesją                          │
└───────────────────────────────────────────────┘
```

---

## 3. Integracja z Canvas

### 3.1 Warstwy Canvas podczas Drag

```
Z-index: 200 → Drag Ghost Element (klon sekcji pod kursorem)
Z-index: 150 → Drag Tooltip ("Przenieś tutaj")
Z-index: 100 → Context Menu (right-click)
Z-index: 50  → Selection Overlay (bounding box, handles)
Z-index: 20  → Drop Indicator (linia + highlight)
Z-index: 10  → Grid Overlay (guides, rulers)
Z-index: 1   → Drop Zone Indicators (drag & drop preview)
Z-index: 0   → iframe (strona)
```

### 3.2 Drag Overlay

```
Drag Overlay — tymczasowa warstwa React renderowana nad iframe:

┌────────────────────────────────────────────────────┐
│  DragOverlay                                        │
│  ┌──────────────────────────────────────────────┐  │
│  │  Ghost Element (klon sekcji, półprzezroczysty)│  │
│  │  ┌────────────────────────────────────────┐  │  │
│  │  │  Oryginalna sekcja (opacity: 0.3)      │  │  │
│  │  └────────────────────────────────────────┘  │  │
│  │                                               │  │
│  │  Drop Indicator (niebieska linia)             │  │
│  │  ─────────────────────────────────────────    │  │
│  │                                               │  │
│  │  Highlight Target (podświetlony kontener)     │  │
│  │  ┌══════════════════════════════════════════┐ │  │
│  │  │  Target container (border highlight)     │ │  │
│  │  └══════════════════════════════════════════┘ │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  Cursor Tracking (pozycja x, y w czasie rzeczyw.)  │
└────────────────────────────────────────────────────┘
```

### 3.3 Przepływ danych (Canvas ↔ DragContext)

```
Canvas (mousedown) → DragContext.startDrag(sectionId, position)
  → DragContext tworzy DragSession
    → DragEngine.computeDropTarget() → DropTarget
      → Canvas.renderDragOverlay(ghost, dropIndicator, highlight)
        → Canvas.updateCursorPosition(x, y)
          → DragContext.updateDrag(position)
            → DragEngine.updateDropTarget() → nowy DropTarget
              → Canvas.updateDropIndicator(nowy target)
                → Runtime (PostMessage: DRAG_UPDATE, position)
```

---

## 4. Integracja z Runtime

### 4.1 Komunikacja przez PreviewChannel

```
Builder → Runtime (PostMessage podczas drag):
  DRAG_START    — rozpoczęcie przeciągania (sectionId, position)
  DRAG_MOVE     — zmiana pozycji (x, y, dropTargetId)
  DRAG_END      — zakończenie przeciągania (committed, targetId)
  DRAG_CANCEL   — anulowanie (Escape)

Runtime → Builder (PostMessage):
  DRAG_ACK      — potwierdzenie odbioru
  DRAG_POSITION — aktualna pozycja kursora w iframe
```

### 4.2 Izolacja Runtime

Runtime nie zawiera logiki Drag & Drop. Builder pozostaje właścicielem interakcji. Preview jedynie odzwierciedla stan — wyświetla przeciąganą sekcję w odpowiedniej pozycji.

---

## 5. Integracja z Component Registry

### 5.1 Typy przeciągania

| Typ | Źródło | Cel | Komenda |
|-----|--------|-----|---------|
| REORDER | Canvas (istniejąca sekcja) | Zmiana kolejności w obrębie strony | MOVE_SECTION |
| MOVE_TO_CONTAINER | Canvas (istniejąca sekcja) | Przeniesienie do innego kontenera | MOVE_SECTION_TO_PARENT |
| ADD_FROM_PALETTE | Panel komponentów (lewy sidebar) | Dodanie nowej sekcji | ADD_SECTION |
| ADD_FROM_ASSETS | Panel assetów | Dodanie assetu do sekcji | UPDATE_PROPS |

### 5.2 Walidacja przez ComponentRegistry

```typescript
// DragEngine sprawdza przed rozpoczęciem drag:
// 1. Czy sekcja nie jest locked? (CanvasState.selection.lockedIds)
// 2. Czy sekcja nie jest hidden? (CanvasState.selection.hiddenIds)
// 3. Czy komponent akceptuje przeciąganie? (ComponentDescriptor.draggable)
// 4. Czy target kontener akceptuje dzieci? (ComponentDescriptor.acceptsChildren)
```

---

## 6. Granice odpowiedzialności

### 6.1 Co NIE wchodzi w zakres Sprintu 6A

| Element | Powód | Przeniesiono do |
|---------|-------|-----------------|
| Smart Guides | Wymaga osobnej architektury | Sprint 6B |
| Constraint Engine | Zależny od Layout Engine | Sprint 9 |
| Multi-select drag | Wymaga rozszerzenia SelectionEngine | Sprint 6B+ |
| Touch / Mobile support | Wymaga testów na urządzeniach | Późniejszy |
| Auto-scroll podczas drag | Wymaga integracji z Canvas scroll | Sprint 6B |
| Animacje ghost | Wymaga Framer Motion | Sprint 6B |

### 6.2 Co wchodzi w zakres Sprintu 6A

| Element | Moduł | Status |
|---------|-------|--------|
| DragContext (koordynator) | builder-core | Architektura |
| DragSession (typ sesji) | builder-core | Architektura |
| DragState (stan) | builder-core | Istnieje + rozszerzenie |
| DragEvent, DragTarget, DropTarget | builder-core | Architektura |
| Drag Overlay (Canvas) | React UI | Architektura |
| Ghost Element (Canvas) | React UI | Architektura |
| Drop Indicator (Canvas) | React UI | Architektura |
| Runtime komunikacja | PreviewChannel | Istnieje + rozszerzenie |
| Command Bus (MOVE_SECTION) | BuilderCommands | Istnieje |

---

## 7. Decision Records

### DR-DRAG-001: DragContext jako jedyny koordynator
**Status:** Accepted
**Uzasadnienie:** Centralizacja stanu sesji w DragContext eliminuje rozproszenie logiki drag między Canvas a BuilderContext. Canvas pozostaje warstwą prezentacji.

### DR-DRAG-002: DragEngine jako pure module
**Status:** Accepted
**Uzasadnienie:** DragEngine wykonuje wyłącznie obliczenia (drop target, snapping, walidacja). Nie wysyła PostMessage, nie zarządza historią, nie modyfikuje dokumentu. Zgodne z wzorcem LayoutTypes/GridTypes.

### DR-DRAG-003: Istniejące komendy zamiast nowych
**Status:** Accepted
**Uzasadnienie:** Sprint 6A nie wprowadza nowych komend domenowych. MOVE_SECTION, MOVE_SECTION_TO_PARENT, REORDER_SECTIONS są wystarczające. Zgodne z DR-CMD-001.

### DR-DRAG-004: PreviewChannel jako jedyny kanał Runtime
**Status:** Accepted
**Uzasadnienie:** Synchronizacja Runtime odbywa się przez istniejący PreviewChannel. Bez alternatywnych kanałów komunikacji. Zgodne z DR-003.

### DR-DRAG-005: Canvas jako warstwa prezentacji drag
**Status:** Accepted
**Uzasadnienie:** Canvas renderuje Drag Overlay, Ghost Element, Drop Indicator, Cursor Tracking. Nie implementuje logiki przeciągania. Zgodne z DR-CANVAS-COMP-001.
