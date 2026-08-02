# Sprint 5B.3 — Border Property Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0
> **Dokument:** 49_BORDER_PROPERTY_SPECIFICATION.md
> **Status:** Draft — Sprint 5B.3
> **Sprint:** 5B.3 — Border
> **Zależności:** 48_ADR_VISUAL_001_BORDER_RADIUS_ARCHITECTURE.md, LayoutTypes.ts
>
> **Proces:** Faza 1 z 8 — Specification

---

## 1. Cel

Niniejszy dokument definiuje **Border** — subsystem odpowiedzialny za modelowanie, walidację i mapowanie na CSS właściwości `border` (style, width, color).

Border jest pierwszym subsystemem w kategorii **Visual** Inspectora, zgodnie z decyzją ADR-VISUAL-001. Jego MVP ogranicza się do jednolitego obramowania (wszystkie 4 krawędzie tą samą wartością), co jest spójne z podejściem zastosowanym w Overflow.

### 1.1 Cel Sprintu 5B.3

> **Dostarczyć kompletny Border Engine z obsługą jednolitego obramowania: style, width, color.**

Oraz:

> **Potwierdzić, że proces 8-fazowy jest efektywny również dla subsystemów wizualnych (kategoria Visual).**

---

## 2. Zakres MVP

### 2.1 Właściwości objęte

| # | Właściwość (Builder) | CSS Property | Typ | Zakres |
|---|---------------------|--------------|-----|--------|
| 1 | `borderStyle` | `border-style` | `BorderStyle` | solid, dashed, dotted |
| 2 | `borderWidth` | `border-width` | `BorderWidthValue` | liczba (px) |
| 3 | `borderColor` | `border-color` | `string` | hex, rgb, rgba, named |

### 2.2 Co NIE wchodzi w zakres MVP

| Funkcja | Powód | Planowany sprint |
|---------|-------|:----------------:|
| Per-edge (border-top, border-left...) | Zwiększa złożoność | Późniejszy |
| `border: none` | Obsługiwane przez brak wartości | — |
| `outline` | Osobna właściwość CSS | Późniejszy |
| `border-image` | Rzadko używane | Późniejszy |
| Zaawansowane style (groove, ridge, inset, outset) | Poza zakresem MVP | Późniejszy |
| Zaokrąglone krawędzie (border-radius) | Osobny subsystem — Sprint 5B.4 | Sprint 5B.4 |

---

## 3. Model domenowy

### 3.1 Proponowany model

```typescript
/**
 * Border style values (CSS border-style).
 * MVP: solid, dashed, dotted.
 */
export type BorderStyle = 'solid' | 'dashed' | 'dotted';

/**
 * Border width with value and unit.
 * MVP: only 'px' unit.
 */
export interface BorderWidthValue {
  value: number;
  unit: 'px';
}

/**
 * Border properties — uniform border for all 4 edges.
 * All edges share the same style, width, and color.
 */
export interface BorderProps {
  borderStyle?: BorderStyle;
  borderWidth?: BorderWidthValue;
  borderColor?: string;
}
```

### 3.2 Weryfikacja kompletności modelu

| Aspekt | Status | Uwagi |
|--------|:------:|-------|
| Typ `BorderStyle` | ✅ Kompletny dla MVP | 3 wartości: solid, dashed, dotted |
| Interfejs `BorderWidthValue` | ✅ Kompletny dla MVP | value + unit (px) |
| Interfejs `BorderProps` | ✅ Kompletny dla MVP | style, width, color |
| Wartość domyślna | ✅ Brak — optional | Wszystkie pola opcjonalne |
| Serializowalność JSON | ✅ | Plain object, bez funkcji |
| Gotowość na ResponsiveValue\<T\> | ✅ | Każde pole może być opakowane |
| CSS mapping | ✅ `borderToCSS()` | Pure function |
| Walidacja | ✅ `validateBorder()`, `validateBorderProps()` | |

### 3.3 Future: Per-edge border

W przyszłości model może zostać rozszerzony o per-edge:

```typescript
// Future extension — not in MVP
export interface BorderProps {
  // MVP — uniform
  borderStyle?: BorderStyle;
  borderWidth?: BorderWidthValue;
  borderColor?: string;

  // Future — per-edge overrides
  borderTopStyle?: BorderStyle;
  borderRightStyle?: BorderStyle;
  borderBottomStyle?: BorderStyle;
  borderLeftStyle?: BorderStyle;
  borderTopWidth?: BorderWidthValue;
  borderRightWidth?: BorderWidthValue;
  borderBottomWidth?: BorderWidthValue;
  borderLeftWidth?: BorderWidthValue;
  borderTopColor?: string;
  borderRightColor?: string;
  borderBottomColor?: string;
  borderLeftColor?: string;
}
```

---

## 4. Zachowanie

### 4.1 Zachowanie border w CSS

| Właściwość | Zachowanie |
|-----------|-----------|
| `border-style: solid` | Linia ciągła |
| `border-style: dashed` | Linia przerywana (prostokąty) |
| `border-style: dotted` | Linia kropkowana (okręgi) |
| `border-width: Xpx` | Grubość obramowania w pikselach |
| `border-color: #color` | Kolor obramowania |

### 4.2 Relacje między właściwościami

- Wszystkie 3 właściwości są niezależne — można ustawić dowolną kombinację.
- Jeśli `borderStyle` nie jest ustawione, przeglądarka nie renderuje obramowania (domyślnie `none`).
- Jeśli `borderWidth` nie jest ustawione, przeglądarka używa wartości `medium` (~3px) — ale tylko gdy `borderStyle` jest ustawiony.
- Jeśli `borderColor` nie jest ustawione, przeglądarka używa wartości `currentcolor`.

### 4.3 Zasady widoczności w Inspectorze

| Warunek | Co pokazać |
|---------|-----------|
| Zawsze | Pole `borderStyle` (select) |
| Gdy `borderStyle` jest ustawiony | Pola `borderWidth` i `borderColor` |
| Always visible for MVP | Wszystkie 3 pola jako grupa "Border" |

### 4.4 Smart CSS output

Analogicznie do Overflow, Border nie powinien emitować CSS dla wartości domyślnych:

- Jeśli `borderStyle` jest `undefined` → nie generuj żadnego CSS border
- Jeśli `borderWidth` jest `undefined` → nie generuj `border-width`
- Jeśli `borderColor` jest `undefined` → nie generuj `border-color`

---

## 5. Walidacja

### 5.1 Reguły walidacji

```typescript
const VALID_BORDER_STYLES: ReadonlyArray<BorderStyle> = ['solid', 'dashed', 'dotted'];

function validateBorderStyle(value: unknown): boolean {
  return VALID_BORDER_STYLES.includes(value as BorderStyle);
}

function validateBorderWidthValue(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'borderWidth', message: 'Border width must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const w = value as Record<string, unknown>;

  if (typeof w.value !== 'number' || isNaN(w.value as number)) {
    errors.push({ key: 'borderWidth.value', message: 'Border width value must be a number', code: 'INVALID_FORMAT' });
  } else if ((w.value as number) < 0) {
    errors.push({ key: 'borderWidth.value', message: 'Border width must be ≥ 0', code: 'MIN_VALUE' });
  } else if ((w.value as number) > 100) {
    errors.push({ key: 'borderWidth.value', message: 'Border width must be ≤ 100', code: 'MAX_VALUE' });
  }

  if (w.unit !== 'px') {
    errors.push({ key: 'borderWidth.unit', message: 'Border width unit must be "px"', code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}

function validateBorderColor(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== 'string') return false;
  // Accept hex, rgb, rgba, hsl, hsla, named colors
  return value.trim().length > 0;
}

function validateBorderProps(props: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!props || typeof props !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'border', message: 'Border props must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const p = props as Record<string, unknown>;

  if (p.borderStyle !== undefined && !validateBorderStyle(p.borderStyle)) {
    errors.push({
      key: 'borderStyle',
      message: `Invalid border style: "${String(p.borderStyle)}". Must be one of: solid, dashed, dotted`,
      code: 'INVALID_OPTION',
    });
  }

  if (p.borderWidth !== undefined) {
    errors.push(...validateBorderWidthValue(p.borderWidth).errors);
  }

  if (p.borderColor !== undefined && !validateBorderColor(p.borderColor)) {
    errors.push({
      key: 'borderColor',
      message: 'Invalid border color. Must be a non-empty string',
      code: 'INVALID_FORMAT',
    });
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 6. CSS Mapping

### 6.1 Funkcja mapująca

```typescript
/**
 * Convert BorderProps to CSS object.
 * Only includes properties that are defined.
 * Does NOT emit CSS for undefined properties.
 */
function borderToCSS(props: BorderProps): Record<string, string> {
  const css: Record<string, string> = {};

  if (props.borderStyle) {
    css.borderStyle = props.borderStyle;
  }

  if (props.borderWidth) {
    css.borderWidth = `${props.borderWidth.value}${props.borderWidth.unit}`;
  }

  if (props.borderColor) {
    css.borderColor = props.borderColor;
  }

  return css;
}
```

### 6.2 Przykłady mapowania

| BorderProps | CSS Output |
|------------|-----------|
| `{ borderStyle: 'solid', borderWidth: { value: 1, unit: 'px' }, borderColor: '#000' }` | `border-style: solid; border-width: 1px; border-color: #000` |
| `{ borderStyle: 'dashed', borderWidth: { value: 2, unit: 'px' } }` | `border-style: dashed; border-width: 2px` |
| `{ borderColor: 'red' }` | `border-color: red` |
| `{ borderStyle: 'solid' }` | `border-style: solid` |
| `{}` | `{}` (empty — no CSS) |

---

## 7. Inspector UX

### 7.1 Sekcja w Inspectorze

Zgodnie z ADR-VISUAL-001, Border pojawi się w kategorii **Visual**:

```
Inspector
├── Layout (existing)
├── Grid (existing)
└── Visual (NEW)
    ├── Border
    │   ├── Style  [select: solid | dashed | dotted]
    │   ├── Width  [number + px unit]
    │   └── Color  [color picker]
    └── Radius (Sprint 5B.4)
```

### 7.2 Schema dla Border

```typescript
// Border Style
{
  key: 'borderStyle',
  label: 'Style',
  type: 'select',
  required: false,
  group: 'visual',
  options: [
    { label: 'None', value: undefined },
    { label: 'Solid', value: 'solid' },
    { label: 'Dashed', value: 'dashed' },
    { label: 'Dotted', value: 'dotted' },
  ],
  metadata: { icon: 'border-style', tags: ['border', 'visual'] },
}

// Border Width
{
  key: 'borderWidth',
  label: 'Width',
  type: 'border-width',
  required: false,
  group: 'visual',
  defaultValue: { value: 1, unit: 'px' },
  metadata: { icon: 'border-width', tags: ['border', 'visual'] },
}

// Border Color
{
  key: 'borderColor',
  label: 'Color',
  type: 'color',
  required: false,
  group: 'visual',
  defaultValue: '#000000',
  metadata: { icon: 'border-color', tags: ['border', 'visual'] },
}
```

---

## 8. Zależności

| Zależność | Typ | Opis |
|-----------|-----|------|
| LayoutTypes.ts | Luźna | Współdzielone typy ValidationError, ValidationResult |
| PropertyRegistry | Silna | Rejestracja typu 'border-width' |
| InspectorPanel | Luźna | Dispatch przez UPDATE_PROPS |
| ADR-VISUAL-001 | Architektoniczna | Kategoria Visual dla Border i Radius |
| DisplayMode | Brak | Border działa dla każdego display mode |

---

## 9. Kryteria akceptacji (DoD)

- [ ] Specyfikacja — niniejszy dokument
- [ ] Contracts — `50_BORDER_COMMANDS.md`
- [ ] Domain Model — `BorderTypes.ts` z BorderStyle, BorderWidthValue, BorderProps
- [ ] Core Implementation — `borderToCSS()`, `validateBorder()`, `validateBorderProps()`
- [ ] Registry — rejestracja typu 'border-width' w propertyFieldRegistry.tsx
- [ ] React UI — `BorderField.tsx` z obsługą Style, Width, Color
- [ ] Testy jednostkowe — walidacja, borderToCSS, registry
- [ ] Integration Review — `53_BORDER_INTEGRATION_REVIEW.md`
- [ ] Architecture Freeze — `54_BORDER_ARCHITECTURE_FREEZE.md`

---

## 10. Decision Records

### DR-BORDER-001: Border jako osobny model domenowy (BorderTypes.ts)
**Status:** Proposed  
**Uzasadnienie:** Zgodnie z ADR-VISUAL-001, Border i Radius pozostają niezależnymi subsystemami z własnymi modelami domenowymi, ale są prezentowane w jednej kategorii Visual w Inspectorze.

### DR-BORDER-002: MVP ograniczony do jednolitego border
**Status:** Proposed  
**Uzasadnienie:** Analogicznie do Overflow — najpierw prosty, kompletny przepływ (uniform border), a dopiero później per-edge.

### DR-BORDER-003: UPDATE_PROPS zamiast SET_BORDER
**Status:** Proposed  
**Uzasadnienie:** Zgodne z DR-CMD-001. Dedykowana komenda nie wnosi wartości dla 3 prostych właściwości.

---

```text
Sprint 5B.3 — Border Property Specification
Status: Draft
Data: 2025

Podpis: ________________________
```

