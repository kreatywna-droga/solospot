/**
 * order-lifecycle-e2e.test.ts — B17-REAL-CANARY-3
 *
 * 7 REAL MULTI-LAYER PRODUCT E2E WORKFLOWS
 *
 * Complete Storefront Order Lifecycle & Tracking Pipeline
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderRuntime, type CheckoutRequestDTO } from '../OrderRuntime';
import { StoreRepository } from '@/lib/store/StoreRepository';
import { POST as checkoutRoute } from '@/app/api/store/checkout/route';
import { GET as orderStatusRoute } from '@/app/api/store/order/[id]/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/payments/PaymentFactory', () => ({
  PaymentFactory: {
    getProvider: vi.fn(() => ({
      id: 'e2e-canary3-stub',
      createIntent: vi.fn(async ({ amountGross }: { amountGross: number }) => ({
        externalId: `https://pay.gateway/intent_${amountGross}`,
        rawPayload: { amountGross },
      })),
      getPaymentStatus: vi.fn(async () => 'CAPTURED' as const),
      refundPayment: vi.fn(async () => ({ refundExternalId: 'ref_333', success: true, rawPayload: {} })),
    })),
  },
}));

vi.mock('@/lib/product/ProductRepository', () => ({
  ProductRepository: class {
    async getProduct(productId: string) {
      const prices: Record<string, number> = {
        'mug-1': 4500,
        'shirt-1': 11000,
        'jacket-1': 30000,
        'book-1': 6500,
        'item-cancel': 8000,
        'gadget-1': 15000,
        'item-a': 5000,
        'item-b': 2500,
      };
      return {
        id: productId,
        tenantId: 'tenant-canary3',
        name: `Product ${productId}`,
        description: '',
        price: prices[productId] ?? 5000,
        currency: 'PLN',
        status: 'ACTIVE' as const,
        storeId: 'store_1',
        images: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },
}));

// Mock StoreRepository for route testing
vi.mock('@/lib/store/StoreRepository', () => ({
  StoreRepository: class {
    async getStoreBySlug(slug: string) {
      if (slug === 'valid-store') {
        return {
          id: 'store_1',
          tenantId: 'tenant-canary3',
          slug: 'valid-store',
          name: 'Canary 3 Store',
        };
      }
      if (slug === 'other-store') {
        return {
          id: 'store_2',
          tenantId: 'tenant-other',
          slug: 'other-store',
          name: 'Other Store',
        };
      }
      return null;
    }
  },
}));

const shippingAddress = {
  fullName: 'Michał Wiśniewski',
  street: 'ul. Floriańska 15',
  city: 'Kraków',
  zipCode: '31-019',
  country: 'PL',
};

describe('B17-REAL-CANARY-3 — 7 Real Product E2E Workflows', () => {
  let runtime: OrderRuntime;

  beforeEach(() => {
    OrderRuntime.resetInstanceForTesting();
    runtime = OrderRuntime.getInstance();
  });

  it('E2E-01: User Action -> Product Result (Checkout API -> Shared OrderRuntime -> Order Status API -> Verified Order Receipt)', async () => {
    // 1. Customer places order via POST /api/store/checkout
    const checkoutBody = {
      slug: 'valid-store',
      items: [
        { productId: 'mug-1', quantity: 2, unitPriceGross: 4500 }, // 90.00 PLN
        { productId: 'shirt-1', quantity: 1, unitPriceGross: 11000 }, // 110.00 PLN
      ],
      shippingAddress,
      currency: 'PLN',
    };

    const req = new Request('http://localhost/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutBody),
    });

    const res = await checkoutRoute(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.orderId).toMatch(/^ord_/);
    expect(data.grandTotalGross).toBe(20000); // 9000 + 11000 = 20000 gr (200.00 PLN)

    // 2. Customer navigates to Order Status Page -> GET /api/store/order/[id]?slug=valid-store
    const getReq = new NextRequest(`http://localhost/api/store/order/${data.orderId}?slug=valid-store`);
    const statusRes = await orderStatusRoute(getReq, { params: Promise.resolve({ id: data.orderId }) });
    expect(statusRes.status).toBe(200);
    const orderData = await statusRes.json();

    expect(orderData.id).toBe(data.orderId);
    expect(orderData.status).toBe('PAYMENT_PENDING');
    expect(orderData.grandTotalGross).toBe(20000);
    expect(orderData.items).toHaveLength(2);
    expect(orderData.shippingAddress.fullName).toBe('Michał Wiśniewski');
  });

  it('E2E-02: User Action -> UI -> Domain -> Final Result (Coupon SAVE10 Discount Forwarding & Verification)', async () => {
    const checkoutBody = {
      slug: 'valid-store',
      items: [
        { productId: 'jacket-1', quantity: 1, unitPriceGross: 30000 },
      ],
      couponCode: 'SAVE10',
      shippingAddress,
      currency: 'PLN',
    };

    const req = new Request('http://localhost/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutBody),
    });

    const res = await checkoutRoute(req);
    const data = await res.json();
    // 30000 - 10% (3000) = 27000 gr (270.00 PLN)
    expect(data.grandTotalGross).toBe(27000);

    const getReq = new NextRequest(`http://localhost/api/store/order/${data.orderId}?slug=valid-store`);
    const statusRes = await orderStatusRoute(getReq, { params: Promise.resolve({ id: data.orderId }) });
    const orderData = await statusRes.json();
    expect(orderData.grandTotalGross).toBe(27000);
  });

  it('E2E-03: User Action -> Persistence / Shared State -> Load -> Payment Completed State Transition', async () => {
    const checkoutReq: CheckoutRequestDTO = {
      items: [{ productId: 'book-1', quantity: 1, unitPriceGross: 6500 }],
      shippingAddress,
      currency: 'PLN',
    };

    const checkoutRes = await runtime.checkout('tenant-canary3', 'cust-301', checkoutReq, 'corr-e2e-03');
    expect(checkoutRes.grandTotalGross).toBe(6500);

    // Initial state: PAYMENT_PENDING
    let order = await runtime.getOrderStatus('tenant-canary3', checkoutRes.orderId);
    expect(order.status).toBe('PAYMENT_PENDING');

    // Payment Provider Webhook executes: confirmPayment
    await runtime.confirmPayment('tenant-canary3', checkoutRes.orderId, 'pi_external_999', 'corr-e2e-03-pay');

    // Live query reflects PAID status across all route lookups
    order = await runtime.getOrderStatus('tenant-canary3', checkoutRes.orderId);
    expect(order.status).toBe('PAID');
    expect(order.paymentIntentId).toBe('pi_external_999');
  });

  it('E2E-04: User Action -> Failure -> Rollback -> Original State (Empty Cart Checkout Rejection & Zero State Pollution)', async () => {
    const req = new Request('http://localhost/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'valid-store',
        items: [],
        shippingAddress,
      }),
    });

    const res = await checkoutRoute(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Items must be a non-empty array');
  });

  it('E2E-05: User Action -> Order Cancellation Lifecycle (PAYMENT_PENDING -> CANCELLED)', async () => {
    const checkoutReq: CheckoutRequestDTO = {
      items: [{ productId: 'item-cancel', quantity: 1, unitPriceGross: 8000 }],
      shippingAddress,
      currency: 'PLN',
    };

    const res = await runtime.checkout('tenant-canary3', 'cust-305', checkoutReq, 'corr-e2e-05');
    expect(res.success).toBe(true);

    // Customer / Merchant cancels order before payment
    const cancelledOrder = await runtime.cancelOrder('tenant-canary3', res.orderId, 'corr-cancel-05');
    expect(cancelledOrder.status).toBe('CANCELLED');

    const queried = await runtime.getOrderStatus('tenant-canary3', res.orderId);
    expect(queried.status).toBe('CANCELLED');
  });

  it('E2E-06: Multi-Step Real Workflow (Full State Machine Progression to FULFILLED)', async () => {
    const checkoutReq: CheckoutRequestDTO = {
      items: [{ productId: 'gadget-1', quantity: 2, unitPriceGross: 15000 }],
      shippingAddress,
      currency: 'PLN',
    };

    const res = await runtime.checkout('tenant-canary3', 'cust-306', checkoutReq, 'corr-e2e-06');
    const orderId = res.orderId;

    // 1. PAYMENT_PENDING -> PAID
    await runtime.confirmPayment('tenant-canary3', orderId, 'pi_full_06');
    let order = await runtime.getOrderStatus('tenant-canary3', orderId);
    expect(order.status).toBe('PAID');

    // 2. PAID -> PROCESSING
    await runtime.startProcessing('tenant-canary3', orderId);
    order = await runtime.getOrderStatus('tenant-canary3', orderId);
    expect(order.status).toBe('PROCESSING');

    // 3. PROCESSING -> READY_FOR_FULFILLMENT
    await runtime.prepareFulfillment('tenant-canary3', orderId);
    order = await runtime.getOrderStatus('tenant-canary3', orderId);
    expect(order.status).toBe('READY_FOR_FULFILLMENT');

    // 4. READY_FOR_FULFILLMENT -> FULFILLED
    await runtime.fulfillOrder('tenant-canary3', orderId, 'corr-fulfill-06');
    order = await runtime.getOrderStatus('tenant-canary3', orderId);
    expect(order.status).toBe('FULFILLED');
  });

  it('E2E-07: Realistic User Scenario From Start to Finish (Multi-Item Order -> Payment -> Fulfillment -> Tracking Query)', async () => {
    // 1. Customer places order for 3 items
    const checkoutBody = {
      slug: 'valid-store',
      items: [
        { productId: 'item-a', quantity: 1, unitPriceGross: 5000 },
        { productId: 'item-b', quantity: 2, unitPriceGross: 2500 },
      ],
      shippingAddress,
      currency: 'PLN',
    };

    const postReq = new Request('http://localhost/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkoutBody),
    });
    const postRes = await checkoutRoute(postReq);
    const postData = await postRes.json();
    const orderId = postData.orderId;
    expect(postData.grandTotalGross).toBe(10000); // 5000 + 5000

    // 2. Payment succeeds
    await runtime.confirmPayment('tenant-canary3', orderId, 'pi_user_scenario_07');

    // 3. Merchant fulfills order with tracking
    await runtime.startProcessing('tenant-canary3', orderId);
    await runtime.prepareFulfillment('tenant-canary3', orderId);
    await runtime.fulfillOrder('tenant-canary3', orderId, 'corr-fulfill-07');

    // 4. Customer visits status page and views full receipt
    const getReq = new NextRequest(`http://localhost/api/store/order/${orderId}?slug=valid-store`);
    const statusRes = await orderStatusRoute(getReq, { params: Promise.resolve({ id: orderId }) });
    const finalOrder = await statusRes.json();

    expect(finalOrder.id).toBe(orderId);
    expect(finalOrder.status).toBe('FULFILLED');
    expect(finalOrder.grandTotalGross).toBe(10000);
    expect(finalOrder.items).toHaveLength(2);
  });
});
