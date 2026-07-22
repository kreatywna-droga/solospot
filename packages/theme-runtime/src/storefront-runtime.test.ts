import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { TenantResolver, TenantDatabaseProvider } from '../../platform-core/src/tenant/TenantResolver';
import { TenantContextBuilder } from '../../platform-core/src/tenant/TenantContextBuilder';
import { RuntimeCompositionEngine, TenantCompositionDetailsProvider } from '../../runtime-composition/src/RuntimeCompositionEngine';
import { PackageResolver } from '../../runtime-composition/src/PackageResolver';
import { CapabilityResolver } from '../../runtime-composition/src/CapabilityResolver';
import { ThemeResolver as CompThemeResolver } from '../../runtime-composition/src/ThemeResolver';
import { StoreRuntimeEngine } from '../../runtime-composition/src/StoreRuntimeEngine';
import { ModuleFactory, RendererFactory } from '../../runtime-core/src';
import { ThemeRuntime } from './ThemeRuntime';
import { ThemeResolver } from './ThemeResolver';
import { RendererEngine } from './RendererEngine';
import { StorefrontRuntime, StorefrontRequest } from './StorefrontRuntime';
import { ThemeManifest } from './ThemeManifest';

describe('Storefront Runtime', () => {
  let storefrontRuntime: StorefrontRuntime;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let tenantResolver: TenantResolver;
  let storeRuntimeEngine: StoreRuntimeEngine;
  let themeResolver: ThemeResolver;
  let themeRuntime: ThemeRuntime;
  let rendererEngine: RendererEngine;
  let originalEnv: string | undefined;

  // Mock DB Provider for TenantResolver
  const mockDbProvider: TenantDatabaseProvider = {
    findByTenantId: vi.fn(),
    findByDomain: vi.fn(),
    findBySlug: vi.fn(),
  };

  const sampleTheme: ThemeManifest = {
    id: 'theme_minimal',
    name: 'Minimalist Theme',
    version: '1.0.0',
    author: 'Clean Code',
    tokens: {
      primaryColor: '#000000',
      secondaryColor: '#FFFFFF',
      backgroundColor: '#FAFAFA',
      fontFamily: 'Outfit, sans-serif',
      borderRadius: '2px',
    },
    layouts: ['default'],
    components: {
      header: { name: 'Header', type: 'atom' },
      footer: { name: 'Footer', type: 'atom' },
      main_content: { name: 'MainContent', type: 'widget' },
    },
  };

  const tenantAContext = new TenantContextBuilder()
    .setTenantId('tenant-a')
    .setSlug('shop-a')
    .setStatus('ACTIVE')
    .setDomains({ primary: 'shop-a.solospot.pl' })
    .setPlan({ tier: 'GROWTH', limits: {} })
    .setCapabilities([])
    .setMetadata({
      cacheKey: 'c-a',
      lastRefresh: new Date().toISOString(),
      ttlSeconds: 300,
      locale: 'pl_PL',
      currency: 'PLN',
    })
    .build();

  const tenantBContext = new TenantContextBuilder()
    .setTenantId('tenant-b')
    .setSlug('shop-b')
    .setStatus('ACTIVE')
    .setDomains({ primary: 'shop-b.solospot.pl' })
    .setPlan({ tier: 'GROWTH', limits: {} })
    .setCapabilities([])
    .setMetadata({
      cacheKey: 'c-b',
      lastRefresh: new Date().toISOString(),
      ttlSeconds: 300,
      locale: 'de_DE',
      currency: 'EUR',
    })
    .build();

  beforeEach(async () => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    // Setup TenantResolver
    tenantResolver = new TenantResolver({
      dbProvider: mockDbProvider,
      eventBus,
      logger,
      environment: 'development',
    });

    // Mock Composition and StoreRuntime
    const packageResolver = new PackageResolver();
    const capabilityResolver = new CapabilityResolver();
    const compThemeResolver = new CompThemeResolver();
    compThemeResolver.register({ id: 'theme_minimal', version: '1.0.0', defaultSettings: {} });

    const mockDetailsProvider: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => [],
      getThemeForTenant: async () => ({ id: 'theme_minimal' }),
      getConfigurationForTenant: async () => ({}),
    };

    const compositionEngine = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver: compThemeResolver,
      detailsProvider: mockDetailsProvider,
      eventBus,
      logger,
    });

    const mockModuleFactory: ModuleFactory = {
      createModule: (id, version) => ({
        id,
        manifest: { version },
        initialize: async () => {},
        executeAction: async () => {},
        dispose: async () => {},
      }),
    };

    const mockRendererFactory: RendererFactory = {
      createRenderer: () => ({
        renderView: async () => '<html>Renderer Factory View</html>',
      }),
    };

    storeRuntimeEngine = new StoreRuntimeEngine({
      compositionEngine,
      moduleFactory: mockModuleFactory,
      rendererFactory: mockRendererFactory,
      eventBus,
      logger,
    });

    // Setup Theme engines
    themeResolver = new ThemeResolver();
    themeRuntime = new ThemeRuntime({ eventBus, logger });
    rendererEngine = new RendererEngine({ themeRuntime });

    // Register active theme manifests in ThemeResolver
    themeResolver.registerTheme(sampleTheme);

    // Setup Storefront Runtime
    storefrontRuntime = new StorefrontRuntime({
      eventBus,
      logger,
      tenantResolver,
      storeRuntimeEngine,
      themeResolver,
      themeRuntime,
      rendererEngine,
    });

    // Reset database mocks
    vi.mocked(mockDbProvider.findByDomain).mockReset();
    vi.mocked(mockDbProvider.findByTenantId).mockReset();
    vi.mocked(mockDbProvider.findBySlug).mockReset();

    // Setup base slug and domain resolution
    vi.mocked(mockDbProvider.findBySlug).mockImplementation(async (slug) => {
      if (slug === 'shop-a') return tenantAContext;
      if (slug === 'shop-b') return tenantBContext;
      return null;
    });

    vi.mocked(mockDbProvider.findByDomain).mockImplementation(async (domain) => {
      if (domain === 'shop-a.solospot.pl') return tenantAContext;
      if (domain === 'shop-b.solospot.pl') return tenantBContext;
      return null;
    });
  });

  afterEach(async () => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    await storefrontRuntime.disposeAllRuntimes();
    vi.restoreAllMocks();
  });

  it('Should successfully resolve routing, generate SEO headers and render product details page', async () => {
    vi.mocked(mockDbProvider.findByDomain).mockResolvedValue(tenantAContext);

    const req: StorefrontRequest = {
      host: 'shop-a.solospot.pl',
      path: '/product/adidas-superstar',
      queryParams: {},
      headers: {},
    };

    const response = await storefrontRuntime.handleRequest(req);
    expect(response.statusCode).toBe(200);
    expect(response.cacheStatus).toBe('MISS');

    // Check Variable Interpolations
    expect(response.html).toContain('<title>Adidas Superstar - shop-a</title>');
    expect(response.html).toContain('<meta name="description" content="Kup Adidas Superstar w sklepie shop-a. Najwyższa jakość gwarantowana." />');
    expect(response.html).toContain('<link rel="canonical" href="https://shop-a.solospot.pl/product/adidas-superstar" />');
    expect(response.html).toContain('Adidas Superstar'); // Rendered component slot data
  });

  it('Should check page cache and return HIT on subsequent calls, and MISS again after cache invalidation', async () => {
    vi.mocked(mockDbProvider.findByDomain).mockResolvedValue(tenantAContext);

    const req: StorefrontRequest = {
      host: 'shop-a.solospot.pl',
      path: '/products',
      queryParams: {},
      headers: {},
    };

    // 1st request -> Cache MISS
    const response1 = await storefrontRuntime.handleRequest(req);
    expect(response1.cacheStatus).toBe('MISS');

    // 2nd request -> Cache HIT
    const response2 = await storefrontRuntime.handleRequest(req);
    expect(response2.cacheStatus).toBe('HIT');
    expect(response2.html).toBe(response1.html);

    // Invalidate Cache
    storefrontRuntime.invalidatePageCache('tenant-a', '/products');

    // 3rd request -> Cache MISS again
    const response3 = await storefrontRuntime.handleRequest(req);
    expect(response3.cacheStatus).toBe('MISS');
  });

  it('Should keep cache isolated between tenants', async () => {
    // Mock domains for both tenants
    vi.mocked(mockDbProvider.findByDomain).mockImplementation(async (domain) => {
      if (domain === 'shop-a.solospot.pl') return tenantAContext;
      if (domain === 'shop-b.solospot.pl') return tenantBContext;
      return null;
    });

    const reqA: StorefrontRequest = {
      host: 'shop-a.solospot.pl',
      path: '/',
      queryParams: {},
      headers: {},
    };

    const reqB: StorefrontRequest = {
      host: 'shop-b.solospot.pl',
      path: '/',
      queryParams: {},
      headers: {},
    };

    // Get Tenant A page
    const resA = await storefrontRuntime.handleRequest(reqA);
    expect(resA.cacheStatus).toBe('MISS');
    expect(resA.html).toContain('<title>Główna - shop-a</title>');

    // Get Tenant B page -> Must be MISS (not HIT on Tenant A's cached page)
    const resB = await storefrontRuntime.handleRequest(reqB);
    expect(resB.cacheStatus).toBe('MISS');
    expect(resB.html).toContain('<title>Główna - shop-b</title>');
  });

  it('Should return 404 for unknown routes and bypass cache for cart/checkout', async () => {
    vi.mocked(mockDbProvider.findByDomain).mockResolvedValue(tenantAContext);

    // 404 test
    const res404 = await storefrontRuntime.handleRequest({
      host: 'shop-a.solospot.pl',
      path: '/unknown/random-path',
      queryParams: {},
      headers: {},
    });
    expect(res404.statusCode).toBe(404);

    // Checkout test -> Should bypass cache
    const checkoutReq = {
      host: 'shop-a.solospot.pl',
      path: '/checkout',
      queryParams: {},
      headers: {},
    };

    const resCheckout1 = await storefrontRuntime.handleRequest(checkoutReq);
    expect(resCheckout1.cacheStatus).toBe('BYPASS');

    const resCheckout2 = await storefrontRuntime.handleRequest(checkoutReq);
    expect(resCheckout2.cacheStatus).toBe('BYPASS'); // Still bypasses cache
  });
});
