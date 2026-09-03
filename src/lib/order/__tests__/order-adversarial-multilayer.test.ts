/**
 * order-adversarial-multilayer.test.ts — B17-REAL-CANARY-2
 *
 * ADVERSARIAL & CHAOS TESTING ACROSS MULTI-LAYER COMMERCE STACK
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderRuntime, type CheckoutRequestDTO } from '../OrderRuntime';

vi.mock('@/lib/payments/PaymentFactory', () => ({
  PaymentFactory: {
    getProvider: vi.fn(() => ({
      id: 'adv-provider-stub',
      createIntent: vi.fn(async ({ amount }: { amount: number }) => ({
        externalId: `https://pay.gateway/adv_${amount}`,
        rawPayload: { amount },
      })),
      getPaymentStatus: vi.fn(async () => 'CREATED'),
      refundPayment: vi.fn(async () => ({ refundExternalId: 'ref_1', success: true, rawPayload: {} })),
    })),
  },
}));

vi.mock('@/lib/product/ProductRepository', () => ({
  ProductRepository: class {
    async getProduct(productId: string) {
      const prices: Record<string, number> = {
        'p1': 3000,
        'p-bulk': 1250,
        'p-free': 0,
      };
      return {
        id: productId,
        tenantId: 'tenant-adv',
        name: `Product ${productId}`,
        description: '',
        price: prices[productId] ?? 3000,
        currency: 'PLN',
        status: 'ACTIVE' as const,
        storeId: 'store-adv',
        images: [],
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  },
}));

const validShipping = {
  fullName: 'Jan Kowalski',
  street: 'ul. Prosta 1',
  city: 'Kraków',
  zipCode: '30-001',
  country: 'PL',
};

describe('B17-REAL-CANARY-2 — Multi-Layer Adversarial & Chaos Testing', () => {
  let runtime: OrderRuntime;

  beforeEach(() => {
    runtime = new OrderRuntime();
  });

  it('ADV-01: Rapid sequential checkouts with identical correlationId guarantee exact idempotency return', async () => {
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p1', quantity: 2, unitPriceGross: 3000 }],
      shippingAddress: validShipping,
      currency: 'PLN',
    };

    const call1 = runtime.checkout('tenant-adv', 'guest', req, 'idem-corr-99');
    const call2 = runtime.checkout('tenant-adv', 'guest', req, 'idem-corr-99');
    const call3 = runtime.checkout('tenant-adv', 'guest', req, 'idem-corr-99');

    const [res1, res2, res3] = await Promise.all([call1, call2, call3]);

    expect(res1.orderId).toBe(res2.orderId);
    expect(res2.orderId).toBe(res3.orderId);
    expect(res1.grandTotalGross).toBe(6000);
  });

  it('ADV-02: Tenant Isolation — Attempting to fetch order status using foreign tenantId is strictly rejected', async () => {
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p1', quantity: 1, unitPriceGross: 4500 }],
      shippingAddress: validShipping,
      currency: 'PLN',
    };

    const res = await runtime.checkout('tenant-alpha', 'cust-1', req, 'corr-iso-1');
    expect(res.success).toBe(true);

    // Tenant Beta tries to inspect Tenant Alpha's order
    await expect(
      runtime.getOrderStatus('tenant-beta', res.orderId)
    ).rejects.toThrow(/Cross-tenant access blocked/);
  });

  it('ADV-03: Empty item array throws validation error and prevents order/intent creation', async () => {
    const req: CheckoutRequestDTO = {
      items: [],
      shippingAddress: validShipping,
      currency: 'PLN',
    };

    await expect(
      runtime.checkout('tenant-adv', 'guest', req, 'corr-empty')
    ).rejects.toThrow(/empty cart/);
  });

  it('ADV-04: Large quantity order calculates exact integer totals without precision loss', async () => {
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p-bulk', quantity: 5000, unitPriceGross: 1250 }], // 5000 * 12.50 PLN = 62,500.00 PLN (6,250,000 gr)
      shippingAddress: validShipping,
      currency: 'PLN',
    };

    const res = await runtime.checkout('tenant-adv', 'guest', req, 'corr-bulk');
    expect(res.grandTotalGross).toBe(6250000);
  });

  it('ADV-05: Coupon code with zero-price items computes grandTotalGross = 0 safely without negative totals', async () => {
    const req: CheckoutRequestDTO = {
      items: [{ productId: 'p-free', quantity: 1, unitPriceGross: 0 }],
      couponCode: 'SAVE10',
      shippingAddress: validShipping,
      currency: 'PLN',
    };

    const res = await runtime.checkout('tenant-adv', 'guest', req, 'corr-free');
    expect(res.grandTotalGross).toBe(0);
  });

  it('ADV-06: Requesting order status for non-existent orderId throws clear not found error', async () => {
    await expect(
      runtime.getOrderStatus('tenant-adv', 'ord_non_existent_123')
    ).rejects.toThrow(/Order not found/);
  });
});
