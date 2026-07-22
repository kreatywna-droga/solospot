import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDb, clearMockDb } from '@/lib/supabase';
import { GET as getTenants } from './tenants/route';
import { GET as getOrders } from './orders/route';
import { GET as getEvents } from './events/route';
import { GET as getTenantTimeline } from './tenant/[id]/timeline/route';

vi.mock('@/lib/supabase');

// Mock auth — resolveTenantSession returns authenticated session
vi.mock('@/lib/tenant/TenantResolver', () => ({
  resolveTenantSession: vi.fn().mockResolvedValue({
    userId: 'test-user',
    email: 'admin@solospot.com',
    tenantId: null,
    tenant: null,
    isAuthenticated: true,
  }),
}));

// Mock next/headers for resolveTenantSession
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

describe('Mission Control API Endpoints', () => {
  beforeEach(() => {
    clearMockDb();
    mockDb.tenants.push(
      { id: 'tenant-1', owner_email: 'owner1@example.com', package_id: 'standard', status: 'ACTIVE', created_at: '2026-07-10T10:00:00Z', updated_at: '2026-07-10T10:00:00Z' }
    );
    mockDb.stores.push(
      { id: 'store-1', tenant_id: 'tenant-1', name: 'My Store', status: 'READY', created_at: '2026-07-10T10:01:00Z', updated_at: '2026-07-10T10:01:00Z' }
    );
    mockDb.timeline_events.push(
      { id: 'evt-1', tenant_id: 'tenant-1', correlation_id: 'wf-123', event_type: 'Tenant.Created', actor: 'provisioning-engine', timestamp: '2026-07-10T10:00:01Z', metadata: {} },
      { id: 'evt-2', tenant_id: 'tenant-1', correlation_id: 'wf-123', event_type: 'Store.Provisioned', actor: 'provisioning-engine', timestamp: '2026-07-10T10:01:05Z', metadata: {} }
    );
    mockDb.payment_intents.push(
      { id: 'intent-1', tenant_id: 'tenant-1', provider: 'onekoszyk', provider_transaction_id: 'tx-999', order_id: 'ord-100', status: 'CAPTURED', created_at: '2026-07-10T10:00:30Z', updated_at: '2026-07-10T10:00:40Z' }
    );
  });

  it('GET /api/mission-control/tenants should return all tenants with mapped stores and last events', async () => {
    const res = await getTenants();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.tenants).toHaveLength(1);
    expect(body.tenants[0].id).toBe('tenant-1');
    expect(body.tenants[0].store.name).toBe('My Store');
    expect(body.tenants[0].lastEvent.eventType).toBe('Store.Provisioned'); // latest based on timestamp
  });

  it('GET /api/mission-control/orders should return orders mapped from payment intents', async () => {
    const res = await getOrders();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.orders).toHaveLength(1);
    expect(body.orders[0].orderId).toBe('ord-100');
    expect(body.orders[0].status).toBe('PAID');
    expect(body.orders[0].tenantId).toBe('tenant-1');
  });

  it('GET /api/mission-control/events should return last 100 timeline events', async () => {
    const res = await getEvents();
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.events).toHaveLength(2);
    expect(body.events[0].eventType).toBe('Store.Provisioned'); // sorted descending
  });

  it('GET /api/mission-control/tenant/[id]/timeline should return timeline events for a specific tenant', async () => {
    const res = await getTenantTimeline(new Request('http://localhost'), { params: Promise.resolve({ id: 'tenant-1' }) });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.timeline).toHaveLength(2);
    expect(body.timeline[0].tenantId).toBe('tenant-1');
  });
});
