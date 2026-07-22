import { Subscription, PlanType, SubscriptionStatus, LicenseStatus } from '../../platform-identity/src/PlatformIdentity';
import { PlanEngine } from './PlanEngine';
import { BillingCycle } from './BillingDomain';

export interface SubscriptionChange {
  type: 'upgrade' | 'downgrade' | 'cancel' | 'renew';
  newPlan?: PlanType;
  effectiveDate: string;
}

export class SubscriptionEngine {
  constructor(private planEngine: PlanEngine) {}

  createSubscription(params: {
    organizationId: string;
    planType: PlanType;
    cycle: BillingCycle;
    trialDays?: number;
  }): Subscription {
    const now = new Date().toISOString();
    const expiresAt = params.trialDays
      ? new Date(Date.now() + params.trialDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    return {
      id: `sub-${Date.now()}`,
      organizationId: params.organizationId,
      planType: params.planType,
      status: params.trialDays ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE,
      startedAt: now,
      trialEndsAt: params.trialDays ? expiresAt : undefined,
      expiresAt
    };
  }

  activateSubscription(subscription: Subscription): Subscription {
    return { ...subscription, status: SubscriptionStatus.ACTIVE };
  }

  cancelSubscription(subscription: Subscription): Subscription {
    return { ...subscription, status: SubscriptionStatus.CANCELED };
  }

  applyGracePeriod(subscription: Subscription, graceDays: number): Subscription {
    return { ...subscription, status: SubscriptionStatus.SUSPENDED };
  }

  changePlan(subscription: Subscription, newPlanType: PlanType): SubscriptionChange {
    const currentPlan = this.planEngine.getPlan(subscription.planType);
    const newPlan = this.planEngine.getPlan(newPlanType);

    return {
      type: newPlanType > subscription.planType ? 'upgrade' : 'downgrade',
      newPlan: newPlanType,
      effectiveDate: new Date().toISOString()
    };
  }

  calculateRenewalPrice(subscription: Subscription, cycle: BillingCycle): number {
    return this.planEngine.calculatePrice(subscription.planType, cycle);
  }
}