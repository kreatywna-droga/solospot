# C16.7 — WEB FACTOR Studio Inspector

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 07_INSPECTOR.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 02_UI_LAYOUT.md, 06_LAYOUT_ENGINE.md

---

## 1. Cel

Inspector (prawy panel) to miejsce, gdzie użytkownik edytuje właściwości wybranej sekcji. Jest w pełni generowany na podstawie `PropSchema` z `ComponentRegistry`.

**Kluczowa zmiana:** Obecny `PropsPanel.tsx` jest płaski (lista pól). Nowy Inspector ma **kategorie** jak profesjonalne narzędzia (Figma, Webflow).

---

## 2. Struktura Inspectora

### 2.1 Nagłówek

```
┌──────────────────────────────────────┐
│  [Section Name]       [Type: hero]   │
│  DESKTOP | TABLET | MOBILE           │
│  [⋮ menu: Duplicate | Delete | Copy] │
└──────────────────────────────────────┘
```

- **Nazwa sekcji** — edytowalna (double-click)
- **Type** — stały, określony przez ComponentRegistry
- **Breakpoint switcher** — przełączanie między desktop/tablet/mobile
- **Menu** — akcje: Duplicate, Delete, Copy CSS, Copy JSON

### 2.2 Kategorie (scrollable)

Kategorie pojawiają się tylko jeśli komponent ma odpowiednie pola w schema.

```
▼ GENERAL
  Section ID, CSS Class, Visible, Locked

▼ LAYOUT (jeśli display jest w schema)
  Display, Flex Direction, Justify, Align, Gap

▼ SPACING
  Padding (top, right, bottom, left)
  Margin (top, right, bottom, left)

▼ TYPOGRAPHY
  Font Family, Weight, Size, Line Height, Letter Spacing
  Text Align, Decoration, Transform
  Color, Gradient Text, Text Shadow, Outline

▼ BACKGROUND
  Type: Color | Gradient | Image | Video | None
  [zależnie od typu: color picker, gradient editor, asset picker]

▼ BORDER
  Radius, Style, Width, Color (każda krawędź osobno)

▼ SHADOW
  Type: Box Shadow | Text Shadow | None
  X, Y, Blur, Spread, Color

▼ EFFECTS
  Opacity, Blur, Mix Blend Mode, Backdrop Filter

▼ ANIMATION
  Entrance, Exit, Hover, Scroll
  Duration, Delay, Easing

▼ RESPONSIVE
  Hide on: Desktop | Tablet | Mobile
  Stack on: Mobile

▼ SEO
  Alt Text, Title, Meta Description

▼ ACCESSIBILITY
  ARIA Label, Role, Tab Index

▼ CUSTOM CSS
  [textarea z CSS]
```

---

## 3. Typy pól

### 3.1 Standard types (już istnieją w PropSchema)

| Typ | UI | Przykład |
|-----|----|----------|
| `string` | Input text | Nazwa sekcji |
| `text` | Textarea | Opis, alt text |
| `number` | Input number + slider | Font size, padding |
| `boolean` | Toggle switch | Visible, Locked |
| `color` | Color picker + hex input | Kolor tła |
| `select` | Dropdown | Font family, display mode |
| `image` | Asset picker | Obraz tła |
| `asset` | Asset picker | Video, SVG, Lottie |

### 3.2 Extended types (nowe)

| Typ | UI | Przykład |
|-----|----|----------|
| `spacing` | 4-field editor (top, right, bottom, left) | Padding, Margin |
| `size` | Number + unit select | Width, Height |
| `gradient` | Gradient editor | Background gradient |
| `shadow` | Multi-field | Box shadow |
| `font` | Font selector z podglądem | Font family |
| `breakpoint` | Per-breakpoint value | Responsive values |
| `css` | Code editor (textarea) | Custom CSS |

### 3.3 Spacing field

```
Spacing Field:
┌─────┬─────┐
│  T  │  R  │
├─────┼─────┤
│  B  │  L  │
└─────┴─────┘
[🔗 Unlink] [Value: 20px]

Kliknięcie w T → edycja top
Kliknięcie w link → unlink (każda strona osobno)
```

### 3.4 Gradient editor

```
Gradient Field:
┌──────────────────────────────────┐
│  ████████████████████████████    │
│  ■#7C3AED           ■#D946EF    │
│  [135°] [Linear ▼]              │
│  [+ Add stop] [Remove]          │
└──────────────────────────────────┘

- Click na pasku → add stop
- Drag stop → move
- Click stop → color picker
- Type: Linear, Radial, Conic
- Angle slider
```

### 3.5 Shadow editor

```
Shadow Field:
┌──────────────────────────────────────┐
│  X: [4]  Y: [4]  Blur: [10]  Spread: [2] │
│  Color: [#00000040]                       │
│  Type: [Drop Shadow ▼] (Drop / Inner)     │
│  [+ Add another shadow]                  │
└──────────────────────────────────────┘
```

### 3.6 Font selector

```
Font Field:
┌──────────────────────────────────────┐
│  [Inter                         ▼]   │
│  ┌──────────────────────────────────┐ │
│  │  ▸ Inter (Sans-serif)            │ │
│  │  ▸ Poppins (Sans-serif)          │ │
│  │  ▸ Roboto (Sans-serif)           │ │
│  │  ▸ Playfair Display (Serif)      │ │
│  │  ▸ JetBrains Mono (Monospace)    │ │
│  │  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │ │
│  │  ▸ [Add custom font...]          │ │
│  └──────────────────────────────────┘ │
│  Weight: [700]                        │
│  Style: [Normal ▼]                    │
└──────────────────────────────────────┘

- Podgląd fontu w dropdown (The quick brown fox...)
- Search
- Google Fonts integration
- Variable font support (slider dla wagi)
```

---

## 4. Responsywne wartości

Każde pole w Inspectorze może mieć osobne wartości dla każdego breakpointu:

### 4.1 UI

```
▼ TYPOGRAPHY
  Font Size: [48] px    [● Desktop]    
                      [○ Tablet : 36]  
                      [○ Mobile : 24]  

Kliknięcie w breakpoint → pokazuje wartość dla tego breakpointu
Jeśli wartość nie jest ustawiona → "Inherited from Desktop"
Przycisk "Reset to Desktop" → usuwa override
```

### 4.2 Implementacja

```typescript
interface ResponsiveFieldProps<T> {
  desktop: T;
  tablet?: T;    // null = inherit from desktop
  mobile?: T;    // null = inherit from desktop
}
```

---

## 5. Batch editing

Gdy zaznaczono wiele sekcji:

```
3 ELEMENTS SELECTED
┌──────────────────────────────────────┐
│  ▼ LAYOUT                            │
│  Display: [Flex ▼] (mixed: Flex, Grid, Block)│
│  Gap: [16] px (empty = no change)    │
│                                      │
│  ▼ TYPOGRAPHY                        │
│  Font Size: [—] (różne wartości)     │
│  Color: [#FFFFFF]                    │
│                                      │
│  Apply to all selected               │
└──────────────────────────────────────┘

- Jeśli wszystkie mają tę samą wartość → pokazuje ją
- Jeśli różne → pokazuje "—" (mixed)
- Edycja → zmiana dla wszystkich zaznaczonych
- "Apply to all selected" → batch update
```

---

## 6. Custom CSS

### 6.1 Sekcja Custom CSS

```
▼ CUSTOM CSS
┌──────────────────────────────────────┐
│  .my-section {                       │
│    /* Dodaj własny CSS */            │
│    background: red;                  │
│    transform: rotate(5deg);          │
│  }                                   │
├──────────────────────────────────────┤
│  ⚠ Custom CSS może nadpisać style    │
│  z paneli. Użyj z rozwagą.          │
└──────────────────────────────────────┘
```

### 6.2 Code editor

- Syntax highlighting (CSS)
- Autocomplete (właściwości CSS)
- Linter (błędy składni)
- Ctrl+Z / Ctrl+Shift+Z w edytorze (osobna historia)

---

## 7. Implementacja

### 7.1 Pliki

```
src/components/builder/inspector/
├── InspectorPanel.tsx        — główny panel (wrapper)
├── InspectorHeader.tsx       — nagłówek z nazwą i breakpointami
├── InspectorCategory.tsx     — zwijana kategoria
├── fields/
│   ├── StringField.tsx
│   ├── NumberField.tsx
│   ├── BooleanField.tsx
│   ├── ColorField.tsx
│   ├── SelectField.tsx
│   ├── SpacingField.tsx      — padding/margin editor
│   ├── SizeField.tsx         — width/height z jednostką
│   ├── GradientField.tsx     — gradient editor
│   ├── ShadowField.tsx       — shadow editor
│   ├── FontField.tsx         — font selector
│   ├── ImageField.tsx        — asset picker
│   ├── TextField.tsx         — textarea
│   └── ResponsiveField.tsx   — wrapper dla responsywnych wartości
├── sections/
│   ├── LayoutSection.tsx
│   ├── SpacingSection.tsx
│   ├── TypographySection.tsx
│   ├── BackgroundSection.tsx
│   ├── BorderSection.tsx
│   ├── ShadowSection.tsx
│   ├── EffectsSection.tsx
│   ├── AnimationSection.tsx
│   ├── ResponsiveSection.tsx
│   ├── SEOSection.tsx
│   ├── AccessibilitySection.tsx
│   └── CustomCSSSection.tsx
└── BatchEditor.tsx           — edytor dla wielu sekcji
```

### 7.2 Schema-driven rendering

```typescript
// Komponent kategorii renderuje się tylko jeśli schema ma pola z daną grupą

function InspectorPanel() {
  const selectedSection = useSelectedSection();
  const descriptor = registry.get(selectedSection.type);
  const schema = descriptor?.schema ?? [];
  
  // Grupuj schema po group
  const grouped = groupBy(schema, 'group');
  
  return (
    <div>
      <InspectorHeader section={selectedSection} />
      <div className="scrollable">
        {Object.entries(grouped).map(([group, fields]) => (
          <InspectorCategory key={group} title={group}>
            {fields.map(field => (
              <FieldRenderer key={field.key} schema={field} />
            ))}
          </InspectorCategory>
        ))}
      </div>
      <CustomCSSSection />
    </div>
  );
}
```

---

## 8. Zależności od istniejącego kodu

| Moduł | Status | Uwagi |
|-------|--------|-------|
| `PropsPanel.tsx` | ⚠️ Istnieje | Do przebudowy na kategoriowy Inspector |
| `ComponentRegistry.ts` | ✅ Gotowe | Schema z grupami już istnieje |
| `colorProp`, `numberProp` etc. | ✅ Gotowe | Helpery do budowania schema |

---

## 9. Edge Cases

| Case | Zachowanie |
|------|------------|
| **Brak schema** | "Brak konfigurowalnych właściwości" |
| **Sekcja zablokowana** | Wszystkie pola read-only + kłódka |
| **Hidden field** | Pole nie jest renderowane (schema.hidden) |
| **Responsive override** | Pole pokazuje wartość dla aktywnego breakpointu |
| **Mixed values** | Pole pokazuje "—" przy batch edycji |
| **Custom CSS** | Nadpisuje wszystkie inne wartości |

