# C16.12 — WEB FACTOR Studio Responsive Engine

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 12_RESPONSIVE_ENGINE.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 03_CANVAS_ENGINE.md, 06_LAYOUT_ENGINE.md

---

## 1. Cel

Responsive Engine umożliwia projektowanie stron, które wyglądają dobrze na każdym urządzeniu. Każdy element może mieć osobne wartości dla desktopu, tabletu i mobile.

**Obecnie:** ResponsiveEngine.ts istnieje z podstawową obsługą breakpointów.
**Docelowo:** Pełny system responsywny z widokiem symultanicznym, per-breakpoint wartościami i automatyczną adaptacją layoutu.

---

## 2. Breakpointy

```typescript
interface BreakpointConfig {
  name: string;           // 'DESKTOP' | 'TABLET' | 'MOBILE'
  width: number;          // w px
  columns: number;        // liczba kolumn gridu
  gutter: number;         // odstęp między kolumnami
  margin: number;         // margines strony
  minWidth?: number;      // minimalna szerokość viewportu
  maxWidth?: number;      // maksymalna szerokość viewportu
}

const BREAKPOINTS: BreakpointConfig[] = [
  { name: 'DESKTOP', width: 1280, columns: 12, gutter: 24, margin: 24, minWidth: 1024 },
  { name: 'TABLET',  width: 768,  columns: 8,  gutter: 16, margin: 16, minWidth: 480, maxWidth: 1023 },
  { name: 'MOBILE',  width: 375,  columns: 4,  gutter: 12, margin: 12, maxWidth: 479 },
];
```

---

## 3. Responsywne wartości

### 3.1 Model danych

```typescript
interface ResponsiveValue<T> {
  desktop: T;             // zawsze wymagane (base value)
  tablet?: T;             // opcjonalne (fallback → desktop)
  mobile?: T;             // opcjonalne (fallback → tablet → desktop)
}

// Każda właściwość layoutu może być responsywna
interface ResponsiveLayout {
  display: ResponsiveValue<DisplayMode>;
  flexDirection: ResponsiveValue<FlexDirection>;
  alignItems: ResponsiveValue<AlignItems>;
  justifyContent: ResponsiveValue<JustifyContent>;
  gap: ResponsiveValue<number>;
  padding: ResponsiveValue<SpacingValue>;
  margin: ResponsiveValue<SpacingValue>;
  width: ResponsiveValue<SizeValue>;
  height: ResponsiveValue<SizeValue>;
  // ...
}

// Każda właściwość komponentu może być responsywna
interface ResponsiveComponentProps {
  fontSize: ResponsiveValue<number>;
  fontWeight: ResponsiveValue<number>;
  lineHeight: ResponsiveValue<number>;
  letterSpacing: ResponsiveValue<number>;
  // ...
}
```

### 3.2 Dziedziczenie wartości

```typescript
function getEffectiveValue<T>(
  responsiveValue: ResponsiveValue<T>,
  breakpoint: 'DESKTOP' | 'TABLET' | 'MOBILE'
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

---

## 4. Responsywny UI w Inspectorze

### 4.1 Per-breakpoint edycja

```
▼ TYPOGRAPHY
  Font Size: [48] px    ▸ Desktop    [● D] [○ T] [○ M]
  Font Size: [36] px    ▸ Tablet     [○ D] [● T] [○ M]
  Font Size: [24] px    ▸ Mobile     [○ D] [○ T] [● M]
  
  Kliknięcie breakpoint → pokazuje wartość dla tego breakpointu
  Wartość wyszarzona → inherited (fallback)
  Przycisk "Add override" → ustaw wartość dla tego breakpointu
  Przycisk "Reset" → usuń override (fallback do wyższego breakpointu)
```

### 4.2 Responsive indicator

```
Każde pole, które ma override, dostaje badge:
[Font Size: 48px] [● D] [T: 36px ▼] [M: 24px ▼]
                    ↑ desktop    ↑ tablet     ↑ mobile
                    active      override     override
```

---

## 5. Hide on Breakpoint

```typescript
interface ResponsiveVisibility {
  hideOnDesktop: boolean;
  hideOnTablet: boolean;
  hideOnMobile: boolean;
}

// UI w Inspectorze
▼ RESPONSIVE
  Hide on:
  [☐ Desktop] [☑ Tablet] [☑ Mobile]
  
  Stack on:
  [☑ Mobile ▼]  ← auto stack children na mobile
```

---

## 6. Automatyczna adaptacja layoutu

### 6.1 Stack on Mobile

```typescript
// Na desktopie: flex row z 3 kolumnami
// Na mobile: auto stack (flex column)

interface ResponsiveLayoutBehavior {
  stackOnBreakpoint: 'TABLET' | 'MOBILE' | 'NONE';
  reverseOrder: boolean;    // odwróć kolejność na mobile
  hideEmpty: boolean;       // ukryj puste kontenery
}
```

### 6.2 Grid → Stack

```
DESKTOP (3 columns):             MOBILE (stack):
┌──────┬──────┬──────┐          ┌──────────────┐
│  A   │  B   │  C   │          │      A       │
├──────┼──────┼──────┤          ├──────────────┤
│  D   │  E   │  F   │          │      B       │
└──────┴──────┴──────┘          ├──────────────┤
                                 │      C       │
                                 ├──────────────┤
                                 │      D       │
                                 ├──────────────┤
                                 │      E       │
                                 ├──────────────┤
                                 │      F       │
                                 └──────────────┘
```

---

## 7. Widok symultaniczny

### 7.1 Concept

Pokaż wszystkie trzy widoki obok siebie (tylko dla dużych ekranów):

```
┌──────────────────────────────────────────────────────────────┐
│  DESKTOP 1280px  │  TABLET 768px  │  MOBILE 375px           │
├──────────────────┼────────────────┼─────────────────────────┤
│                  │                │                          │
│   Full page      │   Tablet       │   Mobile                 │
│   preview        │   preview      │   preview                │
│                  │                │                          │
│                  │                │                          │
└──────────────────┴────────────────┴──────────────────────────┘
```

### 7.2 Sync edycji

```typescript
// Edycja w jednym view → auto sync do pozostałych
// Jeśli pole ma override, pokazuje wartość dla tego widoku
// Jeśli nie ma override, pokazuje inheritowaną wartość
```

---

## 8. Responsywny preview

### 8.1 Iframe resize

```typescript
function updatePreviewViewport(breakpoint: BreakpointConfig) {
  const iframe = previewFrameRef.current;
  if (!iframe) return;
  
  iframe.style.width = `${breakpoint.width}px`;
  iframe.style.maxHeight = `${window.innerHeight - 200}px`;
  
  // Wyślij do PreviewRuntime
  preview.send(createViewportChange(
    breakpoint.width,
    breakpoint.name as ViewportLabel
  ));
}
```

### 8.2 Device frames

```
DESKTOP:   [┌────────────────────────────┐]  brak ramki
           │  content                    │
           └────────────────────────────┘

TABLET:    [┌──────┐]  zaokrąglone rogi
           │      │
           └──────┘

MOBILE:    [┌──┐  ]  ramka telefonu
           │  │■│  │  notch/górna belka
           │  │  │  │
           │  │  │  │
           └──┘  ┘
           home indicator
```

---

## 9. Implementacja

### 9.1 Rozszerzenie istniejącego ResponsiveEngine.ts

```typescript
// packages/builder-core/src/ResponsiveEngine.ts
// Rozszerzenie o:
// - ResponsiveValue<T> generic
// - Breakpoint inheritance
// - Responsive visibility
// - Auto-adapt layout
// - Simultanous view
```

### 9.2 Nowe pliki

```
src/components/builder/responsive/
├── ResponsivePanel.tsx         — panel w Inspectorze
├── ResponsiveField.tsx         — pole z per-breakpoint wartościami
├── ResponsiveVisibility.tsx    — hide on breakpoint
├── ResponsiveBreakpointBar.tsx — pasek breakpointów (bottom bar)
├── ResponsiveDeviceFrame.tsx   — ramka urządzenia (dla tabletu/mobile)
├── SimultaneousView.tsx        — widok symultaniczny
├── BreakpointEditor.tsx        — edytor breakpointów
└── hooks/
    └── useResponsiveValue.ts   — hook do zarządzania responsywnymi wartościami
```

---

## 10. Responsywność w komponentach

### 10.1 Schema responsywnych pól

```typescript
// Komponent deklaruje które pola są responsywne
{
  key: 'fontSize',
  label: 'Font Size',
  type: 'number',
  responsive: true,          // nowe pole w PropSchema
  defaultValue: 48,
}
```

### 10.2 Media queries w preview

```css
/* Auto-generowane przez compile() */
@media (max-width: 1023px) {
  .section-hero {
    font-size: var(--font-size-tablet);  /* 36px */
    padding: var(--padding-tablet);      /* 16px */
  }
}

@media (max-width: 479px) {
  .section-hero {
    font-size: var(--font-size-mobile);  /* 24px */
    padding: var(--padding-mobile);      /* 12px */
    flex-direction: column;              /* stack */
  }
}
```

---

## 11. Decision Records

### DR-RESP-001: Mobile-first vs Desktop-first
**Status:** Desktop-first  
**Uzasadnienie:** Studio jest narzędziem desktopowym. Większość użytkowników zaczyna od desktopu i dostosowuje na mobile.

### DR-RESP-002: Per-breakpoint values vs auto-adaptation
**Status:** Per-breakpoint values z auto-fallback  
**Uzasadnienie:** Daje pełną kontrolę projektantowi, z wygodnym fallbackiem (tablet → desktop, mobile → tablet → desktop).

