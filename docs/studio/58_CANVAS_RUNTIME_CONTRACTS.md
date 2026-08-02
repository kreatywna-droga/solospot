# Sprint 5C — Canvas Runtime Contracts

> **Status:** ✅ Zatwierdzone
> **Sprint:** 5C — Canvas Completion
> **Cel:** Formalna specyfikacja kontraktów pomiędzy Canvas a Runtime dla wszystkich przepływów: Render, Selection, Update, Property Synchronization, Refresh, Event
> **Zależności:** 57_CANVAS_COMPLETION_SPECIFICATION.md, 03_CANVAS_ENGINE.md, PreviewMessage.ts, PreviewContract.ts

---

## 1. Render Flow

### 1.1 Cel

Przepływ Render definiuje jak Builder przekazuje dokument do Runtime w celu wyrenderowania strony w iframe.

### 1.2 Kontrakt

```
Builder → Runtime (PostMessage)
──────────────────────────────────────────────────────────────────────

Message: DOCUMENT_UPDATE
Payload: {
  messageType: 'DOCUMENT_UPDATE',
  document: CompiledDocument    // skompilowany dokument z CSS
}

Runtime → Builder (PostMessage)
──────────────────────────────────────────────────────────────────────

ACK: ACK_RENDERED
Payload: {
  messageType: 'ACK_RENDERED',
  pageId: string,
  timestamp: number
}

ERROR: ACK_ERROR
Payload: {
  messageType: 'ACK_ERROR',
  pageId: string,
  sectionId?: string,
  error: string,
  timestamp: number
}
```

### 1.3 Sequence

```
Builder                          Runtime (iframe)
  │                                  │
  │── compile(doc) → CompiledDoc ────│
  │                                  │
  │── createDocumentUpdate(doc) ────→│
  │                                  │── parse sections
  │                                  │── render each section
  │                                  │── apply CSS (inline styles)
  │                                  │
  │←──── ACK_RENDERED ───────────────│
  │                                  │
  │ (jeśli błąd)                     │
  │←──── ACK_ERROR ──────────────────│
```

### 1.4 CSS Compilation

Dla każdej sekcji, `compile()` generuje CSS obiekt poprzez agregację wszystkich 5 subsystemów:

```typescript
function compileSectionCSS(section: SectionNode): Record<string, string> {
  const props = section.props
  
  return {
    // Layout Engine
    ...displayToCSS(props as FlexContainerProps),
    ...spacingToCSS(props.padding as SpacingValue, false),
    ...spacingToCSS(props.margin as SpacingValue, true),
    ...positionToCSS(props as PositionProps),
    
    // Grid Engine
    ...(props.display === 'GRID' ? gridContainerToCSS(props as GridContainerProps) : {}),
    ...gridItemToCSS(props as GridItemProps),
    
    // Overflow Engine
    ...overflowToCSS(props as OverflowProps),
    
    // Border Engine
    ...borderToCSS(props as BorderProps),
    
    // Radius Engine
    ...radiusToCSS(props as RadiusProps),
  }
}
```

---

## 2. Selection Flow

### 2.1 Cel

Przepływ Selection definiuje jak Runtime informuje Builder o kliknięciu w element, oraz jak Builder przekazuje informację o selekcji do Runtime.

### 2.2 Kontrakt

```
Runtime → Builder (PostMessage)
──────────────────────────────────────────────────────────────────────

Message: ELEMENT_CLICK
Payload: {
  messageType: 'ELEMENT_CLICK',
  sectionId: string,
  pageId: string,
  boundingBox: {
    top: number,
    left: number,
    width: number,
    height: number
  },
  ctrlKey: boolean,
  shiftKey: boolean,
  altKey: boolean,
  timestamp: number
}

Message: ELEMENT_HOVER
Payload: {
  messageType: 'ELEMENT_HOVER',
  sectionId: string | null,
  pageId: string,
  boundingBox: {
    top: number,
    left: number,
    width: number,
    height: number
  },
  timestamp: number
}

Message: ELEMENT_DBLCLICK
Payload: {
  messageType: 'ELEMENT_DBLCLICK',
  sectionId: string,
  pageId: string,
  boundingBox: {
    top: number,
    left: number,
    width: number,
    height: number
  },
  timestamp: number
}

Builder → Runtime (PostMessage)
──────────────────────────────────────────────────────────────────────

Message: SECTION_HIGHLIGHT
Payload: {
  messageType: 'SECTION_HIGHLIGHT',
  sectionId: string | null,
  pageId: string,
  scrollIntoView: boolean,
  timestamp: number
}

Message: SECTION_SELECT
Payload: {
  messageType: 'SECTION_SELECT',
  sectionId: string | null,
  pageId: string,
  scrollIntoView: boolean,
  timestamp: number
}
```

### 2.3 Sequence

```
Runtime (iframe)                   Builder
  │                                  │
  │ (user clicks section)            │
  │── ELEMENT_CLICK ────────────────→│
  │                                  │── dispatch(CANVAS SELECT_SECTION)
  │                                  │── SelectionEngine.update()
  │                                  │── SelectionOverlay.render()
  │                                  │── InspectorPanel.load(section)
  │                                  │
  │←── SECTION_SELECT ───────────────│
  │                                  │
  │ (user hovers section)            │
  │── ELEMENT_HOVER ────────────────→│
  │                                  │── dispatch(CANVAS HOVER_SECTION)
  │                                  │── HoverHighlight.render()
```

---

## 3. Update Flow

### 3.1 Cel

Przepływ Update definiuje jak zmiany właściwości sekcji (z Inspectora, Layers, lub AI) są propagowane do Runtime.

### 3.2 Kontrakt

```
Builder → Runtime (PostMessage)
──────────────────────────────────────────────────────────────────────

Message: SECTION_UPDATE
Payload: {
  messageType: 'SECTION_UPDATE',
  pageId: string,
  sectionId: string,
  props: Record<string, unknown>,    // tylko zmienione właściwości
  css?: Record<string, string>,      // opcjonalnie: pre-kompilowany CSS
  timestamp: number
}

Message: DOCUMENT_UPDATE
Payload: {
  messageType: 'DOCUMENT_UPDATE',
  document: CompiledDocument,        // pełny dokument po zmianie
  timestamp: number
}
```

### 3.3 Sequence

```
Inspector                      Builder                      Runtime
  │                              │                              │
  │── onChange(key, value) ──────│                              │
  │                              │                              │
  │                              │── UPDATE_PROPS command       │
  │                              │── applyCommandToDocument()   │
  │                              │── HistoryStack.push()        │
  │                              │                              │
  │                              │── SECTION_UPDATE ───────────→│
  │                              │                              │── update section props
  │                              │                              │── recalculate CSS
  │                              │                              │── re-render
  │                              │                              │
  │                              │←──── ACK_RENDERED ───────────│
  │                              │                              │
  │←── re-render (React) ────────│                              │
```

### 3.4 Partial vs Full Update

| Typ zmiany | Wiadomość | Kiedy |
|-----------|-----------|-------|
| Pojedyncza właściwość | SECTION_UPDATE | Zmiana w Inspector (pojedyncze pole) |
| Batch zmian | DOCUMENT_UPDATE | Undo/Redo, Load dokumentu, Reset |
| Breakpoint | SECTION_UPDATE (dla każdej sekcji) | Zmiana viewportu |

---

## 4. Property Synchronization

### 4.1 Cel

Definiuje jak właściwości wszystkich 5 subsystemów wizualnych są synchronizowane pomiędzy Inspector, Canvas, Document i Runtime.

### 4.2 Synchronization Model

```
SectionNode.props
  │
  ├── Layout Props: { display, flexDirection, padding, margin, width, height, ... }
  ├── Grid Props:   { gridTemplateColumns, gridColumn, gridRow, ... }
  ├── Overflow:     { overflow, overflowX, overflowY }
  ├── Border:       { borderStyle, borderWidth, borderColor }
  └── Radius:       { mode, radius, topLeft, topRight, ... }
```

### 4.3 Property Flow

```
1. Inspector: użytkownik edytuje pole
2. PropertyField.onChange(key, value)
3. InspectorRuntime.createPropertyCommand(pageId, sectionId, schema, value)
   → jeśli walidacja OK, zwraca UPDATE_PROPS
4. dispatch(UPDATE_PROPS)
5. BuilderContext.applyCommandToDocument() → nowy SectionNode.props
6. HistoryStack.push() (jeśli props się zmieniły)
7. PreviewChannel.send(SECTION_UPDATE lub DOCUMENT_UPDATE)
8. Runtime odbiera i re-renderuje
```

### 4.4 Synchronization Matrix

| Subsystem | Inspector Field | CSS Function | Runtime Apply | Undo/Redo |
|-----------|----------------|-------------|---------------|-----------|
| Layout | SpacingField, SizeField, PositionField, FlexField | spacingToCSS, sizeToCSS, positionToCSS, displayToCSS | ✅ | ✅ (przez UPDATE_PROPS) |
| Grid | GridField | gridContainerToCSS, gridItemToCSS, trackListToCSS | ✅ | ✅ (przez UPDATE_PROPS) |
| Overflow | OverflowField | overflowToCSS | ✅ | ✅ (przez UPDATE_PROPS) |
| Border | BorderField | borderToCSS | ✅ | ✅ (przez UPDATE_PROPS) |
| Radius | RadiusField | radiusToCSS | ✅ | ✅ (przez UPDATE_PROPS) |

### 4.5 Bidirectional Sync Contract

```
inspector → document:
  PropertyField.onChange → dispatch(UPDATE_PROPS) → applyCommandToDocument()

document → inspector:
  selection change → InspectorSync → load schema + props → re-render fields

document → runtime:
  applyCommandToDocument() → sendPreviewUpdate() → PostMessage → iframe

runtime → inspector (via canvas):
  iframe click → PostMessage(ELEMENT_CLICK) → dispatch(CANVAS SELECT_SECTION) → InspectorSync
```

---

## 5. Runtime Refresh

### 5.1 Cel

Definiuje jak Runtime odświeża się w odpowiedzi na zmiany stanu, breakpointy, theme i reset.

### 5.2 Kontrakt

```
Builder → Runtime (PostMessage)
──────────────────────────────────────────────────────────────────────

Message: VIEWPORT_CHANGE
Payload: {
  messageType: 'VIEWPORT_CHANGE',
  viewport: {
    label: 'DESKTOP' | 'TABLET' | 'MOBILE',
    width: number,
    height?: number
  },
  timestamp: number
}

Message: THEME_UPDATE
Payload: {
  messageType: 'THEME_UPDATE',
  theme: BuilderTheme,
  timestamp: number
}

Message: RESET
Payload: {
  messageType: 'RESET',
  timestamp: number
}

Message: VIEWPORT_READY (Runtime → Builder)
Payload: {
  messageType: 'VIEWPORT_READY',
  viewport: {
    width: number,
    height: number
  },
  timestamp: number
}
```

### 5.3 Refresh Triggers

| Trigger | Akcja | Wiadomość do Runtime |
|---------|-------|---------------------|
| Zmiana breakpointu | dispatch(CANVAS SET_BREAKPOINT) | VIEWPORT_CHANGE + SECTION_UPDATE (dla każdej sekcji) |
| Zmiana theme | dispatch(UPDATE_THEME) | THEME_UPDATE |
| Undo/Redo | dispatch(UNDO/REDO) | DOCUMENT_UPDATE |
| Load dokumentu | createBuilderContext() | DOCUMENT_UPDATE |
| Reset | dispatch(RESET) | RESET |
| Zoom | useState (lokalny) | Brak (tylko UI) |

### 5.4 Performance Considerations

- **SECTION_UPDATE** jest preferowany nad DOCUMENT_UPDATE dla pojedynczych zmian
- **DOCUMENT_UPDATE** jest używany tylko dla batch zmian, undo/redo, load
- Runtime powinien implementować throttling dla frequent updates (np. podczas przeciągania)
- MemoryChannel dla testów, PostMessageChannel dla produkcji

---

## 6. Event Flow

### 6.1 Cel

Definiuje jak zdarzenia użytkownika w Runtime są przekazywane do Buildera.

### 6.2 Event Types

```
Runtime → Builder Events:
──────────────────────────────────────────────────────────────────────
ELEMENT_CLICK     → kliknięcie w sekcję
ELEMENT_HOVER     → najechanie na sekcję
ELEMENT_DBLCLICK  → double-click (inline edit)
VIEWPORT_READY    → iframe gotowy
ACK_RENDERED      → sekcja wyrenderowana
ACK_ERROR         → błąd renderowania

Builder → Runtime Events:
──────────────────────────────────────────────────────────────────────
DOCUMENT_UPDATE   → pełny dokument
SECTION_UPDATE    → aktualizacja propsów sekcji
SECTION_HIGHLIGHT → podświetlenie sekcji
SECTION_SELECT    → przewinięcie do sekcji
VIEWPORT_CHANGE   → zmiana rozmiaru viewportu
THEME_UPDATE      → zmiana tematu
RESET             → reset preview
```

### 6.3 Event Processing Pipeline

```
Runtime Event
  → PreviewChannel.receive(message)
    → switch(message.messageType)
      → ELEMENT_CLICK: dispatch(CANVAS SELECT_SECTION)
      → ELEMENT_HOVER: dispatch(CANVAS HOVER_SECTION)
      → ELEMENT_DBLCLICK: enable inline editing
      → VIEWPORT_READY: send pending DOCUMENT_UPDATE
      → ACK_RENDERED: update render status
      → ACK_ERROR: show error toast
```

### 6.4 Error Handling

| Scenariusz | Zachowanie |
|-----------|------------|
| Runtime nie odpowiada (timeout) | Retry 3x, potem show "Preview not responding" |
| ACK_ERROR z sectionId | Highlight błędnej sekcji, show error w Inspector |
| Invalid message format | Ignoruj, log warning |
| iframe unloaded | Czekaj na VIEWPORT_READY, retransmit DOCUMENT_UPDATE |

---

## 7. Podsumowanie kontraktów

### 7.1 Message Type Registry

| Message Type | Direction | Format | Opis |
|-------------|-----------|--------|------|
| DOCUMENT_UPDATE | Builder → Runtime | CompiledDocument | Pełna aktualizacja dokumentu |
| SECTION_UPDATE | Builder → Runtime | { pageId, sectionId, props } | Aktualizacja pojedynczej sekcji |
| SECTION_HIGHLIGHT | Builder → Runtime | { sectionId } | Podświetlenie sekcji |
| SECTION_SELECT | Builder → Runtime | { sectionId } | Przewinięcie do sekcji |
| VIEWPORT_CHANGE | Builder → Runtime | { label, width } | Zmiana breakpointu |
| THEME_UPDATE | Builder → Runtime | BuilderTheme | Zmiana tematu |
| RESET | Builder → Runtime | {} | Reset preview |
| VIEWPORT_READY | Runtime → Builder | { width, height } | iframe gotowy |
| ACK_RENDERED | Runtime → Builder | { pageId } | Sekcja wyrenderowana |
| ACK_ERROR | Runtime → Builder | { pageId, error } | Błąd renderowania |
| ELEMENT_CLICK | Runtime → Builder | { sectionId, boundingBox } | Kliknięcie w sekcję |
| ELEMENT_HOVER | Runtime → Builder | { sectionId, boundingBox } | Najechanie na sekcję |
| ELEMENT_DBLCLICK | Runtime → Builder | { sectionId, boundingBox } | Double-click |

### 7.2 Implementacja

Wszystkie kontrakty są zdefiniowane w:
- `packages/builder-core/src/PreviewMessage.ts` — typy wiadomości
- `packages/builder-core/src/PreviewContract.ts` — kanały (MemoryChannel, PostMessageChannel)
- `packages/builder-core/src/PreviewRuntimeAdapter.ts` — adapter runtime-core

### 7.3 Testowanie

Kontrakty są testowalne przez:
- MemoryChannel (testy jednostkowe)
- Mock PostMessage (testy integracyjne)
- Testy E2E (pełny cykl: Inspector → Canvas → Runtime)
