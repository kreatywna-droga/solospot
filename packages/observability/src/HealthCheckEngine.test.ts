import { describe, it, expect } from 'vitest';
import { HealthCheckEngine } from './HealthCheckEngine';

describe('HealthCheckEngine', () => {
  it('should register and execute individual health checks', async () => {
    const engine = new HealthCheckEngine();
    engine.registerCheck('database', async () => ({
      component: 'database',
      status: 'healthy',
    }));

    const singleCheck = await engine.runCheck('database');
    expect(singleCheck).toBeDefined();
    expect(singleCheck?.component).toBe('database');
    expect(singleCheck?.status).toBe('healthy');
    expect(typeof singleCheck?.latencyMs).toBe('number');
  });

  it('should return undefined for unregistered check', async () => {
    const engine = new HealthCheckEngine();
    const result = await engine.runCheck('nonexistent');
    expect(result).toBeUndefined();
  });

  it('should calculate overall status as healthy when all components pass', async () => {
    const engine = new HealthCheckEngine();
    engine.registerCheck('database', async () => ({ component: 'database', status: 'healthy' }));
    engine.registerCheck('cache', async () => ({ component: 'cache', status: 'healthy' }));

    const summary = await engine.getOverallStatus();
    expect(summary.status).toBe('healthy');
    expect(summary.totalChecks).toBe(2);
    expect(summary.healthyCount).toBe(2);
    expect(summary.degradedCount).toBe(0);
    expect(summary.unhealthyCount).toBe(0);
    expect(summary.checks).toHaveLength(2);
    expect(summary.timestamp).toBeTruthy();
  });

  it('should calculate overall status as degraded when a component is degraded', async () => {
    const engine = new HealthCheckEngine();
    engine.registerCheck('database', async () => ({ component: 'database', status: 'healthy' }));
    engine.registerCheck('search', async () => ({ component: 'search', status: 'degraded' }));

    const summary = await engine.getOverallStatus();
    expect(summary.status).toBe('degraded');
    expect(summary.totalChecks).toBe(2);
    expect(summary.healthyCount).toBe(1);
    expect(summary.degradedCount).toBe(1);
    expect(summary.unhealthyCount).toBe(0);
  });

  it('should calculate overall status as unhealthy when any component is unhealthy', async () => {
    const engine = new HealthCheckEngine();
    engine.registerCheck('database', async () => ({ component: 'database', status: 'healthy' }));
    engine.registerCheck('search', async () => ({ component: 'search', status: 'degraded' }));
    engine.registerCheck('auth', async () => ({ component: 'auth', status: 'unhealthy', error: 'Service down' }));

    const summary = await engine.getOverallStatus();
    expect(summary.status).toBe('unhealthy');
    expect(summary.totalChecks).toBe(3);
    expect(summary.healthyCount).toBe(1);
    expect(summary.degradedCount).toBe(1);
    expect(summary.unhealthyCount).toBe(1);
  });

  it('should handle boundary case when no health checks are registered', async () => {
    const engine = new HealthCheckEngine();
    const summary = await engine.getOverallStatus();
    expect(summary.status).toBe('unhealthy');
    expect(summary.totalChecks).toBe(0);
    expect(summary.healthyCount).toBe(0);
    expect(summary.degradedCount).toBe(0);
    expect(summary.unhealthyCount).toBe(0);
  });

  it('should handle thrown exceptions in health check functions', async () => {
    const engine = new HealthCheckEngine();
    engine.registerCheck('failingCheck', async () => {
      throw new Error('Connection timeout');
    });

    const summary = await engine.getOverallStatus();
    expect(summary.status).toBe('unhealthy');
    expect(summary.unhealthyCount).toBe(1);
    expect(summary.checks[0].error).toBe('Connection timeout');
  });

  it('should treat unknown or malformed check status as unhealthy and preserve check metadata', async () => {
    const engine = new HealthCheckEngine();
    engine.registerCheck('customCheck', async () => ({
      component: 'customCheck',
      status: 'unknown_status' as any,
    }));

    const summary = await engine.getOverallStatus();
    expect(summary.status).toBe('unhealthy');
    expect(summary.unhealthyCount).toBe(1);
    expect(summary.checks[0].component).toBe('customCheck');
    expect(typeof summary.checks[0].latencyMs).toBe('number');
  });
});

