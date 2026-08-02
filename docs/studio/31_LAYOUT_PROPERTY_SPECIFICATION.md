# C16.31 — Layout Property Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 31_LAYOUT_PROPERTY_SPECIFICATION.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 06_LAYOUT_ENGINE.md, 07_INSPECTOR.md, 12_RESPONSIVE_ENGINE.md, 26_RUNTIME_INSPECTOR.md

---

## 1. Cel

Niniejszy dokument stanowi kontrakt pomiędzy trzema subsystemami Studia:

| Subsystem | Rola |
|-----------|------|
| **Layout Engine** | Definiuje model właściwości layoutu i generuje CSS |
| **Inspector** | Renderuje UI do edycji właściwości layoutu |
| **Runtime** | Konsumuje skompilowane właściwości i renderuje je w preview |

Celem jest zapewnienie, że każda właściwość layoutu ma:

- **Jednoznaczną definicję** — typ, jednostki, zakres, walidacja
- **Jasną reprezentację w PropSchema** — jak Inspector ma ją wyrenderować
- **Określone mapowanie na CSS** — co Runtime wygeneruje
- **Zdefiniowane zachowanie responsywne** — jak działa per-breakpoint

---

## 2. Zakres

Dokument obejmuje następujące grupy właściwości:

| Grupa | Właściwości | Status |
|-------|-------------|--------|
| Display | `display`, `flexDirection`, `flexWrap`, `justifyContent`, `alignItems`, `alignContent` | Sprint 5A |
| Spacing | `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`, `gap`, `rowGap`, `columnGap` | Sprint 5A |
| Size | `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, `maxHeight`, `aspectRatio` | Sprint 5A |
| Position | `position`, `top`, `right`, `bottom`, `left`, `zIndex` | Sprint 5A |
| Grid | `gridTemplateColumns`, `gridTemplateRows`, `gridColumn`, `gridRow`, `gridArea` | Sprint 5B |
| Overflow | `overflow`, `overflowX`, `overflowY` | Sprint 5B |
| Flex Child | `flex`, `flexGrow`, `flexShrink`, `flexBasis`, `alignSelf`, `order` | Sprint 5A |

---

## 3. Property Model

### 3.1 Display & Flex

```typescript
// ---- Typy bazowe ----

type DisplayMode = 'BLOCK' | 'FLEX' | 'GRID' | 'ABSOLUTE' | 'NONE';

type FlexDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse';
type JustifyContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
type AlignItems = 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
type AlignContent = 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'stretch';
type AlignSelf = 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';

// ---- Flex container props ----

interface FlexContainerProps {
  display: DisplayMode;           // default: 'BLOCK'
  flexDirection: FlexDirection;   // default: 'row'
  flexWrap: FlexWrap;             // default: 'nowrap'
  justifyContent: JustifyContent; // default: 'flex-start'
  alignItems: AlignItems;         // default: 'stretch'
  alignContent: AlignContent;     // default: 'flex-start'
  gap: number;                    // default: 0, unit: px
  rowGap: number;                 // default: undefined (→ gap), unit: px
  columnGap: number;              // default: undefined (→ gap), unit: px
}

// ---- Flex child props ----

interface FlexChildProps {
  flex: number;                   // default: 0 (shorthand for grow/shrink/basis)
  flexGrow: number;               // default: 0
  flexShrink: number;             // default: 1
  flexBasis: SizeValue;           // default: 'auto'
  alignSelf: AlignSelf;           // default: 'auto'
  order: number;                  // default: 0
}
```

#### PropSchema (Inspector)

```typescript
// Display Select
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

// Flex Direction
{
  key: 'flexDirection',
  label: 'Direction',
  type: 'select',
  required: false,
  defaultValue: 'row',
  group: 'layout',
  options: [
    { label: '→ Row', value: 'row' },
    { label: '↓ Column', value: 'column' },
    { label: '← Row Reverse', value: 'row-reverse' },
    { label: '↑ Column Reverse', value: 'column-reverse' },
  ],
  metadata: { icon: 'arrow-right', tags: ['flex'] },
}

// Gap
{
  key: 'gap',
  label: 'Gap',
  type: 'number',
  required: false,
  defaultValue: 0,
  group: 'layout',
  metadata: { unit: 'px', min: 0, max: 100, step: 1, icon: 'grip-horizontal' },
}
```

#### CSS Mapping

```typescript
function displayToCSS(props: FlexContainerProps): Record<string, string> {
  const css: Record<string, string> = {};

  switch (props.display) {
    case 'FLEX':
      css.display = 'flex';
      css.flexDirection = props.flexDirection ?? 'row';
      css.flexWrap = props.flexWrap ?? 'nowrap';
      css.justifyContent = props.justifyContent ?? 'flex-start';
      css.alignItems = props.alignItems ?? 'stretch';
      css.alignContent = props.alignContent ?? 'flex-start';
      if (props.gap !== undefined) css.gap = `${props.gap}px`;
      if (props.rowGap !== undefined) css.rowGap = `${props.rowGap}px`;
      if (props.columnGap !== undefined) css.columnGap = `${props.columnGap}px`;
      break;

    case 'BLOCK':
      css.display = 'block';
      break;

    case 'GRID':
      css.display = 'grid';
      break;

    case 'ABSOLUTE':
      // container: position: relative
      // child: position: absolute
      break;

    case 'NONE':
      css.display = 'none';
      break;
  }

  return css;
}
```

---

### 3.2 Spacing (Padding & Margin)

```typescript
// ---- Typy bazowe ----

interface SpacingValue {
  top: number;      // px
  right: number;    // px
  bottom: number;   // px
  left: number;     // px
  linked: boolean;  // true = wszystkie strony mają tę samą wartość
}

// ---- Właściwości ----

interface SpacingProps {
  padding: SpacingValue;      // default: { top: 0, right: 0, bottom: 0, left: 0, linked: true }
  margin: SpacingValue;       // default: { top: 0, right: 0, bottom: 0, left: 0, linked: true }
}
```

#### PropSchema (Inspector)

Spacing jest reprezentowany jako osobny **renderer typu 'spacing'** w PropertyRegistry, a nie jako 4 osobne pola `number`. To pozwala na:

- Wizualny edytor 4-stronny (padding/margin)
- Przycisk link/unlink (wszystkie strony razem lub osobno)
- Responsywne wartości per breakpoint

```typescript
{
  key: 'padding',
  label: 'Padding',
  type: 'spacing',          // ← custom type, rejestrowany w PropertyRegistry
  required: false,
  defaultValue: { top: 0, right: 0, bottom: 0, left: 0, linked: true },
  group: 'spacing',
  metadata: { icon: 'square', tags: ['padding', 'spacing'] },
}

{
  key: 'margin',
  label: 'Margin',
  type: 'spacing',
  required: false,
  defaultValue: { top: 0, right: 0, bottom: 0, left: 0, linked: true },
  group: 'spacing',
  metadata: { icon: 'square', tags: ['margin', 'spacing'] },
}
```

#### Validation Rules

```typescript
function validateSpacing(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object') {
    return { valid: false, errors: [{ key: 'spacing', message: 'Spacing value must be an object', code: 'INVALID_FORMAT' }] };
  }

  const s = value as Record<string, unknown>;
  const errors: ValidationError[] = [];

  for (const side of ['top', 'right', 'bottom', 'left']) {
    if (typeof s[side] !== 'number' || isNaN(s[side] as number)) {
      errors.push({ key: `spacing.${side}`, message: `Spacing ${side} must be a number`, code: 'INVALID_FORMAT' });
    } else if ((s[side] as number) < 0 || (s[side] as number) > 500) {
      errors.push({ key: `spacing.${side}`, message: `Spacing ${side} must be between 0 and 500`, code: 'CUSTOM' });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

#### CSS Mapping

```typescript
function spacingToCSS(spacing: SpacingValue, isMargin: boolean): Record<string, string> {
  const prefix = isMargin ? 'margin' : 'padding';
  return {
    [`${prefix}Top`]: `${spacing.top}px`,
    [`${prefix}Right`]: `${spacing.right}px`,
    [`${prefix}Bottom`]: `${spacing.bottom}px`,
    [`${prefix}Left`]: `${spacing.left}px`,
  };
}
```

---

### 3.3 Size (Dimensions)

```typescript
// ---- Typy bazowe ----

type CSSUnit = 'px' | '%' | 'vw' | 'vh' | 'rem' | 'em' | 'auto' | 'fit-content' | 'min-content' | 'max-content';

interface SizeValue {
  value: number;
  unit: CSSUnit;
}

// ---- Właściwości ----

interface SizeProps {
  width: SizeValue;            // default: { value: 100, unit: '%' }
  height: SizeValue;           // default: { value: 0, unit: 'auto' }
  minWidth: SizeValue;         // default: undefined
  minHeight: SizeValue;        // default: undefined
  maxWidth: SizeValue;         // default: undefined
  maxHeight: SizeValue;        // default: undefined
  aspectRatio: string | null;  // default: null — "16/9", "1/1", "4/3", "3/2", "2/3"
}
```

#### PropSchema (Inspector)

Size jest reprezentowany jako osobny **renderer typu 'size'** w PropertyRegistry, który pokazuje:

- Pole liczbowe + dropdown jednostek
- Min/Max expandable section
- Aspect ratio dropdown

```typescript
{
  key: 'width',
  label: 'Width',
  type: 'size',             // ← custom type
  required: false,
  defaultValue: { value: 100, unit: '%' },
  group: 'layout',
  metadata: { icon: 'maximize-2', tags: ['size', 'width'] },
}

{
  key: 'height',
  label: 'Height',
  type: 'size',
  required: false,
  defaultValue: { value: 0, unit: 'auto' },
  group: 'layout',
  metadata: { icon: 'maximize-2', tags: ['size', 'height'] },
}

{
  key: 'aspectRatio',
  label: 'Aspect Ratio',
  type: 'select',
  required: false,
  defaultValue: null,
  group: 'layout',
  options: [
    { label: 'Auto', value: null },
    { label: '16:9', value: '16/9' },
    { label: '4:3', value: '4/3' },
    { label: '1:1', value: '1/1' },
    { label: '3:2', value: '3/2' },
    { label: '2:3', value: '2/3' },
    { label: '21:9', value: '21/9' },
  ],
  metadata: { icon: 'crop', tags: ['aspect', 'ratio'] },
}
```

#### Validation Rules

```typescript
function validateSizeValue(value: unknown): ValidationResult {
  if (!value || typeof value !== 'object') {
    return { valid: false, errors: [{ key: 'size', message: 'Size value must be an object', code: 'INVALID_FORMAT' }] };
  }

  const s = value as Record<string, unknown>;
  const errors: ValidationError[] = [];

  if (typeof s.value !== 'number' || isNaN(s.value as number)) {
    errors.push({ key: 'size.value', message: 'Size value must be a number', code: 'INVALID_FORMAT' });
  }

  const validUnits: CSSUnit[] = ['px', '%', 'vw', 'vh', 'rem', 'em', 'auto', 'fit-content', 'min-content', 'max-content'];
  if (!validUnits.includes(s.unit as CSSUnit)) {
    errors.push({ key: 'size.unit', message: `Invalid unit: ${String(s.unit)}`, code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}
```

#### CSS Mapping

```typescript
function sizeToCSS(size: SizeValue): string {
  if (size.unit === 'auto' || size.unit === 'fit-content' || size.unit === 'min-content' || size.unit === 'max-content') {
    return size.unit;
  }
  return `${size.value}${size.unit}`;
}
```

---

### 3.4 Position

```typescript
// ---- Typy bazowe ----

type PositionType = 'relative' | 'absolute' | 'fixed' | 'sticky';

// ---- Właściwości ----

interface PositionProps {
  position: PositionType;     // default: 'relative'
  top: number;                // default: 0, unit: px
  right: number;              // default: 0, unit: px
  bottom: number;             // default: 0, unit: px
  left: number;               // default: 0, unit: px
  zIndex: number;             // default: 0, range: 0-9999
}
```

#### PropSchema (Inspector)

```typescript
{
  key: 'position',
  label: 'Position',
  type: 'select',
  required: true,
  defaultValue: 'relative',
  group: 'layout',
  options: [
    { label: 'Relative', value: 'relative' },
    { label: 'Absolute', value: 'absolute' },
    { label: 'Fixed', value: 'fixed' },
    { label: 'Sticky', value: 'sticky' },
  ],
  metadata: { icon: 'move', tags: ['position'] },
}

// top/right/bottom/left są warunkowe — pokazują się tylko dla absolute/fixed/sticky
{
  key: 'top',
  label: 'Top',
  type: 'number',
  required: false,
  defaultValue: 0,
  group: 'layout',
  metadata: { unit: 'px', min: -9999, max: 9999, step: 1, icon: 'arrow-up', tags: ['position'] },
}

// zIndex
{
  key: 'zIndex',
  label: 'Z-Index',
  type: 'number',
  required: false,
  defaultValue: 0,
  group: 'layout',
  metadata: { unit: '', min: 0, max: 9999, step: 1, icon: 'layers', tags: ['z-index', 'position'] },
}
```

#### CSS Mapping

```typescript
function positionToCSS(props: PositionProps): Record<string, string> {
  const css: Record<string, string> = {};

  if (props.position === 'absolute' || props.position === 'fixed' || props.position === 'sticky') {
    css.position = props.position;
    if (props.top !== 0) css.top = `${props.top}px`;
    if (props.right !== 0) css.right = `${props.right}px`;
    if (props.bottom !== 0) css.bottom = `${props.bottom}px`;
    if (props.left !== 0) css.left = `${props.left}px`;
  } else {
    css.position = 'relative';
  }

  if (props.zIndex && props.zIndex !== 0) {
    css.zIndex = String(props.zIndex);
  }

  return css;
}
```

---

### 3.5 Overflow

```typescript
type OverflowMode = 'visible' | 'hidden' | 'scroll' | 'auto';

interface OverflowProps {
  overflow: OverflowMode;      // default: 'visible'
  overflowX: OverflowMode;     // default: undefined (→ overflow)
  overflowY: OverflowMode;     // default: undefined (→ overflow)
}
```

---

## 4. Units

### 4.1 Dozwolone jednostki

| Jednostka | Zastosowanie | Opis |
|-----------|-------------|------|
| `px` | Wszystkie właściwości numeryczne | Piksele — wartość absolutna |
| `%` | Width, Height, Min/Max | Procent w stosunku do rodzica |
| `vw` | Width, FontSize (future) | 1% szerokości viewportu |
| `vh` | Height, FontSize (future) | 1% wysokości viewportu |
| `rem` | Spacing, FontSize (future) | Względem font-size roota (16px) |
| `em` | Spacing, FontSize (future) | Względem font-size rodzica |
| `auto` | Width, Height | Automatycznie przez przeglądarkę |
| `fit-content` | Width, Height | Dopasowanie do zawartości |
| `min-content` | Width, Height | Minimalna szerokość zawartości |
| `max-content` | Width, Height | Maksymalna szerokość zawartości |

### 4.2 Domyślne jednostki per właściwość

| Właściwość | Domyślna jednostka |
|------------|-------------------|
| width, minWidth, maxWidth | `%` |
| height, minHeight, maxHeight | `px` |
| padding (wszystkie strony) | `px` |
| margin (wszystkie strony) | `px` |
| gap, rowGap, columnGap | `px` |
| top, right, bottom, left | `px` |
| flexBasis | `%` |

---

## 5. Validation Rules

### 5.1 Reguły globalne

| Warunek | Reakcja |
|---------|---------|
| Wartość wymagana (required: true) i undefined/null | Błąd: REQUIRED |
| Typ wartości niezgodny ze schema | Błąd: INVALID_FORMAT |
| Wartość spoza zakresu min/max | Błąd: MIN_VALUE / MAX_VALUE |
| Nieprawidłowa opcja select | Błąd: INVALID_OPTION |

### 5.2 Reguły specyficzne dla layoutu

| Właściwość | Reguła |
|------------|--------|
| padding/margin top/right/bottom/left | ≥ 0, ≤ 500 |
| gap | ≥ 0, ≤ 200 |
| width/height value | ≥ 0, ≤ 9999 |
| zIndex | 0-9999 (integer) |
| flex | 0-10 (float) |
| flexGrow | 0-10 (float) |
| flexShrink | 0-10 (float) |
| order | -999-999 (integer) |
| opacity (future) | 0-1 (float, step 0.01) |

---

## 6. Responsive Behaviour

Każda właściwość layoutu może być responsywna. Model responsywny jest zdefiniowany w osobnym dokumencie: `32_RESPONSIVE_VALUE_MODEL.md`.

Kluczowe zasady:

1. **Desktop-first** — wartość desktopowa jest bazowa
2. **Fallback** — tablet → desktop, mobile → tablet → desktop
3. **Override** — każda właściwość może mieć override dla tabletu i/lub mobile
4. **Serializacja** — wartości responsywne są przechowywane osobno od bazowych w dokumencie

```typescript
// Przykład: responsywny padding
{
  sectionId: 'sec_hero',
  props: {
    padding: { top: 40, right: 40, bottom: 40, left: 40, linked: true },  // desktop (base)
  },
  responsive: {
    padding: {
      tablet: { top: 24, right: 24, bottom: 24, left: 24, linked: true },
      mobile: { top: 16, right: 16, bottom: 16, left: 16, linked: true },
    },
  },
}
```

---

## 7. Runtime Mapping

### 7.1 Kompilacja (BuilderDocument → CompiledDocument)

```typescript
interface CompiledLayoutProps {
  // Flex
  display?: string;
  flexDirection?: string;
  flexWrap?: string;
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  gap?: string;             // "16px"
  rowGap?: string;
  columnGap?: string;

  // Spacing
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;

  // Size
  width?: string;           // "100%", "auto", "320px"
  height?: string;
  minWidth?: string;
  minHeight?: string;
  maxWidth?: string;
  maxHeight?: string;
  aspectRatio?: string;

  // Position
  position?: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  zIndex?: number;

  // Flex child
  flex?: string;
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: string;
  alignSelf?: string;
  order?: number;

  // Overflow
  overflow?: string;
}
```

### 7.2 Funkcja kompilacji

```typescript
function compileLayoutProps(layout: LayoutProps, breakpoint: Breakpoint): CompiledLayoutProps {
  // 1. Weź bazowe właściwości
  // 2. Zastosuj override z breakpointa (jeśli istnieją)
  // 3. Mapuj na stringi CSS
  // 4. Zwróć CompiledLayoutProps
}
```

---

## 8. Builder Commands

Komendy związane z layoutem są zdefiniowane w osobnym dokumencie: `33_LAYOUT_COMMANDS.md`.

Kluczowe komendy:

| Komenda | Opis |
|---------|------|
| `UPDATE_PROPS` | Aktualizacja pojedyńczej właściwości layoutu (już istnieje) |
| `SET_SPACING` | Ustawienie wszystkich 4 stron padding/margin jednocześnie |
| `SET_SIZE` | Ustawienie width/height z jednostką |
| `SET_DISPLAY` | Zmiana display mode → automatyczne resetowanie niepotrzebnych pól |
| `SET_FLEX` | Ustawienie pełnego flex layoutu (direction + wrap + justify + align) |

---

## 9. CSS Output

### 9.1 Przykład pełnego outputu

```css
/* Flex container */
.section-hero {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 40px;
  margin: 0 auto;
  width: 100%;
  max-width: 1280px;
  position: relative;
  z-index: 1;
}

/* Flex child */
.section-hero__item {
  flex: 1;
  flex-grow: 1;
  flex-shrink: 1;
  flex-basis: auto;
  align-self: stretch;
  order: 0;
}

/* Absolute positioned */
.section-hero__badge {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}
```

### 9.2 Responsywny output (media queries)

```css
/* Desktop (base) */
.section {
  display: flex;
  flex-direction: row;
  gap: 24px;
  padding: 48px;
}

/* Tablet */
@media (max-width: 1023px) {
  .section {
    flex-direction: column;
    gap: 16px;
    padding: 32px;
  }
}

/* Mobile */
@media (max-width: 479px) {
  .section {
    padding: 16px;
  }
}
```

---

## 10. Property-to-CSS Map (pełna referencja)

| Właściwość (Builder) | CSS Property | Format |
|---------------------|--------------|--------|
| `display` | `display` | `flex \| block \| grid \| none` |
| `flexDirection` | `flex-direction` | `row \| column \| ...` |
| `flexWrap` | `flex-wrap` | `nowrap \| wrap \| ...` |
| `justifyContent` | `justify-content` | `flex-start \| center \| ...` |
| `alignItems` | `align-items` | `flex-start \| center \| ...` |
| `alignContent` | `align-content` | `flex-start \| center \| ...` |
| `gap` | `gap` | `${value}px` |
| `padding.top` | `padding-top` | `${value}px` |
| `padding.right` | `padding-right` | `${value}px` |
| `padding.bottom` | `padding-bottom` | `${value}px` |
| `padding.left` | `padding-left` | `${value}px` |
| `margin.top` | `margin-top` | `${value}px` |
| `margin.right` | `margin-right` | `${value}px` |
| `margin.bottom` | `margin-bottom` | `${value}px` |
| `margin.left` | `margin-left` | `${value}px` |
| `width` | `width` | `${value}${unit}` |
| `height` | `height` | `${value}${unit}` |
| `minWidth` | `min-width` | `${value}${unit}` |
| `minHeight` | `min-height` | `${value}${unit}` |
| `maxWidth` | `max-width` | `${value}${unit}` |
| `maxHeight` | `max-height` | `${value}${unit}` |
| `aspectRatio` | `aspect-ratio` | `16/9 \| 1/1 \| ...` |
| `position` | `position` | `relative \| absolute \| ...` |
| `top` | `top` | `${value}px` |
| `right` | `right` | `${value}px` |
| `bottom` | `bottom` | `${value}px` |
| `left` | `left` | `${value}px` |
| `zIndex` | `z-index` | `${value}` |
| `flex` | `flex` | `${value}` |
| `flexGrow` | `flex-grow` | `${value}` |
| `flexShrink` | `flex-shrink` | `${value}` |
| `flexBasis` | `flex-basis` | `${value}${unit}` |
| `alignSelf` | `align-self` | `auto \| flex-start \| ...` |
| `order` | `order` | `${value}` |
| `overflow` | `overflow` | `visible \| hidden \| ...` |

---

## 11. Future Extensions

| Obszar | Planowany sprint | Opis |
|--------|-----------------|------|
| Grid | Sprint 5B | `grid-template-columns`, `grid-template-rows`, `grid-gap` |
| Gap per-side | Sprint 5B | `row-gap`, `column-gap` jako osobne pola |
| Overflow | Sprint 5B | `overflow`, `overflow-x`, `overflow-y` |
| Opacity | Sprint 5C | `opacity: 0-1` |
| Transform | Sprint 5C | `translate`, `rotate`, `scale`, `skew` |
| Cursor | Sprint 5C | `cursor: pointer`, `default`, `grab`, itp. |
| User Select | Sprint 5C | `user-select: none`, `text`, `all` |
| Pointer Events | Sprint 5C | `pointer-events: auto`, `none` |
| Container Queries | Future | `container-type: inline-size` + `@container` |

---

## 12. Decision Records

### DR-LAYOUT-001: Spacing jako obiekt, nie 4 osobne pola
**Status:** Approved  
**Uzasadnienie:** `SpacingValue { top, right, bottom, left, linked }` pozwala na:
- Atomiczną aktualizację (jedna komenda zamiast 4)
- Linkowanie wartości (zmiana jednej strony → wszystkie)
- Łatwiejszą serializację responsywną (jeden override zamiast 4)

### DR-LAYOUT-002: SizeValue jako { value, unit }, nie string
**Status:** Approved  
**Uzasadnienie:** Rozdzielenie wartości od jednostki pozwala na:
- Lżejszą walidację (value osobno, unit osobno)
- Łatwiejsze UI (number input + select zamiast text input)
- Proste operacje matematyczne (value * 2 przy duplikacji)

### DR-LAYOUT-003: Wartości domyślne na poziomie schematu, nie engine
**Status:** Approved  
**Uzasadnienie:** Każda właściwość ma `defaultValue` w `PropSchema`. Layout Engine nie definiuje domyślnych wartości — to Inspector je stosuje przez `InspectorRuntime.applyDefaults()`. Dzięki temu zmiana domyślnej wartości nie wymaga modyfikacji engine.

### DR-LAYOUT-004: Jednostki per-wartość, nie globalne
**Status:** Approved  
**Uzasadnienie:** Każda `SizeValue` ma własną jednostkę. Nie ma globalnego ustawienia jednostki dla wszystkich właściwości. To daje maksymalną elastyczność (np. width w %, ale min-width w px).

### DR-LAYOUT-005: Gap jako osobna właściwość, nie margin na dzieciach
**Status:** Approved  
**Uzasadnienie:** `gap` jest czystszy niż margin na dzieciach, nie wpływa na klikalność krawędzi i jest lepiej wspierany we wszystkich display modes.

