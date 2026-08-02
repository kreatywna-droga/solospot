# C16.38 — Grid Property Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 38_GRID_PROPERTY_SPECIFICATION.md  
> **Status:** Draft  
> **Sprint:** 5B.1 — Grid Engine  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 06_LAYOUT_ENGINE.md, 07_INSPECTOR.md, 12_RESPONSIVE_ENGINE.md, 26_RUNTIME_INSPECTOR.md, 31_LAYOUT_PROPERTY_SPECIFICATION.md

---

## 1. Cel

Niniejszy dokument definiuje kontrakt dla **Grid Engine** — subsystemu odpowiedzialnego za modelowanie, walidację, serializację i mapowanie na CSS wszystkich właściwości CSS Grid Layout.

Podobnie jak Layout Engine (Sprint 5A), Grid Engine jest kontraktem pomiędzy trzema subsystemami Studia:

| Subsystem | Rola |
|-----------|------|
| **Layout Engine** | Definiuje model właściwości gridu i generuje CSS |
| **Inspector** | Renderuje UI do edycji właściwości gridu |
| **Runtime** | Konsumuje skompilowane właściwości i renderuje je w preview |

Celem jest zapewnienie, że każda właściwość gridu ma:

- **Jednoznaczną definicję** — typ, jednostki, zakres, walidacja
- **Jasną reprezentację w PropSchema** — jak Inspector ma ją wyrenderować
- **Określone mapowanie na CSS** — co Runtime wygeneruje
- **Zdefiniowane zachowanie responsywne** — jak działa per-breakpoint
- **Strukturalny model domenowy** — grid tracki modelowane jako struktury, nie stringi

---

## 2. Zakres

### 2.1 Grid Container vs Grid Item — Podział obowiązków

CSS Grid posiada właściwości należące do dwóch odrębnych grup. Ten podział jest fundamentalny dla modelu domenowego.

| Grupa | Dotyczy | Właściwości |
|-------|---------|-------------|
| **Grid Container** | Element z `display: grid` | `gridTemplateColumns`, `gridTemplateRows`, `gridTemplateAreas`, `gridAutoColumns`, `gridAutoRows`, `gridAutoFlow`, `gap`, `rowGap`, `columnGap`, `justifyContent`, `alignContent`, `justifyItems`, `alignItems`, `placeItems`, `placeContent` |
| **Grid Item** | Bezpośrednie dziecko kontenera grid | `gridColumn`, `gridRow`, `gridArea`, `justifySelf`, `alignSelf`, `placeSelf` |

**Konsekwencja dla modelu domenowego:** `GridContainerProps` i `GridItemProps` będą odrębnymi interfejsami. Inspector będzie wyświetlał odpowiednie pola w zależności od tego, czy wybrany element jest kontenerem grid, czy dzieckiem grid.

### 2.2 Właściwości Grid — pełna lista

| # | Właściwość (Builder) | CSS Property | Grupa | MVP |
|---|---------------------|--------------|-------|:---:|
| 1 | `display` | `display` | Container | ✅ |
| 2 | `gridTemplateColumns` | `grid-template-columns` | Container | ✅ |
| 3 | `gridTemplateRows` | `grid-template-rows` | Container | ✅ |
| 4 | `gridTemplateAreas` | `grid-template-areas` | Container | ⏳ |
| 5 | `gridAutoColumns` | `grid-auto-columns` | Container | ✅ |
| 6 | `gridAutoRows` | `grid-auto-rows` | Container | ✅ |
| 7 | `gridAutoFlow` | `grid-auto-flow` | Container | ✅ |
| 8 | `gap` | `gap` | Container | ✅ |
| 9 | `rowGap` | `row-gap` | Container | ✅ |
| 10 | `columnGap` | `column-gap` | Container | ✅ |
| 11 | `justifyContent` | `justify-content` | Container | ✅ |
| 12 | `alignContent` | `align-content` | Container | ✅ |
| 13 | `justifyItems` | `justify-items` | Container | ✅ |
| 14 | `alignItems` | `align-items` | Container | ✅ |
| 15 | `placeItems` | `place-items` | Container | ⏳ |
| 16 | `placeContent` | `place-content` | Container | ⏳ |
| 17 | `gridColumnStart` | `grid-column-start` | Item | ✅ |
| 18 | `gridColumnEnd` | `grid-column-end` | Item | ✅ |
| 19 | `gridRowStart` | `grid-row-start` | Item | ✅ |
| 20 | `gridRowEnd` | `grid-row-end` | Item | ✅ |
| 21 | `gridColumn` | `grid-column` | Item | ✅ |
| 22 | `gridRow` | `grid-row` | Item | ✅ |
| 23 | `gridArea` | `grid-area` | Item | ✅ |
| 24 | `justifySelf` | `justify-self` | Item | ✅ |
| 25 | `alignSelf` | `align-self` | Item | ✅ |
| 26 | `placeSelf` | `place-self` | Item | ⏳ |

### 2.3 Zakres MVP — Grid Engine Sprint 5B.1

| Funkcja | Status | Uzasadnienie |
|---------|:------:|--------------|
| `fr` jednostka | ✅ MVP | Podstawowa jednostka gridu, niezbędna od pierwszego dnia |
| `repeat()` z liczbą całkowitą | ✅ MVP | `repeat(3, 1fr)` — najczęściej używana składnia |
| `minmax()` | ✅ MVP | `minmax(200px, 1fr)` — elastyczne kolumny |
| Pojedyncze wartości tracka | ✅ MVP | `1fr`, `200px`, `auto`, `min-content`, `max-content` |
| `gridColumn` / `gridRow` shorthand | ✅ MVP | `grid-column: 1 / 3` |
| `gridColumnStart` / `gridColumnEnd` | ✅ MVP | Długie formy dla precyzyjnej kontroli |
| `gridArea` (named area) | ✅ MVP | `grid-area: header` |
| `gridAutoFlow` | ✅ MVP | `row`, `column`, `dense` |
| `gridAutoColumns` / `gridAutoRows` | ✅ MVP | Dla automatycznie tworzonych tracków |
| `gap` / `rowGap` / `columnGap` | ✅ MVP | Rozszerzenie istniejącego modelu |
| Alignment (justify/align content/items/self) | ✅ MVP | Podstawowe właściwości wyrównania |
| `repeat()` z `auto-fill` / `auto-fit` | ⏳ Później | Wymaga zaawansowanego modelowania |
| Named grid areas (`grid-template-areas`) | ⏳ Później | Wymaga UI do wizualnego edytora obszarów |
| `place-items` / `place-content` / `place-self` | ⏳ Później | Shorthand — można dodać w kolejnym sprincie |
| Subgrid | ⏳ Później | Zaawansowana funkcja, rzadko używana |
| `masonry` (CSS Grid v2) | 🔮 Future | Eksperymentalna funkcja |

---

## 3. Property Model — Grid Container

### 3.1 Grid Track — strukturalny model domenowy

Jedna z kluczowych decyzji architektonicznych: **grid tracki nie są przechowywane jako string CSS**, ale jako strukturalny model domenowy. Pozwala to na:

- Prostą walidację (każdy typ tracka ma swoją regułę walidacji)
- Generowanie CSS jako deterministyczną funkcję mapującą
- Łatwiejszą serializację/deserializację (nie wymaga parsowania CSS)
- Lepsze wsparcie dla AI (model jest zrozumiały dla modeli językowych)
- Proste operacje transformacji (np. duplikacja kolumny, zmian kolejności)

```typescript
// ---- Typy bazowe dla Grid Track ----

// Pojedynczy rozmiar tracka (wartość + jednostka)
interface TrackSize {
  value: number;
  unit: GridUnit;
}

// Jednostki dozwolone dla grid tracków
type GridUnit = 
  | 'fr'           // Fraction unit — tylko w grid
  | 'px'           // Piksele
  | '%'            // Procent
  | 'vw'           // Viewport width
  | 'vh'           // Viewport height
  | 'rem'          // Root em
  | 'em'           // Local em
  | 'auto'         // Automatyczny
  | 'min-content'  // Minimalna zawartość
  | 'max-content'; // Maksymalna zawartość

// Pojedynczy track (wartość lub keyword)
type TrackBreadcrumb = 
  | { type: 'fixed'; size: TrackSize }           // 200px, 1fr, 50%
  | { type: 'keyword'; value: 'auto' | 'min-content' | 'max-content' }
  | { type: 'minmax'; min: TrackBreadcrumb; max: TrackBreadcrumb }
  | { type: 'repeat'; count: number; track: TrackBreadcrumb }
  // Później:
  // | { type: 'auto-fill'; track: TrackBreadcrumb }
  // | { type: 'auto-fit'; track: TrackBreadcrumb }
  // | { type: 'subgrid' }

// Lista tracków (definiuje wszystkie kolumny lub wiersze)
type TrackList = TrackBreadcrumb[];
```

#### Przykłady mapowania

| CSS | Model |
|-----|-------|
| `1fr` | `{ type: 'fixed', size: { value: 1, unit: 'fr' } }` |
| `200px` | `{ type: 'fixed', size: { value: 200, unit: 'px' } }` |
| `auto` | `{ type: 'keyword', value: 'auto' }` |
| `minmax(200px, 1fr)` | `{ type: 'minmax', min: { type: 'fixed', size: { value: 200, unit: 'px' } }, max: { type: 'fixed', size: { value: 1, unit: 'fr' } } }` |
| `min-content` | `{ type: 'keyword', value: 'min-content' }` |
| `repeat(3, 1fr)` | `{ type: 'repeat', count: 3, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } }` |
| `1fr 2fr 1fr` | `[ { type: 'fixed', size: { value: 1, unit: 'fr' } }, { type: 'fixed', size: { value: 2, unit: 'fr' } }, { type: 'fixed', size: { value: 1, unit: 'fr' } } ]` |

#### Walidacja TrackSize

```typescript
function validateTrackSize(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!value || typeof value !== 'object') {
    return { valid: false, errors: [{ key: 'trackSize', message: 'TrackSize must be an object', code: 'INVALID_FORMAT' }] };
  }

  const s = value as Record<string, unknown>;
  
  if (typeof s.value !== 'number' || isNaN(s.value as number)) {
    errors.push({ key: 'trackSize.value', message: 'TrackSize value must be a number', code: 'INVALID_FORMAT' });
  } else if ((s.value as number) < 0) {
    errors.push({ key: 'trackSize.value', message: 'TrackSize value must be ≥ 0', code: 'MIN_VALUE' });
  } else if ((s.value as number) > 9999) {
    errors.push({ key: 'trackSize.value', message: 'TrackSize value must be ≤ 9999', code: 'MAX_VALUE' });
  }

  const validUnits: GridUnit[] = ['fr', 'px', '%', 'vw', 'vh', 'rem', 'em', 'auto', 'min-content', 'max-content'];
  if (!validUnits.includes(s.unit as GridUnit)) {
    errors.push({ key: 'trackSize.unit', message: `Invalid unit: ${String(s.unit)}`, code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}
```

#### Walidacja TrackBreadcrumb

```typescript
function validateTrackBreadcrumb(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object') {
    return { valid: false, errors: [{ key: 'track', message: 'Track must be an object', code: 'INVALID_FORMAT' }] };
  }

  const t = value as Record<string, unknown>;
  const errors: ValidationError[] = [];

  switch (t.type) {
    case 'fixed':
      // Waliduj TrackSize
      const sizeResult = validateTrackSize(t.size);
      errors.push(...sizeResult.errors);
      break;

    case 'keyword':
      if (!['auto', 'min-content', 'max-content'].includes(t.value as string)) {
        errors.push({ key: 'track.keyword', message: `Invalid keyword: ${String(t.value)}`, code: 'INVALID_OPTION' });
      }
      break;

    case 'minmax':
      if (!t.min || !t.max) {
        errors.push({ key: 'track.minmax', message: 'minmax requires both min and max', code: 'INVALID_FORMAT' });
      } else {
        errors.push(...validateTrackBreadcrumb(t.min).errors);
        errors.push(...validateTrackBreadcrumb(t.max).errors);
      }
      break;

    case 'repeat':
      if (typeof t.count !== 'number' || !Number.isInteger(t.count) || (t.count as number) < 1 || (t.count as number) > 100) {
        errors.push({ key: 'track.repeat.count', message: 'Repeat count must be integer 1-100', code: 'CUSTOM' });
      }
      if (!t.track) {
        errors.push({ key: 'track.repeat.track', message: 'Repeat requires a track definition', code: 'INVALID_FORMAT' });
      } else {
        errors.push(...validateTrackBreadcrumb(t.track).errors);
      }
      break;

    default:
      errors.push({ key: 'track.type', message: `Invalid track type: ${String(t.type)}`, code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}
```

### 3.2 Grid Container Props

```typescript
// ---- Typy bazowe ----

type GridAutoFlow = 'row' | 'column' | 'row-dense' | 'column-dense';

type GridJustifyContent = 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
type GridAlignContent = 'start' | 'end' | 'center' | 'stretch' | 'space-around' | 'space-between' | 'space-evenly';
type GridJustifyItems = 'start' | 'end' | 'center' | 'stretch';
type GridAlignItems = 'start' | 'end' | 'center' | 'stretch';

// ---- Grid Container Props ----

interface GridContainerProps {
  // Template
  gridTemplateColumns?: TrackList;   // default: undefined (→ browser auto)
  gridTemplateRows?: TrackList;      // default: undefined (→ browser auto)
  gridTemplateAreas?: string[];      // default: undefined — ["header header", "main sidebar", "footer footer"]  // PÓŹNIEJ

  // Auto
  gridAutoColumns?: TrackBreadcrumb; // default: { type: 'fixed', size: { value: 1, unit: 'fr' } }
  gridAutoRows?: TrackBreadcrumb;    // default: { type: 'fixed', size: { value: 1, unit: 'fr' } }
  gridAutoFlow?: GridAutoFlow;       // default: 'row'

  // Gap (rozszerzenie istniejących pól z FlexContainerProps)
  gap?: number;                       // default: 0, unit: px
  rowGap?: number;                    // default: undefined (→ gap), unit: px
  columnGap?: number;                 // default: undefined (→ gap), unit: px

  // Alignment — Grid Container
  justifyContent?: GridJustifyContent; // default: 'start'
  alignContent?: GridAlignContent;     // default: 'start'
  justifyItems?: GridJustifyItems;     // default: 'stretch'
  alignItems?: GridAlignItems;         // default: 'stretch'
}
```

### 3.3 Grid Item Props

```typescript
// ---- Typy bazowe dla Grid Item placement ----

// grid-column-start, grid-column-end, grid-row-start, grid-row-end
interface GridPlacement {
  line?: number;           // Numer linii (1-based, może być ujemny)
  span?: number;           // Ilość tracków do przeciągnięcia
  namedLine?: string;      // Nazwana linia (opcjonalnie, później)
}

// grid-column: 1 / 3 → { start: { line: 1 }, end: { line: 3 } }
// grid-row: span 2 → { start: { span: 2 } }
// grid-area: header → { name: 'header' }

type GridSelfAlignment = 'start' | 'end' | 'center' | 'stretch';

// ---- Grid Item Props ----

interface GridItemProps {
  // Placement — shorthand
  gridColumn?: GridSpanValue;     // "1 / 3", "2", "span 2", "1 / span 3"
  gridRow?: GridSpanValue;        // "1 / 3", "2", "span 2", "1 / span 3"
  gridArea?: string;              // Named area: "header", "main", "sidebar"

  // Placement — longhand (precyzyjna kontrola)
  gridColumnStart?: number;
  gridColumnEnd?: number;
  gridRowStart?: number;
  gridRowEnd?: number;

  // Alignment — Grid Item
  justifySelf?: GridSelfAlignment; // default: 'stretch'
  alignSelf?: GridSelfAlignment;   // default: 'stretch'
}
```

#### Uwaga dotycząca GridSpanValue

`GridSpanValue` dla MVP może być prostym modelem:

```typescript
type GridSpanValue = 
  | { type: 'line'; start: number; end?: number }         // "1 / 3", "2"
  | { type: 'span'; start: number; span: number }         // "2 / span 3"
  | { type: 'span-only'; span: number };                   // "span 2"
```

W późniejszej fazie zostanie rozszerzony o nazwane linie.

---

## 4. PropSchema (Inspector)

### 4.1 Grid Container — PropSchema

```typescript
// Display Select (rozszerzony — Grid jako osobna opcja)
{
  key: 'display',
  label: 'Display',
  type: 'select',
  required: true,
  defaultValue: 'BLOCK',
  group: 'layout',
  options: [
    { label: 'Block', value: 'BLOCK' },
    { label: 'Flex', value: 'FLEX' },
    { label: 'Grid', value: 'GRID' },
    { label: 'Absolute', value: 'ABSOLUTE' },
    { label: 'None', value: 'NONE' },
  ],
  metadata: { icon: 'layout' },
}

// Grid Template Columns — custom type 'grid-tracks'
{
  key: 'gridTemplateColumns',
  label: 'Columns',
  type: 'grid-tracks',          // ← custom type
  required: false,
  defaultValue: undefined,
  group: 'grid',
  metadata: { icon: 'columns', tags: ['grid', 'columns'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Grid Template Rows — custom type 'grid-tracks'
{
  key: 'gridTemplateRows',
  label: 'Rows',
  type: 'grid-tracks',
  required: false,
  defaultValue: undefined,
  group: 'grid',
  metadata: { icon: 'rows', tags: ['grid', 'rows'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Grid Auto Flow
{
  key: 'gridAutoFlow',
  label: 'Auto Flow',
  type: 'select',
  required: false,
  defaultValue: 'row',
  group: 'grid',
  options: [
    { label: 'Row', value: 'row' },
    { label: 'Column', value: 'column' },
    { label: 'Row Dense', value: 'row-dense' },
    { label: 'Column Dense', value: 'column-dense' },
  ],
  metadata: { icon: 'git-commit', tags: ['grid', 'auto'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Grid Auto Columns
{
  key: 'gridAutoColumns',
  label: 'Auto Column Size',
  type: 'grid-track',           // ← custom type (pojedynczy track)
  required: false,
  defaultValue: { type: 'fixed', size: { value: 1, unit: 'fr' } },
  group: 'grid',
  metadata: { icon: 'columns', tags: ['grid', 'auto'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Grid Auto Rows
{
  key: 'gridAutoRows',
  label: 'Auto Row Size',
  type: 'grid-track',
  required: false,
  defaultValue: { type: 'fixed', size: { value: 1, unit: 'fr' } },
  group: 'grid',
  metadata: { icon: 'rows', tags: ['grid', 'auto'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Gap (istniejące, rozszerzone o grid context)
{
  key: 'gap',
  label: 'Gap',
  type: 'number',
  required: false,
  defaultValue: 0,
  group: 'grid',
  metadata: { unit: 'px', min: 0, max: 100, step: 1, icon: 'grip-horizontal' },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Alignment — Grid Container (nowa sekcja)
{
  key: 'justifyContent',
  label: 'Justify Content',
  type: 'select',
  required: false,
  defaultValue: 'start',
  group: 'grid',
  options: [
    { label: 'Start', value: 'start' },
    { label: 'End', value: 'end' },
    { label: 'Center', value: 'center' },
    { label: 'Stretch', value: 'stretch' },
    { label: 'Space Around', value: 'space-around' },
    { label: 'Space Between', value: 'space-between' },
    { label: 'Space Evenly', value: 'space-evenly' },
  ],
  metadata: { icon: 'align-horizontal', tags: ['grid', 'alignment'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}
```

### 4.2 Grid Item — PropSchema

```typescript
// Grid Column
{
  key: 'gridColumn',
  label: 'Column',
  type: 'grid-span',            // ← custom type
  required: false,
  defaultValue: undefined,
  group: 'grid-item',
  metadata: { icon: 'columns', tags: ['grid', 'item'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Grid Row
{
  key: 'gridRow',
  label: 'Row',
  type: 'grid-span',
  required: false,
  defaultValue: undefined,
  group: 'grid-item',
  metadata: { icon: 'rows', tags: ['grid', 'item'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Grid Area
{
  key: 'gridArea',
  label: 'Grid Area',
  type: 'text',                 // ← prosty text input dla named area
  required: false,
  defaultValue: undefined,
  group: 'grid-item',
  metadata: { icon: 'grid', tags: ['grid', 'area'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Alignment — Grid Item
{
  key: 'justifySelf',
  label: 'Justify Self',
  type: 'select',
  required: false,
  defaultValue: 'stretch',
  group: 'grid-item',
  options: [
    { label: 'Start', value: 'start' },
    { label: 'End', value: 'end' },
    { label: 'Center', value: 'center' },
    { label: 'Stretch', value: 'stretch' },
  ],
  metadata: { icon: 'align-horizontal', tags: ['grid', 'alignment'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}

// Align Self
{
  key: 'alignSelf',
  label: 'Align Self',
  type: 'select',
  required: false,
  defaultValue: 'stretch',
  group: 'grid-item',
  options: [
    { label: 'Start', value: 'start' },
    { label: 'End', value: 'end' },
    { label: 'Center', value: 'center' },
    { label: 'Stretch', value: 'stretch' },
  ],
  metadata: { icon: 'align-vertical', tags: ['grid', 'alignment'] },
  visibility: { dependsOn: { key: 'display', value: 'GRID' } },
}
```

---

## 5. CSS Mapping — Grid Container

```typescript
/**
 * Convert TrackBreadcrumb to CSS string.
 */
function trackBreadcrumbToCSS(track: TrackBreadcrumb): string {
  switch (track.type) {
    case 'fixed':
      return `${track.size.value}${track.size.unit}`;
    case 'keyword':
      return track.value;
    case 'minmax':
      return `minmax(${trackBreadcrumbToCSS(track.min)}, ${trackBreadcrumbToCSS(track.max)})`;
    case 'repeat':
      return `repeat(${track.count}, ${trackBreadcrumbToCSS(track.track)})`;
  }
}

/**
 * Convert TrackList to CSS string (space-separated).
 */
function trackListToCSS(tracks: TrackList): string {
  return tracks.map(trackBreadcrumbToCSS).join(' ');
}

/**
 * Convert GridContainerProps to CSS object.
 */
function gridContainerToCSS(props: GridContainerProps): Record<string, string> {
  const css: Record<string, string> = {};

  // Template
  if (props.gridTemplateColumns) {
    css.gridTemplateColumns = trackListToCSS(props.gridTemplateColumns);
  }
  if (props.gridTemplateRows) {
    css.gridTemplateRows = trackListToCSS(props.gridTemplateRows);
  }

  // Auto
  if (props.gridAutoFlow) {
    css.gridAutoFlow = props.gridAutoFlow;
  }
  if (props.gridAutoColumns) {
    css.gridAutoColumns = trackBreadcrumbToCSS(props.gridAutoColumns);
  }
  if (props.gridAutoRows) {
    css.gridAutoRows = trackBreadcrumbToCSS(props.gridAutoRows);
  }

  // Gap
  if (props.gap !== undefined) css.gap = `${props.gap}px`;
  if (props.rowGap !== undefined) css.rowGap = `${props.rowGap}px`;
  if (props.columnGap !== undefined) css.columnGap = `${props.columnGap}px`;

  // Alignment — Container
  if (props.justifyContent) css.justifyContent = props.justifyContent;
  if (props.alignContent) css.alignContent = props.alignContent;
  if (props.justifyItems) css.justifyItems = props.justifyItems;
  if (props.alignItems) css.alignItems = props.alignItems;

  return css;
}
```

## 6. CSS Mapping — Grid Item

```typescript
/**
 * Convert GridSpanValue to CSS.
 */
function gridSpanToCSS(span: GridSpanValue): string {
  switch (span.type) {
    case 'line':
      return span.end !== undefined ? `${span.start} / ${span.end}` : `${span.start}`;
    case 'span':
      return `${span.start} / span ${span.span}`;
    case 'span-only':
      return `span ${span.span}`;
  }
}

/**
 * Convert GridItemProps to CSS object.
 */
function gridItemToCSS(props: GridItemProps): Record<string, string> {
  const css: Record<string, string> = {};

  // Placement — shorthand
  if (props.gridColumn) {
    css.gridColumn = gridSpanToCSS(props.gridColumn);
  }
  if (props.gridRow) {
    css.gridRow = gridSpanToCSS(props.gridRow);
  }
  if (props.gridArea) {
    css.gridArea = props.gridArea;
  }

  // Placement — longhand (override shorthand)
  if (props.gridColumnStart !== undefined) css.gridColumnStart = String(props.gridColumnStart);
  if (props.gridColumnEnd !== undefined) css.gridColumnEnd = String(props.gridColumnEnd);
  if (props.gridRowStart !== undefined) css.gridRowStart = String(props.gridRowStart);
  if (props.gridRowEnd !== undefined) css.gridRowEnd = String(props.gridRowEnd);

  // Alignment — Item
  if (props.justifySelf) css.justifySelf = props.justifySelf;
  if (props.alignSelf) css.alignSelf = props.alignSelf;

  return css;
}
```

---

## 7. Validation Rules

### 7.1 Reguły globalne dla Grid

| Warunek | Reakcja |
|---------|---------|
| Wartość wymagana (required: true) i undefined/null | Błąd: REQUIRED |
| Typ wartości niezgodny ze schema | Błąd: INVALID_FORMAT |
| Wartość spoza zakresu min/max | Błąd: MIN_VALUE / MAX_VALUE |
| Nieprawidłowa opcja select | Błąd: INVALID_OPTION |

### 7.2 Reguły specyficzne dla Grid

| Właściwość | Reguła |
|------------|--------|
| `gridTemplateColumns` / `gridTemplateRows` | Każdy track musi przejść `validateTrackBreadcrumb`. Maksymalnie 100 tracków. |
| `gridAutoColumns` / `gridAutoRows` | Pojedynczy track, `validateTrackBreadcrumb` |
| `gridAutoFlow` | Musi być: `row`, `column`, `row-dense`, `column-dense` |
| `gap` / `rowGap` / `columnGap` | ≥ 0, ≤ 200 (jak w LayoutTypes) |
| `gridColumnStart` / `gridColumnEnd` / `gridRowStart` / `gridRowEnd` | Integer, ≥ -100, ≤ 100, nie może być 0 |
| `gridColumn` / `gridRow` (GridSpanValue) | `start` ≥ -100, `span` ≥ 1, `span` ≤ 100 |
| `justifyContent` / `alignContent` (grid) | `start`, `end`, `center`, `stretch`, `space-around`, `space-between`, `space-evenly` |
| `justifyItems` / `alignItems` / `justifySelf` / `alignSelf` (grid) | `start`, `end`, `center`, `stretch` |

```typescript
// Przykład walidacji GridSpanValue
function validateGridSpan(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object') {
    return { valid: false, errors: [{ key: 'gridSpan', message: 'GridSpan must be an object', code: 'INVALID_FORMAT' }] };
  }

  const s = value as Record<string, unknown>;
  const errors: ValidationError[] = [];

  switch (s.type) {
    case 'line':
      if (typeof s.start !== 'number' || !Number.isInteger(s.start) || s.start === 0 || Math.abs(s.start as number) > 100) {
        errors.push({ key: 'gridSpan.start', message: 'Line start must be integer -100 to 100 (excluding 0)', code: 'CUSTOM' });
      }
      if (s.end !== undefined && (typeof s.end !== 'number' || !Number.isInteger(s.end) || s.end === 0 || Math.abs(s.end as number) > 100)) {
        errors.push({ key: 'gridSpan.end', message: 'Line end must be integer -100 to 100 (excluding 0)', code: 'CUSTOM' });
      }
      break;

    case 'span':
      if (typeof s.start !== 'number' || !Number.isInteger(s.start) || s.start === 0 || Math.abs(s.start as number) > 100) {
        errors.push({ key: 'gridSpan.start', message: 'Start line must be integer -100 to 100 (excluding 0)', code: 'CUSTOM' });
      }
      if (typeof s.span !== 'number' || !Number.isInteger(s.span) || (s.span as number) < 1 || (s.span as number) > 100) {
        errors.push({ key: 'gridSpan.span', message: 'Span must be integer 1-100', code: 'CUSTOM' });
      }
      break;

    case 'span-only':
      if (typeof s.span !== 'number' || !Number.isInteger(s.span) || (s.span as number) < 1 || (s.span as number) > 100) {
        errors.push({ key: 'gridSpan.span', message: 'Span must be integer 1-100', code: 'CUSTOM' });
      }
      break;

    default:
      errors.push({ key: 'gridSpan.type', message: `Invalid span type: ${String(s.type)}`, code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 8. Responsive Behaviour

Grid Engine dziedziczy model responsywny zdefiniowany w `32_RESPONSIVE_VALUE_MODEL.md`.

Kluczowe zasady:

1. **Desktop-first** — wartość desktopowa jest bazowa
2. **Fallback** — tablet → desktop, mobile → tablet → desktop
3. **Override** — każda właściwość może mieć override dla tabletu i/lub mobile
4. **Strukturalny model** — tracki są serializowane jako JSON, co pozwala na per-breakpoint overridy

```typescript
// Przykład: responsywny grid
{
  sectionId: 'sec_gallery',
  props: {
    display: 'GRID',
    gridTemplateColumns: [
      { type: 'repeat', count: 3, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
    ],
    gap: 24,
  },
  responsive: {
    gridTemplateColumns: {
      tablet: [
        { type: 'repeat', count: 2, track: { type: 'fixed', size: { value: 1, unit: 'fr' } } },
      ],
      mobile: [
        { type: 'fixed', size: { value: 100, unit: '%' } },
      ],
    },
    gap: {
      tablet: 16,
      mobile: 12,
    },
  },
}
```

---

## 9. Runtime Mapping

### 9.1 Kompilacja (BuilderDocument → CompiledDocument)

```typescript
interface CompiledGridProps {
  // Container
  gridTemplateColumns?: string;    // "1fr 2fr 1fr"
  gridTemplateRows?: string;       // "repeat(3, 200px)"
  gridAutoFlow?: string;           // "row" | "column" | "dense"
  gridAutoColumns?: string;        // "1fr"
  gridAutoRows?: string;           // "auto"
  gap?: string;                    // "24px"
  rowGap?: string;
  columnGap?: string;
  justifyContent?: string;         // "start" | "center" | ...
  alignContent?: string;
  justifyItems?: string;
  alignItems?: string;
  
  // Item
  gridColumn?: string;             // "1 / 3"
  gridRow?: string;                // "span 2"
  gridArea?: string;               // "header"
  gridColumnStart?: string;
  gridColumnEnd?: string;
  gridRowStart?: string;
  gridRowEnd?: string;
  justifySelf?: string;
  alignSelf?: string;
}
```

---

## 10. Builder Commands (Grid-specific)

Komendy dedykowane dla Grid zostaną szczegółowo zdefiniowane w `40_GRID_COMMANDS.md`. Poniżej przegląd:

| Komenda | Opis |
|---------|------|
| `SET_GRID_COLUMNS` | Ustawienie `gridTemplateColumns` jako strukturalnej TrackList |
| `SET_GRID_ROWS` | Ustawienie `gridTemplateRows` jako strukturalnej TrackList |
| `SET_GRID_GAP` | Ustawienie gap (pojedynczy gap lub row/column osobno) |
| `SET_GRID_AUTO` | Ustawienie gridAutoFlow + gridAutoColumns + gridAutoRows |
| `SET_GRID_PLACEMENT` | Ustawienie gridColumn/gridRow na dziecku (shorthand lub longhand) |
| `SET_GRID_AREA` | Ustawienie gridArea na dziecku |
| `SET_GRID_ALIGN` | Ustawienie alignment properties (justify/align content/items/self) |
| `SET_GRID_DISPLAY` | Zmiana display na GRID z automatycznym ustawieniem domyślnych grid props |

---

## 11. CSS Output — Przykłady

### 11.1 Podstawowy grid 3-kolumnowy

```css
.grid-gallery {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
}
```

### 11.2 Grid z repeat i różnymi rozmiarami

```css
.grid-layout {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}

.grid-layout header {
  grid-column: 1 / 4;
  grid-row: 1;
}

.grid-layout main {
  grid-column: 2;
  grid-row: 2;
}

.grid-layout sidebar {
  grid-column: 3;
  grid-row: 2;
}

.grid-layout footer {
  grid-column: 1 / 4;
  grid-row: 3;
}
```

### 11.3 Grid z minmax i auto-flow

```css
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-auto-flow: dense;
  gap: 16px;
}
```

### 11.4 Grid z alignment

```css
.grid-centered {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  justify-content: center;
  align-content: center;
  justify-items: center;
  align-items: center;
  gap: 24px;
}
```

---

## 12. Interaction with Canvas

Ponieważ Canvas Engine jest w trakcie implementacji (Sprint 4), konieczne jest zdefiniowanie granic odpowiedzialności między Grid Engine a Canvas.

### 12.1 Czego Grid oczekuje od Canvas

| Wymaganie | Opis |
|-----------|------|
| **Display: grid** | Canvas musi rozpoznawać `display: grid` i renderować grid overlay |
| **Grid overlay** | Wizualne linie gridu (kolumny + wiersze) nałożone na canvas dla kontenerów grid |
| **Snap to grid lines** | Przeciąganie elementów wewnątrz gridu przyciąga się do linii gridu |
| **Grid resize handles** | Możliwość zmiany rozmiaru kolumn/wierszy bezpośrednio w canvasie (drag) |

### 12.2 Czego Canvas oczekuje od Grid

| Wymaganie | Opis |
|-----------|------|
| **Grid geometry** | Grid Engine dostarcza wyliczoną geometrię (linie, tracki, obszary) do Canvas |
| **Grid lines data** | Struktura danych z pozycjami linii gridu (w px względem kontenera) |
| **Grid area names** | Lista nazwanych obszarów gridu z ich pozycjami |

### 12.3 Odpowiedzialności

| Odpowiedzialność | Należy do |
|-----------------|-----------|
| Definiowanie właściwości gridu | Grid Engine (LayoutTypes) |
| Walidacja właściwości gridu | Grid Engine (LayoutTypes) |
| Mapowanie na CSS | Grid Engine (LayoutTypes → CSS) |
| Renderowanie grid overlay na canvasie | Canvas Engine |
| Interakcje drag/snap/resize w canvasie | Canvas Engine + Drag & Drop Engine (Sprint 5) |
| Inspector UI dla grid props | Grid Engine (GridField.tsx) |

---

## 13. Decision Records

### DR-GRID-001: Strukturalny model tracków, nie string CSS
**Status:** Proposed  
**Uzasadnienie:** Grid tracki są modelowane jako `TrackBreadcrumb` (union type), a nie jako string CSS. Pozwala to na:
- Walidację bez parsowania CSS
- Serializację bez utraty informacji
- Łatwe operacje transformacji (duplikacja, zmiana kolejności)
- Lepsze wsparcie dla AI
- Współdzielenie modelu między warstwami (LayoutTypes → Inspector → Runtime)

### DR-GRID-002: Grid Container i Grid Item jako osobne interfejsy
**Status:** Proposed  
**Uzasadnienie:** Własności gridu dzielą się naturalnie na dwie grupy — kontener i dziecko. Osobne interfejsy (`GridContainerProps`, `GridItemProps`) pozwalają na:
- Czystszy model danych
- Lżejszą serializację (dziecko nie nosi właściwości kontenera)
- Łatwiejsze UI w Inspectorze (warunkowe pokazywanie pól)
- Zgodność z CSS Grid spec (właściwości są przypisane do konkretnego elementu)

### DR-GRID-003: GridSpanValue jako model, nie string
**Status:** Proposed  
**Uzasadnienie:** `grid-column: 1 / span 3` jest modelowane jako struktura, nie string. Analogicznie do DR-GRID-001 — to pozwala na walidację, serializację i transformacje bez parsowania CSS.

### DR-GRID-004: Visibility oparty o `display: GRID`
**Status:** Proposed  
**Uzasadnienie:** Wszystkie właściwości gridu są warunkowo wyświetlane w Inspectorze tylko gdy `display === 'GRID'`. To zapobiega zaśmiecaniu UI właściwościami, które nie mają zastosowania dla danego elementu.

### DR-GRID-005: Gap współdzielony z FlexContainerProps
**Status:** Proposed  
**Uzasadnienie:** `gap`, `rowGap`, `columnGap` są już zdefiniowane w `FlexContainerProps`. Grid Engine będzie używać tych samych pól — nie tworzymy osobnych pól `gridGap`. To zapewnia spójność modelu danych i czystszy eksport CSS.

### DR-GRID-006: Grid alignment jako osobne typy (nie współdzielone z Flex)
**Status:** Proposed  
**Uzasadnienie:** CSS Grid ma własne wartości dla `justifyContent`/`alignContent` (grid: `start`, `end`, `center`, `stretch`, `space-around`, `space-between`, `space-evenly`), które różnią się od flex (flex-start, flex-end, itp.). Dlatego grid alignment ma osobne typy `GridJustifyContent`, `GridAlignContent`, `GridJustifyItems`, `GridAlignItems`.

### DR-GRID-007: Display 'GRID' wymaga rozszerzenia displayToCSS
**Status:** Proposed  
**Uzasadnienie:** Istniejąca funkcja `displayToCSS` w `LayoutTypes.ts` obsługuje `'GRID'` tylko jako `css.display = 'grid'`. Po dodaniu Grid Engine, `displayToCSS` powinna również generować grid-specific CSS (kolumny, wiersze, gap) gdy wywołana z `GridContainerProps`.

---

## 14. MVP vs Później — Pełna tabela

| Funkcja | MVP Sprint 5B.1 | Sprint 5B.2+ |
|---------|:---------------:|:------------:|
| `fr` jednostka | ✅ | — |
| `repeat(n, track)` | ✅ | — |
| `minmax(min, max)` | ✅ | — |
| `auto` / `min-content` / `max-content` | ✅ | — |
| Pojedyncze tracki (1fr, 200px) | ✅ | — |
| Wiele tracków (1fr 2fr 1fr) | ✅ | — |
| `gridAutoFlow` | ✅ | — |
| `gridAutoColumns` / `gridAutoRows` | ✅ | — |
| `gap` / `rowGap` / `columnGap` | ✅ | — |
| Grid item placement (gridColumn/gridRow) | ✅ | — |
| Grid item area (gridArea) | ✅ | — |
| Grid alignment (justify/align content/items/self) | ✅ | — |
| `repeat(auto-fill, ...)` | ⏳ | ✅ |
| `repeat(auto-fit, ...)` | ⏳ | ✅ |
| `grid-template-areas` (named areas) | ⏳ | ✅ |
| `place-items` / `place-content` / `place-self` | ⏳ | ✅ |
| Subgrid | ⏳ | ✅ |
| Named grid lines | ⏳ | ✅ |
| Wizualny edytor obszarów gridu | ⏳ | ✅ |
| Grid overlay na canvasie | ⏳ | ✅ (Canvas) |
| Snap to grid w canvasie | ⏳ | ✅ (Drag & Drop) |

---

## 15. Zależności

| Dokument | Zależność | Opis |
|----------|-----------|------|
| `31_LAYOUT_PROPERTY_SPECIFICATION.md` | Wymagany | Definiuje istniejące właściwości layoutu (display, gap, justify-content, itp.) |
| `32_RESPONSIVE_VALUE_MODEL.md` | Wymagany | Model wartości per-breakpoint dla wszystkich właściwości |
| `33_LAYOUT_COMMANDS.md` | Wymagany | Istniejące komendy layoutu (UPDATE_PROPS, SET_DISPLAY) |
| `06_LAYOUT_ENGINE.md` | Wymagany | Architektura Layout Engine |
| `36_STUDIO_ENGINEERING_PROCESS.md` | Wymagany | Proces rozwoju subsystemów (8 faz) |
| `03_CANVAS_ENGINE.md` | Informacyjny | Canvas — grid overlay i interakcje (Sprint 4) |
| `05_DRAG_DROP_ENGINE.md` | Informacyjny | Snap to grid (Sprint 5) |

---

## 16. Future Extensions

| Obszar | Planowany Sprint | Opis |
|--------|-----------------|------|
| `auto-fill` / `auto-fit` | Sprint 5B.2 | Rozszerzenie `TrackBreadcrumb` o `auto-fill` i `auto-fit` |
| Named Grid Areas | Sprint 5B.2 | `grid-template-areas` + wizualny edytor |
| Subgrid | Sprint 5C | `subgrid` jako typ tracka w `TrackBreadcrumb` |
| Named Grid Lines | Sprint 5C | Nazwane linie w `GridPlacement` |
| Grid Overlay | Sprint 5 (Canvas) | Wizualne linie gridu na canvasie |
| Masonry Layout | Future | CSS Grid v2 eksperymentalna funkcja |

