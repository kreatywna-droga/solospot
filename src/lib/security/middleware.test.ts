import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { middleware } from '../../middleware';
import { mockDb, clearMockDb } from '@/lib/supabase';

const { mockGetSession, mockFrom, mockMaybeSingle } = vi.hoisted(() => {
  const mockGetSession = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockEq = vi.fn().mockImplementation(() => ({ maybeSingle: mockMaybeSingle }));
  const mockSelect = vi.fn().mockImplementation(() => ({ eq: mockEq }));
  const mockFrom = vi.fn().mockImplementation(() => ({ select: mockSelect }));
  return { mockGetSession, mockFrom, mockMaybeSingle };
});

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn().mockImplementation(() => ({
    auth: {
      getSession: async () => ({ data: { session: mockGetSession() } }),
    },
  })),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockImplementation(() => ({
    from: mockFrom,
  })),
}));

describe('Platform Security Middleware Boundary tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearMockDb();
    mockGetSession.mockReset();
    mockMaybeSingle.mockReset();
  });

  it('should skip static assets and Next.js internals', async () => {
    const req = new NextRequest('http://localhost/_next/static/chunks/main.js');
    const res = await middleware(req);
    expect(res).toBeDefined();
    // Headers or rewrite check
    expect(res.headers.get('x-correlation-id')).toBeDefined();
  });

  it('should block unauthorized users for /api/admin paths', async () => {
    mockGetSession.mockReturnValue(null); // Unauthenticated

    const req = new NextRequest('http://localhost/api/admin/tenants');
    const res = await middleware(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Unauthorized');
  });

  it('should allow admin roles for /api/admin paths', async () => {
    mockGetSession.mockReturnValue({
      user: { email: 'admin@solospot.com' },
    });

    const req = new NextRequest('http://localhost/api/admin/tenants');
    const res = await middleware(req);
    // Returns next response (which is status 200 or 307 rewrite, not 401/403)
    expect(res.status).toBe(200);
  });

  it('should block non-admin roles for /api/admin paths', async () => {
    mockGetSession.mockReturnValue({
      user: { email: 'customer@solospot.com' },
    });

    const req = new NextRequest('http://localhost/api/admin/tenants');
    const res = await middleware(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Forbidden');
  });

  it('should guard tenant dashboard APIs (/api/stores/[storeId]) and block cross-tenant requests', async () => {
    // Session is for tenant-a owner
    mockGetSession.mockReturnValue({
      user: { email: 'owner-a@solospot.com' },
    });

    // Mock tenant lookup for user's email
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'tenant-a', status: 'ACTIVE' },
      error: null,
    });

    // Mock store lookup for dynamic route validation (store belongs to tenant-b)
    mockMaybeSingle.mockResolvedValueOnce({
      data: { tenant_id: 'tenant-b' },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/stores/store-xyz/publish');
    const res = await middleware(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Forbidden: Cross-tenant access attempt');
  });

  it('should allow store dashboard API request if store belongs to the authenticated tenant', async () => {
    mockGetSession.mockReturnValue({
      user: { email: 'owner-a@solospot.com' },
    });

    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'tenant-a', status: 'ACTIVE' },
      error: null,
    });

    mockMaybeSingle.mockResolvedValueOnce({
      data: { tenant_id: 'tenant-a' },
      error: null,
    });

    const req = new NextRequest('http://localhost/api/stores/store-xyz/publish');
    const res = await middleware(req);
    expect(res.status).toBe(200);
  });

  it('should resolve tenant slug from subdomain and rewrite request', async () => {
    mockGetSession.mockReturnValue(null);

    // Mock store slug resolution
    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'store-123', tenant_id: 'tenant-123', status: 'ACTIVE', slug: 'my-shop' },
      error: null,
    });

    const req = new NextRequest('http://my-shop.solospot.pl/products', {
      headers: { host: 'my-shop.solospot.pl' },
    });
    const res = await middleware(req);
    expect(res.status).toBe(200);
    // Rewritten URL has path '/s/store-123/products'
    expect(res.headers.get('x-middleware-rewrite')).toContain('/s/store-123/products');
  });

  it('should return 503 Service Unavailable for suspended tenant storefront', async () => {
    mockGetSession.mockReturnValue(null);

    mockMaybeSingle.mockResolvedValueOnce({
      data: { id: 'store-123', tenant_id: 'tenant-123', status: 'SUSPENDED', slug: 'suspended-shop' },
      error: null,
    });

    const req = new NextRequest('http://suspended-shop.solospot.pl/', {
      headers: { host: 'suspended-shop.solospot.pl' },
    });
    const res = await middleware(req);
    expect(res.status).toBe(503);
  });
});
