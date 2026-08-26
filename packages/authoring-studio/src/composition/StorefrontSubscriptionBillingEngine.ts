/**
 * StorefrontSubscriptionBillingEngine.ts — Sprint G1-113 Subscription Billing & Lifecycle Engine (Night Shift Level 75)
 *
 * Provides pure TypeScript, headless recurring subscription plan lifecycle management,
 * trial conversions, billing interval cycles (WEEKLY, MONTHLY, ANNUALLY), status transitions
 * (ACTIVE, PAST_DUE, PAUSED, CANCELED, EXPIRED), and dunning retry tracking.
 *
 * External subscription billing gateways (Stripe Billing, Chargebee) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type SubscriptionBillingInterval = 'WEEKLY' | 'MONTHLY' | 'ANNUALLY';

export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'PAUSED' | 'CANCELED' | 'EXPIRED';

export interface SubscriptionPlanDTO {
  readonly planId: string;
  readonly planName: string;
  readonly recurringAmount: number;
  readonly currency: string;
  readonly interval: SubscriptionBillingInterval;
  readonly trialPeriodDays: number;
}

export interface CustomerSubscriptionDTO {
  readonly subscriptionId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly planId: string;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStartMs: number;
  readonly currentPeriodEndMs: number;
  readonly cancelAtPeriodEnd: boolean;
  readonly failedBillingAttempts: number;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface SubscriptionEngineStateDTO {
  readonly tenantId: string;
  readonly plans: Record<string, SubscriptionPlanDTO>;
  readonly subscriptions: Record<string, CustomerSubscriptionDTO>;
}

export class StorefrontSubscriptionBillingEngine {
  private readonly tenantId: string;
  private plans: Map<string, SubscriptionPlanDTO> = new Map();
  private subscriptions: Map<string, CustomerSubscriptionDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers a recurring subscription plan.
   */
  public registerPlan(plan: SubscriptionPlanDTO): SubscriptionPlanDTO {
    if (!plan.planId || !plan.planName || plan.recurringAmount < 0) {
      throw new Error('Valid planId, planName, and non-negative recurringAmount are required');
    }

    const dto: SubscriptionPlanDTO = {
      ...plan,
      planId: plan.planId.trim(),
      planName: plan.planName.trim(),
      currency: plan.currency ? plan.currency.trim().toUpperCase() : 'USD'
    };

    this.plans.set(dto.planId, dto);
    return dto;
  }

  /**
   * Creates a new customer subscription starting either in TRIALING or ACTIVE state.
   */
  public createSubscription(params: {
    subscriptionId: string;
    customerId: string;
    planId: string;
  }): CustomerSubscriptionDTO {
    const { subscriptionId, customerId, planId } = params;

    if (!subscriptionId || !customerId || !planId) {
      throw new Error('subscriptionId, customerId, and planId are required');
    }

    const plan = this.plans.get(planId.trim());
    if (!plan) {
      throw new Error(`Subscription plan ${planId} not found`);
    }

    const now = Date.now();
    const hasTrial = plan.trialPeriodDays > 0;
    const status: SubscriptionStatus = hasTrial ? 'TRIALING' : 'ACTIVE';

    const periodDurationMs = hasTrial
      ? plan.trialPeriodDays * 86400000
      : this.calculateIntervalDurationMs(plan.interval);

    const dto: CustomerSubscriptionDTO = {
      subscriptionId: subscriptionId.trim(),
      tenantId: this.tenantId,
      customerId: customerId.trim(),
      planId: plan.planId,
      status,
      currentPeriodStartMs: now,
      currentPeriodEndMs: now + periodDurationMs,
      cancelAtPeriodEnd: false,
      failedBillingAttempts: 0,
      createdAtMs: now,
      updatedAtMs: now
    };

    this.subscriptions.set(dto.subscriptionId, dto);
    return dto;
  }

  /**
   * Processes a subscription billing renewal cycle or dunning failure state transition.
   */
  public processBillingCycle(subscriptionId: string, paymentSuccess: boolean): CustomerSubscriptionDTO {
    const sub = this.subscriptions.get(subscriptionId.trim());
    if (!sub) {
      throw new Error(`Subscription ${subscriptionId} not found`);
    }

    const plan = this.plans.get(sub.planId);
    if (!plan) {
      throw new Error(`Plan ${sub.planId} not found`);
    }

    const now = Date.now();

    if (paymentSuccess) {
      const nextDurationMs = this.calculateIntervalDurationMs(plan.interval);
      const updated: CustomerSubscriptionDTO = {
        ...sub,
        status: sub.cancelAtPeriodEnd ? 'CANCELED' : 'ACTIVE',
        currentPeriodStartMs: now,
        currentPeriodEndMs: now + nextDurationMs,
        failedBillingAttempts: 0,
        updatedAtMs: now
      };
      this.subscriptions.set(sub.subscriptionId, updated);
      return updated;
    } else {
      const failedCount = sub.failedBillingAttempts + 1;
      const status: SubscriptionStatus = failedCount >= 3 ? 'EXPIRED' : 'PAST_DUE';
      const updated: CustomerSubscriptionDTO = {
        ...sub,
        status,
        failedBillingAttempts: failedCount,
        updatedAtMs: now
      };
      this.subscriptions.set(sub.subscriptionId, updated);
      return updated;
    }
  }

  private calculateIntervalDurationMs(interval: SubscriptionBillingInterval): number {
    switch (interval) {
      case 'WEEKLY':
        return 7 * 86400000;
      case 'MONTHLY':
        return 30 * 86400000;
      case 'ANNUALLY':
        return 365 * 86400000;
      default:
        return 30 * 86400000;
    }
  }

  public getSubscription(subscriptionId: string): CustomerSubscriptionDTO | undefined {
    return this.subscriptions.get(subscriptionId.trim());
  }

  public getPlan(planId: string): SubscriptionPlanDTO | undefined {
    return this.plans.get(planId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): SubscriptionEngineStateDTO {
    const planRecord: Record<string, SubscriptionPlanDTO> = {};
    this.plans.forEach((val, key) => {
      planRecord[key] = val;
    });

    const subRecord: Record<string, CustomerSubscriptionDTO> = {};
    this.subscriptions.forEach((val, key) => {
      subRecord[key] = val;
    });

    return {
      tenantId: this.tenantId,
      plans: planRecord,
      subscriptions: subRecord
    };
  }

  public importState(state: SubscriptionEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.plans.clear();
    this.subscriptions.clear();

    Object.entries(state.plans || {}).forEach(([k, v]) => {
      this.plans.set(k, v);
    });
    Object.entries(state.subscriptions || {}).forEach(([k, v]) => {
      this.subscriptions.set(k, v);
    });
  }
}
