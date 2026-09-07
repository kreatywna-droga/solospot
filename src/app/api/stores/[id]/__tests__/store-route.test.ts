import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { NextRequest } from 'next/server';
import type { TenantSession } from '@/lib/tenant/TenantContext';

const mockResolveTenantSession = vi.fn();

vi.mock('@/lib/tenant/TenantResolver', () => ({
  resolveTenantSession: (...args: unknown[]) => mockResolveTenantSession(...args),
}));

vi.mock('@/lib/store/StoreService', () => ({
  StoreService: class {
    async getStore() {
      return { id: 'store-1', name: 'Store', slug: 'store', status: 'ACTIVE', config: {}, createdAt: '', updatedAt: '' };
    }
  },
}));

import { GET } from '../route';

const AUTHED_SESSION: TenantSession = {
  userId: 'user-1',
  email: 'owner@example.com',
  tenantId: 'tenant-1',
  tenant: {
    id: 'tenant-1',
    ownerEmail: 'owner@example.com',
    packageId: 'standard',
    status: 'ACTIVE',
    createdAt: '',
    store: { id: 'store-1', name: 'Store', status: 'ACTIVE' },
  },
  isAuthenticated: true,
};

function getRequest(): NextRequest {
  return new Request('http://localhost/api/stores/store-1') as unknown as NextRequest;
}

const params = Promise.resolve({ id: 'store-1' });

describe('GET /api/stores/[id] — exposes the REAL session tenantId to the client (REG-0018-tenant-prefix)', () => {
  beforeEach(() => {
    mockResolveTenantSession.mockReset();
  });

  it('Rejects unauthenticated requests with 403', async () => {
    mockResolveTenantSession.mockResolvedValue({
      userId: '',
      email: '',
      tenantId: null,
      tenant: null,
      isAuthenticated: false,
    });

    const res = await GET(getRequest(), { params });
    expect(res.status).toBe(403);
  });

  it('Returns tenantId FROM THE SESSION (server-authoritative) so the browser builds a compliant storage path', async () => {
    mockResolveTenantSession.mockResolvedValue(AUTHED_SESSION);

    const res = await GET(getRequest(), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.store.id).toBe('store-1');
    expect(data.store.tenantId).toBe('tenant-1');
  });
});