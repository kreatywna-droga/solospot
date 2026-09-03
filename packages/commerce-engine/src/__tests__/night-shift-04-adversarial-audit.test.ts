import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformEventBusImpl } from '../../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../platform-core/src/logger/Logger';
import { InventoryEngine } from '../InventoryEngine';
import { OrderProcessingEngine } from '../OrderProcessingEngine';
import { PaymentEngine } from '../PaymentEngine';
import { PaymentProviderAdapter } from '../PaymentProviderAdapter';
import { MemoryInventoryRepository } from '../../../commerce-persistence/src/repositories/MemoryInventoryRepository';

const mockPaymentAdapter: PaymentProviderAdapter = {
  id: 'mock_provider',
  createIntent: async () => ({
    externalId: `ext_mock_${Math.random().toString(36).substr(2, 9)}`,
    clientSecret: 'secret_mock',
    rawPayload: {},
  }),
  getPaymentStatus: async () => 'CAPTURED',
  refundPayment: async () => ({
    refundExternalId: `ref_mock_${Math.random().toString(36).substr(2, 9)}`,
    success: true,
    rawPayload: {},
  }),
};

describe('NIGHT SHIFT 04 — Adversarial Audit & Concurrency Verification', () => {
  let logger: ConsolePlatformLogger;
  let eventBus: PlatformEventBusImpl;

  beforeEach(() => {
    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
  });

  describe('F-02: Atomic commitStock Concurrency & Race Prevention', () => {
    it('prevents inventory quantity corruption during concurrent commits', async () => {
      const repo = new MemoryInventoryRepository();
      const engine = new InventoryEngine({ eventBus, logger, repository: repo });

      const tenantId = 't_test_f02';
      const productId = 'p_test_f02';

      // Initial physical stock = 100
      await engine.initializeStock(tenantId, productId, 100);

      // Create 2 concurrent reservations for 10 units each
      const res1 = await engine.reserveStock(tenantId, 'ord_1', productId, 10, 300);
      const res2 = await engine.reserveStock(tenantId, 'ord_2', productId, 10, 300);

      // Verify intermediate reserved state: 80 available, 20 reserved
      const stockPre = await engine.getStock(tenantId, productId);
      expect(stockPre.quantityAvailable).toBe(80);
      expect(stockPre.quantityReserved).toBe(20);

      // Execute both commits concurrently
      await Promise.all([
        engine.commitStock(tenantId, res1.id),
        engine.commitStock(tenantId, res2.id),
      ]);

      // Post-commit physical stock MUST be 80 (80 available, 0 reserved)
      const stockPost = await engine.getStock(tenantId, productId);
      expect(stockPost.quantityAvailable).toBe(80);
      expect(stockPost.quantityReserved).toBe(0);

      const persistedRow = await repo.findByTenantAndProduct(tenantId, productId);
      expect(persistedRow?.quantity).toBe(80);
      expect(persistedRow?.reserved).toBe(0);
    });

    it('rejects commitStock if reservation is already committed (idempotency)', async () => {
      const repo = new MemoryInventoryRepository();
      const engine = new InventoryEngine({ eventBus, logger, repository: repo });

      const tenantId = 't_test_f02_idem';
      const productId = 'p_test_f02_idem';
      await engine.initializeStock(tenantId, productId, 50);

      const res = await engine.reserveStock(tenantId, 'ord_idem', productId, 5, 300);
      const mov1 = await engine.commitStock(tenantId, res.id);
      const mov2 = await engine.commitStock(tenantId, res.id);

      expect(mov1.type).toBe('RESERVATION_COMMIT');
      expect(mov2.reason).toContain('already committed');

      const stock = await engine.getStock(tenantId, productId);
      expect(stock.quantityAvailable).toBe(45);
      expect(stock.quantityReserved).toBe(0);
    });
  });

  describe('F-12: Payment Intent Deduplication', () => {
    it('returns the same existing PaymentIntent when created twice for the same order', async () => {
      const paymentEngine = new PaymentEngine({ eventBus, logger });
      const tenantId = 't_test_f12';
      const orderId = 'ord_duplicate_test';

      const intent1 = await paymentEngine.createPaymentIntent(
        tenantId,
        orderId,
        15000,
        'PLN',
        mockPaymentAdapter
      );

      const intent2 = await paymentEngine.createPaymentIntent(
        tenantId,
        orderId,
        15000,
        'PLN',
        mockPaymentAdapter
      );

      expect(intent1.id).toBe(intent2.id);
      expect(intent1.externalId).toBe(intent2.externalId);
    });
  });

  describe('F-09: Order State Transition Mutex Protection', () => {
    it('serializes concurrent confirmPayment and cancelOrder calls without state corruption', async () => {
      const orderEngine = new OrderProcessingEngine({ eventBus, logger });
      const tenantId = 't_test_f09';
      const customerId = 'cust_1';
      const items = [{ productId: 'p1', quantity: 1, unitPriceGross: 1000, totalGross: 1000 }];
      const address = { fullName: 'Test', street: 'S', city: 'C', zipCode: '00', country: 'PL' };

      const order = await orderEngine.createOrder(tenantId, customerId, items, address);
      await orderEngine.invoiceOrder(tenantId, order.id);

      // Concurrent confirmPayment and cancelOrder
      await Promise.allSettled([
        orderEngine.confirmPayment(tenantId, order.id, 'pi_test'),
        orderEngine.cancelOrder(tenantId, order.id),
      ]);

      const finalOrder = await orderEngine.getOrder(tenantId, order.id);
      // One of the operations must succeed, leaving order in a valid terminal state (PAID or CANCELLED)
      expect(['PAID', 'CANCELLED']).toContain(finalOrder.status);
    });
  });
});
