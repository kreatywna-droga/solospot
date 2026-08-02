# C16.8 — WEB FACTOR Studio Component System

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 08_COMPONENT_SYSTEM.md  
> **Status:** Draft  
> **Zależności:** 01_STUDIO_ARCHITECTURE.md, 07_INSPECTOR.md

---

## 1. Cel

System komponentów to serce edytora. Każdy element na stronie (hero, przycisk, galeria, stopka) to komponent zarejestrowany w `ComponentRegistry`. 

**Obecnie:** ComponentRegistry istnieje, ale ma ograniczoną liczbę komponentów i płaską strukturę.
**Docelowo:** Biblioteka komponentów z kategoriami, wersjonowaniem i możliwością rozszerzania.

---

## 2. ComponentDescriptor

Każdy komponent jest opisany przez `ComponentDescriptor`:

```typescript
interface ComponentDescriptor {
  // Identyfikacja
  type: string;                    // unikalny identyfikator: "hero.basic"
  label: string;                   // "Hero Basic"
  category: string;                // "Hero"
  
  // Wygląd w palecie
  icon: string;                    // nazwa ikony Lucide lub SVG string
  thumbnail?: string;              // miniaturka (base64 lub URL)
  
  // Komponent
  schema: PropSchema[];           // schema właściwości
  defaultProps: Record<string, unknown>;  // domyślne wartości
  allowChildren: boolean;         // czy może mieć dzieci (container)
  maxChildren?: number;           // max liczba dzieci
  
  // Wyszukiwanie
  tags: string[];                 // tagi do wyszukiwania
  
  // Preview
  previewable: boolean;           // czy może być podglądany w canvasie
  
  // Wersja
  version: string;                // semver
  author: string;                 // autor komponentu
  description?: string;           // opis
}
```

---

## 3. Kategorie komponentów

### 3.1 Struktura kategorii (docelowo 50+)

```
HERO
├── Hero Basic              — nagłówek + przycisk
├── Hero with Image         — nagłówek + obrazek
├── Hero Video              — nagłówek + wideo w tle
├── Hero Split              — split layout (tekst | obraz)
├── Hero Animated           — nagłówek z animacją tła
├── Hero Particles          — z cząsteczkami w tle
├── Hero Gradient           — z gradientowym tłem
└── Hero Slider             — karuzela hero

CTA
├── CTA Button              — przycisk CTA
├── CTA with Image          — CTA + obrazek
├── CTA Form                — CTA + formularz
├── CTA Banner              — pasek CTA
└── CTA Split               — split layout CTA

FEATURES
├── Features 3 Columns      — 3 kolumny
├── Features 4 Columns      — 4 kolumny
├── Features Grid           — siatka funkcji
├── Features List           — lista funkcji
├── Features With Icons     — z ikonami
├── Features With Images    — z obrazkami
└── Features Timeline       — oś czasu funkcji

PRICING
├── Pricing 3 Tiers         — 3 poziomy
├── Pricing 4 Tiers         — 4 poziomy
├── Pricing Single          — pojedyncza cena
├── Pricing Comparison      — tabela porównawcza
└── Pricing with Calculator — kalkulator ceny

TESTIMONIALS
├── Testimonials Grid       — siatka opinii
├── Testimonials Slider     — karuzela
├── Testimonials Single     — pojedyncza opinia
├── Testimonials With Video — opinia + wideo
└── Testimonials Logo Bar   — logo klientów

GALLERY
├── Gallery Grid            — siatka zdjęć
├── Gallery Masonry         — masonry layout
├── Gallery Slider          — karuzela
├── Gallery Lightbox        — lightbox
└── Gallery Before/After    — przed/po

FAQ
├── FAQ Accordion           — akordeon
├── FAQ Grid                — siatka pytań
├── FAQ Tabs                — zakładki
└── FAQ Search              — z wyszukiwarką

FOOTER
├── Footer Simple           — prosta stopka
├── Footer With Links       — z linkami
├── Footer With Social      — z social mediami
├── Footer With Newsletter  — z newsletterem
└── Footer Mega             — rozbudowana stopka

CONTACT
├── Contact Form            — formularz kontaktowy
├── Contact Info            — dane kontaktowe
├── Contact Map             — mapa Google
├── Contact Split           — formularz + dane
└── Contact Booking         — rezerwacja terminu

PRODUCT
├── Product Grid            — siatka produktów
├── Product List            — lista produktów
├── Product Single          — pojedynczy produkt
├── Product Featured        — wyróżniony produkt
├── Product Carousel        — karuzela produktów
├── Product Category        — kategoria produktów
├── Product Search          — wyszukiwarka produktów
└── Product Filter          — filtrowanie produktów

BLOG
├── Blog Grid               — siatka wpisów
├── Blog List               — lista wpisów
├── Blog Single             — pojedynczy wpis
├── Blog Featured           — wyróżniony wpis
├── Blog Categories         — kategorie
├── Blog Tags               — tagi
├── Blog Author             — autor
└── Blog Comments           — komentarze

SPECIALIZED
├── Restaurant Menu         — menu restauracji
├── Fitness Schedule        — harmonogram treningów
├── Beauty Services         — usługi beauty
├── Medical Team            — zespół medyczny
├── Law Practice            — praktyka prawnicza
├── Real Estate Grid        — siatka nieruchomości
├── Wedding Details         — szczegóły ślubu
├── Music Player            — odtwarzacz muzyki
└── Events Calendar         — kalendarz wydarzeń

ELEMENTS (pojedyncze elementy)
├── Container               — pusty kontener (flex/grid/absolute)
├── Heading                 — nagłówek (H1-H6)
├── Paragraph               — paragraf tekstu
├── Button                  — przycisk
├── Image                   — obrazek
├── Video                   — wideo
├── Icon                    — ikona
├── Divider                 — linia oddzielająca
├── Spacer                  — odstęp
├── List                    — lista (ul/ol)
├── Table                   — tabela
├── Form                    — formularz
├── Input                   — pole input
├── Textarea                — pole textarea
├── Select                  — dropdown
├── Checkbox                — checkbox
└── Radio                   — radio button
```

---

## 4. Component Registry API

```typescript
// Rejestracja komponentu
registry.register({
  type: 'hero.basic',
  label: 'Hero Basic',
  category: 'Hero',
  icon: 'LayoutDashboard',
  schema: [
    stringProp({ key: 'title', label: 'Nagłówek', required: true, defaultValue: 'Welcome' }),
    textProp({ key: 'subtitle', label: 'Podtytuł', defaultValue: 'Best store ever' }),
    colorProp({ key: 'bgColor', label: 'Kolor tła', defaultValue: '#1a1a2e' }),
    imageProp({ key: 'backgroundImage', label: 'Obraz tła' }),
    numberProp({ key: 'fontSize', label: 'Rozmiar fontu', min: 24, max: 96, unit: 'px', defaultValue: 48 }),
  ],
  defaultProps: {
    title: 'Welcome to our store',
    subtitle: 'Discover amazing products',
    bgColor: '#1a1a2e',
    fontSize: 48,
  },
  allowChildren: false,
  tags: ['hero', 'header', 'welcome', 'banner'],
  previewable: true,
  version: '1.0.0',
  author: 'WEB FACTOR',
});
```

---

## 5. Kategorie w UI

### 5.1 Component Panel

```
┌──────────────────────────────────┐
│ [🔍 Search components...]        │
├──────────────────────────────────┤
│ [All] [Hero] [CTA] [Features]    │
│ [Pricing] [Gallery] [Footer]     │
│ [+ More ▼]                       │
├──────────────────────────────────┤
│                                  │
│  ▼ Hero                          │
│  ┌──┐ ┌──┐ ┌──┐ ┌──┐          │
│  │H1│ │H2│ │H3│ │H4│          │
│  │Ba│ │Im│ │Vi│ │Sp│          │
│  │si│ │ag│ │de│ │lit│          │
│  │c │ │e │ │o │ │  │          │
│  └──┘ └──┘ └──┘ └──┘          │
│                                  │
│  ▼ CTA                           │
│  ┌──┐ ┌──┐ ┌──┐                │
│  │Bu│ │Im│ │Fo│                │
│  │tt│ │ag│ │rm│                │
│  │on│ │e │ │  │                │
│  └──┘ └──┘ └──┘                │
└──────────────────────────────────┘
```

### 5.2 Drag z panelu

```typescript
// Przeciągnięcie komponentu z panelu na canvas
function handleDragFromPalette(descriptor: ComponentDescriptor) {
  // 1. Stwórz ghost (podgląd) pod kursorem
  // 2. Przeciągnij nad canvas
  // 3. Pokaż drop zones
  // 4. Upuść → dispatch(ADD_SECTION)
  dispatch({
    type: 'ADD_SECTION',
    pageId: canvas.selectedPageId,
    sectionType: descriptor.type,
    defaultProps: descriptor.defaultProps,
    label: descriptor.label,
  });
}
```

---

## 6. Własne komponenty użytkownika

Użytkownik może tworzyć własne komponenty:

### 6.1 Save as component

```typescript
// Zaznacz sekcję → Right-click → "Save as Component"
function saveAsComponent(section: SectionNode) {
  const descriptor: ComponentDescriptor = {
    type: `custom.${generateId()}`,
    label: 'Mój komponent',
    category: 'Custom',
    icon: 'Component',
    schema: extractSchemaFromProps(section.props),
    defaultProps: section.props,
    allowChildren: section.children.length > 0,
    tags: ['custom'],
    previewable: true,
    version: '1.0.0',
    author: 'user',
  };
  
  registry.register(descriptor);
  // Zapisz w bazie użytkownika
}
```

### 6.2 Zarządzanie komponentami

```
"My Components"
├── Custom Hero (v1)
├── Custom Footer (v2)
├── Product Card (v1)
└── ...

[Import] [Export] [Share with team]
```

---

## 7. Wersjonowanie komponentów

```typescript
interface ComponentVersion {
  type: string;
  version: string;           // semver
  descriptor: ComponentDescriptor;
  changelog: string;
  publishedAt: string;
  deprecated: boolean;
}
```

- Major — breaking changes w schema
- Minor — nowe pola
- Patch — bugfixy, domyślne wartości

---

## 8. Implementacja

### 8.1 Rozszerzenie istniejącego ComponentRegistry

```typescript
// packages/builder-core/src/ComponentRegistry.ts
// Rozszerzenie istniejącego registry o:
// - Wersjonowanie
// - Custom components
// - Import/Export
// - Search z tagami
// - Kategorie zagnieżdżone
```

### 8.2 Nowe pliki

```
src/components/builder/components/
├── ComponentPalette.tsx     — panel komponentów (lewy sidebar)
├── ComponentCard.tsx        — karta komponentu w palecie
├── ComponentSearch.tsx      — wyszukiwarka
├── CategoryTabs.tsx         — zakładki kategorii (już istnieje)
├── ComponentPreview.tsx     — podgląd komponentu (hover)
└── SaveAsComponent.tsx      — modal "zapisz jako komponent"
```

---

## 9. Integracja z Marketplace

Komponenty mogą być dystrybuowane przez Marketplace:

```typescript
interface MarketplaceComponent {
  type: string;
  label: string;
  category: string;
  publisher: string;
  version: string;
  rating: number;
  downloads: number;
  isInstalled: boolean;
  isFree: boolean;
  price?: number;
}
```

- Instalacja jednym kliknięciem
- Automatyczny update
- Oceny i recenzje
- Usage analytics

---

## 10. Performance

- Lazy loading komponentów (code splitting)
- Virtual scroll w ComponentPanel (dla 1000+)
- Caching schema w localStorage
- Async registry loading

