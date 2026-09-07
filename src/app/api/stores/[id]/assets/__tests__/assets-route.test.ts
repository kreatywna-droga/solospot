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
      return { id: 'store-1', tenantId: 'tenant-1', name: 'Store', status: 'ACTIVE', config: {}, createdAt: '', updatedAt: '' };
    }
  },
}));

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: () => false,
  isSupabaseServiceConfigured: () => false,
  getServiceSupabase: () => undefined,
  supabase: {},
}));

import { GET, POST } from '../route';

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

function jsonRequest(body: unknown): NextRequest {
  const req = new Request('http://localhost/api/stores/store-1/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return req as unknown as NextRequest;
}

function getRequest(): NextRequest {
  return new Request('http://localhost/api/stores/store-1/assets') as unknown as NextRequest;
}

const params = Promise.resolve({ id: 'store-1' });

describe('POST /api/stores/[id]/assets — direct upload authorization', () => {
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

    const res = await POST(jsonRequest({
      directUpload: true,
      storagePath: 'tenant-1/store-1/a.png',
      publicUrl: 'https://x',
    }), { params });

    expect(res.status).toBe(403);
  });

  it('Rejects direct-upload metadata whose storage path belongs to another tenant (403)', async () => {
    mockResolveTenantSession.mockResolvedValue(AUTHED_SESSION);

    const res = await POST(jsonRequest({
      directUpload: true,
      storagePath: 'other-tenant/store-1/a.png',
      publicUrl: 'https://x',
      filename: 'a.png',
      originalName: 'a.png',
      mimeType: 'image/png',
      size: 123,
      type: 'image',
    }), { params });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toMatch(/Nieautoryzowana ścieżka storage/);
  });

  it('Rejects direct-upload metadata crossing into another store folder (403)', async () => {
    mockResolveTenantSession.mockResolvedValue(AUTHED_SESSION);

    const res = await POST(jsonRequest({
      directUpload: true,
      storagePath: 'tenant-1/other-store/a.png',
      publicUrl: 'https://x',
      filename: 'a.png',
      originalName: 'a.png',
      mimeType: 'image/png',
      size: 123,
      type: 'image',
    }), { params });

    expect(res.status).toBe(403);
  });

  it('Accepts direct-upload metadata for the authenticated tenant+store (201)', async () => {
    mockResolveTenantSession.mockResolvedValue(AUTHED_SESSION);

    const res = await POST(jsonRequest({
      directUpload: true,
      storagePath: 'tenant-1/store-1/uuid-hero.png',
      publicUrl: 'https://x/uuid-hero.png',
      filename: 'uuid-hero.png',
      originalName: 'hero.png',
      mimeType: 'image/png',
      size: 123,
      type: 'image',
    }), { params });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.asset.storagePath).toBe('tenant-1/store-1/uuid-hero.png');
  });
});

describe('GET /api/stores/[id]/assets', () => {
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

  it('Returns the tenant asset list for an authenticated session', async () => {
    mockResolveTenantSession.mockResolvedValue(AUTHED_SESSION);

    const res = await GET(getRequest(), { params });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.assets)).toBe(true);
  });
});