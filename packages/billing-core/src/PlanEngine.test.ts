import { PlanEngine } from './PlanEngine';
import { BillingCycle } from './BillingDomain';
import { PlanType } from '../../platform-identity/src/PlatformIdentity';
import { describe, it, expect } from 'vitest';

describe('PlanEngine', () => {
  const engine = new PlanEngine();

  it('should return free plan', () => {
    const plan = engine.getPlan(PlanType.FREE);
    expect(plan?.type).toBe(PlanType.FREE);
    expect(plan?.priceMonthly).toBe(0);
  });

  it('should return starter plan', () => {
    const plan = engine.getPlan(PlanType.STARTER);
    expect(plan?.type).toBe(PlanType.STARTER);
    expect(plan?.priceMonthly).toBe(29);
  });

  it('should return business plan', () => {
    const plan = engine.getPlan(PlanType.BUSINESS);
    expect(plan?.type).toBe(PlanType.BUSINESS);
    expect(plan?.priceMonthly).toBe(99);
  });

  it('should calculate monthly price', () => {
    const price = engine.calculatePrice(PlanType.STARTER, BillingCycle.MONTHLY);
    expect(price).toBe(29);
  });

  it('should calculate yearly price with 2 months discount', () => {
    const price = engine.calculatePrice(PlanType.STARTER, BillingCycle.YEARLY);
    expect(price).toBe(290); // 10 months paid instead of 12
  });
});