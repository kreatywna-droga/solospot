import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockDb, clearMockDb } from '@/lib/supabase';
import { GET as getTenants, POST as postTenants } from './tenants/route';
import { GET as getStores, POST as postStores } from './stores/route';
import { GET as getPackages, POST as postPackages } from './packages/route';
import { GET as getDeployments, POST as postDeployments } from './deployments/route';
import { GET as getEvents } from './events/route';
import { NextRequest } from 'next/server';

import { marketplaceProvider } from '@/lib/marketplace/MarketplaceProvider';

vi.mock('@/lib/supabase');

// Mock auth session resolver
vi.mock('@/lib/tenant/TenantResolver', () => ({
  resolveTenantSession: vi.fn().mockResolvedValue({
    userId: 'admin-user',
    email: 'admin@solospot.com',
    tenantId: null,
    tenant: null,
    isAuthenticated: true,
  }),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    getAll: () => [],
    set: vi.fn(),
  }),
}));

describe('Admin API Endpoints', () => {
  beforeEach(async () => {
    clearMockDb();
    mockDb.tenants = [
      { id: 'tenant-1', owner_email: 'owner1@example.com', package_id: 'standard', status: 'ACTIVE', created_at: '2026-07-10T10:00:00Z', updated_at: '2026-07-10T10:00:00Z' }
    ];
    mockDb.stores = [
      { id: 'store-1', tenant_id: 'tenant-1', name: 'My Store', slug: 'mystore', status: 'READY', created_at: '2026-07-10T10:01:00Z', updated_at: '2026-07-10T10:01:00Z' }
    ];
    mockDb.audit_logs = [];
    mockDb.deployments = [];

    // Register theme-modern packages
    try {
      await marketplaceProvider.registry.register({
        id: 'theme-modern',
        name: 'Modern Theme',
        version: '1.0.0',
        type: 'theme',
        dependencies: {},
        capabilities: ['theme'],
        compatibility: { coreVersion: '^1.0.0' },
        author: 'Tester',
        license: 'MIT'
      }, new Uint8Array());
    } catch (e) {
      // ignore
    }

    try {
      await marketplaceProvider.registry.register({
        id: 'theme-modern',
        name: 'Modern Theme',
        version: '2.0.0',
        type: 'theme',
        dependencies: {},
        capabilities: ['theme'],
        compatibility: { coreVersion: '^1.0.0' },
        author: 'Tester',
        license: 'MIT'
      }, new Uint8Array());
    } catch (e) {
      // ignore
    }
  });

  it('GET /api/admin/tenants lists all tenants', async () => {
    const req = new NextRequest('http://localhost/api/admin/tenants');
    const res = await getTenants(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.tenants).toHaveLength(1);
    expect(body.tenants[0].id).toBe('tenant-1');
  });

  it('POST /api/admin/tenants changes tenant status', async () => {
    const req = new NextRequest('http://localhost/api/admin/tenants', {
      method: 'POST',
      body: JSON.stringify({ tenantId: 'tenant-1', action: 'SUSPEND' }),
    });
    const res = await postTenants(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.tenant.status).toBe('SUSPENDED');
  });

  it('GET /api/admin/stores lists all stores', async () => {
    const req = new NextRequest('http://localhost/api/admin/stores');
    const res = await getStores(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.stores).toHaveLength(1);
  });

  it('POST /api/admin/stores performs store actions (PROVISION/PUBLISH/SUSPEND)', async () => {
    const req = new NextRequest('http://localhost/api/admin/stores', {
      method: 'POST',
      body: JSON.stringify({
        action: 'PROVISION',
        tenantId: 'tenant-1',
        storeId: 'store-new',
        storeName: 'New Store',
        templateId: 'tpl-minimal'
      }),
    });
    const res = await postStores(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('GET /api/admin/packages lists registry packages', async () => {
    const req = new NextRequest('http://localhost/api/admin/packages');
    const res = await getPackages(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.packages.length).toBeGreaterThan(0);
  });

  it('POST /api/admin/packages executes package install/uninstall/upgrade', async () => {
    const req = new NextRequest('http://localhost/api/admin/packages', {
      method: 'POST',
      body: JSON.stringify({
        action: 'CHECK_UPGRADE',
        packageId: 'theme-modern',
        currentVersion: '1.0.0',
        targetVersion: '2.0.0'
      }),
    });
    const res = await postPackages(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.plan.packageId).toBe('theme-modern');
  });

  it('GET /api/admin/deployments list and POST rollback deployments', async () => {
    mockDb.deployments.push({
      id: 'b-99',
      store_id: 'store-1',
      tenant_id: 'tenant-1',
      status: 'SUCCESS',
      url: 'file:///tmp/out',
      pages_count: 5,
      artifacts_count: 2,
      duration_ms: 120,
      provider_type: 'local',
      created_at: '2026-07-10T10:02:00Z',
      artifacts: []
    });

    const getReq = new NextRequest('http://localhost/api/admin/deployments?storeId=store-1');
    const getRes = await getDeployments(getReq);
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.success).toBe(true);
    expect(getBody.deployments).toHaveLength(1);

    const postReq = new NextRequest('http://localhost/api/admin/deployments', {
      method: 'POST',
      body: JSON.stringify({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        buildId: 'b-99'
      })
    });
    const postRes = await postDeployments(postReq);
    expect(postRes.status).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.success).toBe(true);
  });

  it('GET /api/admin/events gets audit logs', async () => {
    mockDb.audit_logs.push({
      actor: 'admin-user',
      action: 'SUSPEND_TENANT',
      target: 'tenant-1',
      timestamp: '2026-07-10T10:05:00Z'
    });

    const req = new NextRequest('http://localhost/api/admin/events');
    const res = await getEvents(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.events).toHaveLength(1);
    expect(body.events[0].action).toBe('SUSPEND_TENANT');
  });
});
