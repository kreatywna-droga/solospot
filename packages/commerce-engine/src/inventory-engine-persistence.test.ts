import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { InventoryEngine, InventoryRepositoryAdapter } from './InventoryEngine';
import { OrderProcessingEngine } from './OrderProcessingEngine';
import { MemoryInventoryRepository } from '../../commerce-persistence/src/repositories/MemoryInventoryRepository';
import { InsufficientInventoryException } from './CartRuntime';
import { TenantSecurityException } from './CommerceEngine';
import type { ProcessedOrderItem } from './OrderProcessingEngine';

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
  const repo = new MemoryInventoryRepository();
  return { repo, adapter: new InventoryRepositoryAdapter(repo as any) };
}

async function seed(repo: MemoryInventoryRepository, tenantId: string, productId: string, qty: number, threshold = 5) {
  const now = new Date().toISOString();
  await repo.create({
    id: `inv_${Math.random().toString(36).slice(2, 12)}`,
    tenantId,
    productId,
    quantity: qty,
    reserved: 0,
    lowStockThreshold: threshold,
    createdAt: now,
    updatedAt: now,
  } as any);
}

describe('G1-332 InventoryEngine — Supabase persistence wiring', () => {
  let engine: InventoryEngine;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;
  let repo: MemoryInventoryRepository;
  let adapter: InventoryRepositoryAdapter;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();
    logger = makeLogger();
    eventBus = makeEventBus(logger);
    ({ repo, adapter } = makeAdapterRepo());
    engine = new InventoryEngine({ eventBus, logger, repository: adapter });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('persistent: initializeStock upserts into the repository', async () => {
    await engine.initializeStock('tenant-a', 'prod-1', 10, 3);
    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv).not.toBeNull();
    expect(inv!.quantity).toBe(10);
    expect(inv!.reserved).toBe(0);
    expect(inv!.lowStockThreshold).toBe(3);
    const stock = await engine.getStock('tenant-a', 'prod-1');
    expect(stock.quantityAvailable).toBe(10);
  });

  it('persistent: getStock reads back from repository after a process restart (fresh engine instance)', async () => {
    await engine.initializeStock('tenant-a', 'prod-1', 7, 2);
    // Simulate process restart: build a brand new engine against the same repo.
    const eventBus2 = makeEventBus(logger);
    const engine2 = new InventoryEngine({ eventBus: eventBus2, logger, repository: adapter });
    const stock = await engine2.getStock('tenant-a', 'prod-1');
    expect(stock.quantityAvailable).toBe(7);
    expect(stock.quantityReserved).toBe(0);
  });

  it('persistent: reserveStock decrements availability and increments reserved in repository', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const reservation = await engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 3, 60);
    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.quantity).toBe(10);
    expect(inv!.reserved).toBe(3);
    expect(reservation.status).toBe('PENDING');
    const stock = await engine.getStock('tenant-a', 'prod-1');
    expect(stock.quantityAvailable).toBe(7);
    expect(stock.quantityReserved).toBe(3);
  });

  it('persistent: releaseStock restores availability in repository', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const reservation = await engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 4, 60);
    await engine.releaseStock('tenant-a', reservation.id);
    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.reserved).toBe(0);
    const stock = await engine.getStock('tenant-a', 'prod-1');
    expect(stock.quantityAvailable).toBe(10);
    expect(stock.quantityReserved).toBe(0);
  });

  it('persistent: commitStock decreases quantity and clears reservation', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const reservation = await engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 3, 60);
    await engine.commitStock('tenant-a', reservation.id);
    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.quantity).toBe(7);
    expect(inv!.reserved).toBe(0);
  });

  it('tenant isolation: missing tenant context fails closed on every operation', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    await expect(engine.getStock('', 'prod-1')).rejects.toThrow(TenantSecurityException);
    await expect(engine.reserveStock('', 'ord-1', 'prod-1', 1, 60)).rejects.toThrow(TenantSecurityException);
    await expect(engine.adjustStock('', 'prod-1', 5, 'RECEIPT')).rejects.toThrow(TenantSecurityException);
  });

  it('tenant isolation: cross-tenant operations throw TenantSecurityException', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const reservation = await engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 2, 60);
    await expect(engine.commitStock('tenant-b', reservation.id)).rejects.toThrow(TenantSecurityException);
    await expect(engine.releaseStock('tenant-b', reservation.id)).rejects.toThrow(TenantSecurityException);
  });

  it('tenant isolation: tenant A reservation does not deplete tenant B stock', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 1);
    await seed(repo, 'tenant-b', 'prod-1', 5);
    // tenant-a reserves the only unit
    await engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 1, 60);
    const aInv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    const bInv = await repo.findByTenantAndProduct('tenant-b', 'prod-1');
    expect(aInv!.reserved).toBe(1);
    expect(bInv!.reserved).toBe(0);
    // tenant-b still has 5 available
    const bStock = await engine.getStock('tenant-b', 'prod-1');
    expect(bStock.quantityAvailable).toBe(5);
  });

  it('out-of-stock: reserveStock throws InsufficientInventoryException when stock=1 and qty=2', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 1);
    await expect(engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 2, 60)).rejects.toThrow(InsufficientInventoryException);
  });

  it('low-stock: adjustStock emits Inventory.LowStock when available falls below threshold', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10, 3);
    const spy = vi.spyOn(eventBus, 'publish');
    await engine.adjustStock('tenant-a', 'prod-1', -8, 'ADJUSTMENT', 'Damage correction');
    const lowStockCall = spy.mock.calls.find((c) => c[0].eventType === 'Inventory.LowStock');
    expect(lowStockCall).toBeDefined();
    expect(lowStockCall?.[0].payload.quantityAvailable).toBe(2);
  });

  it('concurrent: stock=1, two simultaneous reserveStock calls — only one succeeds', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 1);
    const results = await Promise.allSettled([
      engine.reserveStock('tenant-a', 'ord-A', 'prod-1', 1, 60),
      engine.reserveStock('tenant-a', 'ord-B', 'prod-1', 1, 60),
    ]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientInventoryException);
    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.reserved).toBe(1);
    expect(inv!.quantity).toBe(1);
  });

  it('concurrent: stock=5, eight simultaneous reserveStock(1) calls — exactly five succeed', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 5);
    const calls = Array.from({ length: 8 }, (_, i) =>
      engine.reserveStock('tenant-a', `ord-${i}`, 'prod-1', 1, 60)
    );
    const results = await Promise.allSettled(calls);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled.length).toBe(5);
    expect(rejected.length).toBe(3);
    for (const r of rejected) {
      expect((r as PromiseRejectedResult).reason).toBeInstanceOf(InsufficientInventoryException);
    }
    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.reserved).toBe(5);
  });

  it('validation: zero quantity is rejected on reserveStock', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 5);
    await expect(engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 0, 60)).rejects.toThrow(InsufficientInventoryException);
  });

  it('validation: negative quantity is rejected on reserveStock', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 5);
    await expect(engine.reserveStock('tenant-a', 'ord-1', 'prod-1', -3, 60)).rejects.toThrow(InsufficientInventoryException);
  });

  it('validation: release after commit fails with reservation-not-pending', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 5);
    const reservation = await engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 1, 60);
    await engine.commitStock('tenant-a', reservation.id);
    await expect(engine.releaseStock('tenant-a', reservation.id)).rejects.toThrow(/COMMITTED/);
  });

  it('OrderProcessingEngine wiring: confirmPayment commits reservations', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const orderEngine = new OrderProcessingEngine({ eventBus, logger, inventoryEngine: engine });
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 2, unitPriceGross: 1000, totalGross: 2000 },
    ];
    const order = await orderEngine.createOrder('tenant-a', 'cust-1', items, {
      fullName: 'X', street: 'Y', city: 'Z', zipCode: '00-000', country: 'PL',
    });
    await orderEngine.reserveStockForOrder('tenant-a', order.id, items);
    let inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.reserved).toBe(2);
    await orderEngine.invoiceOrder('tenant-a', order.id);
    await orderEngine.confirmPayment('tenant-a', order.id, 'pi_test');
    inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.reserved).toBe(0);
    expect(inv!.quantity).toBe(8); // committed: 10 - 2
  });

  it('OrderProcessingEngine wiring: cancelOrder releases reservations', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const orderEngine = new OrderProcessingEngine({ eventBus, logger, inventoryEngine: engine });
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 3, unitPriceGross: 1000, totalGross: 3000 },
    ];
    const order = await orderEngine.createOrder('tenant-a', 'cust-1', items, {
      fullName: 'X', street: 'Y', city: 'Z', zipCode: '00-000', country: 'PL',
    });
    await orderEngine.reserveStockForOrder('tenant-a', order.id, items);
    let inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.reserved).toBe(3);
    await orderEngine.invoiceOrder('tenant-a', order.id);
    await orderEngine.cancelOrder('tenant-a', order.id);
    inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.reserved).toBe(0);
    expect(inv!.quantity).toBe(10); // unchanged — release only restores reserved counter
  });

  it('OrderProcessingEngine wiring: Payment.Failed triggers reservation release', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const orderEngine = new OrderProcessingEngine({ eventBus, logger, inventoryEngine: engine });
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 2, unitPriceGross: 1000, totalGross: 2000 },
    ];
    const order = await orderEngine.createOrder('tenant-a', 'cust-1', items, {
      fullName: 'X', street: 'Y', city: 'Z', zipCode: '00-000', country: 'PL',
    });
    await orderEngine.reserveStockForOrder('tenant-a', order.id, items);
    await orderEngine.invoiceOrder('tenant-a', order.id);
    // simulate payment failure event
    await eventBus.publish({
      eventId: `evt_pf_${Date.now()}`,
      eventType: 'Payment.Failed',
      timestamp: new Date().toISOString(),
      correlationId: 'corr_test',
      tenantId: 'tenant-a',
      payload: { orderId: order.id, paymentIntentId: 'pi_test' },
    } as any);
    // Wait briefly for async subscriber
    await new Promise((r) => setTimeout(r, 50));
    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv!.reserved).toBe(0);
    expect(inv!.quantity).toBe(10);
  });

  it('OrderProcessingEngine wiring: reserveStockForOrder rolls back on partial failure', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 5);
    await seed(repo, 'tenant-a', 'prod-2', 1);
    const orderEngine = new OrderProcessingEngine({ eventBus, logger, inventoryEngine: engine });
    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 2, unitPriceGross: 1000, totalGross: 2000 },
      { productId: 'prod-2', quantity: 5, unitPriceGross: 500, totalGross: 2500 },
    ];
    const order = await orderEngine.createOrder('tenant-a', 'cust-1', items, {
      fullName: 'X', street: 'Y', city: 'Z', zipCode: '00-000', country: 'PL',
    });
    await expect(orderEngine.reserveStockForOrder('tenant-a', order.id, items)).rejects.toThrow(
      InsufficientInventoryException
    );
    // prod-1 must have been rolled back
    const inv1 = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv1!.reserved).toBe(0);
    const inv2 = await repo.findByTenantAndProduct('tenant-a', 'prod-2');
    expect(inv2!.reserved).toBe(0);
  });

  it('process-restart simulation: stock survives engine recreation against same repo', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 12);
    const reservation = await engine.reserveStock('tenant-a', 'ord-1', 'prod-1', 4, 60);

    // Simulate Vercel cold start: brand new engine instance
    const engine2 = new InventoryEngine({ eventBus, logger, repository: adapter });
    const stockAfterRestart = await engine2.getStock('tenant-a', 'prod-1');
    expect(stockAfterRestart.quantityAvailable).toBe(8);
    expect(stockAfterRestart.quantityReserved).toBe(4);

    // The brand new engine has no knowledge of the in-memory reservation
    // record. The persistent `reserved` counter remains 4 — the inventory
    // engine uses the persistent counter for availability calculations, not
    // the in-memory reservation map. This is the desired production
    // behaviour for cold-start resilience.
    const persistedInv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(persistedInv!.quantity).toBe(12);
    expect(persistedInv!.reserved).toBe(4);

    // Suppress unused var warning.
    void reservation;
  });
});