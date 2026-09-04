/**
 * ComponentRegistry — C6.1-A
 *
 * Editor-side component catalogue.  Every component that appears in the Builder's
 * insertion palette MUST be registered here with a full PropSchema.
 *
 * ARCHITECTURAL NOTE:
 *   This is parallel to (not extending) runtime-core's SectionRegistry.
 *   Runtime cares about rendering. The Builder registry cares about:
 *     - What props does this component accept?
 *     - How should the props panel render them?
 *     - What is the default state?
 *     - Which category does this appear under in the palette?
 *
 *   The `type` field is the shared key that connects the two registries.
 *   No other coupling exists.
 */

// ---------------------------------------------------------------------------
// Property Metadata — search, feature gating, deprecation, inline docs
// ---------------------------------------------------------------------------

export interface PropertyMetadata {
  /** Mark as experimental — hidden from non-developer users */
  readonly experimental?: boolean;
  /** Mark as enterprise-only — requires enterprise plan */
  readonly enterpriseOnly?: boolean;
  /** Mark as deprecated — shows warning in UI */
  readonly deprecated?: boolean;
  /** Readonly alias for hidden (schema.hidden takes precedence) */
  readonly hidden?: boolean;
  /** Link to documentation page */
  readonly documentation?: string;
  /** Search keywords for property search */
  readonly searchKeywords?: ReadonlyArray<string>;
  /** Lucide icon name for the field */
  readonly icon?: string;
  /** Arbitrary tags for filtering/categorization */
  readonly tags?: ReadonlyArray<string>;
}

// ---------------------------------------------------------------------------
// Prop schema — schema-driven UI generation
// ---------------------------------------------------------------------------

export type PropSchemaType =
  | 'string'        // single-line text
  | 'text'          // multi-line / richtext
  | 'number'        // numeric input
  | 'boolean'       // toggle
  | 'color'         // color picker
  | 'image'         // asset picker (URL or upload)
  | 'asset'         // generic asset (image, video, svg)
  | 'select'        // enum dropdown
  | 'multiselect'   // multi-value enum
  | 'range'         // slider control
  | 'array'         // repeatable sub-schema
  | 'object';       // nested prop group

export interface PropSchemaBase {
  readonly key: string;
  readonly label: string;
  readonly type: PropSchemaType;
  readonly required: boolean;
  readonly defaultValue?: unknown;
  readonly description?: string;
  readonly group?: string;              // logical grouping in props panel
  readonly hidden?: boolean;            // exists in schema but not shown in UI
  readonly metadata?: PropertyMetadata; // search, gating, deprecation, docs
}

export interface StringPropSchema extends PropSchemaBase {
  readonly type: 'string' | 'text';
  readonly placeholder?: string;
  readonly maxLength?: number;
}

export interface NumberPropSchema extends PropSchemaBase {
  readonly type: 'number';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number;
  readonly unit?: string;              // e.g. 'px', '%', 'rem'
}

export interface SelectPropSchema extends PropSchemaBase {
  readonly type: 'select' | 'multiselect';
  readonly options: ReadonlyArray<{ readonly label: string; readonly value: unknown }>;
}

export interface ArrayPropSchema extends PropSchemaBase {
  readonly type: 'array';
  readonly itemSchema: ReadonlyArray<PropSchema>;  // schema for each array item
  readonly maxItems?: number;
  readonly minItems?: number;
}

export interface ObjectPropSchema extends PropSchemaBase {
  readonly type: 'object';
  readonly fields: ReadonlyArray<PropSchema>;
}

export type PropSchema =
  | StringPropSchema
  | NumberPropSchema
  | SelectPropSchema
  | ArrayPropSchema
  | ObjectPropSchema
  | PropSchemaBase;  // covers color, image, asset, boolean

// ---------------------------------------------------------------------------
// Component descriptor
// ---------------------------------------------------------------------------

export interface ComponentDescriptor {
  readonly type: string;             // shared key with SectionRenderer.type in runtime-core
  readonly label: string;            // human-readable: "Hero Banner"
  readonly category: string;         // palette category: 'Hero', 'Products', 'Navigation', 'Layout'
  readonly icon: string;             // icon name (lucide) or inline SVG string
  readonly schema: ReadonlyArray<PropSchema>;
  readonly defaultProps: Record<string, unknown>;
  readonly defaultStyles?: Record<string, unknown>;
  readonly thumbnail?: string;       // base64 or URL for palette card preview
  readonly previewable: boolean;     // can render live preview in builder
  readonly allowChildren: boolean;   // if true, SectionNode.children[] is active (container)
  readonly maxChildren?: number;     // undefined = unlimited
  readonly tags?: ReadonlyArray<string>; // for search/filter
}

// ---------------------------------------------------------------------------
// Registry interface
// ---------------------------------------------------------------------------

export interface BuilderComponentRegistry {
  register(descriptor: ComponentDescriptor): BuilderComponentRegistry;
  unregister(type: string): boolean;
  get(type: string): ComponentDescriptor | undefined;
  getAll(): ReadonlyArray<ComponentDescriptor>;
  getByCategory(): ReadonlyMap<string, ReadonlyArray<ComponentDescriptor>>;
  has(type: string): boolean;
  search(query: string): ReadonlyArray<ComponentDescriptor>;
}

// ---------------------------------------------------------------------------
// Standard Component Descriptors
// ---------------------------------------------------------------------------

export const STANDARD_COMPONENT_DESCRIPTORS: ReadonlyArray<ComponentDescriptor> = [
  // 1. NAVIGATION
  {
    type: 'navbar',
    label: 'Nawigacja główna',
    category: 'Navigation',
    icon: 'Compass',
    previewable: true,
    allowChildren: false,
    schema: [
      selectProp({
        key: 'style',
        label: 'Styl nawigacji',
        required: false,
        group: 'layout',
        defaultValue: 'transparent',
        options: [
          { label: 'Przezroczysty', value: 'transparent' },
          { label: 'Pełny (ciemny)', value: 'solid' },
          { label: 'Szklany (glassmorphism)', value: 'glass' },
        ],
      }),
      booleanProp({ key: 'sticky', label: 'Przyklejony pasek (sticky)', required: false, group: 'layout', defaultValue: true }),
      stringProp({ key: 'brandName', label: 'Nazwa marki', required: false, group: 'content', defaultValue: 'SoloSpot' }),
    ],
    defaultProps: { style: 'transparent', sticky: true, brandName: 'SoloSpot' },
    tags: ['nav', 'header', 'menu', 'nawigacja'],
  },
  {
    type: 'header',
    label: 'Header Topbar',
    category: 'Navigation',
    icon: 'Layout',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'announcement', label: 'Tekst ogłoszenia', required: false, group: 'content', defaultValue: 'Darmowa dostawa od 150 zł' }),
      stringProp({ key: 'phone', label: 'Telefon kontaktowy', required: false, group: 'content', defaultValue: '+48 800 000 000' }),
    ],
    defaultProps: { announcement: 'Darmowa dostawa od 150 zł', phone: '+48 800 000 000' },
    tags: ['header', 'topbar', 'pasek', 'ogłoszenie'],
  },
  {
    type: 'breadcrumb',
    label: 'Okruszki (Breadcrumb)',
    category: 'Navigation',
    icon: 'Layers',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'separator', label: 'Separator', required: false, group: 'style', defaultValue: '/' }),
    ],
    defaultProps: { separator: '/' },
    tags: ['breadcrumb', 'nawigacja', 'ścieżka'],
  },
  {
    type: 'tabs',
    label: 'Nawigacja zakładkowa (Tabs)',
    category: 'Navigation',
    icon: 'Layers',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'tab1', label: 'Zakładka 1', required: false, group: 'content', defaultValue: 'Wszystkie' }),
      stringProp({ key: 'tab2', label: 'Zakładka 2', required: false, group: 'content', defaultValue: 'Nowości' }),
      stringProp({ key: 'tab3', label: 'Zakładka 3', required: false, group: 'content', defaultValue: 'Bestsellery' }),
    ],
    defaultProps: { tab1: 'Wszystkie', tab2: 'Nowości', tab3: 'Bestsellery' },
    tags: ['tabs', 'zakładki', 'kategorie'],
  },
  {
    type: 'footer',
    label: 'Stopka strony',
    category: 'Navigation',
    icon: 'Layout',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'text', label: 'Prawa autorskie', required: false, group: 'content', defaultValue: '© 2026 SoloSpot. Wszelkie prawa zastrzeżone.' }),
      stringProp({ key: 'links', label: 'Linki pomocnicze', required: false, group: 'content', defaultValue: 'Regulamin | Prywatność | Kontakt' }),
    ],
    defaultProps: { text: '© 2026 SoloSpot. Wszelkie prawa zastrzeżone.', links: 'Regulamin | Prywatność | Kontakt' },
    tags: ['stopka', 'footer', 'copyright'],
  },

  // 2. HERO
  {
    type: 'hero',
    label: 'Hero Banner',
    category: 'Hero',
    icon: 'Sparkles',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł nagłówka', required: false, group: 'content', defaultValue: 'Witaj w nowej erze sklepu' }),
      stringProp({ key: 'subtitle', label: 'Podtytuł', required: false, group: 'content', defaultValue: 'Odkryj najnowsze kolekcje i unikalne produkty stworzone dla Ciebie.' }),
      stringProp({ key: 'cta', label: 'Przycisk CTA', required: false, group: 'content', defaultValue: 'Rozpocznij zakupy' }),
      imageProp({ key: 'image', label: 'Obraz tła', required: false, group: 'content' }),
      colorProp({ key: 'overlayColor', label: 'Kolor nakładki', required: false, group: 'style' }),
    ],
    defaultProps: {
      title: 'Witaj w nowej erze sklepu',
      subtitle: 'Odkryj najnowsze kolekcje i unikalne produkty stworzone dla Ciebie.',
      cta: 'Rozpocznij zakupy',
      image: '',
    },
    tags: ['banner', 'hero', 'nagłówek', 'główny'],
  },
  {
    type: 'hero-split',
    label: 'Hero Split (50/50)',
    category: 'Hero',
    icon: 'Sparkles',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł', required: false, group: 'content', defaultValue: 'Styl, który Cię wyróżnia' }),
      stringProp({ key: 'description', label: 'Opis', required: false, group: 'content', defaultValue: 'Nasze autorskie kolekcje łączą nowoczesność, wygodę i perfekcję wykonania.' }),
      stringProp({ key: 'ctaText', label: 'Przycisk CTA', required: false, group: 'content', defaultValue: 'Odkryj kolekcję' }),
      imageProp({ key: 'image', label: 'Zdjęcie produktu', required: false, group: 'media' }),
    ],
    defaultProps: {
      title: 'Styl, który Cię wyróżnia',
      description: 'Nasze autorskie kolekcje łączą nowoczesność, wygodę i perfekcję wykonania.',
      ctaText: 'Odkryj kolekcję',
      image: '',
    },
    tags: ['hero', 'split', 'podzielony', '50/50'],
  },
  {
    type: 'hero-cta',
    label: 'Hero Minimal CTA',
    category: 'Hero',
    icon: 'Sparkles',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'badge', label: 'Etykieta / Badge', required: false, group: 'content', defaultValue: 'NOWOŚĆ 2026' }),
      stringProp({ key: 'title', label: 'Tytuł', required: false, group: 'content', defaultValue: 'Wszystko, czego potrzebujesz w jednym miejscu' }),
      stringProp({ key: 'cta', label: 'Przycisk główny', required: false, group: 'content', defaultValue: 'Dołącz teraz' }),
    ],
    defaultProps: { badge: 'NOWOŚĆ 2026', title: 'Wszystko, czego potrzebujesz w jednym miejscu', cta: 'Dołącz teraz' },
    tags: ['hero', 'cta', 'minimal'],
  },

  // 3. COMMERCE
  {
    type: 'product-grid',
    label: 'Siatka produktów',
    category: 'Commerce',
    icon: 'ShoppingBag',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Bestsellery i polecane' }),
      numberProp({ key: 'count', label: 'Liczba produktów', required: false, group: 'layout', defaultValue: 8, min: 2, max: 24 }),
      selectProp({ key: 'columns', label: 'Kolumny', required: false, group: 'layout', defaultValue: '4', options: [
        { label: '2 kolumny', value: '2' },
        { label: '3 kolumny', value: '3' },
        { label: '4 kolumny', value: '4' },
      ]}),
    ],
    defaultProps: { title: 'Bestsellery i polecane', count: 8, columns: '4' },
    tags: ['produkty', 'sklep', 'commerce', 'siatka'],
  },
  {
    type: 'category-grid',
    label: 'Kategorie produktów',
    category: 'Commerce',
    icon: 'Grid',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Przeglądaj kategorie' }),
    ],
    defaultProps: { title: 'Przeglądaj kategorie' },
    tags: ['kategorie', 'siatka', 'commerce'],
  },
  {
    type: 'pricing',
    label: 'Tabela cennika',
    category: 'Commerce',
    icon: 'ShoppingBag',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł cennika', required: false, group: 'content', defaultValue: 'Wybierz plan dla siebie' }),
      stringProp({ key: 'plan1', label: 'Plan 1', required: false, group: 'content', defaultValue: 'Starter — 49 zł' }),
      stringProp({ key: 'plan2', label: 'Plan 2', required: false, group: 'content', defaultValue: 'Pro — 99 zł' }),
      stringProp({ key: 'plan3', label: 'Plan 3', required: false, group: 'content', defaultValue: 'Enterprise — 199 zł' }),
    ],
    defaultProps: { title: 'Wybierz plan dla siebie', plan1: 'Starter — 49 zł', plan2: 'Pro — 99 zł', plan3: 'Enterprise — 199 zł' },
    tags: ['pricing', 'cennik', 'plany', 'subskrypcje'],
  },

  // 4. CONTENT
  {
    type: 'content',
    label: 'Sekcja tekstowa (Artykuł)',
    category: 'Content',
    icon: 'FileText',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Nagłówek', required: false, group: 'content', defaultValue: 'Nasza misja i wartości' }),
      textProp({ key: 'body', label: 'Treść', required: false, group: 'content', defaultValue: 'Tworzymy produkty najwyższej próby z pasją do innowacji i dbałością o każdy detal.' }),
      colorProp({ key: 'textColor', label: 'Kolor tekstu', required: false, group: 'typography' }),
    ],
    defaultProps: { title: 'Nasza misja i wartości', body: 'Tworzymy produkty najwyższej próby z pasją do innowacji i dbałością o każdy detal.' },
    tags: ['tekst', 'artykuł', 'o nas', 'content'],
  },
  {
    type: 'quote',
    label: 'Wyróżniony cytat',
    category: 'Content',
    icon: 'FileText',
    previewable: true,
    allowChildren: false,
    schema: [
      textProp({ key: 'quote', label: 'Treść cytatu', required: false, group: 'content', defaultValue: '„Jakość to nie przypadek, to wynik intencjonalnego działania i pasji.”' }),
      stringProp({ key: 'author', label: 'Autor', required: false, group: 'content', defaultValue: 'Jan Kowalski, Założyciel' }),
    ],
    defaultProps: { quote: '„Jakość to nie przypadek, to wynik intencjonalnego działania i pasji.”', author: 'Jan Kowalski, Założyciel' },
    tags: ['cytat', 'quote', 'sentencja'],
  },
  {
    type: 'faq',
    label: 'FAQ (Pytania i Odpowiedzi)',
    category: 'Content',
    icon: 'FileText',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji FAQ', required: false, group: 'content', defaultValue: 'Często zadawane pytania' }),
      stringProp({ key: 'q1', label: 'Pytanie 1', required: false, group: 'content', defaultValue: 'Jak wygląda czas realizacji zamówienia?' }),
      stringProp({ key: 'a1', label: 'Odpowiedź 1', required: false, group: 'content', defaultValue: 'Wysyłamy paczki w ciągu 24 godzin roboczych.' }),
    ],
    defaultProps: { title: 'Często zadawane pytania', q1: 'Jak wygląda czas realizacji zamówienia?', a1: 'Wysyłamy paczki w ciągu 24 godzin roboczych.' },
    tags: ['faq', 'pytania', 'pomoc', 'accordion'],
  },

  // 5. FEATURES
  {
    type: 'feature-grid',
    label: 'Zalety / Korzyści',
    category: 'Features',
    icon: 'Shield',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Dlaczego warto wybrać nasz sklep?' }),
      stringProp({ key: 'f1', label: 'Zaleta 1', required: false, group: 'content', defaultValue: 'Błyskawiczna dostawa 24h' }),
      stringProp({ key: 'f2', label: 'Zaleta 2', required: false, group: 'content', defaultValue: 'Bezpieczne płatności SSL' }),
      stringProp({ key: 'f3', label: 'Zaleta 3', required: false, group: 'content', defaultValue: '30 dni na darmowy zwrot' }),
    ],
    defaultProps: { title: 'Dlaczego warto wybrać nasz sklep?', f1: 'Błyskawiczna dostawa 24h', f2: 'Bezpieczne płatności SSL', f3: '30 dni na darmowy zwrot' },
    tags: ['cechy', 'korzyści', 'ikony', 'bezpieczeństwo'],
  },
  {
    type: 'stats',
    label: 'Statystyki i Liczby',
    category: 'Features',
    icon: 'TrendingUp',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Nasze osiągnięcia w liczbach' }),
      stringProp({ key: 'stat1', label: 'Liczba 1', required: false, group: 'content', defaultValue: '50 000+' }),
      stringProp({ key: 'label1', label: 'Opis 1', required: false, group: 'content', defaultValue: 'Zadowolonych klientów' }),
      stringProp({ key: 'stat2', label: 'Liczba 2', required: false, group: 'content', defaultValue: '99.8%' }),
      stringProp({ key: 'label2', label: 'Opis 2', required: false, group: 'content', defaultValue: 'Pozytywnych recenzji' }),
    ],
    defaultProps: { title: 'Nasze osiągnięcia w liczbach', stat1: '50 000+', label1: 'Zadowolonych klientów', stat2: '99.8%', label2: 'Pozytywnych recenzji' },
    tags: ['liczby', 'statystyki', 'sukcesy'],
  },

  // 6. MEDIA
  {
    type: 'gallery',
    label: 'Galeria / Lookbook',
    category: 'Media',
    icon: 'Image',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł galerii', required: false, group: 'content', defaultValue: 'Lookbook Kolekcji' }),
      stringProp({ key: 'subtitle', label: 'Podtytuł', required: false, group: 'content', defaultValue: 'Zobacz nasze produkty w obiektywie' }),
    ],
    defaultProps: { title: 'Lookbook Kolekcji', subtitle: 'Zobacz nasze produkty w obiektywie', images: [] },
    tags: ['zdjęcia', 'galeria', 'media', 'lookbook'],
  },
  {
    type: 'video-player',
    label: 'Odtwarzacz Wideo',
    category: 'Media',
    icon: 'Image',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł wideo', required: false, group: 'content', defaultValue: 'Obejrzyj nasz film promocyjny' }),
      stringProp({ key: 'videoUrl', label: 'Link URL do wideo / YouTube', required: false, group: 'media', defaultValue: '' }),
    ],
    defaultProps: { title: 'Obejrzyj nasz film promocyjny', videoUrl: '' },
    tags: ['video', 'film', 'media', 'youtube'],
  },

  // 7. SOCIAL PROOF
  {
    type: 'testimonials',
    label: 'Opinie i Recenzje',
    category: 'Social Proof',
    icon: 'Star',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Co mówią o nas klienci' }),
      stringProp({ key: 't1', label: 'Opinia 1', required: false, group: 'content', defaultValue: 'Najlepsza obsługa i błyskawiczna dostawa. Polecam!' }),
      stringProp({ key: 'a1', label: 'Autor 1', required: false, group: 'content', defaultValue: 'Anna Nowak ★★★★★' }),
    ],
    defaultProps: { title: 'Co mówią o nas klienci', t1: 'Najlepsza obsługa i błyskawiczna dostawa. Polecam!', a1: 'Anna Nowak ★★★★★' },
    tags: ['opinie', 'recenzje', 'social proof', 'gwiazdki'],
  },
  {
    type: 'logos',
    label: 'Logotypy Partnerów',
    category: 'Social Proof',
    icon: 'Globe',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł', required: false, group: 'content', defaultValue: 'Zaufali nam liderzy branży' }),
    ],
    defaultProps: { title: 'Zaufali nam liderzy branży' },
    tags: ['partnerzy', 'logotypy', 'zaufanie', 'brands'],
  },

  // 8. MARKETING
  {
    type: 'newsletter',
    label: 'Zapis na newsletter',
    category: 'Marketing',
    icon: 'Mail',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Zapisz się i odbierz 10% rabatu' }),
      stringProp({ key: 'subtitle', label: 'Opis', required: false, group: 'content', defaultValue: 'Bądź pierwszy, który dowie się o premierach i wyprzedażach.' }),
      stringProp({ key: 'cta', label: 'Tekst przycisku', required: false, group: 'content', defaultValue: 'Zapisz się' }),
    ],
    defaultProps: { title: 'Zapisz się i odbierz 10% rabatu', subtitle: 'Bądź pierwszy, który dowie się o premierach i wyprzedażach.', cta: 'Zapisz się' },
    tags: ['newsletter', 'email', 'marketing', 'rabat'],
  },
  {
    type: 'cta-banner',
    label: 'Baner Call to Action',
    category: 'Marketing',
    icon: 'Zap',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł banera', required: false, group: 'content', defaultValue: 'Wielka wyprzedaż sezonowa do -50%' }),
      stringProp({ key: 'cta', label: 'Przycisk', required: false, group: 'content', defaultValue: 'Skorzystaj z promocji' }),
    ],
    defaultProps: { title: 'Wielka wyprzedaż sezonowa do -50%', cta: 'Skorzystaj z promocji' },
    tags: ['cta', 'promocja', 'baner', 'wyprzedaż'],
  },

  // 9. CONTACT
  {
    type: 'contact',
    label: 'Formularz i Dane kontaktowe',
    category: 'Contact',
    icon: 'Phone',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Skontaktuj się z nami' }),
      stringProp({ key: 'phone', label: 'Telefon', required: false, group: 'content', defaultValue: '+48 123 456 789' }),
      stringProp({ key: 'email', label: 'E-mail', required: false, group: 'content', defaultValue: 'kontakt@sklep.pl' }),
      stringProp({ key: 'address', label: 'Adres', required: false, group: 'content', defaultValue: 'ul. Przykładowa 1, Warszawa' }),
    ],
    defaultProps: { title: 'Skontaktuj się z nami', phone: '+48 123 456 789', email: 'kontakt@sklep.pl', address: 'ul. Przykładowa 1, Warszawa' },
    tags: ['kontakt', 'telefon', 'email', 'adres', 'formularz'],
  },

  // 10. LAYOUT
  {
    type: 'container',
    label: 'Kontener uniwersalny (Flex / Grid)',
    category: 'Layout',
    icon: 'Box',
    previewable: true,
    allowChildren: true,
    schema: [
      selectProp({ key: 'display', label: 'Wyświetlanie', required: false, group: 'layout', defaultValue: 'flex-col', options: [
        { label: 'Flex Column (Pionowo)', value: 'flex-col' },
        { label: 'Flex Row (Poziomo)', value: 'flex-row' },
        { label: 'Grid 2 kolumny', value: 'grid-2' },
        { label: 'Grid 3 kolumny', value: 'grid-3' },
        { label: 'Grid 4 kolumny', value: 'grid-4' },
      ]}),
      selectProp({ key: 'padding', label: 'Padding wewnętrzny', required: false, group: 'spacing', defaultValue: 'md', options: [
        { label: 'Brak (0px)', value: 'none' },
        { label: 'Mały (16px)', value: 'sm' },
        { label: 'Średni (32px)', value: 'md' },
        { label: 'Duży (48px)', value: 'lg' },
        { label: 'Bardzo duży (64px)', value: 'xl' },
      ]}),
      stringProp({ key: 'gap', label: 'Odstęp (gap px)', required: false, group: 'spacing', defaultValue: '16' }),
      stringProp({ key: 'maxWidth', label: 'Maksymalna szerokość', required: false, group: 'layout', defaultValue: '1200px' }),
      colorProp({ key: 'background', label: 'Kolor tła', required: false, group: 'style' }),
    ],
    defaultProps: { display: 'flex-col', padding: 'md', gap: '16', maxWidth: '1200px', background: '' },
    tags: ['contener', 'layout', 'flex', 'grid', 'kolumny'],
  },

  // 11. ATOMIC ELEMENTS & SECTIONS (Phase 1 & 2)
  {
    type: 'section',
    label: 'Sekcja bazowa',
    category: 'Layout',
    icon: 'Layers',
    previewable: true,
    allowChildren: true,
    schema: [
      colorProp({ key: 'background', label: 'Kolor tła', required: false, group: 'style' }),
      selectProp({ key: 'padding', label: 'Wypełnienie (Padding)', required: false, group: 'spacing', defaultValue: 'md', options: [
        { label: 'Brak (0px)', value: 'none' },
        { label: 'Mały (24px)', value: 'sm' },
        { label: 'Średni (48px)', value: 'md' },
        { label: 'Duży (80px)', value: 'lg' },
        { label: 'Bardzo duży (120px)', value: 'xl' },
      ]}),
      stringProp({ key: 'minHeight', label: 'Minimalna wysokość (np. 400px)', required: false, group: 'layout', defaultValue: 'auto' }),
      selectProp({ key: 'maxWidth', label: 'Maksymalna szerokość', required: false, group: 'layout', defaultValue: '1280px', options: [
        { label: 'Pełna szerokość (100%)', value: '100%' },
        { label: 'Standard (1280px)', value: '1280px' },
        { label: 'Wąska (1024px)', value: '1024px' },
        { label: 'Tekstowa (800px)', value: '800px' },
      ]}),
    ],
    defaultProps: { padding: 'md', background: '#0a0a14', minHeight: 'auto', maxWidth: '1280px' },
    tags: ['sekcja', 'układ', 'layout', 'wiersz'],
  },
  {
    type: 'container',
    label: 'Kontener / Ramka',
    category: 'Layout',
    icon: 'Box',
    previewable: true,
    allowChildren: true,
    schema: [
      selectProp({ key: 'display', label: 'Układ wewnętrzny', required: false, group: 'layout', defaultValue: 'flex-col', options: [
        { label: 'Kolumna (flex-col)', value: 'flex-col' },
        { label: 'Wiersz (flex-row)', value: 'flex-row' },
        { label: 'Siatka 2 kolumny', value: 'grid-2' },
        { label: 'Siatka 3 kolumny', value: 'grid-3' },
        { label: 'Siatka 4 kolumny', value: 'grid-4' },
      ]}),
      selectProp({ key: 'alignItems', label: 'Wyrównanie elementów (Align)', required: false, group: 'layout', defaultValue: 'stretch', options: [
        { label: 'Rozciągnij (stretch)', value: 'stretch' },
        { label: 'Do początku (flex-start)', value: 'flex-start' },
        { label: 'Środek (center)', value: 'center' },
        { label: 'Do końca (flex-end)', value: 'flex-end' },
      ]}),
      selectProp({ key: 'justifyContent', label: 'Rozkład w osi głównej (Justify)', required: false, group: 'layout', defaultValue: 'flex-start', options: [
        { label: 'Do początku (flex-start)', value: 'flex-start' },
        { label: 'Środek (center)', value: 'center' },
        { label: 'Równomiernie (space-between)', value: 'space-between' },
        { label: 'Wokół (space-around)', value: 'space-around' },
      ]}),
      selectProp({ key: 'padding', label: 'Wewnętrzny odstęp (Padding)', required: false, group: 'spacing', defaultValue: 'md', options: [
        { label: 'Brak (0px)', value: 'none' },
        { label: 'Mały (16px)', value: 'sm' },
        { label: 'Średni (32px)', value: 'md' },
        { label: 'Duży (48px)', value: 'lg' },
        { label: 'Bardzo duży (64px)', value: 'xl' },
      ]}),
      stringProp({ key: 'gap', label: 'Odstęp między elementami (gap px)', required: false, group: 'spacing', defaultValue: '16' }),
      stringProp({ key: 'width', label: 'Szerokość (np. 100%, 400px)', required: false, group: 'layout', defaultValue: 'auto' }),
      stringProp({ key: 'height', label: 'Wysokość (np. auto, 250px)', required: false, group: 'layout', defaultValue: 'auto' }),
      colorProp({ key: 'background', label: 'Kolor tła', required: false, group: 'style' }),
      stringProp({ key: 'borderRadius', label: 'Zaokrąglenie rogów (np. 12px)', required: false, group: 'style', defaultValue: '12px' }),
      stringProp({ key: 'borderColor', label: 'Kolor obramowania', required: false, group: 'style' }),
      stringProp({ key: 'borderWidth', label: 'Grubość obramowania (np. 1px)', required: false, group: 'style', defaultValue: '0px' }),
    ],
    defaultProps: { display: 'flex-col', padding: 'md', gap: '16', width: 'auto', height: 'auto', background: '', borderRadius: '12px', borderWidth: '0px' },
    tags: ['contener', 'layout', 'flex', 'grid', 'kolumny'],
  },
  {
    type: 'heading',
    label: 'Nagłówek',
    category: 'Typography',
    icon: 'Heading',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'text', label: 'Tekst nagłówka', required: true, group: 'content', defaultValue: 'Nowoczesny nagłówek sekcji' }),
      selectProp({ key: 'level', label: 'Rozmiar semantyczny (H1-H4)', required: false, group: 'typography', defaultValue: 'h2', options: [
        { label: 'H1 — Tytuł strony (Bardzo duży)', value: 'h1' },
        { label: 'H2 — Tytuł sekcji (Duży)', value: 'h2' },
        { label: 'H3 — Podtytuł (Średni)', value: 'h3' },
        { label: 'H4 — Etykieta grupy (Mały)', value: 'h4' },
      ]}),
      selectProp({ key: 'fontFamily', label: 'Krój pisma (Font)', required: false, group: 'typography', defaultValue: 'Inter', options: [
        { label: 'Inter (Nowoczesny)', value: 'Inter' },
        { label: 'Outfit (Geometryczny)', value: 'Outfit' },
        { label: 'Playfair Display (Elegancki)', value: 'Playfair Display' },
        { label: 'Space Grotesk (Techniczny)', value: 'Space Grotesk' },
        { label: 'Roboto (Uniwersalny)', value: 'Roboto' },
      ]}),
      stringProp({ key: 'fontSize', label: 'Wielkość czcionki (np. 32px, 2.5rem)', required: false, group: 'typography' }),
      selectProp({ key: 'fontWeight', label: 'Grubość tekstu (Weight)', required: false, group: 'typography', defaultValue: 'bold', options: [
        { label: 'Normalny (400)', value: 'normal' },
        { label: 'Średni (500)', value: 'medium' },
        { label: 'Półgruby (600)', value: 'semibold' },
        { label: 'Pogrubiony (700)', value: 'bold' },
        { label: 'Bardzo gruby (800)', value: 'extrabold' },
      ]}),
      selectProp({ key: 'textAlign', label: 'Wyrównanie', required: false, group: 'typography', defaultValue: 'left', options: [
        { label: 'Do lewej', value: 'left' },
        { label: 'Środek', value: 'center' },
        { label: 'Do prawej', value: 'right' },
      ]}),
      stringProp({ key: 'lineHeight', label: 'Wysokość linii (np. 1.2, 1.4)', required: false, group: 'typography', defaultValue: '1.2' }),
      stringProp({ key: 'letterSpacing', label: 'Odstęp liter (np. -0.02em, 0.05em)', required: false, group: 'typography' }),
      colorProp({ key: 'color', label: 'Kolor tekstu', required: false, group: 'style' }),
    ],
    defaultProps: { text: 'Nowoczesny nagłówek sekcji', level: 'h2', fontFamily: 'Inter', textAlign: 'left', fontWeight: 'bold', lineHeight: '1.2', color: '#ffffff' },
    tags: ['nagłówek', 'tekst', 'tytuł', 'heading', 'h1', 'h2'],
  },
  {
    type: 'text',
    label: 'Akapit tekstu',
    category: 'Typography',
    icon: 'Type',
    previewable: true,
    allowChildren: false,
    schema: [
      textProp({ key: 'text', label: 'Treść akapitu', required: true, group: 'content', defaultValue: 'Wprowadź tekst opisu lub akapitu...' }),
      selectProp({ key: 'fontFamily', label: 'Krój pisma (Font)', required: false, group: 'typography', defaultValue: 'Inter', options: [
        { label: 'Inter (Nowoczesny)', value: 'Inter' },
        { label: 'Outfit (Geometryczny)', value: 'Outfit' },
        { label: 'Playfair Display (Elegancki)', value: 'Playfair Display' },
        { label: 'Space Grotesk (Techniczny)', value: 'Space Grotesk' },
        { label: 'Roboto (Uniwersalny)', value: 'Roboto' },
      ]}),
      stringProp({ key: 'fontSize', label: 'Wielkość czcionki (np. 16px)', required: false, group: 'typography', defaultValue: '16px' }),
      selectProp({ key: 'fontWeight', label: 'Grubość tekstu', required: false, group: 'typography', defaultValue: 'normal', options: [
        { label: 'Normalny (400)', value: 'normal' },
        { label: 'Średni (500)', value: 'medium' },
        { label: 'Półgruby (600)', value: 'semibold' },
        { label: 'Pogrubiony (700)', value: 'bold' },
      ]}),
      selectProp({ key: 'textAlign', label: 'Wyrównanie', required: false, group: 'typography', defaultValue: 'left', options: [
        { label: 'Do lewej', value: 'left' },
        { label: 'Środek', value: 'center' },
        { label: 'Do prawej', value: 'right' },
      ]}),
      stringProp({ key: 'lineHeight', label: 'Wysokość linii (np. 1.6)', required: false, group: 'typography', defaultValue: '1.6' }),
      colorProp({ key: 'color', label: 'Kolor tekstu', required: false, group: 'style' }),
    ],
    defaultProps: { text: 'Wprowadź tekst opisu lub akapitu...', fontFamily: 'Inter', fontSize: '16px', textAlign: 'left', fontWeight: 'normal', lineHeight: '1.6', color: '#94a3b8' },
    tags: ['tekst', 'opis', 'akapit', 'paragraph'],
  },
  {
    type: 'button',
    label: 'Przycisk akcji',
    category: 'Elements',
    icon: 'Square',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'text', label: 'Etykieta przycisku', required: true, group: 'content', defaultValue: 'Kliknij tutaj' }),
      stringProp({ key: 'url', label: 'Adres URL (Link docelowy)', required: false, group: 'link', defaultValue: '#' }),
      selectProp({ key: 'variant', label: 'Styl przycisku', required: false, group: 'style', defaultValue: 'primary', options: [
        { label: 'Główny (Wypełniony)', value: 'primary' },
        { label: 'Drugorzędny (Ciemny)', value: 'secondary' },
        { label: 'Kontur (Outline)', value: 'outline' },
      ]}),
      colorProp({ key: 'background', label: 'Kolor tła przycisku', required: false, group: 'style' }),
      colorProp({ key: 'textColor', label: 'Kolor tekstu', required: false, group: 'style' }),
      stringProp({ key: 'borderRadius', label: 'Zaokrąglenie (np. 12px, 9999px)', required: false, group: 'style', defaultValue: '12px' }),
      stringProp({ key: 'padding', label: 'Padding (np. 12px 24px)', required: false, group: 'style', defaultValue: '10px 20px' }),
    ],
    defaultProps: { text: 'Kliknij tutaj', url: '#', variant: 'primary', background: '#7c3aed', textColor: '#ffffff', borderRadius: '12px', padding: '10px 20px' },
    tags: ['przycisk', 'button', 'cta', 'akcja'],
  },
  {
    type: 'image',
    label: 'Zdjęcie / Obraz',
    category: 'Media',
    icon: 'Image',
    previewable: true,
    allowChildren: false,
    schema: [
      imageProp({ key: 'src', label: 'Adres URL zdjęcia', required: true, group: 'content', defaultValue: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80' }),
      stringProp({ key: 'alt', label: 'Tekst alternatywny (Alt)', required: false, group: 'seo', defaultValue: 'Zdjęcie produktu' }),
      stringProp({ key: 'width', label: 'Szerokość (np. 100%, 400px)', required: false, group: 'layout', defaultValue: '100%' }),
      stringProp({ key: 'height', label: 'Wysokość (np. auto, 300px)', required: false, group: 'layout', defaultValue: 'auto' }),
      selectProp({ key: 'objectFit', label: 'Dopasowanie (Object Fit)', required: false, group: 'layout', defaultValue: 'cover', options: [
        { label: 'Cover (Wypełnij)', value: 'cover' },
        { label: 'Contain (Zmieść)', value: 'contain' },
        { label: 'Fill (Rozciągnij)', value: 'fill' },
      ]}),
      stringProp({ key: 'borderRadius', label: 'Zaokrąglenie (np. 12px)', required: false, group: 'style', defaultValue: '12px' }),
    ],
    defaultProps: { src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80', alt: 'Zdjęcie produktu', width: '100%', height: 'auto', objectFit: 'cover', borderRadius: '12px' },
    tags: ['zdjęcie', 'obraz', 'image', 'grafika', 'foto'],
  },
];

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createBuilderComponentRegistry(): BuilderComponentRegistry {
  const store = new Map<string, ComponentDescriptor>();

  // Pre-populate with standard components
  for (const descriptor of STANDARD_COMPONENT_DESCRIPTORS) {
    store.set(descriptor.type, descriptor);
  }

  return {
    register(descriptor) {
      store.set(descriptor.type, descriptor);
      return this;
    },

    unregister(type) {
      return store.delete(type);
    },

    get(type) {
      return store.get(type);
    },

    getAll() {
      return Array.from(store.values());
    },

    getByCategory() {
      const byCategory = new Map<string, ComponentDescriptor[]>();
      for (const descriptor of store.values()) {
        const existing = byCategory.get(descriptor.category) ?? [];
        existing.push(descriptor);
        byCategory.set(descriptor.category, existing);
      }
      // sort within each category by label
      for (const [cat, items] of byCategory) {
        byCategory.set(cat, [...items].sort((a, b) => a.label.localeCompare(b.label)));
      }
      return byCategory as ReadonlyMap<string, ReadonlyArray<ComponentDescriptor>>;
    },

    has(type) {
      return store.has(type);
    },

    search(query) {
      const q = query.toLowerCase().trim();
      if (!q) return this.getAll();
      return Array.from(store.values()).filter(d =>
        d.label.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        d.tags?.some(t => t.toLowerCase().includes(q))
      );
    },
  };
}

// ---------------------------------------------------------------------------
// Helper — build a simple prop schema quickly
// ---------------------------------------------------------------------------

export function stringProp(params: Omit<StringPropSchema, 'type'>): StringPropSchema {
  return { type: 'string', ...params };
}

export function textProp(params: Omit<StringPropSchema, 'type'>): StringPropSchema {
  return { type: 'text', ...params };
}

export function colorProp(params: Omit<PropSchemaBase, 'type'>): PropSchemaBase {
  return { type: 'color', ...params };
}

export function imageProp(params: Omit<PropSchemaBase, 'type'>): PropSchemaBase {
  return { type: 'image', ...params };
}

export function booleanProp(params: Omit<PropSchemaBase, 'type'>): PropSchemaBase {
  return { type: 'boolean', ...params };
}

export function selectProp(
  params: Omit<SelectPropSchema, 'type'>
): SelectPropSchema {
  return { type: 'select', ...params };
}

export function numberProp(params: Omit<NumberPropSchema, 'type'>): NumberPropSchema {
  return { type: 'number', ...params };
}

export function arrayProp(params: Omit<ArrayPropSchema, 'type'>): ArrayPropSchema {
  return { type: 'array', ...params };
}
