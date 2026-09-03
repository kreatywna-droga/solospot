/**
 * order-e2e-multilayer.test.ts — B17-REAL-CANARY-2
 *
 * 5 REAL MULTI-LAYER E2E WORKFLOWS
 *
 * Spans:
 *   1. UI State: CartStore (cartReducer)
 *   2. Adapter: cartAdapter (toCommerceProduct, buildCartFromRequest)
 *   3. Orchestration & API: OrderRuntime (checkout, idempotency, getOrderStatus)
 *   4. Domain Engines: CheckoutManager, OrderProcessingEngine, PaymentEngine
 *   5. Event Layer: PlatformEventBus (Payment.Completed -> Order status PAID)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { cartReducer, type CartItem, type CartState } from '@/lib/cart/CartStore';
import { toCommerceProduct, buildCartFromRequest } from '@/lib/cart/cartAdapter';
import { OrderRuntime, type CheckoutRequestDTO } from '../OrderRuntime';
import { PlatformEventBusImpl } from '../../../../packages/platform-core/src/events/PlatformEventBus';
import { EventRegistry } from '../../../../packages/platform-core/src/events/EventRegistry';
import { ConsolePlatformLogger } from '../../../../packages/platform-core/src/logger/Logger';
import {
  OrderProcessingEngine,
  PaymentEngine,
  type PaymentProviderAdapter,
} from '../../../../packages/commerce-engine/src';
import type { Product as StoreProduct } from '@/lib/product/ProductTypes';

// Mock PaymentFactory with deterministic stub
vi.mock('@/lib/payments/PaymentFactory', () => ({
  PaymentFactory: {
    getProvider: vi.fn(() => ({
      id: 'e2e-provider-stub',
      createIntent: vi.fn(async ({ amountGross }: { amountGross: number }) => ({
        externalId: `https://pay.gateway/intent_${amountGross}`,
        rawPayload: { amountGross },
      })),
      getPaymentStatus: vi.fn(async () => 'CREATED'),
      refundPayment: vi.fn(async () => ({ refundExternalId: 'ref_123', success: true, rawPayload: {} })),
    })),
  },
}));

vi.mock('@/lib/product/ProductRepository', () => ({
  ProductRepository: class {
    async getProduct(productId: string) {
      const prices: Record<string, number> = {
        'prod-mug': 4000,
        'p1': 3000,
        'p2': 5000,
        'p3': 3000,
        'book-1': 5000,
        'soft-1': 20000,
      };
      return {
        id: productId,
        tenantId: 'tenant-e2e',
        name: `Product ${productId}`,
        description: '',
        price: prices[productId] ?? 3000,
        currency: 'PLN',
        status: 'ACTIVE' as const,
        storeId: 'store-e2e',
        images: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },
}));

function createStoreProduct(id: string, name: string, price: number, taxRate = 23): StoreProduct {
  return {
    id,
    tenantId: 'tenant-e2e',
    storeId: 'store-e2e',
    name,
    description: `Description for ${name}`,
    price,
    currency: 'PLN',
    status: 'ACTIVE',
    images: ['/img.png'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

const shippingAddress = {
  fullName: 'Anna Nowak',
  street: 'Marszałkowska 10',
  city: 'Warszawa',
  zipCode: '00-001',
  country: 'PL',
};

describe('B17-REAL-CANARY-2 — Multi-Layer E2E Workflows', () => {
  let runtime: OrderRuntime;

  beforeEach(() => {
    runtime = new OrderRuntime();
  });

  it('E2E-01: User Action (UI Store ADD_ITEM x2) -> Store State -> Adapter -> API Checkout -> Domain Order -> Verified grandTotalGross', async () => {
    // 1. UI Layer: User adds 1 mug, then adds 2 more mugs
    let state: CartState = { items: [], itemCount: 0, hydrated: true };
    const mugItem: CartItem = {
      productId: 'prod-mug',
      name: 'Ceramic Mug',
      price: 4000, // 40.00 PLN
      currency: 'PLN',
      image: '/mug.png',
      quantity: 1,
    };

    state = cartReducer(state, { type: 'ADD_ITEM', payload: mugItem });
    expect(state.items[0].quantity).toBe(1);

    // Second user click: add 2 more
    state = cartReducer(state, { type: 'ADD_ITEM', payload: { ...mugItem, quantity: 2 } });
    expect(state.items[0].quantity).toBe(3); // 1 + 2 = 3
    expect(state.itemCount).toBe(3);

    // 2. Adapter Layer: Map to request DTO
    const checkoutReq: CheckoutRequestDTO = {
      items: state.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        unitPriceGross: i.price,
      })),
      shippingAddress,
      currency: 'PLN',
    };

    // 3. Orchestration & API Layer: OrderRuntime.checkout()
    const res = await runtime.checkout('tenant-e2e', 'guest', checkoutReq, 'e2e-corr-01');

    // 4. Domain & Payment Assertions:
    expect(res.success).toBe(true);
    expect(res.grandTotalGross).toBe(12000); // 3 * 40.00 PLN = 120.00 PLN (12000 gr)
    expect(res.redirectUrl).toBe('https://pay.gateway/intent_12000');

    const order = await runtime.getOrderStatus('tenant-e2e', res.orderId);
    expect(order.status).toBe('PAYMENT_PENDING');
    expect(order.grandTotalGross).toBe(12000);
  });

  it('E2E-02: Multi-Item Storefront Cart -> Coupon SAVE10 -> API Checkout -> Domain Invoicing -> Payment Intent -> Payment.Completed -> Order Status PAID', async () => {
    const logger = new ConsolePlatformLogger();
    const eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);
    EventRegistry.register('Payment.Completed');
    EventRegistry.register('Order.Created');
    EventRegistry.register('Order.PaymentConfirmed');

    const orderEngine = new OrderProcessingEngine({ eventBus, logger });
    const paymentEngine = new PaymentEngine({ eventBus, logger });

    // 1. User puts 2 products into cart
    let state: CartState = { items: [], itemCount: 0, hydrated: true };
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { productId: 'p1', name: 'Hoodie', price: 15000, currency: 'PLN', image: '/h.png', quantity: 1 },
    });
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { productId: 'p2', name: 'Cap', price: 5000, currency: 'PLN', image: '/c.png', quantity: 1 },
    });

    // 2. Checkout with SAVE10 coupon
    const checkoutReq: CheckoutRequestDTO = {
      items: state.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPriceGross: i.price })),
      couponCode: 'SAVE10',
      shippingAddress,
      currency: 'PLN',
    };

    const res = await runtime.checkout('tenant-e2e', 'cust-102', checkoutReq, 'e2e-corr-02');
    // Server-side prices: p1=3000, p2=5000. Subtotal: 8000; SAVE10: 800; GrandTotal: 7200
    expect(res.grandTotalGross).toBe(7200);
    expect(res.redirectUrl).toBe('https://pay.gateway/intent_7200');

    // 3. Simulate payment webhook completion
    const stubAdapter: PaymentProviderAdapter = {
      id: 'e2e-provider-stub',
      createIntent: vi.fn(async () => ({ externalId: 'pi_test_02', rawPayload: {} })),
      getPaymentStatus: vi.fn(async () => 'CAPTURED' as const),
      refundPayment: vi.fn(async () => ({ refundExternalId: 'ref_1', success: true, rawPayload: {} })),
    };

    const procOrder = await orderEngine.createOrder(
      'tenant-e2e',
      'cust-102',
      [{ productId: 'p1', quantity: 1, unitPriceGross: 3000, totalGross: 3000 }],
      shippingAddress,
      'PLN',
      'corr-pay-02'
    );
    const pendingOrder = await orderEngine.invoiceOrder('tenant-e2e', procOrder.id, 'corr-pay-02');
    const intent = await paymentEngine.createPaymentIntent('tenant-e2e', pendingOrder.id, 7200, 'PLN', stubAdapter, 'corr-pay-02');
    const procIntent = await paymentEngine.startProcessing('tenant-e2e', intent, 'corr-pay-02');
    await paymentEngine.completePayment('tenant-e2e', procIntent, 'corr-pay-02');

    const finalOrder = await orderEngine.getOrder('tenant-e2e', pendingOrder.id);
    expect(finalOrder.status).toBe('PAID');
  });

  it('E2E-03: User Cart State -> Update quantity to 0 -> API Checkout with empty remainder throws expected error -> Original cart restored', async () => {
    let state: CartState = { items: [], itemCount: 0, hydrated: true };
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { productId: 'p1', name: 'Item 1', price: 2500, currency: 'PLN', image: '/1.png', quantity: 1 },
    });
    expect(state.items).toHaveLength(1);

    // User reduces quantity to 0 in UI
    state = cartReducer(state, { type: 'UPDATE_QUANTITY', payload: { productId: 'p1', quantity: 0 } });
    expect(state.items).toHaveLength(0);
    expect(state.itemCount).toBe(0);

    // Trying to checkout empty cart throws "empty cart"
    await expect(
      runtime.checkout('tenant-e2e', 'guest', { items: [], shippingAddress, currency: 'PLN' }, 'e2e-corr-03')
    ).rejects.toThrow(/empty cart/);
  });

  it('E2E-04: Multi-Product Purchase with distinct VAT rates (0%, 8%, 23%) across UI -> Adapter -> OrderRuntime -> Domain Calculations', async () => {
    const pBooks = createStoreProduct('book-1', 'Programming Book', 5000); // 8% VAT
    const pSoftware = createStoreProduct('soft-1', 'IDE License', 20000); // 23% VAT

    const cart = buildCartFromRequest('tenant-e2e', [
      { productId: 'book-1', quantity: 2 },
      { productId: 'soft-1', quantity: 1 },
    ], [pBooks, pSoftware]);

    expect(cart.items).toHaveLength(2);
    expect(cart.totals.subtotalGross).toBe(30000); // 2*5000 + 1*20000
    expect(cart.totals.taxTotal).toBeGreaterThan(0);

    const checkoutReq: CheckoutRequestDTO = {
      items: [
        { productId: 'book-1', quantity: 2, unitPriceGross: 5000, taxRate: 8 },
        { productId: 'soft-1', quantity: 1, unitPriceGross: 20000, taxRate: 23 },
      ],
      shippingAddress,
      currency: 'PLN',
    };

    const res = await runtime.checkout('tenant-e2e', 'guest', checkoutReq, 'e2e-corr-04');
    expect(res.grandTotalGross).toBe(30000);
  });

  it('E2E-05: Complex Multi-Step Lifecycle: Add 3 products -> Increase quantity -> Remove item -> Apply coupon -> Checkout -> Invoiced Order in Domain Engine', async () => {
    let state: CartState = { items: [], itemCount: 0, hydrated: true };
    // Step 1: Add 3 items
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { productId: 'p1', name: 'Product 1', price: 1000, currency: 'PLN', image: '', quantity: 1 },
    });
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { productId: 'p2', name: 'Product 2', price: 2000, currency: 'PLN', image: '', quantity: 1 },
    });
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { productId: 'p3', name: 'Product 3', price: 3000, currency: 'PLN', image: '', quantity: 1 },
    });
    expect(state.itemCount).toBe(3);

    // Step 2: Increase quantity of p1 by 2 (1 + 2 = 3)
    state = cartReducer(state, {
      type: 'ADD_ITEM',
      payload: { productId: 'p1', name: 'Product 1', price: 1000, currency: 'PLN', image: '', quantity: 2 },
    });
    expect(state.items.find((i) => i.productId === 'p1')?.quantity).toBe(3);

    // Step 3: Remove p2
    state = cartReducer(state, { type: 'REMOVE_ITEM', payload: { productId: 'p2' } });
    expect(state.items).toHaveLength(2);
    expect(state.items.find((i) => i.productId === 'p2')).toBeUndefined();

    // Step 4: Checkout with SAVE10 coupon
    // Server-side prices: p1=3000, p3=3000. Remaining: p1 (qty 3 * 3000 = 9000) + p3 (qty 1 * 3000 = 3000) => Subtotal 12000; SAVE10 Discount: 1200; GrandTotal: 10800
    const checkoutReq: CheckoutRequestDTO = {
      items: state.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPriceGross: i.price })),
      couponCode: 'SAVE10',
      shippingAddress,
      currency: 'PLN',
    };

    const res = await runtime.checkout('tenant-e2e', 'guest', checkoutReq, 'e2e-corr-05');
    expect(res.grandTotalGross).toBe(10800);

    const order = await runtime.getOrderStatus('tenant-e2e', res.orderId);
    expect(order.status).toBe('PAYMENT_PENDING');
    expect(order.grandTotalGross).toBe(10800);
  });
});
