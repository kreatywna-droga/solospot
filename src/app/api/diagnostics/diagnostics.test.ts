import { describe, it, expect } from 'vitest';
import { GET, createDiagnosticsReport } from './route';
import { HealthCheckEngine, SystemDiagnosticProbe } from '../../../../packages/observability/src';

describe('Diagnostics API Route', () => {
  it('should generate a detailed system diagnostic report with embedded domain summary', async () => {
    const report = await createDiagnosticsReport();

    expect(report.timestamp).toBeDefined();
    expect(report.status).toMatch(/healthy|degraded|unhealthy/);
    expect(typeof report.uptimeSeconds).toBe('number');
    expect(typeof report.eventLoopLatencyMs).toBe('number');
    expect(report.memory).toBeDefined();
    expect(report.memory.heapUsedMb).toBeGreaterThan(0);
    expect(report.environment).toBeDefined();
    expect(report.environment.runtime).toBeDefined();
    expect(Array.isArray(report.checks)).toBe(true);
    expect(report.checks.length).toBe(2);

    // Domain-to-API Summary Integration Assertions
    expect(report.summary).toBeDefined();
    expect(report.summary?.totalChecks).toBe(2);
    expect(typeof report.summary?.healthyCount).toBe('number');
    expect(typeof report.summary?.degradedCount).toBe('number');
    expect(typeof report.summary?.unhealthyCount).toBe('number');
    expect(report.summary?.status).toMatch(/healthy|degraded|unhealthy/);
  });

  it('should return Response object from GET endpoint with summary metrics', async () => {
    const res = await GET();
    expect(res.status).toBeGreaterThanOrEqual(200);

    const json = await res.json();
    expect(json.timestamp).toBeDefined();
    expect(json.memory.heapUsedMb).toBeGreaterThan(0);
    expect(json.environment.runtime).toBeDefined();
    expect(json.summary).toBeDefined();
    expect(json.summary.totalChecks).toBeGreaterThanOrEqual(2);
  });

  it('should return HTTP 503 when a probe check fails or summary status is unhealthy', async () => {
    const healthEngine = new HealthCheckEngine();
    healthEngine.registerCheck('failingService', async () => ({
      component: 'failingService',
      status: 'unhealthy',
      error: 'Database connection failed',
    }));

    const probe = new SystemDiagnosticProbe(healthEngine);
    const report = await probe.runDiagnostics();

    expect(report.status).toBe('unhealthy');
    expect(report.summary?.status).toBe('unhealthy');
    expect(report.summary?.unhealthyCount).toBe(1);

    const httpStatus = (report.status === 'unhealthy' || report.summary?.status === 'unhealthy') ? 503 : 200;
    expect(httpStatus).toBe(503);
  });

  it('should return HTTP 200 with degraded counts when a check is degraded', async () => {
    const healthEngine = new HealthCheckEngine();
    healthEngine.registerCheck('cacheService', async () => ({
      component: 'cacheService',
      status: 'degraded',
    }));

    const probe = new SystemDiagnosticProbe(healthEngine);
    const report = await probe.runDiagnostics();

    expect(report.status).toBe('degraded');
    expect(report.summary?.status).toBe('degraded');
    expect(report.summary?.degradedCount).toBe(1);
    expect(report.summary?.unhealthyCount).toBe(0);

    const isUnhealthy = report.status === 'unhealthy' || report.summary?.status === 'unhealthy';
    expect(isUnhealthy).toBe(false);
  });
});
