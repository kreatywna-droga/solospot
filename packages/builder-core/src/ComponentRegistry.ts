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
  {
    type: 'navbar',
    label: 'Nawigacja',
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
          { label: 'Pełny', value: 'solid' },
        ],
      }),
      booleanProp({
        key: 'sticky',
        label: 'Przyklejony pasek (sticky)',
        required: false,
        group: 'layout',
        defaultValue: true,
      }),
    ],
    defaultProps: { style: 'transparent', sticky: true },
    tags: ['nav', 'header', 'menu'],
  },
  {
    type: 'hero',
    label: 'Hero Banner',
    category: 'Hero',
    icon: 'Sparkles',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł nagłówka', required: false, group: 'content', defaultValue: 'Witaj w naszym sklepie' }),
      stringProp({ key: 'subtitle', label: 'Podtytuł', required: false, group: 'content', defaultValue: 'Odkryj najnowsze kolekcje i wyjątkowe produkty' }),
      stringProp({ key: 'cta', label: 'Tekst przycisku CTA', required: false, group: 'content', defaultValue: 'Zobacz ofertę' }),
      imageProp({ key: 'image', label: 'Obraz tła', required: false, group: 'content' }),
    ],
    defaultProps: {
      title: 'Witaj w naszym sklepie',
      subtitle: 'Odkryj najnowsze kolekcje i wyjątkowe produkty',
      cta: 'Zobacz ofertę',
      image: '',
    },
    tags: ['banner', 'hero', 'nagłówek'],
  },
  {
    type: 'category-grid',
    label: 'Kategorie produktów',
    category: 'Commerce',
    icon: 'Grid',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Kategorie' }),
    ],
    defaultProps: { title: 'Kategorie' },
    tags: ['kategorie', 'siatka', 'commerce'],
  },
  {
    type: 'product-grid',
    label: 'Siatka produktów',
    category: 'Commerce',
    icon: 'ShoppingBag',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Polecane produkty' }),
      numberProp({ key: 'count', label: 'Liczba produktów', required: false, group: 'layout', defaultValue: 8, min: 2, max: 24 }),
    ],
    defaultProps: { title: 'Polecane produkty', count: 8 },
    tags: ['produkty', 'sklep', 'commerce', 'siatka'],
  },
  {
    type: 'gallery',
    label: 'Galeria / Lookbook',
    category: 'Media',
    icon: 'Image',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł galerii', required: false, group: 'content', defaultValue: 'Lookbook' }),
    ],
    defaultProps: { title: 'Lookbook', images: [] },
    tags: ['zdjęcia', 'galeria', 'media'],
  },
  {
    type: 'testimonials',
    label: 'Opinie klientów',
    category: 'Social Proof',
    icon: 'Star',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Co mówią nasi klienci' }),
    ],
    defaultProps: { title: 'Co mówią nasi klienci' },
    tags: ['opinie', 'recenzje', 'social proof'],
  },
  {
    type: 'newsletter',
    label: 'Zapis na newsletter',
    category: 'Marketing',
    icon: 'Mail',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Zapisz się do newslettera' }),
      stringProp({ key: 'cta', label: 'Tekst przycisku', required: false, group: 'content', defaultValue: 'Zapisz się' }),
    ],
    defaultProps: { title: 'Zapisz się do newslettera', cta: 'Zapisz się' },
    tags: ['newsletter', 'email', 'marketing'],
  },
  {
    type: 'footer',
    label: 'Stopka',
    category: 'Navigation',
    icon: 'Layout',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'text', label: 'Tekst praw autorskich', required: false, group: 'content', defaultValue: '2026 SoloSpot. Wszelkie prawa zastrzeżone.' }),
    ],
    defaultProps: { text: '2026 SoloSpot. Wszelkie prawa zastrzeżone.' },
    tags: ['stopka', 'footer', 'copyright'],
  },
  {
    type: 'contact',
    label: 'Formularz / Dane kontaktowe',
    category: 'Contact',
    icon: 'Phone',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Kontakt' }),
      stringProp({ key: 'phone', label: 'Telefon', required: false, group: 'content', defaultValue: '+48 123 456 789' }),
      stringProp({ key: 'address', label: 'Adres', required: false, group: 'content', defaultValue: 'ul. Przykładowa 1, Warszawa' }),
    ],
    defaultProps: { title: 'Kontakt', phone: '+48 123 456 789', address: 'ul. Przykładowa 1, Warszawa' },
    tags: ['kontakt', 'telefon', 'adres'],
  },
  {
    type: 'content',
    label: 'Sekcja tekstowa',
    category: 'Content',
    icon: 'FileText',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Nagłówek', required: false, group: 'content', defaultValue: 'O nas' }),
      textProp({ key: 'body', label: 'Treść', required: false, group: 'content', defaultValue: 'Jesteśmy marką stawiającą na jakość i pasję.' }),
    ],
    defaultProps: { title: 'O nas', body: 'Jesteśmy marką stawiającą na jakość i pasję.' },
    tags: ['tekst', 'artykuł', 'o nas'],
  },
  {
    type: 'feature-grid',
    label: 'Zalety / Korzyści',
    category: 'Features',
    icon: 'Shield',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Dlaczego my?' }),
    ],
    defaultProps: { title: 'Dlaczego my?' },
    tags: ['cechy', 'korzyści', 'ikony'],
  },
  {
    type: 'stats',
    label: 'Statystyki i liczby',
    category: 'Features',
    icon: 'TrendingUp',
    previewable: true,
    allowChildren: false,
    schema: [
      stringProp({ key: 'title', label: 'Tytuł sekcji', required: false, group: 'content', defaultValue: 'Nasze liczby' }),
    ],
    defaultProps: { title: 'Nasze liczby' },
    tags: ['liczby', 'statystyki', 'sukcesy'],
  },
  {
    type: 'container',
    label: 'Contener',
    category: 'Layout',
    icon: 'Box',
    previewable: true,
    allowChildren: true,
    schema: [
      selectProp({ key: 'display', label: 'Wyświetlanie', required: false, group: 'layout', defaultValue: 'flex', options: [
        { label: 'Block', value: 'block' },
        { label: 'Flex (Column)', value: 'flex-col' },
        { label: 'Flex (Row)', value: 'flex-row' },
        { label: 'Grid 2 col', value: 'grid-2' },
        { label: 'Grid 3 col', value: 'grid-3' },
        { label: 'Grid 4 col', value: 'grid-4' },
      ]}),
      selectProp({ key: 'padding', label: 'Padding', required: false, group: 'spacing', defaultValue: 'md', options: [
        { label: 'Brak', value: 'none' },
        { label: 'Mały (16px)', value: 'sm' },
        { label: 'Średni (32px)', value: 'md' },
        { label: 'Duży (48px)', value: 'lg' },
        { label: 'Bardzo duży (64px)', value: 'xl' },
      ]}),
      stringProp({ key: 'gap', label: 'Odstęp między dziećmi', required: false, group: 'spacing', defaultValue: '16' }),
      selectProp({ key: 'align', label: 'Wyrównanie', required: false, group: 'alignment', defaultValue: 'stretch', options: [
        { label: 'Rozciągnięty', value: 'stretch' },
        { label: 'Lewo', value: 'start' },
        { label: 'Środek', value: 'center' },
        { label: 'Prawo', value: 'end' },
      ]}),
      stringProp({ key: 'maxWidth', label: 'Maks. szerokość', required: false, group: 'layout', defaultValue: '1200px' }),
      stringProp({ key: 'background', label: 'Kolor tła', required: false, group: 'style', defaultValue: '' }),
    ],
    defaultProps: { display: 'flex-col', padding: 'md', gap: '16', align: 'stretch', maxWidth: '1200px', background: '' },
    tags: ['contener', 'layout', 'opakowanie', 'flex', 'grid'],
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
