# C16.21 — WEB FACTOR Studio Global Styles

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 21_GLOBAL_STYLES.md  
> **Status:** Draft  
> **Zależności:** 10_DESIGN_SYSTEM.md, 07_INSPECTOR.md

---

## 1. Cel

Global Styles to system stylów dla typowych elementów (Heading 1, Heading 2, Paragraph, Button, Link), który działa jak style w Wordzie — zmieniasz H2 i wszystkie H2 na stronie się aktualizują.

**Różnica między Design Tokens a Global Styles:**
- **Design Tokens** — niskopoziomowe wartości (kolory, fonty, spacingi)
- **Global Styles** — wysokopoziomowe style dla elementów (H1 wygląda tak: font-size 48px, color primary, margin-bottom 24px)

---

## 2. Koncepcja

```
Użytkownik:
1. Otwiera Global Styles panel
2. Klik "Heading 2"
3. Zmienia font-size z 28px na 24px
4. CIACH! — wszystkie H2 na stronie się zmieniają

Bez ręcznego poprawiania każdej sekcji.
```

---

## 3. Global Style Types

```typescript
type GlobalStyleType = 
  | 'HEADING_1'
  | 'HEADING_2'
  | 'HEADING_3'
  | 'HEADING_4'
  | 'HEADING_5'
  | 'HEADING_6'
  | 'PARAGRAPH'
  | 'PARAGRAPH_SMALL'
  | 'LINK'
  | 'LINK_HOVER'
  | 'BUTTON_PRIMARY'
  | 'BUTTON_SECONDARY'
  | 'BUTTON_TEXT'
  | 'CAPTION'
  | 'LABEL'
  | 'QUOTE'
  | 'LIST_ITEM'
  | 'NAV_LINK';

interface GlobalStyle {
  id: GlobalStyleType;
  label: string;            // "Heading 1"
  description?: string;     // "Główny nagłówek strony"
  defaults: StyleProperties;
  properties: StylePropertyGroup[];
}

interface StyleProperties {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: string;
  textTransform?: string;
  textDecoration?: string;
  color?: string;
  marginTop?: string;
  marginBottom?: string;
  // ... zależnie od typu
}

interface StylePropertyGroup {
  group: string;            // "Typography" | "Spacing" | "Color"
  fields: PropSchema[];
}
```

---

## 4. Global Styles Panel

### 4.1 UI

```
┌──────────────────────────────────────────────────────┐
│  GLOBAL STYLES                        [Reset] [Save] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ▼ HEADINGS                                          │
│  ┌────────────────────────────────────────────────┐  │
│  │ Heading 1  Aa  │ Font: Inter, 48px, 700       │  │
│  │ Heading 2  Aa  │ Font: Inter, 36px, 600       │  │
│  │ Heading 3  Aa  │ Font: Inter, 28px, 600       │  │
│  │ Heading 4  Aa  │ Font: Inter, 20px, 500       │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ▼ TEXT                                              │
│  ┌────────────────────────────────────────────────┐  │
│  │ Paragraph    Aa │ Font: Inter, 16px, 400       │  │
│  │ Small        Aa │ Font: Inter, 14px, 400       │  │
│  │ Caption      Aa │ Font: Inter, 12px, 400       │  │
│  │ Quote        Aa │ Font: Playfair, 20px, italic │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ▼ BUTTONS                                           │
│  ┌────────────────────────────────────────────────┐  │
│  │ Primary     [Button]│ bg: primary, white text  │  │
│  │ Secondary   [Button]│ border, primary text     │  │
│  │ Text        Button  │ no bg, primary text      │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ▼ LINKS                                             │
│  ┌────────────────────────────────────────────────┐  │
│  │ Normal     Link  │ color: primary              │  │
│  │ Hover      Link  │ color: primary, underline   │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 4.2 Edycja stylu

```
Kliknięcie "Heading 2":

▼ HEADING 2
┌──────────────────────────────────────┐
│  Preview:                             │
│  The quick brown fox jumps...         │
│                                      │
│  Typography                          │
│  Font Family: [Inter ▼]              │
│  Font Size: [36] px                  │
│  Font Weight: [600]                  │
│  Line Height: [1.3]                  │
│  Letter Spacing: [-0.01] em          │
│  Text Transform: [None ▼]            │
│                                      │
│  Color                               │
│  Text: [Sample Text]                 │
│                                      │
│  Spacing                             │
│  Margin Bottom: [24] px              │
│                                      │
│  [Apply to all H2] [Reset to default]│
└──────────────────────────────────────┘
```

---

## 5. Jak Global Style wpływają na komponenty

### 5.1 Referencje w komponentach

```typescript
// Komponent może używać Global Style zamiast hardcoded wartości

const descriptor: ComponentDescriptor = {
  type: 'hero.basic',
  schema: [
    {
      key: 'titleStyle',
      label: 'Styl tytułu',
      type: 'select',
      options: [
        { label: 'Heading 1', value: 'HEADING_1' },
        { label: 'Heading 2', value: 'HEADING_2' },
        { label: 'Custom', value: 'CUSTOM' },
      ],
      defaultValue: 'HEADING_1',
    },
    {
      key: 'title',
      label: 'Tytuł',
      type: 'string',
      defaultValue: 'Welcome',
    },
  ],
};

// W renderowaniu:
function HeroSection({ title, titleStyle, ...props }) {
  const globalStyle = useGlobalStyle(titleStyle);
  
  return (
    <h1 style={globalStyle}>
      {title}
    </h1>
  );
}
```

### 5.2 CSS Output

```css
/* Global Styles → CSS Custom Properties */
:root {
  --heading-1-font-size: 48px;
  --heading-1-font-weight: 700;
  --heading-1-line-height: 1.2;
  --heading-2-font-size: 36px;
  --heading-2-font-weight: 600;
  --paragraph-font-size: 16px;
  --button-primary-bg: var(--color-primary);
  --button-primary-text: #ffffff;
}
```

---

## 6. Implementacja

### 6.1 Model danych

```typescript
// packages/builder-core/src/GlobalStyles.ts

interface GlobalStylesConfig {
  heading1: HeadingStyle;
  heading2: HeadingStyle;
  heading3: HeadingStyle;
  heading4: HeadingStyle;
  heading5: HeadingStyle;
  heading6: HeadingStyle;
  paragraph: TextStyle;
  paragraphSmall: TextStyle;
  link: LinkStyle;
  linkHover: LinkStyle;
  buttonPrimary: ButtonStyle;
  buttonSecondary: ButtonStyle;
  buttonText: ButtonStyle;
  caption: TextStyle;
  label: TextStyle;
  quote: TextStyle;
  listItem: TextStyle;
  navLink: TextStyle;
}

interface HeadingStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  lineHeight: number;
  letterSpacing: string;
  color: string;
  marginBottom: string;
}

interface TextStyle extends HeadingStyle {
  textTransform: string;
  textDecoration: string;
}

interface LinkStyle {
  color: string;
  textDecoration: string;
  hoverColor?: string;
  hoverDecoration?: string;
}

interface ButtonStyle {
  fontFamily: string;
  fontSize: string;
  fontWeight: number;
  padding: string;
  borderRadius: string;
  bgColor: string;
  textColor: string;
  borderColor?: string;
  hoverBgColor?: string;
  hoverTextColor?: string;
}
```

### 6.2 Komendy

```typescript
// Nowa komenda dla Global Styles
type BuilderCommandType = /* ... */ | 'UPDATE_GLOBAL_STYLE';

// Komenda:
{
  type: 'UPDATE_GLOBAL_STYLE',
  styleId: 'heading2',
  properties: {
    fontSize: '32px',
    fontWeight: 600,
  },
}
```

### 6.3 Pliki

```
packages/builder-core/src/
├── GlobalStyles.ts               — model danych

src/components/builder/global-styles/
├── GlobalStylesPanel.tsx         — główny panel
├── GlobalStyleCard.tsx           — karta stylu (podgląd)
├── GlobalStyleEditor.tsx         — edytor pojedynczego stylu
├── GlobalStylePreview.tsx        — podgląd na żywo
└── hooks/
    └── useGlobalStyles.ts        — hook
```

