import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Platform } from '../bootstrap/RuntimeBootstrap';
import { PlatformEventBusImpl } from '../events/PlatformEventBus';
import { createMockRequest, createMockResponse } from '../mocks/http';
import { TenantDatabaseProvider } from './TenantResolver';
import { TenantContext } from './TenantTypes';
import { TenantContextBuilder } from './TenantContextBuilder';
import { ConfigurationManager } from '../config/PlatformConfig';

describe('Runtime Request Integration Flow', () => {
  let platform: Platform;
  let eventBus: PlatformEventBusImpl;
  let dbProvider: TenantDatabaseProvider;
  let mockTenants: Record<string, TenantContext>;
  let originalEnv: string | undefined;

  function createFakeJwt(payload: Record<string, any>): string {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payloadStr = Buffer.from(JSON.stringify(payload)).toString('base64');
    return `${header}.${payloadStr}.fake_signature`;
  }

  beforeEach(async () => {
    originalEnv = process.env.NODE_ENV;
    (process.env as any).NODE_ENV = 'development';
    ConfigurationManager.resetInstanceForTesting();
    const tenantA = new TenantContextBuilder()
      .setTenantId('store_fashion_001')
      .setSlug('fashion')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'fashion.localhost' })
      .setPlan({ tier: 'GROWTH', limits: {} })
      .setCapabilities(['cart', 'seo'])
      .setMetadata({ cacheKey: 'etag-a', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    const tenantB = new TenantContextBuilder()
      .setTenantId('store_b')
      .setSlug('books')
      .setStatus('ACTIVE')
      .setDomains({ primary: 'books.localhost' })
      .setPlan({ tier: 'FREE', limits: {} })
      .setCapabilities([])
      .setMetadata({ cacheKey: 'etag-b', lastRefresh: new Date().toISOString(), ttlSeconds: 300 })
      .build();

    mockTenants = {
      'store_fashion_001': tenantA,
      'store_b': tenantB,
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

    platform = new Platform();
    platform.setDatabaseProvider(dbProvider);
    const context = await platform.bootstrap();
    expect(context.healthStatus).toBe('READY');
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
    ConfigurationManager.resetInstanceForTesting();
    vi.restoreAllMocks();
  });

  it('Should successfully process request, resolve tenant, emit event and inject tracing headers', async () => {
    const tenantResolvedSpy = vi.fn();
    eventBus = platform.getEventBus();
    eventBus.subscribe('Tenant.Resolved', tenantResolvedSpy);

    const req = createMockRequest({
      url: 'http://fashion.localhost/api/test-context',
      headers: {
        'Host': 'fashion.localhost',
        'X-Correlation-Id': 'req_test_flow_999'
      }
    });
    const res = createMockResponse();

    await platform.handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.getHeader('X-Correlation-Id')).toBe('req_test_flow_999');
    expect(res.getHeader('X-Tenant-Id')).toBe('store_fashion_001');
    expect(Number(res.getHeader('X-Execution-Time-Ms'))).toBeLessThan(100);

    expect(tenantResolvedSpy).toHaveBeenCalledTimes(1);
    const event = tenantResolvedSpy.mock.calls[0][0];
    expect(event.correlationId).toBe('req_test_flow_999');
    expect(event.tenantId).toBe('store_fashion_001');
    expect(event.payload.slug).toBe('fashion');
  });

  it('Should return 404 and emit Tenant.ResolutionFailed when host is unknown', async () => {
    const resolutionFailedSpy = vi.fn();
    eventBus = platform.getEventBus();
    eventBus.subscribe('Tenant.ResolutionFailed', resolutionFailedSpy);

    const req = createMockRequest({
      url: 'http://unknown-host.com/api/test-context',
      headers: {
        'Host': 'unknown-host.com',
        'X-Correlation-Id': 'req_failed_flow_111'
      }
    });
    const res = createMockResponse();

    await platform.handleRequest(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.getHeader('X-Correlation-Id')).toBe('req_failed_flow_111');
    expect(res.getHeader('X-Tenant-Id')).toBeUndefined();

    expect(resolutionFailedSpy).toHaveBeenCalledTimes(1);
    const event = resolutionFailedSpy.mock.calls[0][0];
    expect(event.correlationId).toBe('req_failed_flow_111');
    expect(event.payload.lookupKey).toBe('domain:unknown-host.com');
  });

  it('Should reject request with 403 Forbidden when trying to access host of Tenant A with credentials of Tenant B (Cross Tenant Attempt)', async () => {
    const jwt = createFakeJwt({ tenantId: 'store_b' });
    
    const req = createMockRequest({
      url: 'http://fashion.localhost/api/secure-action',
      headers: {
        'Host': 'fashion.localhost',
        'X-Correlation-Id': 'req_cross_attempt_403',
        'Authorization': `Bearer ${jwt}`
      }
    });
    const res = createMockResponse();

    await platform.handleRequest(req, res);

    expect(res.statusCode).toBe(403);
  });
});
