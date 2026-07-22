import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import { POST } from '../../app/api/webhooks/onekoszyk/route';
import { PaymentEngine } from '../../../packages/commerce-engine/src/PaymentEngine';
import { OrderProcessingEngine } from '../../../packages/commerce-engine/src/OrderProcessingEngine';
import { TenantRepository } from './TenantRepository';
import { TenantProvisioningEngine } from './TenantProvisioningEngine';
import { PlatformEventBusImpl } from '../../../packages/platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../../packages/platform-core/src/logger/Logger';
import { TimelineRepository } from '../observability/TimelineRepository';
import { EventTimeline } from '../observability/EventTimeline';

// Shared event bus subscriptions for testing
const subscriptions = new Map<string, Set<any>>();

// Shared orders map for testing
const ordersMap = new Map<string, any>();

// Mock Event Bus to behave as a Singleton across all instantiations
vi.mock('@/../packages/platform-core/src/events/PlatformEventBus', () => {
  return {
    PlatformEventBusImpl: class {
      constructor(logger?: any) {}
      
      async publish(event: any) {
        const handlers = subscriptions.get(event.eventType) || new Set();
        const wildcards = subscriptions.get('*') || new Set();
        const all = [...handlers, ...wildcards];
        
        for (const sub of all) {
          if (!sub.tenantId || sub.tenantId === event.tenantId) {
            await sub.handler(event);
          }
        }
      }
      
      subscribe(eventType: string, handler: any, tenantId?: string) {
        if (!subscriptions.has(eventType)) {
          subscriptions.set(eventType, new Set());
        }
        const subs = subscriptions.get(eventType)!;
        const exists = Array.from(subs).some(sub => sub.handler.toString() === handler.toString());
        if (exists) {
          return { id: 'dup', eventType };
        }
        const id = Math.random().toString();
        subs.add({ id, handler, tenantId });
        return { id, eventType };
      }
      
      unsubscribe(token: any) {
        const subs = subscriptions.get(token.eventType);
        if (subs) {
          for (const sub of subs) {
            if (sub.id === token.id) {
              subs.delete(sub);
              break;
            }
          }
        }
      }
    }
  };
});

// Mock Event Registry to auto-accept registrations
vi.mock('@/../packages/platform-core/src/events/EventRegistry', () => {
  return {
    EventRegistry: {
      register: () => {},
      isRegistered: () => true,
      getAll: () => [],
    }
  };
});

import { mockDb, clearMockDb } from '@/lib/supabase';

vi.mock('@/lib/supabase');

function generateSignature(rawBody: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

describe('Golden Flow Integration Test', () => {
  const secret = 'test-webhook-secret';
  let tenantRepo: TenantRepository;
  let provisioningEngine: TenantProvisioningEngine;

  beforeEach(() => {
    subscriptions.clear();
    ordersMap.clear();
    clearMockDb();
    process.env.ONEKOSZYK_SIGNATURE_KEY = secret;

    const logger = new ConsolePlatformLogger();
    const eventBus = new PlatformEventBusImpl(logger);

    // Wire telemetry timeline
    const timelineRepo = new TimelineRepository();
    new EventTimeline({ eventBus, repository: timelineRepo });

    tenantRepo = new TenantRepository();
    
    provisioningEngine = new TenantProvisioningEngine({ eventBus, tenantRepo, logger });

    // Mock OrderProcessingEngine prototype to work with shared ordersMap
    vi.spyOn(OrderProcessingEngine.prototype, 'getOrder').mockImplementation(async (tenantId, orderId) => {
      const ord = ordersMap.get(orderId);
      if (!ord) throw new Error(`Order not found: ${orderId}`);
      return ord;
    });

    vi.spyOn(OrderProcessingEngine.prototype, 'setOrderForTesting').mockImplementation((ord) => {
      ordersMap.set(ord.id, ord);
    });

    vi.spyOn(OrderProcessingEngine.prototype, 'confirmPayment').mockImplementation(async function(
      this: any,
      tenantId: string,
      orderId: string,
      paymentIntentId: string,
      correlationId?: string
    ) {
      const order = ordersMap.get(orderId);
      if (!order) throw new Error(`Order not found: ${orderId}`);
      
      if (order.status === 'PAID') {
        return order;
      }
      
      order.status = 'PAID';
      order.paymentIntentId = paymentIntentId;
      ordersMap.set(orderId, order);

      // Publish Order.PaymentConfirmed event
      await this.eventBus.publish({
        eventId: `evt_ord_paid_${Math.random().toString(36).substr(2, 9)}`,
        eventType: 'Order.PaymentConfirmed',
        timestamp: new Date().toISOString(),
        correlationId: correlationId || 'mock_corr',
        tenantId,
        payload: { orderId, paymentIntentId },
      });

      return order;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Should successfully complete the full Golden Flow: Registration -> Checkout -> Payment -> Provisioning -> Active Store', async () => {
    const tenantId = 'first-test-tenant-uuid';
    const ownerEmail = 'partner@solospot.pl';
    const packageId = 'standard_store';

    // 1. Create Tenant
    const tenant = await provisioningEngine.createTenant(tenantId, ownerEmail, packageId, 'corr-golden-123');
    expect(tenant.id).toBe(tenantId);
    expect(tenant.status).toBe('CREATED');

    // 2. Checkout setup
    const orderId = 'ord_golden_123';
    const order = {
      id: orderId,
      tenantId,
      customerId: 'cust-golden-123',
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
    ordersMap.set(orderId, order);

    mockDb.payment_intents.push({
      id: 'intent_golden_123',
      tenant_id: tenantId,
      provider: 'onekoszyk',
      provider_transaction_id: 'tx_golden_123',
      order_id: orderId,
      status: 'PROCESSING',
    });

    // 3. Webhook simulation
    const payload = {
      id: 'evt_webhook_golden_123',
      transaction_id: 'tx_golden_123',
      tenant_id: tenantId,
      order_id: orderId,
      type: 'PAYMENT_COMPLETED',
      amount: 1000,
      currency: 'PLN',
      correlation_id: 'corr-golden-123',
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

    // 4. Assertions on final state
    const processedOrder = ordersMap.get(orderId);
    expect(processedOrder).toBeDefined();
    expect(processedOrder.status).toBe('PAID');

    const updatedTenant = await tenantRepo.getTenant(tenantId);
    expect(updatedTenant).toBeDefined();
    expect(updatedTenant!.status).toBe('ACTIVE');

    const store = await tenantRepo.getStoreByTenant(tenantId);
    expect(store).toBeDefined();
    expect(store!.status).toBe('READY');
    expect(store!.name).toBe(`${tenantId} Store`);

    // Assertion 4: Observability timeline checks
    const eventTypes = mockDb.timeline_events.map((x: any) => x.event_type);
    expect(mockDb.timeline_events.length).toBeGreaterThanOrEqual(5);
    expect(eventTypes).toContain('Tenant.Created');
    expect(eventTypes).toContain('Payment.Completed');
    expect(eventTypes).toContain('Order.PaymentConfirmed');
    expect(eventTypes).toContain('Store.Provisioned');
    expect(eventTypes).toContain('Tenant.Ready');

    // Verify trace traceability via shared correlationId
    for (const entry of mockDb.timeline_events) {
      expect(entry.tenant_id).toBe(tenantId);
      expect(entry.correlation_id).toBe('corr-golden-123');
      expect(entry.actor).toBeDefined();
    }
  });
});
