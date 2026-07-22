import { describe, it, expect, beforeEach } from 'vitest';
import { PlatformIdentityRegistry } from '../src/PlatformIdentityRegistry';
import { PlanType, SubscriptionStatus } from '../src/PlatformIdentity';

describe('PlatformIdentityRegistry', () => {
  let registry: PlatformIdentityRegistry;

  beforeEach(() => {
    registry = new PlatformIdentityRegistry();
  });

  describe('registration', () => {
    it('should register and retrieve workspace', () => {
      registry.registerWorkspace({
        id: 'ws-1',
        name: 'Test Workspace',
        organizationId: 'org-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      });

      const ws = registry.getWorkspace('ws-1');
      expect(ws?.name).toBe('Test Workspace');
    });

    it('should register and retrieve tenant', () => {
      registry.registerTenant({
        id: 't-1',
        name: 'Test Tenant',
        workspaceId: 'ws-1',
        slug: 'test-store',
        createdAt: '2026-01-01'
      });

      expect(registry.getTenant('t-1')?.slug).toBe('test-store');
    });
  });

  describe('platform identity', () => {
    it('should resolve complete platform identity', () => {
      registry.registerOrganization({
        id: 'org-1',
        name: 'Test Org',
        createdAt: '2026-01-01'
      });

      registry.registerWorkspace({
        id: 'ws-1',
        name: 'Test Workspace',
        organizationId: 'org-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      });

      registry.registerTenant({
        id: 't-1',
        name: 'Test Store',
        workspaceId: 'ws-1',
        slug: 'test-store',
        createdAt: '2026-01-01'
      });

      registry.registerPlan({
        type: PlanType.FREE,
        name: 'Free',
        limits: { stores: 1, users: 1, bandwidthGb: 10, storageGb: 1, apiCallsPerDay: 1000, aiCreditsPerDay: 100 },
        features: ['builder'],
        priceMonthly: 0
      });

      registry.registerSubscription({
        id: 'sub-1',
        organizationId: 'org-1',
        planType: PlanType.FREE,
        status: SubscriptionStatus.ACTIVE,
        startedAt: '2026-01-01',
        expiresAt: '2027-01-01'
      });

      const identity = registry.getPlatformIdentity('t-1');

      expect(identity?.tenant?.id).toBe('t-1');
      expect(identity?.plan?.type).toBe(PlanType.FREE);
      expect(identity?.featureFlags).toBeDefined();
    });
  });

  describe('plan limits', () => {
    it('should return plan limits for tenant', () => {
      registry.registerOrganization({
        id: 'org-1',
        name: 'Org',
        createdAt: '2026-01-01'
      });

      registry.registerWorkspace({
        id: 'ws-1',
        name: 'WS',
        organizationId: 'org-1',
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      });

      registry.registerTenant({
        id: 't-1',
        name: 'Tenant',
        workspaceId: 'ws-1',
        slug: 'store',
        createdAt: '2026-01-01'
      });

      registry.registerPlan({
        type: PlanType.STARTER,
        name: 'Starter',
        limits: { stores: 5, users: 3, bandwidthGb: 100, storageGb: 10, apiCallsPerDay: 10000, aiCreditsPerDay: 1000 },
        features: [],
        priceMonthly: 29
      });

      registry.registerSubscription({
        id: 'sub-1',
        organizationId: 'org-1',
        planType: PlanType.STARTER,
        status: SubscriptionStatus.ACTIVE,
        startedAt: '2026-01-01',
        expiresAt: '2027-01-01'
      });

      const identity = registry.getPlatformIdentity('t-1');
      expect(identity?.quotas.stores).toBe(5);
    });
  });
});