import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ConfigurationManager } from '../../platform-core/src/config/PlatformConfig';
import { OrderProcessingEngine, InvalidOrderStateException, ProcessedOrderItem } from './OrderProcessingEngine';
import { TenantSecurityException } from './CommerceEngine';

describe('Order Processing Engine', () => {
  let engine: OrderProcessingEngine;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    engine = new OrderProcessingEngine({ eventBus, logger });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should transition order states correctly in happy path: CREATED -> PAYMENT_PENDING -> PAID -> PROCESSING -> READY_FOR_FULFILLMENT -> FULFILLED', async () => {
    const tenantId = 'tenant-shop-xyz';
    const customerId = 'cust_123';

    const items: ProcessedOrderItem[] = [
      {
        productId: 'prod_1',
        quantity: 2,
        unitPriceGross: 1000,
        totalGross: 2000,
      },
    ];

    const shippingAddress = {
      fullName: 'Jan Kowalski',
      street: 'Krucza 5',
      city: 'Krakow',
      zipCode: '31-001',
      country: 'PL',
    };

    // 1. Create order
    let order = await engine.createOrder(tenantId, customerId, items, shippingAddress, 'PLN', undefined, {
      subtotalGross: 2000,
      taxTotal: 0,
      grandTotalGross: 2000,
    });
    expect(order.status).toBe('CREATED');
    expect(order.grandTotalGross).toBe(2000);

    // 2. Invoice order (CREATED -> PAYMENT_PENDING)
    order = await engine.invoiceOrder(tenantId, order.id);
    expect(order.status).toBe('PAYMENT_PENDING');

    // 3. Confirm Payment (PAYMENT_PENDING -> PAID)
    order = await engine.confirmPayment(tenantId, order.id, 'pi_stripe_abc');
    expect(order.status).toBe('PAID');
    expect(order.paymentIntentId).toBe('pi_stripe_abc');

    // 4. Start Processing (PAID -> PROCESSING)
    order = await engine.startProcessing(tenantId, order.id);
    expect(order.status).toBe('PROCESSING');

    // 5. Prepare (PROCESSING -> READY_FOR_FULFILLMENT)
    order = await engine.prepareFulfillment(tenantId, order.id);
    expect(order.status).toBe('READY_FOR_FULFILLMENT');

    // 6. Fulfill (READY_FOR_FULFILLMENT -> FULFILLED)
    order = await engine.fulfillOrder(tenantId, order.id);
    expect(order.status).toBe('FULFILLED');
  });

  it('Should automatically transition PAYMENT_PENDING to PAID when Payment.Completed event is received', async () => {
    const tenantId = 'tenant-shop-xyz';
    const customerId = 'cust_123';
    const items = [{ productId: 'p1', quantity: 1, unitPriceGross: 100, totalGross: 100 }];
    const shipping = { fullName: 'A', street: 'B', city: 'C', zipCode: 'D', country: 'E' };

    let order = await engine.createOrder(tenantId, customerId, items, shipping);
    order = await engine.invoiceOrder(tenantId, order.id);
    expect(order.status).toBe('PAYMENT_PENDING');

    // Publish simulated Payment.Completed event via event bus
    await eventBus.publish({
      eventId: 'evt_sim_pay_comp',
      eventType: 'Payment.Completed',
      timestamp: new Date().toISOString(),
      correlationId: 'corr_test_event',
      tenantId,
      payload: {
        orderId: order.id,
        paymentIntentId: 'pi_stripe_completed',
      },
    });

    // Wait short tick for microtask queue to run event handlers
    await new Promise((resolve) => setTimeout(resolve, 10));

    // Get order from engine and verify transition
    const updatedOrder = await engine.getOrder(tenantId, order.id);
    expect(updatedOrder.status).toBe('PAID');
    expect(updatedOrder.paymentIntentId).toBe('pi_stripe_completed');
  });

  it('Should throw TenantSecurityException on cross-tenant order modification attempts', async () => {
    const tenantA = 'tenant-a';
    const tenantB = 'tenant-b';
    const customerId = 'cust_123';
    const items = [{ productId: 'p1', quantity: 1, unitPriceGross: 100, totalGross: 100 }];
    const shipping = { fullName: 'A', street: 'B', city: 'C', zipCode: 'D', country: 'E' };

    const orderA = await engine.createOrder(tenantA, customerId, items, shipping);

    // Tenant B trying to access/modify Tenant A's order -> throws
    await expect(
      engine.invoiceOrder(tenantB, orderA.id)
    ).rejects.toThrow(TenantSecurityException);

    await expect(
      engine.getOrder(tenantB, orderA.id)
    ).rejects.toThrow(TenantSecurityException);
  });

  it('Should throw InvalidOrderStateException for illegal order transitions', async () => {
    const tenantId = 'tenant-shop-xyz';
    const customerId = 'cust_123';
    const items = [{ productId: 'p1', quantity: 1, unitPriceGross: 100, totalGross: 100 }];
    const shipping = { fullName: 'A', street: 'B', city: 'C', zipCode: 'D', country: 'E' };

    let order = await engine.createOrder(tenantId, customerId, items, shipping);

    // Cannot go directly CREATED -> PAID (must go through PAYMENT_PENDING)
    await expect(
      engine.confirmPayment(tenantId, order.id, 'pi_123')
    ).rejects.toThrow(InvalidOrderStateException);

    order = await engine.invoiceOrder(tenantId, order.id);

    // Can cancel from PAYMENT_PENDING
    order = await engine.cancelOrder(tenantId, order.id);
    expect(order.status).toBe('CANCELLED');

    // Cannot process cancelled order
    await expect(
      engine.startProcessing(tenantId, order.id)
    ).rejects.toThrow(InvalidOrderStateException);
  });
});

describe('Order Processing Engine — Recovery Subscribers (G1-264/G1-266)', () => {
  let engine: OrderProcessingEngine;
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let originalEnv: string | undefined;

  beforeEach(async () => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();
    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);
    engine = new OrderProcessingEngine({ eventBus, logger });
    await new Promise((r) => setTimeout(r, 5));
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
  });

  it('should auto-cancel a PAYMENT_PENDING order on Payment.Failed event', async () => {
    const tenantId = 'tenant-recovery-1';
    const items: ProcessedOrderItem[] = [
      { productId: 'p1', quantity: 1, unitPriceGross: 1000, totalGross: 1000 },
    ];
    const order = await engine.createOrder(tenantId, 'cust-1', items, { fullName: 'X', street: 'X', city: 'X', zipCode: 'X', country: 'PL' });
    const invoiced = await engine.invoiceOrder(tenantId, order.id);
    expect(invoiced.status).toBe('PAYMENT_PENDING');

    eventBus.publish({
      eventId: 'evt_fail_1',
      eventType: 'Payment.Failed',
      timestamp: new Date().toISOString(),
      correlationId: 'corr_fail_1',
      tenantId,
      payload: { orderId: order.id, paymentIntentId: 'pi_fail_1' },
    });

    await new Promise((r) => setTimeout(r, 30));

    const after = (await engine.getOrder(tenantId, order.id)) as any;
    expect(after).toBeDefined();
    expect(after.status).toBe('CANCELLED');
  });

  it('should auto-refund a PAID order on Payment.Refunded event', async () => {
    const tenantId = 'tenant-recovery-2';
    const items: ProcessedOrderItem[] = [
      { productId: 'p1', quantity: 1, unitPriceGross: 2000, totalGross: 2000 },
    ];
    const order = await engine.createOrder(tenantId, 'cust-2', items, { fullName: 'X', street: 'X', city: 'X', zipCode: 'X', country: 'PL' });
    await engine.invoiceOrder(tenantId, order.id);
    await engine.confirmPayment(tenantId, order.id, 'pi_2');

    eventBus.publish({
      eventId: 'evt_ref_1',
      eventType: 'Payment.Refunded',
      timestamp: new Date().toISOString(),
      correlationId: 'corr_ref_1',
      tenantId,
      payload: { orderId: order.id, paymentIntentId: 'pi_2' },
    });

    await new Promise((r) => setTimeout(r, 30));

    const after = (await engine.getOrder(tenantId, order.id)) as any;
    expect(after.status).toBe('REFUNDED');
  });

  it('should ignore Payment.Refunded for orders in unexpected states', async () => {
    const tenantId = 'tenant-recovery-3';
    const items: ProcessedOrderItem[] = [
      { productId: 'p1', quantity: 1, unitPriceGross: 100, totalGross: 100 },
    ];
    const order = await engine.createOrder(tenantId, 'cust-3', items, { fullName: 'X', street: 'X', city: 'X', zipCode: 'X', country: 'PL' });
    expect(order.status).toBe('CREATED');

    eventBus.publish({
      eventId: 'evt_ref_2',
      eventType: 'Payment.Refunded',
      timestamp: new Date().toISOString(),
      correlationId: 'corr_ref_2',
      tenantId,
      payload: { orderId: order.id, paymentIntentId: 'pi_x' },
    });

    await new Promise((r) => setTimeout(r, 30));

    const after = (await engine.getOrder(tenantId, order.id)) as any;
    expect(after.status).toBe('CREATED');
  });
});
