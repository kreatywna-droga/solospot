# C16.4 — WEB FACTOR Studio Selection System

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 04_SELECTION_SYSTEM.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 03_CANVAS_ENGINE.md

---

## 1. Cel

System selekcji odpowiada za:
- Kliknięcie → wybór sekcji na canvasie
- Hover → podświetlenie sekcji
- Multi-select (Ctrl+Click, Shift+Click)
- Box select (przeciągnięcie prostokąta)
- Klawiaturowa nawigacja (Tab, ↑↓)
- Synchronizacja z Layers panelem
- Breadcrumb (ścieżka rodzica)

---

## 2. Architektura

```
User Click on Canvas
    ↓
PreviewFrame (iframe) → PostMessage → BuilderCanvas
    ↓
dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId, pageId } })
    ↓
BuilderContext.dispatch()
    ↓
reduceCanvasState(canvas, action) → new CanvasState
    ↓
React re-render:
  - SelectionOverlay (bounding box, handles)
  - LayerTree (podświetlenie w drzewie)
  - Inspector (pokazuje props sekcji)
```

---

## 3. Typy selekcji

### 3.1 Single Select (domyślny)

```
Kliknięcie → wybiera sekcję
- Odznacza poprzednio wybraną
- Pokazuje bounding box
- Otwiera Inspector
- Synchronizuje LayerTree
```

### 3.2 Multi Select

```
Ctrl+Click → dodaje/usuwa z selekcji
Shift+Click → zakres (lista)
Zaznaczone sekcje → batch operations:
  - Move, Delete, Duplicate
  - Align (left, center, right, top, middle, bottom)
  - Distribute (horizontal, vertical)
  - Group (wrap w kontener)
```

### 3.3 Box Select

```
Kliknij i przeciągnij na pustym obszarze → prostokąt
Wszystkie sekcje w prostokącie → zaznaczone
Przydatne przy gęstym layout
```

### 3.4 Hover

```
Mouse over → podświetlenie + etykieta
- Synchronizacja z LayerTree (hover highlight)
- W iframe: przezroczysty overlay
```

---

## 4. Breadcrumb (ścieżka rodzica)

```
Po wybraniu Heading wewnątrz Hero:

Home > Hero > Heading
     ↑        ↑        ↑
  strona  kontener  element
```

### 4.1 Budowa breadcrumb

```typescript
function buildBreadcrumbs(
  sections: SectionNode[],
  selectedId: string
): BreadcrumbItem[] {
  const path: BreadcrumbItem[] = [];
  
  function walk(nodes: SectionNode[], depth: number): boolean {
    for (const node of nodes) {
      if (node.id === selectedId) {
        path.push({ id: node.id, label: node.label, type: node.type });
        return true;
      }
      if (node.children.length > 0) {
        if (walk(node.children, depth + 1)) {
          path.unshift({ id: node.id, label: node.label, type: node.type });
          return true;
        }
      }
    }
    return false;
  }
  
  walk(sections, 0);
  return path;
}
```

### 4.2 Nawigacja rodzic-dziecko

```
Escape → select parent (wyjdź do kontenera)
Enter → select first child (wejdź w kontener)
Tab → next sibling
Shift+Tab → previous sibling
```

---

## 5. Klawiaturowa nawigacja

| Klawisz | Akcja |
|---------|-------|
| **↑** | Poprzednia sekcja (sibling) |
| **↓** | Następna sekcja (sibling) |
| **→** | Wejście w children (jeśli container) |
| **←** | Wyjście do rodzica |
| **Escape** | Odznacz / Wyjdź do rodzica |
| **Tab** | Następny element |
| **Shift+Tab** | Poprzedni element |
| **Enter** | Zatwierdź / edytuj inline |
| **Delete** | Usuń zaznaczone |
| **Ctrl+A** | Zaznacz wszystko |

---

## 6. Synchronizacja z UI

### 6.1 Canvas → LayerTree

```
Canvas:
  - Sekcja wybrana → podświetlona ramką
  - Sekcja hoverowana → półprzezroczyste podświetlenie
  - Multi-select → wszystkie zaznaczone mają ramkę

LayerTree:
  - Ta sama sekcja podświetlona w drzewie
  - Auto-scroll do zaznaczonego węzła
  - Hover w drzewie → hover na canvasie
```

### 6.2 Canvas → Inspector

```
Inspector:
  - Pokazuje props zaznaczonej sekcji
  - Przy multi-select: "3 elementy zaznaczone"
  - Batch props edit (jeśli wszystkie mają to samo pole)
```

---

## 7. Implementacja

### 7.1 Istniejący kod (SelectionEngine.ts)

```typescript
// packages/builder-core/src/SelectionEngine.ts
// Już istnieje — wymaga rozszerzenia o:
// - Multi-select
// - Box select
// - Breadcrumb
// - Keyboard navigation
```

### 7.2 Rozszerzenie

```typescript
// Rozszerzenie istniejącego SelectionEngine

interface SelectionState {
  selectedIds: string[];         // lista (zamiast pojedynczego ID)
  hoveredId: string | null;
  activeBreakpoint: ViewportLabel;
  lockedIds: string[];
  hiddenIds: string[];
  breadcrumbs: BreadcrumbItem[];
  lastClickedId: string | null;  // dla Shift+Click zakresu
}

// Nowe akcje selekcji
type SelectionAction =
  | { type: 'SELECT'; id: string; additive?: boolean }
  | { type: 'SELECT_MULTI'; ids: string[] }
  | { type: 'SELECT_ALL'; ids: string[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'HOVER'; id: string | null }
  | { type: 'SELECT_PARENT'; sections: SectionNode[] }
  | { type: 'SELECT_CHILD'; sections: SectionNode[] }
  | { type: 'SELECT_NEXT'; sections: SectionNode[] }
  | { type: 'SELECT_PREV'; sections: SectionNode[] }
  | { type: 'BOX_SELECT'; rect: Rect; sections: SectionNode[] };
```

### 7.3 Hooks

```typescript
// hooks/useSelection.ts
function useSelection() {
  const { canvas, dispatch } = useBuilder();
  
  return {
    selectedIds: canvas.selection.selectedIds,
    hoveredId: canvas.selection.hoveredId,
    breadcrumbs: canvas.selection.breadcrumbs,
    
    select: (id: string, additive?: boolean) => {
      dispatch({ type: 'CANVAS', action: { type: 'SELECT_SECTION', sectionId: id, additive } });
    },
    
    selectParent: () => {
      dispatch({ type: 'CANVAS', action: { type: 'SELECT_PARENT' } });
    },
    
    hover: (id: string | null) => {
      dispatch({ type: 'CANVAS', action: { type: 'HOVER_SECTION', sectionId: id } });
    },
    
    isSelected: (id: string) => canvas.selection.selectedIds.includes(id),
    isHovered: (id: string) => canvas.selection.hoveredId === id,
  };
}
```

---

## 8. Edge Cases

| Case | Zachowanie |
|------|------------|
| **Kliknięcie w locked** | Nie wybiera, pokazuje tooltip "Sekcja zablokowana" |
| **Kliknięcie w hidden** | Nie wybiera (hidden nie jest klikalny) |
| **Multi-select z locked** | Locked pomijane w batch operations |
| **Click na pustym obszarze** | Deselect |
| **Double-click** | Inline edit (text) |
| **Right-click** | Context menu |
| **Drag z selekcją** | Przesuwa wszystkie zaznaczone |
| **Usunięcie zaznaczonego** | Deselect po usunięciu |

