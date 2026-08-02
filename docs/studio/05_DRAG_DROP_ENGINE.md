# C16.5 — WEB FACTOR Studio Drag & Drop Engine

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 05_DRAG_DROP_ENGINE.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 03_CANVAS_ENGINE.md, 04_SELECTION_SYSTEM.md

---

## 1. Cel

Drag & Drop Engine umożliwia:
- Przeciąganie sekcji w celu zmiany kolejności (reorder)
- Przenoszenie sekcji między kontenerami
- Przeciąganie komponentów z palety na canvas
- Przeciąganie assetów (obrazki, SVG) z biblioteki na canvas
- Resize sekcji przez przeciąganie uchwytów

---

## 2. Typy drag & drop

### 2.1 Reorder (przeciąganie w canvasie)

```
Przeciągam "Hero" poniżej "Features"

Przed:
┌─ Navbar ─┐
├─ Hero ───┤  ← drag source
├─ Features┤
└─ Footer ─┘

Podczas dragu:
┌─ Navbar ─┐
├─ Features┤
├─ ─ ─ ─ ─┤  ← drop indicator (linia + "Upuść tutaj")
└─ Footer ─┘

Po:
┌─ Navbar ─┐
├─ Features┤
├─ Hero ───┤  ← przeniesione
└─ Footer ─┘
```

### 2.2 Move to container

```
Przeciągam "Button" do wnętrza "Hero Container"

Przed:
┌─ Hero ─────────────┐
│  Heading            │
│  Paragraph          │
└────────────────────┘
┌─ Button ─┐          ← source
└──────────┘

Podczas dragu:
┌─ Hero ─────────────┐
│  Heading            │
│  Paragraph          │
│ ═══════════════════ │ ← drop indicator w kontenerze
└────────────────────┘

Po:
┌─ Hero ─────────────┐
│  Heading            │
│  Paragraph          │
│  Button             │ ← wrzucone do kontenera
└────────────────────┘
```

### 2.3 Add from palette

```
Przeciągam "Hero Basic" z panelu komponentów na canvas

1. Złap z panelu → kopia pod kursorem
2. Przeciągnij nad canvas → drop zones się pokazują
3. Upuść → dispatch(ADD_SECTION)
```

### 2.4 Add from assets

```
Przeciągam obrazek z Assets na canvas

1. Złap z Assets panelu
2. Przeciągnij nad canvas → sekcje które akceptują obrazki się podświetlają
3. Upuść → dispatch(UPDATE_PROPS, { image: assetUrl })
```

### 2.5 Resize

```
8 uchwytów resize:
┌──┬────────────┬──┐
│nw│      n     │ne│
├──┼────────────┼──┤
│ w│            │ e│
├──┼────────────┼──┤
│sw│      s     │se│
└──┴────────────┴──┘

- Shift → zachowaj aspect ratio
- Snap to grid podczas resize
- Minimalna wielkość: 20x20px
```

---

## 3. Stan drag & drop

```typescript
interface DragState {
  // Źródło
  type: 'REORDER' | 'MOVE_TO_CONTAINER' | 'ADD_FROM_PALETTE' | 'ADD_FROM_ASSETS';
  sourceSectionId: string | null;
  sourcePageId: string | null;
  sourceIndex: number | null;
  
  // Aktualna pozycja
  currentX: number;
  currentY: number;
  currentIndex: number | null;
  targetParentId: string | null;
  
  // Drop target
  dropPosition: 'BEFORE' | 'AFTER' | 'INSIDE' | null;
  dropTargetId: string | null;
  
  // Grid snap
  snapped: boolean;
  guides: Array<{ axis: 'x' | 'y'; position: number }>;
  
  // Ghost (wizualizacja)
  ghostElement: HTMLElement | null;
  
  isDragging: boolean;
}

interface ResizeState {
  sectionId: string;
  handle: ResizeHandle;   // 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw'
  startSize: { width: number; height: number };
  currentSize: { width: number; height: number };
  aspectRatio: number | null;   // jeśli Shift
  isResizing: boolean;
}
```

---

## 4. Drop Zones

### 4.1 Obliczanie drop zone

```typescript
function computeDropZones(
  sections: SectionNode[],
  dragPosition: { x: number; y: number }
): DropZone[] {
  const zones: DropZone[] = [];
  
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const rect = getSectionRect(section.id); // pozycja w iframe
    
    // Górna strefa (BEFORE)
    zones.push({
      id: `before-${section.id}`,
      sectionId: section.id,
      position: 'BEFORE',
      index: i,
      area: { top: rect.top - 20, bottom: rect.top + 20 },
    });
    
    // Środkowa strefa (INSIDE) — tylko dla containerów
    if (section.children.length > 0 || section.type === 'container') {
      zones.push({
        id: `inside-${section.id}`,
        sectionId: section.id,
        position: 'INSIDE',
        index: i,
        area: { top: rect.top + 20, bottom: rect.bottom - 20 },
      });
    }
    
    // Dolna strefa (AFTER) — ostatni element
    if (i === sections.length - 1) {
      zones.push({
        id: `after-${section.id}`,
        sectionId: section.id,
        position: 'AFTER',
        index: i + 1,
        area: { top: rect.bottom - 20, bottom: rect.bottom + 20 },
      });
    }
  }
  
  return zones;
}
```

### 4.2 Wizualizacja drop zone

```
Kiedy przeciągasz, canvas pokazuje:
- Niebieską linię między sekcjami (gdzie wpadnie)
- Podświetlenie kontenera (jeśli wrzucasz do środka)
- "Przenieś tutaj" tooltip
- Prowadnice snap
```

---

## 5. Ghost Element

Podczas przeciągania:
1. **Klon** oryginalnej sekcji pod kursorem (ghost)
2. Oryginalna sekcja staje się półprzezroczysta (30% opacity)
3. Ghost ma cień i jest nieco przesunięty
4. Na końcu: smooth animacja do nowej pozycji

---

## 6. Implementacja

### 6.1 Istniejący kod

```typescript
// packages/builder-core/src/DragEngine.ts
// Już istnieje — wymaga rozszerzenia o:
// - Drop zone calculation
// - Container detection
// - Ghost element management
// - Snap to grid podczas drag
```

### 6.2 Nowe hooki

```typescript
// hooks/useDragAndDrop.ts
function useDragAndDrop() {
  const [dragState, setDragState] = useState<DragState | null>(null);
  
  const startDrag = (sectionId: string, sourcePageId: string, sourceIndex: number) => {
    dispatch({ type: 'CANVAS', action: { type: 'BEGIN_DRAG', sectionId, sourcePageId, sourceIndex } });
  };
  
  const updateDrag = (x: number, y: number) => {
    const dropZone = computeDropZone(sections, { x, y });
    dispatch({ type: 'CANVAS', action: { type: 'UPDATE_DRAG', currentIndex: dropZone.index } });
  };
  
  const endDrag = (committed: boolean) => {
    if (committed && dragState?.dropTargetId) {
      dispatch({ type: 'MOVE_SECTION', pageId, fromIndex: dragState.sourceIndex, toIndex: dragState.currentIndex });
    }
    dispatch({ type: 'CANVAS', action: { type: 'END_DRAG', committed } });
  };
  
  return { dragState, startDrag, updateDrag, endDrag };
}

// hooks/useResize.ts
function useResize() {
  // Obsługa resize handles
}
```

---

## 7. Zdarzenia myszy

### 7.1 Drag sequence

```
mousedown (na sekcji lub uchwycie)
  → BEGIN_DRAG (ustaw źródło)
  
mousemove (nad canvasem)
  → UPDATE_DRAG (oblicz drop zone)
  → snap to grid
  → update ghost position
  → update drop indicator
  → wysyłaj SECTION_UPDATE do preview (jeśli resize)
  
mouseup (nad drop zone)
  → jeśli jest poprawny target
    → dispatch(MOVE_SECTION lub ADD_SECTION)
  → END_DRAG
  → usuń ghost
```

### 7.2 Touch support

```typescript
// Touch → symulowany drag
// Na urządzeniach mobilnych z długim przytrzymaniem

let touchTimer: NodeJS.Timeout;

element.addEventListener('touchstart', (e) => {
  touchTimer = setTimeout(() => {
    // Rozpocznij drag
    startDrag(sectionId);
  }, 500); // 500ms long press
});

element.addEventListener('touchend', () => {
  clearTimeout(touchTimer);
});
```

---

## 8. Edge Cases

| Case | Zachowanie |
|------|------------|
| **Drag poza canvas** | Auto-scroll krańcowy (scroll margin) |
| **Drag do zamkniętego kontenera** | Kontener się rozwija |
| **Drag locked sekcji** | Nie można przeciągnąć (opór przy próbie) |
| **Drag hidden sekcji** | Nie można przeciągnąć |
| **Multi-select drag** | Przesuwa wszystkie zaznaczone |
| **Drag do pełnego kontenera** | Max children check |
| **Resize do 0** | Minimalny rozmiar 20x20 |
| **Resize z snap** | Przyciąganie do gridu |

