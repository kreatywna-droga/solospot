# C16.1 — WEB FACTOR Studio Architecture

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 01_STUDIO_ARCHITECTURE.md  
> **Status:** Draft  
> **Zależności:** 00_STUDIO_VISION.md

---

## 1. Architektura modułów

```
┌──────────────────────────────────────────────────────────────┐
│                      UI LAYER (React)                         │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Toolbar │ │ Sidebar  │ │  Canvas  │ │   Inspector      │ │
│  │         │ │ Layers   │ │  iframe  │ │   Properties     │ │
│  │ Pages   │ │ Comps    │ │  Preview │ │   Categories     │ │
│  │ Assets  │ │ Pages    │ │          │ │                  │ │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └───────┬──────────┘ │
│       │           │            │                │           │
├───────┴───────────┴────────────┴────────────────┴───────────┤
│                   COMMAND BUS (dispatcher)                   │
│                   dispatch(command)                          │
├──────────────────────────────────────────────────────────────┤
│                     CORE ENGINE (builder-core)                │
│  ┌────────────┐ ┌───────────┐  ┌──────────┐ ┌─────────────┐ │
│  │ Selection  │ │   Drag    │  │  Layout  │ │  History     │ │
│  │ Engine     │ │   Engine  │  │  Engine  │ │  Stack       │ │
│  └────────────┘ └───────────┘  └──────────┘ └─────────────┘ │
│  ┌────────────┐ ┌───────────┐  ┌──────────┐ ┌─────────────┐ │
│  │ Responsive │ │ Animation │  │  Asset   │ │  Component  │ │
│  │ Engine     │ │  Engine   │  │  Manager │ │  Registry   │ │
│  └────────────┘ └───────────┘  └──────────┘ └─────────────┘ │
│  ┌────────────┐ ┌───────────┐                                │
│  │  AI        │ │  Preview  │                                │
│  │  Engine    │ │  Channel  │                                │
│  └────────────┘ └───────────┘                                │
├──────────────────────────────────────────────────────────────┤
│                    DATA LAYER (BuilderDocument)               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Document  │  Pages[]  │  Sections[]  │  Theme  │ SEO  │  │
│  └────────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────────┤
│                  COMPILE → PREVIEW / PUBLISH                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  compile()     │→│  PreviewRuntime   │→│  Publish      │ │
│  │  BuilderDoc →  │  │  (iframe)        │  │  Engine      │ │
│  │  StoreConfig   │  │                  │  │  (CDN)       │ │
│  └────────────────┘  └──────────────────┘  └──────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Command Bus — jedyny kanał mutacji

Każda akcja użytkownika → `BuilderCommand` → `dispatch(command)` → `BuilderContext`

### 2.1 Przepływ komendy

```
User Action (click, drag, keypress)
    ↓
UI Component (Canvas, LayerTree, Inspector)
    ↓
dispatch({ type: 'UPDATE_PROPS', pageId, sectionId, props })
    ↓
BuilderContext.dispatch()
    ↓
applyCommandToDocument()
    ↓
touchDocument() → version++, isDirty=true
    ↓
HistoryStack.push(snapshot, label)
    ↓
PreviewChannel.send(documentUpdate)
    ↓
React re-render (useState setCtx)
```

### 2.2 Typy komend

```
ADD_SECTION          — dodanie sekcji
ADD_CHILD_SECTION    — dodanie dziecka do kontenera
REMOVE_SECTION       — usunięcie sekcji
MOVE_SECTION         — przeniesienie sekcji
MOVE_SECTION_TO_PARENT — przeniesienie do innego rodzica
UPDATE_PROPS         — aktualizacja właściwości
REPLACE_PROPS        — zastąpienie wszystkich właściwości
TOGGLE_VISIBILITY    — pokaż/ukryj
TOGGLE_LOCK          — zablokuj/odblokuj
DUPLICATE_SECTION    — duplikuj sekcję
REORDER_SECTIONS     — zmiana kolejności
ALIGN_SECTIONS       — wyrównanie

ADD_PAGE             — dodanie strony
REMOVE_PAGE          — usunięcie strony
UPDATE_PAGE_META     — zmiana nazwy/sluga
UPDATE_PAGE_SEO      — zmiana SEO

UPDATE_THEME         — zmiana globalnego tematu
MARK_PUBLISHED       — oznaczenie jako opublikowane

CANVAS               — akcje canvasu (selekcja, hover, drag, resize)
UNDO / REDO          — cofanie/ponawianie
```

### 2.3 Command Pipeline

```
dispatch(command)
    ↓
[AUTH] — czy użytkownik ma prawo?
    ↓
[VALIDATE] — czy komenda jest poprawna?
    ↓
[EXECUTE] — applyCommandToDocument()
    ↓
[HISTORY] — push do HistoryStack (jeśli mutuje dokument)
    ↓
[PREVIEW] — wyślij update do PreviewChannel
    ↓
[RE-RENDER] — React re-renderuje UI
    ↓
[TELEMETRY] — zapisz do logów (opcjonalnie)
    ↓
[AI FEEDBACK] — wyślij do AI engine (opcjonalnie)
```

---

## 3. Komunikacja między modułami

### 3.1 Preview Channel (Canvas ↔ Runtime)

```
BuilderContext (Core)           PreviewRuntime (iframe)
    │                                  │
    │── createDocumentUpdate(doc) ────→│ render sections
    │── createSectionUpdate(id,props) →│ update section props
    │── createSectionHighlight(id) ───→│ highlight overlay
    │── createViewportChange(w,h) ────→│ resize viewport
    │── createThemeUpdate(theme) ─────→│ apply theme
    │                                  │
    │←───── ack(RENDERED) ────────────│
    │←─── ack(ERROR, sectionId) ──────│
```

Implementacje:
- **MemoryChannel** — dla testów i developmentu
- **PostMessageChannel** — dla produkcji (iframe)

### 3.2 Selection ↔ Canvas

```
SelectionEngine              Canvas
    │                           │
    │── selectSection(id) ────→│ highlight + scroll to
    │── hoverSection(id) ─────→│ show hover overlay
    │── multiSelect(ids) ─────→│ batch operations
    │                           │
    │←── click(x, y) ──────────│
    │←── mouseMove(x, y) ──────│
    │←── keyDown(key) ─────────│
```

### 3.3 Drag & Drop ↔ Layout Engine

```
DragEngine                  LayoutEngine
    │                           │
    │── beginDrag(id, pos) ───→│ calculate drop zones
    │── updateDrag(pos) ──────→│ snap to grid / guides
    │── endDrag(targetIdx) ───→│ reorder sections
    │                           │
    │←── dropZones() ──────────│
    │←── snapGuides() ─────────│
    │←── newIndex() ───────────│
```

### 3.4 Inspector ↔ ComponentRegistry

```
Inspector                   ComponentRegistry
    │                           │
    │── getSchema(type) ──────→│ return PropSchema[]
    │── getProps(sectionId) ──→│ current values
    │── updateProp(key, val) ─→│ dispatch UPDATE_PROPS
    │                           │
    │←── PropSchema[] ─────────│
    │←── defaultProps ─────────│
```

---

## 4. Data Flow — pełny cykl życia

```
1. LOAD: /api/stores/[storeId]
    ↓
2. apiStoreToBuilderDoc(apiStore) → BuilderDocument
    ↓
3. createBuilderContext({ document, registry, preview })
    ↓
4. BuilderProvider (React Context)
    ↓
5. Użytkownik edytuje → dispatch(command)
    ↓
6. BuilderContext.dispatch() → applyCommandToDocument()
    ↓
7. HistoryStack.push(snapshot)
    ↓
8. PreviewChannel.send(documentUpdate)
    ↓
9. Użytkownik klika "Zapisz"
    ↓
10. compile(doc) → StoreConfig
    ↓
11. PATCH /api/stores/[storeId]
```

---

## 5. Zależności modułów

```
Canvas Engine     → Selection Engine, Drag Engine, Layout Engine, Preview Channel
Selection Engine  → Canvas, LayerTree, Inspector (przez CommandBus)
Drag Engine       → Layout Engine, Grid System, Canvas
Layout Engine     → ComponentRegistry (schema), Responsive Engine
Inspector         → ComponentRegistry, Layout Engine, Design System
Design System     → Theme, Token System, compile()
Animation Engine  → Canvas, Preview Channel, Timeline
AI Assistant      → All Engines (generuje komendy)
History Engine    → BuilderDocument, Command Bus (snapshot pattern)
Asset Manager     → Storage API, Canvas, Inspector
```

---

## 6. Istniejący kod (builder-core)

Poniższe moduły już istnieją w `packages/builder-core/src/` i stanowią fundament:

| Moduł | Plik | Gotowość |
|-------|------|----------|
| BuilderDocument | BuilderDocument.ts | ✅ Stabilny |
| BuilderCommands | BuilderCommands.ts | ✅ Stabilny |
| BuilderContext | BuilderContext.ts | ✅ Stabilny |
| CanvasState | CanvasState.ts | ✅ Stabilny |
| ComponentRegistry | ComponentRegistry.ts | ✅ Stabilny |
| SectionTree | SectionTree.ts | ✅ Stabilny |
| HistoryStack | HistoryStack.ts | ✅ Stabilny |
| PreviewContract | PreviewContract.ts | ✅ Stabilny |
| PreviewMessage | PreviewMessage.ts | ✅ Stabilny |
| GridSystem | GridSystem.ts | ✅ Stabilny |
| LayoutEngine | LayoutEngine.ts | ⚠️ Podstawowy (tylko alignment) |
| ResponsiveEngine | ResponsiveEngine.ts | ⚠️ Podstawowy |
| SelectionEngine | SelectionEngine.ts | ⚠️ Wymaga rozszerzenia |
| DragEngine | DragEngine.ts | ⚠️ Wymaga rozszerzenia |
| ResizeEngine | ResizeEngine.ts | ⚠️ Wymaga rozszerzenia |

---

## 7. Decision Records

### DR-001: Command Pattern jako jedyny kanał mutacji
**Status:** Accepted  
**Uzasadnienie:** Każda akcja użytkownika to komenda. To umożliwia undo/redo, historię, AI i collaborative editing.

### DR-002: BuilderDocument oddzielony od StoreConfig
**Status:** Accepted  
**Uzasadnienie:** Edytor operuje na własnym modelu danych. Runtime i Publish konsumują skompilowany output przez `compile()`. To utrzymuje czystą separację odpowiedzialności.

### DR-003: Preview przez iframe z PostMessage
**Status:** Proposed  
**Uzasadnienie:** iframe izoluje runtime od edytora. PostMessage zapewnia bezpieczną komunikację. Alternatywa: MemoryChannel dla testów.

### DR-004: Schema-driven Inspector
**Status:** Accepted  
**Uzasadnienie:** Inspector jest generowany automatycznie na podstawie `PropSchema` z `ComponentRegistry`. Nie ma potrzeby tworzenia dedykowanych edytorów dla każdego komponentu.

### DR-005: Globalne tokeny zamiast lokalnych kolorów
**Status:** Proposed  
**Uzasadnienie:** Zmiana tokena primary aktualizuje wszystkie komponenty. To kluczowe dla Design Systemu.

