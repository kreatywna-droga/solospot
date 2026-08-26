/**
 * StorefrontObservabilityHealthEngine.ts — Sprint G1-106 Observability & Runtime Health Engine (Night Shift Level 68)
 *
 * Provides pure TypeScript, headless operational health monitoring, subsystem status classification
 * (HEALTHY / DEGRADED / UNHEALTHY), runtime diagnostics, and k8s-style readiness & liveness probe evaluation.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type SubsystemStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';

export interface SubsystemHealthDTO {
  readonly name: string;
  readonly status: SubsystemStatus;
  readonly latencyMs: number;
  readonly message: string;
  readonly lastCheckedAtMs: number;
}

export interface SystemHealthReportDTO {
  readonly tenantId: string;
  readonly overallStatus: SubsystemStatus;
  readonly readinessProbePassing: boolean;
  readonly livenessProbePassing: boolean;
  readonly totalSubsystemsAudited: number;
  readonly subsystems: ReadonlyArray<SubsystemHealthDTO>;
  readonly evaluatedAtMs: number;
}

export interface ObservabilityHealthEngineStateDTO {
  readonly tenantId: string;
  readonly subsystems: Record<string, SubsystemHealthDTO>;
}

export class StorefrontObservabilityHealthEngine {
  private readonly tenantId: string;
  private readonly startTimeMs: number;
  private subsystems: Map<string, SubsystemHealthDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
    this.startTimeMs = Date.now();
    this.initializeDefaultSubsystems();
  }

  private initializeDefaultSubsystems(): void {
    const defaults = [
      'DATABASE_PERSISTENCE',
      'PAYMENT_GATEWAY_BOUNDARY',
      'EMAIL_NOTIFICATION_QUEUE',
      'ANALYTICS_TELEMETRY_INGEST',
      'INVENTORY_RESERVATION_STORAGE'
    ];

    const now = Date.now();
    defaults.forEach(name => {
      this.subsystems.set(name, {
        name,
        status: 'HEALTHY',
        latencyMs: 5,
        message: 'Subsystem operating normally',
        lastCheckedAtMs: now
      });
    });
  }

  /**
   * Updates operational health state for a specific subsystem dependency.
   */
  public reportSubsystemHealth(
    subsystemName: string,
    status: SubsystemStatus,
    latencyMs: number,
    message?: string
  ): SubsystemHealthDTO {
    if (!subsystemName) {
      throw new Error('subsystemName is required to report health');
    }

    const now = Date.now();
    const updated: SubsystemHealthDTO = {
      name: subsystemName.trim().toUpperCase(),
      status,
      latencyMs: Math.max(0, latencyMs),
      message: message || (status === 'HEALTHY' ? 'Subsystem operational' : `Subsystem reported ${status}`),
      lastCheckedAtMs: now
    };

    this.subsystems.set(subsystemName.trim().toUpperCase(), updated);
    return updated;
  }

  /**
   * Evaluates overall system health report and readiness / liveness signals.
   */
  public evaluateSystemHealth(): SystemHealthReportDTO {
    const subsystemList = Array.from(this.subsystems.values());
    const now = Date.now();

    const hasUnhealthy = subsystemList.some(s => s.status === 'UNHEALTHY');
    const hasDegraded = subsystemList.some(s => s.status === 'DEGRADED');

    let overallStatus: SubsystemStatus = 'HEALTHY';
    if (hasUnhealthy) {
      overallStatus = 'UNHEALTHY';
    } else if (hasDegraded) {
      overallStatus = 'DEGRADED';
    }

    const readinessProbePassing = overallStatus !== 'UNHEALTHY';
    const livenessProbePassing = true; // Process is running and responding to calls

    return {
      tenantId: this.tenantId,
      overallStatus,
      readinessProbePassing,
      livenessProbePassing,
      totalSubsystemsAudited: subsystemList.length,
      subsystems: subsystemList,
      evaluatedAtMs: now
    };
  }

  public getSubsystem(name: string): SubsystemHealthDTO | undefined {
    return this.subsystems.get(name.trim().toUpperCase());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): ObservabilityHealthEngineStateDTO {
    const record: Record<string, SubsystemHealthDTO> = {};
    this.subsystems.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      subsystems: record
    };
  }

  public importState(state: ObservabilityHealthEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.subsystems.clear();
    Object.entries(state.subsystems || {}).forEach(([k, v]) => {
      this.subsystems.set(k, v);
    });
  }
}
