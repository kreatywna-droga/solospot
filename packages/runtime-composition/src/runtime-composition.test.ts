import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TenantContext } from '../../platform-core/src/tenant/TenantTypes';
import { TenantContextBuilder } from '../../platform-core/src/tenant/TenantContextBuilder';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { RuntimeCompositionEngine, TenantCompositionDetailsProvider } from './RuntimeCompositionEngine';
import { PackageResolver, PackageManifest } from './PackageResolver';
import { CapabilityResolver, CompositionConflictError } from './CapabilityResolver';
import { ThemeResolver, ThemeManifest } from './ThemeResolver';
import { RuntimeSnapshot } from './RuntimeSnapshot';

describe('Runtime Composition Engine', () => {
  let packageResolver: PackageResolver;
  let capabilityResolver: CapabilityResolver;
  let themeResolver: ThemeResolver;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    packageResolver = new PackageResolver();
    capabilityResolver = new CapabilityResolver();
    themeResolver = new ThemeResolver();

    // Register standard mock packages
    packageResolver.register({
      id: 'commerce',
      version: '2.1.0',
      priority: 10,
      capabilities: ['commerce.checkout', 'commerce.cart'],
      configurationDefaults: { currency: 'PLN' },
    });

    packageResolver.register({
      id: 'blog',
      version: '1.0.2',
      priority: 5,
      capabilities: ['blog.read', 'blog.write'],
      configurationDefaults: { postsPerPage: 10 },
    });

    // Register standard mock theme
    themeResolver.register({
      id: 'modern',
      version: '1.0.0',
      defaultSettings: { primaryColor: '#0000ff' },
    });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should successfully compose all elements and produce a valid, frozen RuntimeSnapshot', async () => {
    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-1')
      .setSlug('test-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'test-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-1', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const mockDetailsProvider: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['commerce', 'blog'],
      getThemeForTenant: async () => ({ id: 'modern', settings: { primaryColor: '#ff0000' } }),
      getConfigurationForTenant: async () => ({ siteName: 'My Awesome Shop' }),
    };

    const engine = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider,
      eventBus,
      logger,
    });

    const snapshot = await engine.compose(tenantContext);

    // Verify snapshot fields
    expect(snapshot.tenantId).toBe('tenant-1');
    expect(snapshot.engineVersion).toBe('1.0.0');
    expect(snapshot.schemaVersion).toBe('1.0.0');
    expect(snapshot.packages).toHaveLength(2);
    expect(snapshot.packages.map(p => p.id)).toContain('commerce');
    expect(snapshot.packages.map(p => p.id)).toContain('blog');

    // Capabilities
    expect(snapshot.capabilities).toContain('commerce.checkout');
    expect(snapshot.capabilities).toContain('commerce.cart');
    expect(snapshot.capabilities).toContain('blog.read');
    expect(snapshot.capabilities).toContain('blog.write');

    // Theme settings override
    expect(snapshot.theme.id).toBe('modern');
    expect(snapshot.theme.settings.primaryColor).toBe('#ff0000'); // Override applied

    // Merged config
    expect(snapshot.configuration.tenant.siteName).toBe('My Awesome Shop');
    expect(snapshot.configuration.packages.commerce.currency).toBe('PLN');

    // Hash check
    expect(snapshot.runtimeHash).toBeDefined();
    expect(snapshot.runtimeHash.length).toBe(64); // SHA-256 length hex
  });

  it('Should throw an error if requested package is missing in the registry', async () => {
    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-1')
      .setSlug('test-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'test-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-1', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const mockDetailsProvider: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['commerce', 'nonexistent-package'],
      getThemeForTenant: async () => ({ id: 'modern' }),
      getConfigurationForTenant: async () => ({}),
    };

    const engine = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider,
      eventBus,
      logger,
    });

    await expect(engine.compose(tenantContext)).rejects.toThrow('Package not found in registry: nonexistent-package');
  });

  it('Should handle capability conflicts by picking the package with the higher priority', async () => {
    // Register two packages sharing a capability
    packageResolver.register({
      id: 'seo-basic',
      version: '1.0.0',
      priority: 10,
      capabilities: ['seo.optimizer'],
      configurationDefaults: { mode: 'basic' },
    });

    packageResolver.register({
      id: 'seo-pro',
      version: '2.0.0',
      priority: 100, // Higher priority wins!
      capabilities: ['seo.optimizer'],
      configurationDefaults: { mode: 'advanced' },
    });

    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-1')
      .setSlug('test-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'test-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-1', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const mockDetailsProvider: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['seo-basic', 'seo-pro'],
      getThemeForTenant: async () => ({ id: 'modern' }),
      getConfigurationForTenant: async () => ({}),
    };

    const engine = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider,
      eventBus,
      logger,
    });

    const snapshot = await engine.compose(tenantContext);
    expect(snapshot.capabilities).toContain('seo.optimizer');
    // Ensure both resolved but seo-pro has higher priority
    expect(snapshot.packages.find(p => p.id === 'seo-pro')?.priority).toBe(100);
  });

  it('Should throw CompositionConflictError if there is a priority tie for the same capability', async () => {
    // Register two packages sharing a capability with identical priorities
    packageResolver.register({
      id: 'stripe-payments',
      version: '1.0.0',
      priority: 50,
      capabilities: ['payments.checkout'],
    });

    packageResolver.register({
      id: 'paypal-payments',
      version: '1.0.0',
      priority: 50, // Conflict! Same priority
      capabilities: ['payments.checkout'],
    });

    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-1')
      .setSlug('test-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'test-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-1', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const mockDetailsProvider: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['stripe-payments', 'paypal-payments'],
      getThemeForTenant: async () => ({ id: 'modern' }),
      getConfigurationForTenant: async () => ({}),
    };

    const engine = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider,
      eventBus,
      logger,
    });

    await expect(engine.compose(tenantContext)).rejects.toThrow(CompositionConflictError);
  });

  it('Should verify that snapshot is completely immutable (deepFrozen)', async () => {
    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-1')
      .setSlug('test-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'test-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-1', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const mockDetailsProvider: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['commerce'],
      getThemeForTenant: async () => ({ id: 'modern' }),
      getConfigurationForTenant: async () => ({}),
    };

    const engine = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider,
      eventBus,
      logger,
    });

    const snapshot = await engine.compose(tenantContext);

    // Attempting to mutate deep properties must throw TypeError
    expect(() => {
      (snapshot as any).tenantId = 'new-tenant';
    }).toThrow(TypeError);

    expect(() => {
      snapshot.capabilities.push('illegal.capability');
    }).toThrow(TypeError);

    expect(() => {
      (snapshot.theme as any).id = 'retro';
    }).toThrow(TypeError);

    expect(Object.isFrozen(snapshot)).toBe(true);
    expect(Object.isFrozen(snapshot.capabilities)).toBe(true);
    expect(Object.isFrozen(snapshot.theme)).toBe(true);
  });

  it('Should compute runtimeHash deterministically and change if configuration is modified', async () => {
    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-1')
      .setSlug('test-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'test-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-1', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const mockDetailsProvider1: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['commerce', 'blog'],
      getThemeForTenant: async () => ({ id: 'modern', settings: { bg: 'white' } }),
      getConfigurationForTenant: async () => ({ key: 'value' }),
    };

    const mockDetailsProvider2: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['commerce', 'blog'],
      getThemeForTenant: async () => ({ id: 'modern', settings: { bg: 'white' } }),
      getConfigurationForTenant: async () => ({ key: 'value' }), // Identical configuration
    };

    const mockDetailsProvider3: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['commerce', 'blog'],
      getThemeForTenant: async () => ({ id: 'modern', settings: { bg: 'black' } }), // Different setting
      getConfigurationForTenant: async () => ({ key: 'value' }),
    };

    const engine = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider1,
      eventBus,
      logger,
    });

    const snapshot1 = await engine.compose(tenantContext);

    // Recompose with same inputs
    const engineSame = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider2,
      eventBus,
      logger,
    });
    const snapshot2 = await engineSame.compose(tenantContext);

    expect(snapshot1.runtimeHash).toBe(snapshot2.runtimeHash); // Deterministic!

    // Recompose with different settings
    const engineDiff = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider3,
      eventBus,
      logger,
    });
    const snapshot3 = await engineDiff.compose(tenantContext);

    expect(snapshot1.runtimeHash).not.toBe(snapshot3.runtimeHash); // Invariant!
  });

  it('Should successfully detect dependency chains and cycle loops in package resolver', async () => {
    // 1. Dependency Chain: Package A depends on B, B depends on C
    packageResolver.register({
      id: 'pkg-c',
      version: '1.0.0',
      priority: 1,
      capabilities: ['c'],
    });

    packageResolver.register({
      id: 'pkg-b',
      version: '1.0.0',
      priority: 1,
      capabilities: ['b'],
      dependencies: { 'pkg-c': '^1.0.0' },
    });

    packageResolver.register({
      id: 'pkg-a',
      version: '1.0.0',
      priority: 1,
      capabilities: ['a'],
      dependencies: { 'pkg-b': '^1.0.0' },
    });

    const resolved = packageResolver.resolve(['pkg-a']);
    expect(resolved.map(p => p.id)).toEqual(['pkg-c', 'pkg-b', 'pkg-a']); // DAG order!

    // 2. Cyclic Loop: A depends on B, B depends on C, C depends on A
    packageResolver.register({
      id: 'pkg-c-loop',
      version: '1.0.0',
      priority: 1,
      capabilities: ['c'],
      dependencies: { 'pkg-a-loop': '^1.0.0' },
    });

    packageResolver.register({
      id: 'pkg-b-loop',
      version: '1.0.0',
      priority: 1,
      capabilities: ['b'],
      dependencies: { 'pkg-c-loop': '^1.0.0' },
    });

    packageResolver.register({
      id: 'pkg-a-loop',
      version: '1.0.0',
      priority: 1,
      capabilities: ['a'],
      dependencies: { 'pkg-b-loop': '^1.0.0' },
    });

    expect(() => {
      packageResolver.resolve(['pkg-a-loop']);
    }).toThrow('Circular dependency detected involving package: pkg-a-loop');
  });
});
