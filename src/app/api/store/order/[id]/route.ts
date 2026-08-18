/**
 * GET /api/store/order/[id] — Sprint 7 Recovery (P4)
 *
 * Server-side order status lookup. Removes the client-side `OrderRuntime`
 * dependency from the storefront order page (architectural debt from
 * Sprint 6 Step 6 — see SPRINT_7_MASTER_PLAN §2.1.E).
 *
 * WYŁĄCZNIE orkiestracja (ZERO logiki biznesowej w Route Handlerze):
 *   Request (slug + orderId)
 *   ↓
 *   StoreRepository.getStoreBySlug() → tenantId
 *   ↓
 *   OrderRuntime.getOrderStatus(tenantId, orderId)
 *     → OrderProcessingEngine.getOrder() (tenant isolation enforced)
 *   ↓
 *   Response
 *
 * Status semantics:
 *   - 400 — brak / nieprawidłowy slug lub orderId
 *   - 404 — sklep nie istnieje
 *   - 404 — zamówienie nie istnieje (OrderProcessingEngine rzuca "Order not found")
 *   - 404 — cross-tenant access (TenantSecurityException) — zwracane jako 404,
 *           aby nie ujawniać istnienia zamówienia w innym tenancie
 *   - 500 — błąd wewnętrzny
 */

import { NextRequest, NextResponse } from 'next/server';
import { StoreRepository } from '@/lib/store/StoreRepository';
import { OrderRuntime } from '@/lib/order/OrderRuntime';

export const dynamic = 'force-dynamic';

/**
 * GET /api/store/order/[id]?slug=<storeSlug>
 *
 * Query params:
 *   slug: string — slug sklepu (do wyznaczenia tenantId)
 * Path param:
 *   id: string — identyfikator zamówienia
 *
 * Response:
 *   200 — ProcessedOrder (serwerowy, bez klientowego OrderRuntime)
 *   400 | 404 | 500 — zgodnie z semantyką powyżej
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id: orderId } = await params;
    const url = new URL(req.url);
    const slug = url.searchParams.get('slug');

    // Walidacja wejścia
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid order id' },
        { status: 400 },
      );
    }
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid slug' },
        { status: 400 },
      );
    }

    // 1. Pobierz store → tenantId (tylko to, co potrzebne do orkiestracji)
    const storeRepo = new StoreRepository();
    const store = await storeRepo.getStoreBySlug(slug);
    if (!store) {
      return NextResponse.json(
        { error: `Store not found: ${slug}` },
        { status: 404 },
      );
    }

    // 2. Pobierz status zamówienia przez OrderRuntime (cienki wrapper delegujący
    //    do OrderProcessingEngine.getOrder — izolacja tenantów po stronie silnika).
    const runtime = typeof OrderRuntime.getInstance === 'function'
      ? OrderRuntime.getInstance()
      : new OrderRuntime();
    const order = await runtime.getOrderStatus(store.tenantId, orderId);

    return NextResponse.json(order, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('GET /api/store/order error:', message);

    // Zamówienie nie istnieje → 404 (nie zdradzamy szczegółów).
    if (message.startsWith('Order not found')) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 },
      );
    }

    // Cross-tenant access → 404 (nie ujawniamy istnienia zamówienia w innym tenancie).
    if (message.includes('Cross-tenant access blocked')) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
