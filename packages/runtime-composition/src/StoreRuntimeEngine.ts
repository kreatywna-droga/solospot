import { TenantContext } from '../../platform-core/src/tenant';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { EventRegistry } from '../../platform-core/src/events/EventRegistry';
import { RuntimeSnapshot } from './RuntimeSnapshot';
import { RuntimeCompositionEngine } from './RuntimeCompositionEngine';
import { StoreRuntime, StoreLifecycleState, RuntimeModule, StoreRenderer, IllegalLifecycleStateException } from './StoreRuntime';

import { 
  RuntimeEngine, 
  RuntimeInstance, 
  CapabilityProvider, 
  RuntimeContext, 
  ModuleFactory, 
  RendererFactory,
  RuntimeResult,
  RuntimeRequest,
  StoreRuntimeSnapshot
} from '../../runtime-core/src';

class StoreRuntimeImpl implements RuntimeInstance {
  public lifecycle: StoreLifecycleState = 'CREATED';
  public readonly modules = new Map<string, RuntimeModule>();
  public snapshot!: StoreRuntimeSnapshot;
  public renderer!: StoreRenderer;

  constructor(
    public readonly tenantId: string,
    public readonly id: string = `runtime_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  ) {}
  
  // Legacy property for backward compatibility
  get runtimeSnapshot(): RuntimeSnapshot {
    return this.snapshot as unknown as RuntimeSnapshot;
  }
  set runtimeSnapshot(value: RuntimeSnapshot) {
    this.snapshot = value as unknown as StoreRuntimeSnapshot;
  }
}

export class StoreRuntimeEngine implements RuntimeEngine {
  private readonly compositionEngine: RuntimeCompositionEngine;
  private readonly moduleFactory: ModuleFactory;
  private readonly rendererFactory: RendererFactory;
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  
  // Active runtime instances cache
  private readonly activeRuntimes = new Map<string, StoreRuntimeImpl>();

  constructor(options: {
    compositionEngine: RuntimeCompositionEngine;
    moduleFactory: ModuleFactory;
    rendererFactory: RendererFactory;
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
  }) {
    this.compositionEngine = options.compositionEngine;
    this.moduleFactory = options.moduleFactory;
    this.rendererFactory = options.rendererFactory;
    this.eventBus = options.eventBus;
    this.logger = options.logger;

    // Register store runtime lifecycle events
    const runtimeEvents = [
      'StoreRuntime.Created',
      'StoreRuntime.Ready',
      'StoreRuntime.Active',
      'StoreRuntime.Disposed',
    ];
    for (const evt of runtimeEvents) {
      EventRegistry.register(evt);
    }
  }

  /**
   * Creates and initializes a StoreRuntime instance from TenantContext (legacy).
   * Moves lifecycle: CREATED -> LOADING -> READY.
   * @deprecated Use createRuntime(RuntimeContext) instead
   */
  public async createRuntimeFromTenantContext(
    tenantContext: TenantContext,
    correlationId?: string
  ): Promise<RuntimeInstance> {
    const cid = correlationId || `run_init_${Date.now()}`;
    const tenantId = tenantContext.tenantId;

    this.logger.info({
      message: `Initializing StoreRuntime for tenant: ${tenantId}`,
      correlationId: cid,
      tenantId,
    });

    const runtime = new StoreRuntimeImpl(tenantId);
    
    // Event: StoreRuntime.Created
    await this.eventBus.publish({
      eventId: `evt_run_created_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'StoreRuntime.Created',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { tenantId },
    });

    try {
      runtime.lifecycle = 'LOADING';

      // 1. Compose snapshot
      const snapshot = await this.compositionEngine.compose(tenantContext, cid);
      (runtime as any).runtimeSnapshot = snapshot;

      // 2. Instantiate and initialize modules
      for (const pkg of snapshot.packages) {
        const mod = this.moduleFactory.createModule(pkg.id, pkg.version);
        await mod.initialize(snapshot);
        runtime.modules.set(pkg.id, mod);
      }

      // 3. Create renderer
      (runtime as any).renderer = this.rendererFactory.createRenderer(
        snapshot.theme.id,
        snapshot.theme.version,
        snapshot.theme.settings
      );

      runtime.lifecycle = 'READY';

      // Event: StoreRuntime.Ready
      await this.eventBus.publish({
        eventId: `evt_run_ready_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'StoreRuntime.Ready',
        timestamp: new Date().toISOString(),
        correlationId: cid,
        tenantId,
        payload: { tenantId, runtimeHash: snapshot.runtimeHash },
      });

      this.logger.info({
        message: `StoreRuntime is READY for tenant: ${tenantId}`,
        correlationId: cid,
        tenantId,
      });

      // Cache the runtime
      this.activeRuntimes.set(tenantId, runtime);

      return runtime as RuntimeInstance;
    } catch (err: any) {
      this.logger.error({
        message: `Failed to initialize StoreRuntime for tenant: ${tenantId}. Error: ${err.message}`,
        correlationId: cid,
        tenantId,
      });
      // Move to DISPOSED state to cleanup
      await this.disposeRuntime(runtime as RuntimeInstance, cid);
      throw err;
    }
  }

  /**
   * Creates a runtime instance from RuntimeContext (adapter method).
   * Implements RuntimeEngine interface.
   */
  public async createRuntime(context: RuntimeContext): Promise<RuntimeInstance> {
    const tenantContext: TenantContext = {
      tenantId: context.tenant.tenantId,
      slug: context.tenant.slug,
      status: 'ACTIVE',
      domains: context.tenant.domains,
      plan: context.tenant.plan,
      capabilities: [...context.tenant.capabilities],
      metadata: {
        cacheKey: '',
        lastRefresh: new Date().toISOString(),
        ttlSeconds: 3600,
        locale: context.tenant.metadata.locale,
        currency: context.tenant.metadata.currency,
      },
    };

    return this.createRuntimeFromTenantContext(tenantContext, context.correlationId);
  }

  /**
   * Renders a view using the runtime instance (adapter method).
   * Implements RuntimeEngine interface.
   */
  public async render(
    runtime: RuntimeInstance,
    request: RuntimeRequest
  ): Promise<RuntimeResult> {
    const cid = runtime.id;
    const tenantId = runtime.tenantId;

    const html = await this.executeRequest(runtime, request.viewName, request.props || {}, cid);

    const { createSuccessResult } = await import('../../runtime-core/src/RuntimeResult');

    return createSuccessResult(
      '', // storeId - would come from context in real impl
      tenantId,
      request.viewName,
      '1.0.0',
      { id: '', slug: request.viewName, name: '', sections: [] },
      [],
      { primaryColor: '#7c3aed', secondaryColor: '#ec4899', font: 'Inter' },
      { renderedAt: new Date().toISOString(), mode: request.mode || 'LIVE' }
    );
  }

  /**
   * Disposes a runtime instance (adapter method).
   * Implements RuntimeEngine interface.
   */
  public async dispose(runtime: RuntimeInstance): Promise<void> {
    await this.disposeRuntime(runtime);
  }

  /**
   * Initializes a runtime context and returns the instance.
   * Legacy method for backward compatibility.
   * @deprecated Use createRuntime(RuntimeContext) instead
   */
  public async initialize(context: RuntimeContext): Promise<RuntimeInstance> {
    const tenantContext: TenantContext = {
      tenantId: context.tenant.tenantId,
      slug: context.tenant.slug,
      status: 'ACTIVE',
      domains: context.tenant.domains,
      plan: context.tenant.plan,
      capabilities: [...context.tenant.capabilities],
      metadata: {
        cacheKey: '',
        lastRefresh: new Date().toISOString(),
        ttlSeconds: 3600,
        locale: context.tenant.metadata.locale,
        currency: context.tenant.metadata.currency,
      },
    };

    const instance = await this.createRuntimeFromTenantContext(tenantContext, context.correlationId);
    return instance;
  }

  /**
   * Executes a render request on the StoreRuntime instance.
   * Temporarily transitions lifecycle: READY -> ACTIVE -> READY.
   */
  public async executeRequest(
    runtime: RuntimeInstance,
    viewName: string,
    props: Record<string, unknown>,
    correlationId?: string
  ): Promise<string> {
    const cid = correlationId || `run_exec_${Date.now()}`;
    const tenantId = runtime.tenantId;

    if (runtime.lifecycle !== 'READY' && runtime.lifecycle !== 'ACTIVE') {
      throw new IllegalLifecycleStateException(
        `Cannot execute request on StoreRuntime for tenant '${tenantId}' in state '${runtime.lifecycle}'`
      );
    }

    const impl = runtime as StoreRuntimeImpl;
    const previousState = impl.lifecycle;
    impl.lifecycle = 'ACTIVE';

    // Event: StoreRuntime.Active
    await this.eventBus.publish({
      eventId: `evt_run_active_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'StoreRuntime.Active',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { tenantId, viewName },
    });

    try {
      const output = await runtime.renderer.renderView(viewName, props);
      impl.lifecycle = previousState === 'ACTIVE' ? 'ACTIVE' : 'READY';
      return output;
    } catch (err: any) {
      impl.lifecycle = previousState === 'ACTIVE' ? 'ACTIVE' : 'READY';
      this.logger.error({
        message: `Error rendering view '${viewName}' for tenant '${tenantId}': ${err.message}`,
        correlationId: cid,
        tenantId,
      });
      throw err;
    }
  }

  /**
   * Resolves a capability provider.
   * Implements RuntimeEngine interface.
   */
  public resolveCapability(capability: string): CapabilityProvider | null {
    // In this implementation, capabilities are resolved at composition time
    // and available through the snapshot. We check if the capability exists.
    for (const [, runtime] of this.activeRuntimes) {
      if (runtime.runtimeSnapshot.capabilities.includes(capability)) {
        return {
          capability,
          provider: runtime.tenantId,
          execute: async (payload: unknown) => {
            // Find module that provides this capability
            for (const [, module] of runtime.modules) {
              if ((module.manifest as any).capabilities?.includes(capability)) {
                return module.executeAction(capability, payload);
              }
            }
            throw new Error(`No module provides capability: ${capability}`);
          },
        };
      }
    }
    return null;
  }

  /**
   * Gets an active runtime instance by tenant ID.
   * Implements RuntimeEngine interface.
   */
  public getActiveInstance(tenantId: string): RuntimeInstance | undefined {
    const runtime = this.activeRuntimes.get(tenantId);
    return runtime as RuntimeInstance | undefined;
  }

  /**
   * Disposes the StoreRuntime instance, clearing resources.
   * Moves lifecycle to DISPOSED.
   */
  public async disposeRuntime(runtime: RuntimeInstance, correlationId?: string): Promise<void> {
    const cid = correlationId || `run_disp_${Date.now()}`;
    const tenantId = runtime.tenantId;

    if (runtime.lifecycle === 'DISPOSED') {
      return;
    }

    this.logger.info({
      message: `Disposing StoreRuntime for tenant: ${tenantId}`,
      correlationId: cid,
      tenantId,
    });

    const impl = runtime as StoreRuntimeImpl;

    // Dispose all initialized modules
    for (const [pkgId, mod] of impl.modules.entries()) {
      try {
        await mod.dispose();
      } catch (err: any) {
        this.logger.error({
          message: `Failed to dispose module '${pkgId}' for tenant '${tenantId}': ${err.message}`,
          correlationId: cid,
          tenantId,
        });
      }
    }

    impl.modules.clear();
    impl.lifecycle = 'DISPOSED';

    // Event: StoreRuntime.Disposed
    await this.eventBus.publish({
      eventId: `evt_run_disp_${Math.random().toString(36).substr(2, 9)}`,
      eventType: 'StoreRuntime.Disposed',
      timestamp: new Date().toISOString(),
      correlationId: cid,
      tenantId,
      payload: { tenantId },
    });

    // Remove from cache
    this.activeRuntimes.delete(tenantId);
  }
}