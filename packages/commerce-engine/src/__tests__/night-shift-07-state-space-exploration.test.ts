import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderProcessingEngine, ProcessedOrder } from '../OrderProcessingEngine';
import { PlatformEventBusImpl } from '../../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../platform-core/src/logger/Logger';

// -----------------------------------------------------------------------------
// Night Shift 07 — State-Space Exploration & Invariant Attack Test Suite
// -----------------------------------------------------------------------------

describe('Night Shift 07 — State-Space & Invariant Protection', () => {
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let tenantId: string;
  let orderId: string;

  beforeEach(() => {
    eventBus = new PlatformEventBusImpl();
    logger = new ConsolePlatformLogger();
    tenantId = 'tenant-ss-07';
    orderId = 'ord_ss_07_500';
  });

  it('1. Anti-Regression: fulfillOrder on Node B cannot overwrite refundOrder completed on Node A', async () => {
    // Shared state mock repository simulating database Optimistic Concurrency Control (CAS)
    let dbStatus: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' = 'paid';
    let dbEngineState: string = 'PAID';

    const mockRepo: any = {
      findByTenantAndId: vi.fn(async (tId: string, id: string) => ({
        id,
        tenantId: tId,
        customerId: 'cust-ss-07',
        items: [{ productId: 'prod_1', quantity: 1, unitPriceGross: 100, totalGross: 100 }],
        subtotalGross: 100,
        taxTotal: 23,
        grandTotalGross: 100,
        currency: 'PLN',
        status: dbStatus,
        shippingAddress: { fullName: 'Test User', street: 'Street 1', city: 'City', zipCode: '00-000', country: 'PL' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { engineState: dbEngineState },
      })),
      transitionOrderStatus: vi.fn(async (tId: string, id: string, expectedStatus: any, newStatus: any, patch: any) => {
        const expectedArray = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
        if (!expectedArray.includes(dbStatus)) return false;
        dbStatus = newStatus;
        if (patch?.engineState) dbEngineState = patch.engineState;
        return true;
      }),
      upsertOrder: vi.fn(async () => {}),
    };

    // Node A executes refundOrder
    const nodeA = new OrderProcessingEngine({ eventBus, logger, repository: mockRepo });
    const refundRes = await nodeA.refundOrder(tenantId, orderId, 'corr-refund');
    expect(refundRes.status).toBe('REFUNDED');
    expect(dbStatus).toBe('cancelled');
    expect(dbEngineState).toBe('REFUNDED');

    // Node B concurrently attempts fulfillOrder on the same order
    const nodeB = new OrderProcessingEngine({ eventBus, logger, repository: mockRepo });
    await expect(nodeB.fulfillOrder(tenantId, orderId, 'corr-fulfill-race')).rejects.toThrow(
      /Invalid status transition/
    );

    // Verify DB status was NOT overwritten by Node B!
    expect(dbStatus).toBe('cancelled');
    expect(dbEngineState).toBe('REFUNDED');
  });

  it('2. Anti-Regression: confirmPayment on Node B cannot overwrite cancelOrder completed on Node A', async () => {
    let dbStatus: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' = 'cancelled';
    let dbEngineState: string = 'CANCELLED';

    const mockRepo: any = {
      findByTenantAndId: vi.fn(async (tId: string, id: string) => ({
        id,
        tenantId: tId,
        customerId: 'cust-ss-07',
        items: [{ productId: 'prod_1', quantity: 1, unitPriceGross: 100, totalGross: 100 }],
        subtotalGross: 100,
        taxTotal: 23,
        grandTotalGross: 100,
        currency: 'PLN',
        status: dbStatus,
        shippingAddress: { fullName: 'Test User', street: 'Street 1', city: 'City', zipCode: '00-000', country: 'PL' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { engineState: dbEngineState },
      })),
      transitionOrderStatus: vi.fn(async (tId: string, id: string, expectedStatus: any, newStatus: any, patch: any) => {
        const expectedArray = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
        if (!expectedArray.includes(dbStatus)) return false;
        dbStatus = newStatus;
        if (patch?.engineState) dbEngineState = patch.engineState;
        return true;
      }),
      upsertOrder: vi.fn(async () => {}),
    };

    const nodeB = new OrderProcessingEngine({ eventBus, logger, repository: mockRepo });
    await expect(nodeB.confirmPayment(tenantId, orderId, 'intent_late', 'corr-pay-race')).rejects.toThrow(
      /Invalid status transition/
    );

    expect(dbStatus).toBe('cancelled');
    expect(dbEngineState).toBe('CANCELLED');
  });

  it('3. Monotonic Progression: Full lifecycle from CREATED through REFUNDED enforces CAS at every step', async () => {
    let dbStatus: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled' = 'pending';
    let dbEngineState: string = 'PAYMENT_PENDING';

    const mockRepo: any = {
      findByTenantAndId: vi.fn(async (tId: string, id: string) => ({
        id,
        tenantId: tId,
        customerId: 'cust-ss-07',
        items: [{ productId: 'prod_1', quantity: 1, unitPriceGross: 100, totalGross: 100 }],
        subtotalGross: 100,
        taxTotal: 23,
        grandTotalGross: 100,
        currency: 'PLN',
        status: dbStatus,
        shippingAddress: { fullName: 'Test User', street: 'Street 1', city: 'City', zipCode: '00-000', country: 'PL' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { engineState: dbEngineState },
      })),
      transitionOrderStatus: vi.fn(async (tId: string, id: string, expectedStatus: any, newStatus: any, patch: any) => {
        const expectedArray = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
        if (!expectedArray.includes(dbStatus)) return false;
        dbStatus = newStatus;
        if (patch?.engineState) dbEngineState = patch.engineState;
        return true;
      }),
      upsertOrder: vi.fn(async () => {}),
    };

    const engine = new OrderProcessingEngine({ eventBus, logger, repository: mockRepo });

    // Step 1: confirmPayment -> PAID
    const paid = await engine.confirmPayment(tenantId, orderId, 'intent_mono_100', 'corr-mono-1');
    expect(paid.status).toBe('PAID');
    expect(dbStatus).toBe('paid');

    // Step 2: startProcessing -> PROCESSING
    const processing = await engine.startProcessing(tenantId, orderId, 'corr-mono-1b');
    expect(processing.status).toBe('PROCESSING');
    expect(dbStatus).toBe('paid');

    // Step 3: prepareFulfillment -> READY_FOR_FULFILLMENT
    const ready = await engine.prepareFulfillment(tenantId, orderId, 'corr-mono-2');
    expect(ready.status).toBe('READY_FOR_FULFILLMENT');
    expect(dbStatus).toBe('shipped');

    // Step 3: fulfillOrder -> FULFILLED
    const fulfilled = await engine.fulfillOrder(tenantId, orderId, 'corr-mono-3');
    expect(fulfilled.status).toBe('FULFILLED');
    expect(dbStatus).toBe('completed');

    // Step 4: refundOrder -> REFUNDED
    const refunded = await engine.refundOrder(tenantId, orderId, 'corr-mono-4');
    expect(refunded.status).toBe('REFUNDED');
    expect(dbStatus).toBe('cancelled');
  });
});
