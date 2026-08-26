/**
 * HealthMonitoring.ts — PM46 Passive Health Monitoring (ETAP 5)
 *
 * DECISION-099: Health, Diagnostics i Configuration są pasywnymi usługami platformowymi, bez logiki wykonywania Runtime.
 *
 * Health status models, component health descriptors, readiness models, and liveness models.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface ComponentHealth {
  readonly componentId: string;
  readonly name: string;
  readonly status: HealthStatus;
  readonly message?: string;
  readonly lastCheckedAt: number;
}

export interface ReadinessModel {
  readonly isReady: boolean;
  readonly checkedComponents: ReadonlyArray<ComponentHealth>;
}

export interface LivenessModel {
  readonly isLive: boolean;
  readonly uptimeMs: number;
}

export function evaluateStudioReadiness(
  components: ReadonlyArray<ComponentHealth>
): ReadinessModel {
  const hasUnhealthy = components.some((c) => c.status === 'unhealthy');
  return {
    isReady: !hasUnhealthy,
    checkedComponents: [...components],
  };
}
