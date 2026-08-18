/**
 * POST /api/store/checkout — Sprint 6 Step 6
 *
 * WYŁĄCZNIE orkiestracja (ZERO logiki biznesowej w Route Handlerze).
 *
 * Przepływ:
 *   Request
 *   ↓
 *   StoreRepository.getStoreBySlug() → tenantId
 *   ↓
 *   OrderRuntime.checkout()
 *     → CheckoutFlow.createOrder()
 *     → OrderProcessingEngine.createOrder()
 *     → OrderProcessingEngine.invoiceOrder()
 *     → PaymentEngine.createPaymentIntent()
 *     → PaymentFactory.getProvider()
 *   ↓
 *   Response
 *
 * Zgodnie z korektą 2: Route Handler nie zawiera logiki biznesowej.
 */

import { NextResponse } from 'next/server';
import { StoreRepository } from '@/lib/store/StoreRepository';
import { OrderRuntime, type CheckoutRequestDTO } from '@/lib/order/OrderRuntime';

export const dynamic = 'force-dynamic';

/**
 * POST /api/store/checkout
 *
 * Body:
 *   slug: string — slug sklepu (do wyznaczenia tenantId)
 *   items: Array<{ productId: string; quantity: number }>
 *   shippingAddress: { fullName, street, city, zipCode, country }
 *   currency?: string (domyślnie PLN)
 *
 * Response:
 *   { success, orderId, redirectUrl, grandTotalGross, currency }
 */
export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { slug, items, shippingAddress, currency, couponCode } = body;

    // Walidacja wejścia
    if (!slug || typeof slug !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid slug' },
        { status: 400 },
      );
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items must be a non-empty array' },
        { status: 400 },
      );
    }
    if (!shippingAddress?.fullName || !shippingAddress?.street || !shippingAddress?.city) {
      return NextResponse.json(
        { error: 'Missing required shipping address fields' },
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

    // 2. Zbuduj DTO dla OrderRuntime
    const checkoutReq: CheckoutRequestDTO = {
      items,
      couponCode,
      shippingAddress: {
        fullName: shippingAddress.fullName,
        street: shippingAddress.street,
        city: shippingAddress.city,
        zipCode: shippingAddress.zipCode || '',
        country: shippingAddress.country || 'PL',
      },
      currency: currency || 'PLN',
    };

    // 3. Orkiestracja przez OrderRuntime (cienki wrapper)
    const runtime = typeof OrderRuntime.getInstance === 'function'
      ? OrderRuntime.getInstance()
      : new OrderRuntime();
    const result = await runtime.checkout(
      store.tenantId,
      'guest', // Guest checkout — customerId = 'guest'
      checkoutReq,
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('POST /api/store/checkout error:', message);

    if (message.includes('not found') || message.includes('empty cart')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
