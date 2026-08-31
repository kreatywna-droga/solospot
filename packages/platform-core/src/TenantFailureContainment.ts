/**
 * TenantFailureContainment — G1-208
 *
 * Ensures failures in one tenant are contained within that tenant's boundary
 * and do not cascade to other tenants.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FailureSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TenantFailureEvent {
  readonly failureId: string;
  readonly tenantId: string;
  readonly severity: FailureSeverity;
  readonly component: string;
  readonly errorMessage: string;
  readonly occurredAtMs: number;
  readonly containedAtMs?: number;
  readonly blastRadius: number;
}

export interface ContainmentResult {
  readonly failureId: string;
  readonly contained: boolean;
  readonly containedAtMs: number;
  readonly affectedTenants: string[];
}

export interface CascadingFailure {
  readonly sourceFailure: TenantFailureEvent;
  readonly affectedFailures: TenantFailureEvent[];
  readonly cascadePath: string[];
}

export interface ContainmentReport {
  readonly generatedAtMs: number;
  readonly totalFailures: number;
  readonly containedFailures: number;
  readonly uncontainedFailures: number;
  readonly cascadingFailures: CascadingFailure[];
  readonly containmentRate: number;
  readonly containmentValid: boolean;
  readonly violations: string[];
}

// ---------------------------------------------------------------------------
// TenantFailureContainmentEngine
// ---------------------------------------------------------------------------

let failureCounter = 0;

function generateFailureId(): string {
  failureCounter += 1;
  return `fail-${failureCounter}-${Date.now()}`;
}

export class TenantFailureContainmentEngine {
  private failures: TenantFailureEvent[] = [];

  reportFailure(failure: Omit<TenantFailureEvent, 'failureId' | 'occurredAtMs'>): TenantFailureEvent {
    if (!failure.tenantId || !failure.tenantId.trim()) {
      throw new Error('tenantId must be a non-empty string');
    }

    const event: TenantFailureEvent = {
      ...failure,
      failureId: generateFailureId(),
      occurredAtMs: Date.now(),
    };

    this.failures.push(event);
    return event;
  }

  containFailure(failureId: string): ContainmentResult {
    const failure = this.failures.find((f) => f.failureId === failureId);
    if (!failure) {
      return {
        failureId,
        contained: false,
        containedAtMs: Date.now(),
        affectedTenants: [],
      };
    }

    const idx = this.failures.findIndex((f) => f.failureId === failureId);
    if (idx >= 0) {
      this.failures[idx] = {
        ...this.failures[idx],
        containedAtMs: Date.now(),
      };
    }

    return {
      failureId,
      contained: true,
      containedAtMs: Date.now(),
      affectedTenants: [failure.tenantId],
    };
  }

  assessBlastRadius(failure: TenantFailureEvent): number {
    const severityMultiplier: Record<FailureSeverity, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 4,
      CRITICAL: 8,
    };

    const base = failure.blastRadius;
    const multiplier = severityMultiplier[failure.severity];

    return base * multiplier;
  }

  detectCascadingFailures(failures?: TenantFailureEvent[]): CascadingFailure[] {
    const target = failures ?? this.failures;
    const cascades: CascadingFailure[] = [];

    const uncontained = target.filter((f) => !f.containedAtMs);

    for (const source of uncontained) {
      const sameComponent = target.filter(
        (f) =>
          f.failureId !== source.failureId &&
          f.component === source.component &&
          f.tenantId !== source.tenantId &&
          Math.abs(f.occurredAtMs - source.occurredAtMs) < 60000,
      );

      if (sameComponent.length > 0) {
        cascades.push({
          sourceFailure: source,
          affectedFailures: sameComponent,
          cascadePath: [source.tenantId, ...sameComponent.map((f) => f.tenantId)],
        });
      }
    }

    return cascades;
  }

  validateContainment(failure: TenantFailureEvent): boolean {
    if (!failure.containedAtMs) return false;
    if (failure.containedAtMs < failure.occurredAtMs) return false;

    const elapsed = failure.containedAtMs - failure.occurredAtMs;
    const maxContainmentMs = this.getMaxContainmentTime(failure.severity);

    return elapsed <= maxContainmentMs;
  }

  private getMaxContainmentTime(severity: FailureSeverity): number {
    switch (severity) {
      case 'LOW':
        return 300000;
      case 'MEDIUM':
        return 120000;
      case 'HIGH':
        return 60000;
      case 'CRITICAL':
        return 30000;
    }
  }

  generateContainmentReport(): ContainmentReport {
    const contained = this.failures.filter((f) => f.containedAtMs);
    const uncontained = this.failures.filter((f) => !f.containedAtMs);
    const cascades = this.detectCascadingFailures();

    const violations: string[] = [];
    for (const f of uncontained) {
      violations.push(`Failure ${f.failureId} (${f.severity}) in ${f.tenantId} not contained`);
    }
    for (const c of cascades) {
      violations.push(
        `Cascading failure from ${c.sourceFailure.tenantId} affecting ${c.affectedFailures.map((f) => f.tenantId).join(', ')}`,
      );
    }

    const total = this.failures.length;

    return {
      generatedAtMs: Date.now(),
      totalFailures: total,
      containedFailures: contained.length,
      uncontainedFailures: uncontained.length,
      cascadingFailures: cascades,
      containmentRate: total > 0 ? contained.length / total : 1,
      containmentValid: uncontained.length === 0 && cascades.length === 0,
      violations,
    };
  }

  getFailures(): TenantFailureEvent[] {
    return [...this.failures];
  }

  clear(): void {
    this.failures = [];
  }
}
