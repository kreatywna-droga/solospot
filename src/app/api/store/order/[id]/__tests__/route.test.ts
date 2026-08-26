/**
 * order route.test.ts — Sprint 7 Recovery (P4)
 *
 * Node environment (bez jsdom). Testuje GET /api/store/order/[id].
 *
 * MOCKOWANE:
 *   - StoreRepository (getStoreBySlug) — brak zapytań do Supabase
 *   - OrderRuntime (getOrderStatus) — brak realnej orkiestracji
 *
 * Zakres (P4):
 *   - 200 poprawny tenant → zwraca zamówienie
 *   - 400 brak / nieprawidłowy slug
 *   - 400 brak / nieprawidłowy order id
 *   - 404 sklep nie istnieje
 *   - 404 zamówienie nie istnieje (OrderProcessingEngine rzuca "Order not found")
 *   - 404 cross-tenant access (TenantSecurityException) — maskowane jako 404
 *   - 500 błąd wewnętrzny
 *   - statyczne sprawdzenie, że żaden plik 'use client' nie importuje OrderRuntime
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { GET } from '../route';
import { StoreRepository } from '@/lib/store/StoreRepository';
import { OrderRuntime } from '@/lib/order/OrderRuntime';

const { mockGetStoreBySlug, mockGetOrderStatus } = vi.hoisted(() => ({
  mockGetStoreBySlug: vi.fn(),
  mockGetOrderStatus: vi.fn(),
}));

vi.mock('@/lib/store/StoreRepository', () => ({
  StoreRepository: class {
    getStoreBySlug = mockGetStoreBySlug;
  },
}));

vi.mock('@/lib/order/OrderRuntime', () => ({
  OrderRuntime: class {
    getOrderStatus = mockGetOrderStatus;
  },
}));

function makeOrder(overrides: Partial<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    id: 'ord_123',
    tenantId: 'tenant-1',
    customerId: 'guest',
    items: [{ productId: 'prod-1', quantity: 1, unitPriceGross: 100, totalGross: 100 }],
    subtotalGross: 100,
    taxTotal: 0,
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
    createdAt: '2026-08-02T00:00:00.000Z',
    updatedAt: '2026-08-02T00:00:00.000Z',
    ...overrides,
  };
}

function getRequest(orderId: string, slug?: string): NextRequest {
  const url = `http://localhost/api/store/order/${orderId}${slug ? `?slug=${encodeURIComponent(slug)}` : ''}`;
  return new NextRequest(url, { method: 'GET' });
}

describe('GET /api/store/order/[id] (route handler)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStoreBySlug.mockReset();
    mockGetOrderStatus.mockReset();
    mockGetStoreBySlug.mockResolvedValue({ tenantId: 'tenant-1', id: 'store-1' });
    mockGetOrderStatus.mockResolvedValue(makeOrder());
  });

  it('200 — poprawny tenant deleguje do OrderRuntime i zwraca zamówienie', async () => {
    const res = await GET(getRequest('ord_123', 'my-store'), { params: Promise.resolve({ id: 'ord_123' }) });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.id).toBe('ord_123');
    expect(body.status).toBe('PAID');
    expect(mockGetStoreBySlug).toHaveBeenCalledWith('my-store');
    expect(mockGetOrderStatus).toHaveBeenCalledWith('tenant-1', 'ord_123');
  });

  it('400 — brak slug', async () => {
    const res = await GET(getRequest('ord_123'), { params: Promise.resolve({ id: 'ord_123' }) });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('slug') });
  });

  it('400 — brak order id', async () => {
    const res = await GET(getRequest('ord_123', 'my-store'), { params: Promise.resolve({ id: '' }) });
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('order') });
  });

  it('404 — sklep nie istnieje', async () => {
    mockGetStoreBySlug.mockResolvedValue(null);
    const res = await GET(getRequest('ord_123', 'missing-store'), { params: Promise.resolve({ id: 'ord_123' }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: expect.stringContaining('Store not found') });
  });

  it('404 — zamówienie nie istnieje', async () => {
    mockGetOrderStatus.mockRejectedValue(new Error('Order not found: ord_999'));
    const res = await GET(getRequest('ord_999', 'my-store'), { params: Promise.resolve({ id: 'ord_999' }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'Order not found' });
  });

  it('404 — cross-tenant access jest maskowane (nie ujawnia istnienia zamówienia)', async () => {
    mockGetOrderStatus.mockRejectedValue(
      new Error('Cross-tenant access blocked during order processing: Get order details. Active: tenant-2, Target: tenant-1')
    );
    const res = await GET(getRequest('ord_123', 'other-store'), { params: Promise.resolve({ id: 'ord_123' }) });
    expect(res.status).toBe(404);
    expect(await res.json()).toMatchObject({ error: 'Order not found' });
  });

  it('500 — błąd wewnętrzny', async () => {
    mockGetOrderStatus.mockRejectedValue(new Error('Unexpected infra failure'));
    const res = await GET(getRequest('ord_123', 'my-store'), { params: Promise.resolve({ id: 'ord_123' }) });
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: 'Internal Server Error' });
  });
});

describe('statyczna kontrola — brak importu OrderRuntime w plikach use client', () => {
const srcRoot = path.resolve(__dirname, '../../../../../../');
  const orderPage = path.join(srcRoot, 'app/store/[slug]/order/[id]/page.tsx');

  it('order/[id]/page.tsx nie importuje OrderRuntime', () => {
    const content = fs.readFileSync(orderPage, 'utf8');
    expect(content).toContain("'use client'");
    expect(content).not.toMatch(/from\s+['"]@\/lib\/order\/OrderRuntime['"]/);
    expect(content).not.toContain('new OrderRuntime');
  });
});
