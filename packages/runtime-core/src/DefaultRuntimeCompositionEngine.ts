import type { RuntimeCompositionEngine, TenantContext } from './RuntimeEngine';
import { createRuntimePage, createRuntimeSection, RuntimePage, RuntimeSection } from './RuntimeSection';
import type {
  RuntimeNavigation,
  RuntimeProduct,
  RuntimeSEO,
  StoreConfig,
  StoreRuntimeSnapshot,
} from './RuntimeContext';

/**
 * DefaultRuntimeCompositionEngine
 *
 * Composes a StoreRuntimeSnapshot from a TenantContext by resolving
 * store configuration, theme, products, pages, and capabilities.
 *
 * This replaces the legacy `RuntimeResolver` in `src/lib/runtime/RuntimeResolver.ts`.
 *
 * Pipeline stages:
 *   1. Resolve tenant info (slug → tenantId, domains, plan, capabilities)
 *   2. Resolve store config (theme, branding, pages, publicationStatus)
 *   3. Normalize pages/sections (legacy `config` → core `props`)
 *   4. Resolve products list
 *   5. Resolve navigation + SEO
 *   6. Assemble StoreRuntimeSnapshot with a core `StoreConfig` in `configuration`
 */
export class DefaultRuntimeCompositionEngine implements RuntimeCompositionEngine {
  private readonly storeRepo: StoreRepositoryLike;
  private readonly productRepo: ProductRepositoryLike;

  constructor(options: {
    storeRepo: StoreRepositoryLike;
    productRepo: ProductRepositoryLike;
  }) {
    this.storeRepo = options.storeRepo;
    this.productRepo = options.productRepo;
  }

  async compose(tenantContext: TenantContext, correlationId?: string): Promise<StoreRuntimeSnapshot> {
    const cid = correlationId || `compose_${tenantContext.slug}_${Date.now()}`;
    const tenantId = tenantContext.tenantId;

    // 1. Resolve store config from repository
    const store = await this.storeRepo.getStoreBySlug(tenantContext.slug);
    if (!store) {
      throw new Error(`Store not found for slug: ${tenantContext.slug}`);
    }

    const rawConfig = store.config || {};
    const branding = rawConfig.branding || {};
    const theme = rawConfig.theme || {
      primaryColor: '#7c3aed',
      secondaryColor: '#ec4899',
      font: 'Inter',
    };

    // 2. Resolve products
    const rawProducts = await this.productRepo.getProductsByStore(tenantId, store.id);
    const products: RuntimeProduct[] = rawProducts.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      currency: p.currency,
      images: [...(p.images || [])],
    }));

    // 3. Normalize pages (legacy `config` → core `props`)
    let pages: RuntimePage[] = (rawConfig.pages || []).map(normalizePage);

    // Default home page when no pages are defined
    if (pages.length === 0) {
      pages = [
        createRuntimePage('home', '', 'Strona główna', [
          createRuntimeSection(
            'hero-1',
            'hero',
            'Hero',
            { title: branding.description || 'Witaj w naszym sklepie' },
            0,
            true
          ),
          createRuntimeSection('products-1', 'product-grid', 'Produkty', {}, 1, true),
          createRuntimeSection('footer-1', 'footer', 'Stopka', {}, 2, true),
        ]),
      ];
    }

    // 4. Navigation + SEO
    const navigation: RuntimeNavigation[] = (rawConfig.navigation || []).map((n) => ({
      label: n.label,
      href: n.href,
      children: n.children?.map((c) => ({ label: c.label, href: c.href })),
    }));

    const seo: RuntimeSEO | undefined = rawConfig.seo
      ? {
          title: rawConfig.seo.title,
          description: rawConfig.seo.description,
          ogImage: rawConfig.seo.ogImage,
          canonicalUrl: rawConfig.seo.canonicalUrl,
          robots: rawConfig.seo.robots,
          jsonLdSchema: rawConfig.seo.jsonLdSchema,
        }
      : undefined;

    // 5. Assemble core StoreConfig
    const storeConfig: StoreConfig = {
      storeId: store.id,
      storeName: rawConfig.name || store.name || 'Mój Sklep',
      publicationStatus: rawConfig.publicationStatus || 'DRAFT',
      template: rawConfig.template,
      branding: {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
        font: theme.font,
        logo: branding.logo,
        favicon: branding.favicon,
        description: branding.description,
      },
      pages,
      products,
      navigation,
      seo,
      capabilities: [...(tenantContext.capabilities || [])],
    };

    // 6. Build snapshot
    const snapshot: StoreRuntimeSnapshot = {
      tenantId,
      engineVersion: '2.0.0',
      schemaVersion: '1.0.0',
      packages: [
        { id: 'runtime-core', version: '2.0.0', priority: 0 },
        { id: 'commerce-engine', version: '1.0.0', priority: 1 },
        { id: 'theme-runtime', version: '1.0.0', priority: 2 },
      ],
      capabilities: storeConfig.capabilities || [],
      theme: {
        id: `theme_${store.id}`,
        version: '1.0.0',
        settings: {
          primaryColor: theme.primaryColor,
          secondaryColor: theme.secondaryColor,
          font: theme.font,
          logo: branding.logo,
          favicon: branding.favicon,
          description: branding.description,
        },
      },
      configuration: storeConfig as unknown as Record<string, unknown>,
      runtimeHash: `rh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      composedAt: new Date().toISOString(),
    };

    return snapshot;
  }
}

// ---- Normalization helpers (legacy → core) ----

function normalizeSection(raw: LegacySectionLike, index: number): RuntimeSection | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!raw.id || !raw.type) return null;

  const props = (raw.props || raw.config || {}) as Record<string, unknown>;

  return {
    id: raw.id,
    type: raw.type,
    label: raw.label || raw.type,
    props,
    order: typeof raw.order === 'number' ? raw.order : index,
    visible: raw.visible !== false,
  };
}

function normalizePage(raw: LegacyPageLike): RuntimePage {
  const sections: RuntimeSection[] = Array.isArray(raw?.sections)
    ? raw.sections
        .map((s, i) => normalizeSection(s, i))
        .filter((s): s is RuntimeSection => s !== null)
    : [];

  return {
    id: raw?.id || `page_${Date.now()}`,
    slug: raw?.slug || '',
    name: raw?.name || 'Strona główna',
    sections,
  };
}

// ---- Repository interfaces (minimal, dependency-injected) ----

export interface LegacySectionLike {
  id?: string;
  type?: string;
  label?: string;
  props?: Record<string, unknown>;
  config?: Record<string, unknown>;
  order?: number;
  visible?: boolean;
  children?: Array<unknown>;
}

export interface LegacyPageLike {
  id?: string;
  slug?: string;
  name?: string;
  sections?: LegacySectionLike[];
}

export interface StoreRecord {
  id: string;
  tenantId: string;
  name?: string;
  slug?: string;
  config?: {
    name?: string;
    template?: string;
    theme?: {
      primaryColor: string;
      secondaryColor: string;
      font: string;
    };
    branding?: {
      logo?: string;
      favicon?: string;
      description?: string;
    };
    publicationStatus?: string;
    pages?: Array<{
      id: string;
      slug: string;
      name: string;
      sections?: LegacySectionLike[];
    }>;
    navigation?: Array<{
      label: string;
      href: string;
      children?: Array<{ label: string; href: string }>;
    }>;
    seo?: {
      title?: string;
      description?: string;
      ogImage?: string;
      canonicalUrl?: string;
      robots?: string;
      jsonLdSchema?: Record<string, unknown>;
    };
    features?: {
      payment?: boolean;
      shipping?: boolean;
      newsletter?: boolean;
    };
  };
}

export interface StoreRepositoryLike {
  getStoreBySlug(slug: string): Promise<StoreRecord | null>;
}

export interface ProductRecord {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
}

export interface ProductRepositoryLike {
  getProductsByStore(tenantId: string, storeId: string): Promise<ProductRecord[]>;
}

