import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TenantContext } from '../../platform-core/src/tenant/TenantTypes';
import { TenantContextBuilder } from '../../platform-core/src/tenant/TenantContextBuilder';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { RuntimeCompositionEngine, TenantCompositionDetailsProvider } from './RuntimeCompositionEngine';
import { PackageResolver } from './PackageResolver';
import { CapabilityResolver } from './CapabilityResolver';
import { ThemeResolver } from './ThemeResolver';
import { StoreRuntimeEngine } from './StoreRuntimeEngine';
import { ModuleFactory, RendererFactory } from '../../runtime-core/src';
import { RuntimeModule, StoreRenderer, IllegalLifecycleStateException } from './StoreRuntime';

describe('Store Runtime Engine', () => {
  let compositionEngine: RuntimeCompositionEngine;
  let packageResolver: PackageResolver;
  let capabilityResolver: CapabilityResolver;
  let themeResolver: ThemeResolver;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  // Mock Factories
  const mockModuleFactory: ModuleFactory = {
    createModule: (packageId: string, version: string): RuntimeModule => {
      return {
        id: packageId,
        manifest: { version },
        initialize: vi.fn().mockResolvedValue(undefined),
        executeAction: vi.fn().mockResolvedValue('action_executed'),
        dispose: vi.fn().mockResolvedValue(undefined),
      };
    },
  };

  const mockRendererFactory: RendererFactory = {
    createRenderer: (themeId: string, version: string, settings: Record<string, any>): StoreRenderer => {
      return {
        renderView: vi.fn().mockResolvedValue(`<html>Rendered theme ${themeId}</html>`),
      };
    },
  };

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

    // Register basic test package and theme
    packageResolver.register({
      id: 'commerce',
      version: '1.0.0',
      priority: 10,
      capabilities: ['commerce.checkout'],
    });

    themeResolver.register({
      id: 'default-theme',
      version: '1.0.0',
      defaultSettings: {},
    });

    const mockDetailsProvider: TenantCompositionDetailsProvider = {
      getPackagesForTenant: async () => ['commerce'],
      getThemeForTenant: async () => ({ id: 'default-theme' }),
      getConfigurationForTenant: async () => ({}),
    };

    compositionEngine = new RuntimeCompositionEngine({
      packageResolver,
      capabilityResolver,
      themeResolver,
      detailsProvider: mockDetailsProvider,
      eventBus,
      logger,
    });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should successfully transition through cykle zycia states: CREATED -> LOADING -> READY -> ACTIVE -> READY -> DISPOSED', async () => {
    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-xyz')
      .setSlug('xyz-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'xyz-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-xyz', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const engine = new StoreRuntimeEngine({
      compositionEngine,
      moduleFactory: mockModuleFactory,
      rendererFactory: mockRendererFactory,
      eventBus,
      logger,
    });

    // Create runtime
    const runtime = await engine.createRuntimeFromTenantContext(tenantContext);
    expect(runtime.lifecycle).toBe('READY');
    expect(runtime.tenantId).toBe('tenant-xyz');
    expect(runtime.modules.has('commerce')).toBe(true);

    // Execute Request (moves to ACTIVE then returns to READY)
    const output = await engine.executeRequest(runtime, 'home', { title: 'Welcome' });
    expect(output).toBe('<html>Rendered theme default-theme</html>');
    expect(runtime.lifecycle).toBe('READY');

    // Dispose
    await engine.disposeRuntime(runtime);
    expect(runtime.lifecycle).toBe('DISPOSED');
    expect(runtime.modules.size).toBe(0);
  });

  it('Should handle module initialization failure, transition to DISPOSED and propagate error', async () => {
    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-fail')
      .setSlug('fail-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'fail-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-fail', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const failingModuleFactory: ModuleFactory = {
      createModule: (packageId: string, version: string): RuntimeModule => {
        return {
          id: packageId,
          manifest: { version },
          initialize: vi.fn().mockRejectedValue(new Error('DB Connection Timeout inside module init')),
          executeAction: vi.fn(),
          dispose: vi.fn(),
        };
      },
    };

    const engine = new StoreRuntimeEngine({
      compositionEngine,
      moduleFactory: failingModuleFactory,
      rendererFactory: mockRendererFactory,
      eventBus,
      logger,
    });

    await expect(engine.createRuntimeFromTenantContext(tenantContext)).rejects.toThrow('DB Connection Timeout inside module init');
  });

  it('Should throw IllegalLifecycleStateException if executing request on CREATED or DISPOSED runtime', async () => {
    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-xyz')
      .setSlug('xyz-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'xyz-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-xyz', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const engine = new StoreRuntimeEngine({
      compositionEngine,
      moduleFactory: mockModuleFactory,
      rendererFactory: mockRendererFactory,
      eventBus,
      logger,
    });

    const runtime = await engine.createRuntimeFromTenantContext(tenantContext);
    
    // Dispose runtime
    await engine.disposeRuntime(runtime);
    expect(runtime.lifecycle).toBe('DISPOSED');

    // Executing request on disposed runtime throws
    await expect(
      engine.executeRequest(runtime, 'home', {})
    ).rejects.toThrow(IllegalLifecycleStateException);
  });

  it('Should invoke dispose on all loaded modules and clear modules map upon runtime disposal', async () => {
    const tenantContext = new TenantContextBuilder()
      .setTenantId('tenant-xyz')
      .setSlug('xyz-shop')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'xyz-shop.solospot.pl' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'c-xyz', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const mockModule = {
      id: 'commerce',
      manifest: {},
      initialize: vi.fn().mockResolvedValue(undefined),
      executeAction: vi.fn(),
      dispose: vi.fn().mockResolvedValue(undefined),
    };

    const customModuleFactory: ModuleFactory = {
      createModule: () => mockModule,
    };

    const engine = new StoreRuntimeEngine({
      compositionEngine,
      moduleFactory: customModuleFactory,
      rendererFactory: mockRendererFactory,
      eventBus,
      logger,
    });

    const runtime = await engine.createRuntimeFromTenantContext(tenantContext);
    expect(runtime.lifecycle).toBe('READY');

    // Dispose
    await engine.disposeRuntime(runtime);
    expect(runtime.lifecycle).toBe('DISPOSED');
    expect(mockModule.dispose).toHaveBeenCalledTimes(1);
    expect(runtime.modules.size).toBe(0);
  });
});
