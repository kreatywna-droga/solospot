import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDb, clearMockDb, supabase, MockQueryBuilder } from '@/lib/supabase';

vi.mock('@/lib/supabase');

const { StoreRepository } = await import('../StoreRepository');

describe('Store Isolation', () => {
  beforeEach(() => {
    clearMockDb();
    vi.restoreAllMocks();
  });

  it('filters stores by tenant_id — Tenant A sees only Store A', async () => {
    const storeA = {
      id: 'store-a-1',
      tenant_id: 'tenant-a',
      name: 'Store A',
      slug: 'store-a',
      domain: null,
      status: 'ACTIVE',
      config: {},
      created_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    };
    const storeB = {
      id: 'store-b-1',
      tenant_id: 'tenant-b',
      name: 'Store B',
      slug: 'store-b',
      domain: null,
      status: 'ACTIVE',
      config: {},
      created_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    };

    mockDb.stores.push(storeA, storeB);

    const eqSpy = vi.spyOn(MockQueryBuilder.prototype, 'eq');

    const repo = new StoreRepository();
    const stores = await repo.getStoresByTenant('tenant-a');

    expect(stores).toHaveLength(1);
    expect(stores[0].name).toBe('Store A');
    expect(stores[0].tenantId).toBe('tenant-a');

    expect(supabase.from).toHaveBeenCalledWith('stores');
    expect(eqSpy).toHaveBeenCalledWith('tenant_id', 'tenant-a');
  });

  it('filters stores by tenant_id — Tenant B sees only Store B', async () => {
    const storeA = {
      id: 'store-a-1',
      tenant_id: 'tenant-a',
      name: 'Store A',
      slug: 'store-a',
      domain: null,
      status: 'ACTIVE',
      config: {},
      created_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    };
    const storeB = {
      id: 'store-b-1',
      tenant_id: 'tenant-b',
      name: 'Store B',
      slug: 'store-b',
      domain: null,
      status: 'ACTIVE',
      config: {},
      created_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    };

    mockDb.stores.push(storeA, storeB);

    const repo = new StoreRepository();
    const stores = await repo.getStoresByTenant('tenant-b');

    expect(stores).toHaveLength(1);
    expect(stores[0].name).toBe('Store B');
    expect(stores[0].tenantId).toBe('tenant-b');
  });

  it('prevents Tenant A from accessing Store B via getStore', async () => {
    const storeB = {
      id: 'store-b-1',
      tenant_id: 'tenant-b',
      name: 'Store B',
      slug: 'store-b',
      domain: null,
      status: 'ACTIVE',
      config: {},
      created_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    };
    mockDb.stores.push(storeB);

    const eqSpy = vi.spyOn(MockQueryBuilder.prototype, 'eq');

    const repo = new StoreRepository();
    const store = await repo.getStore('store-b-1', 'tenant-a');

    expect(store).toBeNull();
    expect(eqSpy).toHaveBeenCalledWith('tenant_id', 'tenant-a');
    expect(eqSpy).toHaveBeenCalledWith('id', 'store-b-1');
  });

  it('allows Tenant A to access Store A via getStore', async () => {
    const storeA = {
      id: 'store-a-1',
      tenant_id: 'tenant-a',
      name: 'Store A',
      slug: 'store-a',
      domain: null,
      status: 'ACTIVE',
      config: {},
      created_at: '2026-07-01T00:00:00Z',
      updated_at: '2026-07-01T00:00:00Z',
    };
    mockDb.stores.push(storeA);

    const repo = new StoreRepository();
    const store = await repo.getStore('store-a-1', 'tenant-a');

    expect(store).not.toBeNull();
    expect(store!.name).toBe('Store A');
  });

  it('creates a store scoped to the correct tenant', async () => {
    const repo = new StoreRepository();
    const store = await repo.createStore('tenant-a', { name: 'New Store', slug: 'new-store' });

    expect(store.tenantId).toBe('tenant-a');
    expect(supabase.from).toHaveBeenCalledWith('stores');
  });
});
