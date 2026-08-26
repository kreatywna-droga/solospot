/**
 * checkout-route.test.ts — Sprint 6 Step 6 Finalization
 *
 * Node environment (bez jsdom). Testuje POST /api/store/checkout.
 *
 * MOCKOWANE:
 *   - StoreRepository (getStoreBySlug) — brak zapytań do Supabase
 *   - OrderRuntime (checkout) — brak realnej orkiestracji
 *
 * Zakres (Zadanie A + korekta Architekta):
 *   - 200 poprawny request → wynik checkout
 *   - 400 brak slug
 *   - 400 items nie jest niepustą tablicą
 *   - 400 brak wymaganych pól adresu
 *   - 404 sklep nie istnieje
 *   - 500 błąd wewnętrzny (OrderRuntime rzuca)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST } from '../route';
import { StoreRepository } from '@/lib/store/StoreRepository';
import { OrderRuntime } from '@/lib/order/OrderRuntime';

const { mockGetStoreBySlug, mockCheckout } = vi.hoisted(() => ({
  mockGetStoreBySlug: vi.fn(),
  mockCheckout: vi.fn(),
}));

vi.mock('@/lib/store/StoreRepository', () => ({
  StoreRepository: class {
    getStoreBySlug = mockGetStoreBySlug;
  },
}));

vi.mock('@/lib/order/OrderRuntime', () => ({
  OrderRuntime: class {
    checkout = mockCheckout;
  },
}));

function jsonRequest(body: unknown): Request {
  return new Request('http://localhost/api/store/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function validBody(): Record<string, unknown> {
  return {
    slug: 'my-store',
    items: [{ productId: 'prod-1', quantity: 1 }],
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

describe('POST /api/store/checkout (route handler)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoreBySlug.mockReset();
    mockCheckout.mockReset();
    mockGetStoreBySlug.mockResolvedValue({ tenantId: 'tenant-1', id: 'store-1' });
    mockCheckout.mockResolvedValue({
      success: true,
      orderId: 'ord_123',
      redirectUrl: '/store/order/success',
      grandTotalGross: 100,
      currency: 'PLN',
    });
  });

  it('200 — poprawny request deleguje do OrderRuntime i zwraca wynik', async () => {
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.orderId).toBe('ord_123');
    expect(mockCheckout).toHaveBeenCalledWith(
      'tenant-1',
      'guest',
      expect.objectContaining({
        items: [{ productId: 'prod-1', quantity: 1 }],
        currency: 'PLN',
      }),
    );
  });

  it('400 — brak lub nieprawidłowy slug', async () => {
    const res = await POST(jsonRequest({ ...validBody(), slug: undefined }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('slug') });
  });

  it('400 — items nie jest niepustą tablicą', async () => {
    const res = await POST(jsonRequest({ ...validBody(), items: [] }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('Items') });
  });

  it('400 — brak wymaganych pól adresu dostawy', async () => {
    const body = validBody();
    (body as { shippingAddress: Record<string, unknown> }).shippingAddress = {
      fullName: 'Jan Kowalski',
    };
    const res = await POST(jsonRequest(body));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('shipping address') });
  });

  it('404 — sklep nie istnieje', async () => {
    mockGetStoreBySlug.mockResolvedValue(null);
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('Store not found') });
  });

  it('500 — błąd wewnętrzny gdy OrderRuntime rzuca wyjątek', async () => {
    mockCheckout.mockRejectedValue(new Error('Payment provider unavailable'));
    const res = await POST(jsonRequest(validBody()));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'Internal Server Error' });
  });
});

