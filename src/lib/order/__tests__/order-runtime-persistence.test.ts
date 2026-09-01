import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../../../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../../packages/platform-core/src/logger/Logger';
import {
  OrderProcessingEngine,
  OrderRepositoryAdapter,
  type ProcessedOrderItem,
} from '../../../../packages/commerce-engine/src';
import { MemoryOrderRepository } from '../../../../packages/commerce-persistence/src';
import { OrderRuntime, type CheckoutRequestDTO } from '../OrderRuntime';

// MOCK PaymentFactory — stub adapter so no real network calls
vi.mock('@/lib/payments/PaymentFactory', () => ({
  PaymentFactory: {
    getProvider: vi.fn(() => ({
      id: 'stub-provider',
      createIntent: vi.fn(async () => ({
        externalId: `https://pay.stub/int_${Math.random().toString(36).substr(2, 9)}`,
        rawPayload: {},
      })),
      getPaymentStatus: vi.fn(async () => 'CREATED'),
      refundPayment: vi.fn(async () => ({ refundExternalId: 'ref_1', success: true, rawPayload: {} })),
    })),
  },
}));

function validRequest(): CheckoutRequestDTO {
  return {
    items: [{ productId: 'prod-1', quantity: 2, unitPriceGross: 5000 }],
    shippingAddress: {
      fullName: 'Jan Kowalski',
      street: 'ul. Glowna 1',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'PL',
    },
    currency: 'PLN',
  };
}

describe('G1-333 — OrderRuntime opt-in persistence injection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Runtime with custom OrderProcessingEngine (MemoryOrderRepository) persists orders end-to-end', async () => {
    const logger = new ConsolePlatformLogger();
    const eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);
    const orderRepo = new MemoryOrderRepository();
    const adapter = new OrderRepositoryAdapter(orderRepo as any);
    const orderEngine = new OrderProcessingEngine({
      eventBus,
      logger,
      repository: adapter,
    });

    const runtime = new OrderRuntime({ eventBus, logger, orderEngine });

    const result = await runtime.checkout('tenant-x', 'guest', validRequest(), 'corr-rt-1');
    expect(result.success).toBe(true);

    // Order must be persisted in the repository (NOT just the engine cache)
    const persisted = await orderRepo.findByTenantAndId('tenant-x', result.orderId);
    expect(persisted).not.toBeNull();
    expect(persisted!.total).toBe(result.grandTotalGross);

    // Runtime must be able to read it back via getOrderStatus (cache hit)
    const status = await runtime.getOrderStatus('tenant-x', result.orderId);
    expect(status.id).toBe(result.orderId);
    expect(status.status).toBe('PAYMENT_PENDING');
  });

  it('Runtime without custom OrderProcessingEngine keeps legacy in-memory behavior', async () => {
    const runtime = new OrderRuntime();
    const result = await runtime.checkout('tenant-y', 'guest', validRequest(), 'corr-rt-2');
    expect(result.success).toBe(true);
    const status = await runtime.getOrderStatus('tenant-y', result.orderId);
    expect(status.status).toBe('PAYMENT_PENDING');
  });

  it('listOrders reflects persisted orders across all checkout calls', async () => {
    const logger = new ConsolePlatformLogger();
    const eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);
    const orderRepo = new MemoryOrderRepository();
    const adapter = new OrderRepositoryAdapter(orderRepo as any);
    const orderEngine = new OrderProcessingEngine({
      eventBus,
      logger,
      repository: adapter,
    });
    const runtime = new OrderRuntime({ eventBus, logger, orderEngine });

    await runtime.checkout('tenant-z', 'guest', validRequest(), 'corr-rt-3a');
    await runtime.checkout('tenant-z', 'guest', validRequest(), 'corr-rt-3b');
    await runtime.checkout('tenant-z', 'guest', validRequest(), 'corr-rt-3c');

    const orders = await runtime.listOrders('tenant-z');
    expect(orders.length).toBe(3);
    expect(orders.every((o) => o.tenantId === 'tenant-z')).toBe(true);

    // Cross-tenant isolation: must be empty for a different tenant
    const otherTenantOrders = await runtime.listOrders('tenant-other');
    expect(otherTenantOrders.length).toBe(0);
  });
});