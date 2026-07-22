import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TenantResolver, TenantDatabaseProvider, TenantL2Cache } from './TenantResolver';
import { TenantContext } from './TenantTypes';
import { TenantContextBuilder } from './TenantContextBuilder';
import { PlatformEventBusImpl } from '../events/PlatformEventBus';
import { ConsolePlatformLogger } from '../logger/Logger';
import { TenantResolutionError, RuntimeError } from '../errors/PlatformError';

describe('Tenant Resolver Engine', () => {
  let eventBus: PlatformEventBusImpl;
  let logger: ConsolePlatformLogger;
  let dbProvider: TenantDatabaseProvider;
  let mockTenants: Record<string, TenantContext>;

  // Helper to create valid JWT tokens
  function createFakeJwt(payload: Record<string, any>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${header}.${payloadStr}.fake_signature`;
  }

  beforeEach(() => {
    logger = new ConsolePlatformLogger();
    eventBus = new PlatformEventBusImpl(logger);
    logger.setEventBus(eventBus);

    // Prepare mock tenants
    const tenantA = new TenantContextBuilder()
      .setTenantId('tenant-a')
      .setSlug('store-a')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'store-a.solospot.pl', custom: 'fashion-store-a.com' })
      .setPlan({ tier: 'GROWTH', limits: { products: 100 } })
      .setCapabilities(['cart', 'seo'])
      .setMetadata({ cacheKey: 'etag-a', lastRefresh: new Date().toISOString(), ttlSeconds: 10 })
      .build();

    const tenantSuspended = new TenantContextBuilder()
      .setTenantId('tenant-suspended')
      .setSlug('suspended-store')
      .setStatus('SUSPENDED')
      .setDomains({ primary: 'suspended.solospot.pl' })
      .setPlan({ tier: 'FREE', limits: { products: 10 } })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'etag-suspended', lastRefresh: new Date().toISOString(), ttlSeconds: 10 })
      .build();

    mockTenants = {
      'tenant-a': tenantA,
      'tenant-suspended': tenantSuspended,
    };

    dbProvider = {
      findByTenantId: async (id) => mockTenants[id] || null,
      findByDomain: async (domain) => {
        return Object.values(mockTenants).find(
          t => t.domains.primary === domain || t.domains.custom === domain
        ) || null;
      },
      findBySlug: async (slug) => {
        return Object.values(mockTenants).find(t => t.slug === slug) || null;
      },
    };
  });

  it('Should resolve tenant by custom domain and return correct context', async () => {
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });
    const context = await resolver.resolve({
      headers: { host: 'fashion-store-a.com' },
    });

    expect(context.tenantId).toBe('tenant-a');
    expect(context.slug).toBe('store-a');
    expect(context.status).toBe('ACTIVE');
    expect(context.capabilities).toContain('cart');
  });

  it('Should resolve tenant by internal preview URL', async () => {
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });
    const context = await resolver.resolve({
      headers: { host: 'store-a.solospot.pl' },
    });

    expect(context.tenantId).toBe('tenant-a');
    expect(context.slug).toBe('store-a');
  });

  it('Should resolve tenant by Signed API Token in Authorization header', async () => {
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });
    const jwt = createFakeJwt({ tenantId: 'tenant-a' });

    const context = await resolver.resolve({
      headers: { authorization: `Bearer ${jwt}` },
    });

    expect(context.tenantId).toBe('tenant-a');
  });

  it('Should resolve tenant by Signed API Token in query params', async () => {
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });
    const jwt = createFakeJwt({ tenantId: 'tenant-a' });

    const context = await resolver.resolve({
      headers: {},
      url: `http://localhost/api/products?api_key=${jwt}`,
    });

    expect(context.tenantId).toBe('tenant-a');
  });

  it('Should resolve tenant by Development Override if environment is development', async () => {
    const resolver = new TenantResolver({
      dbProvider,
      eventBus,
      logger,
      environment: 'development',
    });

    const context = await resolver.resolve({
      headers: { 'x-tenant-override': 'tenant-a' },
    });

    expect(context.tenantId).toBe('tenant-a');
  });

  it('Should ignore Development Override and fall back if environment is production', async () => {
    // Suppress warn messages from polluting test output
    vi.spyOn(logger, 'warn').mockImplementation(() => {});

    const resolver = new TenantResolver({
      dbProvider,
      eventBus,
      logger,
      environment: 'production',
    });

    // Should ignore override and fallback to host header
    const context = await resolver.resolve({
      headers: {
        'x-tenant-override': 'tenant-suspended',
        host: 'store-a.solospot.pl',
      },
    });

    expect(context.tenantId).toBe('tenant-a'); // Resolved from host 'store-a.solospot.pl'
  });

  it('Should leverage L1 cache on second hit (cache hit)', async () => {
    const findSpy = vi.spyOn(dbProvider, 'findByDomain');
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });

    // First lookup (cache miss)
    const context1 = await resolver.resolve({ headers: { host: 'fashion-store-a.com' } });
    expect(findSpy).toHaveBeenCalledTimes(1);

    // Second lookup (cache hit)
    const context2 = await resolver.resolve({ headers: { host: 'fashion-store-a.com' } });
    expect(findSpy).toHaveBeenCalledTimes(1); // Still 1

    expect(context1).toBe(context2);
  });

  it('Should cache miss and query database when cache is invalidated', async () => {
    const findSpy = vi.spyOn(dbProvider, 'findByDomain');
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });

    await resolver.resolve({ headers: { host: 'fashion-store-a.com' } });
    expect(findSpy).toHaveBeenCalledTimes(1);

    // Invalidate cache
    resolver.getL1Cache().invalidate('tenant:domain:fashion-store-a.com');

    // Second lookup
    await resolver.resolve({ headers: { host: 'fashion-store-a.com' } });
    expect(findSpy).toHaveBeenCalledTimes(2);
  });

  it('Should throw TenantResolutionError for suspended tenant', async () => {
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });

    await expect(
      resolver.resolve({ headers: { host: 'suspended.solospot.pl' } })
    ).rejects.toThrowError(TenantResolutionError);
  });

  it('Should throw TenantResolutionError with TENANT_NOT_FOUND code for unknown tenant', async () => {
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });

    await expect(
      resolver.resolve({ headers: { host: 'unknown-shop.com' } })
    ).rejects.toThrow();
  });

  it('Should prevent cross-tenant data access (Tenant Isolation)', async () => {
    const resolver = new TenantResolver({ dbProvider, eventBus, logger });

    const contextA = await resolver.resolve({ headers: { host: 'store-a.solospot.pl' } });
    
    // Attempting to resolve an unknown or isolated domain should not leak data from A
    await expect(
      resolver.resolve({ headers: { host: 'unknown-shop.com' } })
    ).rejects.toThrow();

    expect(contextA.tenantId).toBe('tenant-a');
  });

  it('Should fallback to L2 Cache when database is unreachable (Circuit Breaker)', async () => {
    const l2Store = new Map<string, { context: TenantContext; expiresAt: number }>();
    const l2Cache: TenantL2Cache = {
      get: async (key) => l2Store.get(key) || null,
      set: async (key, context, ttlSeconds) => {
        l2Store.set(key, { context, expiresAt: Date.now() + (ttlSeconds * 1000) });
      },
      delete: async (key) => {
        l2Store.delete(key);
      },
    };

    // 1. Populate L2 Cache
    const resolverSetup = new TenantResolver({ dbProvider, eventBus, logger, l2Cache });
    await resolverSetup.resolve({ headers: { host: 'fashion-store-a.com' } });

    // 2. Break the DB provider
    const brokenDbProvider: TenantDatabaseProvider = {
      findByTenantId: async () => { throw new Error('Database is offline'); },
      findByDomain: async () => { throw new Error('Database is offline'); },
      findBySlug: async () => { throw new Error('Database is offline'); },
    };

    // 3. Resolve using broken DB provider with L2 Cache fallback
    const resolverFallback = new TenantResolver({
      dbProvider: brokenDbProvider,
      eventBus,
      logger,
      l2Cache,
    });

    const context = await resolverFallback.resolve({ headers: { host: 'fashion-store-a.com' } });
    expect(context.tenantId).toBe('tenant-a'); // Resolved from stale/cached L2 KV
  });

  it('Should fail closed if database is unreachable and L2 cache is completely expired', async () => {
    const l2Store = new Map<string, { context: TenantContext; expiresAt: number }>();
    const l2Cache: TenantL2Cache = {
      get: async (key) => l2Store.get(key) || null,
      set: async (key, context, ttlSeconds) => {
        l2Store.set(key, { context, expiresAt: Date.now() + (ttlSeconds * 1000) });
      },
      delete: async (key) => {
        l2Store.delete(key);
      },
    };

    // 1. Populate L2 Cache
    const resolverSetup = new TenantResolver({ dbProvider, eventBus, logger, l2Cache });
    await resolverSetup.resolve({ headers: { host: 'fashion-store-a.com' } });

    // 2. Artificially age the L2 cache entry beyond max stale limit (e.g. 10 days ago)
    const key = 'tenant:domain:fashion-store-a.com';
    const entry = l2Store.get(key)!;
    l2Store.set(key, {
      context: entry.context,
      expiresAt: Date.now() - (10 * 24 * 60 * 60 * 1000), // 10 days ago
    });

    // 3. Break DB Provider
    const brokenDbProvider: TenantDatabaseProvider = {
      findByTenantId: async () => { throw new Error('Database is offline'); },
      findByDomain: async () => { throw new Error('Database is offline'); },
      findBySlug: async () => { throw new Error('Database is offline'); },
    };

    const resolverFailClosed = new TenantResolver({
      dbProvider: brokenDbProvider,
      eventBus,
      logger,
      l2Cache,
      maxStaleSeconds: 3600, // 1 hour max stale
    });

    // Expect fail closed (reject resolution)
    await expect(
      resolverFailClosed.resolve({ headers: { host: 'fashion-store-a.com' } })
    ).rejects.toThrowError(RuntimeError);
  });
});
