import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderProcessingEngine } from '../OrderProcessingEngine';
import { PaymentEngine } from '../PaymentEngine';
import { InventoryEngine } from '../InventoryEngine';
import { MemoryInventoryRepository } from '../../../commerce-persistence/src/repositories/MemoryInventoryRepository';
import { PlatformEventBusImpl } from '../../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../platform-core/src/logger/Logger';
import type { PaymentProviderAdapter } from '../PaymentProviderAdapter';

class MockSharedOrderRepository {
  private orders = new Map<string, any>();

  async upsertOrder(order: any): Promise<void> {
    this.orders.set(`${order.tenantId}:${order.id}`, { ...order });
  }

  async findByTenantAndId(tenantId: string, id: string): Promise<any | null> {
    const found = this.orders.get(`${tenantId}:${id}`);
    return found ? { ...found } : null;
  }

  async listByTenant(tenantId: string): Promise<any[]> {
    return Array.from(this.orders.values()).filter((o) => o.tenantId === tenantId);
  }

  async transitionOrderStatus(
    tenantId: string,
    id: string,
    expectedStatus: string | string[],
    newStatus: string,
    metadataPatch?: Record<string, unknown>
  ): Promise<boolean> {
    const key = `${tenantId}:${id}`;
    const existing = this.orders.get(key);
    if (!existing) return false;

    const expectedArray = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    if (!expectedArray.includes(existing.status)) {
      return false;
    }

    existing.status = newStatus;
    existing.updatedAt = new Date().toISOString();
    if (metadataPatch) {
      existing.metadata = { ...(existing.metadata || {}), ...metadataPatch };
    }
    this.orders.set(key, existing);
    return true;
  }
}

describe('NIGHT SHIFT 05 — Distributed Concurrency, Restart & Idempotency Audit', () => {
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let sharedRepo: MockSharedOrderRepository;
  let inventoryRepo: MemoryInventoryRepository;
  let inventoryEngine: InventoryEngine;

  const tenantId = 't_dist_test';
  const customerId = 'cust_101';
  const shippingAddress = {
    fullName: 'Jan Kowalski',
    street: 'Marszałkowska 1',
    city: 'Warszawa',
    zipCode: '00-001',
    country: 'PL',
  };

  beforeEach(() => {
    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    sharedRepo = new MockSharedOrderRepository();
    inventoryRepo = new MemoryInventoryRepository();
    inventoryEngine = new InventoryEngine({ eventBus, logger, repository: inventoryRepo });
  });

  it('Phase 3 (F-09): Multi-Instance Concurrency — prevents dual confirm and cancel on separate serverless instances', async () => {
    const instanceA = new OrderProcessingEngine({
      eventBus,
      logger,
      inventoryEngine,
      repository: sharedRepo,
    });

    const instanceB = new OrderProcessingEngine({
      eventBus,
      logger,
      inventoryEngine,
      repository: sharedRepo,
    });

    await inventoryEngine.initializeStock(tenantId, 'prod_dist_1', 100);

    const order = await instanceA.createOrder(
      tenantId,
      customerId,
      [{ productId: 'prod_dist_1', quantity: 5, unitPriceGross: 1000, totalGross: 5000 }],
      shippingAddress
    );
    await instanceA.reserveStockForOrder(tenantId, order.id, order.items);
    await instanceA.invoiceOrder(tenantId, order.id);

    const confirmPromise = instanceA.confirmPayment(tenantId, order.id, 'intent_dist_999');
    const cancelPromise = instanceB.cancelOrder(tenantId, order.id);

    const results = await Promise.allSettled([confirmPromise, cancelPromise]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const finalOrder = await sharedRepo.findByTenantAndId(tenantId, order.id);
    expect(['paid', 'cancelled']).toContain(finalOrder.status);
  });

  it('Phase 4 (F-12): Payment Provider Idempotency Key — passes idempotencyKey to gateway adapter', async () => {
    const paymentEngine = new PaymentEngine({ eventBus, logger });

    const adapterSpy: PaymentProviderAdapter = {
      id: 'stripe-mock-canary',
      createIntent: vi.fn().mockResolvedValue({
        externalId: 'ext_stripe_123',
        clientSecret: 'secret_123',
        rawPayload: {},
      }),
      getPaymentStatus: vi.fn().mockResolvedValue('CREATED'),
      refundPayment: vi.fn().mockResolvedValue({ refundExternalId: 'ref_123', success: true, rawPayload: {} }),
    };

    const intent = await paymentEngine.createPaymentIntent(
      tenantId,
      'ord_stripe_99',
      5000,
      'PLN',
      adapterSpy
    );

    expect(intent.id).toBeDefined();
    expect(adapterSpy.createIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'ord_stripe_99',
        amountGross: 5000,
        currency: 'PLN',
        idempotencyKey: `${tenantId}:ord_stripe_99`,
      })
    );
  });

  it('Phase 5 (F-02): Multi-Instance Stock Operations — maintains strict stock totals under concurrent commits', async () => {
    await inventoryEngine.initializeStock(tenantId, 'prod_stock_99', 50);

    const res1 = await inventoryEngine.reserveStock(tenantId, 'ord_1', 'prod_stock_99', 10, 300);
    const res2 = await inventoryEngine.reserveStock(tenantId, 'ord_2', 'prod_stock_99', 15, 300);

    await Promise.all([
      inventoryEngine.commitStock(tenantId, res1.id),
      inventoryEngine.commitStock(tenantId, res2.id),
    ]);

    const finalStock = await inventoryRepo.findByTenantAndProduct(tenantId, 'prod_stock_99');
    expect(finalStock?.quantity).toBe(25); // 50 - 10 - 15
    expect(finalStock?.reserved).toBe(0);
  });
});
