# Sprint 2 — Selection Engine (C16.4)

## Status: COMPLETED ✅

### Cel
System selekcji dla Studio 2.0: overlay, multi-select, hover, keyboard navigation,
breadcrumbs, synchronizacja Layers ↔ Canvas ↔ Inspector.

### Zależności
- Sprint 1 (Studio Shell) ✅
- `packages/builder-core/src/SelectionEngine.ts` — rozszerzony
- `packages/builder-core/src/CanvasState.ts` — rozszerzony o SelectionState

### Pliki utworzone / zmodyfikowane w Sprint 2

| Plik | Status | Opis |
|------|--------|------|
| `packages/builder-core/src/SelectionEngine.ts` | ✅ Rozszerzony | Multi-select, select all/parent/child/next/prev, box select, breadcrumbs, all helpers |
| `packages/builder-core/src/CanvasState.ts` | ✅ Rozszerzony | SelectionState z selectedIds[], nowe akcje SELECT_ALL..BOX_SELECT, Rect, SelectionBox |
| `packages/builder-core/src/BuilderContext.ts` | ✅ Zintegrowany | reduceSelection w dispatch dla wszystkich akcji |
| `packages/builder-core/src/index.ts` | ✅ Eksporty | Wszystkie nowe typy i funkcje wyeksportowane |
| `packages/builder-core/src/OverlayConstants.ts` | ✅ NOWY | HandleType, ToolbarAction, OverlayConfig z DEFAULT_OVERLAY_CONFIG |
| `packages/builder-core/src/OverlayRect.ts` | ✅ NOWY | OverlayRect, canvasToScreen, screenToCanvas, overlayTransform |
| `packages/builder-core/src/OverlayController.ts` | ✅ NOWY | OverlayController z computeOverlayState + actionToCommand |
| `src/components/builder/selection/useOverlay.ts` | ✅ NOWY | React hook bridging OverlayController → React state |
| `src/components/builder/selection/BoundingBox.tsx` | ✅ NOWY | Selection bounding box z animacją |
| `src/components/builder/selection/ResizeHandles.tsx` | ✅ NOWY | 8 resize handles (NW/NE/SE/SW/N/S/E/W) |
| `src/components/builder/selection/HoverHighlight.tsx` | ✅ NOWY | Hover overlay z dashed border |
| `src/components/builder/selection/QuickToolbar.tsx` | ✅ NOWY | Floating action toolbar (move/duplicate/delete/lock/hide) |
| `src/components/builder/selection/SelectionOverlay.tsx` | ✅ NOWY | Root overlay komponujący wszystkie sub-komponenty |
| `src/components/builder/layers/LayerSync.tsx` | ✅ NOWY | Auto-scroll + highlight w warstwach |
| `src/components/builder/inspector/InspectorSync.tsx` | ✅ NOWY | Bridge selekcji → inspector data |
| `src/components/builder/canvas/BuilderCanvas.tsx` | ✅ Zintegrowany | data-section-id, SelectionOverlay w canvas frame |
| `packages/builder-core/src/__tests__/overlay-engine.test.ts` | ✅ NOWY | 25 testów — wszystkie przechodzą |

### Postęp: 100% ✅

### Zadania zrealizowane

#### 1. ✅ SelectionEngine (core) — rozszerzony o:
- **Multi-select**: `selectedIds: string[]` z `primarySelectionId` + `selectionMode`
- **Shift+Click range selection**: `anchorId` → zakres między anchor a current
- **Ctrl+Click additive toggle**: dodawanie/usuwanie z selekcji
- **Box select**: `BOX_SELECT` action z prostokątem + `sectionPositions`
- **selectParent()** — wybór rodzica w drzewie
- **selectChild()** — pierwsze dziecko kontenera
- **selectNext()/selectPrev()** — nawigacja siblingów (z pomijaniem locked)
- **buildBreadcrumbs()** — pełna ścieżka (strona → kontener → element)
- **isLocked()/isHidden()/isSelected()/isLastClicked()/isContainer()** — helpers
- **getNextSiblingId()/getPrevSiblingId()** — nawigacja z lockedIds

#### 2. ✅ CanvasState — rozszerzony o:
- **SelectionState**: `selectedIds`, `primarySelectionId`, `lastClickedId`, `anchorId`, `focusId`, `selectionMode`
- **Nowe akcje**: `SELECT_ALL`, `SELECT_PARENT`, `SELECT_CHILD`, `SELECT_NEXT`, `SELECT_PREV`, `BOX_SELECT`
- **Rect** i **SelectionBox** interfejsy
- **DEFAULT_SELECTION** — domyślny stan

#### 3. ✅ SelectionOverlay (UI) — 6 komponentów:
- **BoundingBox** — granatowa ramka z cieniem i animacją (framer-motion)
- **ResizeHandles** — 8 uchwytów (NW/N/NE/E/SE/S/SW/W) z odpowiednimi cursorami
- **HoverHighlight** — przerywana linia dla hoverowanego elementu
- **QuickToolbar** — pływający pasek akcji (↑ ↓ ⬡ 🗑 🔒 👁)
- **SelectionOverlay** — agreguje wszystkie sub-komponenty
- **useOverlay** — hook łączący OverlayController + DOM measurements

#### 4. ✅ Keyboard Navigation (w SelectionEngine)
- **↑/↓** — poprzednia/następna sekcja (SELECT_NEXT/SELECT_PREV)
- **→** — wejście w children (SELECT_CHILD)
- **←/Escape** — wyjście do rodzica (SELECT_PARENT)
- **Shift+Click** — range selection
- **Ctrl+Click** — additive toggle

#### 5. ✅ Synchronizacja Layers ↔ Canvas ↔ Inspector
- **LayerSync** — auto-scroll + highlight w layer tree po selekcji
- **InspectorSync** — render prop bridge: selection → registry → schema + props
- **data-section-id** atrybuty w BuilderCanvas dla overlay DOM detection

#### 6. ✅ Breadcrumbs (w SelectionEngine)
- **buildBreadcrumbs()** — pełna ścieżka z document.pages → page → container → element
- Integracja w `reduceSelection` przy każdej zmianie selekcji
- Breadcrumbs dostępne w `SelectionState.breadcrumbs`

#### 7. ✅ Tests — 25 unit testów, wszystkie przechodzą
```
 ✓ SelectionEngine > createInitialSelection
 ✓ SelectionEngine > reduceSelection (8 testów)
 ✓ SelectionEngine > buildBreadcrumbs (3 testy)
 ✓ SelectionEngine > selectParent (2 testy)
 ✓ SelectionEngine > isLocked/isHidden/isSelected (3 testy)
 ✓ SelectionEngine > isContainer (2 testy)
 ✓ SelectionEngine > getNextSiblingId/getPrevSiblingId (2 testy)
 ✓ SelectionEngine > computeSelectionBox (2 testy)
 ✓ SelectionEngine Integration (2 testy)
```

### Quality Checklist
- [x] `npm test` — 25/25 testów przechodzi ✅
- [x] Brak `any` w nowym kodzie
- [x] Brak TODO w implementacji
- [x] Wszystkie snappingi i wymiary są bez jednostek (pure logic)
- [x] 0 zależności od DOM w core — wszystkie testy w Node

### Następny sprint (Sprint 3 — Layout Engine + Inspector)
- Pełny Inspector z kategoriami (General, Layout, Spacing, Typography, Background, Border, Shadow, Effects)
- Layout Engine UI (Display, Flex/Grid/Stack, Padding, Margin, Gap)
- Typography Panel (font family, weight, spacing, line height, gradient text, shadow)

