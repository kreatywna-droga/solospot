import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getPackages } from './packages/route';
import { GET as getTemplates } from './templates/route';
import { GET as getThemes } from './themes/route';
import { GET as getCapabilities } from './capabilities/route';
import { POST as installPackage } from '../stores/[id]/install-package/route';
import { POST as upgradePackage } from '../stores/[id]/upgrade-package/route';
import { POST as uninstallPackage } from '../stores/[id]/uninstall-package/route';
import { mockDb, clearMockDb } from '@/lib/supabase';

// Mock resolving tenant sessions
vi.mock('@/lib/tenant/TenantResolver', () => ({
  resolveTenantSession: vi.fn(async () => ({
    isAuthenticated: true,
    tenantId: 'tenant-test-123'
  }))
}));

// Mock Supabase database client
vi.mock('@/lib/supabase', () => {
  const mockDbInst = {
    stores: [] as any[]
  };
  return {
    mockDb: mockDbInst,
    clearMockDb: () => {
      mockDbInst.stores = [];
    },
    getServiceSupabase: () => {
      let pendingUpdates: any = null;
      const queryChain = {
        eq: () => queryChain,
        order: () => queryChain,
        select: () => queryChain,
        maybeSingle: () => Promise.resolve({ data: mockDbInst.stores[0] || null, error: null }),
        single: () => {
          if (pendingUpdates) {
            const store = mockDbInst.stores[0];
            if (store) {
              Object.assign(store, pendingUpdates);
            }
          }
          return Promise.resolve({ data: mockDbInst.stores[0] || null, error: null });
        }
      };
      return {
        from: (table: string) => ({
          select: () => queryChain,
          insert: (row: any) => ({
            select: () => ({
              single: () => {
                mockDbInst.stores.push(row);
                return Promise.resolve({ data: row, error: null });
              }
            })
          }),
          update: (updates: any) => {
            pendingUpdates = updates;
            return queryChain;
          }
        })
      };
    }
  };
});

describe('Marketplace API Endpoints (C2.5 / C3)', () => {
  beforeEach(() => {
    clearMockDb();

    // Create a mock store row
    mockDb.stores.push({
      id: 'store-abc',
      tenant_id: 'tenant-test-123',
      name: 'Alpha Store',
      slug: 'alpha-store',
      domain: null,
      status: 'ACTIVE',
      config: {
        packages: ['theme-ocean']
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  });

  it('GET /api/marketplace/packages should list matches', async () => {
    const req = new NextRequest('http://localhost/api/marketplace/packages?text=Stripe');
    const res = await getPackages(req);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items[0].id).toBe('payment-stripe');
  });

  it('GET /api/marketplace/templates should return list of templates', async () => {
    const res = await getTemplates();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.templates).toBeDefined();
  });

  it('GET /api/marketplace/themes should return list of themes', async () => {
    const res = await getThemes();
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.themes.length).toBeGreaterThan(0);
    expect(body.themes[0].category).toBe('Themes');
  });

  it('GET /api/marketplace/capabilities should list unique capability tags', async () => {
    const res = await getCapabilities();
    const body = await res.json();
    if (!body.success) console.error('Capabilities error:', body);
    expect(body.success).toBe(true);
    expect(body.capabilities).toContain('payments');
    expect(body.capabilities).toContain('theme');
  });

  it('POST /api/stores/[id]/install-package should resolve and append package to config', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'payment-paypal' })
    });
    const params = Promise.resolve({ id: 'store-abc' });

    const res = await installPackage(req, { params });
    const body = await res.json();
    if (!body.success) console.error('Install error:', body);

    expect(body.success).toBe(true);
    expect(body.store.config.packages).toContain('payment-paypal');
  });

  it('POST /api/stores/[id]/upgrade-package should produce an upgrade plan', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'payment-stripe' }) // seeded version 1.5.0
    });
    const params = Promise.resolve({ id: 'store-abc' });

    // Seed mock store with installed payment-stripe
    mockDb.stores[0].config.packages.push('payment-stripe');

    const res = await upgradePackage(req, { params });
    const body = await res.json();
    if (!body.success) console.error('Upgrade error:', body);

    expect(body.success).toBe(true);
    expect(body.plan).toBeDefined();
    expect(body.plan.packageId).toBe('payment-stripe');
  });

  it('POST /api/stores/[id]/uninstall-package should remove package and trigger rollback', async () => {
    const req = new NextRequest('http://localhost', {
      method: 'POST',
      body: JSON.stringify({ packageId: 'theme-ocean' })
    });
    const params = Promise.resolve({ id: 'store-abc' });

    const res = await uninstallPackage(req, { params });
    const body = await res.json();
    if (!body.success) console.error('Uninstall error:', body);

    expect(body.success).toBe(true);
    expect(body.store.config.packages).not.toContain('theme-ocean');
  });
});
