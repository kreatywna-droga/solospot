# C16.2 — WEB FACTOR Studio UI Layout

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 02_UI_LAYOUT.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md

---

## 1. Studio Shell — układ aplikacji

```
┌──────────────────────────────────────────────────────────────────────┐
│                        TOOLBAR (Top Bar)                             │
│  ← Back | Store Name | [Pages] [Layers] [Assets] [AI] [History]     │
│                     | Desktop | Tablet | Mobile | Undo | Redo | Zapisz│
├──────────┬──────────────────────────────────────────┬────────────────┤
│          │                                          │                │
│  LEFT    │             CANVAS                        │   INSPECTOR   │
│  SIDEBAR │         (live preview)                    │   (Right      │
│          │                                          │    Panel)     │
│  [Pages] │    ┌─────────────────────────────┐       │                │
│  [Layers]│    │                             │       │  General       │
│  [Assets]│    │     Responsive iframe       │       │  Layout        │
│  [Comps] │    │     z prawdziwą stroną      │       │  Spacing       │
│          │    │                             │       │  Typography    │
│          │    │     Kliknij → edytuj        │       │  Background    │
│          │    │     Przeciągnij → move      │       │  Border        │
│          │    │                             │       │  Shadow        │
│          │    └─────────────────────────────┘       │  Effects       │
│          │                                          │  Animation     │
│          │                                          │  Responsive    │
│          │                                          │  SEO           │
│          │                                          │  Custom CSS    │
├──────────┴──────────────────────────────────────────┴────────────────┤
│                      BOTTOM BAR                                      │
│  Responsive: Desktop | Tablet | Mobile |  Zoom: 100% |               │
│  Publish | Preview | History | AI Assistant                          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Toolbar (Top Bar)

### 2.1 Lewa sekcja
- **← Back** — powrót do dashboardu sklepu
- **Store Name** — nazwa sklepu + status (zapisano / niezapisane zmiany)
- **Store Slug** — wyświetlany drobnym fontem

### 2.2 Środkowa sekcja — Navigation Tabs
Przełączniki między głównymi widokami:

| Tab | Skrót | Opis |
|-----|-------|------|
| Pages | Ctrl+1 | Lista stron |
| Layers | Ctrl+2 | Drzewo warstw |
| Assets | Ctrl+3 | Biblioteka assetów |
| AI | Ctrl+4 | Panel asystenta AI |
| History | Ctrl+5 | Historia zmian |

### 2.3 Prawa sekcja — Akcje

| Akcja | Skrót | Opis |
|-------|-------|------|
| Undo | Ctrl+Z | Cofnij |
| Redo | Ctrl+Shift+Z | Ponów |
| Save | Ctrl+S | Zapisz |
| Publish | Ctrl+Shift+P | Publikuj |

---

## 3. Left Sidebar

### 3.1 Tab: Pages (C16.4)

```
Pages
├── Home          [slug: /]
├── Shop          [slug: /shop]
├── Product       [slug: /product]
├── Category      [slug: /category]
├── About         [slug: /about]
├── Contact       [slug: /contact]
├── Blog          [slug: /blog]
├── FAQ           [slug: /faq]
└── Policy        [slug: /policy]

[+ Add Page] [⚙ Settings]
```

Funkcje:
- Lista stron z nazwą i slugiem
- Kliknięcie → przełącza widok canvasu
- Drag & drop → reorder stron
- Right-click → Rename, Duplicate, Delete, Set as Home
- Ikona: globe, lock (jeśli zablokowana), eye (jeśli ukryta)
- Przycisk "+" → dodaj nową stronę
- Przycisk "⚙" → ustawienia globalne strony (SEO, meta)

### 3.2 Tab: Layers (C16.3)

```
Home
├── Navbar
│   ├── Logo
│   └── Menu
├── Hero
│   ├── Heading         [👁 🔒]
│   ├── Paragraph
│   └── Button
├── Features
│   ├── Feature 1
│   ├── Feature 2
│   └── Feature 3
├── Footer
│   ├── Logo
│   ├── Links
│   └── Copyright
└── ...
```

Funkcje:
- Drzewo hierarchiczne jak Photoshop
- **Drag & Drop** — przenoszenie między kontenerami
- **Ukrywanie** (👁) — toggle visibility
- **Blokowanie** (🔒) — blokada edycji
- **Grupowanie** — przeciągnięcie do kontenera
- **Search / Filter** — szybkie znajdowanie
- **Right-click menu**: Rename, Duplicate, Delete, Copy CSS
- **Kolorowe kropki** — typ sekcji (🟣 hero, 🟢 features, 🟡 footer)
- **Expand/Collapse** — dla kontenerów z dziećmi

### 3.3 Tab: Assets (C16.5)

```
Assets
├── Images
│   ├── logo.png
│   ├── hero-bg.jpg
│   ├── product-1.webp
│   └── ...
├── Videos
│   ├── intro.mp4
│   └── ...
├── SVGs
│   ├── icon-arrow.svg
│   └── ...
├── Icons
│   └── ... (Lucide / FontAwesome / Custom)
├── Fonts
│   ├── Inter
│   ├── Poppins
│   └── ...
└── Lottie
    └── animation.json

[+ Upload] [Search] [Filter by type]
```

Funkcje:
- Biblioteka mediów
- Upload drag & drop
- Grid / List view
- Podgląd (click → preview modal)
- Kopiuj URL, Insert do canvasu
- Wyszukiwarka + filtry (typ, data, rozmiar)

### 3.4 Tab: Components (C16.6)

```
Components
├── Hero
│   ├── Hero Basic
│   ├── Hero with Image
│   ├── Hero Video
│   └── Hero Split
├── CTA
│   ├── CTA Button
│   ├── CTA with Image
│   └── CTA Form
├── Features
│   ├── 3 Columns
│   ├── 4 Columns
│   ├── Grid
│   └── List
├── Pricing
│   ├── 3 Tiers
│   └── 4 Tiers
├── Testimonials
├── Gallery
├── FAQ
├── Footer
├── Contact
├── Product
├── Checkout
├── Blog
├── Portfolio
└── ... (1000+ docelowo)

[Search] [Categories] [Recently Used]
```

Kategorie (docelowo 50+):
```
Hero | CTA | Features | Pricing | Testimonials | Gallery | Timeline
FAQ | Footer | Newsletter | Contact | Product | Checkout
Blog | Portfolio | Restaurant | Fitness | Beauty | Medical
Law | Real Estate | Wedding | Music | Events
```

---

## 4. Canvas (C16.2 / C16.3 / C16.12)

### 4.1 Obszar canvasu
- **Prawdziwy podgląd strony** w iframe (nie wireframe)
- **Responsywny**: Desktop (1280px) | Tablet (768px) | Mobile (375px)
- **Zoom**: 25% – 200%
- **Grid overlay** — opcjonalne prowadnice
- **Rulers** — linijki (opcjonalnie)

### 4.2 Interakcje na canvasie
- **Kliknięcie** → selekcja elementu
- **Double-click** → edycja tekstu inline
- **Przeciągnij** → move / reorder
- **Hover** → podświetlenie + etykieta
- **Right-click** → context menu (Edit, Duplicate, Delete, Copy, Paste)
- **Ctrl+Click** → multi-select
- **Shift+Drag** → resize
- **Scroll** → zoom (Ctrl+Scroll) / przewijanie

### 4.3 Selekcyjne overlay
```
┌─────────────────────────────────────┐
│  ┌───────────────────────────────┐  │
│  │  Hero Banner    │  ┌──┐ ┌──┐ │  │
│  │  (#1 z 5)       │  │↑ │ │↓ │ │  │
│  │                  │  └──┘ └──┘ │  │
│  │  [🔗 select     │  ┌──┐ ┌──┐ │  │
│  │   parent]       │  │× │ │⏹│ │  │
│  │                  │  └──┘ └──┘ │  │
│  └───────────────────────────────┘  │
│                                      │
│  ┌───────────────────────────────┐  │
│  │  Features Grid               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 5. Inspector (Right Panel) — C16.15

### 5.1 Struktura

```
[Section Name: Hero Banner] [Type: hero] [⋮]
[DESKTOP | TABLET | MOBILE] 📱

▼ General
  ID: hero-1
  CSS Class: custom-hero
  Visible: ● Yes ○ No
  Locked: ○ Yes ● No

▼ Layout
  Display: [Flex ▼]
  Flex Direction: [Row ▼]
  Align Items: [Center ▼]
  Justify Content: [Center ▼]
  Gap: [16] px
  Width: [100] %
  Height: [Auto ▼]
  Min Height: [80] vh
  Max Width: [1200] px

▼ Spacing
  Padding: [20] [20] [40] [20] px
  Margin: [0] [Auto] [0] [Auto] px

▼ Typography
  Font Family: [Inter ▼]
  Font Weight: [700]
  Font Size: [48] px
  Line Height: [1.2]
  Letter Spacing: [-0.02] em
  Text Align: [Center ▼]
  Text Decoration: [None ▼]
  Text Transform: [None ▼]
  Color: [#FFFFFF]

▼ Background
  Type: [Gradient ▼]
  Gradient: [#7C3AED → #D946EF]
  Direction: [135°]

▼ Border
  Radius: [12] px
  Style: [Solid ▼]
  Color: [#FFFFFF20]
  Width: [1] px

▼ Shadow
  Type: [Drop Shadow ▼]
  X: [0] Y: [4]
  Blur: [20]
  Color: [#00000040]

▼ Effects
  Blur: [0]
  Opacity: [100] %
  Mix Blend Mode: [Normal ▼]
  Backdrop Blur: [0]

▼ Animation
  Entrance: [Fade In ▼]
  Duration: [0.5] s
  Delay: [0] s
  Easing: [Ease Out ▼]

▼ Responsive
  Hide on: [☐ Mobile] [☐ Tablet]
  Stack on: [☐ Mobile ▼]

▼ SEO
  Alt Text: [Hero banner image]
  Title: [Welcome to our store]
  Meta Description: [...]

▼ Accessibility
  ARIA Label: [Hero section]
  Role: [banner]

▼ Custom CSS
  ```css
  .custom-hero {
    /* custom styles */
  }
  ```
```

### 5.2 Kategorie Inspectora (kolejność)

1. **General** — ID, class, visibility, lock
2. **Layout** — display, flex/grid/absolute, width/height
3. **Spacing** — padding, margin, gap
4. **Typography** — font, size, weight, spacing, color
5. **Background** — color, gradient, image, video
6. **Border** — radius, style, width, color
7. **Shadow** — box-shadow, text-shadow
8. **Effects** — blur, opacity, blend mode, backdrop
9. **Animation** — entrance, exit, hover, scroll
10. **Responsive** — hide on, stack on, per-breakpoint
11. **SEO** — alt, title, meta
12. **Accessibility** — ARIA, role, tabindex
13. **Custom CSS** — raw CSS override

---

## 6. Bottom Bar

```
[● Desktop] [● Tablet] [● Mobile] | [🔍 100% ▼] | 
[👁 Preview] [📋 History] [🤖 AI] | [⚡ Publish]
```

### 6.1 Responsive switcher
- Desktop (1280px) — pełny widok
- Tablet (768px) — widok tabletu
- Mobile (375px) — widok mobilny
- **Aktywny breakpoint** podświetlony

### 6.2 Zoom
- Presety: 50%, 75%, 100%, 125%, 150%, 200%
- Fit to width / Fit to page
- Ctrl+Scroll → zoom in/out

### 6.3 Akcje
- **Preview** — otwiera podgląd w nowej karcie (bez chrome edytora)
- **History** — otwiera panel historii
- **AI** — otwiera panel asystenta AI
- **Publish** — uruchamia publikację

---

## 7. Keyboard Shortcuts

| Skrót | Akcja |
|-------|-------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save |
| Ctrl+Shift+P | Publish |
| Ctrl+C | Copy section |
| Ctrl+V | Paste section |
| Ctrl+D | Duplicate |
| Delete / Backspace | Delete |
| Ctrl+A | Select all |
| Ctrl+Click | Multi-select |
| Escape | Deselect / Close panel |
| Ctrl+1-5 | Switch tabs (Pages, Layers, Assets, AI, History) |
| Ctrl+[/] | Indent / Outdent (move to parent/child) |
| ↑↓←→ | Nudge 1px |
| Shift+↑↓←→ | Nudge 10px |
| Ctrl+Scroll | Zoom |
| Space+Drag | Pan canvas |
| Tab | Next field in Inspector |
| Enter | Confirm inline edit |
| / | Command Palette |

---

## 8. Command Palette

```
[🔍 Command Palette — Ctrl+K / Cmd+K]
┌─────────────────────────────────┐
│ > Add section...               │
│ > Change background...         │
│ > Duplicate page...           │
│ > Toggle responsive view...   │
│ > Search components...        │
│ > Run AI command...           │
│ > Quick publish...            │
└─────────────────────────────────┘
```

Funkcje:
- Szybkie wyszukiwanie akcji
- Fuzzy search
- Ostatnio używane komendy
- Skróty klawiszowe przy każdej komendzie
- AI: "Zmień kolor tła na niebieski" → wykonuje komendę

---

## 9. Stany UI

### 9.1 Empty State — nowa strona
```
Canvas pokazuje:
- Pustą stronę z komunikatem "Dodaj pierwszą sekcję"
- Przycisk "+" i przeciągnij z panelu komponentów
- Siatkę (opcjonalnie)
```

### 9.2 Loading State
```
- Skeleton loader dla paneli
- Spinner na canvasie
- "Ładowanie dokumentu..." z progress barem
```

### 9.3 Error State
```
- Czerwony banner: "Nie udało się zapisać. Spróbuj ponownie."
- Tooltip błędów walidacji przy każdym polu
- Auto-save retry (3 próby)
- "Ostatnia kopia zapasowa: 2 minuty temu" (link do przywrócenia)
```

### 9.4 Dirty State (niezapisane zmiany)
```
- Żółta kropka przy przycisku Save
- "Niezapisane zmiany" w Toolbarze
- Prompt przy próbie zamknięcia: "Masz niezapisane zmiany. Zamknąć?"
```

---

## 10. Responsywność UI

### 10.1 Minimum width: 1024px
Studio jest aplikacją desktopową. Minimalna szerokość: 1024px.

### 10.2 Adaptive layout
Na mniejszych ekranach:
- Sidebary zwijają się do ikon
- Inspector pokazuje się jako overlay (drawer)
- Canvas zajmuje pełną szerokość

### 10.3 Mobile preview
Mobile preview w canvasie symuluje wygląd na telefonie. UI Studio nie zmienia się w widok mobilny.

