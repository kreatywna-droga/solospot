import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderProcessingEngine, ProcessedOrder } from '../OrderProcessingEngine';
import { InventoryEngine } from '../InventoryEngine';
import { PlatformEventBusImpl } from '../../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../platform-core/src/logger/Logger';

// -----------------------------------------------------------------------------
// Night Shift 06 — Cross-Subsystem Chaos & Crash Recovery Test Suite
// -----------------------------------------------------------------------------

describe('Night Shift 06 — Cross-Subsystem Chaos Recovery', () => {
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let tenantId: string;
  let orderId: string;

  beforeEach(() => {
    eventBus = new PlatformEventBusImpl();
    logger = new ConsolePlatformLogger();
    tenantId = 'tenant-chaos-06';
    orderId = 'ord_chaos_06_100';
  });

  it('1. Crash Recovery: Retried confirmPayment completes missing inventory commits after mid-process crash', async () => {
    const committedReservations: string[] = [];

    // Mock InventoryEngine where commitStock tracks calls and is idempotent
    const mockInventoryEngine: any = {
      commitStock: vi.fn(async (tId: string, resId: string) => {
        if (!committedReservations.includes(resId)) {
          committedReservations.push(resId);
        }
        return { success: true, reservationId: resId, status: 'COMMITTED' };
      }),
      listReservations: vi.fn(async (tId: string, oId: string) => [
        { id: 'res_item_1', orderId: oId, status: committedReservations.includes('res_item_1') ? 'COMMITTED' : 'PENDING' },
        { id: 'res_item_2', orderId: oId, status: committedReservations.includes('res_item_2') ? 'COMMITTED' : 'PENDING' },
      ]),
    };

    // Simulated Instance A: Crashes after committing item 1
    const instanceA = new OrderProcessingEngine({
      eventBus,
      logger,
      inventoryEngine: mockInventoryEngine,
    });

    const initialOrder: ProcessedOrder = {
      id: orderId,
      tenantId,
      customerId: 'cust-chaos',
      items: [{ productId: 'prod_1', quantity: 2, unitPriceGross: 100, totalGross: 200 }],
      subtotalGross: 200,
      taxTotal: 46,
      grandTotalGross: 200,
      currency: 'PLN',
      status: 'PAYMENT_PENDING',
      shippingAddress: { fullName: 'Jan Kowalski', street: 'Królewska 1', city: 'Warszawa', zipCode: '00-001', country: 'PL' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Pre-seed order in engine RAM/storage
    (instanceA as any).orders.set(orderId, initialOrder);

    // Simulate Instance A starting confirmPayment and committing item 1, then crashing
    await mockInventoryEngine.commitStock(tenantId, 'res_item_1');
    // Manually mark order as PAID to simulate DB persistence before node crash
    const paidOrder = { ...initialOrder, status: 'PAID' as const };
    (instanceA as any).orders.set(orderId, paidOrder);

    expect(committedReservations).toEqual(['res_item_1']); // item 2 was NOT committed yet!

    // Simulated Instance B (separate node process on retry): Receives retried webhook
    const instanceB = new OrderProcessingEngine({
      eventBus,
      logger,
      inventoryEngine: mockInventoryEngine,
    });
    (instanceB as any).orders.set(orderId, paidOrder);

    // Instance B receives retried confirmPayment call
    const result = await instanceB.confirmPayment(tenantId, orderId, 'intent_100', 'corr-retry-1');

    expect(result.status).toBe('PAID');
    // Verify Instance B completed commitment for item 2!
    expect(committedReservations).toContain('res_item_1');
    expect(committedReservations).toContain('res_item_2');
    expect(committedReservations.length).toBe(2);
  });

  it('2. Crash Recovery: Retried cancelOrder completes missing inventory releases after mid-process crash', async () => {
    const releasedReservations: string[] = [];

    const mockInventoryEngine: any = {
      releaseStock: vi.fn(async (tId: string, resId: string) => {
        if (!releasedReservations.includes(resId)) {
          releasedReservations.push(resId);
        }
        return { success: true, reservationId: resId, status: 'RELEASED' };
      }),
      listReservations: vi.fn(async (tId: string, oId: string) => [
        { id: 'res_cancel_1', orderId: oId, status: releasedReservations.includes('res_cancel_1') ? 'RELEASED' : 'PENDING' },
        { id: 'res_cancel_2', orderId: oId, status: releasedReservations.includes('res_cancel_2') ? 'RELEASED' : 'PENDING' },
      ]),
    };

    const instanceA = new OrderProcessingEngine({
      eventBus,
      logger,
      inventoryEngine: mockInventoryEngine,
    });

    const initialOrder: ProcessedOrder = {
      id: orderId,
      tenantId,
      customerId: 'cust-chaos-2',
      items: [{ productId: 'prod_2', quantity: 1, unitPriceGross: 150, totalGross: 150 }],
      subtotalGross: 150,
      taxTotal: 34.5,
      grandTotalGross: 150,
      currency: 'PLN',
      status: 'PAYMENT_PENDING',
      shippingAddress: { fullName: 'Anna Nowak', street: 'Długa 5', city: 'Kraków', zipCode: '30-001', country: 'PL' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (instanceA as any).orders.set(orderId, initialOrder);

    // Simulate Instance A releasing item 1 then crashing
    await mockInventoryEngine.releaseStock(tenantId, 'res_cancel_1');
    const cancelledOrder = { ...initialOrder, status: 'CANCELLED' as const };

    // Instance B receives retried cancelOrder
    const instanceB = new OrderProcessingEngine({
      eventBus,
      logger,
      inventoryEngine: mockInventoryEngine,
    });
    (instanceB as any).orders.set(orderId, cancelledOrder);

    const result = await instanceB.cancelOrder(tenantId, orderId, 'corr-cancel-retry');

    expect(result.status).toBe('CANCELLED');
    expect(releasedReservations).toContain('res_cancel_1');
    expect(releasedReservations).toContain('res_cancel_2');
    expect(releasedReservations.length).toBe(2);
  });

  it('3. Retry Storm: 10 concurrent confirmPayment invocations produce 0 side-effect amplification', async () => {
    let commitCalls = 0;

    let resStatus = 'PENDING';
    const mockInventoryEngine: any = {
      commitStock: vi.fn(async (tId: string, rId: string) => {
        if (resStatus === 'COMMITTED') return { success: true, status: 'COMMITTED' };
        resStatus = 'COMMITTED';
        commitCalls++;
        return { success: true, status: 'COMMITTED' };
      }),
      listReservations: vi.fn(async () => [{ id: 'res_storm_1', status: resStatus }]),
    };

    const engine = new OrderProcessingEngine({
      eventBus,
      logger,
      inventoryEngine: mockInventoryEngine,
    });

    const initialOrder: ProcessedOrder = {
      id: orderId,
      tenantId,
      customerId: 'cust-storm',
      items: [],
      subtotalGross: 100,
      taxTotal: 23,
      grandTotalGross: 100,
      currency: 'PLN',
      status: 'PAYMENT_PENDING',
      shippingAddress: { fullName: 'Piotr Wiśniewski', street: 'Prosta 10', city: 'Gdańsk', zipCode: '80-001', country: 'PL' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    (engine as any).orders.set(orderId, initialOrder);

    // Fire 10 concurrent requests
    const promises = Array.from({ length: 10 }).map((_, i) =>
      engine.confirmPayment(tenantId, orderId, 'intent_storm', `corr-storm-${i}`)
    );

    const results = await Promise.all(promises);

    expect(results).toHaveLength(10);
    results.forEach(res => expect(res.status).toBe('PAID'));
    // Physical inventory commit should be called exactly once per item across all storm retries
    expect(commitCalls).toBe(1);
  });
});
