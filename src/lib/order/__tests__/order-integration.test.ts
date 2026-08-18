/**
 * order-integration.test.ts — Sprint 6 Step 6 Finalization
 *
 * TEST INTEGRACYJNY (node env, bez jsdom):
 *
 *   Cart
 *     ↓ (CartManager + CheckoutManager)
 *   Checkout
 *     ↓ (OrderProcessingEngine.createOrder + invoiceOrder)
 *   Payment.Completed
 *     ↓ (PaymentEngine.startProcessing + completePayment → event)
 *   OrderProcessingEngine (async subscriber)
 *     ↓
 *   Status = PAID
 *
 * RZECZYWISTE komponenty: PlatformEventBusImpl, OrderProcessingEngine,
 * PaymentEngine, CartManager, CheckoutManager.
 * MOCKOWANE: PaymentProviderAdapter (stub), CartRepository (in-memory).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PlatformEventBusImpl } from '../../../../packages/platform-core/src/events/PlatformEventBus';
import { EventRegistry } from '../../../../packages/platform-core/src/events/EventRegistry';
import { ConsolePlatformLogger } from '../../../../packages/platform-core/src/logger/Logger';
import {
  OrderProcessingEngine,
  PaymentEngine,
  CartManager,
  CheckoutManager,
  type Cart,
  type Product,
  type PaymentProviderAdapter,
} from '../../../../packages/commerce-engine/src';

// Mock CartRepository (commerce-persistence contract) — in-memory double.
const { mockCartRepository } = vi.hoisted(() => ({
  mockCartRepository: {
    findById: vi.fn(),
    findByTenant: vi.fn(async () => []),
    findByCustomer: vi.fn(async () => null),
    findBySession: vi.fn(async () => null),
    create: vi.fn(async (cart: Cart) => cart),
    update: vi.fn(async (_id: string, patch: Partial<Cart>) => patch),
    delete: vi.fn(async () => undefined),
    clear: vi.fn(async () => undefined),
  },
}));

const TENANT = 'tenant-int-1';

function makeProduct(): Product {
  return {
    id: 'prod-1',
    tenantId: TENANT,
    slug: 'prod-1',
    name: 'Premium Widget',
    description: 'Test product for integration flow',
    categories: [],
    pricing: { priceGross: 10000, priceNet: 8130, taxRate: 23, currency: 'PLN' },
    inventory: { sku: 'SKU-1', quantityAvailable: 10, allowBackorder: false },
    isActive: true,
  };
}

function makeStubAdapter(): PaymentProviderAdapter {
  return {
    id: 'stub-adapter',
    createIntent: vi.fn(async () => ({
      externalId: `https://pay.stub/int_${Math.random().toString(36).substr(2, 9)}`,
      rawPayload: {},
    })),
    getPaymentStatus: (async () => 'CREATED') as PaymentProviderAdapter['getPaymentStatus'],
    refundPayment: vi.fn(async () => ({ refundExternalId: 'ref_1', success: true, rawPayload: {} })),
  };
}

describe('Integration: Cart → Checkout → Payment.Completed → Status = PAID', () => {
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let orderEngine: OrderProcessingEngine;
  let paymentEngine: PaymentEngine;

  beforeEach(() => {
    // Rejestracja eventów — idempotentna (Set).
    EventRegistry.register('Payment.Completed');
    EventRegistry.register('Order.Created');
    EventRegistry.register('Order.PaymentConfirmed');

    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    orderEngine = new OrderProcessingEngine({ eventBus, logger });
    paymentEngine = new PaymentEngine({ eventBus, logger });
  });

  it('pełny przepływ kończy się statusem PAID przez zdarzenie Payment.Completed', async () => {
    // STEP 1: Cart
    const product = makeProduct();
    let cart: Cart = {
      id: `crt_int_${Date.now()}`,
      tenantId: TENANT,
      items: [],
      totals: {
        subtotalGross: 0,
        subtotalNet: 0,
        taxTotal: 0,
        discountGross: 0,
        grandTotalGross: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    cart = CartManager.addItem(cart, product, 2);
    expect(cart.items).toHaveLength(1);
    expect(cart.totals.grandTotalGross).toBe(20000);

    // Persist via mocked CartRepository (contract without real DB).
    await mockCartRepository.create(cart);
    expect(mockCartRepository.create).toHaveBeenCalledTimes(1);

    // STEP 2: Checkout (CheckoutManager → OrderProcessingEngine)
    const shippingAddress = {
      fullName: 'Jan Kowalski',
      street: 'ul. Główna 1',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'PL',
    };
    const order = CheckoutManager.createOrder(cart, shippingAddress);
    expect(order.items).toHaveLength(1);

    const processedItems = order.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPriceGross: item.unitPriceGross,
      totalGross: item.totalGross,
    }));

    const processedOrder = await orderEngine.createOrder(
      TENANT,
      'guest',
      processedItems,
      shippingAddress,
      'PLN',
      'corr-int-1',
    );
    expect(processedOrder.status).toBe('CREATED');

    const pendingOrder = await orderEngine.invoiceOrder(TENANT, processedOrder.id, 'corr-int-1');
    expect(pendingOrder.status).toBe('PAYMENT_PENDING');

    // STEP 3: PaymentEngine → createPaymentIntent → PROCESSING → CAPTURED (Payment.Completed)
    const intent = await paymentEngine.createPaymentIntent(
      TENANT,
      pendingOrder.id,
      pendingOrder.grandTotalGross,
      pendingOrder.currency,
      makeStubAdapter(),
      'corr-int-1',
    );
    expect(intent.status).toBe('CREATED');

    const processing = await paymentEngine.startProcessing(TENANT, intent, 'corr-int-1');
    expect(processing.status).toBe('PROCESSING');

    const completed = await paymentEngine.completePayment(TENANT, processing, 'corr-int-1');
    expect(completed.status).toBe('CAPTURED');

    // STEP 4: OrderProcessingEngine asynchronicznie subskrybuje Payment.Completed
    // → confirmPayment → PAYMENT_PENDING → PAID
    const paidOrder = await orderEngine.getOrder(TENANT, pendingOrder.id);
    expect(paidOrder.status).toBe('PAID');
    expect(paidOrder.paymentIntentId).toBe(intent.id);
  });

  it('izolacja tenantów blokuje odczyt zamówienia innego tenanta', async () => {
    const shippingAddress = {
      fullName: 'Jan Kowalski',
      street: 'ul. Główna 1',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'PL',
    };
    const processed = await orderEngine.createOrder(
      TENANT,
      'guest',
      [{ productId: 'p1', quantity: 1, unitPriceGross: 100, totalGross: 100 }],
      shippingAddress,
      'PLN',
      'corr-int-iso',
    );

    await expect(
      orderEngine.getOrder('tenant-other', processed.id),
    ).rejects.toThrow('Cross-tenant access blocked');
  });
});

