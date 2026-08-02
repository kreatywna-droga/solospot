# C16.40 — Grid Commands

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 40_GRID_COMMANDS.md  
> **Status:** Draft  
> **Sprint:** 5B.1 — Grid Engine  
> **Zależności:** 06_LAYOUT_ENGINE.md, 31_LAYOUT_PROPERTY_SPECIFICATION.md, 32_RESPONSIVE_VALUE_MODEL.md, 33_LAYOUT_COMMANDS.md, 38_GRID_PROPERTY_SPECIFICATION.md

---

## 1. Cel

Zdefiniowanie kontraktu komend Buildera związanych z CSS Grid. Każda komenda opisana w tym dokumencie jest mapowaniem pomiędzy:

```
UI (Inspector — GridField)
    → BuilderCommand
        → Document Mutation (applyCommandToDocument)
            → History (undo/redo)
                → Preview Update (recompile)
```

Podobnie jak w `33_LAYOUT_COMMANDS.md`, wszystkie komendy Grid są zgodne z istniejącym systemem komend (`BuilderCommands.ts`) i mechanizmem `HistoryStack`.

---

## 2. Istniejące komendy (Sprint 4A / 5A)

Obecny system komend zawiera już:

```typescript
type BuilderCommandType =
  | 'UPDATE_PROPS'       // aktualizacja pojedynczej lub wielu właściwości
  | 'REPLACE_PROPS'      // całkowita zamiana propsów sekcji
  | 'TOGGLE_VISIBILITY'  // show/hide sekcji
  | 'TOGGLE_LOCK'        // lock/unlock sekcji
  // ... inne (ADD_SECTION, REMOVE_SECTION, itp.)
```

Oraz komendy dedykowane dla Layout (zdefiniowane w `33_LAYOUT_COMMANDS.md`, ale odroczone do Sprintu 5B):

- `SET_SPACING`
- `SET_SIZE`
- `SET_POSITION`
- `SET_DISPLAY`
- `SET_FLEX`

**Zasada:** `UPDATE_PROPS` pozostaje uniwersalnym fallbackiem. Dedykowane komendy Grid zapewniają atomiczność i walidację dla złożonych operacji.

---

## 3. Nowe komendy dla Sprintu 5B.1

### 3.1 SET_GRID_TRACKS

**Cel:** Atomiczna aktualizacja `gridTemplateColumns` lub `gridTemplateRows` jako strukturalnej `TrackList`.

```typescript
interface SetGridTracksCommand {
  readonly type: 'SET_GRID_TRACKS';
  readonly pageId: string;
  readonly sectionId: string;
  readonly dimension: 'columns' | 'rows';
  readonly tracks: TrackList;
  readonly breakpoint?: Breakpoint;
}
```

**Wejście:**
- `dimension`: `'columns'` → `gridTemplateColumns` lub `'rows'` → `gridTemplateRows`
- `tracks`: strukturalna `TrackList` (zgodna z definicją w 38_GRID_PROPERTY_SPECIFICATION.md)
- `breakpoint`: opcjonalny — dla responsive override

**Walidacja:**

```typescript
function validateSetGridTracksCommand(cmd: SetGridTracksCommand): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(cmd.tracks) || cmd.tracks.length === 0) {
    errors.push({ key: 'tracks', message: 'TrackList must be a non-empty array', code: 'INVALID_FORMAT' });
  } else if (cmd.tracks.length > 100) {
    errors.push({ key: 'tracks', message: 'Maximum 100 tracks allowed', code: 'MAX_VALUE' });
  } else {
    for (let i = 0; i < cmd.tracks.length; i++) {
      const result = validateTrackBreadcrumb(cmd.tracks[i]);
      errors.push(...result.errors.map(e => ({ ...e, key: `tracks[${i}].${e.key}` })));
    }
  }

  if (!['columns', 'rows'].includes(cmd.dimension)) {
    errors.push({ key: 'dimension', message: 'Dimension must be "columns" or "rows"', code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**

```typescript
function applySetGridTracks(doc: BuilderDocument, cmd: SetGridTracksCommand): BuilderDocument {
  const propKey = cmd.dimension === 'columns' ? 'gridTemplateColumns' : 'gridTemplateRows';
  const value = cmd.tracks;

  if (cmd.breakpoint && cmd.breakpoint !== 'DESKTOP') {
    return setResponsiveOverride(doc, cmd.sectionId, propKey, cmd.breakpoint, value);
  }

  // Automatycznie ustaw display: GRID jeśli nie jest ustawiony
  const section = findSection(doc, cmd.sectionId);
  const currentDisplay = section?.props?.display;
  const updates: Record<string, unknown> = { [propKey]: value };
  if (currentDisplay !== 'GRID') {
    updates.display = 'GRID';
  }

  return applyCommandToDocument(doc, {
    type: 'UPDATE_PROPS',
    pageId: cmd.pageId,
    sectionId: cmd.sectionId,
    props: updates,
  });
}
```

**Undo:** Standardowy mechanizm HistoryStack (snapshot-based). Label: `"Set grid {dimension}"`.

---

### 3.2 SET_GRID_AUTO

**Cel:** Ustawienie właściwości auto-grid: `gridAutoFlow`, `gridAutoColumns`, `gridAutoRows`.

```typescript
interface SetGridAutoCommand {
  readonly type: 'SET_GRID_AUTO';
  readonly pageId: string;
  readonly sectionId: string;
  readonly autoFlow?: GridAutoFlow;
  readonly autoColumns?: TrackBreadcrumb;
  readonly autoRows?: TrackBreadcrumb;
  readonly breakpoint?: Breakpoint;
}
```

**Wejście:**
- Wszystkie pola są opcjonalne — wysyłamy tylko to, co się zmieniło
- `autoFlow`: `'row' | 'column' | 'row-dense' | 'column-dense'`
- `autoColumns` / `autoRows`: pojedynczy track

**Walidacja:**

```typescript
function validateSetGridAutoCommand(cmd: SetGridAutoCommand): ValidationResult {
  const errors: ValidationError[] = [];
  const validFlow = ['row', 'column', 'row-dense', 'column-dense'];

  if (cmd.autoFlow !== undefined && !validFlow.includes(cmd.autoFlow)) {
    errors.push({ key: 'autoFlow', message: `Invalid auto-flow: ${cmd.autoFlow}`, code: 'INVALID_OPTION' });
  }

  if (cmd.autoColumns !== undefined) {
    errors.push(...validateTrackBreadcrumb(cmd.autoColumns).errors);
  }

  if (cmd.autoRows !== undefined) {
    errors.push(...validateTrackBreadcrumb(cmd.autoRows).errors);
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**

```typescript
function applySetGridAuto(doc: BuilderDocument, cmd: SetGridAutoCommand): BuilderDocument {
  const updates: Record<string, unknown> = {};

  if (cmd.autoFlow !== undefined) updates.gridAutoFlow = cmd.autoFlow;
  if (cmd.autoColumns !== undefined) updates.gridAutoColumns = cmd.autoColumns;
  if (cmd.autoRows !== undefined) updates.gridAutoRows = cmd.autoRows;

  // Automatycznie ustaw display: GRID
  const section = findSection(doc, cmd.sectionId);
  if (section?.props?.display !== 'GRID') {
    updates.display = 'GRID';
  }

  if (cmd.breakpoint && cmd.breakpoint !== 'DESKTOP') {
    let result = doc;
    for (const [key, value] of Object.entries(updates)) {
      result = setResponsiveOverride(result, cmd.sectionId, key, cmd.breakpoint, value);
    }
    return result;
  }

  return applyCommandToDocument(doc, {
    type: 'UPDATE_PROPS',
    pageId: cmd.pageId,
    sectionId: cmd.sectionId,
    props: updates,
  });
}
```

---

### 3.3 SET_GRID_GAP

**Cel:** Ustawienie gap dla kontenera grid. Rozszerza istniejącą komendę SET_SPACING o grid-specific gap.

```typescript
interface SetGridGapCommand {
  readonly type: 'SET_GRID_GAP';
  readonly pageId: string;
  readonly sectionId: string;
  readonly gap?: number;          // shorthand — ustawia rowGap i columnGap
  readonly rowGap?: number;
  readonly columnGap?: number;
  readonly breakpoint?: Breakpoint;
}
```

**Wejście:**
- `gap`: opcjonalny — ustawia `gap` (i jako fallback dla `rowGap`/`columnGap`)
- `rowGap` / `columnGap`: opcjonalne — override dla poszczególnych osi

**Walidacja:**

```typescript
function validateSetGridGapCommand(cmd: SetGridGapCommand): ValidationResult {
  const errors: ValidationError[] = [];
  const validRange = { min: 0, max: 200 };

  if (cmd.gap !== undefined) {
    if (typeof cmd.gap !== 'number' || isNaN(cmd.gap)) {
      errors.push({ key: 'gap', message: 'Gap must be a number', code: 'INVALID_FORMAT' });
    } else if (cmd.gap < validRange.min || cmd.gap > validRange.max) {
      errors.push({ key: 'gap', message: `Gap must be ${validRange.min}-${validRange.max}`, code: 'CUSTOM' });
    }
  }

  for (const axis of ['rowGap', 'columnGap'] as const) {
    const val = cmd[axis];
    if (val !== undefined) {
      if (typeof val !== 'number' || isNaN(val)) {
        errors.push({ key: axis, message: `${axis} must be a number`, code: 'INVALID_FORMAT' });
      } else if (val < validRange.min || val > validRange.max) {
        errors.push({ key: axis, message: `${axis} must be ${validRange.min}-${validRange.max}`, code: 'CUSTOM' });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**

```typescript
function applySetGridGap(doc: BuilderDocument, cmd: SetGridGapCommand): BuilderDocument {
  const updates: Record<string, unknown> = {};

  if (cmd.gap !== undefined) {
    updates.gap = cmd.gap;
    // Jeśli gap jest ustawiony, a rowGap/columnGap nie, to ustaw je na tę samą wartość
    if (cmd.rowGap === undefined) updates.rowGap = cmd.gap;
    if (cmd.columnGap === undefined) updates.columnGap = cmd.gap;
  }
  if (cmd.rowGap !== undefined) updates.rowGap = cmd.rowGap;
  if (cmd.columnGap !== undefined) updates.columnGap = cmd.columnGap;

  return applyUpdate(doc, cmd.pageId, cmd.sectionId, updates, cmd.breakpoint);
}
```

---

### 3.4 SET_GRID_PLACEMENT

**Cel:** Ustawienie pozycji dziecka w gridzie — `gridColumn`, `gridRow` (shorthand i longhand).

```typescript
interface SetGridPlacementCommand {
  readonly type: 'SET_GRID_PLACEMENT';
  readonly pageId: string;
  readonly sectionId: string;
  readonly placement: {
    // Shorthand
    column?: GridSpanValue;
    row?: GridSpanValue;
    // Longhand (override shorthand)
    columnStart?: number;
    columnEnd?: number;
    rowStart?: number;
    rowEnd?: number;
  };
  readonly breakpoint?: Breakpoint;
}
```

**Wejście:**
- `placement.column` / `placement.row`: shorthand — `GridSpanValue`
- `placement.columnStart` / `placement.columnEnd` / `placement.rowStart` / `placement.rowEnd`: longhand — bezpośrednie numery linii

**Walidacja:**

```typescript
function validateSetGridPlacementCommand(cmd: SetGridPlacementCommand): ValidationResult {
  const errors: ValidationError[] = [];

  if (cmd.placement.column !== undefined) {
    errors.push(...validateGridSpan(cmd.placement.column).errors);
  }
  if (cmd.placement.row !== undefined) {
    errors.push(...validateGridSpan(cmd.placement.row).errors);
  }

  const longhandFields: Array<keyof typeof cmd.placement> = ['columnStart', 'columnEnd', 'rowStart', 'rowEnd'];
  for (const field of longhandFields) {
    const val = cmd.placement[field];
    if (val !== undefined) {
      if (typeof val !== 'number' || !Number.isInteger(val) || val === 0 || Math.abs(val) > 100) {
        errors.push({ key: field, message: `${field} must be integer -100 to 100 (excluding 0)`, code: 'CUSTOM' });
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**

```typescript
function applySetGridPlacement(doc: BuilderDocument, cmd: SetGridPlacementCommand): BuilderDocument {
  const updates: Record<string, unknown> = {};

  // Shorthand ma priorytet — jeśli podany, usuwamy longhand
  if (cmd.placement.column !== undefined) {
    updates.gridColumn = cmd.placement.column;
    updates.gridColumnStart = undefined;
    updates.gridColumnEnd = undefined;
  } else {
    if (cmd.placement.columnStart !== undefined) updates.gridColumnStart = cmd.placement.columnStart;
    if (cmd.placement.columnEnd !== undefined) updates.gridColumnEnd = cmd.placement.columnEnd;
  }

  if (cmd.placement.row !== undefined) {
    updates.gridRow = cmd.placement.row;
    updates.gridRowStart = undefined;
    updates.gridRowEnd = undefined;
  } else {
    if (cmd.placement.rowStart !== undefined) updates.gridRowStart = cmd.placement.rowStart;
    if (cmd.placement.rowEnd !== undefined) updates.gridRowEnd = cmd.placement.rowEnd;
  }

  return applyUpdate(doc, cmd.pageId, cmd.sectionId, updates, cmd.breakpoint);
}
```

---

### 3.5 SET_GRID_AREA

**Cel:** Ustawienie `gridArea` na dziecku grid (named area).

```typescript
interface SetGridAreaCommand {
  readonly type: 'SET_GRID_AREA';
  readonly pageId: string;
  readonly sectionId: string;
  readonly areaName: string | null;  // null = wyczyść
  readonly breakpoint?: Breakpoint;
}
```

**Wejście:**
- `areaName`: nazwa obszaru gridu (np. `"header"`, `"main"`, `"sidebar"`, `"footer"`) lub `null` aby wyczyścić

**Walidacja:**

```typescript
function validateSetGridAreaCommand(cmd: SetGridAreaCommand): ValidationResult {
  const errors: ValidationError[] = [];

  if (cmd.areaName !== null) {
    if (typeof cmd.areaName !== 'string' || cmd.areaName.trim().length === 0) {
      errors.push({ key: 'areaName', message: 'Area name must be a non-empty string or null', code: 'INVALID_FORMAT' });
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(cmd.areaName)) {
      errors.push({ key: 'areaName', message: 'Area name must be a valid CSS identifier', code: 'INVALID_FORMAT' });
    } else if (cmd.areaName.length > 100) {
      errors.push({ key: 'areaName', message: 'Area name must be ≤ 100 characters', code: 'MAX_VALUE' });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**

```typescript
function applySetGridArea(doc: BuilderDocument, cmd: SetGridAreaCommand): BuilderDocument {
  const updates: Record<string, unknown> = {};
  
  if (cmd.areaName === null) {
    updates.gridArea = undefined;  // usuń właściwość
  } else {
    updates.gridArea = cmd.areaName;
  }

  return applyUpdate(doc, cmd.pageId, cmd.sectionId, updates, cmd.breakpoint);
}
```

---

### 3.6 SET_GRID_ALIGN

**Cel:** Ustawienie właściwości alignment w gridzie (container i item).

```typescript
interface SetGridAlignCommand {
  readonly type: 'SET_GRID_ALIGN';
  readonly pageId: string;
  readonly sectionId: string;
  readonly target: 'container' | 'item';
  readonly align: {
    // Container
    justifyContent?: GridJustifyContent;
    alignContent?: GridAlignContent;
    justifyItems?: GridJustifyItems;
    alignItems?: GridAlignItems;
    // Item
    justifySelf?: GridSelfAlignment;
    alignSelf?: GridSelfAlignment;
  };
  readonly breakpoint?: Breakpoint;
}
```

**Wejście:**
- `target`: `'container'` → ustawia właściwości kontenera, `'item'` → ustawia właściwości itemu
- `align`: obiekt z właściwościami alignment — tylko podane zostaną zaktualizowane

**Walidacja:**

```typescript
function validateSetGridAlignCommand(cmd: SetGridAlignCommand): ValidationResult {
  const errors: ValidationError[] = [];

  const contentOptions = ['start', 'end', 'center', 'stretch', 'space-around', 'space-between', 'space-evenly'];
  const itemOptions = ['start', 'end', 'center', 'stretch'];

  if (cmd.target === 'container') {
    if (cmd.align.justifyContent !== undefined && !contentOptions.includes(cmd.align.justifyContent)) {
      errors.push({ key: 'justifyContent', message: 'Invalid justify-content value', code: 'INVALID_OPTION' });
    }
    if (cmd.align.alignContent !== undefined && !contentOptions.includes(cmd.align.alignContent)) {
      errors.push({ key: 'alignContent', message: 'Invalid align-content value', code: 'INVALID_OPTION' });
    }
    if (cmd.align.justifyItems !== undefined && !itemOptions.includes(cmd.align.justifyItems)) {
      errors.push({ key: 'justifyItems', message: 'Invalid justify-items value', code: 'INVALID_OPTION' });
    }
    if (cmd.align.alignItems !== undefined && !itemOptions.includes(cmd.align.alignItems)) {
      errors.push({ key: 'alignItems', message: 'Invalid align-items value', code: 'INVALID_OPTION' });
    }
  } else if (cmd.target === 'item') {
    if (cmd.align.justifySelf !== undefined && !itemOptions.includes(cmd.align.justifySelf)) {
      errors.push({ key: 'justifySelf', message: 'Invalid justify-self value', code: 'INVALID_OPTION' });
    }
    if (cmd.align.alignSelf !== undefined && !itemOptions.includes(cmd.align.alignSelf)) {
      errors.push({ key: 'alignSelf', message: 'Invalid align-self value', code: 'INVALID_OPTION' });
    }
  } else {
    errors.push({ key: 'target', message: 'Target must be "container" or "item"', code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}
```

**Efekt:**

```typescript
function applySetGridAlign(doc: BuilderDocument, cmd: SetGridAlignCommand): BuilderDocument {
  return applyUpdate(doc, cmd.pageId, cmd.sectionId, cmd.align as Record<string, unknown>, cmd.breakpoint);
}
```

---

### 3.7 SET_GRID_DISPLAY

**Cel:** Zmiana display na GRID z automatycznym ustawieniem domyślnych właściwości gridu.

```typescript
interface SetGridDisplayCommand {
  readonly type: 'SET_GRID_DISPLAY';
  readonly pageId: string;
  readonly sectionId: string;
  readonly breakpoint?: Breakpoint;
}
```

**Efekt:**

```typescript
function applySetGridDisplay(doc: BuilderDocument, cmd: SetGridDisplayCommand): BuilderDocument {
  const updates: Record<string, unknown> = {
    display: 'GRID',
    // Domyślne wartości dla nowego kontenera grid
    gridTemplateColumns: [
      { type: 'fixed', size: { value: 1, unit: 'fr' } },
    ],
    gridAutoFlow: 'row',
    gap: 0,
  };

  return applyUpdate(doc, cmd.pageId, cmd.sectionId, updates, cmd.breakpoint);
}
```

---

## 4. Responsive command wrapper

Wszystkie powyższe komendy wspierają opcjonalny `breakpoint`. Dla uniknięcia duplikacji, istnieje wrapper:

```typescript
/**
 * Unified apply for grid updates with responsive support.
 * Jeśli breakpoint jest podany i różny od DESKTOP, zapisz jako override.
 * W przeciwnym razie, zapisz jako bazową właściwość (UPDATE_PROPS).
 * Automatycznie ustawia display: GRID jeśli nie jest ustawiony.
 */
function applyUpdate(
  doc: BuilderDocument,
  pageId: string,
  sectionId: string,
  updates: Record<string, unknown>,
  breakpoint?: Breakpoint
): BuilderDocument {
  // Automatycznie ustaw display: GRID
  const section = findSection(doc, sectionId);
  if (section?.props?.display !== 'GRID') {
    updates.display = 'GRID';
  }

  if (breakpoint && breakpoint !== 'DESKTOP') {
    let result = doc;
    for (const [key, value] of Object.entries(updates)) {
      result = setResponsiveOverride(result, sectionId, key, breakpoint, value);
    }
    return result;
  }

  return applyCommandToDocument(doc, {
    type: 'UPDATE_PROPS',
    pageId,
    sectionId,
    props: updates,
  });
}
```

---

## 5. Command flow (pełny cykl)

```
User changes grid columns in Inspector (GridField)
    ↓
GridField calls onChange('gridTemplateColumns', tracks)
    ↓
InspectorPanel.handlePropChange detects grid-tracks type
    ↓
dispatch({ type: 'SET_GRID_TRACKS', pageId, sectionId, dimension: 'columns', tracks })
    ↓
BuilderReducer.applySetGridTracks(doc, cmd)
    ├── validateSetGridTracksCommand(cmd) → OK
    ├── applySetGridTracks(doc, cmd)
    │     └── applyUpdate(doc, cmd) → UPDATE_PROPS (or setResponsiveOverride)
    ├── push to HistoryStack (snapshot)
    ├── touchDocument(doc) → bump version
    └── return new doc
    ↓
Re-render → Inspector shows new grid columns
    ↓
Preview re-compiles → iframe shows updated grid
    ↓
User presses Ctrl+Z
    ↓
HistoryStack pops → restores previous snapshot
    ↓
Inspector & Preview update
```

---

## 6. Historia (Undo/Redo)

Wszystkie komendy gridu korzystają z istniejącego mechanizmu `HistoryStack`:

```typescript
interface HistoryEntry {
  id: string;
  label: string;         // "Set grid columns", "Change grid placement"
  timestamp: number;
  snapshot: string;       // JSON.stringify(BuilderDocument) — stan przed zmianą
}
```

**Label mapping:**

| Komenda | Label |
|---------|-------|
| `SET_GRID_TRACKS` | "Set grid {columns\|rows}" |
| `SET_GRID_AUTO` | "Configure grid auto-flow" |
| `SET_GRID_GAP` | "Set grid gap" |
| `SET_GRID_PLACEMENT` | "Set grid placement" |
| `SET_GRID_AREA` | "Set grid area" |
| `SET_GRID_ALIGN` | "Set grid alignment" |
| `SET_GRID_DISPLAY` | "Change display to Grid" |
| `UPDATE_PROPS` (grid) | "Edit {propName}" |

---

## 7. Integracja z PropertyRegistry

Grid renderery w PropertyRegistry:

| Renderer | Typ | Używa komendy |
|----------|-----|---------------|
| `GridField` (nowy) | `'grid-tracks'` | `SET_GRID_TRACKS` |
| `GridField` (auto section) | `'grid-auto'` | `SET_GRID_AUTO` |
| `GridField` (gap) | `'grid-gap'` | `SET_GRID_GAP` |
| `GridField` (placement) | `'grid-span'` | `SET_GRID_PLACEMENT` |
| `GridField` (area) | `'grid-area'` | `SET_GRID_AREA` |
| `GridField` (align) | `'grid-align'` | `SET_GRID_ALIGN` |

Renderery nie wysyłają komend bezpośrednio. Zamiast tego wołają `onChange(key, value)`, a `InspectorPanel` decyduje, którą komendę wysłać.

**Przykład:**

```typescript
// GridField (grid-tracks) wywołuje:
onChange('gridTemplateColumns', [
  { type: 'fixed', size: { value: 1, unit: 'fr' } },
  { type: 'fixed', size: { value: 2, unit: 'fr' } },
  { type: 'fixed', size: { value: 1, unit: 'fr' } },
]);

// InspectorPanel.handlePropChange wykrywa, że to grid-tracks:
if (key === 'gridTemplateColumns' || key === 'gridTemplateRows') {
  dispatch({
    type: 'SET_GRID_TRACKS',
    pageId,
    sectionId,
    dimension: key === 'gridTemplateColumns' ? 'columns' : 'rows',
    tracks: value,
    breakpoint: activeBreakpoint !== 'DESKTOP' ? activeBreakpoint : undefined,
  });
}

// Grid placement
if (key === 'gridColumn' || key === 'gridRow') {
  dispatch({
    type: 'SET_GRID_PLACEMENT',
    pageId,
    sectionId,
    placement: { [key === 'gridColumn' ? 'column' : 'row']: value },
    breakpoint: activeBreakpoint !== 'DESKTOP' ? activeBreakpoint : undefined,
  });
}

// Grid area
if (key === 'gridArea') {
  dispatch({
    type: 'SET_GRID_AREA',
    pageId,
    sectionId,
    areaName: value,
    breakpoint: activeBreakpoint !== 'DESKTOP' ? activeBreakpoint : undefined,
  });
}
```

---

## 8. Interakcja z istniejącymi komendami

### 8.1 SET_DISPLAY (z `33_LAYOUT_COMMANDS.md`)

Istniejąca komenda `SET_DISPLAY` dla `'GRID'` powinna zostać rozszerzona o ustawienie domyślnych właściwości gridu:

```typescript
// Rozszerzenie applySetDisplay dla GRID mode
case 'GRID':
  updates.flexDirection = undefined;
  updates.flexWrap = undefined;
  updates.justifyContent = undefined;
  updates.alignItems = undefined;
  // Ustaw domyślne właściwości gridu
  updates.gridTemplateColumns = [{ type: 'fixed', size: { value: 1, unit: 'fr' } }];
  updates.gridAutoFlow = 'row';
  updates.gap = 0;
  break;
```

### 8.2 UPDATE_PROPS

`UPDATE_PROPS` pozostaje uniwersalnym fallbackiem. Jeśli GridField wywoła `onChange` z pojedynczą właściwością (np. `gridAutoFlow: 'dense'`), `InspectorPanel` może wysłać `UPDATE_PROPS` zamiast dedykowanej komendy.

**Zasada:** Używaj dedykowanej komendy gdy zmiana dotyczy złożonej struktury (TrackList, GridSpanValue). Używaj `UPDATE_PROPS` dla prostych właściwości (select, number, boolean).

---

## 9. Command matrix

| Komenda | Atomiczność | Walidacja | Automatyczny display: GRID | Responsive |
|---------|:-----------:|:---------:|:--------------------------:|:----------:|
| `SET_GRID_TRACKS` | ✅ Wszystkie tracki naraz | ✅ validateTrackBreadcrumb | ✅ | ✅ |
| `SET_GRID_AUTO` | ✅ Wszystkie auto właściwości | ✅ validateTrackBreadcrumb | ✅ | ✅ |
| `SET_GRID_GAP` | ✅ gap + rowGap + columnGap | ✅ validateGap | ❌ (już ustawiony) | ✅ |
| `SET_GRID_PLACEMENT` | ✅ column + row naraz | ✅ validateGridSpan | ❌ | ✅ |
| `SET_GRID_AREA` | ✅ Pojedyncza właściwość | ✅ validateAreaName | ❌ | ✅ |
| `SET_GRID_ALIGN` | ✅ Wszystkie alignment naraz | ✅ validAlignment | ❌ | ✅ |
| `SET_GRID_DISPLAY` | ✅ display + grid defaults | ✅ (brak — zawsze GRID) | ✅ (wbudowane) | ✅ |
| `UPDATE_PROPS` (fallback) | ❌ Pojedyncza właściwość | ❌ (ogólna) | ❌ | ✅ |

---

## 10. Decision Records

### DR-GCMD-001: Dedykowane komendy Grid zamiast wyłącznie UPDATE_PROPS
**Status:** Proposed  
**Uzasadnienie:** Grid operuje na złożonych strukturach danych (TrackList, GridSpanValue). Dedykowane komendy zapewniają:
- Atomiczną walidację całej struktury przed zapisem
- Automatyczne ustawienie `display: GRID` gdy zmieniamy właściwość gridu
- Czytelne etykiety w historii (Undo/Redo)
- Możliwość dodania side effects w przyszłości (np. aktualizacja grid overlay na canvasie)

### DR-GCMD-002: Automatyczne ustawienie display: GRID
**Status:** Proposed  
**Uzasadnienie:** Jeżeli użytkownik ustawi `gridTemplateColumns` na elemencie, który nie ma `display: GRID`, komenda automatycznie ustawia `display` na `'GRID'`. To zapobiega sytuacjom, gdzie właściwości gridu są ustawione, ale nie mają efektu wizualnego.

### DR-GCMD-003: Shorthand ma priorytet nad longhand
**Status:** Proposed  
**Uzasadnienie:** W `SET_GRID_PLACEMENT`, jeśli podano shorthand (`column`/`row`), automatycznie usuwamy longhand (`columnStart`/`columnEnd`/`rowStart`/`rowEnd`). To zapobiega konfliktom między shorthand a longhand.

### DR-GCMD-004: Grid alignment jako osobna komenda
**Status:** Proposed  
**Uzasadnienie:** Alignment properties w gridzie są liczne (justifyContent, alignContent, justifyItems, alignItems, justifySelf, alignSelf). Osobna komenda `SET_GRID_ALIGN` z `target: 'container' | 'item'` grupuje je logicznie i upraszcza dispatch w InspectorPanel.

### DR-GCMD-005: Współdzielenie gap z Layout Engine
**Status:** Proposed  
**Uzasadnienie:** `gap`, `rowGap`, `columnGap` są współdzielone między Flex a Grid. Komenda `SET_GRID_GAP` działa tak samo jak przyszła komenda `SET_GAP` w Layout Engine. W przyszłości można je scalić w jedną komendę.

---

## 11. Zależności

| Dokument | Zależność | Opis |
|----------|-----------|------|
| `33_LAYOUT_COMMANDS.md` | Wymagany | Istniejące komendy (UPDATE_PROPS, SET_DISPLAY) — Grid je rozszerza |
| `38_GRID_PROPERTY_SPECIFICATION.md` | Wymagany | Definiuje model danych (TrackList, GridSpanValue, GridContainerProps, GridItemProps) |
| `31_LAYOUT_PROPERTY_SPECIFICATION.md` | Wymagany | Definiuje istniejące właściwości (gap, justify-content, itp.) |
| `06_LAYOUT_ENGINE.md` | Informacyjny | Architektura Layout Engine |

