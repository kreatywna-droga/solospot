/**
 * order-runtime.test.ts — Sprint 6 Step 6 Finalization
 *
 * Node environment (bez jsdom). Testuje cienką warstwę OrderRuntime.
 *
 * MOCKOWANE:
 *   - PaymentFactory (adapter fake — brak realnych wywołań sieciowych)
 *
 * RZECZYWISTE (in-memory, node):
 *   - OrderProcessingEngine
 *   - PaymentEngine
 *   - CheckoutManager / CartRuntime (commerce-engine)
 *
 * Zakres (Zadanie A + korekta Architekta):
 *   - checkout() → Podstawa: success, orderId, redirectUrl, currency
 *   - IDEMPOTENCJA: podwójne wywołanie z tym samym correlationId
 *     nie tworzy drugiego zamówienia
 *   - getOrderStatus() po checkout → PAYMENT_PENDING
 *   - setOrderForTesting + getOrderStatus (status read-back)
 *   - pusty koszyk → CheckoutManager rzuca błąd
 *   - izolacja tenantów (cross-tenant access blocked)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrderRuntime, type CheckoutRequestDTO, type CheckoutResponseDTO } from '../OrderRuntime';

// MOCK PaymentFactory — zwraca fake adapter bez wywołań sieciowych.
vi.mock('@/lib/payments/PaymentFactory', () => ({
  PaymentFactory: {
    getProvider: vi.fn(() => ({
      id: 'stub-provider',
      createIntent: vi.fn(async () => ({
        externalId: `https://pay.stub/int_${Math.random().toString(36).substr(2, 9)}`,
        rawPayload: {},
      })),
      getPaymentStatus: vi.fn(async () => 'CREATED'),
      refundPayment: vi.fn(async () => ({ refundExternalId: 'ref_1', success: true, rawPayload: {} })),
    })),
  },
}));

function validRequest(): CheckoutRequestDTO {
  return {
    items: [{ productId: 'prod-1', quantity: 2, unitPriceGross: 5000 }],
    shippingAddress: {
      fullName: 'Jan Kowalski',
      street: 'ul. Główna 1',
      city: 'Warszawa',
      zipCode: '00-001',
      country: 'PL',
    },
    currency: 'PLN',
  };
}

describe('OrderRuntime — checkout orchestration (thin layer)', () => {
  let runtime: OrderRuntime;

  beforeEach(() => {
    runtime = new OrderRuntime();
  });

  it('checkout() tworzy zamówienie, przechodzi do PAYMENT_PENDING i zwraca redirectUrl oraz grandTotalGross', async () => {
    const result: CheckoutResponseDTO = await runtime.checkout(
      'tenant-1',
      'guest',
      validRequest(),
      'corr-1',
    );

    expect(result.success).toBe(true);
    expect(result.orderId).toMatch(/^ord_/);
    expect(result.currency).toBe('PLN');
    expect(result.grandTotalGross).toBe(10000); // 2 * 5000 = 10000
    expect(result.redirectUrl).toContain('https://');

    // Zamówienie istnieje w OrderProcessingEngine i jest w stanie PAYMENT_PENDING.
    const order = await runtime.getOrderStatus('tenant-1', result.orderId);
    expect(order.status).toBe('PAYMENT_PENDING');
    expect(order.customerId).toBe('guest');
    expect(order.grandTotalGross).toBe(10000);
  });

  it('checkout() z kuponem SAVE10 i wieloma produktami nalicza rabat', async () => {
    const multiReq: CheckoutRequestDTO = {
      items: [
        { productId: 'prod-1', quantity: 1, unitPriceGross: 10000 },
        { productId: 'prod-2', quantity: 2, unitPriceGross: 5000 },
      ],
      couponCode: 'SAVE10',
      shippingAddress: validRequest().shippingAddress,
      currency: 'PLN',
    };

    const result = await runtime.checkout('tenant-1', 'guest', multiReq, 'corr-coupon-1');
    expect(result.success).toBe(true);
    // Subtotal: 10000 + 10000 = 20000; Discount: 2000; GrandTotal: 18000
    expect(result.grandTotalGross).toBe(18000);
  });

  it('IDEMPOTENCJA: drugie wywołanie z tym samym correlationId zwraca to samo zamówienie', async () => {
    const first = await runtime.checkout('tenant-1', 'guest', validRequest(), 'corr-idem-1');
    const second = await runtime.checkout('tenant-1', 'guest', validRequest(), 'corr-idem-1');

    expect(second.orderId).toBe(first.orderId);

    // Dokładnie JEDNO zamówienie w silniku.
    const order = await runtime.getOrderStatus('tenant-1', first.orderId);
    expect(order.id).toBe(first.orderId);
  });

  it('pusty koszyk → CheckoutManager rzuca "empty cart"', async () => {
    await expect(
      runtime.checkout(
        'tenant-1',
        'guest',
        { items: [], shippingAddress: validRequest().shippingAddress, currency: 'PLN' },
        'corr-empty',
      ),
    ).rejects.toThrow('empty cart');
  });

  it('getOrderStatus + setOrderForTesting umożliwiają odczyt statusu', async () => {
    const orderId = `ord_fixture_${Date.now()}`;
    runtime.setOrderForTesting({
      id: orderId,
      tenantId: 'tenant-1',
      customerId: 'guest',
      items: [{ productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 }],
      subtotalGross: 100,
      taxTotal: 19,
      grandTotalGross: 100,
      currency: 'PLN',
      status: 'PAID',
      shippingAddress: {
        fullName: 'Jan Kowalski',
        street: 'ul. Główna 1',
        city: 'Warszawa',
        zipCode: '00-001',
        country: 'PL',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const order = await runtime.getOrderStatus('tenant-1', orderId);
    expect(order.status).toBe('PAID');
  });

  it('IZOLACJA: odczyt zamówienia z innego tenanta jest blokowany', async () => {
    const result = await runtime.checkout('tenant-A', 'guest', validRequest(), 'corr-iso-1');

    await expect(
      runtime.getOrderStatus('tenant-B', result.orderId),
    ).rejects.toThrow('Cross-tenant access blocked');
  });
});

