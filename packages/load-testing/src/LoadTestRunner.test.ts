import { describe, it, expect } from 'vitest';
import { LoadTestRunner } from './LoadTestRunner';
import { ChaosEngine } from './ChaosEngine';

describe('LoadTestRunner', () => {
  const runner = new LoadTestRunner();

  it('should run scenario and return result', async () => {
    const result = await runner.runScenario({
      name: 'SaaS Scale',
      description: '1000 tenants',
      tenantCount: 1000,
      operationsPerTenant: 10,
      rampUpSeconds: 60,
      durationSeconds: 300
    });

    expect(result.scenario).toBe('SaaS Scale');
    expect(result.totalOperations).toBe(10000);
  });

  it('should return summary', () => {
    const summary = runner.getSummary();
    expect(summary.total).toBeGreaterThan(0);
    expect(summary.passed).toBeGreaterThan(0);
  });
});

describe('ChaosEngine', () => {
  const engine = new ChaosEngine();

  it('should register experiment', () => {
    engine.registerExperiment({
      id: 'chaos-1',
      name: 'Database Failure',
      target: 'database',
      action: 'terminate',
      durationMs: 5000,
      probability: 1.0
    });

    expect(engine.getResult('chaos-1')).toBeUndefined(); // Not yet run
  });

  it('should run experiment', async () => {
    engine.registerExperiment({
      id: 'chaos-2',
      name: 'Cache Latency',
      target: 'cache',
      action: 'latency',
      durationMs: 1000,
      probability: 1.0
    });

    const result = await engine.runExperiment('chaos-2');
    expect(result.experimentId).toBe('chaos-2');
    expect(result.status).toBe('running');
  });
});