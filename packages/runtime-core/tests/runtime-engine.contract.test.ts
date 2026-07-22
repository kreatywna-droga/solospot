import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { StoreRuntimeEngine } from '../../runtime-composition/src/StoreRuntimeEngine';
import { 
  RuntimeEngine, 
  RuntimeContext, 
  RuntimeRequest, 
  RuntimeResult,
  RuntimeInstance,
  StoreRuntimeSnapshot,
  PackageInfo,
  ThemeInfo,
  ModuleFactory,
  RendererFactory,
  RuntimeModule,
  StoreRenderer,
  CapabilityProvider
} from '../../runtime-core/src';

function createMockRuntimeSnapshot(): StoreRuntimeSnapshot {
  return {
    tenantId: 'test-tenant',
    engineVersion: '1.0.0',
    schemaVersion: '1.0.0',
    packages: [
      { id: 'commerce', version: '1.0.0', priority: 10 },
      { id: 'payments', version: '1.0.0', priority: 5 },
    ] as PackageInfo[],
    capabilities: ['commerce.orders', 'payments.stripe', 'test.capability'],
    theme: {
      id: 'default-theme',
      version: '1.0.0',
      settings: { primaryColor: '#7c3aed', font: 'Inter' }
    } as ThemeInfo,
    configuration: {},
    runtimeHash: 'abc123',
    composedAt: new Date().toISOString(),
  };
}

function createMockModule(): RuntimeModule {
  return {
    id: 'test-module',
    manifest: { capabilities: ['test.capability'] },
    initialize: vi.fn().mockResolvedValue(undefined),
    executeAction: vi.fn().mockResolvedValue('ok'),
    dispose: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockRenderer(): StoreRenderer {
  return {
    renderView: vi.fn().mockResolvedValue('<html>Mock Rendered</html>'),
  };
}

function createMockModuleFactory(mockModule: RuntimeModule): ModuleFactory {
  return {
    createModule: vi.fn().mockReturnValue(mockModule),
  };
}

function createMockRendererFactory(mockRenderer: StoreRenderer): RendererFactory {
  return {
    createRenderer: vi.fn().mockReturnValue(mockRenderer),
  };
}

function createMockCompositionEngine(mockSnapshot: StoreRuntimeSnapshot): any {
  return {
    compose: vi.fn().mockResolvedValue(mockSnapshot),
  };
}

function createMockEventBus(): any {
  return {
    publish: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockReturnValue({ id: 'sub-1', eventType: 'test' }),
    unsubscribe: vi.fn(),
  };
}

function createMockLogger(): any {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
  };
}

function createTestContext(tenantId: string = 'tenant-test'): RuntimeContext {
  return {
    tenant: {
      tenantId,
      slug: 'test-shop',
      domains: { primary: 'test.solospot.pl' },
      plan: { tier: 'GROWTH', limits: {} },
      capabilities: ['commerce.orders'],
      metadata: { locale: 'pl_PL', currency: 'PLN' },
    },
    config: {
      storeId: 'store-123',
      storeName: 'Test Shop',
      publicationStatus: 'PUBLISHED',
      branding: {
        primaryColor: '#7c3aed',
        secondaryColor: '#ec4899',
        font: 'Inter',
      },
      pages: [],
      products: [],
    },
    mode: 'LIVE',
    correlationId: `test-${Date.now()}`,
    timestamp: new Date().toISOString(),
  };
}

describe('RuntimeEngine Contract Tests', () => {
  let engine: RuntimeEngine;
  let mockModule: RuntimeModule;
  let mockRenderer: StoreRenderer;
  let mockSnapshot: StoreRuntimeSnapshot;
  let mockModuleFactory: ModuleFactory;
  let mockRendererFactory: RendererFactory;
  let mockCompositionEngine: any;
  let mockEventBus: any;
  let mockLogger: any;

  beforeEach(() => {
    mockModule = createMockModule();
    mockRenderer = createMockRenderer();
    mockSnapshot = createMockRuntimeSnapshot();
    mockModuleFactory = createMockModuleFactory(mockModule);
    mockRendererFactory = createMockRendererFactory(mockRenderer);
    mockCompositionEngine = createMockCompositionEngine(mockSnapshot);
    mockEventBus = createMockEventBus();
    mockLogger = createMockLogger();

    engine = new StoreRuntimeEngine({
      compositionEngine: mockCompositionEngine,
      moduleFactory: mockModuleFactory,
      rendererFactory: mockRendererFactory,
      eventBus: mockEventBus,
      logger: mockLogger,
    });
  });

  describe('createRuntime()', () => {
    it('should create a RuntimeInstance with correct tenantId', async () => {
      const context = createTestContext('tenant-a');
      
      const runtime = await engine.createRuntime(context);

      expect(runtime).toBeDefined();
      expect(runtime.tenantId).toBe('tenant-a');
      expect(typeof runtime.id).toBe('string');
      expect(runtime.id.length).toBeGreaterThan(0);
    });

    it('should have lifecycle READY after creation', async () => {
      const context = createTestContext('tenant-lifecycle');
      
      const runtime = await engine.createRuntime(context);

      expect(runtime.lifecycle).toBe('READY');
    });

    it('should have renderer instance', async () => {
      const context = createTestContext('tenant-renderer');
      
      const runtime = await engine.createRuntime(context);

      expect(runtime.renderer).toBeDefined();
      expect(typeof runtime.renderer.renderView).toBe('function');
    });

    it('should have modules map initialized', async () => {
      const context = createTestContext('tenant-modules');
      
      const runtime = await engine.createRuntime(context);

      expect(runtime.modules).toBeDefined();
      expect(runtime.modules instanceof Map).toBe(true);
    });

    it('should initialize modules from snapshot', async () => {
      const context = createTestContext('tenant-modules-init');
      
      const runtime = await engine.createRuntime(context);

      expect(mockModuleFactory.createModule).toHaveBeenCalledTimes(2);
      expect(mockModule.initialize).toHaveBeenCalledTimes(2);
      expect(runtime.modules.size).toBe(2);
      expect(runtime.modules.has('commerce')).toBe(true);
      expect(runtime.modules.has('payments')).toBe(true);
    });

    it('should create renderer with theme settings', async () => {
      const context = createTestContext('tenant-renderer-create');
      
      await engine.createRuntime(context);

      expect(mockRendererFactory.createRenderer).toHaveBeenCalledWith(
        'default-theme',
        '1.0.0',
        { primaryColor: '#7c3aed', font: 'Inter' }
      );
    });

    it('should emit StoreRuntime.Created and StoreRuntime.Ready events', async () => {
      const context = createTestContext('tenant-events');
      
      await engine.createRuntime(context);

      const createdEvents = mockEventBus.publish.mock.calls.filter(
        (call: any[]) => call[0].eventType === 'StoreRuntime.Created'
      );
      const readyEvents = mockEventBus.publish.mock.calls.filter(
        (call: any[]) => call[0].eventType === 'StoreRuntime.Ready'
      );

      expect(createdEvents.length).toBe(1);
      expect(readyEvents.length).toBe(1);
    });
  });

  describe('render()', () => {
    it('should return RuntimeResult with success=true', async () => {
      const context = createTestContext('tenant-render-success');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'home', props: { title: 'Welcome' } };
      const result = await engine.render(runtime, request);

      expect(result.success).toBe(true);
    });

    it('should return RuntimeResult with correct tenantId', async () => {
      const context = createTestContext('tenant-render-tenantid');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'home', props: {} };
      const result = await engine.render(runtime, request);

      expect(result.tenantId).toBe('tenant-render-tenantid');
    });

    it('should return RuntimeResult with correct mode', async () => {
      const context = createTestContext('tenant-render-mode');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'home', props: {}, mode: 'PREVIEW' };
      const result = await engine.render(runtime, request);

      expect(result.mode).toBe('PREVIEW');
    });

    it('should return RuntimeResult with renderedAt timestamp', async () => {
      const context = createTestContext('tenant-render-timestamp');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'home', props: {} };
      const result = await engine.render(runtime, request);

      expect(result.renderedAt).toBeDefined();
      expect(new Date(result.renderedAt!).getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should transition lifecycle to ACTIVE during render', async () => {
      const context = createTestContext('tenant-render-lifecycle');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'home', props: {} };
      await engine.render(runtime, request);

      expect(runtime.lifecycle).toBe('READY');
    });

    it('should call renderer.renderView with viewName and props', async () => {
      const context = createTestContext('tenant-render-call');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'product', props: { id: '123' } };
      await engine.render(runtime, request);

      expect(mockRenderer.renderView).toHaveBeenCalledWith('product', { id: '123' });
    });

    it('should emit StoreRuntime.Active event during render', async () => {
      const context = createTestContext('tenant-render-active-event');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'home', props: {} };
      await engine.render(runtime, request);

      const activeEvents = mockEventBus.publish.mock.calls.filter(
        (call: any[]) => call[0].eventType === 'StoreRuntime.Active'
      );
      expect(activeEvents.length).toBe(1);
    });
  });

  describe('dispose()', () => {
    it('should set lifecycle to DISPOSED', async () => {
      const context = createTestContext('tenant-dispose');
      const runtime = await engine.createRuntime(context);

      await engine.dispose(runtime);

      expect(runtime.lifecycle).toBe('DISPOSED');
    });

    it('should dispose all modules', async () => {
      const context = createTestContext('tenant-dispose-modules');
      const runtime = await engine.createRuntime(context);

      await engine.dispose(runtime);

      expect(mockModule.dispose).toHaveBeenCalledTimes(2);
    });

    it('should clear modules map', async () => {
      const context = createTestContext('tenant-dispose-clear');
      const runtime = await engine.createRuntime(context);

      await engine.dispose(runtime);

      expect(runtime.modules.size).toBe(0);
    });

    it('should emit StoreRuntime.Disposed event', async () => {
      const context = createTestContext('tenant-dispose-event');
      const runtime = await engine.createRuntime(context);

      await engine.dispose(runtime);

      const disposedEvents = mockEventBus.publish.mock.calls.filter(
        (call: any[]) => call[0].eventType === 'StoreRuntime.Disposed'
      );
      expect(disposedEvents.length).toBe(1);
    });

    it('should be idempotent - calling dispose twice should not throw', async () => {
      const context = createTestContext('tenant-dispose-idempotent');
      const runtime = await engine.createRuntime(context);

      await engine.dispose(runtime);
      await expect(engine.dispose(runtime)).resolves.not.toThrow();
    });
  });

  describe('resolveCapability()', () => {
    it('should return CapabilityProvider for known capability', async () => {
      const context = createTestContext('tenant-capability');
      const runtime = await engine.createRuntime(context);

      const provider = engine.resolveCapability('commerce.orders');

      expect(provider).not.toBeNull();
      expect(provider?.capability).toBe('commerce.orders');
      expect(typeof provider?.execute).toBe('function');
    });

    it('should return null for unknown capability', async () => {
      const context = createTestContext('tenant-capability-unknown');
      const runtime = await engine.createRuntime(context);

      const provider = engine.resolveCapability('unknown.capability');

      expect(provider).toBeNull();
    });

    it('should execute capability through module', async () => {
      const context = createTestContext('tenant-capability-execute');
      const runtime = await engine.createRuntime(context);

      const provider = engine.resolveCapability('test.capability');
      expect(provider).not.toBeNull();

      const result = await provider!.execute({ action: 'test' });
      expect(result).toBe('ok');
      expect(mockModule.executeAction).toHaveBeenCalledWith('test.capability', { action: 'test' });
    });
  });

  describe('getActiveInstance()', () => {
    it('should return cached runtime by tenantId', async () => {
      const context = createTestContext('tenant-cache');
      const runtime = await engine.createRuntime(context);

      const cached = engine.getActiveInstance('tenant-cache');

      expect(cached).toBe(runtime);
    });

    it('should return undefined for unknown tenantId', async () => {
      const cached = engine.getActiveInstance('unknown-tenant');
      expect(cached).toBeUndefined();
    });
  });

  describe('Tenant Isolation', () => {
    it('should create separate runtimes for different tenants', async () => {
      const contextA = createTestContext('tenant-a');
      const contextB = createTestContext('tenant-b');

      const runtimeA = await engine.createRuntime(contextA);
      const runtimeB = await engine.createRuntime(contextB);

      expect(runtimeA).not.toBe(runtimeB);
      expect(runtimeA.tenantId).toBe('tenant-a');
      expect(runtimeB.tenantId).toBe('tenant-b');
    });

    it('should not share modules between tenants', async () => {
      const contextA = createTestContext('tenant-iso-a');
      const contextB = createTestContext('tenant-iso-b');

      await engine.createRuntime(contextA);
      await engine.createRuntime(contextB);

      expect(mockModuleFactory.createModule).toHaveBeenCalledTimes(4);
    });

    it('should not share lifecycle state between tenants', async () => {
      const contextA = createTestContext('tenant-iso-life-a');
      const contextB = createTestContext('tenant-iso-life-b');

      const runtimeA = await engine.createRuntime(contextA);
      const runtimeB = await engine.createRuntime(contextB);

      // Dispose tenant A
      await engine.dispose(runtimeA);

      // Tenant B should still be READY
      expect(runtimeB.lifecycle).toBe('READY');
    });

    it('should isolate event emissions by tenantId', async () => {
      const contextA = createTestContext('tenant-iso-event-a');
      const contextB = createTestContext('tenant-iso-event-b');

      await engine.createRuntime(contextA);
      await engine.createRuntime(contextB);

      const createdEventsA = mockEventBus.publish.mock.calls.filter(
        (call: any[]) => call[0].eventType === 'StoreRuntime.Created' && call[0].tenantId === 'tenant-iso-event-a'
      );
      const createdEventsB = mockEventBus.publish.mock.calls.filter(
        (call: any[]) => call[0].eventType === 'StoreRuntime.Created' && call[0].tenantId === 'tenant-iso-event-b'
      );

      expect(createdEventsA.length).toBe(1);
      expect(createdEventsB.length).toBe(1);
    });
  });

  describe('Contract Edge Cases', () => {
    it('should handle render with empty props', async () => {
      const context = createTestContext('tenant-empty-props');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'home', props: {} };
      const result = await engine.render(runtime, request);

      expect(result.success).toBe(true);
    });

    it('should handle render with undefined props', async () => {
      const context = createTestContext('tenant-undefined-props');
      const runtime = await engine.createRuntime(context);

      const request: RuntimeRequest = { viewName: 'home' };
      const result = await engine.render(runtime, request);

      expect(result.success).toBe(true);
    });

    it('should handle different modes', async () => {
      const modes: Array<'LIVE' | 'PREVIEW' | 'EXPORT'> = ['LIVE', 'PREVIEW', 'EXPORT'];

      for (const mode of modes) {
        const context = createTestContext(`tenant-mode-${mode}`);
        const runtime = await engine.createRuntime(context);

        const request: RuntimeRequest = { viewName: 'home', props: {}, mode };
        const result = await engine.render(runtime, request);

        expect(result.mode).toBe(mode);
      }
    });
  });
});
