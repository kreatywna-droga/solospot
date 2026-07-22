import { describe, it, expect, beforeEach } from 'vitest';
import { AuthorizationEngine, UserContext } from '../auth';
import { RateLimiter, RequestGuard, RateLimitException } from './';

describe('Tenant Isolation and Security Validation', () => {
  const tenantA = 'tenant-uuid-aaaa';
  const tenantB = 'tenant-uuid-bbbb';

  // Users definition
  const superAdmin: UserContext = { id: 'usr-super', role: 'SUPER_ADMIN' };
  const operator: UserContext = { id: 'usr-operator', role: 'PLATFORM_OPERATOR' };
  const tenantAdminA: UserContext = { id: 'usr-admin-a', role: 'TENANT_ADMIN', tenantId: tenantA };
  const tenantAdminB: UserContext = { id: 'usr-admin-b', role: 'TENANT_ADMIN', tenantId: tenantB };
  const customerA: UserContext = { id: 'usr-cust-a', role: 'CUSTOMER', tenantId: tenantA };
  const customerB: UserContext = { id: 'usr-cust-b', role: 'CUSTOMER', tenantId: tenantB };

  beforeEach(() => {
    RateLimiter.clear();
  });

  describe('Authorization Rules (RBAC + Tenant Isolation)', () => {
    it('SUPER_ADMIN and PLATFORM_OPERATOR can see all tenants', () => {
      expect(AuthorizationEngine.can(superAdmin, 'VIEW_ALL_TENANTS')).toBe(true);
      expect(AuthorizationEngine.can(operator, 'VIEW_ALL_TENANTS')).toBe(true);
      
      // Tenant Admins cannot view all tenants
      expect(AuthorizationEngine.can(tenantAdminA, 'VIEW_ALL_TENANTS')).toBe(false);
      expect(AuthorizationEngine.can(customerA, 'VIEW_ALL_TENANTS')).toBe(false);
    });

    it('TENANT_ADMIN can manage own store, but not other stores', () => {
      expect(AuthorizationEngine.can(tenantAdminA, 'MANAGE_TENANT_STORE', tenantA)).toBe(true);
      expect(AuthorizationEngine.can(tenantAdminA, 'MANAGE_TENANT_STORE', tenantB)).toBe(false);

      // Super admin can manage any store
      expect(AuthorizationEngine.can(superAdmin, 'MANAGE_TENANT_STORE', tenantA)).toBe(true);
      expect(AuthorizationEngine.can(superAdmin, 'MANAGE_TENANT_STORE', tenantB)).toBe(true);
    });

    it('TENANT_ADMIN can view own timeline, but not other timelines', () => {
      expect(AuthorizationEngine.can(tenantAdminA, 'VIEW_TENANT_TIMELINE', tenantA)).toBe(true);
      expect(AuthorizationEngine.can(tenantAdminA, 'VIEW_TENANT_TIMELINE', tenantB)).toBe(false);
    });

    it('CUSTOMER can place orders and view own orders on their tenant, but not on others', () => {
      expect(AuthorizationEngine.can(customerA, 'PLACE_ORDER', tenantA)).toBe(true);
      expect(AuthorizationEngine.can(customerA, 'VIEW_OWN_ORDERS', tenantA)).toBe(true);
      
      // Cross-tenant block
      expect(AuthorizationEngine.can(customerA, 'VIEW_OWN_ORDERS', tenantB)).toBe(false);
    });
  });

  describe('Rate Limiting (RateLimiter & RequestGuard)', () => {
    it('Should allow requests within limit and block when exceeded (Webhook: 100 req/min)', () => {
      // 100 requests should pass
      for (let i = 0; i < 100; i++) {
        expect(() => RequestGuard.guardWebhook('onekoszyk')).not.toThrow();
      }

      // 101st request must throw RateLimitException
      expect(() => RequestGuard.guardWebhook('onekoszyk')).toThrow(RateLimitException);
    });

    it('Should allow requests within limit and block when exceeded (Mission Control: 60 req/min)', () => {
      // 60 requests should pass
      for (let i = 0; i < 60; i++) {
        expect(() => RequestGuard.guardMissionControl('usr-operator-1')).not.toThrow();
      }

      // 61st request must throw RateLimitException
      expect(() => RequestGuard.guardMissionControl('usr-operator-1')).toThrow(RateLimitException);
    });

    it('Rate limiting must remain isolated per key/user', () => {
      // Consume limit for user 1
      for (let i = 0; i < 60; i++) {
        RequestGuard.guardMissionControl('usr-1');
      }
      expect(() => RequestGuard.guardMissionControl('usr-1')).toThrow(RateLimitException);

      // User 2 should still be allowed
      expect(() => RequestGuard.guardMissionControl('usr-2')).not.toThrow();
    });
  });
});
