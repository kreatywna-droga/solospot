import {
  BuilderDocument,
  createBuilderDocument,
  createBuilderPage,
  createSectionNode,
  BuilderMetadata,
  BuilderTheme,
  SectionNode,
  compile,
} from '../../../packages/builder-core/src/BuilderDocument'

// ---------------------------------------------------------------------------
// API types (existing StoreConfig shape from backend)
// ---------------------------------------------------------------------------

export interface ApiSection {
  id: string
  type: string
  label: string
  config?: Record<string, unknown>
  order?: number
  parentId?: string | null
  styles?: Record<string, unknown>
  responsive?: Record<string, unknown>
  visible?: boolean
  locked?: boolean
  children?: ApiSection[]
}

export interface ApiPage {
  id: string
  name: string
  slug: string
  sections?: ApiSection[]
}

export interface ApiStore {
  id: string
  name: string
  slug: string
  domain: string | null
  status: string
  tenantId?: string
  config?: {
    publicationStatus?: string
    branding?: {
      primaryColor?: string
      secondaryColor?: string
      font?: string
      logo?: string
      favicon?: string
    }
    pages?: ApiPage[]
  }
}

// ---------------------------------------------------------------------------
// Converters: ApiStore ↔ BuilderDocument
// ---------------------------------------------------------------------------

export function nodeToApiSection(n: SectionNode, order: number): ApiSection {
  return {
    id: n.id,
    type: n.type,
    label: n.label,
    config: n.props,
    styles: n.styles as Record<string, unknown>,
    responsive: n.responsive as Record<string, unknown>,
    visible: n.visible,
    locked: n.locked,
    parentId: n.parentId,
    order: n.order ?? order,
    children: (n.children ?? []).map((child, ci) => nodeToApiSection(child, ci)),
  }
}

export function apiSectionToNode(s: ApiSection, i: number, parentId?: string | null): SectionNode {
  return {
    id: s.id,
    type: s.type,
    label: s.label || s.type,
    parentId: s.parentId ?? parentId ?? null,
    props: s.config ?? {},
    styles: (s.styles as any) ?? {},
    responsive: (s.responsive as any) ?? {},
    visible: s.visible !== false,
    locked: s.locked === true,
    order: s.order ?? i,
    children: (s.children ?? []).map((child, ci) => apiSectionToNode(child, ci, s.id)),
  }
}

/**
 * Converts a store object from the backend into a BuilderDocument.
 *
 * IMPORTANT (tenant contract):
 *   `document.tenantId` MUST be the real TENANT uuid (server-provided via
 *   `store.tenantId`, resolved from the authenticated session). Storage paths
 *   are built as `{tenantId}/{storeId}/{file}` and the RLS policy for the
 *   `store-assets` bucket requires the FIRST path segment to be a tenants.id.
 *   Using a store id or a placeholder here breaks the RLS lookup
 *   ("new row violates row-level security policy").
 */
export function apiStoreToBuilderDoc(store: ApiStore): BuilderDocument {
  const branding = store.config?.branding ?? {}

  const metadata: BuilderMetadata = {
    storeName: store.name,
    storeSlug: store.slug,
    locale: 'pl',
    currency: 'PLN',
  }

  const theme: Partial<BuilderTheme> = {
    primaryColor: branding.primaryColor ?? '#7c3aed',
    secondaryColor: branding.secondaryColor ?? '#d946ef',
    font: branding.font ?? 'Inter',
    logo: branding.logo,
    favicon: branding.favicon,
  }

  const apiPages = store.config?.pages ?? []
  const pages = apiPages.map((apiPage, pageIdx) => {
    const sections: SectionNode[] = (apiPage.sections ?? [])
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s, i) => apiSectionToNode(s, i, null))

    return createBuilderPage({
      id: apiPage.id,
      slug: apiPage.slug,
      name: apiPage.name,
      isHome: pageIdx === 0,
      sections,
    })
  })

  let finalPages = pages
  if (finalPages.length === 0) {
    finalPages = [
      createBuilderPage({
        id: `page_home_${store.id}`,
        slug: '/',
        name: 'Strona główna',
        isHome: true,
        sections: [],
      }),
    ]
  }

  const doc = createBuilderDocument({
    id: store.id,
    tenantId: store.tenantId ?? store.id,
    metadata,
    theme,
    pages: finalPages,
  })

  return { ...doc, pages: finalPages, isDirty: false }
}

// ---------------------------------------------------------------------------
// Converter: BuilderDocument → StoreConfig patch body
// ---------------------------------------------------------------------------

export function builderDocToApiPatch(doc: BuilderDocument): Record<string, unknown> {
  const compiled = compile(doc)
  return {
    config: {
      publicationStatus: compiled.publicationStatus,
      branding: {
        primaryColor: compiled.branding.primaryColor,
        secondaryColor: compiled.branding.secondaryColor,
        font: compiled.branding.font,
        logo: compiled.branding.logo,
        favicon: compiled.branding.favicon,
      },
      pages: doc.pages.map(page => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        sections: page.sections.map((s, idx) => nodeToApiSection(s, idx)),
        seo: page.seo,
      })),
    },
  }
}