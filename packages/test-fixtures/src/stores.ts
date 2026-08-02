export interface MockStore {
  id: string;
  slug: string;
  name: string;
  tenantId: string;
  currency: string;
  status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  createdAt: string;
}

export const MOCK_STORES: Record<string, MockStore> = {
  demoStore: {
    id: 'store_demo_001',
    slug: 'onekoszyk-demo',
    name: 'OneKoszyk Demo Store',
    tenantId: 'tenant_poland_01',
    currency: 'PLN',
    status: 'ACTIVE',
    createdAt: '2026-01-01T00:00:00Z',
  },
  perfStore10: {
    id: 'store_perf_010',
    slug: 'perf-store-10',
    name: 'Benchmark Store 10 Sections',
    tenantId: 'tenant_perf_01',
    currency: 'USD',
    status: 'ACTIVE',
    createdAt: '2026-02-01T00:00:00Z',
  },
};
