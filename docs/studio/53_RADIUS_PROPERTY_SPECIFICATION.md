# Sprint 5B.4 — Radius Property Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0
> **Dokument:** 53_RADIUS_PROPERTY_SPECIFICATION.md
> **Status:** Draft — Sprint 5B.4
> **Sprint:** 5B.4 — Radius
> **Zależności:** 48_ADR_VISUAL_001_BORDER_RADIUS_ARCHITECTURE.md, LayoutTypes.ts
>
> **Proces:** Faza 1 z 8 — Specification

---

## 1. Cel

Niniejszy dokument definiuje **Radius** — subsystem odpowiedzialny za modelowanie, walidację i mapowanie na CSS właściwości `border-radius` (oraz per-corner: `border-top-left-radius`, `border-top-right-radius`, `border-bottom-right-radius`, `border-bottom-left-radius`).

Radius jest drugim subsystemem w kategorii **Visual** Inspectora, zgodnie z decyzją ADR-VISUAL-001. Jest projektowany jako pełnoprawny subsystem z modelem domenowym, CSS mapping, walidacją i testami, analogicznie do Border.

### 1.1 Cel Sprintu 5B.4

> **Dostarczyć kompletny Radius Engine z obsługą border-radius w trybie uniform i per-corner.**

Oraz:

> **Potwierdzić, że proces 8-fazowy jest efektywny dla wszystkich subsystemów w kategorii Visual.**

---

## 2. Zakres MVP

### 2.1 Właściwości objęte

| # | Właściwość (Builder) | CSS Property | Typ | Zakres |
|---|---------------------|--------------|-----|--------|
| 1 | `radius` (uniform) | `border-radius` | `RadiusValue` | liczba + jednostka (px, %) |
| 2 | `topLeft` | `border-top-left-radius` | `RadiusValue` | liczba + jednostka (px, %) |
| 3 | `topRight` | `border-top-right-radius` | `RadiusValue` | liczba + jednostka (px, %) |
| 4 | `bottomRight` | `border-bottom-right-radius` | `RadiusValue` | liczba + jednostka (px, %) |
| 5 | `bottomLeft` | `border-bottom-left-radius` | `RadiusValue` | liczba + jednostka (px, %) |

### 2.2 Tryby

| Tryb | Opis | Kiedy użyć |
|------|------|------------|
| `uniform` | Jeden radius dla wszystkich 4 narożników | Domyślny, najczęstszy przypadek |
| `per-corner` | Osobny radius dla każdego narożnika | Zaawansowane kształty |

### 2.3 Co NIE wchodzi w zakres MVP

| Funkcja | Powód | Planowany sprint |
|---------|-------|:----------------:|
| `border-radius: 10px 20px` (2-value shorthand) | Rzadko używane, dodaje complexity | Późniejszy |
| `border-radius: 10px 20px 30px 40px` (4-value shorthand) | Obsługiwane przez per-corner tryb | — |
| Zaokrąglenia eliptyczne (border-radius: 10px / 20px) | Rzadko używane | Późniejszy |
| Wizualny edytor radius na Canvasie | Wymaga Canvas Completion | Sprint 5C |

---

## 3. Model domenowy

### 3.1 Proponowany model

```typescript
/**
 * Radius mode: uniform (single value) or per-corner (4 values).
 */
export type RadiusMode = 'uniform' | 'per-corner';

/**
 * CSS unit for border-radius.
 * MVP: px, %.
 */
export type RadiusUnit = 'px' | '%';

/**
 * Single radius value with numeric value and CSS unit.
 */
export interface RadiusValue {
  value: number;
  unit: RadiusUnit;
}

/**
 * Radius properties.
 *
 * In 'uniform' mode, only `radius` is used (all 4 corners).
 * In 'per-corner' mode, individual corners are used.
 * When switching between modes, preserved values carry over.
 */
export interface RadiusProps {
  mode: RadiusMode;
  radius?: RadiusValue;        // uniform value (all corners)
  topLeft?: RadiusValue;
  topRight?: RadiusValue;
  bottomRight?: RadiusValue;
  bottomLeft?: RadiusValue;
}
```

### 3.2 Weryfikacja kompletności modelu

| Aspekt | Status | Uwagi |
|--------|:------:|-------|
| Typ `RadiusMode` | ✅ Kompletny | uniform, per-corner |
| Typ `RadiusUnit` | ✅ Kompletny dla MVP | px, % |
| Interfejs `RadiusValue` | ✅ Kompletny | value + unit |
| Interfejs `RadiusProps` | ✅ Kompletny | mode + 5 pól radius |
| Wartość domyślna | ✅ | mode: 'uniform', radius: undefined |
| Serializowalność JSON | ✅ | Plain object, bez funkcji |
| Gotowość na ResponsiveValue\<T\> | ✅ | Każde pole może być opakowane |
| CSS mapping | ✅ `radiusToCSS()` | Pure function |
| Walidacja | ✅ `validateRadiusValue()`, `validateRadiusProps()` | |

### 3.3 Future: Eliptyczne zaokrąglenia

W przyszłości model może zostać rozszerzony o eliptyczne zaokrąglenia:

```typescript
// Future extension — not in MVP
export interface RadiusValue {
  valueX: number;
  valueY: number;  // osobna wartość dla osi Y (eliptyczne)
  unit: RadiusUnit;
}
```

---

## 4. Zachowanie

### 4.1 Zachowanie border-radius w CSS

| Wartość | Zachowanie |
|---------|-----------|
| `border-radius: 8px` | Jednakowe zaokrąglenie 8px na wszystkich narożnikach |
| `border-radius: 50%` | Pełne zaokrąglenie (koło/elipsa) |
| `border-radius: 0` | Brak zaokrąglenia (ostre krawędzie) |
| `border-top-left-radius: 8px` | Tylko górny-lewy narożnik |
| Mix per-corner | Każdy narożnik niezależnie |

### 4.2 Relacje między trybami

- **Tryb uniform**: `radius` jest używany dla wszystkich 4 narożników
- **Tryb per-corner**: Każdy narożnik ma własną wartość
- **Przełączanie uniform → per-corner**: Wartość `radius` kopiowana do wszystkich 4 narożników
- **Przełączanie per-corner → uniform**: Średnia wartość z 4 narożników? Albo zachowanie pierwszego narożnika jako uniform

### 4.3 Zasady widoczności w Inspectorze

| Warunek | Co pokazać |
|---------|-----------|
| Zawsze | Przełącznik trybu (Uniform / Per Corner) |
| Tryb Uniform | Pole `radius` (number + unit) |
| Tryb Per Corner | 4 pola: Top Left, Top Right, Bottom Right, Bottom Left |
| Gdy wszystkie narożniki = 0 lub undefined | Informacja "no radius" |

### 4.4 Smart CSS output

Analogicznie do Overflow i Border, Radius nie powinien emitować CSS dla wartości domyślnych:

- Jeśli `radius` jest undefined i wszystkie narożniki undefined → brak CSS
- Jeśli `radius` = 0 → nie generuj (domyślnie brak zaokrąglenia)
- Jeśli narożnik = 0 → nie generuj dla tego narożnika

---

## 5. Walidacja

### 5.1 Reguły walidacji

```typescript
const VALID_RADIUS_UNITS: ReadonlyArray<RadiusUnit> = ['px', '%'];

function validateRadiusValue(value: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!value || typeof value !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'radius', message: 'Radius value must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const r = value as Record<string, unknown>;

  if (typeof r.value !== 'number' || isNaN(r.value as number)) {
    errors.push({ key: 'radius.value', message: 'Radius value must be a number', code: 'INVALID_FORMAT' });
  } else if ((r.value as number) < 0) {
    errors.push({ key: 'radius.value', message: 'Radius must be ≥ 0', code: 'MIN_VALUE' });
  } else if ((r.value as number) > 999) {
    errors.push({ key: 'radius.value', message: 'Radius must be ≤ 999', code: 'MAX_VALUE' });
  }

  if (!VALID_RADIUS_UNITS.includes(r.unit as RadiusUnit)) {
    errors.push({ key: 'radius.unit', message: `Invalid radius unit: "${String(r.unit)}". Must be px or %`, code: 'INVALID_OPTION' });
  }

  return { valid: errors.length === 0, errors };
}

function validateRadiusProps(props: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!props || typeof props !== 'object') {
    return {
      valid: false,
      errors: [{ key: 'radius', message: 'Radius props must be an object', code: 'INVALID_FORMAT' }],
    };
  }

  const p = props as Record<string, unknown>;

  if (p.mode !== undefined && !['uniform', 'per-corner'].includes(p.mode as string)) {
    errors.push({
      key: 'mode',
      message: `Invalid radius mode: "${String(p.mode)}". Must be "uniform" or "per-corner"`,
      code: 'INVALID_OPTION',
    });
  }

  const cornerKeys = ['radius', 'topLeft', 'topRight', 'bottomRight', 'bottomLeft'];

  for (const key of cornerKeys) {
    if (p[key] !== undefined) {
      const result = validateRadiusValue(p[key]);
      if (!result.valid) {
        errors.push(...result.errors.map(e => ({
          ...e,
          key: `${key}.${e.key}`,
        })));
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 6. CSS Mapping

### 6.1 Funkcja mapująca

```typescript
function radiusToCSS(props: RadiusProps): Record<string, string> {
  const css: Record<string, string> = {};
  const { mode, radius, topLeft, topRight, bottomRight, bottomLeft } = props;

  if (mode === 'per-corner') {
    // Per-corner mode — emit individual properties
    if (topLeft && topLeft.value > 0) css.borderTopLeftRadius = `${topLeft.value}${topLeft.unit}`;
    if (topRight && topRight.value > 0) css.borderTopRightRadius = `${topRight.value}${topRight.unit}`;
    if (bottomRight && bottomRight.value > 0) css.borderBottomRightRadius = `${bottomRight.value}${bottomRight.unit}`;
    if (bottomLeft && bottomLeft.value > 0) css.borderBottomLeftRadius = `${bottomLeft.value}${bottomLeft.unit}`;
  } else {
    // Uniform mode — single radius for all corners
    if (radius && radius.value > 0) {
      css.borderRadius = `${radius.value}${radius.unit}`;
    }
  }

  return css;
}
```

### 6.2 Przykłady mapowania

| RadiusProps | CSS Output |
|------------|-----------|
| `{ mode: 'uniform', radius: { value: 8, unit: 'px' } }` | `border-radius: 8px` |
| `{ mode: 'uniform', radius: { value: 50, unit: '%' } }` | `border-radius: 50%` |
| `{ mode: 'per-corner', topLeft: { value: 8, unit: 'px' }, topRight: { value: 4, unit: 'px' } }` | `border-top-left-radius: 8px; border-top-right-radius: 4px` |
| `{ mode: 'uniform' }` (radius undefined) | `{}` (brak CSS) |
| `{ mode: 'uniform', radius: { value: 0, unit: 'px' } }` | `{}` (brak CSS — wartość domyślna) |
| `{ mode: 'per-corner', topLeft: { value: 0, unit: 'px' } }` | `{}` (brak CSS — wartość 0) |

---

## 7. Inspector UX

### 7.1 Sekcja w Inspectorze

Zgodnie z ADR-VISUAL-001, Radius pojawi się w kategorii **Visual**:

```
Inspector
├── Layout (existing)
├── Grid (existing)
└── Visual (category)
    ├── Border (existing)
    └── Radius (NEW)
        ├── [Toggle: Uniform / Per Corner]
        ├── Uniform mode:
        │   └── Radius [number + unit selector: px | %]
        └── Per Corner mode:
            ├── Top Left     [number + unit]
            ├── Top Right    [number + unit]
            ├── Bottom Right [number + unit]
            └── Bottom Left  [number + unit]
```

### 7.2 Schema dla Radius

```typescript
{
  key: 'borderRadius',
  label: 'Radius',
  type: 'radius',              // ← custom type, rejestrowany w PropertyRegistry
  required: false,
  group: 'visual',
  metadata: { icon: 'radius', tags: ['radius', 'visual', 'border'] },
}
```

---

## 8. Zależności

| Zależność | Typ | Opis |
|-----------|-----|------|
| LayoutTypes.ts | Luźna | Współdzielone typy ValidationError, ValidationResult |
| PropertyRegistry | Silna | Rejestracja typu 'radius' |
| InspectorPanel | Luźna | Dispatch przez UPDATE_PROPS |
| ADR-VISUAL-001 | Architektoniczna | Kategoria Visual dla Border i Radius |
| BorderTypes | Brak | Radius działa niezależnie od Border |
| DisplayMode | Brak | Radius działa dla każdego display mode |

---

## 9. Kryteria akceptacji (DoD)

- [ ] Specyfikacja — niniejszy dokument
- [ ] Contracts — `54_RADIUS_COMMANDS.md`
- [ ] Domain Model — `RadiusTypes.ts` z RadiusMode, RadiusUnit, RadiusValue, CornerRadii, RadiusProps
- [ ] Core Implementation — `radiusToCSS()`, `validateRadiusValue()`, `validateRadiusProps()`
- [ ] Registry — rejestracja typu 'radius' w propertyFieldRegistry.tsx
- [ ] React UI — `RadiusField.tsx` z obsługą uniform, per-corner, css preview
- [ ] Testy jednostkowe — walidacja, radiusToCSS
- [ ] Integration Review — `55_SPRINT5B4_INTEGRATION_REVIEW.md`
- [ ] Architecture Freeze — `56_RADIUS_ARCHITECTURE_FREEZE.md`

---

## 10. Decision Records

### DR-RADIUS-001: Radius jako osobny model domenowy (RadiusTypes.ts)
**Status:** Proposed
**Uzasadnienie:** Zgodnie z ADR-VISUAL-001, Border i Radius pozostają niezależnymi subsystemami z własnymi modelami domenowymi. Radius ma unikalny model (RadiusMode, RadiusUnit, per-corner) który nie współdzieli typów z Border.

### DR-RADIUS-002: Dwa tryby: uniform i per-corner
**Status:** Proposed
**Uzasadnienie:** Uniform (pojedynczy radius dla wszystkich narożników) to najczęściej używany przypadek. Per-corner (osobne wartości) to zaawansowana funkcja, ale warta włączenia w MVP ponieważ border-radius w praktyce często wymaga różnych wartości dla różnych narożników.

### DR-RADIUS-003: UPDATE_PROPS zamiast SET_RADIUS
**Status:** Proposed
**Uzasadnienie:** Zgodne z DR-CMD-001. Radius jest prostym subsystemem z maksymalnie 5 polami. Dedykowana komenda nie wnosi wartości.

### DR-RADIUS-004: Smart CSS — pomijanie wartości 0 i undefined
**Status:** Proposed
**Uzasadnienie:** `border-radius: 0` to wartość domyślna w CSS. Pomijanie jej redukuje rozmiar wyjściowego CSS i jest zgodne z podejściem Overflow i Border.

---

```text
Sprint 5B.4 — Radius Property Specification
Status: Draft
Data: 2025

Podpis: ________________________
```

