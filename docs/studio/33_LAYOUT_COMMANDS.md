# C16.33 — Layout Commands

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 33_LAYOUT_COMMANDS.md  
> **Status:** Draft  
> **Zależności:** 06_LAYOUT_ENGINE.md, 31_LAYOUT_PROPERTY_SPECIFICATION.md, 32_RESPONSIVE_VALUE_MODEL.md

---

## 1. Cel

Zdefiniowanie kontraktu komend Buildera związanych z layoutem. Każda komenda opisana w tym dokumencie jest mapowaniem pomiędzy:

```
UI (Inspector)
    → BuilderCommand
        → Document Mutation (applyCommandToDocument)
            → History (undo/redo)
                → Preview Update (recompile)
```

---

## 2. Istniejące komendy (Sprint 4A)

Obecny system komend (`BuilderCommands.ts`) zawiera już:

```typescript
type BuilderCommandType =
  | 'UPDATE_PROPS'       // aktualizacja pojedyńczej lub wielu właściwości
  | 'REPLACE_PROPS'      // całkowita zamiana propsów sekcji
  | 'TOGGLE_VISIBILITY'  // show/hide sekcji
  | 'TOGGLE_LOCK'        // lock/unlock sekcji
  // ... inne (ADD_SECTION, REMOVE_SECTION, itp.)
```

`UPDATE_PROPS` jest wystarczający dla podstawowej edycji layoutu:

```typescript
// Przykład: zmiana paddingu
dispatch({
  type: 'UPDATE_PROPS',
  pageId: 'page_home',
  sectionId: 'sec_hero',
  props: {
    padding: { top: 48, right: 48, bottom: 48, left: 48, linked: true }
  },
});
```

---

## 3. Nowe komendy dla Sprintu 5A

### 3.1 SET_SPACING

**Cel:** Atomiczna aktualizacja wszystkich 4 stron padding/margin jednocześnie.

```typescript
interface SetSpacingCommand {
  readonly type: 'SET_SPACING';
  readonly pageId: string;
  readonly sectionId: string;
  readonly spacingType: 'padding' | 'margin';
  readonly value: SpacingValue;
  readonly breakpoint?: Breakpoint;  // opcjonalny — dla responsive override
}
```

**Wejście:**
- `spacingType`: `'padding'` lub `'margin'`
- `value`: `SpacingValue { top, right, bottom, left, linked }`
- `breakpoint`: opcjonalny — jeśli podany, ustawia override dla breakpointa

**Walidacja:**
```typescript
function validateSpacingCommand(cmd: SetSpacingCommand): ValidationResult {
  const s = cmd.value;
  const errors: ValidationError[] = [];

  for (const side of ['top', 'right', 'bottom', 'left']) {
    const val = s[side as keyof SpacingValue];
    if (typeof val !== 'number' || isNaN(val)) {
      errors.push({ key: `spacing.${side}`, message: 'Must be a number', code: 'INVALID_FORMAT' });
    } else if (val < 0 || val > 500) {
      errors.push({ key: `spacing.${side}`, message: 'Must be between 0 and 500', code: 'CUSTOM' });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**
```typescript
function applySetSpacing(doc: BuilderDocument, cmd: SetSpacingCommand): BuilderDocument {
  if (cmd.breakpoint) {
    // Ustaw override dla breakpointa
    doc = setResponsiveOverride(doc, cmd.sectionId, cmd.spacingType, cmd.breakpoint, cmd.value);
  } else {
    // Ustaw bazową wartość (desktop)
    doc = applyCommandToDocument(doc, {
      type: 'UPDATE_PROPS',
      pageId: cmd.pageId,
      sectionId: cmd.sectionId,
      props: { [cmd.spacingType]: cmd.value },
    });
  }
  return doc;
}
```

**Undo:** Standardowy mechanizm HistoryStack (snapshot-based).

---

### 3.2 SET_SIZE

**Cel:** Ustawienie width/height z jednostką.

```typescript
interface SetSizeCommand {
  readonly type: 'SET_SIZE';
  readonly pageId: string;
  readonly sectionId: string;
  readonly dimension: 'width' | 'height' | 'minWidth' | 'minHeight' | 'maxWidth' | 'maxHeight';
  readonly value: SizeValue;
  readonly breakpoint?: Breakpoint;
}
```

**Wejście:**
- `dimension`: która właściwość wymiaru
- `value`: `SizeValue { value: number, unit: CSSUnit }`
- `breakpoint`: opcjonalny

**Walidacja:**
```typescript
function validateSizeCommand(cmd: SetSizeCommand): ValidationResult {
  const errors: ValidationError[] = [];
  const validUnits: CSSUnit[] = ['px', '%', 'vw', 'vh', 'rem', 'em', 'auto', 'fit-content', 'min-content', 'max-content'];

  if (typeof cmd.value.value !== 'number' || isNaN(cmd.value.value)) {
    errors.push({ key: 'size.value', message: 'Must be a number', code: 'INVALID_FORMAT' });
  }
  if (cmd.value.value < 0) {
    errors.push({ key: 'size.value', message: 'Must be ≥ 0', code: 'MIN_VALUE' });
  }
  if (!validUnits.includes(cmd.value.unit)) {
    errors.push({ key: 'size.unit', message: `Invalid unit: ${cmd.value.unit}`, code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**
```typescript
function applySetSize(doc: BuilderDocument, cmd: SetSizeCommand): BuilderDocument {
  if (cmd.breakpoint) {
    doc = setResponsiveOverride(doc, cmd.sectionId, cmd.dimension, cmd.breakpoint, cmd.value);
  } else {
    doc = applyCommandToDocument(doc, {
      type: 'UPDATE_PROPS',
      pageId: cmd.pageId,
      sectionId: cmd.sectionId,
      props: { [cmd.dimension]: cmd.value },
    });
  }
  return doc;
}
```

---

### 3.3 SET_POSITION

**Cel:** Ustawienie pozycjonowania (position + top/right/bottom/left + zIndex).

```typescript
interface SetPositionCommand {
  readonly type: 'SET_POSITION';
  readonly pageId: string;
  readonly sectionId: string;
  readonly position: PositionType;   // 'relative' | 'absolute' | 'fixed' | 'sticky'
  readonly offsets?: {
    readonly top?: number;
    readonly right?: number;
    readonly bottom?: number;
    readonly left?: number;
  };
  readonly zIndex?: number;
  readonly breakpoint?: Breakpoint;
}
```

**Walidacja:**
```typescript
function validatePositionCommand(cmd: SetPositionCommand): ValidationResult {
  const errors: ValidationError[] = [];

  const validPositions = ['relative', 'absolute', 'fixed', 'sticky'];
  if (!validPositions.includes(cmd.position)) {
    errors.push({ key: 'position', message: `Invalid position: ${cmd.position}`, code: 'INVALID_OPTION' });
  }

  if (cmd.offsets) {
    for (const [key, val] of Object.entries(cmd.offsets)) {
      if (val !== undefined && (typeof val !== 'number' || isNaN(val))) {
        errors.push({ key, message: 'Must be a number', code: 'INVALID_FORMAT' });
      }
    }
  }

  if (cmd.zIndex !== undefined) {
    if (!Number.isInteger(cmd.zIndex) || cmd.zIndex < 0 || cmd.zIndex > 9999) {
      errors.push({ key: 'zIndex', message: 'Must be integer 0-9999', code: 'CUSTOM' });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**
```typescript
function applySetPosition(doc: BuilderDocument, cmd: SetPositionCommand): BuilderDocument {
  const updates: Record<string, unknown> = {
    position: cmd.position,
  };

  if (cmd.offsets) {
    if (cmd.offsets.top !== undefined) updates.top = cmd.offsets.top;
    if (cmd.offsets.right !== undefined) updates.right = cmd.offsets.right;
    if (cmd.offsets.bottom !== undefined) updates.bottom = cmd.offsets.bottom;
    if (cmd.offsets.left !== undefined) updates.left = cmd.offsets.left;
  }
  if (cmd.zIndex !== undefined) updates.zIndex = cmd.zIndex;

  if (cmd.breakpoint) {
    // Responsive override — każda właściwość osobno
    for (const [key, value] of Object.entries(updates)) {
      doc = setResponsiveOverride(doc, cmd.sectionId, key, cmd.breakpoint, value);
    }
  } else {
    doc = applyCommandToDocument(doc, {
      type: 'UPDATE_PROPS',
      pageId: cmd.pageId,
      sectionId: cmd.sectionId,
      props: updates,
    });
  }
  return doc;
}
```

---

### 3.4 SET_DISPLAY

**Cel:** Zmiana display mode. Automatycznie czyści niepotrzebne właściwości.

```typescript
interface SetDisplayCommand {
  readonly type: 'SET_DISPLAY';
  readonly pageId: string;
  readonly sectionId: string;
  readonly display: DisplayMode;   // 'BLOCK' | 'FLEX' | 'GRID' | 'ABSOLUTE' | 'NONE'
  readonly breakpoint?: Breakpoint;
}
```

**Walidacja:**
```typescript
function validateDisplayCommand(cmd: SetDisplayCommand): ValidationResult {
  const validModes = ['BLOCK', 'FLEX', 'GRID', 'ABSOLUTE', 'NONE'];
  return {
    valid: validModes.includes(cmd.display),
    errors: validModes.includes(cmd.display)
      ? []
      : [{ key: 'display', message: `Invalid display mode: ${cmd.display}`, code: 'INVALID_OPTION' }],
  };
}
```

**Efekt (z automatycznym czyszczeniem):**
```typescript
function applySetDisplay(doc: BuilderDocument, cmd: SetDisplayCommand): BuilderDocument {
  const updates: Record<string, unknown> = {
    display: cmd.display,
  };

  // Automatyczne czyszczenie — gdy zmieniamy display mode,
  // usuwamy właściwości, które nie mają sensu dla nowego trybu
  switch (cmd.display) {
    case 'BLOCK':
      // Usuń flex/grid-specific props
      updates.flexDirection = undefined;
      updates.flexWrap = undefined;
      updates.justifyContent = undefined;
      updates.alignItems = undefined;
      updates.gap = undefined;
      break;

    case 'FLEX':
      // Ustaw domyślne flex propertisy
      updates.flexDirection = updates.flexDirection ?? 'row';
      updates.flexWrap = updates.flexWrap ?? 'nowrap';
      updates.justifyContent = updates.justifyContent ?? 'flex-start';
      updates.alignItems = updates.alignItems ?? 'stretch';
      break;

    case 'ABSOLUTE':
      // Ustaw position: relative na kontenerze
      updates.position = 'relative';
      break;

    case 'NONE':
      // hide — nie ma dodatkowych właściwości
      break;
  }

  if (cmd.breakpoint) {
    doc = setResponsiveOverride(doc, cmd.sectionId, 'display', cmd.breakpoint, cmd.display);
    // Dla pozostałych właściwości użyj UPDATE_PROPS
    for (const [key, value] of Object.entries(updates)) {
      if (key !== 'display') {
        doc = applyCommandToDocument(doc, {
          type: 'UPDATE_PROPS',
          pageId: cmd.pageId,
          sectionId: cmd.sectionId,
          props: { [key]: value },
        });
      }
    }
  } else {
    doc = applyCommandToDocument(doc, {
      type: 'UPDATE_PROPS',
      pageId: cmd.pageId,
      sectionId: cmd.sectionId,
      props: updates,
    });
  }

  return doc;
}
```

---

### 3.5 SET_FLEX

**Cel:** Ustawienie pełnej konfiguracji flex layoutu.

```typescript
interface SetFlexCommand {
  readonly type: 'SET_FLEX';
  readonly pageId: string;
  readonly sectionId: string;
  readonly flex?: {
    readonly direction?: FlexDirection;
    readonly wrap?: FlexWrap;
    readonly justifyContent?: JustifyContent;
    readonly alignItems?: AlignItems;
    readonly alignContent?: AlignContent;
    readonly gap?: number;
  };
  readonly breakpoint?: Breakpoint;
}
```

**Walidacja:**
```typescript
function validateFlexCommand(cmd: SetFlexCommand): ValidationResult {
  const errors: ValidationError[] = [];

  if (cmd.flex) {
    const validDirections = ['row', 'column', 'row-reverse', 'column-reverse'];
    if (cmd.flex.direction && !validDirections.includes(cmd.flex.direction)) {
      errors.push({ key: 'flexDirection', message: 'Invalid direction', code: 'INVALID_OPTION' });
    }

    const validJustify = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'];
    if (cmd.flex.justifyContent && !validJustify.includes(cmd.flex.justifyContent)) {
      errors.push({ key: 'justifyContent', message: 'Invalid justify-content', code: 'INVALID_OPTION' });
    }

    if (cmd.flex.gap !== undefined && (cmd.flex.gap < 0 || cmd.flex.gap > 200)) {
      errors.push({ key: 'gap', message: 'Gap must be between 0 and 200', code: 'CUSTOM' });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**
```typescript
function applySetFlex(doc: BuilderDocument, cmd: SetFlexCommand): BuilderDocument {
  const updates: Record<string, unknown> = {};

  // Automatycznie ustaw display: flex jeśli nie jest ustawiony
  updates.display = 'FLEX';

  if (cmd.flex) {
    if (cmd.flex.direction) updates.flexDirection = cmd.flex.direction;
    if (cmd.flex.wrap) updates.flexWrap = cmd.flex.wrap;
    if (cmd.flex.justifyContent) updates.justifyContent = cmd.flex.justifyContent;
    if (cmd.flex.alignItems) updates.alignItems = cmd.flex.alignItems;
    if (cmd.flex.alignContent) updates.alignContent = cmd.flex.alignContent;
    if (cmd.flex.gap !== undefined) updates.gap = cmd.flex.gap;
  }

  if (cmd.breakpoint) {
    for (const [key, value] of Object.entries(updates)) {
      doc = setResponsiveOverride(doc, cmd.sectionId, key, cmd.breakpoint, value);
    }
  } else {
    doc = applyCommandToDocument(doc, {
      type: 'UPDATE_PROPS',
      pageId: cmd.pageId,
      sectionId: cmd.sectionId,
      props: updates,
    });
  }

  return doc;
}
```

---

## 4. Responsive command wrapper

Wszystkie powyższe komendy wspierają opcjonalny `breakpoint`. Dla ułatwienia, istnieje wrapper:

```typescript
/**
 * Wrap any update as responsive or base.
 * Jeśli breakpoint jest podany i różny od DESKTOP, zapisz jako override.
 * W przeciwnym razie, zapisz jako bazową właściwość (UPDATE_PROPS).
 */
function wrapResponsiveUpdate(
  doc: BuilderDocument,
  pageId: string,
  sectionId: string,
  propName: string,
  value: unknown,
  breakpoint?: Breakpoint
): BuilderDocument {
  if (breakpoint && breakpoint !== 'DESKTOP') {
    return setResponsiveOverride(doc, sectionId, propName, breakpoint, value);
  }
  return applyCommandToDocument(doc, {
    type: 'UPDATE_PROPS',
    pageId,
    sectionId,
    props: { [propName]: value },
  });
}
```

---

## 5. Command flow (pełny cykl)

```
User changes padding in Inspector
    ↓
InspectorPanel calls handlePropChange('padding', {...})
    ↓
dispatch({ type: 'SET_SPACING', pageId, sectionId, spacingType: 'padding', value })
    ↓
BuilderReducer.applySetSpacing(doc, cmd)
    ├── validateSpacingCommand(cmd) → OK
    ├── applySetSpacing(doc, cmd)
    │     └── UPDATE_PROPS (or setResponsiveOverride for breakpoint)
    ├── push to HistoryStack (snapshot)
    ├── touchDocument(doc) → bump version
    └── return new doc
    ↓
Re-render → Inspector shows new values
    ↓
Preview re-compiles → iframe shows updated layout
    ↓
User presses Ctrl+Z
    ↓
HistoryStack pops → restores previous snapshot
    ↓
Inspector & Preview update
```

---

## 6. Historia (Undo/Redo)

Wszystkie komendy layoutu korzystają z istniejącego mechanizmu `HistoryStack`:

```typescript
interface HistoryEntry {
  id: string;
  label: string;         // "Set padding", "Change display to Flex"
  timestamp: number;
  snapshot: string;       // JSON.stringify(BuilderDocument) — stan przed zmianą
}
```

**Label mapping:**

| Komenda | Label |
|---------|-------|
| `SET_SPACING` | "Set padding" / "Set margin" |
| `SET_SIZE` | "Set width" / "Set height" |
| `SET_POSITION` | "Set position" |
| `SET_DISPLAY` | "Change display to Flex" |
| `SET_FLEX` | "Configure flex layout" |
| `UPDATE_PROPS` (layout) | "Edit {propName}" |

---

## 7. Integracja z PropertyRegistry

Nowe komendy są używane przez dedykowane renderery w PropertyRegistry:

| Renderer | Typ | Używa komendy |
|----------|-----|---------------|
| `SpacingField` | `'spacing'` | `SET_SPACING` |
| `SizeField` | `'size'` | `SET_SIZE` |
| `PositionField` | `'position'` | `SET_POSITION` + `SET_DISPLAY` |
| `FlexField` | `'flex'` | `SET_FLEX` + `SET_DISPLAY` |

Renderery nie wysyłają komend bezpośrednio. Zamiast tego wołają `onChange(key, value)`, a `InspectorPanel` decyduje, którą komendę wysłać.

**Przykład:**

```typescript
// SpacingField wywołuje:
onChange('padding', { top: 48, right: 24, bottom: 48, left: 24, linked: false });

// InspectorPanel. handlePropChange wykrywa, że to spacing:
if (key === 'padding' || key === 'margin') {
  dispatch({
    type: 'SET_SPACING',
    pageId,
    sectionId,
    spacingType: key,
    value,
    breakpoint: activeBreakpoint !== 'DESKTOP' ? activeBreakpoint : undefined,
  });
}
```

---

## 8. Decision Records

### DR-CMD-001: UPDATE_PROTS jako fallback
**Status:** Approved  
**Uzasadnienie:** Dedykowane komendy (SET_SPACING, SET_SIZE, itp.) zapewniają atomiczność i walidację, ale UPDATE_PROPS pozostaje jako uniwersalny fallback dla pojedyńczych właściwości. Nie ma potrzeby tworzenia osobnej komendy dla każdej właściwości layoutu.

### DR-CMD-002: breakpoint jako opcjonalny parametr
**Status:** Approved  
**Uzasadnienie:** Dodanie `breakpoint` do każdej komendy pozwala na atomiczną obsługę responsywnych override'ów bez tworzenia osobnych komend typu `SET_RESPONSIVE_SPACING`. Jeśli breakpoint jest `undefined` lub `'DESKTOP'`, komenda działa na bazowych właściwościach.

### DR-CMD-003: Automatyczne czyszczenie przy zmianie display mode
**Status:** Approved  
**Uzasadnienie:** Zmiana display mode (np. z FLEX na BLOCK) automatycznie usuwa właściwości specyficzne dla flexa (flexDirection, gap, itp.). To zapobiega sytuacjom, gdzie w dokumencie pozostają właściwości, które nie mają zastosowania dla obecnego trybu.

