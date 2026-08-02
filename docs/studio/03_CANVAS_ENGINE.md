# C16.3 — WEB FACTOR Studio Canvas Engine

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 03_CANVAS_ENGINE.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 02_UI_LAYOUT.md

---

## 1. Cel

Canvas Engine to serce Studio. Odpowiada za renderowanie prawdziwej strony w iframe i synchronizację między edytorem a podglądem.

**Kluczowa zmiana w stosunku do obecnego stanu:**
- Obecnie: wireframe'y (kolorowe bloki z ikonkami)
- Docelowo: prawdziwy HTML w iframe z live preview

---

## 2. Architektura Canvas

```
┌────────────────────────────────────────────────────────────┐
│                    BUILDER UI (React)                       │
│                                                            │
│  BuilderCanvas.tsx                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  <iframe>                                            │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  PreviewRuntime (sandbox)                      │  │  │
│  │  │  - Renderuje StoreConfig z compile()            │  │  │
│  │  │  - Nasłuchuje na PostMessage                    │  │  │
│  │  │  - Wysyła kliknięcia/hover z powrotem           │  │  │
│  │  │  - Sekcje jako shadow DOM/web components        │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│  Selection Overlay (React, nad iframe)                     │
│  - Niezależna warstwa overlay                              │
│  - Renderuje bounding box, resize handles, toolbar         │
│  - Synchronizowana z SelectionEngine przez Context         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 2.1 Warstwy Canvasu

```
Z-index: 100  → Context Menu (right-click)
Z-index: 50   → Selection Overlay (bounding box, handles)
Z-index: 10   → Grid Overlay (guides, rulers)
Z-index: 1    → Drop Zone Indicators (drag & drop preview)
Z-index: 0    → iframe (strona)
```

---

## 3. Preview Runtime (iframe)

### 3.1 Komunikacja

```
Builder → Preview (PostMessage):
  DOCUMENT_UPDATE    — pełny dokument
  SECTION_UPDATE     — aktualizacja propsów sekcji
  SECTION_HIGHLIGHT  — podświetlenie sekcji
  SECTION_SELECT     — przewinięcie do sekcji
  VIEWPORT_CHANGE    — zmiana rozmiaru viewportu
  THEME_UPDATE       — zmiana tematu
  RESET              — reset preview

Preview → Builder (PostMessage):
  ACK_RENDERED       — sekcja wyrenderowana
  ACK_ERROR          — błąd renderowania
  ELEMENT_CLICK      — kliknięcie w elemencie
  ELEMENT_HOVER      — hover nad elementem
  ELEMENT_DBLCLICK   — double-click (inline edit)
  VIEWPORT_READY     — iframe gotowy
```

### 3.2 Życie iframe'a

```
1. BuilderCanvas.tsx tworzy <iframe>
2. iframe ładuje /api/preview/[storeId] (lokalny endpoint)
3. PreviewRuntime nasłuchuje na message
4. Po gotowości wysyła VIEWPORT_READY
5. Builder wysyła DOCUMENT_UPDATE z początkowym dokumentem
6. PreviewRuntime renderuje stronę
7. Każda zmiana → SECTION_UPDATE → częściowe przerenderowanie
```

### 3.3 Selekcyjny overlay w iframe

PreviewRuntime musi wysłać informację o pozycji elementu:

```typescript
interface ElementClickMessage {
  messageType: 'ELEMENT_CLICK';
  sectionId: string;
  boundingBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  ctrlKey: boolean;
  shiftKey: boolean;
}
```

Builder na tej podstawie rysuje overlay w swojej warstwie (nad iframe).

---

## 4. Selection Overlay

### 4.1 Komponenty overlay

```
SelectionOverlay.tsx
├── BoundingBox      — niebieska ramka wokół wybranej sekcji
├── ResizeHandles    — 8 uchwytów (n, ne, e, se, s, sw, w, nw)
├── QuickToolbar     — mini toolbar nad sekcją
│   ├── ↑ (move up)
│   ├── ↓ (move down)
│   ├── ⏹ (duplicate)
│   ├── 🗑 (delete)
│   └── ⋮ (więcej)
├── Breadcrumb       — ścieżka: Home > Hero > Heading
└── HoverHighlight   — podświetlenie na hover
```

### 4.2 Pozycjonowanie

```typescript
// Synchronizacja pozycji overlay z iframe
function updateOverlayPosition() {
  const iframeRect = iframeRef.current.getBoundingClientRect();
  const elementRect = selectedElement.boundingBox;
  
  // Skalujemy względem zoomu i viewportu
  overlay.style.top = `${iframeRect.top + elementRect.top * zoom}px`;
  overlay.style.left = `${iframeRect.left + elementRect.left * zoom}px`;
  overlay.style.width = `${elementRect.width * zoom}px`;
  overlay.style.height = `${elementRect.height * zoom}px`;
}
```

---

## 5. Viewport Management

### 5.1 Responsywny canvas

```typescript
interface ViewportConfig {
  label: 'DESKTOP' | 'TABLET' | 'MOBILE';
  width: number;        // 1280 | 768 | 375
  height?: number;      // opcjonalne
  scale: number;        // dopasowanie do okna
}
```

### 5.2 Skalowanie

```
Desktop (1280px) → dopasowany do szerokości okna (minus sidebar)
Tablet (768px)   → wyśrodkowany, z cieniem
Mobile (375px)   → wyśrodkowany, zaokrąglone rogi jak telefon
```

---

## 6. Zoom

```typescript
interface ZoomConfig {
  level: number;        // 0.25 – 2.0
  step: number;         // 0.1
  presets: number[];    // [25, 50, 75, 100, 125, 150, 200]
  fitToWidth: boolean;  // dopasuj do szerokości
}
```

- Ctrl+Scroll → zoom in/out
- Ctrl+0 → fit to width
- Ctrl+= → zoom in
- Ctrl+- → zoom out

---

## 7. Grid & Guides

### 7.1 Grid overlay

```typescript
interface GridConfig {
  columns: number;       // 12 (domyślnie)
  gutter: number;        // 16px
  margin: number;        // 24px
  snapToGrid: boolean;   // przyciąganie
  showGuides: boolean;   // pokaż prowadnice
  showRulers: boolean;   // pokaż linijki
  color: string;         // kolor siatki
  opacity: number;       // przezroczystość
}
```

### 7.2 Snap to grid

```typescript
function snapToGrid(
  x: number, 
  y: number, 
  width: number, 
  config: GridConfig
): { x: number; y: number; snapped: boolean } {
  const colWidth = (viewportWidth - 2 * config.margin 
    - (config.columns - 1) * config.gutter) / config.columns;
  
  const snappedX = Math.round((x - config.margin) 
    / (colWidth + config.gutter)) * (colWidth + config.gutter) + config.margin;
  
  return { x: snappedX, y, snapped: snappedX !== x };
}
```

### 7.3 Dynamic guides

```
Przeciąganie elementu → pokazuje prowadnice:
- Wyrównanie do środka (pionowa linia)
- Wyrównanie do krawędzi innych elementów
- Odstępy między elementami
- Marginesy kontenera
```

---

## 8. Implementacja

### 8.1 Pliki

```
src/components/builder/canvas/
├── BuilderCanvas.tsx         — główny komponent canvasu
├── PreviewFrame.tsx          — iframe wrapper
├── SelectionOverlay.tsx      — overlay selekcji
├── ResizeHandles.tsx         — uchwyty resize
├── QuickToolbar.tsx          — mini toolbar
├── GridOverlay.tsx           — siatka i prowadnice
├── Rulers.tsx                — linijki
├── DropIndicator.tsx         — wskaźnik dropu
├── Breadcrumbs.tsx           — breadcrumb
└── ZoomControls.tsx          — kontrola zoomu
```

### 8.2 Hooki

```typescript
// hooks/usePreviewFrame.ts
function usePreviewFrame(storeId: string) {
  // Tworzy iframe, zarządza PostMessage, zwraca ref
}

// hooks/useSelectionOverlay.ts
function useSelectionOverlay(iframeRef, selectedSection) {
  // Oblicza pozycję overlay względem iframe
}

// hooks/useViewportSync.ts
function useViewportSync(viewport) {
  // Synchronizuje rozmiar iframe z viewportem
}

// hooks/useZoom.ts
function useZoom(initialZoom = 1) {
  // Zoom + scroll + fit to width
}
```

### 8.3 Stan canvasu (CanvasState.ts — istnieje)

```typescript
// Już istnieje w packages/builder-core/src/CanvasState.ts
interface CanvasState {
  mode: CanvasMode;              // SELECT | INSERT | MOVE | PREVIEW
  selectedSectionId: string | null;
  selectedPageId: string | null;
  hoveredSectionId: string | null;
  viewport: ViewportSize;
  zoom: number;
  grid: GridConfig;
  // ... więcej pól istnieje
}
```

---

## 9. Zależności od istniejącego kodu

| Moduł | Stan | Uwagi |
|-------|------|-------|
| `BuilderDocument.ts` | ✅ Gotowe | Model dokumentu |
| `CanvasState.ts` | ✅ Gotowe | Stan canvasu, viewport, zoom |
| `PreviewContract.ts` | ✅ Gotowe | MemoryChannel, PostMessage |
| `PreviewMessage.ts` | ✅ Gotowe | Typy wiadomości |
| `PreviewRuntimeAdapter.ts` | ⚠️ Istnieje | Wymaga rozszerzenia o dwukierunkową komunikację |
| `BuilderCanvas.tsx` | 🔄 Do przebudowy | Z wireframe → iframe |
| `SelectionEngine.ts` | ⚠️ Istnieje | Wymaga synchronizacji z iframe |
| `GridSystem.ts` | ✅ Gotowe | Grid, snap, guides |

---

## 10. Decision Records

### DR-CANVAS-001: iframe zamiast shadow DOM
**Status:** Proposed  
**Uzasadnienie:** iframe zapewnia izolację stylów, bezpieczeństwo i możliwość użycia tego samego runtime'u co publikacja. Shadow DOM nie daje pełnej izolacji CSS.

### DR-CANVAS-002: Overlay nad iframe zamiast w iframe
**Status:** Proposed  
**Uzasadnienie:** Overlay (bounding box, handles) są w React, nad iframe. To pozwala na płynne animacje i uniezależnia od runtime'u w iframe.

### DR-CANVAS-003: Sekcje renderowane przez runtime-core
**Status:** Proposed  
**Uzasadnienie:** Preview używa tego samego silnika co publikacja. compile(BuilderDocument) → StoreConfig → RuntimeEngine(PREVIEW). Zero duplikacji kodu.

