import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import { POST } from '../../app/api/webhooks/onekoszyk/route';
import { PaymentEngine } from '../../../packages/commerce-engine/src/PaymentEngine';
import { OrderProcessingEngine } from '../../../packages/commerce-engine/src/OrderProcessingEngine';
import { PlatformEventBusImpl } from '../../../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../packages/platform-core/src/logger/Logger';

import { mockDb, clearMockDb } from '@/lib/supabase';

vi.mock('@/lib/supabase');

// -----------------------------------------------------------------------------
// Helper to construct signature headers
// -----------------------------------------------------------------------------
function generateSignature(rawBody: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

describe('Webhook Runtime Integration', () => {
  const secret = 'test-webhook-secret';
  let completePaymentSpy: any;
  let failPaymentSpy: any;
  let confirmPaymentSpy: any;

  beforeEach(() => {
    clearMockDb();
    process.env.ONEKOSZYK_SIGNATURE_KEY = secret;

    // Reset spy tracking cleanly via vi.spyOn (restored in afterEach)
    completePaymentSpy = vi.spyOn(PaymentEngine.prototype, 'completePayment');
    failPaymentSpy = vi.spyOn(PaymentEngine.prototype, 'failPayment');
    confirmPaymentSpy = vi.spyOn(OrderProcessingEngine.prototype, 'confirmPayment');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Should return 401 and make zero engine calls for invalid signature', async () => {
    const payload = {
      id: 'evt_sig_fail',
      transaction_id: 'tx_123',
      tenant_id: 'tenant-123',
      order_id: 'ord_123',
      type: 'PAYMENT_COMPLETED',
      correlation_id: 'corr-123',
    };
    const rawBody = JSON.stringify(payload);
    const badSignature = 'invalid-signature-value';

    const req = new Request('http://localhost/api/webhooks/onekoszyk', {
      method: 'POST',
      headers: {
        'x-signature': badSignature,
        'content-type': 'application/json',
      },
      body: rawBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toContain('signature');

    // Verify zero database insertions in webhook events
    expect(mockDb.webhook_events).toHaveLength(0);

    // Verify zero engine adapter calls
    expect(completePaymentSpy).not.toHaveBeenCalled();
    expect(failPaymentSpy).not.toHaveBeenCalled();
    expect(confirmPaymentSpy).not.toHaveBeenCalled();
  });

  it('2. Should ignore duplicates and return 200 ignored status', async () => {
    const payload = {
      id: 'evt_duplicate_123',
      transaction_id: 'tx_123',
      tenant_id: 'tenant-123',
      order_id: 'ord_123',
      type: 'PAYMENT_COMPLETED',
      correlation_id: 'corr-duplicate-123',
    };
    const rawBody = JSON.stringify(payload);
    const signature = generateSignature(rawBody, secret);

    // Seed existing COMPLETED webhook event in the database matching the payload details
    if (!mockDb.webhook_events) mockDb.webhook_events = [];
    mockDb.webhook_events.push({
      provider: 'onekoszyk',
      provider_event_id: 'evt_duplicate_123',
      payload_hash: crypto.createHash('sha256').update(rawBody).digest('hex'),
      correlation_id: 'corr-duplicate-123',
      tenant_id: 'tenant-123',
      status: 'COMPLETED',
      received_at: new Date().toISOString(),
      processed_at: new Date().toISOString(),
    });

    const req = new Request('http://localhost/api/webhooks/onekoszyk', {
      method: 'POST',
      headers: {
        'x-signature': signature,
        'content-type': 'application/json',
      },
      body: rawBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ received: true, ignored: true });

    // Verify no engine adapter calls were triggered
    expect(completePaymentSpy).not.toHaveBeenCalled();
    expect(failPaymentSpy).not.toHaveBeenCalled();
    expect(confirmPaymentSpy).not.toHaveBeenCalled();
  });

  it('3. Should confirm payment and order for PAYMENT_COMPLETED event', async () => {
    const tenantId = '7d20df20-80a5-48fa-84db-7b66df2e737d'; // valid UUID for tenant isolation checks
    const orderId = 'ord_completed_test';
    const paymentIntentId = 'intent_completed_test';

    // Seed the payment intent in database (status must be PROCESSING or AUTHORIZED to transition to CAPTURED)
    if (!mockDb.payment_intents) mockDb.payment_intents = [];
    mockDb.payment_intents.push({
      id: paymentIntentId,
      tenant_id: tenantId,
      provider: 'onekoszyk',
      provider_transaction_id: 'tx_completed_123',
      order_id: orderId,
      status: 'PROCESSING',
    });

    // Setup order in memory engine database
    const order = {
      id: orderId,
      tenantId,
      customerId: 'cust-123',
      items: [],
      subtotalGross: 1000,
      taxTotal: 230,
      grandTotalGross: 1000,
      currency: 'PLN',
      status: 'PAYMENT_PENDING' as const,
      shippingAddress: {
        fullName: 'Jan Kowalski',
        street: 'Wiejska 1',
        city: 'Warszawa',
        zipCode: '00-001',
        country: 'Poland',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // We spy on OrderProcessingEngine and inject the order
    vi.spyOn(OrderProcessingEngine.prototype, 'getOrder').mockResolvedValue(order as any);

    const payload = {
      id: 'evt_completed_123',
      transaction_id: 'tx_completed_123',
      tenant_id: tenantId,
      order_id: orderId,
      type: 'PAYMENT_COMPLETED',
      amount: 1000,
      currency: 'PLN',
      correlation_id: 'corr-completed-123',
    };
    const rawBody = JSON.stringify(payload);
    const signature = generateSignature(rawBody, secret);

    const req = new Request('http://localhost/api/webhooks/onekoszyk', {
      method: 'POST',
      headers: {
        'x-signature': signature,
        'content-type': 'application/json',
      },
      body: rawBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json).toEqual({ received: true, success: true });

    // Verify engines were called
    expect(completePaymentSpy).toHaveBeenCalled();
    expect(confirmPaymentSpy).toHaveBeenCalled();

    // Verify event is completed in database
    const record = mockDb.webhook_events.find((x: any) => x.provider_event_id === 'evt_completed_123');
    expect(record).toBeDefined();
    expect(record.status).toBe('COMPLETED');
  });

  it('4. Should call failPayment and NOT confirm order for PAYMENT_FAILED event', async () => {
    const tenantId = '7d20df20-80a5-48fa-84db-7b66df2e737d';
    const orderId = 'ord_failed_test';
    const paymentIntentId = 'intent_failed_test';

    // Seed the payment intent
    if (!mockDb.payment_intents) mockDb.payment_intents = [];
    mockDb.payment_intents.push({
      id: paymentIntentId,
      tenant_id: tenantId,
      provider: 'onekoszyk',
      provider_transaction_id: 'tx_failed_123',
      order_id: orderId,
      status: 'PROCESSING',
    });

    const payload = {
      id: 'evt_failed_123',
      transaction_id: 'tx_failed_123',
      tenant_id: tenantId,
      order_id: orderId,
      type: 'PAYMENT_FAILED',
      amount: 1000,
      currency: 'PLN',
      correlation_id: 'corr-failed-123',
    };
    const rawBody = JSON.stringify(payload);
    const signature = generateSignature(rawBody, secret);

    const req = new Request('http://localhost/api/webhooks/onekoszyk', {
      method: 'POST',
      headers: {
        'x-signature': signature,
        'content-type': 'application/json',
      },
      body: rawBody,
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify failPayment was called and confirmPayment was NOT called
    expect(failPaymentSpy).toHaveBeenCalled();
    expect(confirmPaymentSpy).not.toHaveBeenCalled();

    // Verify webhook event state is completed (the webhook delivery succeeded and handled the failure)
    const record = mockDb.webhook_events.find((x: any) => x.provider_event_id === 'evt_failed_123');
    expect(record).toBeDefined();
    expect(record.status).toBe('COMPLETED');
  });

  it('5. Should handle concurrent duplicate delivery atomically using unique constraint', async () => {
    const tenantId = '7d20df20-80a5-48fa-84db-7b66df2e737d';
    const orderId = 'ord_concurrent_test';
    const paymentIntentId = 'intent_concurrent_test';

    if (!mockDb.payment_intents) mockDb.payment_intents = [];
    mockDb.payment_intents.push({
      id: paymentIntentId,
      tenant_id: tenantId,
      provider: 'onekoszyk',
      provider_transaction_id: 'tx_concurrent_123',
      order_id: orderId,
      status: 'PROCESSING',
    });

    const order = {
      id: orderId,
      tenantId,
      customerId: 'cust-123',
      items: [],
      subtotalGross: 1000,
      taxTotal: 230,
      grandTotalGross: 1000,
      currency: 'PLN',
      status: 'PAYMENT_PENDING' as const,
      shippingAddress: {
        fullName: 'Jan Kowalski',
        street: 'Wiejska 1',
        city: 'Warszawa',
        zipCode: '00-001',
        country: 'Poland',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(OrderProcessingEngine.prototype, 'getOrder').mockResolvedValue(order as any);

    const payload = {
      id: 'evt_concurrent_123',
      transaction_id: 'tx_concurrent_123',
      tenant_id: tenantId,
      order_id: orderId,
      type: 'PAYMENT_COMPLETED',
      amount: 1000,
      currency: 'PLN',
      correlation_id: 'corr-concurrent-123',
    };
    const rawBody = JSON.stringify(payload);
    const signature = generateSignature(rawBody, secret);

    // Make concurrent requests
    const makeRequest = () =>
      new Request('http://localhost/api/webhooks/onekoszyk', {
        method: 'POST',
        headers: {
          'x-signature': signature,
          'content-type': 'application/json',
        },
        body: rawBody,
      });

    // Run both POST requests concurrently
    const [res1, res2] = await Promise.all([POST(makeRequest()), POST(makeRequest())]);

    // One must succeed with true success (received: true, success: true)
    // The other must be ignored (received: true, ignored: true)
    const json1 = await res1.json();
    const json2 = await res2.json();

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    const results = [json1, json2];
    expect(results).toContainEqual({ received: true, success: true });
    expect(results).toContainEqual({ received: true, ignored: true });

    // Verify engine was called only once for payment completion
    expect(completePaymentSpy).toHaveBeenCalledTimes(1);
    expect(confirmPaymentSpy).toHaveBeenCalled();
  });
});
