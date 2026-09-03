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
  return new ConsolePlatformLogger();
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

describe('G1-334 Stock Reservation Persistence, Movement Persistence & Expiration Lifecycle', () => {
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

  // Scenario A & M: Process restart between lifecycle steps
  it('Scenario A/M: process restart survival — commit reservation from new engine instance', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const res = await engine.reserveStock('tenant-a', 'ord-100', 'prod-1', 3, 60);

    // Simulate process restart / cold start
    const eventBus2 = makeEventBus(logger);
    const engine2 = new InventoryEngine({ eventBus: eventBus2, logger, repository: adapter });

    // Look up reservation from new engine instance
    const retrieved = await engine2.getReservation('tenant-a', res.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.status).toBe('PENDING');

    // Commit from second engine instance
    const movement = await engine2.commitStock('tenant-a', res.id);
    expect(movement.type).toBe('RESERVATION_COMMIT');
    expect(movement.quantityDelta).toBe(-3);

    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.quantity).toBe(7);
    expect(inv?.reserved).toBe(0);
  });

  // Scenario M & Order Engine: OrderProcessingEngine recovers reservations across process restart
  it('OrderProcessingEngine restart: confirmPayment commits durable reservations after restart', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const { MemoryOrderRepository } = await import('../../commerce-persistence/src/repositories/MemoryOrderRepository');
    const { OrderRepositoryAdapter } = await import('./OrderProcessingEngine');
    const orderRepo = new MemoryOrderRepository();
    const orderAdapter = new OrderRepositoryAdapter(orderRepo);

    const orderEngine1 = new OrderProcessingEngine({ eventBus, logger, inventoryEngine: engine, repository: orderAdapter });

    const items: ProcessedOrderItem[] = [
      { productId: 'prod-1', quantity: 4, unitPriceGross: 1000, totalGross: 4000 },
    ];
    const order = await orderEngine1.createOrder('tenant-a', 'cust-1', items, {
      fullName: 'John', street: 'Street 1', city: 'City', zipCode: '00-000', country: 'PL',
    });
    await orderEngine1.reserveStockForOrder('tenant-a', order.id, items);
    await orderEngine1.invoiceOrder('tenant-a', order.id);

    // Process restart: new InventoryEngine and OrderProcessingEngine over same repositories
    const engine2 = new InventoryEngine({ eventBus, logger, repository: adapter });
    const orderEngine2 = new OrderProcessingEngine({ eventBus, logger, inventoryEngine: engine2, repository: orderAdapter });

    // Confirm payment from new instance
    await orderEngine2.confirmPayment('tenant-a', order.id, 'pi_123');

    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.quantity).toBe(6);
    expect(inv?.reserved).toBe(0);
  });

  // Scenario B & F: Reservation expiration sweeper
  it('Scenario B/F: expiration sweeper releases expired reservations idempotently', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    // Reserve with TTL = -10s (already expired)
    const res = await engine.reserveStock('tenant-a', 'ord-101', 'prod-1', 3, -10);

    let inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.reserved).toBe(3);

    // Run sweeper
    const sweep1 = await engine.sweepExpiredReservations('tenant-a');
    expect(sweep1.sweptCount).toBe(1);
    expect(sweep1.expiredReservationIds).toContain(res.id);

    inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.reserved).toBe(0);

    const updatedRes = await engine.getReservation('tenant-a', res.id);
    expect(updatedRes?.status).toBe('EXPIRED');

    // Run sweeper second time (idempotent no-op)
    const sweep2 = await engine.sweepExpiredReservations('tenant-a');
    expect(sweep2.sweptCount).toBe(0);
  });

  // Scenario C & K: Double commit / replayed webhook idempotency
  it('Scenario C/K: payment succeeds twice / webhook replayed — commit is idempotent', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const res = await engine.reserveStock('tenant-a', 'ord-102', 'prod-1', 2, 60);

    const mov1 = await engine.commitStock('tenant-a', res.id);
    expect(mov1.type).toBe('RESERVATION_COMMIT');

    // Second commit call (replayed webhook)
    const mov2 = await engine.commitStock('tenant-a', res.id);
    expect(mov2).toBeDefined();

    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.quantity).toBe(8);
    expect(inv?.reserved).toBe(0);
  });

  // Scenario D & E: Double release / cancellation after payment failure idempotency
  it('Scenario D/E: release called twice / cancel after payment failure — release is idempotent', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const res = await engine.reserveStock('tenant-a', 'ord-103', 'prod-1', 2, 60);

    await engine.releaseStock('tenant-a', res.id);
    // Second release call
    await engine.releaseStock('tenant-a', res.id);

    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.quantity).toBe(10);
    expect(inv?.reserved).toBe(0);
  });

  // Scenario G: Expiration races with payment success
  it('Scenario G: commit on already EXPIRED reservation throws error and does not corrupt stock', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const res = await engine.reserveStock('tenant-a', 'ord-104', 'prod-1', 3, -5);

    // Sweeper expires it first
    await engine.sweepExpiredReservations('tenant-a');

    // Payment confirm attempts commit
    await expect(engine.commitStock('tenant-a', res.id)).rejects.toThrow(/EXPIRED/);

    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.quantity).toBe(10);
    expect(inv?.reserved).toBe(0);
  });

  // Scenario H: Expiration races with cancellation
  it('Scenario H: release on already EXPIRED reservation is an idempotent no-op', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const res = await engine.reserveStock('tenant-a', 'ord-105', 'prod-1', 3, -5);

    // Sweeper expires it
    await engine.sweepExpiredReservations('tenant-a');

    // Order cancellation attempts release
    await engine.releaseStock('tenant-a', res.id);

    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.quantity).toBe(10);
    expect(inv?.reserved).toBe(0);
  });

  // Scenario I: Concurrent reservations competing for last quantity
  it('Scenario I: concurrent reservations for last stock unit — exactly one succeeds', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 1);

    const results = await Promise.allSettled([
      engine.reserveStock('tenant-a', 'ord-conc-1', 'prod-1', 1, 60),
      engine.reserveStock('tenant-a', 'ord-conc-2', 'prod-1', 1, 60),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const inv = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(inv?.reserved).toBe(1);
  });

  // Scenario J: Tenant isolation
  it('Scenario J: two tenants operating on same product ID are fully isolated', async () => {
    await seed(repo, 'tenant-a', 'prod-common', 5);
    await seed(repo, 'tenant-b', 'prod-common', 10);

    const resA = await engine.reserveStock('tenant-a', 'ord-a', 'prod-common', 3, 60);
    const resB = await engine.reserveStock('tenant-b', 'ord-b', 'prod-common', 4, 60);

    // Cross-tenant commit blocked
    await expect(engine.commitStock('tenant-a', resB.id)).rejects.toThrow(TenantSecurityException);

    // Commit A
    await engine.commitStock('tenant-a', resA.id);
    const invA = await repo.findByTenantAndProduct('tenant-a', 'prod-common');
    const invB = await repo.findByTenantAndProduct('tenant-b', 'prod-common');

    expect(invA?.quantity).toBe(2);
    expect(invA?.reserved).toBe(0);

    expect(invB?.quantity).toBe(10);
    expect(invB?.reserved).toBe(4);
  });

  // Durable Movements Verification
  it('Durable StockMovements: all lifecycle actions produce durable movement records', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 20);

    // 1. Adjustment
    await engine.adjustStock('tenant-a', 'prod-1', 5, 'RECEIPT', 'Stock delivery');

    // 2. Reserve & Commit
    const res1 = await engine.reserveStock('tenant-a', 'ord-mov-1', 'prod-1', 2, 60);
    await engine.commitStock('tenant-a', res1.id);

    // 3. Reserve & Release
    const res2 = await engine.reserveStock('tenant-a', 'ord-mov-2', 'prod-1', 1, 60);
    await engine.releaseStock('tenant-a', res2.id);

    // 4. Reserve & Expire
    await engine.reserveStock('tenant-a', 'ord-mov-3', 'prod-1', 1, -10);
    await engine.sweepExpiredReservations('tenant-a');

    const movements = await engine.getMovements('tenant-a', 'prod-1');
    const types = movements.map((m) => m.type);

    expect(types).toContain('RECEIPT');
    expect(types).toContain('RESERVATION_COMMIT');
    expect(types).toContain('RESERVATION_RELEASE');
    expect(types).toContain('EXPIRED');
  });

  // Failure Injection: Concurrent Sweepers on Same Expired Reservation
  it('Failure Injection: concurrent sweepers running simultaneously do not double-release stock', async () => {
    await seed(repo, 'tenant-a', 'prod-1', 10);
    const res = await engine.reserveStock('tenant-a', 'ord-race-1', 'prod-1', 4, -10);

    const invBefore = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(invBefore?.reserved).toBe(4);

    // Simulate two concurrent sweep workers
    const [sweep1, sweep2] = await Promise.all([
      engine.sweepExpiredReservations('tenant-a'),
      engine.sweepExpiredReservations('tenant-a'),
    ]);

    const totalSwept = sweep1.sweptCount + sweep2.sweptCount;
    expect(totalSwept).toBe(1);

    const invAfter = await repo.findByTenantAndProduct('tenant-a', 'prod-1');
    expect(invAfter?.reserved).toBe(0);
    expect(invAfter?.quantity).toBe(10);
  });

  // Cron API Route Secret Authentication
  it('Cron Security: route rejects unauthorized invocations when CRON_SECRET is set', async () => {
    const { POST } = await import('../../../src/app/api/cron/inventory-expiration/route');

    const originalSecret = process.env.CRON_SECRET;
    try {
      process.env.CRON_SECRET = 'test-cron-secret-12345';

      // 1. Unauthenticated request
      const req1 = new Request('http://localhost/api/cron/inventory-expiration', { method: 'POST' });
      const res1 = await POST(req1);
      expect(res1.status).toBe(401);
      await res1.json();

      // 2. Request with invalid secret
      const req2 = new Request('http://localhost/api/cron/inventory-expiration', {
        method: 'POST',
        headers: { authorization: 'Bearer wrong-secret' },
      });
      const res2 = await POST(req2);
      expect(res2.status).toBe(401);
      await res2.json();

      // 3. Request with valid secret
      const req3 = new Request('http://localhost/api/cron/inventory-expiration', {
        method: 'POST',
        headers: { authorization: 'Bearer test-cron-secret-12345' },
      });
      const res3 = await POST(req3);
      expect(res3.status).toBe(200);
      const body = await res3.json();
      expect(body.success).toBe(true);
    } finally {
      process.env.CRON_SECRET = originalSecret;
      ConfigurationManager.resetInstanceForTesting();
    }
  });
});
