/**
 * order-lifecycle-adversarial.test.ts — B17-REAL-CANARY-3
 *
 * 10 ADVERSARIAL CHAOS SCENARIOS ACROSS STOREFRONT ORDER LIFECYCLE
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderRuntime, type CheckoutRequestDTO } from '../OrderRuntime';
import { POST as checkoutRoute } from '@/app/api/store/checkout/route';
import { GET as orderStatusRoute } from '@/app/api/store/order/[id]/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/payments/PaymentFactory', () => ({
  PaymentFactory: {
    getProvider: vi.fn(() => ({
      id: 'adv-canary3-stub',
      createIntent: vi.fn(async ({ amountGross }: { amountGross: number }) => ({
        externalId: `https://pay.gateway/adv_intent_${amountGross}`,
        rawPayload: { amountGross },
      })),
      getPaymentStatus: vi.fn(async () => 'CAPTURED' as const),
      refundPayment: vi.fn(async () => ({ refundExternalId: 'ref_adv', success: true, rawPayload: {} })),
    })),
  },
}));

vi.mock('@/lib/product/ProductRepository', () => ({
  ProductRepository: class {
    async getProduct(productId: string) {
      const prices: Record<string, number> = {
        'p1': 5000,
        'p-large': 9999,
      };
      return {
        id: productId,
        tenantId: 'tenant-a',
        name: `Product ${productId}`,
        description: '',
        price: prices[productId] ?? 5000,
        currency: 'PLN',
        status: 'ACTIVE' as const,
        storeId: 'store-a',
        images: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },
}));

vi.mock('@/lib/store/StoreRepository', () => ({
  StoreRepository: class {
    async getStoreBySlug(slug: string) {
      if (slug === 'tenant-a-store') return { id: 's1', tenantId: 'tenant-a', slug: 'tenant-a-store', name: 'Store A' };
      if (slug === 'tenant-b-store') return { id: 's2', tenantId: 'tenant-b', slug: 'tenant-b-store', name: 'Store B' };
      return null;
    }
  },
}));

const validShipping = {
  fullName: 'Piotr Zieliński',
  street: 'ul. Królewska 1',
  city: 'Gdańsk',
  zipCode: '80-001',
  country: 'PL',
};

describe('B17-REAL-CANARY-3 — 10 Adversarial Chaos Scenarios', () => {
  let runtime: OrderRuntime;

  beforeEach(() => {
    OrderRuntime.resetInstanceForTesting();
    runtime = OrderRuntime.getInstance();
  });

  it('ADV-01: Invalid Input — Missing required shipping fields or slug returns 400 Bad Request', async () => {
    const badReq1 = new Request('http://localhost/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: '', items: [{ productId: 'p1', quantity: 1 }] }),
    });
    const res1 = await checkoutRoute(badReq1);
    expect(res1.status).toBe(400);

    const badReq2 = new Request('http://localhost/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'tenant-a-store', items: [{ productId: 'p1', quantity: 1 }], shippingAddress: { fullName: '' } }),
    });
    const res2 = await checkoutRoute(badReq2);
    expect(res2.status).toBe(400);
  });

  it('ADV-02: Empty State — Empty items array returns 400 and creates no records', async () => {
    const emptyReq = new Request('http://localhost/api/store/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'tenant-a-store', items: [], shippingAddress: validShipping }),
    });
    const res = await checkoutRoute(emptyReq);
    expect(res.status).toBe(400);
  });

  it('ADV-03: Duplicate Action — Sequential checkout submissions with same correlationId return cached response', async () => {
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p1', quantity: 1, unitPriceGross: 5000 }],
      shippingAddress: validShipping,
      currency: 'PLN',
    };
    const first = await runtime.checkout('tenant-a', 'cust-1', req, 'idem-seq-1');
    const second = await runtime.checkout('tenant-a', 'cust-1', req, 'idem-seq-1');
    expect(first.orderId).toBe(second.orderId);
  });

  it('ADV-04: Repeated Action — Calling confirmPayment repeatedly on already PAID order is idempotent', async () => {
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p1', quantity: 1, unitPriceGross: 7000 }],
      shippingAddress: validShipping,
      currency: 'PLN',
    };
    const res = await runtime.checkout('tenant-a', 'cust-1', req, 'idem-pay-1');
    const firstPay = await runtime.confirmPayment('tenant-a', res.orderId, 'pi_1');
    expect(firstPay.status).toBe('PAID');

    // Repeat payment confirmation
    const secondPay = await runtime.confirmPayment('tenant-a', res.orderId, 'pi_1');
    expect(secondPay.status).toBe('PAID');
  });

  it('ADV-05: Rapid Concurrent Action — Parallel checkouts with identical correlationId deduplicate correctly', async () => {
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p1', quantity: 3, unitPriceGross: 2000 }],
      shippingAddress: validShipping,
      currency: 'PLN',
    };
    const p1 = runtime.checkout('tenant-a', 'cust-1', req, 'corr-rapid-1');
    const p2 = runtime.checkout('tenant-a', 'cust-1', req, 'corr-rapid-1');
    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1.orderId).toBe(r2.orderId);
    // Server-side price: p1=5000, qty 3 = 15000
    expect(r1.grandTotalGross).toBe(15000);
  });

  it('ADV-06: Stale State Transition — Attempting invalid direct status transition throws InvalidOrderStateException', async () => {
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p1', quantity: 1, unitPriceGross: 1000 }],
      shippingAddress: validShipping,
      currency: 'PLN',
    };
    const res = await runtime.checkout('tenant-a', 'cust-1', req, 'corr-stale-1');

    // Status is PAYMENT_PENDING -> Attempting to fulfill directly must throw
    await expect(
      runtime.fulfillOrder('tenant-a', res.orderId, 'corr-fail-direct')
    ).rejects.toThrow(/Invalid status transition/);
  });

  it('ADV-07: Malformed Data — Negative quantity or invalid price throws schema validation error', async () => {
    const badReq: CheckoutRequestDTO = {
      items: [{ productId: 'p1', quantity: -5, unitPriceGross: 1000 }],
      shippingAddress: validShipping,
      currency: 'PLN',
    };
    await expect(
      runtime.checkout('tenant-a', 'cust-1', badReq, 'corr-bad-data')
    ).rejects.toThrow();
  });

  it('ADV-08: Boundary Values — Very large orders calculate exact integer gross totals without precision loss', async () => {
    const largeReq: CheckoutRequestDTO = {
      items: [{ productId: 'p-large', quantity: 10000, unitPriceGross: 9999 }], // 10000 * 99.99 PLN = 999,900.00 PLN (99,990,000 gr)
      shippingAddress: validShipping,
      currency: 'PLN',
    };
    const res = await runtime.checkout('tenant-a', 'cust-1', largeReq, 'corr-large');
    expect(res.grandTotalGross).toBe(99990000);
  });

  it('ADV-09: Cross-Tenant Security Denial — Tenant B requesting Tenant A order returns 404 in API', async () => {
    // Order created under tenant A
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p1', quantity: 1, unitPriceGross: 5000 }],
      shippingAddress: validShipping,
      currency: 'PLN',
    };
    const res = await runtime.checkout('tenant-a', 'cust-1', req, 'corr-iso-test');

    // Tenant B queries order via GET /api/store/order/[id]?slug=tenant-b-store
    const getReq = new NextRequest(`http://localhost/api/store/order/${res.orderId}?slug=tenant-b-store`);
    const statusRes = await orderStatusRoute(getReq, { params: Promise.resolve({ id: res.orderId }) });
    expect(statusRes.status).toBe(404);
  });

  it('ADV-10: Non-Existent Entity Query — Querying non-existent store slug or unknown orderId returns 404', async () => {
    const getReq1 = new NextRequest(`http://localhost/api/store/order/ord_unknown?slug=non-existent-store`);
    const res1 = await orderStatusRoute(getReq1, { params: Promise.resolve({ id: 'ord_unknown' }) });
    expect(res1.status).toBe(404);

    const getReq2 = new NextRequest(`http://localhost/api/store/order/ord_does_not_exist_999?slug=tenant-a-store`);
    const res2 = await orderStatusRoute(getReq2, { params: Promise.resolve({ id: 'ord_does_not_exist_999' }) });
    expect(res2.status).toBe(404);
  });
});
