import { RuntimeContext, StoreLifecycleState, StoreRuntimeSnapshot } from './RuntimeContext';
import { RuntimeMode } from './RuntimeMode';
import { RuntimeResult } from './RuntimeResult';
import { RuntimeSection } from './RuntimeSection';

export interface RuntimeModule {
  readonly id: string;
  readonly manifest: Record<string, unknown>;
  initialize(context: StoreRuntimeSnapshot): Promise<void>;
  executeAction(actionName: string, payload: unknown): Promise<unknown>;
  dispose(): Promise<void>;
}

export interface StoreRenderer {
  renderView(viewName: string, props: Record<string, unknown>): Promise<string>;
}

export interface CapabilityProvider {
  readonly capability: string;
  readonly provider: string;
  execute(payload: unknown): Promise<unknown>;
}

export interface RuntimeRequest {
  viewName: string;
  props?: Record<string, unknown>;
  mode?: 'LIVE' | 'PREVIEW' | 'EXPORT';
}

export interface RuntimeInstance {
  readonly tenantId: string;
  readonly id: string;
  readonly lifecycle: StoreLifecycleState;
  readonly modules: Map<string, RuntimeModule>;
  readonly renderer: StoreRenderer;
}

export interface RuntimeEngine {
  createRuntime(
    context: RuntimeContext
  ): Promise<RuntimeInstance>;

  render(
    runtime: RuntimeInstance,
    request: RuntimeRequest
  ): Promise<RuntimeResult>;

  dispose(
    runtime: RuntimeInstance
  ): Promise<void>;

  resolveCapability(capability: string): CapabilityProvider | null;
  
  getActiveInstance(tenantId: string): RuntimeInstance | undefined;
}

export interface ModuleFactory {
  createModule(packageId: string, version: string): RuntimeModule;
}

export interface RendererFactory {
  createRenderer(themeId: string, version: string, settings: Record<string, unknown>): StoreRenderer;
}

export interface TenantContext {
  readonly tenantId: string;
  readonly slug: string;
  readonly status: 'ACTIVE' | 'SUSPENDED' | 'MAINTENANCE';
  readonly domains: {
    readonly primary: string;
    readonly custom?: string;
  };
  readonly plan: {
    readonly tier: 'FREE' | 'GROWTH' | 'ENTERPRISE';
    readonly limits: Record<string, number>;
  };
  readonly capabilities: ReadonlyArray<string>;
  readonly metadata: {
    readonly cacheKey: string;
    readonly lastRefresh: string;
    readonly ttlSeconds: number;
    readonly locale?: string;
    readonly currency?: string;
  };
}

export interface RuntimeEngineConfig {
  readonly compositionEngine: RuntimeCompositionEngine;
  readonly moduleFactory: ModuleFactory;
  readonly rendererFactory: RendererFactory;
  readonly eventBus: EventBus;
  readonly logger: Logger;
}

export interface RuntimeCompositionEngine {
  compose(tenantContext: TenantContext, correlationId?: string): Promise<StoreRuntimeSnapshot>;
}

export interface EventBus {
  publish(event: PlatformEvent): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>, tenantId?: string): SubscriptionToken;
  unsubscribe(token: SubscriptionToken): void;
}

export interface PlatformEvent<T = unknown> {
  readonly eventId: string;
  readonly eventType: string;
  readonly timestamp: string;
  readonly correlationId: string;
  readonly tenantId: string;
  readonly payload: T;
}

export type EventHandler<T = unknown> = (event: PlatformEvent<T>) => Promise<void> | void;

export interface SubscriptionToken {
  readonly id: string;
  readonly eventType: string;
}

export interface Logger {
  info(payload: LogPayload): void;
  warn(payload: LogPayload): void;
  error(payload: LogPayload & { readonly error?: Error }): void;
  fatal(payload: LogPayload & { readonly error?: Error }): void;
}

export interface LogPayload {
  readonly message: string;
  readonly correlationId?: string;
  readonly tenantId?: string;
  readonly module?: string;
  readonly eventType?: string;
  readonly metadata?: Record<string, unknown>;
}