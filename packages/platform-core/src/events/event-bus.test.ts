import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlatformEventBusImpl } from './PlatformEventBus';
import { PlatformEvent } from './PlatformEvent';
import { EventRegistry } from './EventRegistry';

describe('PlatformEventBus', () => {
  let eventBus: PlatformEventBusImpl;
  let mockLogger: any;

  beforeEach(() => {
    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      fatal: vi.fn(),
    };
    eventBus = new PlatformEventBusImpl(mockLogger);
  });

  it('Should successfully publish and subscribe to events (Pub-Sub Flow)', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    
    eventBus.subscribe('Test.Created', handler);

    const event: PlatformEvent = {
      eventId: 'evt_111',
      eventType: 'Test.Created',
      timestamp: new Date().toISOString(),
      correlationId: 'req_111',
      payload: { key: 'value' },
    };

    await eventBus.publish(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('Should correctly unsubscribe and stop receiving events', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);

    const token = eventBus.subscribe('Test.Created', handler);
    eventBus.unsubscribe(token);

    const event: PlatformEvent = {
      eventId: 'evt_222',
      eventType: 'Test.Created',
      timestamp: new Date().toISOString(),
      correlationId: 'req_222',
      payload: {},
    };

    await eventBus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('Should propagate correlationId across chained events', async () => {
    const nextEventSpy = vi.fn().mockResolvedValue(undefined);
    eventBus.subscribe('Test.Created', async (event) => {
      // Simulate chained event emission in subscriber
      await eventBus.publish({
        eventId: 'evt_chained_1',
        eventType: 'Tenant.Resolved',
        timestamp: new Date().toISOString(),
        correlationId: event.correlationId, // Propagating the Correlation ID
        causationId: event.eventId,
        payload: { tenant: 'store_abc' },
      });
    });

    eventBus.subscribe('Tenant.Resolved', nextEventSpy);

    const initialEvent: PlatformEvent = {
      eventId: 'evt_root_1',
      eventType: 'Test.Created',
      timestamp: new Date().toISOString(),
      correlationId: 'req_origin_correlation_123',
      payload: {},
    };

    await eventBus.publish(initialEvent);

    expect(nextEventSpy).toHaveBeenCalledTimes(1);
    const chainedEvent = nextEventSpy.mock.calls[0][0];
    expect(chainedEvent.correlationId).toBe('req_origin_correlation_123');
    expect(chainedEvent.causationId).toBe('evt_root_1');
  });

  it('Should isolate tenant handlers and not dispatch events across tenant boundaries', async () => {
    const tenantAHandler = vi.fn().mockResolvedValue(undefined);
    const tenantBHandler = vi.fn().mockResolvedValue(undefined);

    // Subscribe A and B to same event under different tenant limits
    eventBus.subscribe('Test.Created', tenantAHandler, 'tenant_A');
    eventBus.subscribe('Test.Created', tenantBHandler, 'tenant_B');

    const eventForA: PlatformEvent = {
      eventId: 'evt_tenant_a',
      eventType: 'Test.Created',
      timestamp: new Date().toISOString(),
      correlationId: 'req_a',
      tenantId: 'tenant_A',
      payload: {},
    };

    await eventBus.publish(eventForA);

    expect(tenantAHandler).toHaveBeenCalledTimes(1);
    expect(tenantBHandler).not.toHaveBeenCalled();
  });

  it('Should isolate handler failures and prevent crashing other handlers (Fault Isolation)', async () => {
    const goodHandler1 = vi.fn().mockResolvedValue(undefined);
    const badHandler = vi.fn().mockRejectedValue(new Error('Handler crashed'));
    const goodHandler2 = vi.fn().mockResolvedValue(undefined);

    eventBus.subscribe('Test.Created', goodHandler1);
    eventBus.subscribe('Test.Created', badHandler);
    eventBus.subscribe('Test.Created', goodHandler2);

    const event: PlatformEvent = {
      eventId: 'evt_fault_test',
      eventType: 'Test.Created',
      timestamp: new Date().toISOString(),
      correlationId: 'req_fault',
      payload: {},
    };

    await expect(eventBus.publish(event)).resolves.not.toThrow();

    expect(goodHandler1).toHaveBeenCalledTimes(1);
    expect(badHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler2).toHaveBeenCalledTimes(1);

    // Check if failure triggered System.ErrorOccurred event dispatching
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('Should guarantee sequential local correlation execution order', async () => {
    const executedEvents: string[] = [];
    eventBus.subscribe('Test.Created', async (event) => {
      executedEvents.push(event.eventId);
    });

    const event1: PlatformEvent = {
      eventId: 'evt_seq_1',
      eventType: 'Test.Created',
      timestamp: new Date().toISOString(),
      correlationId: 'req_seq',
      payload: {},
    };

    const event2: PlatformEvent = {
      eventId: 'evt_seq_2',
      eventType: 'Test.Created',
      timestamp: new Date().toISOString(),
      correlationId: 'req_seq',
      payload: {},
    };

    // Publish sequentially and await execution completion
    await eventBus.publish(event1);
    await eventBus.publish(event2);

    expect(executedEvents).toEqual(['evt_seq_1', 'evt_seq_2']);
  });
});
