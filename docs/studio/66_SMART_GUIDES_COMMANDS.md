# Sprint 6B — Smart Guide Commands

> **Status:** ✅ Draft
> **Sprint:** 6B — Smart Guides Foundation
> **Cel:** Kontrakty komend dla Smart Guides — definicja przepływu danych pomiędzy DragEngine, SmartGuideEngine i Canvas

---

## 1. Przepływ danych

Smart Guides nie posiadają własnych komend (DR-SMARTGUIDE-003). Zamiast tego, są one **integralną częścią przepływu Drag & Drop**:

```
1. Użytkownik rozpoczyna przeciąganie (mousedown na elemencie)
2. DragEngine: dispatch(CANVAS BEGIN_DRAG)
3. Każdy frame dragu:
   a. DragEngine aktualizuje pozycję
   b. useSmartGuides: SmartGuideEngine.computeAll(dragPosition, elementBounds, container)
   c. SmartGuidesOverlay: renderuje prowadnice (SVG)
   d. DragEngine: aplikuje snap offset (SnapGuidance.offsetX, offsetY)
   e. dispatch(CANVAS UPDATE_DRAG, currentIndex)
4. Użytkownik kończy przeciąganie (mouseup)
5. DragEngine: dispatch(CANVAS END_DRAG)
6. Jeśli pozycja uległa zmianie: dispatch(MOVE_SECTION, fromIndex, toIndex)
```

---

## 2. Canvas Action — Smart Guide Config

Smart Guides są kontrolowane przez **CanvasState** (nie posiadają osobnego stanu). Konfiguracja prowadnic jest przechowywana w `CanvasState.grid` (rozszerzona o pola konfiguracji prowadnic).

### 2.1 Toggle Guides

```typescript
// Akcja canvasu do włączania/wyłączania prowadnic
interface CanvasAction {
  type: 'TOGGLE_SMART_GUIDES';
  enabled: boolean;
}
```

### 2.2 Update Guide Config

```typescript
interface CanvasAction {
  type: 'SET_SMART_GUIDE_CONFIG';
  config: Partial<SmartGuideConfig>;
}
```

---

## 3. DragEngine Integration

Smart Guide Engine jest wywoływany przez `useSmartGuides` hook, który jest mostem między DragContext a SmartGuideEngine.

### 3.1 Hook Contract

```typescript
function useSmartGuides(input: {
  dragPosition?: { x: number; y: number };
  dragSize?: { width: number; height: number };
  allElements?: ElementBounds[];
  container?: ContainerBounds;
  config?: Partial<SmartGuideConfig>;
  enabled?: boolean;
  showGuides?: boolean;
}): {
  guides: SmartGuide[];
  snapGuidance: SnapGuidance;
  visible: boolean;
  activeGuideCount: number;
  alignmentCount: number;
  distanceCount: number;
  centerCount: number;
  marginCount: number;
  spacingCount: number;
}
```

### 3.2 Snap Integration

```typescript
// DragEngine aplikuje snap offset po otrzymaniu SnapGuidance
function applySnap(
  currentPosition: { x: number; y: number },
  snapGuidance: SnapGuidance,
  snapToGrid: boolean,
  gridConfig: GridConfig
): { x: number; y: number } {
  let x = currentPosition.x + snapGuidance.offsetX;
  let y = currentPosition.y + snapGuidance.offsetY;

  // Grid snap ma wyższy priorytet niż guide snap (jeśli włączony)
  if (snapToGrid) {
    const gridSnap = snapDragToGrid({ x, y, width: 0, height: 0 }, gridConfig);
    x = gridSnap.x;
    y = gridSnap.y;
  }

  return { x, y };
}
```

---

## 4. Przepływ komend — szczegółowo

### 4.1 Begin Drag

```
User: mousedown na elemencie
  → SectionBlock.onMouseDown
    → dispatch({ type: 'CANVAS', action: { type: 'BEGIN_DRAG', sectionId, sourcePageId, sourceIndex } })
      → CanvasState: { mode: 'MOVE', dragState: { isDragging: true, ... } }
      → useSmartGuides: enabled = true, rozpoczyna obliczenia
```

### 4.2 Drag Frame

```
User: mousemove
  → DragEngine: oblicza currentIndex
    → dispatch({ type: 'CANVAS', action: { type: 'UPDATE_DRAG', currentIndex } })
    → useSmartGuides:
      a. Pobiera dragPosition z dragState
      b. Pobiera elementBounds z DOM (data-section-id)
      c. SmartGuideEngine.computeAll(input)
      d. Zwraca: guides + snapGuidance
    → SmartGuidesOverlay: renderuje guides
    → DragEngine: aplikuje snapGuidance.offsetX/offsetY
```

### 4.3 End Drag

```
User: mouseup
  → dispatch({ type: 'CANVAS', action: { type: 'END_DRAG', committed: true } })
    → CanvasState: { mode: 'SELECT', dragState: null }
    → useSmartGuides: enabled = false, guides = []
    → Jeśli pozycja uległa zmianie:
      dispatch({ type: 'MOVE_SECTION', pageId, fromIndex, toIndex })
        → BuilderContext: applyCommandToDocument() → HistoryStack.push() → PreviewChannel.send()
```

---

## 5. Canvas State — rozszerzenie

```typescript
// Rozszerzenie CanvasState o konfigurację Smart Guides
interface CanvasState {
  // ... istniejące pola
  grid: GridConfig;           // istniejące
  smartGuides: SmartGuideConfig; // NOWE — konfiguracja prowadnic
  showSmartGuides: boolean;   // NOWE — czy prowadnice są widoczne
}
```

---

## 6. Decision Records

### DR-SG-CMD-001: Brak własnych komend Smart Guides
**Status:** Accepted
**Uzasadnienie:** Smart Guides są integralną częścią przepływu Drag & Drop. Nie posiadają własnych komend — są wywoływane przez DragEngine przez useSmartGuides hook.

### DR-SG-CMD-002: Konfiguracja przez CanvasState
**Status:** Accepted
**Uzasadnienie:** Konfiguracja prowadnic (show/hide, threshold, kolory) jest przechowywana w CanvasState, nie w osobnym store. To upraszcza architekturę.

### DR-SG-CMD-003: Snap przez DragEngine
**Status:** Accepted
**Uzasadnienie:** SmartGuideEngine oblicza snap, ale nie aplikuje go. DragEngine jest odpowiedzialny za nałożenie offsetu na pozycję elementu.
