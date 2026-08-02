# Sprint 5C — Canvas Completion Specification

> **Status:** ✅ Zatwierdzone
> **Sprint:** 5C — Canvas Completion
> **Cel:** Pełna specyfikacja architektury Canvas, jego odpowiedzialności oraz integracji z wszystkimi subsystemami wizualnymi
> **Zależności:** 03_CANVAS_ENGINE.md, 01_STUDIO_ARCHITECTURE.md, Sprint 5B.4 (Radius Engine)

---

## 1. Architektura Canvas

Canvas jest warstwą integrującą — nie implementuje logiki poszczególnych subsystemów, a jedynie koordynuje przepływ danych pomiędzy nimi.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        BUILDER STUDIO                               │
│                                                                     │
│  ┌──────────┐  ┌────────────────────┐  ┌────────────────────────┐  │
│  │  Toolbar  │  │      Canvas        │  │      Inspector         │  │
│  │  Sidebar  │  │  ┌──────────────┐  │  │  ┌────────────────┐  │  │
│  │  Layers   │  │  │  iframe      │  │  │  │  Layout Section │  │  │
│  │           │  │  │  (Preview)   │  │  │  │  Grid Section   │  │  │
│  └──────────┘  │  │              │  │  │  │  Overflow Sec.   │  │  │
│                │  │  Runtime     │  │  │  │  Border Section  │  │  │
│                │  │  ←→ PostMsg  │  │  │  │  Radius Section  │  │  │
│                │  └──────────────┘  │  │  └────────────────┘  │  │
│                │  ┌──────────────┐  │  └────────────────────────┘  │
│                │  │  Overlay     │  │                              │
│                │  │  (React)     │  │                              │
│                │  └──────────────┘  │                              │
│                └────────────────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                        │
         ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      COMMAND BUS (dispatch)                         │
│              jedyny kanał mutacji — applyCommandToDocument()        │
└─────────────────────────────────────────────────────────────────────┘
         │                    │                        │
         ▼                    ▼                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      BUILDER CORE (builder-core)                    │
│                                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │  LayoutTypes  │ │  GridTypes   │ │ BorderTypes  │ │ RadiusTypes│ │
│  │  spacingToCSS │ │ gridToCSS   │ │ borderToCSS  │ │radiusToCSS │ │
│  │  displayToCSS │ │ trackToCSS  │ │              │ │            │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────────┘ │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────┐│
│  │  Overflow    │ │  Selection   │ │  BuilderContext + History    ││
│  │ overflowToCSS│ │  Engine      │ │  dispatch → applyCommand()  ││
│  └──────────────┘ └──────────────┘ └──────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### 1.1 Warstwy Canvasu

```
Z-index: 100  → Context Menu (right-click)
Z-index: 50   → Selection Overlay (bounding box, handles, toolbar)
Z-index: 10   → Grid Overlay (guides, rulers, breakpoint indicators)
Z-index: 1    → Drop Zone Indicators (drag & drop preview)
Z-index: 0    → iframe (strona renderowana przez Runtime)
```

### 1.2 Odpowiedzialności Canvas

| Odpowiedzialność | Opis | Realizacja |
|-----------------|------|------------|
| **Renderowanie** | Wyświetla podgląd strony w iframe z użyciem Runtime | PreviewChannel → PostMessage |
| **Selekcja** | Umożliwia wybór sekcji na Canvasie | SelectionEngine → SelectionOverlay |
| **Manipulacja** | Move, resize, duplicate, delete sekcji | DragEngine, ResizeEngine |
| **Integracja CSS** | Przekazuje właściwości 5 subsystemów do Runtime | compile() → DocumentUpdateMessage |
| **Viewport** | Symulacja breakpointów (DESKTOP/TABLET/MOBILE) | CanvasState.viewport |
| **Overlay** | Rysowanie bounding box, uchwytów, szybkich akcji | SelectionOverlay → BoundingBox, ResizeHandles |

---

## 2. Integracja z subsystemami wizualnymi

Canvas integruje 5 subsystemów poprzez mechanizm **property propagation**:

### 2.1 Layout Engine

| Właściwość | Typ | Funkcja CSS | Registry Key | Inspector Field |
|-----------|-----|-------------|-------------|-----------------|
| display | DisplayMode | displayToCSS() | - | FlexField (pośrednio) |
| flexDirection | FlexDirection | displayToCSS() | - | FlexField |
| justifyContent | JustifyContent | displayToCSS() | - | FlexField |
| alignItems | AlignItems | displayToCSS() | - | FlexField |
| padding | SpacingValue | spacingToCSS() | spacing | SpacingField |
| margin | SpacingValue | spacingToCSS() | spacing | SpacingField |
| width | SizeValue | sizeToCSS() | size | SizeField |
| height | SizeValue | sizeToCSS() | size | SizeField |
| position | PositionType | positionToCSS() | position | PositionField |

**Propagacja:** LayoutTypes → SectionNode.props → compile() → CSS object → PreviewChannel → Runtime

### 2.2 Grid Engine

| Właściwość | Typ | Funkcja CSS | Registry Key | Inspector Field |
|-----------|-----|-------------|-------------|-----------------|
| gridTemplateColumns | TrackList | trackListToCSS() | grid-tracks | GridField |
| gridTemplateRows | TrackList | trackListToCSS() | grid-tracks | GridField |
| gridAutoFlow | GridAutoFlow | gridContainerToCSS() | grid-tracks | GridField |
| gridColumn | GridSpanValue | gridSpanToCSS() | grid-span | GridField |
| gridRow | GridSpanValue | gridSpanToCSS() | grid-span | GridField |

**Propagacja:** GridTypes → SectionNode.props → compile() → CSS object → PreviewChannel → Runtime

### 2.3 Overflow Engine

| Właściwość | Typ | Funkcja CSS | Registry Key | Inspector Field |
|-----------|-----|-------------|-------------|-----------------|
| overflow | OverflowMode | overflowToCSS() | overflow | OverflowField |
| overflowX | OverflowMode | overflowToCSS() | overflow | OverflowField |
| overflowY | OverflowMode | overflowToCSS() | overflow | OverflowField |

**Propagacja:** OverflowProps → SectionNode.props → compile() → CSS object → PreviewChannel → Runtime

### 2.4 Border Engine

| Właściwość | Typ | Funkcja CSS | Registry Key | Inspector Field |
|-----------|-----|-------------|-------------|-----------------|
| borderStyle | BorderStyle | borderToCSS() | border-width | BorderField |
| borderWidth | BorderWidthValue | borderToCSS() | border-width | BorderField |
| borderColor | string | borderToCSS() | border-width | BorderField |

**Propagacja:** BorderTypes → SectionNode.props → compile() → CSS object → PreviewChannel → Runtime

### 2.5 Radius Engine

| Właściwość | Typ | Funkcja CSS | Registry Key | Inspector Field |
|-----------|-----|-------------|-------------|-----------------|
| mode | RadiusMode | radiusToCSS() | radius | RadiusField |
| radius | RadiusValue | radiusToCSS() | radius | RadiusField |
| topLeft | RadiusValue | radiusToCSS() | radius | RadiusField |
| topRight | RadiusValue | radiusToCSS() | radius | RadiusField |
| bottomRight | RadiusValue | radiusToCSS() | radius | RadiusField |
| bottomLeft | RadiusValue | radiusToCSS() | radius | RadiusField |

**Propagacja:** RadiusTypes → SectionNode.props → compile() → CSS object → PreviewChannel → Runtime

---

## 3. Przepływ Runtime ↔ Canvas

### 3.1 Render Flow (Builder → Runtime)

```
1. Użytkownik edytuje sekcję w Inspectorze
2. Inspector → dispatch(UPDATE_PROPS, { pageId, sectionId, props })
3. BuilderContext.dispatch() → applyCommandToDocument()
4. HistoryStack.push(snapshot)
5. sendPreviewUpdate(preview, newDoc)
6. PreviewChannel.send(createDocumentUpdate(doc))
7. iframe odbiera PostMessage → Runtime re-renderuje sekcję
```

### 3.2 Selection Flow (Runtime → Builder)

```
1. Użytkownik klika w sekcję w iframe
2. Runtime wysyła PostMessage: ELEMENT_CLICK
3. BuilderCanvas odbiera → dispatch(CANVAS SELECT_SECTION)
4. SelectionEngine aktualizuje stan selekcji
5. SelectionOverlay rysuje bounding box nad iframe
6. InspectorPanel ładuje schema i props wybranej sekcji
```

### 3.3 Update Flow (Inspector ↔ Canvas ↔ Runtime)

```
1. Inspector: użytkownik zmienia wartość w polu
2. InspectorRuntime.createPropertyCommand() → UPDATE_PROPS
3. dispatch(UPDATE_PROPS) → BuilderContext
4. applyCommandToDocument() → nowy dokument
5. HistoryStack.push()
6. PreviewChannel.send(DocumentUpdate)
7. Runtime odbiera → re-renderuje sekcję z nowymi CSS
8. Canvas SelectionOverlay odświeża pozycję (jeśli zmienił się rozmiar)
```

### 3.4 Property Synchronization

```
Wszystkie 5 subsystemów używa tego samego wzorca synchronizacji:

1. SectionNode.props zawiera wszystkie właściwości (Layout, Grid, Overflow, Border, Radius)
2. compile() iteruje po props i wywołuje odpowiednie funkcje CSS
3. Wygenerowany CSS obiekt jest wysyłany do Runtime przez DocumentUpdate
4. Inspector odczytuje props z SectionNode i renderuje odpowiednie Field komponenty
5. Zmiana w Inspector → UPDATE_PROPS → nowy SectionNode.props → re-kompilacja

Kluczowa zasada: Żaden subsystem nie posiada własnego kanału synchronizacji.
Wszystkie używają wspólnego mechanizmu UPDATE_PROPS + compile().
```

---

## 4. Zależności z Inspector

### 4.1 Registry-based dispatch

Wszystkie 5 subsystemów są zarejestrowane w `PropertyFieldRegistry`:

```typescript
propertyFieldRegistry
  .register('spacing', SpacingField)     // Layout Engine (padding, margin)
  .register('size', SizeField)           // Layout Engine (width, height)
  .register('position', PositionField)   // Layout Engine
  .register('flex', FlexField)           // Layout Engine (display, flex)
  .register('grid-tracks', GridField)    // Grid Engine
  .register('grid-span', GridField)      // Grid Engine
  .register('overflow', OverflowField)   // Overflow Engine
  .register('border-width', BorderField) // Border Engine
  .register('radius', RadiusField)       // Radius Engine
```

### 4.2 Inspector → Canvas → Runtime flow

```
PropertyField.onChange(key, value)
  → InspectorRuntime.createPropertyCommand() → BuilderCommand (UPDATE_PROPS)
    → dispatch(command)
      → BuilderContext → applyCommandToDocument()
        → HistoryStack.push()
        → PreviewChannel.send(DocumentUpdate)
          → Runtime re-renderuje
```

### 4.3 Canvas → Inspector flow

```
Użytkownik klika w iframe
  → Runtime → PostMessage(ELEMENT_CLICK, sectionId)
    → dispatch(CANVAS SELECT_SECTION)
      → SelectionEngine aktualizuje selectedSectionId
        → InspectorSync odczytuje nową sekcję z dokumentu
          → ładuje ComponentDescriptor z registry
            → renderuje właściwe Field komponenty z aktualnymi props
```

---

## 5. Quality Gates dla Canvas Completion

| Gate | Obszar | Cel |
|------|--------|-----|
| Gate 1 | Canvas Architecture | Spójność architektury Canvas z dokumentacją |
| Gate 2 | Runtime Integration | Poprawność przepływu danych przez PreviewChannel |
| Gate 3 | Inspector Synchronization | Dwukierunkowa synchronizacja Canvas ↔ Inspector |
| Gate 4 | CSS Export | Poprawność generowania CSS dla wszystkich 5 subsystemów |
| Gate 5 | Public API | Brak regresji w builder-core exports |
| Gate 6 | Architecture | Brak cyklicznych zależności, zgodność dokumentacji |

---

## 6. Decision Records

### DR-CANVAS-COMP-001: Canvas jako warstwa integrująca
**Status:** Accepted
**Uzasadnienie:** Canvas nie implementuje logiki CSS ani walidacji. Wszystkie transformacje pochodzą z funkcji domenowych (layoutToCSS, gridToCSS, overflowToCSS, borderToCSS, radiusToCSS) w builder-core.

### DR-CANVAS-COMP-002: Wspólny kanał synchronizacji
**Status:** Accepted
**Uzasadnienie:** Wszystkie 5 subsystemów używają UPDATE_PROPS + compile() jako jedynego mechanizmu synchronizacji. Żaden subsystem nie posiada własnego kanału.

### DR-CANVAS-COMP-003: Registry-based field dispatch
**Status:** Accepted
**Uzasadnienie:** PropertyFieldRegistry pozwala na rejestrację nowych field rendererów bez modyfikacji PropertyField.tsx. Wszystkie 5 subsystemów są zarejestrowane i działają przez ten sam mechanizm.

### DR-CANVAS-COMP-004: Preview przez PostMessage
**Status:** Accepted
**Uzasadnienie:** iframe z PostMessage zapewnia izolację runtime'u od edytora. MemoryChannel dla testów. Wzorzec ustalony w 01_STUDIO_ARCHITECTURE.md.

