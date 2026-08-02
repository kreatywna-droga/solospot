# Sprint 6A — Drag & Drop Runtime Contracts

> **Status:** ✅ Zatwierdzone
> **Sprint:** 6A — Drag & Drop Foundation
> **Cel:** Definicja kontraktów runtime dla systemu Drag & Drop — przepływy, zdarzenia i synchronizacja z Preview
> **Zależności:** 61_DRAG_DROP_ARCHITECTURE.md, 01_STUDIO_ARCHITECTURE.md, 26_RUNTIME_INSPECTOR.md

---

## 1. Drag Start Flow

```
Użytkownik: mousedown na sekcji w Canvasie
    │
    ▼
Canvas: onMouseDown(sectionId, position)
    │
    ▼
DragContext.startDrag(params: DragStartParams)
    │
    ├── Walidacja (DragEngine.validateDrag):
    │   ├── Czy sekcja nie jest locked?   → CanvasState.selection.lockedIds
    │   ├── Czy sekcja nie jest hidden?   → CanvasState.selection.hiddenIds
    │   └── Czy komponent jest draggable? → ComponentDescriptor.draggable
    │
    ├── Utworzenie DragSession:
    │   ├── id: string (unikalne ID sesji)
    │   ├── type: DragType (REORDER | MOVE_TO_CONTAINER | ADD_FROM_PALETTE | ADD_FROM_ASSETS)
    │   ├── sourceSectionId: string | null
    │   ├── sourcePageId: string | null
    │   ├── sourceIndex: number | null
    │   ├── startPosition: { x: number; y: number }
    │   ├── currentPosition: { x: number; y: number }
    │   ├── timestamp: number (Date.now())
    │   └── status: 'ACTIVE' | 'CANCELLED' | 'COMMITTED'
    │
    ├── dispatch(CANVAS, { type: 'BEGIN_DRAG', sectionId, sourcePageId, sourceIndex })
    │   → CanvasState: dragState = { isDragging: true, ... }
    │
    ├── Canvas.renderDragOverlay():
    │   ├── Ghost Element (klon sekcji, opacity 0.8)
    │   ├── Oryginalna sekcja → opacity 0.3
    │   └── Drop Indicator (inicjalizacja)
    │
    ├── DragEngine.computeDropTarget(sections, position, sectionHeights)
    │   → DropTarget { index, sectionId, position: 'BEFORE' | 'AFTER' | 'INSIDE' }
    │
    ├── Canvas.updateDropIndicator(dropTarget)
    │
    └── PreviewChannel.send(DRAG_START, { sectionId, position })
        → Runtime: odbiera i przygotowuje podgląd
```

### 1.1 DragStartParams

```typescript
interface DragStartParams {
  /** Typ operacji przeciągania */
  type: DragType;
  /** ID przeciąganej sekcji (null dla ADD_FROM_PALETTE/ASSETS) */
  sectionId: string | null;
  /** ID strony źródłowej */
  pageId: string | null;
  /** Indeks źródłowy w obrębie rodzica */
  sourceIndex: number | null;
  /** Pozycja startowa kursora (współrzędne canvas) */
  position: { x: number; y: number };
  /** ID sekcji będącej rodzicem źródła */
  parentId?: string | null;
  /** Komponent do dodania (dla ADD_FROM_PALETTE) */
  componentType?: string;
  /** Asset URL (dla ADD_FROM_ASSETS) */
  assetUrl?: string;
}
```

---

## 2. Drag Move Flow

```
Użytkownik: mousemove nad Canvasem
    │
    ▼
Canvas: onMouseMove(x, y)
    │
    ▼
DragContext.updateDrag(position: { x: number; y: number })
    │
    ├── Aktualizacja DragSession:
    │   ├── currentPosition = { x, y }
    │   └── timestamp = Date.now()
    │
    ├── DragEngine.computeDropTarget(sections, position, sectionHeights):
    │   ├── Iteracja po sekcjach
    │   ├── Obliczenie stref (BEFORE, INSIDE, AFTER)
    │   └── Zwrócenie DropTarget { index, sectionId, position, zone }
    │
    ├── DragEngine.snapDragToGrid(x, y, width, height, containerWidth, grid):
    │   ├── Przyciągnięcie do gridu
    │   └── Zwrócenie { x, y, snapped }
    │
    ├── Canvas.updateDragOverlay(ghostPosition, dropTarget):
    │   ├── Ghost Element → nowa pozycja (x, y)
    │   ├── Drop Indicator → nowa pozycja (linia między sekcjami)
    │   └── Highlight Target → nowy cel (jeśli INSIDE)
    │
    ├── Canvas.updateCursor(cursorType):
    │   ├── move (domyślnie podczas drag)
    │   ├── copy (dla ADD_FROM_PALETTE)
    │   └── not-allowed (jeśli invalid target)
    │
    ├── dispatch(CANVAS, { type: 'UPDATE_DRAG', currentIndex: dropTarget.index })
    │   → CanvasState: dragState.currentIndex = dropTarget.index
    │
    └── PreviewChannel.send(DRAG_MOVE, { x, y, dropTargetId, sectionId })
        → Runtime: aktualizuje pozycję przeciąganej sekcji w podglądzie
```

### 2.1 DragMoveParams

```typescript
interface DragMoveParams {
  /** Aktualna pozycja kursora */
  position: { x: number; y: number };
  /** Delta od ostatniego move event */
  delta: { x: number; y: number };
  /** Czy snap do gridu jest aktywny */
  snapped: boolean;
  /** Aktualny drop target */
  dropTarget: DropTarget | null;
  /** Przewidywana komenda (do podglądu) */
  pendingCommand: BuilderCommandType | null;
}
```

---

## 3. Drop Flow

```
Użytkownik: mouseup nad Canvasem
    │
    ▼
Canvas: onMouseUp(position)
    │
    ▼
DragContext.endDrag(position: { x: number; y: number })
    │
    ├── DragEngine.validateDrop(session, dropTarget, document):
    │   ├── Czy drop target istnieje?         → dropTarget !== null
    │   ├── Czy to nie to samo miejsce?       → sourceIndex !== targetIndex
    │   ├── Czy nie przenoszę do samego siebie? → sectionId !== dropTarget.sectionId
    │   └── Czy target akceptuje dzieci?      → ComponentDescriptor.acceptsChildren
    │
    ├── DragEngine.selectCommand(session, dropTarget, document):
    │   │
    │   ├── REORDER:
    │   │   → MOVE_SECTION { pageId, fromIndex, toIndex }
    │   │
    │   ├── MOVE_TO_CONTAINER:
    │   │   → MOVE_SECTION_TO_PARENT { pageId, sectionId, parentId, toIndex }
    │   │
    │   ├── ADD_FROM_PALETTE:
    │   │   → ADD_SECTION { pageId, sectionType, defaultProps, atIndex }
    │   │
    │   └── ADD_FROM_ASSETS:
    │       → UPDATE_PROPS { pageId, sectionId, props: { image: assetUrl } }
    │
    ├── dispatch(command) → BuilderContext:
    │   ├── applyCommandToDocument() → nowy dokument
    │   ├── HistoryStack.push(snapshot, commandLabel)
    │   └── PreviewChannel.send(DocumentUpdate)
    │
    ├── dispatch(CANVAS, { type: 'END_DRAG', committed: true })
    │   → CanvasState: dragState = null, mode = 'SELECT'
    │
    ├── Canvas.cleanupDragOverlay():
    │   ├── Usuń Ghost Element
    │   ├── Przywróć opacity oryginalnej sekcji (1.0)
    │   ├── Usuń Drop Indicator
    │   └── Usuń Highlight Target
    │
    └── PreviewChannel.send(DRAG_END, { committed: true, command })
        → Runtime: kończy podgląd przeciągania
```

---

## 4. Cancel Flow

```
Użytkownik: Escape podczas drag
    │
    ▼
Canvas: onKeyDown(Escape)
    │
    ▼
DragContext.cancelDrag()
    │
    ├── dispatch(CANVAS, { type: 'END_DRAG', committed: false })
    │   → CanvasState: dragState = null, mode = 'SELECT'
    │
    ├── Canvas.cleanupDragOverlay():
    │   ├── Usuń Ghost Element
    │   ├── Przywróć opacity oryginalnej sekcji (1.0)
    │   ├── Usuń Drop Indicator
    │   └── Usuń Highlight Target
    │
    └── PreviewChannel.send(DRAG_CANCEL, {})
        → Runtime: przywraca poprzedni stan
```

---

## 5. Event Contracts

### 5.1 DragEvent

```typescript
/**
 * Zdarzenia Drag & Drop przesyłane między Builderem a Runtime.
 * Wszystkie zdarzenia są przesyłane przez PreviewChannel (PostMessage).
 */
type DragEventType =
  | 'DRAG_START'
  | 'DRAG_MOVE'
  | 'DRAG_END'
  | 'DRAG_CANCEL'
  | 'DRAG_ACK';

interface DragEvent {
  /** Typ zdarzenia */
  type: DragEventType;
  /** ID sesji przeciągania */
  sessionId: string;
  /** Znacznik czasu */
  timestamp: number;
  /** Dane zdarzenia */
  payload: DragStartPayload | DragMovePayload | DragEndPayload | DragCancelPayload | DragAckPayload;
}

interface DragStartPayload {
  sectionId: string | null;
  componentType?: string;
  position: { x: number; y: number };
  pageId: string;
}

interface DragMovePayload {
  position: { x: number; y: number };
  delta: { x: number; y: number };
  dropTargetId: string | null;
  dropPosition: 'BEFORE' | 'AFTER' | 'INSIDE' | null;
}

interface DragEndPayload {
  committed: boolean;
  command?: BuilderCommand;
  targetId?: string | null;
}

interface DragCancelPayload {
  reason?: 'ESCAPE' | 'ERROR' | 'INVALID_TARGET';
}

interface DragAckPayload {
  receivedEventType: DragEventType;
  status: 'OK' | 'ERROR';
  error?: string;
}
```

### 5.2 DragTarget

```typescript
/**
 * Źródło przeciągania — identyfikuje skąd pochodzi drag.
 */
interface DragTarget {
  /** ID przeciąganej sekcji (null dla ADD_FROM_PALETTE) */
  sectionId: string | null;
  /** ID strony źródłowej */
  pageId: string | null;
  /** Indeks źródłowy */
  sourceIndex: number | null;
  /** Rodzic źródła (jeśli sekcja jest w kontenerze) */
  parentId: string | null;
  /** Typ przeciągania */
  type: DragType;
  /** Komponent do dodania (dla ADD_FROM_PALETTE) */
  componentType?: string;
  /** Asset URL (dla ADD_FROM_ASSETS) */
  assetUrl?: string;
}
```

### 5.3 DropTarget

```typescript
/**
 * Cel przeciągania — identyfikuje gdzie ma zostać upuszczona sekcja.
 */
interface DropTarget {
  /** ID sekcji docelowej (sąsiad lub kontener) */
  sectionId: string | null;
  /** Indeks docelowy (pozycja w liście children) */
  index: number;
  /** Pozycja względem sekcji docelowej */
  position: 'BEFORE' | 'AFTER' | 'INSIDE';
  /** ID rodzica docelowego (jeśli INSIDE — to kontener) */
  parentId: string | null;
  /** Czy drop jest dozwolony */
  valid: boolean;
  /** ID strony docelowej */
  pageId: string;
}
```

### 5.4 DragSession

```typescript
/**
 * Pojedyncza sesja przeciągania — żyje od mousedown do mouseup/Escape.
 */
type DragSessionStatus = 'ACTIVE' | 'CANCELLED' | 'COMMITTED';

interface DragSession {
  /** Unikalne ID sesji */
  id: string;
  /** Typ przeciągania */
  type: DragType;
  /** Status sesji */
  status: DragSessionStatus;
  /** Źródło przeciągania */
  source: DragTarget;
  /** Aktualny drop target (może być null przed pierwszym ruchem) */
  currentDropTarget: DropTarget | null;
  /** Pozycja startowa */
  startPosition: { x: number; y: number };
  /** Aktualna pozycja */
  currentPosition: { x: number; y: number };
  /** Znacznik czasu rozpoczęcia */
  startedAt: number;
  /** Znacznik czasu ostatniej aktualizacji */
  updatedAt: number;
  /** Czy snap do gridu jest aktywny */
  snapped: boolean;
  /** Przewidywana komenda */
  pendingCommand: BuilderCommand | null;
}
```

### 5.5 DragState

```typescript
/**
 * Stan Drag & Drop w CanvasState.
 * Rozszerzenie istniejącego DragState z CanvasState.ts.
 */
interface DragState {
  /** Czy drag jest aktywny */
  isDragging: boolean;
  /** ID sesji (referencja do DragSession.id) */
  sessionId: string | null;
  /** ID przeciąganej sekcji */
  sectionId: string | null;
  /** ID strony źródłowej */
  sourcePageId: string | null;
  /** Indeks źródłowy */
  sourceIndex: number | null;
  /** Aktualny indeks */
  currentIndex: number | null;
  /** Aktualna pozycja kursora */
  currentPosition: { x: number; y: number } | null;
  /** Aktualny drop target */
  dropTarget: DropTarget | null;
  /** Czy przyciągnięto do gridu */
  snapped: boolean;
}
```

---

## 6. Preview Synchronization

### 6.1 PostMessage Protocol

```
Builder → Runtime (PostMessage):
  DRAG_START:  { type, sessionId, payload: { sectionId, position, pageId } }
  DRAG_MOVE:   { type, sessionId, payload: { position, dropTargetId, dropPosition } }
  DRAG_END:    { type, sessionId, payload: { committed, command? } }
  DRAG_CANCEL: { type, sessionId, payload: { reason? } }

Runtime → Builder (PostMessage):
  DRAG_ACK:    { type, sessionId, payload: { receivedEventType, status } }
```

### 6.2 Runtime odpowiedzi na drag events

| Event | Runtime Action |
|-------|---------------|
| DRAG_START | Przygotowanie podglądu — pokazuje przeciąganą sekcję |
| DRAG_MOVE | Aktualizacja pozycji sekcji w podglądzie |
| DRAG_END (committed) | Kończy podgląd, przyjmuje nowy stan |
| DRAG_END (cancelled) | Przywraca poprzedni stan |
| DRAG_CANCEL | Przywraca poprzedni stan |

### 6.3 Zasady synchronizacji

1. Runtime nie zawiera logiki Drag & Drop — jedynie odzwierciedla stan
2. Builder jest właścicielem interakcji — decyduje o drop target, walidacji i komendzie
3. PreviewChannel jest jedynym kanałem komunikacji — bez alternatywnych kanałów
4. DRAG_ACK potwierdza odbiór — w przypadku braku ACK Builder retransmituje event

---

## 7. Decision Records

### DR-DRAG-CONT-001: DragSession jako tymczasowy byt
**Status:** Accepted
**Uzasadnienie:** DragSession żyje tylko podczas trwania przeciągania. Po zakończeniu (drop lub cancel) jest usuwany. Nie jest przechowywany w historii ani w dokumencie.

### DR-DRAG-CONT-002: DropTarget jako wynik obliczeń, nie stan
**Status:** Accepted
**Uzasadnienie:** DropTarget jest obliczany przez DragEngine przy każdym move event. Nie jest przechowywany jako część stanu — jest pochodną pozycji kursora i aktualnych sekcji.

### DR-DRAG-CONT-003: Pending command jako podgląd
**Status:** Accepted
**Uzasadnienie:** Przed finalnym dropem DragSession przechowuje pendingCommand — przewidywaną komendę. Służy do podglądu w UI i Runtime. Finalna komenda jest dispatchowana dopiero w Drop Flow.

### DR-DRAG-CONT-004: Brak nowych typów w PreviewMessage
**Status:** Accepted
**Uzasadnienie:** Sprint 6A nie wprowadza nowych typów wiadomości PreviewMessage. Wykorzystuje istniejące mechanizmy: DocumentUpdate, SectionUpdate.
