import { describe, it, expect } from 'vitest';
import { SystemDiagnosticProbe } from './SystemDiagnosticProbe';
import { HealthCheckEngine } from './HealthCheckEngine';

describe('SystemDiagnosticProbe', () => {
  it('should capture memory snapshot correctly', () => {
    const probe = new SystemDiagnosticProbe();
    const memory = probe.getMemorySnapshot();

    expect(memory.heapUsedMb).toBeGreaterThan(0);
    expect(memory.heapTotalMb).toBeGreaterThan(0);
    expect(memory.rssMb).toBeGreaterThan(0);
  });

  it('should capture environment info correctly', () => {
    const probe = new SystemDiagnosticProbe();
    const envInfo = probe.getEnvironmentInfo();

    expect(envInfo.runtime).toBeTruthy();
    expect(envInfo.version).toBe(process.version);
    expect(envInfo.platform).toBe(process.platform);
    expect(envInfo.arch).toBe(process.arch);
  });

  it('should measure event loop latency', async () => {
    const probe = new SystemDiagnosticProbe();
    const latency = await probe.measureEventLoopLatency();

    expect(typeof latency).toBe('number');
    expect(latency).toBeGreaterThanOrEqual(0);
  });

  it('should generate full diagnostic report with healthy status', async () => {
    const healthEngine = new HealthCheckEngine();
    healthEngine.registerCheck('database', async () => ({
      component: 'database',
      status: 'healthy',
    }));

    const probe = new SystemDiagnosticProbe(healthEngine);
    const report = await probe.runDiagnostics();

    expect(report.status).toBe('healthy');
    expect(report.checks).toHaveLength(1);
    expect(report.checks[0].component).toBe('database');
    expect(report.memory.heapUsedMb).toBeGreaterThan(0);
    expect(report.environment.version).toBe(process.version);
    expect(report.timestamp).toBeTruthy();
  });

  it('should set status to unhealthy when a component check fails', async () => {
    const healthEngine = new HealthCheckEngine();
    healthEngine.registerCheck('redis', async () => ({
      component: 'redis',
      status: 'unhealthy',
      error: 'Connection refused',
    }));

    const probe = new SystemDiagnosticProbe(healthEngine);
    const report = await probe.runDiagnostics();

    expect(report.status).toBe('unhealthy');
    expect(report.checks[0].error).toBe('Connection refused');
  });
});
