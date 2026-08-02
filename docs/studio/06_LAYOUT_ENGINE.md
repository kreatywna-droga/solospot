# C16.6 — WEB FACTOR Studio Layout Engine

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 06_LAYOUT_ENGINE.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 03_CANVAS_ENGINE.md

---

## 1. Cel

Layout Engine to najważniejszy moduł edytora. Każdy kontener na stronie może mieć zdefiniowany system layoutu, który określa jak dzieci są rozmieszczone.

**Obecnie:** LayoutEngine.ts istnieje, ale obsługuje tylko alignment (wyrównanie).
**Docelowo:** Pełny system layoutu z Flex, Grid, Stack i Absolute.

---

## 2. Display modes

Każdy kontener/section ma pole `display`:

```typescript
type DisplayMode = 'FLEX' | 'GRID' | 'STACK' | 'ABSOLUTE' | 'NONE';
```

### 2.1 Flex

```
display: flex;
flex-direction: row | column | row-reverse | column-reverse;
flex-wrap: wrap | nowrap | wrap-reverse;
justify-content: flex-start | center | flex-end | space-between | space-around | space-evenly;
align-items: flex-start | center | flex-end | stretch | baseline;
align-content: flex-start | center | flex-end | space-between | space-around | stretch;
gap: number;
```

Właściwości dziecka:
```
flex: number;
flex-grow: number;
flex-shrink: number;
flex-basis: string | number;
align-self: auto | flex-start | center | flex-end | stretch | baseline;
order: number;
```

### 2.2 Grid

```
display: grid;
grid-template-columns: string;   // "1fr 1fr 1fr" | "repeat(3, 1fr)" | "200px 1fr"
grid-template-rows: string;
grid-gap: number;
gap: number;
justify-items: start | center | end | stretch;
align-items: start | center | end | stretch;
justify-content: start | center | end | stretch | space-between | space-around | space-evenly;
align-content: start | center | end | stretch | space-between | space-around | space-evenly;
```

Właściwości dziecka:
```
grid-column: string;    // "1 / 3" | "span 2"
grid-row: string;
grid-area: string;
justify-self: start | center | end | stretch;
align-self: start | center | end | stretch;
```

### 2.3 Stack (domyślny)

```
display: block;  // lub flex-direction: column z domyślnymi ustawieniami

Layout domyślny:
- Elementy ułożone pionowo
- Każdy zajmuje 100% szerokości kontenera
- Odstępy przez margin/gap
```

### 2.4 Absolute

```
position: relative; (na kontenerze)
position: absolute; (na dziecku)

top: number | string;
right: number | string;
bottom: number | string;
left: number | string;
transform: string;    // translate, rotate, scale
z-index: number;
```

---

## 3. Spacing system

### 3.1 Padding

```
padding-top: number;
padding-right: number;
padding-bottom: number;
padding-left: number;
```

UI: 4 pola + link "wszystkie strony" (sync)

### 3.2 Margin

```
margin-top: number;
margin-right: number;
margin-left: number;
margin-bottom: number;
```

UI: 4 pola + "auto" toggle (dla wyśrodkowania)

### 3.3 Gap

```
gap: number;
row-gap: number;    // jeśli różne od gap
column-gap: number; // jeśli różne od gap
```

---

## 4. Wymiary

### 4.1 Width / Height

```typescript
interface Dimensions {
  width: SizeValue;
  height: SizeValue;
  minWidth: SizeValue;
  minHeight: SizeValue;
  maxWidth: SizeValue;
  maxHeight: SizeValue;
  aspectRatio: string | null;  // "16/9", "1/1", "4/3"
}

interface SizeValue {
  value: number;
  unit: 'px' | '%' | 'vw' | 'vh' | 'rem' | 'em' | 'auto' | 'fit-content' | 'min-content' | 'max-content';
}
```

### 4.2 Overflow

```typescript
type OverflowMode = 'visible' | 'hidden' | 'scroll' | 'auto';
```

---

## 5. Pozycjonowanie

### 5.1 Z-index

```typescript
zIndex: number; // 0 – 9999
```

UI: slider + pole input. Automatyczne zarządzanie stacking context.

### 5.2 Position (dla Absolute)

```typescript
position: 'relative' | 'absolute' | 'fixed' | 'sticky';
top: number;
right: number;
bottom: number;
left: number;
```

---

## 6. UI Layout Engine — Inspector Panel

### 6.1 Layout section w Inspectorze

```
▼ LAYOUT
┌─────────────────────────────────────┐
│ Display: [Flex         ▼]           │
├─────────────────────────────────────┤
│ Direction: [Row ▼] Wrap: [No ▼]    │
├─────────────────────────────────────┤
│ Justify Content: [Center ▼]         │
│ Align Items: [Center ▼]             │
├─────────────────────────────────────┤
│ Gap: [16] px                        │
├─────────────────────────────────────┤
│ Width: [100] %  Min: [0] px         │
│ Height: [Auto]  Max: [1000] px      │
├─────────────────────────────────────┤
│ Overflow: [Visible ▼]               │
│ Aspect Ratio: [16/9 ▼]              │
└─────────────────────────────────────┘

▼ SPACING
┌─────────────────────────────────────┐
│ Padding: [20] [20] [20] [20] px     │
│ Margin:  [0] [Auto] [0] [Auto] px  │
└─────────────────────────────────────┘
```

### 6.2 Visual padding/margin editor

```
┌──────────────────────────────────────┐
│           MARGIN TOP: 0              │
│  ┌────────────────────────────┐      │
│  │     PADDING TOP: 20       │      │
│  │  ┌────────────────────┐   │      │
│  │  │                    │   │      │
│  │  │   CONTENT          │   │      │
│  │  │                    │   │      │
│  │  └────────────────────┘   │      │
│  │    PADDING BOTTOM: 20    │      │
│  └────────────────────────────┘      │
│          MARGIN BOTTOM: 0            │
└──────────────────────────────────────┘

Kliknięcie w krawędź → edycja wartości
Kolorowe strefy: margin (pomarańczowy), padding (zielony)
```

---

## 7. Responsywność layoutu

### 7.1 Per-breakpoint values

```typescript
interface ResponsiveLayoutProps {
  display: ResponsiveValue<DisplayMode>;
  flexDirection: ResponsiveValue<FlexDirection>;
  gap: ResponsiveValue<number>;
  padding: ResponsiveValue<SpacingValue>;
  // ... każde pole layoutu może być responsywne
}

interface ResponsiveValue<T> {
  desktop: T;
  tablet?: T;
  mobile?: T;
}
```

### 7.2 Hide on breakpoint

```typescript
interface ResponsiveVisibility {
  hideOnDesktop: boolean;
  hideOnTablet: boolean;
  hideOnMobile: boolean;
}
```

---

## 8. Implementacja

### 8.1 Rozszerzenie istniejącego LayoutEngine.ts

```typescript
// packages/builder-core/src/LayoutEngine.ts
// ROZSZERZENIE istniejącego pliku

interface LayoutProps {
  display: DisplayMode;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  justifyContent?: string;
  alignItems?: string;
  alignContent?: string;
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  gridGap?: number;
  padding?: SpacingValue;
  margin?: SpacingValue;
  width?: SizeValue;
  height?: SizeValue;
  minWidth?: SizeValue;
  maxWidth?: SizeValue;
  minHeight?: SizeValue;
  maxHeight?: SizeValue;
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
  top?: number;
  right?: number;
  left?: number;
  bottom?: number;
  zIndex?: number;
  overflow?: OverflowMode;
  aspectRatio?: string;
}

function computeLayoutStyles(props: LayoutProps): Record<string, string> {
  const styles: Record<string, string> = {};
  
  switch (props.display) {
    case 'FLEX':
      styles.display = 'flex';
      styles.flexDirection = props.flexDirection || 'row';
      styles.flexWrap = props.flexWrap || 'nowrap';
      styles.justifyContent = props.justifyContent || 'flex-start';
      styles.alignItems = props.alignItems || 'stretch';
      if (props.gap) styles.gap = `${props.gap}px`;
      break;
      
    case 'GRID':
      styles.display = 'grid';
      styles.gridTemplateColumns = props.gridTemplateColumns || '1fr';
      styles.gridTemplateRows = props.gridTemplateRows || 'auto';
      if (props.gridGap) styles.gap = `${props.gridGap}px`;
      break;
      
    case 'ABSOLUTE':
      styles.position = 'relative';
      // dzieci będą absolute
      break;
      
    default: // STACK / NONE
      styles.display = 'block';
  }
  
  // Spacing
  if (props.padding) {
    styles.padding = spacingToString(props.padding);
  }
  if (props.margin) {
    styles.margin = spacingToString(props.margin);
  }
  
  // Dimensions
  if (props.width) styles.width = sizeToString(props.width);
  if (props.height) styles.height = sizeToString(props.height);
  
  return styles;
}
```

### 8.2 Nowy komponent UI

```
src/components/builder/inspector/
├── LayoutSection.tsx        — sekcja Layout w Inspectorze
├── SpacingSection.tsx       — sekcja Spacing
├── DimensionSection.tsx     — sekcja wymiarów
├── DisplayModeSelect.tsx    — dropdown dla display mode
├── SpacingEditor.tsx        — wizualny edytor padding/margin
├── GridEditor.tsx           — edytor grid template
└── ResponsiveValue.tsx      — per-breakpoint value editor
```

### 8.3 Generator CSS

```typescript
// Funkcja która generuje CSS string z layout props
function generateLayoutCSS(props: LayoutProps): string {
  const styles = computeLayoutStyles(props);
  return Object.entries(styles)
    .map(([key, value]) => `  ${kebabCase(key)}: ${value};`)
    .join('\n');
}

// Używane w:
// - Preview (inline styles w iframe)
// - Compile (do StoreConfig)
// - Custom CSS panel
```

---

## 9. Zależności

| Moduł | Zależność |
|-------|-----------|
| LayoutEngine | ComponentRegistry (schema layout props) |
| CanvasEngine | LayoutEngine (style w preview) |
| Inspector | LayoutEngine (UI panel) |
| ResponsiveEngine | LayoutEngine (per-breakpoint) |
| Compile | LayoutEngine (generowanie CSS) |

---

## 10. Decision Records

### DR-LAYOUT-001: CSS inline zamiast classes
**Status:** Proposed  
**Uzasadnienie:** Style są generowane jako obiekt CSS i aplikowane inline lub przez CSS-in-JS. To prostsze niż generowanie klas i utrzymywanie arkuszów.

### DR-LAYOUT-002: Display jako enum, nie string
**Status:** Proposed  
**Uzasadnienie:** Typowanie display modes pozwala na bezpieczne switch/case w engine i dedykowane UI dla każdego trybu.

### DR-LAYOUT-003: Gap zamiast margin między dziećmi
**Status:** Proposed  
**Uzasadnienie:** Gap jest czystszy niż margin na dzieciach. Nie wpływa na klikalność krawędzi i jest lepiej wspierany we wszystkich display modes.

