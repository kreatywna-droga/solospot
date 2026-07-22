# C7 Specification — Production-Ready Visual Builder

**Epic:** C7 — Production-Ready Visual Builder  
**Status:** CORE CERTIFIED — PRODUCT EXPERIENCE PENDING  
**Date:** 2026-07-19  
**Dependencies:** C6.1, C6.2, C6.3 (wszystkie zamrożone w Architecture Freeze v3.0)

---

## 1. Cel

Przekształcić Visual Builder z prototypu edycji właściwości w pełnoprawny edytor wizualny, w którym użytkownik bez znajomości kodu jest w stanie stworzyć, edytować i opublikować profesjonalną stronę lub sklep.

**Według Product Definition:** "Klient nie projektuje sklepu. Korzysta ze sprawdzonych, predefiniowanych, wysokokonwertujących układów."  
C7 nie zmienia tej zasady — dodaje profesjonalne narzędzia edycji dla użytkowników zaawansowanych, zachowując jednocześnie domyślny "guided" flow dla początkujących.

---

## 2. Status

### 2.1 C7 Core — CERTIFIED ✅

Wszystkie silniki domenowe Buildera są zaimplementowane, przetestowane i gotowe do użycia.

| Moduł | Status | Plik |
|-------|--------|------|
| Interaction Engine | ✅ | `CanvasState.ts` |
| Smart Selection System | ✅ | `SelectionEngine.ts` |
| Drag & Drop Engine | ✅ | `DragEngine.ts` |
| Resize Engine | ✅ | `ResizeEngine.ts` |
| Layout Engine | ✅ | `LayoutEngine.ts` |
| Responsive Engine | ✅ | `ResponsiveEngine.ts` |
| Builder UX | ✅ | `BuilderUX.ts`, `KeyboardShortcutRegistry.ts` |
| Builder Certification | ✅ | `__tests__/builder-certification.test.ts` (28 tests) |

**Walidacja:**
- `tsc --noEmit` clean
- 105/105 testów `builder-core` zielonych
- 28/28 testów certification C7 zielonych

### 2.2 C7 Product Experience — PENDING 🟡

React UI częściowo istnieje, ale nowe możliwości C7 nie są jeszcze w pełni podłączone.

| Komponent | Status | Brakuje |
|-----------|--------|---------|
| `BuilderCanvas` | 🟡 | Grid overlay, resize handles, alignment guides, drag feedback |
| `BuilderProvider` | 🟡 | Podpięcie nowych stanów C7 (grid, selection, responsive) |
| `BuilderApp` (TopBar) | ✅ | Viewport switcher, undo/redo |
| `PropsPanel` | 🟡 | Breakpoint editing, alignment tools |
| `LayerTree` | 🟡 | Lock/hidden indicators, smart selection |
| Runtime Integration | 🟡 | Preview sync przy drag/resize, responsive preview |

### 2.3 C7 Production Complete — Blokery

Aby zamknąć C7 w 100%, trzeba ukończyć:

1. **Canvas UI Enhancements**
   - [ ] Grid overlay renderowany na canvasie (12-column, guides)
   - [ ] Resize handles (8 kierunków) na selected section
   - [ ] Alignment guides podczas drag/resize
   - [ ] Drag & drop visual feedback (ghost, drop indicators)
   - [ ] Multi-select UI (marquee, batch selection)

2. **Smart Selection UI**
   - [ ] Hover overlays z szybkimi akcjami
   - [ ] Breadcrumbs component
   - [ ] Parent selection click-through
   - [ ] Locked/hidden element visualization
   - [ ] Selection filters

3. **Responsive UI**
   - [ ] Breakpoint switch w PropsPanel
   - [ ] Responsive prop editing per breakpoint
   - [ ] Visual breakpoint indicator na canvasie

4. **Runtime Integration**
   - [ ] Preview aktualizuje się przy drag
   - [ ] Preview aktualizuje się przy resize
   - [ ] Responsive preview działa (przełącz breakpoint → zmiana props)
   - [ ] Golden Flow Builder → Preview → Publish z nowymi funkcjami

---

## 2. Zakres

### 2.1 W zakresie (In Scope)

| Moduł | Opis |
|-------|------|
| C7.1 Interaction Engine | Pointer/Touch/Keyboard events, selection/hover/focus model |
| C7.2 Smart Selection System | Overlays, breadcrumbs, parent selection, handles |
| C7.3 Drag & Drop Engine | Drag, reorder, nesting, containers, auto-scroll |
| C7.4 Resize Engine | 8 handles, aspect ratio, constraints, snapping |
| C7.5 Layout Engine | 12-column grid, guides, snapping, alignment |
| C7.6 Responsive Engine | Desktop/Tablet/Mobile, breakpoint overrides |
| C7.7 Builder UX | Shortcuts, undo grouping, copy/paste, context menu |
| C7.8 Builder Certification | Golden Flow, performance, accessibility, regression |

### 2.2 Poza zakresem (Out of Scope)

| Moduł | Powód |
|-------|-------|
| Animation Editor | Zaawansowany — przenieś do C8 lub C9 |
| Free-form canvas | Sprzeczne z "predefined layouts" — nie pozwalamy na dowolne pozycjonowanie |
| Collaborative editing | Wymaga WebSocket/CRDT — zaawansowany |
| Version history w Builder | Podstawowy undo/redo w zakresie, pełna historia w C9 |

---

## 3. Sprints

### 3.1 C7.1-C7.8 — Core Certified ✅

Wszystkie silniki domenowe Buildera są zaimplementowane, przetestowane i gotowe do użycia.

| Moduł | Status | Plik |
|-------|--------|------|
| Interaction Engine | ✅ | `CanvasState.ts` |
| Smart Selection System | ✅ | `SelectionEngine.ts` |
| Drag & Drop Engine | ✅ | `DragEngine.ts` |
| Resize Engine | ✅ | `ResizeEngine.ts` |
| Layout Engine | ✅ | `LayoutEngine.ts` |
| Responsive Engine | ✅ | `ResponsiveEngine.ts` |
| Builder UX | ✅ | `BuilderUX.ts`, `KeyboardShortcutRegistry.ts` |
| Builder Certification | ✅ | `__tests__/builder-certification.test.ts` (28 tests) |

**Walidacja:**
- `tsc --noEmit` clean
- 105/105 testów `builder-core` zielonych
- 28/28 testów certification C7 zielonych

### 3.2 C7.9 — Visual Interaction Layer (IN PROGRESS)

Wszystko, co użytkownik widzi podczas pracy w Buildera.

| Moduł | Priorytet | Plik |
|-------|-----------|------|
| Grid Overlay (12-column + guides) | WYSOKI | `BuilderCanvas.tsx` |
| Resize Handles (8 kierunków) | WYSOKI | `BuilderCanvas.tsx` |
| Drag Ghost + Drop Indicators | WYSOKI | `BuilderCanvas.tsx` |
| Alignment Guides | ŚREDNI | `BuilderCanvas.tsx` |
| Marquee Selection + Multi Select UI | ŚREDNI | `BuilderCanvas.tsx` |
| Hover Overlay + Quick Actions | ŚREDNI | `BuilderCanvas.tsx`, `SectionBlock.tsx` |
| Smart Selection UI (breadcrumbs, parent, locked/hidden) | ŚREDNI | `BuilderApp.tsx`, `LayerTree.tsx` |

**Kryterium ukończenia:**
Builder wygląda i działa jak profesjonalny edytor wizualny.

### 3.3 C7.10 — Runtime UX Integration (PENDING)

Wszystko, co powoduje, że Builder "żyje" — natychmiastowe odzwierciedlenie akcji w Preview.

| Moduł | Priorytet | Plik |
|-------|-----------|------|
| Preview podczas drag | WYSOKI | `PreviewRuntimeAdapter.ts` |
| Preview podczas resize | WYSOKI | `PreviewRuntimeAdapter.ts` |
| Responsive Preview | WYSOKI | `ResponsiveEngine.ts`, `BuilderCanvas.tsx` |
| Breakpoint editing w PropsPanel | WYSOKI | `PropsPanel.tsx` |
| Smart Selection UI (pełna) | ŚREDNI | `BuilderApp.tsx`, `LayerTree.tsx` |
| Golden Flow Builder → Preview → Publish | WYSOKI | `BuilderApp.tsx` |

**Kryterium ukończenia:**
Każda akcja użytkownika natychmiast znajduje odzwierciedlenie w Preview.

### 3.4 C7 Production Complete — Blokery końcowe

Aby zamknąć C7 w 100%, trzeba ukończyć wszystkie moduły z C7.9 i C7.10, po czym:
- `tsc --noEmit` clean
- Wszystkie testy zielone
- Manualna weryfikacja: użytkownik bez znajomości kodu jest w stanie stworzyć, edytować i opublikować profesjonalną stronę lub sklep

---

## 4. Szczegółowy opis modułów

### 4.1 Drag & Drop PRO

**Plik:** `packages/builder-core/src/DragEngine.ts`

**Odpowiedzialność:** Przeciąganie sekcji i komponentów na canvasie.

**Kluczowe funkcje:**
- Drag z `SectionPanel` na `BuilderCanvas`
- Drag wewnątrz canvasa (reorder sections)
- Drag do nested containers
- Ghost element podczas drag
- Drop indicators (górna/dolna linia)
- Auto-scroll przy drag do krawędzi canvasu
- Snap do grid podczas drag
- Multi-drag (przeciąganie wielu zaznaczonych sekcji)

**API:**
```typescript
interface DragState {
  readonly isDragging: boolean;
  readonly draggedIds: ReadonlyArray<string>;
  readonly sourcePageId: string;
  readonly targetPageId: string;
  readonly targetIndex: number;
  readonly offset: { x: number; y: number };
}

interface CreateDragCommandOptions {
  readonly document: BuilderDocument;
  readonly draggedIds: ReadonlyArray<string>;
  readonly sourcePageId: string;
  readonly sourceIndex: number;
  readonly targetPageId: string;
  readonly targetIndex: number;
}

function createDragCommand(options: CreateDragCommandOptions): BuilderCommand;
```

**Kryteria akceptacji:**
- Sekcja można przeciągnąć z panelu na canvas
- Sekcję można reorderować w ramach strony
- Sekcję można przenieść między stronami
- Drag snappinguje do grid
- Multi-drag działa dla >1 zaznaczonych sekcji
- Auto-scroll działa przy drag do krawędzi
- Drop indicator pokazuje dokładne miejsce docelowe

### 4.2 Resize

**Plik:** `packages/builder-core/src/ResizeEngine.ts`

**Odpowiedzialność:** Zmiana rozmiaru sekcji.

**Kluczowe funkcje:**
- Resize handles (8 kierunków: N, NE, E, SE, S, SW, W, NW)
- Zachowanie proporcji (aspect ratio lock)
- Min/max size constraints
- Snap do grid podczas resize
- Visual feedback (size indicator)

**API:**
```typescript
interface ResizeState {
  readonly isResizing: boolean;
  readonly resizedId: string;
  readonly handle: 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
  readonly startSize: { width: number; height: number };
  readonly currentSize: { width: number; height: number };
}

interface CreateResizeCommandOptions {
  readonly document: BuilderDocument;
  readonly sectionId: string;
  readonly delta: { width: number; height: number };
  readonly aspectRatio?: number;
  readonly minSize?: { width: number; height: number };
  readonly maxSize?: { width: number; height: number };
}

function createResizeCommand(options: CreateResizeCommandOptions): BuilderCommand;
```

**Kryteria akceptacji:**
- 8 resize handles działa
- Aspect ratio lock działa
- Min/max constraints są egzekwowane
- Resize snappinguje do grid
- Size indicator pokazuje wymiary podczas resize

### 4.3 Grid System

**Plik:** `packages/builder-core/src/GridSystem.ts`

**Odpowiedzialność:** Grid snapping, guide lines, measurements.

**Kluczowe funkcje:**
- 12-kolumnowy grid (konfigurowalny)
- Gutters i margins
- Snap to grid
- Snap to element edges (element-to-element)
- Guide lines (poziome i pionowe)
- Rulers (opcjonalnie)
- Grid visibility toggle

**API:**
```typescript
interface GridConfig {
  readonly columns: number;
  readonly gutter: number;
  readonly margin: number;
  readonly snapToGrid: boolean;
  readonly showGuides: boolean;
  readonly showRulers: boolean;
}

interface SnapResult {
  readonly x: number;
  readonly y: number;
  readonly snapped: boolean;
  readonly guides: ReadonlyArray<{ axis: 'x' | 'y'; position: number }>;
}

class GridSystem {
  constructor(config: GridConfig);
  
  snap(x: number, y: number, elementBounds: DOMRect): SnapResult;
  toggleVisibility(): void;
  updateConfig(config: Partial<GridConfig>): void;
}
```

**Kryteria akceptacji:**
- 12-column grid renderuje się na canvasie
- Snap to grid działa dla drag i resize
- Snap to element edges działa
- Guide lines pojawiają się podczas drag/resize
- Grid visibility toggle działa
- Grid config jest per-document

### 4.4 Multi Select

**Plik:** `packages/builder-core/src/SelectionEngine.ts`

**Odpowiedzialność:** Wybór wielu sekcji jednocześnie.

**Kluczowe funkcje:**
- Click + Shift/Ctrl dla multi-select
- Drag selection box (marquee select)
- Select all (Ctrl+A)
- Batch operations (move, resize, delete, align)
- Visual feedback (selection borders, hover states)

**API:**
```typescript
interface SelectionState {
  readonly selectedIds: ReadonlyArray<string>;
  readonly hoveredId: string | null;
  readonly activeBreakpoint: ViewportLabel;
}

interface CreateSelectCommandOptions {
  readonly document: BuilderDocument;
  readonly sectionIds: ReadonlyArray<string>;
  readonly additive?: boolean; // Shift/Ctrl
}

function createSelectCommand(options: CreateSelectCommandOptions): BuilderCommand;

interface MarqueeSelection {
  readonly start: { x: number; y: number };
  readonly end: { x: number; y: number };
}

function createMarqueeSelectCommand(selection: MarqueeSelection): BuilderCommand;
```

**Kryteria akceptacji:**
- Shift+click dodaje do selekcji
- Ctrl+click toggleuje selekcję
- Drag selection box zaznacza wszystkie sekcje w obszarze
- Ctrl+A zaznacza wszystkie sekcje
- Batch move działa dla zaznaczonych sekcji
- Batch delete działa
- Visual feedback jest jasny i nie mylący

### 4.5 Alignment Tools

**Plik:** `packages/builder-core/src/AlignmentEngine.ts`

**Odpowiedzialność:** Wyrównywanie sekcji.

**Kluczowe funkcje:**
- Align left/center/right
- Align top/middle/bottom
- Distribute horizontal/vertical
- Stretch to fill
- Equal height/width
- Snap to alignment guides

**API:**
```typescript
type Alignment = 
  | 'LEFT'
  | 'CENTER'
  | 'RIGHT'
  | 'STRETCH'
  | 'TOP'
  | 'MIDDLE'
  | 'BOTTOM'
  | 'DISTRIBUTE_HORIZONTAL'
  | 'DISTRIBUTE_VERTICAL'
  | 'EQUAL_HEIGHT'
  | 'EQUAL_WIDTH';

interface CreateAlignCommandOptions {
  readonly document: BuilderDocument;
  readonly sectionIds: ReadonlyArray<string>;
  readonly alignment: Alignment;
}

function createAlignCommand(options: CreateAlignCommandOptions): BuilderCommand;
```

**Kryteria akceptacji:**
- Wszystkie alignment types działają
- Alignment snappinguje do grid
- Distribute rozkłada równomiernie
- Stretch rozciąga do pełnej szerokości
- Alignment guides pojawiają się podczas operacji

### 4.6 Keyboard Shortcuts

**Plik:** `packages/builder-core/src/KeyboardShortcutRegistry.ts`

**Odpowiedzialność:** Rejestr i obsługa skrótów klawiszowych.

**Kluczowe funkcje:**
- Undo/Redo (Ctrl+Z / Ctrl+Shift+Z / Cmd+Z / Cmd+Shift+Z)
- Copy/Paste (Ctrl+C / Ctrl+V / Cmd+C / Cmd+V)
- Delete (Delete / Backspace)
- Select All (Ctrl+A / Cmd+A)
- Duplicate (Ctrl+D / Cmd+D)
- Group/Ungroup (Ctrl+G / Ctrl+Shift+G)
- Save (Ctrl+S / Cmd+S)
- Escape (deselect)

**API:**
```typescript
interface Shortcut {
  readonly key: string;
  readonly modifiers?: {
    readonly ctrl?: boolean;
    readonly shift?: boolean;
    readonly alt?: boolean;
    readonly meta?: boolean;
  };
  readonly action: () => void;
  readonly description: string;
}

class KeyboardShortcutRegistry {
  register(shortcut: Shortcut): void;
  unregister(key: string): void;
  handleKeyDown(event: KeyboardEvent): void;
  getRegisteredShortcuts(): ReadonlyArray<Shortcut>;
}
```

**Kryteria akceptacji:**
- Wszystkie skróty działają na Mac i Windows
- Skróty są kontekstowe (nie działają gdy focus jest w input)
- Skróty można wyświetlić w help overlay
- Shortcuts są rejestrowalne (extension point)

### 4.7 Responsive Editor

**Plik:** `packages/theme-runtime/src/ResponsiveEditor.ts`

**Odpowiedzialność:** Edycja właściwości per breakpoint.

**Kluczowe funkcje:**
- Properties per breakpoint (desktop, tablet, mobile)
- Inheritance (mobile inherits from desktop jeśli nie nadpisano)
- Visual breakpoint indicator
- Preview per breakpoint
- Export responsive props do StoreConfig

**API:**
```typescript
type Breakpoint = 'desktop' | 'tablet' | 'mobile';

interface ResponsiveValue<T> {
  readonly desktop?: T;
  readonly tablet?: T;
  readonly mobile?: T;
}

interface ResponsiveSectionProps {
  readonly sectionId: string;
  readonly props: Record<string, ResponsiveValue<any>>;
  readonly activeBreakpoint: Breakpoint;
}

class ResponsiveEditor {
  setBreakpoint(breakpoint: Breakpoint): void;
  getEffectiveProps(sectionId: string, baseProps: Record<string, any>): Record<string, any>;
  setResponsiveProp(sectionId: string, propName: string, value: any, breakpoint: Breakpoint): void;
  exportToStoreConfig(): StoreConfig;
}
```

**Kryteria akceptacji:**
- Każda właściwość może mieć inną wartość per breakpoint
- Mobile inherits from desktop jeśli brak nadpisania
- Zmiana breakpointu aktualizuje preview
- Responsive props są zapisywane w StoreConfig
- PreviewPipeline używa effective props dla aktualnego breakpointu

### 4.8 Section Nesting

**Plik:** `packages/builder-core/src/ContainerSection.ts`

**Odpowiedzialność:** Tworzenie zagnieżdżonych sekcji (containers).

**Kluczowe funkcje:**
- Container section type
- Drag sekcji do containeru
- Nesting depth limit (max 3 poziomy)
- Visual nesting indicator
- Collapse/expand containers

**API:**
```typescript
interface ContainerSection extends RuntimeSection {
  readonly type: 'container';
  readonly children: ReadonlyArray<string>; // section IDs
  readonly collapsed: boolean;
}

function createContainerSection(params: {
  id: string;
  label: string;
  children?: ReadonlyArray<string>;
}): ContainerSection;

function createNestCommand(options: {
  readonly document: BuilderDocument;
  readonly sectionId: string;
  readonly targetContainerId: string;
}): BuilderCommand;

function createUnnestCommand(options: {
  readonly document: BuilderDocument;
  readonly sectionId: string;
}): BuilderCommand;
```

**Kryteria akceptacji:**
- Container można dodać z ComponentPanel
- Sekcję można przeciągnąć do containeru
- Nesting depth limit jest egzekwowany (max 3)
- Container można collapse/expand
- Collapsed container nie renderuje dzieci w preview

### 4.9 Smart Selection System

**Plik:** `packages/builder-core/src/SelectionEngine.ts`

**Odpowiedzialność:** Profesjonalny system selekcji znany z Figma/Webflow/Framer.

**Kluczowe funkcje:**
- Hover overlays z podglądem sekcji i szybkimi akcjami
- Smart handles (resize/rotate/move) na selected elements
- Breadcrumbs ścieżki zagnieżdżenia (container > section > component)
- Parent selection (click na kontener zaznacza cały zagnieżdżony element)
- Locked/hidden elements visualization
- Selection filters (tylko widoczne, tylko unlocked, po typie)
- Click-through dla zagnieżdżonych elementów

**API:**
```typescript
interface SelectionState {
  readonly selectedIds: ReadonlyArray<string>;
  readonly hoveredId: string | null;
  readonly activeBreakpoint: ViewportLabel;
  readonly lockedIds: ReadonlyArray<string>;
  readonly hiddenIds: ReadonlyArray<string>;
}

interface SmartHandle {
  readonly type: 'move' | 'resize' | 'rotate' | 'delete' | 'duplicate';
  readonly position: { x: number; y: number };
  readonly cursor: string;
}

interface BreadcrumbItem {
  readonly id: string;
  readonly type: string;
  readonly label: string;
}

interface CreateSmartSelectCommandOptions {
  readonly document: BuilderDocument;
  readonly sectionId: string;
  readonly additive?: boolean;
  readonly parentSelect?: boolean;
}

function createSmartSelectCommand(options: CreateSmartSelectCommandOptions): BuilderCommand;
```

**Kryteria akceptacji:**
- Hover overlay pokazuje sekcję + szybkie akcje
- Smart handles pojawiają się na selected element
- Breadcrumbs pokazują ścieżkę zagnieżdżenia
- Parent selection działa (click na kontener)
- Locked/hidden elements są wizualnie oznaczone
- Selection filter działa
- Click-through działa dla zagnieżdżonych elementów

---

## 5. Integracja z istniejącymi modułami

### 5.1 BuilderCanvas

**Zmiana:** BuilderCanvas przejdzie z wireframe preview na pełny iframe z PreviewPipeline.

**Przed:**
```
BuilderCanvas → SectionNode → wireframe div
```

**Po:**
```
BuilderCanvas → PreviewChannel → PreviewRuntimeAdapter → PreviewRuntime → PreviewPipeline → HTML
```

### 5.2 BuilderProvider

**Zmiana:** Dodanie nowych stanów do BuilderContext.

**Przed:**
```typescript
interface BuilderContext {
  document: BuilderDocument;
  canvas: CanvasState;
  history: HistoryStack<BuilderDocument>;
}
```

**Po:**
```typescript
interface BuilderContext {
  document: BuilderDocument;
  canvas: CanvasState;
  history: HistoryStack<BuilderDocument>;
  selection: SelectionState;
  grid: GridConfig;
  shortcuts: KeyboardShortcutRegistry;
}
```

### 5.3 PreviewPipeline

**Zmiana:** PreviewPipeline obsługuje `SECTION_UPDATE` z właściwościami per breakpoint.

**Przed:**
```
SECTION_UPDATE → renderSection(sectionId, props)
```

**Po:**
```
SECTION_UPDATE → ResponsiveEditor.getEffectiveProps() → renderSection(sectionId, effectiveProps)
```

---

## 6. Test Strategy

### 6.1 Unit Tests

| Moduł | Liczba testów | Priorytet |
|-------|---------------|-----------|
| DragEngine | 15 | WYSOKI |
| ResizeEngine | 12 | WYSOKI |
| GridSystem | 10 | WYSOKI |
| SelectionEngine | 15 | WYSOKI |
| AlignmentEngine | 8 | ŚREDNI |
| KeyboardShortcutRegistry | 10 | ŚREDNI |
| ResponsiveEditor | 10 | WYSOKI |
| ContainerSection | 8 | ŚREDNI |
| SmartSelectionSystem | 12 | WYSOKI |
| **RAZEM** | **100** | — |

### 6.2 Integration Tests

| Test | Opis |
|------|------|
| Drag & Drop + Preview sync | Sekcja przeciągnięta → Preview aktualizuje się |
| Resize + Preview sync | Sekcja zresizowana → Preview aktualizuje się |
| Multi-select + Batch align | Wiele sekcji wyrównanych → Preview aktualizuje się |
| Responsive + Preview | Zmiana breakpointu → Preview pokazuje właściwe props |
| Keyboard shortcuts + Undo/Redo | Skrót → undo → redo → stan początkowy |

### 6.3 E2E Tests (Playwright)

| Test | Opis |
|------|------|
| Full drag & drop flow | Przeciągnij Hero z panelu na canvas |
| Resize section | Zmień rozmiar ProductGrid |
| Multi-select + delete | Zaznacz 3 sekcje → delete |
| Responsive editing | Zmień właściwość na mobile → przełącz na desktop |
| Keyboard shortcuts | Ctrl+Z, Ctrl+C, Ctrl+V, Ctrl+D |

---

## 7. Acceptance Criteria

C7 jest ukończone gdy:

1. ✅ Wszystkie moduły z sekcji 4 są zaimplementowane
2. ✅ 100 unit tests przechodzi zielono
3. ✅ 5 integration tests przechodzi zielono
4. ✅ 5 E2E tests przechodzi zielono
5. ✅ `tsc --noEmit` clean
6. ✅ `npm run build` success
7. ✅ Architecture Freeze v3.0 przestrzegane
8. ✅ Nowe kontrakty oznaczone jako `@experimental`
9. ✅ Dokumentacja aktualna
10. ✅ Performance: drag/resize ma < 16ms latency (60fps)
11. ✅ Smart Selection System działa (hover overlays, breadcrumbs, parent selection, locked/hidden visualization)

---

## 8. Wersja dokumentu

| Wersja | Data | Zmiany |
|--------|------|--------|
| 1.0 | 2026-07-19 | Pierwsza wersja specyfikacji |

---

## 9. Podpis cyfrowy

Specyfikacja C7 jest gotowa do implementacji po zatwierdzeniu przez architekta.

**Status:** READY FOR REVIEW ✅  
**Data:** 2026-07-19  
**Wersja:** 1.0
