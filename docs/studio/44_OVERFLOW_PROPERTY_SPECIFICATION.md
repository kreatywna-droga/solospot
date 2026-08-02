# Sprint 5B.2 — Overflow Property Specification

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 44_OVERFLOW_PROPERTY_SPECIFICATION.md  
> **Status:** Draft — Sprint 5B.2  
> **Sprint:** 5B.2 — Overflow  
> **Zależności:** 31_LAYOUT_PROPERTY_SPECIFICATION.md, 33_LAYOUT_COMMANDS.md, LayoutTypes.ts
>
> **Proces:** Faza 1 z 8 — Specification

---

## 1. Cel

Niniejszy dokument definiuje **Overflow** — subsystem odpowiedzialny za modelowanie, walidację i mapowanie na CSS właściwości `overflow`, `overflow-x` i `overflow-y`.

Overflow jest **pierwszym małym subsystemem** rozwijanym w ramach zweryfikowanego 8-fazowego procesu inżynierskiego. Jego głównym celem jest potwierdzenie, że proces jest efektywny również dla subsystemów o małym zakresie — nie tylko dla dużych, jak Layout Engine czy Grid Engine.

### 1.1 Cel Sprintu 5B.2

> **Potwierdzić, że proces 8-fazowy jest efektywny dla małych subsystemów.**

Oraz:

> **Dostarczyć pełny przepływ: Inspector → Command → Builder Core → Runtime → Canvas Preview dla właściwości overflow.**

---

## 2. Zakres MVP

### 2.1 Właściwości objęte

| # | Właściwość (Builder) | CSS Property | Typ | Zakres |
|---|---------------------|--------------|-----|--------|
| 1 | `overflow` | `overflow` | `OverflowMode` | visible, hidden, scroll, auto |
| 2 | `overflowX` | `overflow-x` | `OverflowMode` | visible, hidden, scroll, auto |
| 3 | `overflowY` | `overflow-y` | `OverflowMode` | visible, hidden, scroll, auto |

### 2.2 Co NIE wchodzi w zakres MVP

| Funkcja | Powód | Planowany sprint |
|---------|-------|:----------------:|
| `overflow: clip` | Rzadko używane, dodaje complexity | Późniejszy |
| `overflow: overlay` | Deprecated w WebKit | Nie planowane |
| `text-overflow: ellipsis` | Należy do Typography, nie Overflow | Sprint 7 (Inspector 2.0) |
| Wizualne overlay "overflow-hidden" na Canvasie | Wymaga Canvas Completion | Sprint 5C |
| Animowany overflow toggle | Feature request | Późniejszy |

---

## 3. Model domenowy

### 3.1 Stan istniejący

Model domenowy dla overflow został już zdefiniowany w `LayoutTypes.ts` (Sprint 5A) w sekcji 3.5 `31_LAYOUT_PROPERTY_SPECIFICATION.md`:

```typescript
// ---- Istniejący model (LayoutTypes.ts) ----

export type OverflowMode = 'visible' | 'hidden' | 'scroll' | 'auto';

export interface OverflowProps {
  overflow: OverflowMode;      // default: 'visible'
  overflowX?: OverflowMode;    // default: undefined (→ overflow)
  overflowY?: OverflowMode;    // default: undefined (→ overflow)
}
```

### 3.2 Weryfikacja kompletności modelu

| Aspekt | Status | Uwagi |
|--------|:------:|-------|
| Typ `OverflowMode` | ✅ Kompletny | 4 wartości CSS: visible, hidden, scroll, auto |
| Interfejs `OverflowProps` | ✅ Kompletny | overflow + overflowX + overflowY |
| Wartość domyślna | ✅ Zdefiniowana | `'visible'` — zgodne z CSS spec |
| Relacja overflowX/overflowY → overflow | ✅ Jasna | Jeśli osobne osie nie są ustawione, używana jest wartość `overflow` dla obu osi |
| Serializowalność JSON | ✅ | Plain object, bez funkcji, bez cyklicznych referencji |
| Gotowość na ResponsiveValue\<T\> | ✅ | Każde pole może być opakowane w ResponsiveValue |
| CSS mapping | ⏳ **Do dodania** | `overflowToCSS()` |
| Walidacja | ⏳ **Do dodania** | `validateOverflow()` |

### 3.3 Decyzja: Brak zmian w modelu

Model jest kompletny i nie wymaga zmian. Sprint 5B.2 skupi się na:

1. Dodaniu `overflowToCSS()` — pure function mapująca OverflowProps → CSS
2. Dodaniu `validateOverflow()` — walidacja wartości overflow
3. Rejestracji w PropertyRegistry
4. Implementacji OverflowField.tsx
5. Testach jednostkowych

---

## 4. Zachowanie

### 4.1 Zachowanie overflow w przeglądarce

| Wartość | Zachowanie |
|---------|-----------|
| `visible` | Treść nie jest ucinana. Może wykraczać poza kontener. **Domyślne.** |
| `hidden` | Treść wykraczająca poza kontener jest ucinana. Paski przewijania nie są pokazywane. |
| `scroll` | Paski przewijania są zawsze widoczne (nawet jeśli treść nie wymaga przewijania). |
| `auto` | Paski przewijania pojawiają się tylko gdy treść wykracza poza kontener. |

### 4.2 Relacja overflow ↔ overflowX / overflowY

- Jeśli `overflowX` i `overflowY` są `undefined`, używana jest wartość `overflow` dla obu osi.
- Jeśli tylko jedna oś jest ustawiona (np. `overflowX: 'scroll'`), druga oś przyjmuje wartość `overflow`.
- Zgodnie z CSS spec: ustawienie `overflow` jest shorthandem dla `overflow-x` i `overflow-y`.
- Jeśli obie osie są ustawione, `overflow` jest ignorowane na korzyść `overflowX` i `overflowY`.

### 4.3 Zasady widoczności w Inspectorze

| Warunek | Co pokazać |
|---------|-----------|
| Zawsze | Pole `overflow` (select z 4 opcjami) |
| Gdy `overflow` nie jest `visible` | Pokaż expandable section z `overflowX` i `overflowY` |
| Gdy `overflowX` lub `overflowY` różne od `overflow` | Pokaż opcję "Reset to overflow" |

### 4.4 Interakcje z Canvas

Ponieważ Canvas (Sprint 4) jest w trakcie implementacji, interakcje są ograniczone do standardowego przepływu CSS:

| Interakcja | Opis | Status |
|-----------|------|:------:|
| Change → CSS update | Zmiana overflow w Inspectorze → natychmiastowa aktualizacja CSS w Canvasie | ✅ Automatyczne przez runtime |
| Canvas overlay | Wskazanie na Canvasie, że element ma `overflow: hidden` (wizualna ikona) | ⏳ Sprint 5C |
| Scrollable preview | Dla `overflow: scroll`/`auto` — Canvas powinien pozwolić na przewijanie w preview | ⏳ Sprint 5C |

---

## 5. Walidacja

### 5.1 Reguły walidacji

```typescript
function validateOverflow(value: OverflowMode): boolean {
  return ['visible', 'hidden', 'scroll', 'auto'].includes(value);
}

function validateOverflowProps(props: OverflowProps): ValidationResult {
  const errors: ValidationError[] = [];

  if (!validateOverflow(props.overflow)) {
    errors.push({
      key: 'overflow',
      message: `Invalid overflow value: ${props.overflow}. Must be one of: visible, hidden, scroll, auto`,
      code: 'INVALID_OPTION',
    });
  }

  if (props.overflowX !== undefined && !validateOverflow(props.overflowX)) {
    errors.push({
      key: 'overflowX',
      message: `Invalid overflow-x value: ${props.overflowX}. Must be one of: visible, hidden, scroll, auto`,
      code: 'INVALID_OPTION',
    });
  }

  if (props.overflowY !== undefined && !validateOverflow(props.overflowY)) {
    errors.push({
      key: 'overflowY',
      message: `Invalid overflow-y value: ${props.overflowY}. Must be one of: visible, hidden, scroll, auto`,
      code: 'INVALID_OPTION',
    });
  }

  return { valid: errors.length === 0, errors };
}
```

### 5.2 Scenariusze walidacji

| Scenariusz | Oczekiwany wynik |
|------------|:----------------:|
| `overflow: 'visible'` | ✅ Poprawne |
| `overflow: 'hidden'` | ✅ Poprawne |
| `overflow: 'scroll'` | ✅ Poprawne |
| `overflow: 'auto'` | ✅ Poprawne |
| `overflow: 'invalid'` | ❌ Błąd INVALID_OPTION |
| `overflow: undefined` | ❌ Błąd — wymagane |
| `overflow: 'clip'` | ❌ Błąd — poza zakresem MVP |
| `overflowX: 'scroll'`, `overflow: 'visible'` | ✅ Poprawne (overflowX override) |
| `overflowX: 'invalid'` | ❌ Błąd INVALID_OPTION |

---

## 6. CSS Mapping

### 6.1 Funkcja mapująca

```typescript
/**
 * Convert OverflowProps to CSS object.
 * 
 * CSS spec:
 * - overflow jest shorthand dla overflow-x i overflow-y
 * - Jeśli overflowX/overflowY są undefined, używana jest wartość overflow
 * - Jeśli obie osie są ustawione, overflow jest ignorowane na korzyść overflowX/overflowY
 */
function overflowToCSS(props: OverflowProps): Record<string, string> {
  const css: Record<string, string> = {};

  const x = props.overflowX ?? props.overflow;
  const y = props.overflowY ?? props.overflow;

  if (x === y) {
    // Krótka forma — gdy obie osie mają tę samą wartość
    css.overflow = x;
  } else {
    // Długa forma — osobne wartości dla każdej osi
    css.overflowX = x;
    css.overflowY = y;
  }

  return css;
}
```

### 6.2 Przykłady mapowania

| OverflowProps | CSS Output |
|--------------|-----------|
| `{ overflow: 'visible' }` | `overflow: visible` |
| `{ overflow: 'hidden' }` | `overflow: hidden` |
| `{ overflow: 'scroll', overflowX: 'auto' }` | `overflow-x: auto; overflow-y: scroll` |
| `{ overflow: 'auto', overflowY: 'hidden' }` | `overflow-x: auto; overflow-y: hidden` |
| `{ overflow: 'visible', overflowX: 'scroll' }` | `overflow-x: scroll; overflow-y: visible` |
| `{ overflow: 'hidden', overflowX: 'scroll', overflowY: 'auto' }` | `overflow-x: scroll; overflow-y: auto` |

### 6.3 Zachowanie dla wartości domyślnej

Gdy `overflow: 'visible'` (wartość domyślna w CSS), żadna właściwość overflow nie jest generowana — przeglądarka używa wartości domyślnej:

```typescript
function overflowToCSS(props: OverflowProps): Record<string, string> {
  const css: Record<string, string> = {};

  const x = props.overflowX ?? props.overflow;
  const y = props.overflowY ?? props.overflow;

  // Nie generuj CSS dla domyślnej wartości 'visible', chyba że
  // jedna z osi ma wartość inną niż visible
  if (x === 'visible' && y === 'visible') {
    return css; // pusty obiekt — domyślne zachowanie przeglądarki
  }

  if (x === y) {
    css.overflow = x;
  } else {
    css.overflowX = x;
    css.overflowY = y;
  }

  return css;
}
```

---

## 7. PropSchema (Inspector)

### 7.1 Schema dla overflow

```typescript
// Overflow — główna właściwość
{
  key: 'overflow',
  label: 'Overflow',
  type: 'overflow',            // ← custom type, rejestrowany w PropertyRegistry
  required: true,
  defaultValue: 'visible',
  group: 'layout',
  options: [
    { label: 'Visible', value: 'visible' },
    { label: 'Hidden', value: 'hidden' },
    { label: 'Scroll', value: 'scroll' },
    { label: 'Auto', value: 'auto' },
  ],
  metadata: { icon: 'maximize', tags: ['overflow', 'layout'] },
}

// Overflow X — warunkowo rozszerzone
{
  key: 'overflowX',
  label: 'Overflow X',
  type: 'overflow',            // ← ten sam custom type
  required: false,
  defaultValue: undefined,
  group: 'layout',
  options: [
    { label: 'Visible', value: 'visible' },
    { label: 'Hidden', value: 'hidden' },
    { label: 'Scroll', value: 'scroll' },
    { label: 'Auto', value: 'auto' },
  ],
  metadata: { icon: 'maximize', tags: ['overflow', 'x'] },
  visibility: { dependsOn: { key: 'overflow', value: 'visible', negate: true } },
}

// Overflow Y — warunkowo rozszerzone
{
  key: 'overflowY',
  label: 'Overflow Y',
  type: 'overflow',
  required: false,
  defaultValue: undefined,
  group: 'layout',
  options: [
    { label: 'Visible', value: 'visible' },
    { label: 'Hidden', value: 'hidden' },
    { label: 'Scroll', value: 'scroll' },
    { label: 'Auto', value: 'auto' },
  ],
  metadata: { icon: 'maximize', tags: ['overflow', 'y'] },
  visibility: { dependsOn: { key: 'overflow', value: 'visible', negate: true } },
}
```

### 7.2 Widoczność warunkowa — opis

| Warunek | overflow | overflowX | overflowY |
|---------|:--------:|:---------:|:---------:|
| Domyślnie (wszystkie visible) | ✅ Widoczne | ❌ Ukryte | ❌ Ukryte |
| overflow = 'hidden' | ✅ | ✅ Widoczne | ✅ Widoczne |
| overflow = 'scroll' | ✅ | ✅ | ✅ |
| overflow = 'auto' | ✅ | ✅ | ✅ |
| overflow = 'hidden', overflowX = 'scroll' | ✅ | ✅ (override) | ✅ (widoczne) |

---

## 8. Zależności

| Zależność | Typ | Opis |
|-----------|-----|------|
| LayoutTypes.ts | Silna | Model `OverflowMode`, `OverflowProps` już istnieje |
| LayoutTypes.ts → eksport | Silna | `index.ts` już eksportuje typy |
| PropertyRegistry | Silna | Rejestracja typu 'overflow' |
| InspectorPanel | Luźna | Dispatch przez `UPDATE_PROPS` |
| DisplayMode (Layout Engine) | Brak | Overflow nie zależy od display mode |
| Grid | Brak | Overflow działa niezależnie od grid |

### Kluczowe spostrzeżenie:

Overflow jest **w pełni niezależny** od innych subsystemów Buildera:
- Nie wymaga zmian w `LayoutTypes.ts` (model już istnieje)
- Nie wymaga zmian w `GridTypes.ts`
- Nie wymaga zmian w `BuilderCommands.ts` (używa UPDATE_PROPS)
- Działa dla każdego `display` mode (flex, grid, block, absolute)

---

## 9. Przyszłe rozszerzenia

| Obszar | Planowany sprint | Opis |
|--------|-----------------|------|
| `overflow: clip` | Późniejszy | CSS `overflow: clip` — podobny do hidden, ale bez tworzenia BFC |
| Canvas overlay | Sprint 5C | Wizualna ikona na Canvasie dla `overflow: hidden` |
| Animowany overflow | Późniejszy | Toggle overflow z animacją rozwijania |
| Text overflow | Sprint 7 | `text-overflow: ellipsis` w kategorii Typography |

---

## 10. Decision Records

### DR-OVERFLOW-001: Overflow jako osobny subsystem, nie część Layout Engine
**Status:** Proposed  
**Uzasadnienie:** Mimo że `OverflowProps` istnieją w `LayoutTypes.ts`, overflow jest logicznie niezależny od layoutu. Wydzielenie go jako osobnego subsystemu pozwala na:
- Testowanie procesu 8-fazowego na małym subsystemie
- Utrzymanie czystej separacji odpowiedzialności
- Łatwiejsze przyszłe rozszerzenia (overflow clip, text-overflow)

### DR-OVERFLOW-002: Użycie UPDATE_PROPS, a nie dedykowanej komendy
**Status:** Proposed  
**Uzasadnienie:** Overflow ma tylko 3 proste właściwości. Dedykowana komenda (SET_OVERFLOW) nie wnosi dodatkowej wartości — `UPDATE_PROPS` jest wystarczający. Zgodne z DR-CMD-001.

### DR-OVERFLOW-003: Nie generować CSS dla wartości domyślnej ('visible')
**Status:** Proposed  
**Uzasadnienie:** `overflow: visible` jest domyślną wartością w CSS. Generowanie jej niepotrzebnie zwiększa rozmiar wyjściowego CSS. Funkcja `overflowToCSS` zwraca pusty obiekt, gdy obie osie są `visible`.

---

## 11. Arkusz kontrolny (DoD Sprintu 5B.2)

- [x] Specyfikacja — niniejszy dokument
- [ ] Contracts — `45_OVERFLOW_COMMANDS.md`
- [ ] Domain Model — weryfikacja istniejącego modelu (LayoutTypes.ts)
- [ ] Core Implementation — `overflowToCSS()` + `validateOverflow()` w LayoutTypes.ts
- [ ] Testy jednostkowe — testy dla overflowToCSS + validateOverflow (w layout-types.test.ts)
- [ ] Registry — rejestracja 'overflow' w propertyFieldRegistry.tsx
- [ ] React UI — OverflowField.tsx
- [ ] Integration Review — `46_SPRINT5B2_INTEGRATION_REVIEW.md`
- [ ] Architecture Freeze — `47_OVERFLOW_ARCHITECTURE_FREEZE.md`

---

```
Sprint 5B.2 — Overflow Property Specification
Status: Draft
Data: 2025

Podpis: ________________________
```

