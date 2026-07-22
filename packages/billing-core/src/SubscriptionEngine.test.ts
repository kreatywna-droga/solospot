import { SubscriptionEngine } from './SubscriptionEngine';
import { PlanEngine } from './PlanEngine';
import { BillingCycle } from './BillingDomain';
import { PlanType, SubscriptionStatus } from '../../platform-identity/src/PlatformIdentity';
import { describe, it, expect } from 'vitest';

describe('SubscriptionEngine', () => {
  const planEngine = new PlanEngine();
  const engine = new SubscriptionEngine(planEngine);

  it('should create subscription with trial', () => {
    const sub = engine.createSubscription({
      organizationId: 'org-1',
      planType: PlanType.STARTER,
      cycle: BillingCycle.MONTHLY,
      trialDays: 14
    });
    expect(sub.status).toBe(SubscriptionStatus.TRIAL);
    expect(sub.planType).toBe(PlanType.STARTER);
    expect(sub.trialEndsAt).toBeDefined();
  });

  it('should create subscription without trial', () => {
    const sub = engine.createSubscription({
      organizationId: 'org-2',
      planType: PlanType.BUSINESS,
      cycle: BillingCycle.MONTHLY
    });
    expect(sub.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('should activate subscription', () => {
    const sub = { ...engine.createSubscription({ organizationId: 'org-3', planType: PlanType.FREE, cycle: BillingCycle.MONTHLY }) };
    const activated = engine.activateSubscription(sub);
    expect(activated.status).toBe(SubscriptionStatus.ACTIVE);
  });

  it('should cancel subscription', () => {
    const sub = { ...engine.createSubscription({ organizationId: 'org-4', planType: PlanType.STARTER, cycle: BillingCycle.MONTHLY }) };
    const canceled = engine.cancelSubscription(sub);
    expect(canceled.status).toBe(SubscriptionStatus.CANCELED);
  });

  it('should apply grace period', () => {
    const sub = { ...engine.createSubscription({ organizationId: 'org-5', planType: PlanType.BUSINESS, cycle: BillingCycle.MONTHLY }) };
    const suspended = engine.applyGracePeriod(sub, 7);
    expect(suspended.status).toBe(SubscriptionStatus.SUSPENDED);
  });
});