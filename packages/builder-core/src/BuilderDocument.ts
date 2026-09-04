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

export interface BuilderDesignTokens {
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    surface?: string;
    text?: string;
    muted?: string;
    accent?: string;
    border?: string;
  };
  typography?: {
    headingFont?: string;
    bodyFont?: string;
    h1Size?: string;
    h2Size?: string;
    h3Size?: string;
    bodySize?: string;
  };
  spacing?: {
    xs?: string;
    sm?: string;
    md?: string;
    lg?: string;
    xl?: string;
  };
  radius?: {
    sm?: string;
    md?: string;
    lg?: string;
    full?: string;
  };
}

export interface BuilderTheme {
  primaryColor: string;
  secondaryColor: string;
  font: string;
  logo?: string;
  favicon?: string;
  backgroundColor?: string;
  borderRadius?: string;
  tokens?: BuilderDesignTokens;
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
// Node tree — hierarchical & universal (supports sections, containers, elements)
// ---------------------------------------------------------------------------

export type NodeType =
  | 'section'
  | 'container'
  | 'heading'
  | 'text'
  | 'button'
  | 'image'
  | 'video'
  | 'icon'
  | 'divider'
  | 'spacer'
  | 'grid'
  | 'flex'
  | 'box'
  | string;

export interface NodeStyles {
  width?: string;
  height?: string;
  minWidth?: string;
  maxWidth?: string;
  minHeight?: string;
  maxHeight?: string;
  padding?: { top?: string; right?: string; bottom?: string; left?: string } | string;
  margin?: { top?: string; right?: string; bottom?: string; left?: string } | string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  fontFamily?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  borderRadius?: string;
  borderWidth?: string;
  borderColor?: string;
  borderStyle?: string;
  boxShadow?: string;
  opacity?: number;
  display?: string;
  flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  alignItems?: string;
  justifyContent?: string;
  gap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
  zIndex?: number;
  position?: 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
  customCss?: string;
}

export interface NodeResponsive {
  desktop?: Partial<NodeStyles>;
  tablet?: Partial<NodeStyles>;
  mobile?: Partial<NodeStyles>;
  hiddenOn?: Array<'desktop' | 'tablet' | 'mobile'>;
}

/**
 * BuilderNode is the universal hierarchical structural unit of the Builder document tree.
 * Supports: Page -> Section -> Container -> Elements (Heading, Text, Button, Image, etc.)
 */
export interface BuilderNode {
  readonly id: string;
  type: NodeType;
  label: string;
  parentId?: string | null;
  props: Record<string, unknown>;
  styles?: NodeStyles;
  responsive?: NodeResponsive;
  responsiveProps?: Record<string, Record<string, unknown>>;
  metadata?: Record<string, unknown>;
  children: BuilderNode[];
  visible: boolean;
  hidden?: boolean; // alias for !visible
  locked: boolean;
  order: number;
}

/**
 * SectionNode alias for backward compatibility across existing builder codebase.
 */
export type SectionNode = BuilderNode;

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
  folder?: string;
  hidden?: boolean;
  status?: 'published' | 'draft';
}

// ---------------------------------------------------------------------------
// Root document
// ---------------------------------------------------------------------------

export interface BuilderDocument {
  readonly id: string;           // stable store identifier
  readonly tenantId: string;
  name?: string;
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
  tenantId?: string;
  metadata?: BuilderMetadata;
  theme?: Partial<BuilderTheme>;
  pages?: BuilderPage[];
}): BuilderDocument {
  const now = Date.now();
  return {
    id: params.id,
    tenantId: params.tenantId ?? 'tenant_default',
    version: 1,
    metadata: params.metadata ?? {
      storeName: 'My Store',
      storeSlug: 'my-store',
      locale: 'en',
      currency: 'USD',
    },
    pages: params.pages && params.pages.length > 0
      ? params.pages
      : [createBuilderPage({ id: `page_home_${params.id}`, slug: '/', name: 'Home', isHome: true })],
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

export function createBuilderNode(params: {
  id: string;
  type: NodeType;
  label?: string;
  parentId?: string | null;
  props?: Record<string, unknown>;
  styles?: NodeStyles;
  responsive?: NodeResponsive;
  responsiveProps?: Record<string, Record<string, unknown>>;
  metadata?: Record<string, unknown>;
  children?: BuilderNode[];
  visible?: boolean;
  hidden?: boolean;
  locked?: boolean;
  order?: number;
}): BuilderNode {
  const isHidden = params.hidden ?? (params.visible !== undefined ? !params.visible : false);
  return {
    id: params.id,
    type: params.type,
    label: params.label ?? params.type,
    parentId: params.parentId ?? null,
    props: params.props ?? {},
    styles: params.styles,
    responsive: params.responsive,
    responsiveProps: params.responsiveProps,
    metadata: params.metadata,
    children: params.children ?? [],
    visible: !isHidden,
    hidden: isHidden,
    locked: params.locked ?? false,
    order: params.order ?? 0,
  };
}

export function createSectionNode(params: {
  id: string;
  type: string;
  label?: string;
  props?: Record<string, unknown>;
  responsiveProps?: Record<string, Record<string, unknown>>;
  order?: number;
}): SectionNode {
  return createBuilderNode({
    id: params.id,
    type: params.type,
    label: params.label,
    props: params.props,
    responsiveProps: params.responsiveProps,
    order: params.order,
  });
}

// ---------------------------------------------------------------------------
// compile() — the ONLY bridge from Builder to Runtime/Publish
// ---------------------------------------------------------------------------

function resolveResponsiveProps(
  baseProps: Record<string, unknown>,
  responsiveProps: Record<string, Record<string, unknown>> | undefined,
  breakpoint: string
): Record<string, unknown> {
  if (!responsiveProps) return baseProps;
  const resolved = { ...baseProps };
  for (const [propName, breakpointValues] of Object.entries(responsiveProps)) {
    const value = breakpointValues[breakpoint];
    if (value !== undefined) {
      resolved[propName] = value;
    }
  }
  return resolved;
}

function flattenNode(node: SectionNode, parentOrder: number, breakpoint?: string): CompiledSection[] {
  const children = node.children ?? [];
  const resolvedProps = breakpoint
    ? resolveResponsiveProps(node.props, node.responsiveProps, breakpoint)
    : node.props;
  const compiled: CompiledSection = {
    id: node.id,
    type: node.type,
    label: node.label,
    props: children.length > 0
      ? { ...resolvedProps, _childIds: children.map(c => c.id) }
      : resolvedProps,
    order: parentOrder,
    visible: node.visible ?? true,
  };

  const result: CompiledSection[] = [compiled];

  for (let i = 0; i < children.length; i++) {
    const childFlattened = flattenNode(children[i], i, breakpoint);
    result.push(...childFlattened);
  }

  return result;
}

export function compile(doc: BuilderDocument, breakpoint?: string): CompiledDocument {
  const compiledPages: CompiledPage[] = doc.pages.map(page => {
    const sections: CompiledSection[] = [];
    page.sections.forEach((node, idx) => {
      sections.push(...flattenNode(node, idx, breakpoint));
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
