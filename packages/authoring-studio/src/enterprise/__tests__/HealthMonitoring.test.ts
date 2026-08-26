import { describe, it, expect } from 'vitest';
import { evaluateStudioReadiness, type ComponentHealth } from '../HealthMonitoring';

const healthyComponents: ReadonlyArray<ComponentHealth> = [
  { componentId: 'comp-timeline', name: 'Timeline Editor', status: 'healthy', lastCheckedAt: 1000 },
  { componentId: 'comp-assets', name: 'Asset Registry', status: 'healthy', lastCheckedAt: 1000 },
];

describe('HealthMonitoring (PM46, ETAP 5 & DECISION-099)', () => {
  it('evaluates studio readiness passively without Runtime execution (DECISION-099)', () => {
    const readiness = evaluateStudioReadiness(healthyComponents);
    expect(readiness.isReady).toBe(true);

    const unhealthyComponents: ReadonlyArray<ComponentHealth> = [
      ...healthyComponents,
      { componentId: 'comp-cloud', name: 'Cloud Sync', status: 'unhealthy', lastCheckedAt: 1000 },
    ];

    const unready = evaluateStudioReadiness(unhealthyComponents);
    expect(unready.isReady).toBe(false);
  });
});
