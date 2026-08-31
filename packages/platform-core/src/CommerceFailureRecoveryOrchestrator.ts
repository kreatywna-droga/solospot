/**
 * CommerceFailureRecoveryOrchestrator — G1-199
 *
 * Orchestrates failure detection, strategy selection, and recovery execution
 * across the commerce domain.
 */

export interface CommerceFailureScenario {
  readonly scenarioId: string;
  readonly domain: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  readonly description: string;
  readonly affectedComponents: ReadonlyArray<string>;
  readonly recoveryStrategy: string;
}

export interface SystemState {
  readonly components: ReadonlyArray<{
    readonly componentId: string;
    readonly domain: string;
    readonly status: 'HEALTHY' | 'DEGRADED' | 'DOWN';
    readonly lastChecked: string;
  }>;
}

export interface ActiveFailure {
  readonly scenarioId: string;
  readonly componentId: string;
  readonly domain: string;
  readonly severity: string;
  readonly detectedAt: string;
}

export interface RecoveryAttempt {
  readonly attemptId: string;
  readonly scenarioId: string;
  readonly componentId: string;
  readonly strategy: string;
  readonly status: 'PENDING' | 'SUCCESS' | 'FAILED';
  readonly startedAt: string;
  readonly completedAt: string | null;
}

export interface FailureReport {
  readonly timestamp: string;
  readonly totalScenarios: number;
  readonly activeFailures: number;
  readonly totalRecoveryAttempts: number;
  readonly successfulRecoveries: number;
  readonly failedRecoveries: number;
  readonly healthScore: number;
  readonly recoveryAttempts: ReadonlyArray<RecoveryAttempt>;
}

let attemptCounter = 0;

export class CommerceFailureRecoveryOrchestrator {
  private _scenarios: CommerceFailureScenario[] = [];
  private _recoveryAttempts: RecoveryAttempt[] = [];

  registerFailureScenario(scenario: CommerceFailureScenario): void {
    const existing = this._scenarios.find(s => s.scenarioId === scenario.scenarioId);
    if (!existing) {
      this._scenarios.push(scenario);
    }
  }

  detectActiveFailures(systemState: SystemState): ActiveFailure[] {
    const failures: ActiveFailure[] = [];

    for (const component of systemState.components) {
      if (component.status === 'DOWN' || component.status === 'DEGRADED') {
        const matchingScenario = this._scenarios.find(
          s => s.affectedComponents.includes(component.componentId) && s.domain === component.domain,
        );

        failures.push({
          scenarioId: matchingScenario?.scenarioId ?? 'UNKNOWN',
          componentId: component.componentId,
          domain: component.domain,
          severity: matchingScenario?.severity ?? 'MEDIUM',
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return failures;
  }

  selectRecoveryStrategy(failure: ActiveFailure): string {
    const scenario = this._scenarios.find(s => s.scenarioId === failure.scenarioId);
    if (scenario) {
      return scenario.recoveryStrategy;
    }

    switch (failure.severity) {
      case 'CRITICAL': return 'FAILOVER';
      case 'HIGH': return 'RESTART';
      case 'MEDIUM': return 'RETRY';
      case 'LOW': return 'SKIP';
      default: return 'RETRY';
    }
  }

  executeRecovery(failure: ActiveFailure, strategy: string): RecoveryAttempt {
    attemptCounter++;
    const attemptId = `attempt-${attemptCounter}`;
    const now = new Date().toISOString();

    const attempt: RecoveryAttempt = {
      attemptId,
      scenarioId: failure.scenarioId,
      componentId: failure.componentId,
      strategy,
      status: 'SUCCESS',
      startedAt: now,
      completedAt: now,
    };

    this._recoveryAttempts.push(attempt);
    return attempt;
  }

  getRecoveryHistory(): ReadonlyArray<RecoveryAttempt> {
    return this._recoveryAttempts;
  }

  getSystemHealthScore(): number {
    const total = this._recoveryAttempts.length;
    if (total === 0) return 100;

    const successful = this._recoveryAttempts.filter(a => a.status === 'SUCCESS').length;
    return Math.round((successful / total) * 100);
  }

  generateFailureReport(): FailureReport {
    const activeFailures = this._recoveryAttempts.filter(a => a.status === 'PENDING').length;
    const successful = this._recoveryAttempts.filter(a => a.status === 'SUCCESS').length;
    const failed = this._recoveryAttempts.filter(a => a.status === 'FAILED').length;

    return {
      timestamp: new Date().toISOString(),
      totalScenarios: this._scenarios.length,
      activeFailures,
      totalRecoveryAttempts: this._recoveryAttempts.length,
      successfulRecoveries: successful,
      failedRecoveries: failed,
      healthScore: this.getSystemHealthScore(),
      recoveryAttempts: [...this._recoveryAttempts],
    };
  }
}
