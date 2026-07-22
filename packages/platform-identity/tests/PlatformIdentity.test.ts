import { describe, it, expect } from 'vitest';
import { PlanType, EnvironmentType, SubscriptionStatus, LicenseStatus, FeatureState } from '../src/PlatformIdentity';
import { Plan, Workspace, Organization, Tenant } from '../src/PlatformIdentity';

describe('PlatformIdentity', () => {
  describe('enum values', () => {
    it('should have plan types', () => {
      expect(PlanType.FREE).toBe('free');
      expect(PlanType.STARTER).toBe('starter');
      expect(PlanType.BUSINESS).toBe('business');
      expect(PlanType.ENTERPRISE).toBe('enterprise');
    });

    it('should have environment types', () => {
      expect(EnvironmentType.DEVELOPMENT).toBe('development');
      expect(EnvironmentType.PRODUCTION).toBe('production');
    });
  });

  describe('plan contracts', () => {
    it('should define plan limits', () => {
      const freePlan: Plan = {
        type: PlanType.FREE,
        name: 'Free',
        limits: {
          stores: 1,
          users: 1,
          bandwidthGb: 10,
          storageGb: 1,
          apiCallsPerDay: 1000,
          aiCreditsPerDay: 100
        },
        features: ['builder', 'marketplace'],
        priceMonthly: 0
      };

      expect(freePlan.limits.stores).toBe(1);
    });
  });
});