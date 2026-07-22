import { PlanType, Plan } from '../../platform-identity/src/PlatformIdentity';
import { BillingCycle } from './BillingDomain';

export class PlanEngine {
  private plans: Map<PlanType, Plan> = new Map();

  constructor() {
    this.initializeDefaultPlans();
  }

  private initializeDefaultPlans(): void {
    this.plans.set(PlanType.FREE, {
      type: PlanType.FREE,
      name: 'Free',
      limits: { stores: 1, users: 1, bandwidthGb: 10, storageGb: 1, apiCallsPerDay: 1000, aiCreditsPerDay: 100 },
      features: ['builder', 'marketplace'],
      priceMonthly: 0
    });

    this.plans.set(PlanType.STARTER, {
      type: PlanType.STARTER,
      name: 'Starter',
      limits: { stores: 5, users: 3, bandwidthGb: 100, storageGb: 10, apiCallsPerDay: 10000, aiCreditsPerDay: 1000 },
      features: ['builder', 'marketplace', 'ai', 'customDomains'],
      priceMonthly: 29,
      priceYearly: 290
    });

    this.plans.set(PlanType.BUSINESS, {
      type: PlanType.BUSINESS,
      name: 'Business',
      limits: { stores: 25, users: 10, bandwidthGb: 500, storageGb: 50, apiCallsPerDay: 100000, aiCreditsPerDay: 10000 },
      features: ['builder', 'marketplace', 'ai', 'customDomains', 'webhooks', 'commerce'],
      priceMonthly: 99,
      priceYearly: 990
    });

    this.plans.set(PlanType.ENTERPRISE, {
      type: PlanType.ENTERPRISE,
      name: 'Enterprise',
      limits: { stores: 999999, users: 999999, bandwidthGb: 999999, storageGb: 999999, apiCallsPerDay: 999999999, aiCreditsPerDay: 999999999 },
      features: ['builder', 'marketplace', 'ai', 'customDomains', 'webhooks', 'commerce', 'media'],
      priceMonthly: 299,
      priceYearly: 2990
    });
  }

  getPlan(planType: PlanType): Plan | undefined {
    return this.plans.get(planType);
  }

  calculatePrice(planType: PlanType, cycle: BillingCycle): number {
    const plan = this.plans.get(planType);
    if (!plan) return 0;

    if (cycle === BillingCycle.MONTHLY) return plan.priceMonthly || 0;
    if (cycle === BillingCycle.YEARLY) return plan.priceYearly || (plan.priceMonthly || 0) * 10;

    return 0;
  }

  addCustomPlan(plan: Plan): void {
    this.plans.set(plan.type, plan);
  }
}