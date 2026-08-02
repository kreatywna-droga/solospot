# C16.32 — Responsive Value Model

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 32_RESPONSIVE_VALUE_MODEL.md  
> **Status:** Draft  
> **Zależności:** 12_RESPONSIVE_ENGINE.md, 31_LAYOUT_PROPERTY_SPECIFICATION.md, 07_INSPECTOR.md

---

## 1. Cel

Zdefiniowanie modelu danych dla responsywnych wartości właściwości layoutu. Ten dokument określa:

- Jak przechowywane są wartości per-breakpoint
- Jak działa dziedziczenie i fallback
- Jak serializować i deserializować wartości
- Jak wartości są eksportowane do CSS (media queries)
- Jak UI Inspectora prezentuje wartości responsywne

---

## 2. Założenia architektoniczne

### 2.1 Desktop-first

Studio przyjmuje strategię **desktop-first**. Oznacza to:

| Breakpoint | Status | Opis |
|-----------|--------|------|
| DESKTOP (1280px) | **Base** — zawsze wymagana | Wartość domyślna, punkt startowy |
| TABLET (768px) | Override — opcjonalny | Nadpisuje desktop, jeśli zdefiniowany |
| MOBILE (375px) | Override — opcjonalny | Nadpisuje tablet → desktop, jeśli zdefiniowany |

### 2.2 Breakpoint hierarchy

```
DESKTOP  (base, always required)
    ↓ fallback
TABLET   (optional override)
    ↓ fallback
MOBILE   (optional override)
```

### 2.3 Inheritance rule

```typescript
function getEffectiveValue<T>(
  responsiveValue: ResponsiveValue<T>,
  breakpoint: Breakpoint
): T {
  switch (breakpoint) {
    case 'DESKTOP':
      return responsiveValue.desktop;
    case 'TABLET':
      return responsiveValue.tablet ?? responsiveValue.desktop;
    case 'MOBILE':
      return responsiveValue.mobile ?? responsiveValue.tablet ?? responsiveValue.desktop;
  }
}
```

Jeśli `tablet` nie jest zdefiniowany → użyj `desktop`.
Jeśli `mobile` nie jest zdefiniowany → użyj `tablet`, a jeśli ten też nie istnieje → `desktop`.

---

## 3. Model danych

### 3.1 Generyczny typ responsywny

```typescript
/**
 * ResponsiveValue<T> — generic wrapper for per-breakpoint values.
 *
 * T can be any serializable type: number, string, SpacingValue, SizeValue, etc.
 *
 * RULES:
 *   - desktop is ALWAYS required
 *   - tablet and mobile are optional overrides
 *   - undefined = inherit from higher breakpoint
 */
interface ResponsiveValue<T> {
  readonly desktop: T;
  readonly tablet?: T;
  readonly mobile?: T;
}
```

### 3.2 Responsywne właściwości layoutu

```typescript
interface ResponsiveLayoutProps {
  // Display & Flex
  display?: ResponsiveValue<DisplayMode>;
  flexDirection?: ResponsiveValue<FlexDirection>;
  flexWrap?: ResponsiveValue<FlexWrap>;
  justifyContent?: ResponsiveValue<JustifyContent>;
  alignItems?: ResponsiveValue<AlignItems>;
  alignContent?: ResponsiveValue<AlignContent>;
  gap?: ResponsiveValue<number>;

  // Spacing
  padding?: ResponsiveValue<SpacingValue>;
  margin?: ResponsiveValue<SpacingValue>;

  // Size
  width?: ResponsiveValue<SizeValue>;
  height?: ResponsiveValue<SizeValue>;
  minWidth?: ResponsiveValue<SizeValue>;
  minHeight?: ResponsiveValue<SizeValue>;
  maxWidth?: ResponsiveValue<SizeValue>;
  maxHeight?: ResponsiveValue<SizeValue>;

  // Position
  position?: ResponsiveValue<PositionType>;
  top?: ResponsiveValue<number>;
  right?: ResponsiveValue<number>;
  bottom?: ResponsiveValue<number>;
  left?: ResponsiveValue<number>;
  zIndex?: ResponsiveValue<number>;

  // Flex child
  flex?: ResponsiveValue<number>;
  flexGrow?: ResponsiveValue<number>;
  flexShrink?: ResponsiveValue<number>;
  flexBasis?: ResponsiveValue<SizeValue>;
  alignSelf?: ResponsiveValue<AlignSelf>;
  order?: ResponsiveValue<number>;
}
```

### 3.3 Storage model (jak to jest przechowywane w BuilderDocument)

W BuilderDocument, wartości responsywne są przechowywane OSOBNO od bazowych właściwości:

```typescript
interface ResponsiveStorage {
  /**
   * Per-section, per-property, per-breakpoint overrides.
   *
   * Structure:
   *   sectionId → propName → breakpoint → value
   *
   * Only overrides are stored here.
   * If a property has no override for a given breakpoint,
   * it inherits from the higher breakpoint.
   */
  readonly overrides: Map<string, Map<string, ResponsiveValue<unknown>>>;
}
```

**Przykład w JSON:**

```json
{
  "section_responsive_overrides": {
    "sec_hero": {
      "padding": {
        "desktop": { "top": 48, "right": 48, "bottom": 48, "left": 48, "linked": true },
        "tablet": { "top": 32, "right": 32, "bottom": 32, "left": 32, "linked": true },
        "mobile": { "top": 16, "right": 16, "bottom": 16, "left": 16, "linked": true }
      },
      "flexDirection": {
        "desktop": "row",
        "mobile": "column"
      },
      "gap": {
        "desktop": 24,
        "tablet": 16,
        "mobile": 12
      }
    },
    "sec_feature_1": {
      "width": {
        "desktop": { "value": 33, "unit": "%" },
        "tablet": { "value": 50, "unit": "%" },
        "mobile": { "value": 100, "unit": "%" }
      }
    }
  }
}
```

---

## 4. Operacje na modelu

### 4.1 Set override

```typescript
/**
 * Set a responsive override for a property at a specific breakpoint.
 */
function setResponsiveOverride<T>(
  storage: ResponsiveStorage,
  sectionId: string,
  propName: string,
  breakpoint: Breakpoint,
  value: T
): ResponsiveStorage {
  // Clone to maintain immutability
  const newOverrides = new Map(storage.overrides);
  let sectionOverrides = newOverrides.get(sectionId);

  if (!sectionOverrides) {
    sectionOverrides = new Map();
    newOverrides.set(sectionId, sectionOverrides);
  }

  let propOverrides = sectionOverrides.get(propName) as ResponsiveValue<T> | undefined;
  if (!propOverrides) {
    propOverrides = { desktop: value };  // first override always sets desktop
  }

  const updatedPropOverrides = {
    ...propOverrides,
    [breakpoint.toLowerCase()]: value,
  };

  // Update section overrides
  const newSectionOverrides = new Map(sectionOverrides);
  newSectionOverrides.set(propName, updatedPropOverrides);
  newOverrides.set(sectionId, newSectionOverrides);

  return { overrides: newOverrides };
}
```

### 4.2 Remove override

```typescript
/**
 * Remove a responsive override for a property at a specific breakpoint.
 * If override was the only desktop value, removes the entire property entry.
 */
function removeResponsiveOverride(
  storage: ResponsiveStorage,
  sectionId: string,
  propName: string,
  breakpoint: Breakpoint
): ResponsiveStorage {
  const newOverrides = new Map(storage.overrides);
  const sectionOverrides = newOverrides.get(sectionId);
  if (!sectionOverrides) return storage;

  const propOverrides = sectionOverrides.get(propName);
  if (!propOverrides) return storage;

  const newPropOverrides = { ...propOverrides };
  delete newPropOverrides[breakpoint.toLowerCase() as keyof ResponsiveValue<unknown>];

  // If no overrides left for this property, remove the entry entirely
  const newSectionOverrides = new Map(sectionOverrides);
  if (Object.keys(newPropOverrides).length === 0) {
    newSectionOverrides.delete(propName);
  } else {
    newSectionOverrides.set(propName, newPropOverrides);
  }

  newOverrides.set(sectionId, newSectionOverrides);
  return { overrides: newOverrides };
}
```

### 4.3 Get effective value (z uwzględnieniem dziedziczenia)

```typescript
/**
 * Get the effective value for a property at a given breakpoint,
 * respecting the inheritance chain.
 */
function getEffectiveValue<T>(
  storage: ResponsiveStorage,
  sectionId: string,
  propName: string,
  breakpoint: Breakpoint,
  baseValue: T
): T {
  const sectionOverrides = storage.overrides.get(sectionId);
  if (!sectionOverrides) return baseValue;

  const propOverrides = sectionOverrides.get(propName) as ResponsiveValue<T> | undefined;
  if (!propOverrides) return baseValue;

  switch (breakpoint) {
    case 'DESKTOP':
      return propOverrides.desktop ?? baseValue;
    case 'TABLET':
      return propOverrides.tablet ?? propOverrides.desktop ?? baseValue;
    case 'MOBILE':
      return propOverrides.mobile ?? propOverrides.tablet ?? propOverrides.desktop ?? baseValue;
  }
}
```

### 4.4 Has override (dla UI)

```typescript
/**
 * Check if a property has an explicit override at a given breakpoint.
 * Used by UI to show/hide "reset" button and indicator badges.
 */
function hasOverride(
  storage: ResponsiveStorage,
  sectionId: string,
  propName: string,
  breakpoint: Breakpoint
): boolean {
  return storage.overrides
    .get(sectionId)
    ?.get(propName)
    ?.[breakpoint.toLowerCase() as keyof ResponsiveValue<unknown>] !== undefined;
}
```

---

## 5. Serializacja

### 5.1 Zapis w BuilderDocument

W BuilderDocument, wartości responsywne są przechowywane jako osobna sekcja na poziomie dokumentu:

```typescript
interface BuilderDocument {
  // ... existing fields ...
  responsiveOverrides: Record<string, Record<string, Record<string, unknown>>>;
  //   ↑ sectionId    ↑ propName     ↑ breakpoint  ↑ value
}
```

**Przykład:**

```json
{
  "id": "store_abc",
  "version": 42,
  "responsiveOverrides": {
    "sec_hero": {
      "padding": {
        "desktop": { "top": 48, "right": 48, "bottom": 48, "left": 48, "linked": true },
        "tablet": { "top": 32, "right": 32, "bottom": 32, "left": 32, "linked": true },
        "mobile": { "top": 16, "right": 16, "bottom": 16, "left": 16, "linked": true }
      },
      "flexDirection": {
        "desktop": "row",
        "mobile": "column"
      }
    }
  }
}
```

### 5.2 Eksport do CompiledDocument

Podczas kompilacji, wartości responsywne są rozwijane do osobnych właściwości z sufiksem breakpointa lub do media queries:

```typescript
interface CompiledResponsiveProps {
  // Base (desktop) values
  paddingTop: string;
  // ... other props ...

  // Tablet overrides
  paddingTopTablet?: string;
  flexDirectionTablet?: string;

  // Mobile overrides
  paddingTopMobile?: string;
  flexDirectionMobile?: string;
}
```

### 5.3 Eksport do CSS

```typescript
function generateResponsiveCSS(
  props: Record<string, string>,
  responsiveOverrides: Record<string, Record<string, string>>,
  breakpoints: BreakpointConfig[]
): string {
  let css = '';

  // Base styles (desktop)
  css += `.section {\n`;
  for (const [prop, value] of Object.entries(props)) {
    css += `  ${kebabCase(prop)}: ${value};\n`;
  }
  css += `}\n\n`;

  // Tablet
  const tabletBp = breakpoints.find(b => b.name === 'TABLET');
  if (tabletBp && responsiveOverrides.tablet) {
    css += `@media (max-width: ${tabletBp.maxWidth}px) {\n`;
    css += `  .section {\n`;
    for (const [prop, value] of Object.entries(responsiveOverrides.tablet)) {
      css += `    ${kebabCase(prop)}: ${value};\n`;
    }
    css += `  }\n`;
    css += `}\n\n`;
  }

  // Mobile
  const mobileBp = breakpoints.find(b => b.name === 'MOBILE');
  if (mobileBp && responsiveOverrides.mobile) {
    css += `@media (max-width: ${mobileBp.maxWidth}px) {\n`;
    css += `  .section {\n`;
    for (const [prop, value] of Object.entries(responsiveOverrides.mobile)) {
      css += `    ${kebabCase(prop)}: ${value};\n`;
    }
    css += `  }\n`;
    css += `}\n`;
  }

  return css;
}
```

---

## 6. UI Inspectora — zachowanie

### 6.1 Breakpoint switcher

Breakpoint switcher znajduje się w headerze InspectorPanel. Zmiana breakpointa:

1. Ustawia `activeBreakpoint` w CanvasState
2. Przeładowuje wartości w Inspectorze dla wybranego breakpointa
3. Zmienia viewport w preview (jeśli widok symultaniczny nie jest aktywny)

### 6.2 Pole responsywne

Każde pole, które ma `responsive: true` w PropSchema, wyświetla się inaczej:

#### Wartość bazowa (desktop)

```
[── Padding ────────────────────────────]
[ 48 ] [ 48 ] [ 48 ] [ 48 ]  [🔗]  px
                                      ● D
```

#### Z overridem (tablet)

```
[── Padding ────────────────────────────]
[ 32 ] [ 32 ] [ 32 ] [ 32 ]  [🔗]  px  ← override value
                                      ● D  ◉ T  ○ M
                                        ↑ override indicator
```

#### Z overridem (mobile)

```
[── Padding ────────────────────────────]
[ 16 ] [ 16 ] [ 16 ] [ 16 ]  [🔗]  px  ← override value
                                      ○ D  ○ T  ◉ M
```

### 6.3 Przycisk "Add Override"

Gdy użytkownik przełącza na tablet/mobile i wartość nie ma override:

```
[── Padding ────────────────────────────]
[ 48 ] [ 48 ] [ 48 ] [ 48 ]  [🔗]  px  ← inherited from desktop (wyszarzone)
                                      ● D  ○ T  ○ M
                                      [+ Add Override]
```

Kliknięcie "Add Override":
1. Kopiuje obecną wartość (inheritowaną)
2. Tworzy override w `responsiveOverrides`
3. Pole staje się edytowalne

### 6.4 Przycisk "Reset"

Gdy wartość ma override i jest aktywna:

```
[── Padding ────────────────────────────]
[ 32 ] [ 32 ] [ 32 ] [ 32 ]  [🔗]  px  ← override value
                                      ● D  ◉ T  ○ M
                                      [↺ Reset to Desktop]
```

Kliknięcie "Reset":
1. Usuwa override dla tego breakpointa
2. Pole pokazuje inheritowaną wartość (wyszarzone)
3. UI wraca do stanu "Add Override"

### 6.5 Responsive indicator badge

Każda kategoria (group) w Inspectorze pokazuje badge z informacją o override'ach:

```
▼ SPACING [T:2 M:1]
  ┌──────────────────────────────┐
  │ Padding: [48] [48] [48] [48] │
  │ Margin:  [0]  [0]  [0]  [0]  │
  └──────────────────────────────┘

  [T:2] = 2 properties have tablet overrides
  [M:1] = 1 property has mobile override
```

---

## 7. Integracja z Runtime

### 7.1 Preview — zmiana breakpointa

Gdy użytkownik zmienia breakpoint w Builderze:

```typescript
function onBreakpointChange(breakpoint: Breakpoint) {
  // 1. Update CanvasState
  dispatch({ type: 'CANVAS', action: { type: 'SET_BREAKPOINT', breakpoint } });

  // 2. Update Inspector (re-render fields with effective values)
  inspectorRef.current?.refresh();

  // 3. Resize preview iframe
  const viewport = VIEWPORT_PRESETS[breakpoint];
  previewFrame.style.width = `${viewport.width}px`;

  // 4. Send viewport change to PreviewRuntime
  previewChannel.send(createViewportChange(viewport.width, breakpoint));

  // 5. Update PreviewRuntime with effective props for this breakpoint
  const effectiveProps = computeEffectiveProps(document, breakpoint);
  previewChannel.send(createDocumentUpdate(compile(document)));
}
```

### 7.2 PreviewRuntime — odbiór

```typescript
// W PreviewRuntime (iframe)
function onViewportChange(width: number, label: ViewportLabel) {
  // Zmiana viewportu → przeliczenie layoutu
  // Niektóre właściwości CSS mogą być inne (media queries)
  // Jeśli używamy CSS custom properties, wystarczy zmienić :root
  document.documentElement.style.setProperty('--viewport', label);
}
```

---

## 8. Responsywność układu (Layout Adaptation)

Oprócz per-property overrides, niektóre elementy layoutu mogą być automatycznie adaptowane:

### 8.1 Stack on Breakpoint

```typescript
interface ResponsiveLayoutBehavior {
  /** Auto-stack children on this breakpoint (flex → column) */
  stackOnBreakpoint: 'NONE' | 'TABLET' | 'MOBILE';
  /** Reverse order when stacked */
  reverseOnStack: boolean;
}
```

### 8.2 Hide on Breakpoint

```typescript
interface ResponsiveVisibility {
  hideOnDesktop: boolean;
  hideOnTablet: boolean;
  hideOnMobile: boolean;
}
```

---

## 9. Walidacja modelu

### 9.1 Reguły

| Warunek | Reakcja |
|---------|---------|
| `desktop` brakuje | Błąd — desktop jest wymagany |
| Wartość override ma inny typ niż desktop | Błąd — typ musi być zgodny |
| Override dla breakpointa, który nie istnieje | Ignorowane |
| Zbyt wiele override'ów (>3 na właściwość) | Ostrzeżenie (nie błąd) |

### 9.2 Przykład błędnego modelu

```json
{
  "sec_hero": {
    "padding": {
      "desktop": { "top": 48, "right": 48, "bottom": 48, "left": 48, "linked": true },
      "tablet": "32px"   // ← BŁĄD: inny typ (string zamiast SpacingValue)
    }
  }
}
```

---

## 10. Performance considerations

### 10.1 Optymalizacja przechowywania

- Override'y są przechowywane tylko dla właściwości, które rzeczywiście mają zmienioną wartość
- Jeśli `tablet === desktop`, nie zapisujemy override
- Przy kompilacji porównujemy i pomijamy zbędne override'y

### 10.2 Optymalizacja CSS

```css
/* Zamiast generować media query dla każdej właściwości osobno: */

/* ❌ SUBOPTIMAL — jedna media query per właściwość */
@media (max-width: 768px) { .section { padding: 32px; } }
@media (max-width: 768px) { .section { gap: 16px; } }

/* ✅ OPTIMAL — grupowanie wszystkich override'ów w jedną media query */
@media (max-width: 768px) {
  .section {
    padding: 32px;
    gap: 16px;
    flex-direction: column;
  }
}
```

---

## 11. Decision Records

### DR-RESP-001: Desktop-first
**Status:** Approved  
**Uzasadnienie:** Studio jest narzędziem desktopowym. Większość użytkowników zaczyna od desktopu i dostosowuje na mobile.

### DR-RESP-002: Override storage osobno od base props
**Status:** Approved  
**Uzasadnienie:** Oddzielenie override'ów od bazowych właściwości pozwala na:
- Czystą separację (base props nie są zanieczyszczone breakpointami)
- Łatwe usuwanie override'ów (wystarczy usunąć z mapy)
- Wydajniejszy diff (zmiana override nie dotyka base props)

### DR-RESP-003: Tylko 3 breakpointy
**Status:** Approved  
**Uzasadnienie:** DESKTOP + TABLET + MOBILE pokrywa 99% przypadków użycia. Dodatkowe breakpointy (XL, SM) mogą być dodane później, ale na razie nie są potrzebne.

### DR-RESP-004: Brak wartości override = inherit
**Status:** Approved  
**Uzasadnienie:** `undefined` w override oznacza "nie zmieniaj, użyj wartości z wyższego breakpointa". To pozwala na stopniowe dodawanie override'ów tylko tam, gdzie są potrzebne.

