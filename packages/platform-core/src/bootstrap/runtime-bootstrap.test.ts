import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Platform } from './RuntimeBootstrap';
import { ConfigurationManager } from '../config/PlatformConfig';
import { PlatformEvent } from '../events/PlatformEvent';
import { PlatformEventBusImpl } from '../events/PlatformEventBus';

describe('Platform Runtime Bootstrap', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should successfully boot all core modules and enter READY state within performance budget', async () => {
    const platform = new Platform();
    
    expect(platform.getState()).toBe('CREATED');

    const context = await platform.bootstrap();

    expect(context.healthStatus).toBe('READY');
    expect(context.initializedModules).toContain('Configuration');
    expect(context.initializedModules).toContain('Logger');
    expect(context.initializedModules).toContain('EventBus');
    expect(context.initializedModules).toContain('Diagnostics');
    expect(context.bootstrapTimeMs).toBeGreaterThanOrEqual(0);
    expect(context.bootstrapTimeMs).toBeLessThanOrEqual(50); // SLA budget check
    expect(context.errors).toHaveLength(0);

    expect(platform.getState()).toBe('READY');
  });

  it('Should transition to FAILED state if configuration validation fails', async () => {
    (process.env as any).NODE_ENV = 'invalid_env'; // Invalid enum value for Zod schema
    
    // Prevent console.error clutter in test output
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const platform = new Platform();

    await expect(platform.bootstrap()).rejects.toThrow();
    expect(platform.getState()).toBe('FAILED');
  });

  it('Should transition to DEGRADED state if a non-critical check is DEGRADED', async () => {
    const platform = new Platform();

    // Register degraded check before boot
    platform.getDiagnostics().register({
      name: 'NonCriticalTelemetry',
      check: async () => ({
        status: 'DEGRADED',
        message: 'High response latency',
        timestamp: new Date().toISOString(),
      }),
    });

    const context = await platform.bootstrap();

    expect(context.healthStatus).toBe('DEGRADED');
    expect(platform.getState()).toBe('DEGRADED');
  });

  it('Should transition to FAILED state if a check is FAILED', async () => {
    const platform = new Platform();

    // Register failed check before boot
    platform.getDiagnostics().register({
      name: 'CriticalDatabaseClient',
      check: async () => ({
        status: 'FAILED',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      }),
    });

    await expect(platform.bootstrap()).rejects.toThrow();
    expect(platform.getState()).toBe('FAILED');
  });

  it('Should emit all bootstrap lifecycle events in correct sequence', async () => {
    // Intercept all events published during bootstrap
    const publishedEvents: PlatformEvent[] = [];
    const originalPublish = PlatformEventBusImpl.prototype.publish;
    
    vi.spyOn(PlatformEventBusImpl.prototype, 'publish').mockImplementation(async function(this: any, event: PlatformEvent) {
      publishedEvents.push(event);
      return originalPublish.call(this, event);
    });

    const platform = new Platform();
    await platform.bootstrap();

    // Filter out log events since logger writes to EventBus on execution completion
    const lifecycleEvents = publishedEvents.filter(e => e.eventType !== 'System.LogCreated');

    // Verify events were emitted
    expect(lifecycleEvents.length).toBeGreaterThanOrEqual(5);
    
    // First event should be Bootstrap.Started
    expect(lifecycleEvents[0].eventType).toBe('Bootstrap.Started');
    
    // Middle events should be ModuleInitialized for Configuration, Logger, EventBus
    const initializedModules = lifecycleEvents
      .filter(e => e.eventType === 'Bootstrap.ModuleInitialized')
      .map(e => e.payload.moduleName);
      
    expect(initializedModules).toContain('Configuration');
    expect(initializedModules).toContain('Logger');
    expect(initializedModules).toContain('EventBus');
    expect(initializedModules).toContain('Diagnostics');

    // Final event should be Bootstrap.Ready
    const lastEvent = lifecycleEvents[lifecycleEvents.length - 1];
    expect(lastEvent.eventType).toBe('Bootstrap.Ready');
    expect(lastEvent.payload.bootstrapTimeMs).toBeGreaterThanOrEqual(0);
  });
});
