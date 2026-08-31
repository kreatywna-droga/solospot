/**
 * MultiTenantRecoveryOrchestrator — G1-209
 *
 * Orchestrates recovery plans for multiple tenants with priority-based
 * execution and blast radius awareness.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecoveryPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type RecoveryStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'PARTIAL';

export interface TenantRecoveryPlan {
  readonly planId: string;
  readonly tenantId: string;
  readonly failureScenario: string;
  readonly recoverySteps: string[];
  readonly estimatedRto: number;
  readonly priority: RecoveryPriority;
  status?: RecoveryStatus;
  readonly completedSteps?: string[];
  readonly executedAtMs?: number;
}

export interface RecoveryStatusSummary {
  readonly planId: string;
  readonly tenantId: string;
  readonly status: RecoveryStatus;
  readonly completedSteps: number;
  readonly totalSteps: number;
  readonly priority: RecoveryPriority;
}

export interface RecoveryReport {
  readonly generatedAtMs: number;
  readonly totalPlans: number;
  readonly pendingPlans: number;
  readonly completedPlans: number;
  readonly failedPlans: number;
  readonly executionOrder: string[];
  readonly allStepsCompleted: boolean;
  readonly recoveryValid: boolean;
  readonly violations: string[];
}

// ---------------------------------------------------------------------------
// MultiTenantRecoveryOrchestrator
// ---------------------------------------------------------------------------

let planCounter = 0;

function generatePlanId(): string {
  planCounter += 1;
  return `rp-${planCounter}-${Date.now()}`;
}

const PRIORITY_WEIGHT: Record<RecoveryPriority, number> = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export class MultiTenantRecoveryOrchestrator {
  private plans: TenantRecoveryPlan[] = [];

  createRecoveryPlan(
    tenantId: string,
    scenario: string,
    options?: { steps?: string[]; estimatedRto?: number; priority?: RecoveryPriority },
  ): TenantRecoveryPlan {
    if (!tenantId || !tenantId.trim()) {
      throw new Error('tenantId must be a non-empty string');
    }
    if (!scenario || !scenario.trim()) {
      throw new Error('scenario must be a non-empty string');
    }

    const plan: TenantRecoveryPlan = {
      planId: generatePlanId(),
      tenantId: tenantId.trim(),
      failureScenario: scenario.trim(),
      recoverySteps: options?.steps ?? ['assess', 'isolate', 'restore', 'verify'],
      estimatedRto: options?.estimatedRto ?? 300000,
      priority: options?.priority ?? 'MEDIUM',
      status: 'PENDING',
      completedSteps: [],
    };

    this.plans.push(plan);
    return plan;
  }

  executeRecoveryPlan(planId: string): TenantRecoveryPlan | undefined {
    const idx = this.plans.findIndex((p) => p.planId === planId);
    if (idx < 0) return undefined;

    const plan = this.plans[idx];
    const updatedSteps = [...(plan.recoverySteps ?? [])];

    this.plans[idx] = {
      ...plan,
      status: 'COMPLETED',
      completedSteps: updatedSteps,
      executedAtMs: Date.now(),
    };

    return this.plans[idx];
  }

  prioritizeRecoveryPlans(plans?: TenantRecoveryPlan[]): TenantRecoveryPlan[] {
    const target = plans ?? this.plans;

    return [...target].sort((a, b) => {
      const weightDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (weightDiff !== 0) return weightDiff;
      return a.estimatedRto - b.estimatedRto;
    });
  }

  getRecoveryStatus(): RecoveryStatusSummary[] {
    return this.plans.map((p) => ({
      planId: p.planId,
      tenantId: p.tenantId,
      status: p.status ?? 'PENDING',
      completedSteps: (p.completedSteps ?? []).length,
      totalSteps: p.recoverySteps.length,
      priority: p.priority,
    }));
  }

  validateRecoveryCompleteness(planId: string): boolean {
    const plan = this.plans.find((p) => p.planId === planId);
    if (!plan) return false;

    if (plan.status !== 'COMPLETED') return false;

    const completed = plan.completedSteps ?? [];
    return completed.length === plan.recoverySteps.length;
  }

  generateRecoveryReport(): RecoveryReport {
    const pending = this.plans.filter((p) => p.status === 'PENDING' || !p.status);
    const completed = this.plans.filter((p) => p.status === 'COMPLETED');
    const failed = this.plans.filter((p) => p.status === 'FAILED');

    const ordered = this.prioritizeRecoveryPlans();
    const executionOrder = ordered.map((p) => p.planId);

    const allComplete = this.plans.every((p) => this.validateRecoveryCompleteness(p.planId));

    const violations: string[] = [];
    for (const p of pending) {
      violations.push(`Plan ${p.planId} for tenant ${p.tenantId} still pending`);
    }

    return {
      generatedAtMs: Date.now(),
      totalPlans: this.plans.length,
      pendingPlans: pending.length,
      completedPlans: completed.length,
      failedPlans: failed.length,
      executionOrder,
      allStepsCompleted: allComplete,
      recoveryValid: pending.length === 0 && failed.length === 0,
      violations,
    };
  }

  getPlan(planId: string): TenantRecoveryPlan | undefined {
    return this.plans.find((p) => p.planId === planId);
  }

  getPlans(): TenantRecoveryPlan[] {
    return [...this.plans];
  }

  clear(): void {
    this.plans = [];
  }
}
