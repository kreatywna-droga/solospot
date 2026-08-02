# C16.10 — WEB FACTOR Studio Design System

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 10_DESIGN_SYSTEM.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 06_LAYOUT_ENGINE.md, 07_INSPECTOR.md

---

## 1. Cel

Design System to globalny system tokenów, który definiuje wygląd całej strony. Zmiana jednego tokena (np. `primary`) aktualizuje wszystkie komponenty na stronie.

**Obecnie:** Tylko `primaryColor`, `secondaryColor`, `font` w `BuilderTheme`.
**Docelowo:** Pełny system tokenów z kategoriami, aliasami i referencjami.

---

## 2. Architektura tokenów

```
┌─────────────────────────────────────────────────┐
│                  TOKENS                          │
│  ┌─────────────────────────────────────────────┐│
│  │  Global                                     ││
│  │  ├── Colors                                 ││
│  │  ├── Typography                             ││
│  │  ├── Spacing                                ││
│  │  ├── Border Radius                          ││
│  │  ├── Shadows                                ││
│  │  └── Breakpoints                            ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │  Aliases                                    ││
│  │  ├── semantic tokens (color.primary)        ││
│  │  └── component tokens (button.bg)           ││
│  └─────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────┐│
│  │  Compiled (CSS Custom Properties)           ││
│  │  :root {                                    ││
│  │    --color-primary: #7c3aed;                ││
│  │    --font-body: 'Inter', sans-serif;        ││
│  │    --spacing-md: 16px;                      ││
│  │  }                                          ││
│  └─────────────────────────────────────────────┘│
└─────────────────────────────────────────────────┘
```

---

## 3. Token Categories

### 3.1 Colors

```typescript
interface ColorTokens {
  // Brand colors
  primary: string;          // #7c3aed
  secondary: string;        // #d946ef
  accent: string;           // #f59e0b
  
  // Semantic colors
  background: string;       // #ffffff
  surface: string;          // #f8fafc
  text: string;             // #0f172a
  textSecondary: string;    // #64748b
  border: string;           // #e2e8f0
  
  // State colors
  success: string;          // #10b981
  warning: string;          // #f59e0b
  danger: string;           // #ef4444
  info: string;             // #3b82f6
  
  // Dark mode (opcjonalne)
  darkBackground: string;   // #0f172a
  darkSurface: string;      // #1e293b
  darkText: string;         // #f8fafc
}

// UI: Color Editor
┌──────────────────────────────────────────────────────┐
│  COLORS                                              │
│                                                      │
│  Brand                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ Primary    │ │ Secondary  │ │ Accent     │      │
│  │ #7C3AED   │ │ #D946EF   │ │ #F59E0B   │      │
│  └────────────┘ └────────────┘ └────────────┘      │
│                                                      │
│  Semantic                                           │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ Background │ │ Surface    │ │ Text       │      │
│  │ #FFFFFF   │ │ #F8FAFC   │ │ #0F172A   │      │
│  └────────────┘ └────────────┘ └────────────┘      │
│                                                      │
│  States                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │ Success    │ │ Warning    │ │ Danger     │      │
│  │ #10B981   │ │ #F59E0B   │ │ #EF4444   │      │
│  └────────────┘ └────────────┘ └────────────┘      │
│                                                      │
│  [Reset to default] (przywraca domyślne kolory)      │
└──────────────────────────────────────────────────────┘
```

### 3.2 Typography

```typescript
interface TypographyTokens {
  // Font families
  fontHeading: string;      // 'Inter', sans-serif
  fontBody: string;         // 'Inter', sans-serif
  fontMono: string;         // 'JetBrains Mono', monospace
  
  // Font sizes
  fontSizeH1: string;       // '48px'
  fontSizeH2: string;       // '36px'
  fontSizeH3: string;       // '28px'
  fontSizeH4: string;       // '20px'
  fontSizeBody: string;     // '16px'
  fontSizeSmall: string;    // '14px'
  fontSizeCaption: string;  // '12px'
  
  // Font weights
  fontWeightLight: number;  // 300
  fontWeightRegular: number;// 400
  fontWeightMedium: number; // 500
  fontWeightBold: number;   // 700
  
  // Line heights
  lineHeightTight: number;  // 1.2
  lineHeightNormal: number; // 1.5
  lineHeightRelaxed: number;// 1.75
}

// UI: Typography Editor
┌──────────────────────────────────────────────────────┐
│  TYPOGRAPHY                                          │
│                                                      │
│  Font Families                                      │
│  Heading: [Inter ▼]                                  │
│  Body:    [Inter ▼]                                  │
│  Mono:    [JetBrains Mono ▼]                        │
│                                                      │
│  Scale (Heading)                                    │
│  H1: [48] px  H2: [36] px  H3: [28] px             │
│  H4: [20] px  Body: [16] px                         │
│                                                      │
│  Weights                                            │
│  Light: [300]  Regular: [400]                       │
│  Medium: [500]  Bold: [700]                         │
│                                                      │
│  Preview:                                           │
│  ┌────────────────────────────────────┐             │
│  │ The quick brown fox (Heading)      │             │
│  │ The quick brown fox (Body)         │             │
│  └────────────────────────────────────┘             │
└──────────────────────────────────────────────────────┘
```

### 3.3 Spacing

```typescript
interface SpacingTokens {
  spacing0: string;     // '0px'
  spacing1: string;     // '4px'
  spacing2: string;     // '8px'
  spacing3: string;     // '12px'
  spacing4: string;     // '16px'
  spacing5: string;     // '20px'
  spacing6: string;     // '24px'
  spacing8: string;     // '32px'
  spacing10: string;    // '40px'
  spacing12: string;    // '48px'
  spacing16: string;    // '64px'
  spacing20: string;    // '80px'
  spacing24: string;    // '96px'
}
```

### 3.4 Border Radius

```typescript
interface BorderRadiusTokens {
  radiusNone: string;   // '0px'
  radiusSm: string;     // '4px'
  radiusMd: string;     // '8px'
  radiusLg: string;     // '12px'
  radiusXl: string;     // '16px'
  radius2xl: string;    // '24px'
  radiusFull: string;   // '9999px'
}
```

### 3.5 Shadows

```typescript
interface ShadowTokens {
  shadowSm: string;     // '0 1px 2px rgba(0,0,0,0.05)'
  shadowMd: string;     // '0 4px 6px rgba(0,0,0,0.1)'
  shadowLg: string;     // '0 10px 15px rgba(0,0,0,0.1)'
  shadowXl: string;     // '0 20px 25px rgba(0,0,0,0.15)'
  shadow2xl: string;    // '0 25px 50px rgba(0,0,0,0.25)'
}
```

---

## 4. Design System Panel

### 4.1 Lokalizacja

Dostępny z:
- Toolbar → "Design System" button
- Pages panel → "Global Settings"
- Right-click na tle canvasu → "Edit Design System"

### 4.2 UI

```
┌──────────────────────────────────────────────────────┐
│  DESIGN SYSTEM                        [Reset] [Save] │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ▼ COLORS                                            │
│  ... (color editor z 3.1)                            │
│                                                      │
│  ▼ TYPOGRAPHY                                       │
│  ... (typography editor z 3.2)                       │
│                                                      │
│  ▼ SPACING                                          │
│  ... (spacing scale editor)                          │
│                                                      │
│  ▼ BORDER RADIUS                                    │
│  ... (radius scale editor)                           │
│                                                      │
│  ▼ SHADOWS                                          │
│  ... (shadow editor)                                 │
│                                                      │
│  ▼ BREAKPOINTS                                      │
│  Desktop: [1280] px                                  │
│  Tablet:  [768] px                                   │
│  Mobile:  [375] px                                   │
│                                                      │
│  ▼ EXPORT                                            │
│  [Copy CSS Variables] [Export Theme JSON]            │
└──────────────────────────────────────────────────────┘
```

---

## 5. Jak tokeny wpływają na komponenty

### 5.1 Referencje w schema

```typescript
// Komponent używa tokena zamiast hardcoded wartości
{
  key: 'bgColor',
  label: 'Kolor tła',
  type: 'color',
  defaultValue: '{color.primary}',   // referencja do tokena
}

// W Inspectorze:
// ▸ Kolor tła: [Primary (#7C3AED)]     [▼ Use: Token]
//              [● Token] [○ Custom]
//              Jeśli token → pokazuje nazwę tokena
//              Kliknięcie → edytuj token w Design System
```

### 5.2 CSS Custom Properties

```css
/* Kompilacja tokenów do CSS */
:root {
  --color-primary: #7c3aed;
  --color-primary-hover: #6d28d9;
  --color-secondary: #d946ef;
  --color-background: #ffffff;
  --color-text: #0f172a;
  --font-heading: 'Inter', sans-serif;
  --spacing-4: 16px;
  --radius-md: 8px;
}

.my-section {
  background: var(--color-primary);
  font-family: var(--font-heading);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
}
```

### 5.3 Live update

```typescript
// Zmiana tokena → natychmiastowa aktualizacja
function updateToken(tokenName: string, value: string) {
  dispatch({
    type: 'UPDATE_THEME',
    theme: { [tokenName]: value },
  });
  
  // CSS Custom Property update
  document.documentElement.style.setProperty(
    `--${tokenName}`,
    value
  );
  
  // Preview sync
  preview.send(createThemeUpdate({ [tokenName]: value }));
}
```

---

## 6. Design System Presets

### 6.1 Gotowe zestawy

```typescript
interface DesignSystemPreset {
  name: string;
  description: string;
  tokens: Partial<AllTokens>;
  preview: string;       // obrazek poglądowy
}

const presets: DesignSystemPreset[] = [
  {
    name: 'Modern Purple',
    description: 'Nowoczesny, fioletowy motyw',
    tokens: {
      primary: '#7c3aed',
      secondary: '#d946ef',
      // ...
    }
  },
  {
    name: 'Minimal Light',
    description: 'Czysty, minimalistyczny jasny',
    tokens: {
      primary: '#0f172a',
      background: '#ffffff',
      // ...
    }
  },
  {
    name: 'Dark Mode',
    description: 'Ciemny motyw dla zaawansowanych',
    tokens: {
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f8fafc',
      // ...
    }
  },
  // ... więcej presetów
];
```

### 6.2 UI presets

```
DESIGN SYSTEM PRESETS
┌────┐ ┌────┐ ┌────┐ ┌────┐
│Modern│Minimal│ Dark │Elegant│
│Purple│ Light │ Mode │ Gold  │
└────┘ └────┘ └────┘ └────┘

[Apply Preset] (nadpisuje aktualne tokeny)
[Save as Preset] (zapisz aktualne jako preset)
```

---

## 7. Implementacja

### 7.1 Rozszerzenie BuilderTheme

```typescript
// packages/builder-core/src/BuilderDocument.ts
// Rozszerzenie istniejącego BuilderTheme

interface BuilderTheme {
  // Istniejące pola
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logo?: string;
  favicon?: string;
  backgroundColor?: string;
  borderRadius?: string;
  
  // Nowe pola (Design Tokens)
  colorTokens?: ColorTokens;
  typographyTokens?: TypographyTokens;
  spacingTokens?: SpacingTokens;
  borderRadiusTokens?: BorderRadiusTokens;
  shadowTokens?: ShadowTokens;
  
  // Dark mode
  darkMode?: Partial<ColorTokens>;
}
```

### 7.2 Nowe pliki

```
src/components/builder/design-system/
├── DesignSystemPanel.tsx    — główny panel
├── ColorTokenEditor.tsx     — edytor kolorów
├── TypographyTokenEditor.tsx— edytor typografii
├── SpacingTokenEditor.tsx   — edytor spacingu
├── BorderTokenEditor.tsx    — edytor border radius
├── ShadowTokenEditor.tsx    — edytor cieni
├── DesignSystemPresets.tsx  — presety
├── TokenReference.tsx       — pole z referencją tokena
├── TokenBadge.tsx           — badge "uses token"
└── hooks/
    └── useDesignTokens.ts   — hook do zarządzania tokenami
```

---

## 8. Export / Import

```typescript
// Export Design System jako JSON
interface DesignSystemExport {
  version: string;
  name: string;
  tokens: AllTokens;
  createdAt: string;
  author: string;
}

// Import Design System
function importDesignSystem(json: DesignSystemExport) {
  // Walidacja wersji
  // Mapowanie starych → nowe tokeny
  // dispatch(UPDATE_THEME, json.tokens)
  // Preview sync
}

// Export jako CSS
function exportAsCSS(tokens: AllTokens): string {
  return `
:root {
  --color-primary: ${tokens.primary};
  --color-secondary: ${tokens.secondary};
  --font-body: '${tokens.fontBody}', sans-serif;
  /* ... */
}
  `;
}
```

---

## 9. Zależności

| Moduł | Zależność |
|-------|-----------|
| DesignSystem | BuilderTheme (istniejący) |
| Inspector | TokenReference (pole tokena) |
| Preview | CSS Custom Properties z tokenów |
| Compile | embed tokenów do StoreConfig |

