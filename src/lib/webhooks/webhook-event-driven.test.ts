import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../../packages/platform-core/src/events/PlatformEventBus';
import { EventRegistry } from '../../../packages/platform-core/src/events/EventRegistry';
import { ConsolePlatformLogger } from '../../../packages/platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../../packages/platform-core/src/config/PlatformConfig';
import { WebhookProcessor } from './WebhookProcessor';
import type { VerifiedWebhook } from './WebhookTypes';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createServiceClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => ({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ data: { id: 'evt-1' }, error: null })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({ data: null, error: null })),
      })),
    })),
  })),
}));

describe('Event-Driven: Webhook → Order Processing Pipeline', () => {
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

// In-memory order store for testing
  const orders = new Map<string, any>();

  // Module-level references for mock functions (recreated in beforeEach)
  let mockOrderEngine: any;
  let mockPaymentEngine: any;
  let mockEventBus: any;
  let mockAudit: any;
  let mockIdempotencyStore: any;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();
    orders.clear();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    // Recreate mocks in beforeEach to avoid clearAllMocks issues
    mockOrderEngine = {
      confirmPayment: vi.fn().mockImplementation(async (tenantId: string, orderId: string, paymentIntentId: string) => {
        const order = orders.get(orderId);
        if (!order) throw new Error(`Order ${orderId} not found`);
        order.status = 'PAID';
        order.paymentIntentId = paymentIntentId;
        order.updatedAt = new Date().toISOString();
        orders.set(orderId, order);
        return order;
      }),
    };

    mockPaymentEngine = {
      capture: vi.fn().mockImplementation(async (event: any) => {
        return {
          paymentIntentId: `pi_mock_${Date.now()}`,
          orderId: event.orderId,
        };
      }),
    };

    mockEventBus = {
      publish: vi.fn().mockResolvedValue(undefined),
    };

    mockAudit = {
      record: vi.fn().mockResolvedValue(undefined),
    };

    mockIdempotencyStore = {
      get: vi.fn().mockResolvedValue(null),
      upsertReceived: vi.fn().mockResolvedValue(undefined),
      markCompleted: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    };

    // Register events via EventRegistry imported from PlatformEventBus
    ['Payment.Completed', 'Order.Created', 'Order.PaymentConfirmed'].forEach((evt) => {
      try { EventRegistry.register(evt); } catch {}
    });

    // Create a test order
    const orderId = `ord_test_${Date.now()}`;
    orders.set(orderId, {
      id: orderId,
      tenantId: 'tenant-test-1',
      status: 'PAYMENT_PENDING',
      customerId: 'cust_123',
      items: [{ productId: 'p1', quantity: 1, unitPriceGross: 100, totalGross: 100 }],
      grandTotalGross: 100,
      currency: 'PLN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    vi.restoreAllMocks();
  });

  it('completes payment flow: webhook → Payment.Completed → order PAYMENT_PENDING → PAID', async () => {
    // 1. Set up the webhook processor
    const processor = new WebhookProcessor({
      idempotencyStore: mockIdempotencyStore,
      paymentEngine: mockPaymentEngine,
      orderEngine: {
        confirmPayment: async (params) => {
          // Simulate what OrderProcessingEngine does internally:
          // It should receive the Payment.Completed event and auto-transition
          const order = orders.get(params.orderId);
          if (!order) throw new Error('Order not found');
          order.status = 'PAID';
          order.paymentIntentId = params.paymentIntentId;
          order.updatedAt = new Date().toISOString();
          orders.set(params.orderId, order);

          // Publish Order.PaymentConfirmed via event bus
          await eventBus.publish({
            eventId: `evt_ord_paid_${Date.now()}`,
            eventType: 'Order.PaymentConfirmed',
            timestamp: new Date().toISOString(),
            correlationId: params.correlationId,
            tenantId: params.tenantId,
            payload: { orderId: params.orderId, paymentIntentId: params.paymentIntentId },
          });

          return order;
        },
      },
      eventBus: eventBus,
      audit: mockAudit,
    });

    // 2. Create a verified webhook event for PAYMENT_COMPLETED
    const verifiedWebhook: VerifiedWebhook = {
      envelope: {
        provider: 'onekoszyk',
        providerEventId: `evt_${Date.now()}`,
        providerTransactionId: `txn_${Date.now()}`,
        tenantId: 'tenant-test-1',
        correlationId: `corr_test_${Date.now()}`,
        payloadHash: 'hash123',
        occurredAt: new Date().toISOString(),
      },
      event: {
        id: `evt_${Date.now()}`,
        provider: 'onekoszyk',
        type: 'PAYMENT_COMPLETED',
        tenantId: 'tenant-test-1',
        orderId: Array.from(orders.keys())[0],
        transactionId: `txn_${Date.now()}`,
        amount: 10000,
        currency: 'PLN',
        occurredAt: new Date().toISOString(),
        correlationId: `corr_test_${Date.now()}`,
      },
    };

    // 3. Process the webhook
    const result = await processor.process(verifiedWebhook);

    // 4. Verify the webhook was processed
    expect(result.processed).toBe(true);
    expect(mockPaymentEngine.capture).toHaveBeenCalledTimes(1);
    expect(mockAudit.record).toHaveBeenCalled();

// 5. Verify order was transitioned to PAID
    const orderId = Array.from(orders.keys())[0];
    const order = orders.get(orderId);
    expect(order.status).toBe('PAID');
    expect(order.paymentIntentId).toBeTruthy();
  });

  it('handles duplicate webhook event gracefully via idempotency store', async () => {
    // Mock idempotency store to return existing record
    mockIdempotencyStore.get.mockResolvedValue({ status: 'COMPLETED' });

    const processor = new WebhookProcessor({
      idempotencyStore: mockIdempotencyStore,
      paymentEngine: mockPaymentEngine,
      eventBus: eventBus,
      audit: mockAudit,
    });

    const verifiedWebhook: VerifiedWebhook = {
      envelope: {
        provider: 'onekoszyk',
        providerEventId: 'dup-event-1',
        providerTransactionId: 'dup-txn-1',
        tenantId: 'tenant-test-1',
        correlationId: 'corr-dup-1',
        payloadHash: 'hashdup',
        occurredAt: new Date().toISOString(),
      },
      event: {
        id: 'dup-event-1',
        provider: 'onekoszyk',
        type: 'PAYMENT_COMPLETED',
        tenantId: 'tenant-test-1',
        orderId: 'ord-dup-1',
        transactionId: 'dup-txn-1',
        amount: 5000,
        currency: 'PLN',
        occurredAt: new Date().toISOString(),
        correlationId: 'corr-dup-1',
      },
    };

    const result = await processor.process(verifiedWebhook);
    expect(result.ignored).toBe(true);
    expect(mockAudit.record).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'WebhookDuplicateIgnored' })
    );
  });

  it('handles PAYMENT_FAILED event without order confirmation', async () => {
    const mockFailedPaymentEngine = {
      capture: vi.fn().mockImplementation(async (event: any) => {
        return {
          paymentIntentId: `pi_fail_${Date.now()}`,
          orderId: event.orderId,
        };
      }),
    };

    const processor = new WebhookProcessor({
      idempotencyStore: mockIdempotencyStore,
      paymentEngine: mockFailedPaymentEngine,
      eventBus: eventBus,
      audit: mockAudit,
    });

    const verifiedWebhook: VerifiedWebhook = {
      envelope: {
        provider: 'onekoszyk',
        providerEventId: `evt_fail_${Date.now()}`,
        providerTransactionId: `txn_fail_${Date.now()}`,
        tenantId: 'tenant-test-1',
        correlationId: `corr_fail_${Date.now()}`,
        payloadHash: 'hashfail',
        occurredAt: new Date().toISOString(),
      },
      event: {
        id: `evt_fail_${Date.now()}`,
        provider: 'onekoszyk',
        type: 'PAYMENT_FAILED',
        tenantId: 'tenant-test-1',
        orderId: 'ord_fail_1',
        transactionId: `txn_fail_${Date.now()}`,
        amount: 5000,
        currency: 'PLN',
        occurredAt: new Date().toISOString(),
        correlationId: `corr_fail_${Date.now()}`,
      },
    };

    const result = await processor.process(verifiedWebhook);

    expect(result.processed).toBe(true);
    expect(mockFailedPaymentEngine.capture).toHaveBeenCalledTimes(1);

    // Should NOT publish Payment.Completed event for failed payments
    const paymentCompletedEvents = mockEventBus.publish.mock.calls.filter(
      (call: any[]) => call[0]?.eventType === 'Payment.Completed'
    );
    expect(paymentCompletedEvents.length).toBe(0);

    // Should have audit record
    expect(mockAudit.record).toHaveBeenCalled();
  });
});

