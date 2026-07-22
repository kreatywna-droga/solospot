/**
 * BuilderDocument — C6.1-A
 *
 * The mutable, editor-side model of a store's visual structure.
 *
 * ARCHITECTURAL INVARIANT:
 *   BuilderDocument is NOT a mutable StoreConfig.
 *   It is the editor's working model, separated from runtime concerns.
 *   The only integration point to Runtime/Publish is:
 *
 *     compile(BuilderDocument) → StoreConfig → PublishRequest
 *
 *   The Builder must NEVER import directly from runtime-core or publish-core.
 *   That dependency flows one way only, through compile().
 */

// ---------------------------------------------------------------------------
// Core identity & metadata
// ---------------------------------------------------------------------------

export interface BuilderMetadata {
  readonly storeName: string;
  readonly storeSlug: string;
  readonly locale: string;
  readonly currency: string;
  readonly description?: string;
}

// ---------------------------------------------------------------------------
// Theme — editor-side branding model
// ---------------------------------------------------------------------------

export interface BuilderTheme {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logo?: string;
  favicon?: string;
  backgroundColor?: string;
  borderRadius?: string;
}

// ---------------------------------------------------------------------------
// SEO — per-page
// ---------------------------------------------------------------------------

export interface BuilderSEO {
  title?: string;
  description?: string;
  ogImage?: string;
  robots?: string;
  canonicalUrl?: string;
}

// ---------------------------------------------------------------------------
// Section tree — recursive (supports containers, grids, nested blocks)
// ---------------------------------------------------------------------------

/**
 * SectionNode is the core structural unit of the Builder document tree.
 * Using a recursive children[] instead of a flat sections[] allows:
 *   - Layout containers (2-column, grid)
 *   - Nested sections (accordion, tabs)
 *   - Future: slot-based composition
 */
export interface SectionNode {
  readonly id: string;
  type: string;             // matches ComponentDescriptor.type
  label: string;
  props: Record<string, unknown>;
  children: SectionNode[]; // empty [] for leaf sections
  visible: boolean;
  locked: boolean;          // prevents prop editing; doesn't prevent deletion
  order: number;            // sibling-level ordering (0-based, contiguous)
}

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export interface BuilderPage {
  readonly id: string;
  slug: string;
  name: string;
  sections: SectionNode[];  // root-level tree of this page
  seo: BuilderSEO;
  isHome: boolean;
}

// ---------------------------------------------------------------------------
// Root document
// ---------------------------------------------------------------------------

export interface BuilderDocument {
  readonly id: string;           // stable store identifier
  readonly tenantId: string;
  version: number;               // monotonically increasing, bumped on every mutation
  metadata: BuilderMetadata;
  pages: BuilderPage[];
  theme: BuilderTheme;
  isDirty: boolean;              // true when unpublished changes exist
  createdAt: number;             // Unix ms
  updatedAt: number;             // Unix ms
}

// ---------------------------------------------------------------------------
// Compiled output types
// (mirrors runtime-core contracts — copied by value, no import dependency)
// ---------------------------------------------------------------------------

/**
 * CompiledPage is the output of compile() that downstream consumers
 * (runtime-core, publish-core) can safely consume without knowing about
 * the Builder's internal model.
 */
export interface CompiledSection {
  readonly id: string;
  readonly type: string;
  readonly label: string;
  readonly props: Record<string, unknown>;
  readonly order: number;
  readonly visible: boolean;
  // Note: compiled output is FLAT — children are hoisted with prefixed IDs
  // Container sections get a special 'children' prop with compiled child IDs
}

export interface CompiledPage {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly sections: ReadonlyArray<CompiledSection>;
  readonly seo: Readonly<BuilderSEO>;
}

export interface CompiledBranding {
  readonly primaryColor: string;
  readonly secondaryColor: string;
  readonly font: string;
  readonly logo?: string;
  readonly favicon?: string;
  readonly description?: string;
  readonly backgroundColor?: string;
  readonly borderRadius?: string;
}

/**
 * CompiledDocument is the output of BuilderDocument.compile().
 * It mirrors the shape expected by StoreConfig in runtime-core.
 * This is the ONLY bridge between Builder and Runtime.
 */
export interface CompiledDocument {
  readonly storeId: string;
  readonly tenantId: string;
  readonly storeName: string;
  readonly storeSlug: string;
  readonly publicationStatus: 'DRAFT' | 'PUBLISHED';
  readonly branding: CompiledBranding;
  readonly pages: ReadonlyArray<CompiledPage>;
  readonly locale: string;
  readonly currency: string;
  readonly compiledAt: string;
  readonly builderVersion: number;
}

// ---------------------------------------------------------------------------
// Factory functions
// ---------------------------------------------------------------------------

export function createBuilderDocument(params: {
  id: string;
  tenantId: string;
  metadata: BuilderMetadata;
  theme?: Partial<BuilderTheme>;
}): BuilderDocument {
  const now = Date.now();
  return {
    id: params.id,
    tenantId: params.tenantId,
    version: 1,
    metadata: params.metadata,
    pages: [createBuilderPage({ id: `page_home_${params.id}`, slug: '/', name: 'Home', isHome: true })],
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#f1f5f9',
      font: 'Inter',
      backgroundColor: '#ffffff',
      borderRadius: '8px',
      ...params.theme,
    },
    isDirty: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function createBuilderPage(params: {
  id: string;
  slug: string;
  name: string;
  isHome?: boolean;
  sections?: SectionNode[];
}): BuilderPage {
  return {
    id: params.id,
    slug: params.slug,
    name: params.name,
    sections: params.sections ?? [],
    seo: {},
    isHome: params.isHome ?? false,
  };
}

export function createSectionNode(params: {
  id: string;
  type: string;
  label?: string;
  props?: Record<string, unknown>;
  order?: number;
}): SectionNode {
  return {
    id: params.id,
    type: params.type,
    label: params.label ?? params.type,
    props: params.props ?? {},
    children: [],
    visible: true,
    locked: false,
    order: params.order ?? 0,
  };
}

// ---------------------------------------------------------------------------
// compile() — the ONLY bridge from Builder to Runtime/Publish
// ---------------------------------------------------------------------------

function flattenNode(node: SectionNode, parentOrder: number): CompiledSection[] {
  const compiled: CompiledSection = {
    id: node.id,
    type: node.type,
    label: node.label,
    props: node.children.length > 0
      ? { ...node.props, _childIds: node.children.map(c => c.id) }
      : node.props,
    order: parentOrder,
    visible: node.visible,
  };

  const result: CompiledSection[] = [compiled];

  for (let i = 0; i < node.children.length; i++) {
    const childFlattened = flattenNode(node.children[i], i);
    result.push(...childFlattened);
  }

  return result;
}

export function compile(doc: BuilderDocument): CompiledDocument {
  const compiledPages: CompiledPage[] = doc.pages.map(page => {
    const sections: CompiledSection[] = [];
    page.sections.forEach((node, idx) => {
      sections.push(...flattenNode(node, idx));
    });

    return {
      id: page.id,
      slug: page.slug,
      name: page.name,
      sections,
      seo: { ...page.seo },
    };
  });

  return {
    storeId: doc.id,
    tenantId: doc.tenantId,
    storeName: doc.metadata.storeName,
    storeSlug: doc.metadata.storeSlug,
    publicationStatus: doc.isDirty ? 'DRAFT' : 'PUBLISHED',
    branding: {
      primaryColor: doc.theme.primaryColor,
      secondaryColor: doc.theme.secondaryColor,
      font: doc.theme.font,
      logo: doc.theme.logo,
      favicon: doc.theme.favicon,
      backgroundColor: doc.theme.backgroundColor,
      borderRadius: doc.theme.borderRadius,
    },
    pages: compiledPages,
    locale: doc.metadata.locale,
    currency: doc.metadata.currency,
    compiledAt: new Date().toISOString(),
    builderVersion: doc.version,
  };
}

/**
 * Bump version and mark dirty. Call after every mutation.
 * Returns a new document reference (immutable update).
 */
export function touchDocument(doc: BuilderDocument): BuilderDocument {
  return {
    ...doc,
    version: doc.version + 1,
    isDirty: true,
    updatedAt: Date.now(),
  };
}
