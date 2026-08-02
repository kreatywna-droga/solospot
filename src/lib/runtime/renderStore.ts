import { StoreRepository } from '@/lib/store/StoreRepository';
import { ProductRepository } from '@/lib/product/ProductRepository';
import { RuntimeResolver } from './RuntimeResolver';
import { RuntimeValidator } from './RuntimeValidator';
import type { StoreRuntimeConfig, RuntimeResult as LegacyRuntimeResult } from './RuntimeTypes';
import type { RuntimeResult } from '../../../packages/runtime-core/src/RuntimeResult';
import type { RuntimeContext } from '../../../packages/runtime-core/src/RuntimeContext';
import { RuntimeResultAdapter } from '../../../packages/runtime-core/src/adapters/RuntimeResultAdapter';
import { createOutputModeStrategy } from '../../../packages/runtime-core/src/OutputModes';
import {
  DefaultRuntimeCompositionEngine,
  createDefaultSectionRegistry,
  createRuntimePipeline,
  RuntimeCache,
  globalRuntimeCache,
  type TenantContext,
  type PipelineDeps,
  type PipelineRequest,
  type RuntimeSection,
  type StoreRecord,
  type ProductRecord,
  type StoreRuntimeSnapshot,
} from '../../../packages/runtime-core/src';

/**
 * Adapter: legacy StoreRepository → StoreRepositoryLike (for DefaultRuntimeCompositionEngine).
 */
function createStoreRepoAdapter(): { getStoreBySlug(slug: string): Promise<StoreRecord | null> } {
  const repo = new StoreRepository();
  return {
    getStoreBySlug: async (slug: string) => {
      const store = await repo.getStoreBySlug(slug);
      if (!store) return null;
      return store as unknown as StoreRecord;
    },
  };
}

/**
 * Adapter: legacy ProductRepository → ProductRepositoryLike.
 */
function createProductRepoAdapter(): { getProductsByStore(tenantId: string, storeId: string): Promise<ProductRecord[]> } {
  const repo = new ProductRepository();
  return {
    getProductsByStore: async (tenantId: string, storeId: string) => {
      const products = await repo.getProductsByStore(tenantId, storeId);
      return products as unknown as ProductRecord[];
    },
  };
}

export type RenderMode = 'LIVE' | 'PREVIEW' | 'EXPORT';

/**
 * RuntimeBackend — Sprint 6 Step 5 Feature Flag.
 *
 * Controls which runtime implementation renderStore() uses:
 *   - LEGACY:   legacy RuntimeResolver path only (no pipeline)
 *   - PIPELINE: DefaultRuntimePipeline only (throws/returns null on failure)
 *   - AUTO:     DefaultRuntimePipeline primary + legacy fallback (default)
 *
 * Allows fast rollback and side-by-side comparison during migration.
 */
export type RuntimeBackend = 'LEGACY' | 'PIPELINE' | 'AUTO';

/**
 * RenderContext — future-proof context for partial rendering.
 * Added now to avoid breaking the API surface later.
 */
export interface RenderContext {
  readonly locale?: string;
  readonly currency?: string;
  readonly correlationId?: string;
  readonly documentHash?: string;
  readonly viewport?: 'DESKTOP' | 'TABLET' | 'MOBILE';
  readonly request?: Request;
}

export interface RenderStoreOptions {
  slug: string;
  mode?: RenderMode;
  locale?: string;
  currency?: string;
  correlationId?: string;
  /** Optional RuntimeCache instance (defaults to globalRuntimeCache) */
  cache?: RuntimeCache;
  /** Bypass cache entirely (used by preview with noCache=true) */
  noCache?: boolean;
  /** Document hash for cache key (used by cache-invalidation) */
  documentHash?: string;
  /**
   * Runtime backend selector (Sprint 6 Step 5 Feature Flag).
   *   - LEGACY:   legacy RuntimeResolver only
   *   - PIPELINE: DefaultRuntimePipeline only
   *   - AUTO:     pipeline primary + legacy fallback (default)
   */
  runtime?: RuntimeBackend;
}

export interface RenderStoreResult {
  success: boolean;
  storeId: string;
  storeName: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
    logo?: string;
    favicon?: string;
    description?: string;
  };
  page: {
    id: string;
    slug: string;
    name: string;
    sections: Array<{
      id: string;
      type: string;
      label: string;
      props: Record<string, unknown>;
      order: number;
      visible: boolean;
    }>;
  };
  sections: Array<{
    id: string;
    type: string;
    label: string;
    props: Record<string, unknown>;
    order: number;
    visible: boolean;
  }>;
  products: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    currency: string;
    images: string[];
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
  };
  publicationStatus: string;
  version: string;
  mode: RenderMode;
  renderedAt: string;
  /** Indicates whether the result came from cache (diagnostics). */
  fromCache?: boolean;
  errors?: string[];
  metadata?: Record<string, unknown>;
}

// NOTE: legacy runtimeContextCache removed in Sprint 6 Step 5 cleanup.
// RuntimeContext instances are now owned by the DefaultRuntimePipeline
// (created per-request by PipelineDeps.createRuntimeContext).

/**
 * Build a TenantContext from a PipelineRequest (used by runtime-composition stage).
 */
async function buildTenantContextFromRequest(request: PipelineRequest): Promise<TenantContext | null> {
  const storeRepo = new StoreRepository();
  const store = await storeRepo.getStoreBySlug(request.slug);
  if (!store) return null;

  return {
    tenantId: store.tenantId,
    slug: request.slug,
    status: 'ACTIVE',
    domains: { primary: `${request.slug}.example.com` },
    plan: { tier: 'FREE', limits: {} },
    capabilities: [],
    metadata: {
      cacheKey: `tenant_${request.slug}`,
      lastRefresh: new Date().toISOString(),
      ttlSeconds: 60,
      locale: request.locale || 'pl',
      currency: request.currency || 'PLN',
    },
  };
}

/**
 * Build a RuntimeContext from a composed StoreRuntimeSnapshot.
 * Used by the runtime-composition stage to replace the initial context.
 */
function createComposedRuntimeContext(
  snapshot: StoreRuntimeSnapshot,
  request: PipelineRequest
): RuntimeContext {
  return {
    mode: request.mode,
    tenant: {
      tenantId: request.tenantId,
      slug: request.slug,
      domains: { primary: `${request.slug}.example.com` },
      plan: { tier: 'FREE', limits: {} },
      capabilities: snapshot.capabilities || [],
      metadata: { locale: request.locale || 'pl', currency: request.currency || 'PLN' },
    },
    config: snapshot.configuration as unknown as RuntimeContext['config'],
    correlationId: request.correlationId,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Build a PipelineRequest from render options.
 */
function buildPipelineRequest(options: RenderStoreOptions): PipelineRequest {
  return {
    tenantId: 'local',
    storeId: options.slug,
    slug: options.slug,
    viewName: 'home',
    props: {},
    mode: options.mode || 'LIVE',
    correlationId: options.correlationId || `render_${options.slug}_${Date.now()}`,
    locale: options.locale || 'pl',
    currency: options.currency || 'PLN',
    noCache: options.noCache,
    documentHash: options.documentHash,
  };
}

/**
 * Resolve a store via the new DefaultRuntimePipeline.
 * Returns a core RuntimeResult on success, throws on failure (caller falls back).
 *
 * The composition engine is wired as the pipeline's `runtime-composition` stage
 * (only active when `buildTenantContext` + `createComposedRuntimeContext` are provided).
 * A `legacyFallback` returning a core RuntimeResult is wired for the final stage,
 * keeping `RuntimeResolver` as the true last-resort fallback inside the pipeline.
 */
async function resolveViaPipeline(options: RenderStoreOptions): Promise<RuntimeResult> {
  const { mode = 'LIVE' } = options;
  const cache = options.cache ?? globalRuntimeCache;

  const compositionEngine = new DefaultRuntimeCompositionEngine({
    storeRepo: createStoreRepoAdapter(),
    productRepo: createProductRepoAdapter(),
  });

  const deps: PipelineDeps = {
    runtimeEngine: {
      createRuntime: async (ctx) => ({
        tenantId: ctx.tenant.tenantId,
        id: `rt_${ctx.tenant.tenantId}`,
        lifecycle: 'ACTIVE' as const,
        modules: new Map(),
        renderer: { renderView: async () => '' },
      }),
      render: async () => RuntimeResultAdapter.toRuntimeCoreResult(
        {
          storeName: '',
          page: { id: '', slug: '', name: '', sections: [] },
          theme: { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' },
          products: [],
          publicationStatus: 'DRAFT',
        },
        '',
        '',
        '1.0.0',
        '',
        mode
      ),
      dispose: async () => undefined,
      resolveCapability: () => null,
      getActiveInstance: () => undefined,
    },
    sectionRegistry: createDefaultSectionRegistry(),
    createRuntimeContext: (request: PipelineRequest): RuntimeContext => ({
      mode: request.mode,
      tenant: {
        tenantId: request.tenantId,
        slug: request.slug,
        domains: { primary: `${request.slug}.example.com` },
        plan: { tier: 'FREE', limits: {} },
        capabilities: [],
        metadata: { locale: request.locale || 'pl', currency: request.currency || 'PLN' },
      },
      config: {
        storeId: request.storeId,
        storeName: request.slug,
        publicationStatus: 'DRAFT',
        branding: { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' },
        pages: [],
      },
      correlationId: request.correlationId,
      timestamp: new Date().toISOString(),
    }),
    buildRuntimeResult: (params) => {
      // Create mutable copy of sections to satisfy LegacyRuntimePage contract (readonly → mutable)
      // Create mutable copy with type-safe cast for the bridge between RuntimeSection and LegacyRuntimeSection
      const mutableSections = params.page.sections.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label || s.type,
        props: { ...s.props },
        order: s.order,
        visible: s.visible,
      }));
      const mutablePage = { id: params.page.id, slug: params.page.slug, name: params.page.name, sections: mutableSections };

      return RuntimeResultAdapter.toRuntimeCoreResult(
        {
          storeName: params.page.name,
          page: mutablePage as unknown as Parameters<typeof RuntimeResultAdapter.toRuntimeCoreResult>[0]['page'],
          theme: params.theme,
          products: mutableSections.map((s) => ({
            id: s.id,
            name: s.label,
            description: '',
            price: 0,
            currency: params.request.currency || 'PLN',
            images: [],
          })),
          publicationStatus: 'PUBLISHED',
        },
        params.request.tenantId,
        params.request.storeId,
        '2.0.0',
        params.request.slug,
        params.request.mode
      );
    },
    outputModeStrategy: createOutputModeStrategy(mode),

    // ---- Sprint 6 Step 5 optional deps (activate guarded stages) ----

    // cache-check / cache-write stages
    cache,
    buildCacheKey: (request) =>
      RuntimeCache.buildKey({
        slug: request.slug,
        mode: request.mode,
        locale: request.locale,
        currency: request.currency,
        documentHash: request.documentHash || '',
      }),

    // validate-access stage
    validateAccess: async (request) => {
      const storeRepo = new StoreRepository();
      const store = await storeRepo.getStoreBySlug(request.slug);
      if (!store) {
        return { allowed: false, reason: `Store not found for slug: ${request.slug}` };
      }
      const status = (store.config?.publicationStatus) || 'DRAFT';
      const validator = new RuntimeValidator();
      if (!validator.isPubliclyAccessible(status)) {
        return { allowed: false, reason: 'Store is not publicly accessible' };
      }
      return { allowed: true };
    },

    // runtime-composition stage
    compositionEngine,
    buildTenantContext: (request) => buildTenantContextFromRequest(request),
    createComposedRuntimeContext: (snapshot, request) => createComposedRuntimeContext(snapshot, request),

    // legacy-fallback stage (last resort — returns core RuntimeResult)
    legacyFallback: async (request) =>
      resolveViaLegacyCore({ ...options, slug: request.slug, mode: request.mode as RenderMode }),
  };

  const pipeline = createRuntimePipeline(deps, 'render-store-pipeline');
  const result = await pipeline.execute(buildPipelineRequest(options));

  if (!result.success || !result.data) {
    throw new Error(result.errors.join('; ') || 'Runtime pipeline failed');
  }

  return result.data as RuntimeResult;
}

/**
 * Resolve a store via the legacy RuntimeResolver, returning a core RuntimeResult.
 * Used by the pipeline's legacy-fallback stage.
 */
async function resolveViaLegacyCore(options: RenderStoreOptions): Promise<RuntimeResult | null> {
  const { slug, mode = 'LIVE' } = options;
  const storeRepo = new StoreRepository();
  const productRepo = new ProductRepository();

  const store = await storeRepo.getStoreBySlug(slug);
  if (!store || !store.config) return null;

  const products = await productRepo.getProductsByStore(store.tenantId, store.id);
  const resolver = new RuntimeResolver();
  const runtimeConfig: StoreRuntimeConfig = resolver.resolve(store, products || []);

  const validator = new RuntimeValidator();
  const status = runtimeConfig.publicationStatus;

  if (mode === 'LIVE' && !validator.isPubliclyAccessible(status)) {
    return RuntimeResultAdapter.toRuntimeCoreResult(
      {
        storeName: runtimeConfig.storeName,
        page: runtimeConfig.pages[0] || { id: 'home', slug: '', name: 'Home', sections: [] },
        theme: runtimeConfig.theme,
        products: runtimeConfig.products,
        navigation: runtimeConfig.navigation,
        seo: runtimeConfig.seo,
        publicationStatus: status,
      },
      store.tenantId,
      store.id,
      '1.0.0',
      slug,
      mode
    );
  }

  const legacyResult: LegacyRuntimeResult = {
    storeName: runtimeConfig.storeName,
    page: runtimeConfig.pages[0] || { id: 'home', slug: '', name: 'Home', sections: [] },
    theme: runtimeConfig.theme,
    products: runtimeConfig.products,
    navigation: runtimeConfig.navigation,
    seo: runtimeConfig.seo,
    publicationStatus: status,
  };

  return RuntimeResultAdapter.toRuntimeCoreResult(
    legacyResult,
    store.tenantId,
    store.id,
    '1.0.0',
    slug,
    mode
  );
}

/**
 * Resolve a store via the legacy RuntimeResolver (fallback path).
 */
async function resolveViaLegacy(options: RenderStoreOptions): Promise<RenderStoreResult | null> {
  const { slug, mode = 'LIVE', locale = 'pl', currency = 'PLN', correlationId } = options;
  const storeRepo = new StoreRepository();
  const productRepo = new ProductRepository();

  const store = await storeRepo.getStoreBySlug(slug);
  if (!store || !store.config) return null;

  const products = await productRepo.getProductsByStore(store.tenantId, store.id);
  const resolver = new RuntimeResolver();
  const runtimeConfig: StoreRuntimeConfig = resolver.resolve(store, products || []);

  const validator = new RuntimeValidator();
  const status = runtimeConfig.publicationStatus;

  if (mode === 'LIVE' && !validator.isPubliclyAccessible(status)) {
    return buildLegacyResult(store.id, runtimeConfig, mode, ['Store is not publicly accessible']);
  }

  const legacyResult: LegacyRuntimeResult = {
    storeName: runtimeConfig.storeName,
    page: runtimeConfig.pages[0] || { id: 'home', slug: '', name: 'Home', sections: [] },
    theme: runtimeConfig.theme,
    products: runtimeConfig.products,
    navigation: runtimeConfig.navigation,
    seo: runtimeConfig.seo,
    publicationStatus: runtimeConfig.publicationStatus,
  };

  const coreResult = RuntimeResultAdapter.toRuntimeCoreResult(
    legacyResult,
    store.tenantId,
    store.id,
    '1.0.0',
    slug,
    mode
  );

  return buildResultFromCore(store.id, runtimeConfig.storeName, coreResult, mode, legacyResult);
}

function buildLegacyResult(
  storeId: string,
  runtimeConfig: StoreRuntimeConfig,
  mode: RenderMode,
  errors: string[]
): RenderStoreResult {
  return {
    success: false,
    storeId,
    storeName: runtimeConfig.storeName,
    theme: {
      primaryColor: runtimeConfig.theme.primaryColor,
      secondaryColor: runtimeConfig.theme.secondaryColor,
      font: runtimeConfig.theme.font,
      logo: runtimeConfig.theme.logo,
      favicon: runtimeConfig.theme.favicon,
      description: runtimeConfig.theme.description,
    },
    page: { id: '', slug: '', name: '', sections: [] },
    sections: [],
    products: [],
    publicationStatus: runtimeConfig.publicationStatus,
    version: '1.0.0',
    mode,
    renderedAt: new Date().toISOString(),
    errors,
    metadata: {},
  };
}

function buildResultFromCore(
  storeId: string,
  storeName: string,
  coreResult: RuntimeResult,
  mode: RenderMode,
  legacy?: LegacyRuntimeResult
): RenderStoreResult {
  const metadata = coreResult.metadata as Record<string, unknown> | undefined;
  const legacyProducts = (metadata?.products as Array<{ id: string; name: string; description: string; price: number; currency: string; images: string[] }>) || [];
  const legacyNavigation = (metadata?.navigation as Array<{ label: string; href: string; children?: Array<{ label: string; href: string }> }>) || [];
  const legacySeo = metadata?.seo as { title?: string; description?: string; ogImage?: string } | undefined;
  const publicationStatus = (metadata?.publicationStatus as string) || 'DRAFT';

  const strategy = createOutputModeStrategy(mode);
  const wrappedSections = coreResult.sections.map((section) => {
    const html = `<div data-section-id="${section.id}" data-section-type="${section.type}">${JSON.stringify(section.props)}</div>`;
    return strategy.wrapSection(section, html);
  });

  return {
    success: coreResult.success,
    storeId,
    storeName,
    theme: {
      primaryColor: coreResult.theme.primaryColor,
      secondaryColor: coreResult.theme.secondaryColor,
      font: coreResult.theme.font,
      logo: coreResult.theme.logo,
      favicon: coreResult.theme.favicon,
      description: coreResult.theme.description,
    },
    page: {
      id: coreResult.page.id,
      slug: coreResult.page.slug,
      name: coreResult.page.name,
      sections: coreResult.sections.map((s) => ({
        id: s.id,
        type: s.type,
        label: s.label || s.type,
        props: s.props,
        order: s.order,
        visible: s.visible,
      })),
    },
    sections: coreResult.sections.map((s) => ({
      id: s.id,
      type: s.type,
      label: s.label || s.type,
      props: s.props,
      order: s.order,
      visible: s.visible,
    })),
    products: legacyProducts.map((p) => ({ id: p.id, name: p.name, description: p.description, price: p.price, currency: p.currency, images: p.images })),
    navigation: legacyNavigation.map((n) => ({ label: n.label, href: n.href, children: n.children?.map((c) => ({ label: c.label, href: c.href })) })),
    seo: legacySeo ? { title: legacySeo.title, description: legacySeo.description, ogImage: legacySeo.ogImage, canonicalUrl: undefined, robots: undefined } : undefined,
    publicationStatus,
    version: '2.0.0',
    mode,
    renderedAt: new Date().toISOString(),
    errors: coreResult.errors ? [...coreResult.errors] : undefined,
    metadata,
  };
}

/**
 * Unified renderStore() entry point.
 *
 * ARCHITECTURE (per Sprint 6 Step 5 corrections):
 *   renderStore()
 *     ↓
 *   RuntimeCache (owner of cache decision)  ← cache-check before pipeline
 *     ↓
 *   DefaultRuntimePipeline (deterministic stages only)
 *     ↓
 *   catch → LegacyRuntime (fallback OUTSIDE pipeline)
 *
 * @param options - Render options including slug, mode, locale, currency
 * @returns Unified render result
 */
/**
 * Core render path shared by all backends (cache check + build result).
 */
async function renderWithCache(
  options: RenderStoreOptions,
  runPrimary: () => Promise<RuntimeResult>
): Promise<RenderStoreResult | null> {
  const { slug, mode = 'LIVE', locale = 'pl', currency = 'PLN' } = options;
  const cache = options.cache ?? globalRuntimeCache;
  const cacheKey = RuntimeCache.buildKey({
    slug,
    mode,
    locale,
    currency,
    documentHash: options.documentHash || '',
  });

  // Cache-first: cache owns the decision to enter the pipeline.
  if (!options.noCache) {
    const ttl = cache.getTTL(mode);
    if (ttl > 0) {
      const cached = cache.get<RenderStoreResult>(cacheKey);
      if (cached) {
        return { ...cached, fromCache: true };
      }
    }
  }

  const coreResult = await runPrimary();

  const storeRepo = new StoreRepository();
  const store = await storeRepo.getStoreBySlug(slug);

  const result = buildResultFromCore(
    store?.id || slug,
    coreResult.page.name || slug,
    coreResult,
    mode
  );

  // Cache-write after successful render.
  if (!options.noCache) {
    const ttl = cache.getTTL(mode);
    if (ttl > 0) {
      cache.set(cacheKey, result, ttl);
    }
  }

  return result;
}

/**
 * Unified renderStore() entry point.
 *
 * ARCHITECTURE (per Sprint 6 Step 5 corrections):
 *   renderStore()
 *     ↓
 *   RuntimeCache (owner of cache decision)  ← cache-check before pipeline
 *     ↓
 *   DefaultRuntimePipeline (deterministic stages only)
 *     ↓
 *   catch → LegacyRuntime (fallback OUTSIDE pipeline)
 *
 * Backend selector (Feature Flag):
 *   - runtime: 'LEGACY'   → legacy RuntimeResolver only
 *   - runtime: 'PIPELINE' → DefaultRuntimePipeline only (no fallback)
 *   - runtime: 'AUTO'     → pipeline primary + legacy fallback (default)
 *
 * @param options - Render options including slug, mode, locale, currency
 * @returns Unified render result
 */
export async function renderStore(options: RenderStoreOptions): Promise<RenderStoreResult | null> {
  const { mode = 'LIVE' } = options;
  const backend: RuntimeBackend = options.runtime ?? 'AUTO';

  // LEGACY mode — old resolver only.
  if (backend === 'LEGACY') {
    try {
      return await resolveViaLegacy(options);
    } catch (err) {
      console.error('[renderStore] Legacy runtime failed:', (err as Error).message);
      return null;
    }
  }

  // PIPELINE mode — pipeline only, no fallback.
  if (backend === 'PIPELINE') {
    try {
      return await renderWithCache(options, () => resolveViaPipeline(options));
    } catch (err) {
      console.error('[renderStore] Pipeline runtime failed (PIPELINE mode, no fallback):', (err as Error).message);
      return null;
    }
  }

  // AUTO mode (default) — pipeline primary, legacy fallback.
  try {
    return await renderWithCache(options, () => resolveViaPipeline(options));
  } catch (pipelineErr) {
    console.warn('[renderStore] Pipeline failed, falling back to legacy:', (pipelineErr as Error).message);

    try {
      const legacyResult = await resolveViaLegacy(options);
      if (legacyResult) return legacyResult;
    } catch (legacyErr) {
      console.error('[renderStore] Legacy fallback also failed:', (legacyErr as Error).message);
    }

    return null;
  }
}

/**
 * Clears the request-level cache and the global RuntimeCache.
 * Useful for preview mode where data changes frequently.
 */
export function clearRenderStoreCache(): void {
  globalRuntimeCache.clear();
}

/**
 * Clears the runtime context cache.
 *
 * NOTE: legacy runtimeContextCache was removed in Sprint 6 Step 5.
 * RuntimeContext instances are now owned by the pipeline and created
 * per-request, so this is a no-op kept for backward compatibility.
 */
export function clearRuntimeContextCache(): void {
  // no-op (legacy API, kept for compatibility)
}

/**
 * Render a single section (targeted re-render).
 *
 * API designed with RenderContext from day one to avoid breaking changes later.
 *
 * @param slug - Store slug
 * @param sectionId - Target section id
 * @param mode - Output mode (LIVE | PREVIEW | EXPORT)
 * @param context - RenderContext (locale, currency, correlationId, documentHash, viewport)
 */
export async function renderStoreSection(
  slug: string,
  sectionId: string,
  mode: RenderMode = 'LIVE',
  context: RenderContext = {}
): Promise<RenderStoreResult | null> {
  const full = await renderStore({
    slug,
    mode,
    locale: context.locale,
    currency: context.currency,
    correlationId: context.correlationId || `section_${sectionId}_${Date.now()}`,
    noCache: mode === 'PREVIEW',
  });

  if (!full) return null;

  const section = full.sections.find((s) => s.id === sectionId);
  if (!section) return full;

  return {
    ...full,
    sections: [section],
    page: { ...full.page, sections: [section] },
    renderedAt: new Date().toISOString(),
    metadata: { ...full.metadata, sectionOnly: true },
  };
}

/**
 * Render a partial store — only the sections affected by changed fields.
 *
 * Uses a lightweight dependency heuristic: if a section's props reference any
 * changed field, it is re-rendered. If the dependency is inconclusive,
 * falls back to full re-render.
 *
 * @param slug - Store slug
 * @param changedFields - Array of changed field paths (e.g. ['theme.primaryColor', 'sections.hero.title'])
 * @param context - RenderContext (locale, currency, correlationId, documentHash, viewport)
 */
export async function renderStorePartial(
  slug: string,
  changedFields: string[],
  context: RenderContext = {}
): Promise<RenderStoreResult | null> {
  if (!changedFields || changedFields.length === 0) {
    return renderStore({ slug, mode: 'LIVE', locale: context.locale, currency: context.currency, correlationId: context.correlationId, noCache: true });
  }

  const full = await renderStore({
    slug,
    mode: 'LIVE',
    locale: context.locale,
    currency: context.currency,
    correlationId: context.correlationId || `partial_${Date.now()}`,
    noCache: true,
  });

  if (!full) return null;

  // Dependency heuristic: sections whose props mention a changed field are affected.
  const affected = full.sections.filter((s) => {
    const propsJson = JSON.stringify(s.props || {});
    return changedFields.some((field) => propsJson.includes(field));
  });

  // Inconclusive (e.g. theme change affects everything) → full re-render.
  if (affected.length === 0 || changedFields.some((f) => f.startsWith('theme.') || f.startsWith('store.'))) {
    return full;
  }

  return {
    ...full,
    sections: affected,
    page: { ...full.page, sections: affected },
    renderedAt: new Date().toISOString(),
    metadata: { ...full.metadata, partial: true, affectedSections: affected.map((s) => s.id) },
  };
}

