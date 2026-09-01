import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import {
  OrderProcessingEngine,
  OrderRepositoryAdapter,
  type ProcessedOrderItem,
  type ShippingDetails,
} from './OrderProcessingEngine';
import { MemoryOrderRepository } from '../../commerce-persistence/src/repositories/MemoryOrderRepository';
import { TenantSecurityException } from './CommerceEngine';
import { InvalidOrderStateException } from './CheckoutFlow';

function makeLogger(): ConsolePlatformLogger {
  const logger = new ConsolePlatformLogger();
  return logger;
}

function makeEventBus(logger: ConsolePlatformLogger): PlatformEventBusImpl {
  const bus = new PlatformEventBusImpl(logger);
  logger.setEventBus(bus);
  return bus;
}

function makeAdapterRepo() {
  const repo = new MemoryOrderRepository();
  return { repo, adapter: new OrderRepositoryAdapter(repo as any) };
}

const shipping: ShippingDetails = {
  fullName: 'Test User',
  street: 'Test St 1',
  city: 'Krakow',
  zipCode: '31-001',
  country: 'PL',
};

describe('G1-333 HARDEN — OrderProcessingEngine — Supabase persistence wiring', () => {
  let engine: OrderProcessingEngine;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;
  let repo: MemoryOrderRepository;
  let adapter: OrderRepositoryAdapter;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();
    logger = makeLogger();
    eventBus = makeEventBus(logger);
    ({ repo, adapter } = makeAdapterRepo());
    engine = new OrderProcessingEngine({
      eventBus,
      logger,
      repository: adapter,
    });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('persistent: createOrder upserts into the repository', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 2, unitPriceGross: 1000, totalGross: 2000 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    const persisted = await repo.findByTenantAndId('tenant-a', order.id);
    expect(persisted).not.toBeNull();
    expect(persisted!.id).toBe(order.id);
    expect(persisted!.tenantId).toBe('tenant-a');
    expect(persisted!.total).toBe(order.grandTotalGross);
    expect(persisted!.items.length).toBe(1);
    expect(persisted!.items[0].productId).toBe('prod-1');
  });

  it('persistent: getOrder reads back from repository after process restart (fresh engine instance)', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 500, totalGross: 500 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    // Simulate process restart: brand new engine against same repo
    const engine2 = new OrderProcessingEngine({
      eventBus: makeEventBus(logger),
      logger,
      repository: adapter,
    });
    const rehydrated = await engine2.getOrder('tenant-a', order.id);
    expect(rehydrated.id).toBe(order.id);
    expect(rehydrated.customerId).toBe('cust-1');
    expect(rehydrated.grandTotalGross).toBe(order.grandTotalGross);
  });

  it('persistent: confirmPayment updates status in repository', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.invoiceOrder('tenant-a', order.id);
    await engine.confirmPayment('tenant-a', order.id, 'pi_test');
    const persisted = await repo.findByTenantAndId('tenant-a', order.id);
    expect(persisted!.status).toBe('paid');
    expect((persisted!.metadata as any).paymentIntentId).toBe('pi_test');
  });

  it('persistent: cancelOrder updates status in repository', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.invoiceOrder('tenant-a', order.id);
    await engine.cancelOrder('tenant-a', order.id);
    const persisted = await repo.findByTenantAndId('tenant-a', order.id);
    expect(persisted!.status).toBe('cancelled');
  });

  it('persistent: refundOrder updates status in repository', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.invoiceOrder('tenant-a', order.id);
    await engine.confirmPayment('tenant-a', order.id, 'pi_test');
    await engine.startProcessing('tenant-a', order.id);
    await engine.prepareFulfillment('tenant-a', order.id);
    await engine.fulfillOrder('tenant-a', order.id);
    await engine.refundOrder('tenant-a', order.id);
    const persisted = await repo.findByTenantAndId('tenant-a', order.id);
    expect(persisted!.status).toBe('cancelled'); // refunded → cancelled in our mapping
    expect((persisted!.metadata as any).engineState).toBe('REFUNDED');
  });

  it('persistent: full lifecycle CREATED -> PAYMENT_PENDING -> PAID -> PROCESSING -> READY_FOR_FULFILLMENT -> FULFILLED', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 1000, totalGross: 1000 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.invoiceOrder('tenant-a', order.id);
    await engine.confirmPayment('tenant-a', order.id, 'pi_x');
    await engine.startProcessing('tenant-a', order.id);
    await engine.prepareFulfillment('tenant-a', order.id);
    await engine.fulfillOrder('tenant-a', order.id);
    const persisted = await repo.findByTenantAndId('tenant-a', order.id);
    expect(persisted!.status).toBe('completed');
    expect((persisted!.metadata as any).engineState).toBe('FULFILLED');
  });

  it('tenant isolation: missing tenant context fails closed', async () => {
    await expect(engine.getOrder('', 'ord_1')).rejects.toThrow(TenantSecurityException);
    await expect(engine.listOrders('')).rejects.toThrow(TenantSecurityException);
  });

  it('tenant isolation: cross-tenant getOrder throws TenantSecurityException', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await expect(engine.getOrder('tenant-b', order.id)).rejects.toThrow(TenantSecurityException);
  });

  it('tenant isolation: cross-tenant persist does not leak into tenant B repo query', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const orderA = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    const orderB = await engine.createOrder('tenant-b', 'cust-2', items, shipping);
    const fromA = await repo.findByTenantAndId('tenant-a', orderA.id);
    const fromB = await repo.findByTenantAndId('tenant-b', orderB.id);
    expect(fromA?.tenantId).toBe('tenant-a');
    expect(fromB?.tenantId).toBe('tenant-b');
    // Cross-tenant findByTenantAndId MUST return null (security boundary)
    const crossAtoB = await repo.findByTenantAndId('tenant-a', orderB.id);
    expect(crossAtoB).toBeNull();
  });

  it('tenant isolation: listOrders is tenant-scoped', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.createOrder('tenant-a', 'cust-2', items, shipping);
    await engine.createOrder('tenant-b', 'cust-3', items, shipping);
    const aOrders = await engine.listOrders('tenant-a');
    const bOrders = await engine.listOrders('tenant-b');
    expect(aOrders.length).toBe(2);
    expect(bOrders.length).toBe(1);
    expect(aOrders.every((o) => o.tenantId === 'tenant-a')).toBe(true);
    expect(bOrders.every((o) => o.tenantId === 'tenant-b')).toBe(true);
  });

  it('state machine: invalid transition rejected with InvalidOrderStateException', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    // Cannot go CREATED -> FULFILLED directly
    await expect(engine.fulfillOrder('tenant-a', order.id)).rejects.toThrow(InvalidOrderStateException);
  });

  it('idempotency: confirmPayment on already-PAID order is a no-op', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.invoiceOrder('tenant-a', order.id);
    await engine.confirmPayment('tenant-a', order.id, 'pi_first');
    const second = await engine.confirmPayment('tenant-a', order.id, 'pi_second');
    expect(second.paymentIntentId).toBe('pi_first'); // first call wins
    const persisted = await repo.findByTenantAndId('tenant-a', order.id);
    expect((persisted!.metadata as any).paymentIntentId).toBe('pi_first');
  });

  it('recovery: Payment.Failed event auto-cancels and persists', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.invoiceOrder('tenant-a', order.id);
    await eventBus.publish({
      eventId: `evt_pf_${Date.now()}`,
      eventType: 'Payment.Failed',
      timestamp: new Date().toISOString(),
      correlationId: 'corr_test',
      tenantId: 'tenant-a',
      payload: { orderId: order.id },
    } as any);
    await new Promise((r) => setTimeout(r, 50));
    const persisted = await repo.findByTenantAndId('tenant-a', order.id);
    expect(persisted!.status).toBe('cancelled');
    expect((persisted!.metadata as any).engineState).toBe('CANCELLED');
  });

  it('recovery: Payment.Refunded event transitions to REFUNDED and persists', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.invoiceOrder('tenant-a', order.id);
    await engine.confirmPayment('tenant-a', order.id, 'pi_x');
    await eventBus.publish({
      eventId: `evt_pr_${Date.now()}`,
      eventType: 'Payment.Refunded',
      timestamp: new Date().toISOString(),
      correlationId: 'corr_test',
      tenantId: 'tenant-a',
      payload: { orderId: order.id, paymentIntentId: 'pi_x' },
    } as any);
    await new Promise((r) => setTimeout(r, 50));
    const persisted = await repo.findByTenantAndId('tenant-a', order.id);
    expect((persisted!.metadata as any).engineState).toBe('REFUNDED');
  });

  it('process-restart simulation: order survives engine recreation against same repo', async () => {
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 2, unitPriceGross: 500, totalGross: 1000 },
    ];
    const order = await engine.createOrder('tenant-a', 'cust-1', items, shipping);
    await engine.invoiceOrder('tenant-a', order.id);
    await engine.confirmPayment('tenant-a', order.id, 'pi_y');

    // Brand new engine instance (simulates Vercel cold start on a different function)
    const engine2 = new OrderProcessingEngine({
      eventBus: makeEventBus(logger),
      logger,
      repository: adapter,
    });
    const recovered = await engine2.getOrder('tenant-a', order.id);
    expect(recovered.status).toBe('PAID');
    expect(recovered.paymentIntentId).toBe('pi_y');
    expect(recovered.items.length).toBe(1);
    expect(recovered.items[0].productId).toBe('prod-1');
    expect(recovered.items[0].quantity).toBe(2);
    expect(recovered.items[0].totalGross).toBe(1000);
  });

  it('in-memory fallback: when no repository is configured, behavior is identical to legacy', async () => {
    const legacyEngine = new OrderProcessingEngine({ eventBus, logger });
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await legacyEngine.createOrder('tenant-a', 'cust-1', items, shipping);
    const fetched = await legacyEngine.getOrder('tenant-a', order.id);
    expect(fetched.id).toBe(order.id);
  });

  it('fail-closed: persist failure does not block order state machine', async () => {
    // Build an engine whose adapter always rejects on upsert.
    const failingAdapter = {
      upsertOrder: vi.fn().mockRejectedValue(new Error('db down')),
      findByTenantAndId: vi.fn().mockResolvedValue(null),
      listByTenant: vi.fn().mockResolvedValue([]),
    };
    const failEngine = new OrderProcessingEngine({
      eventBus,
      logger,
      repository: failingAdapter as any,
    });
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    // Must not throw despite the persistence layer failing
    const order = await failEngine.createOrder('tenant-a', 'cust-1', items, shipping);
    await failEngine.invoiceOrder('tenant-a', order.id);
    await failEngine.confirmPayment('tenant-a', order.id, 'pi_z');
    expect(failingAdapter.upsertOrder).toHaveBeenCalled();
    // The in-memory cache is still populated
    const cached = await failEngine.getOrder('tenant-a', order.id);
    expect(cached.status).toBe('PAID');
  });
});