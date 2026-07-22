import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET as getDashboard } from './dashboard/route';
import { GET as getSettings, POST as updateSettings } from './settings/route';
import { POST as publishStore } from './publish/route';
import { GET as getPackages, POST as managePackage } from './packages/route';
import { GET as getDomains, POST as updateDomain } from './domains/route';

// Hoist mock setup
const {
  mockResolveTenantSession,
  mockSupabase,
  mockPublishStore,
  mockListPackages,
  mockInstallPackage,
  mockUninstallPackage
} = vi.hoisted(() => {
  return {
    mockResolveTenantSession: vi.fn(),
    mockSupabase: {
      from: vi.fn(),
    },
    mockPublishStore: vi.fn(),
    mockListPackages: vi.fn(),
    mockInstallPackage: vi.fn(),
    mockUninstallPackage: vi.fn(),
  };
});

vi.mock('@/lib/tenant/TenantResolver', () => ({
  resolveTenantSession: mockResolveTenantSession,
}));

vi.mock('@/lib/supabase', () => ({
  getServiceSupabase: () => mockSupabase,
  mockDb: {},
  clearMockDb: () => {},
}));

vi.mock('../../../../packages/mission-control-core/src/StoreManagement', () => ({
  DefaultStoreManager: class {
    publishStore = mockPublishStore;
  },
}));

vi.mock('../../../../packages/mission-control-core/src/MissionControl', () => ({
  MissionControl: class {
    packages = {
      listPackages: mockListPackages,
      installPackage: mockInstallPackage,
      uninstallPackage: mockUninstallPackage,
    };
    logAuditEvent = async () => {};
  },
}));

describe('Store Client API Endpoints', () => {
  const storeId = 'store-uuid-abc';
  const tenantId = 'tenant-uuid-123';
  const userId = 'user-uuid-999';

  beforeEach(() => {
    vi.restoreAllMocks();
    mockResolveTenantSession.mockReset();
    mockSupabase.from.mockReset();
    mockPublishStore.mockReset();
    mockListPackages.mockReset();
    mockInstallPackage.mockReset();
    mockUninstallPackage.mockReset();
  });

  function setupAuthSession() {
    mockResolveTenantSession.mockResolvedValue({
      isAuthenticated: true,
      userId,
      tenantId,
      tenant: {
        id: tenantId,
        store: {
          id: storeId,
          name: 'Superstore',
          status: 'ACTIVE',
        },
      },
    });
  }

  describe('GET /api/store/dashboard', () => {
    it('should return overview, status, and usage metrics', async () => {
      setupAuthSession();

      const mockSingle = vi.fn().mockResolvedValue({
        data: { name: 'Superstore', status: 'ACTIVE', config: { branding: {} }, domain: 'shop.com', slug: 'shop' },
        error: null,
      });

      // Chainable query builder mock
      const mockQueryBuilder: any = {
        select: () => mockQueryBuilder,
        eq: () => mockQueryBuilder,
        order: () => mockQueryBuilder,
        limit: () => mockQueryBuilder,
        maybeSingle: async () => ({
          data: { id: 'deploy-1', status: 'SUCCESS', url: 'https://shop.com', created_at: new Date().toISOString() },
          error: null,
        }),
        single: async () => ({ data: {}, error: null }),
        // thenable implementation to resolve when awaited
        then: (onfulfilled: any) => onfulfilled({ count: 10, data: [], error: null }),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'stores' || table === 'tenants') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: mockSingle,
                }),
                maybeSingle: mockSingle,
              }),
            }),
          };
        }
        return mockQueryBuilder;
      });

      const req = new NextRequest('http://localhost/api/store/dashboard');
      const res = await getDashboard(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.overview).toBeDefined();
      expect(json.status).toBeDefined();
      expect(json.usage).toBeDefined();
    });
  });

  describe('/api/store/settings', () => {
    it('should retrieve store settings via GET', async () => {
      setupAuthSession();

      const mockSingle = vi.fn().mockResolvedValue({
        data: { name: 'Superstore', domain: 'shop.com', config: { logoUrl: 'logo.png', branding: {}, seo: {} } },
        error: null,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: mockSingle,
            }),
          }),
        }),
      }));

      const req = new NextRequest('http://localhost/api/store/settings');
      const res = await getSettings(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.settings.name).toBe('Superstore');
      expect(json.settings.logoUrl).toBe('logo.png');
    });

    it('should update store settings via POST', async () => {
      setupAuthSession();

      const mockSingle = vi.fn().mockResolvedValue({
        data: { name: 'Superstore', domain: 'shop.com', config: {} },
        error: null,
      });

      const mockUpdate = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              maybeSingle: mockSingle,
            }),
          }),
        }),
        update: () => ({
          eq: () => ({
            eq: mockUpdate,
          }),
        }),
      }));

      const req = new NextRequest('http://localhost/api/store/settings', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Name', logoUrl: 'new-logo.png' }),
      });
      const res = await updateSettings(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.settings.name).toBe('New Name');
      expect(json.settings.logoUrl).toBe('new-logo.png');
    });
  });

  describe('POST /api/store/publish', () => {
    it('should trigger store publishing', async () => {
      setupAuthSession();

      mockPublishStore.mockResolvedValue({
        status: 'SUCCESS',
        deploymentUrl: 'https://deploy.solospot.pl/store-123',
        buildId: 'b_123',
        errors: [],
      });

      const req = new NextRequest('http://localhost/api/store/publish', { method: 'POST' });
      const res = await publishStore(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.result.deploymentUrl).toBe('https://deploy.solospot.pl/store-123');
    });
  });

  describe('GET and POST /api/store/packages', () => {
    it('should return packages listing with isInstalled status', async () => {
      setupAuthSession();

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'stores') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { config: { packages: ['package-cart'] } },
                  error: null,
                }),
              }),
            }),
          };
        }
        return {};
      });

      mockListPackages.mockResolvedValue([
        { id: 'package-cart', name: 'Shopping Cart' },
        { id: 'package-seo', name: 'SEO Toolkit' },
      ]);

      const req = new NextRequest('http://localhost/api/store/packages');
      const res = await getPackages(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.packages).toHaveLength(2);
      expect(json.packages[0].isInstalled).toBe(true);
      expect(json.packages[1].isInstalled).toBe(false);
    });

    it('should trigger package install', async () => {
      setupAuthSession();

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            single: async () => ({
              data: { config: { packages: [] } },
              error: null,
            }),
          }),
        }),
        update: () => ({
          eq: async () => ({ error: null }),
        }),
      }));

      const req = new NextRequest('http://localhost/api/store/packages', {
        method: 'POST',
        body: JSON.stringify({ action: 'INSTALL', packageId: 'package-seo' }),
      });
      const res = await managePackage(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(mockInstallPackage).toHaveBeenCalledWith(
        expect.any(Object),
        tenantId,
        storeId,
        'package-seo'
      );
    });
  });

  describe('/api/store/domains', () => {
    it('should get primary and custom domain of the store', async () => {
      setupAuthSession();

      mockSupabase.from.mockImplementation(() => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: { slug: 'myshop', domain: 'custom.com' },
              error: null,
            }),
          }),
        }),
      }));

      const req = new NextRequest('http://localhost/api/store/domains');
      const res = await getDomains(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.primaryDomain).toBe('myshop.solospot.pl');
      expect(json.customDomain).toBe('custom.com');
    });

    it('should update custom domain and validate format', async () => {
      setupAuthSession();

      const mockUpdate = vi.fn().mockResolvedValue({ error: null });
      mockSupabase.from.mockImplementation(() => ({
        update: () => ({
          eq: mockUpdate,
        }),
      }));

      // Invalid format request
      const reqInvalid = new NextRequest('http://localhost/api/store/domains', {
        method: 'POST',
        body: JSON.stringify({ domain: 'invalid_domain' }),
      });
      const resInvalid = await updateDomain(reqInvalid);
      expect(resInvalid.status).toBe(400);

      // Valid format request
      const reqValid = new NextRequest('http://localhost/api/store/domains', {
        method: 'POST',
        body: JSON.stringify({ domain: 'valid-domain.com' }),
      });
      const resValid = await updateDomain(reqValid);
      expect(resValid.status).toBe(200);

      const json = await resValid.json();
      expect(json.success).toBe(true);
      expect(json.customDomain).toBe('valid-domain.com');
    });
  });
});
