import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiagnosticsRegistry } from './DiagnosticsRegistry';
import { HealthCheck, HealthResult } from '../types';

describe('DiagnosticsRegistry', () => {
  let registry: DiagnosticsRegistry;

  beforeEach(() => {
    registry = new DiagnosticsRegistry();
  });

  it('Should successfully register health checks and prevent duplicate registration names', () => {
    const check1: HealthCheck = {
      name: 'Logger',
      check: async () => ({ status: 'READY', timestamp: new Date().toISOString() }),
    };

    registry.register(check1);
    expect(registry.getChecks().length).toBe(1);

    expect(() => {
      registry.register(check1);
    }).toThrow('already registered');
  });

  it('Should aggregate to READY when all components are healthy', async () => {
    registry.register({
      name: 'Logger',
      check: async () => ({ status: 'READY', timestamp: new Date().toISOString() }),
    });

    registry.register({
      name: 'EventBus',
      check: async () => ({ status: 'READY', timestamp: new Date().toISOString() }),
    });

    const report = await registry.evaluate();
    expect(report.status).toBe('READY');
    expect(report.components['Logger'].status).toBe('READY');
    expect(report.components['EventBus'].status).toBe('READY');
  });

  it('Should aggregate to DEGRADED when at least one component is degraded and none is failed', async () => {
    registry.register({
      name: 'Database',
      check: async () => ({
        status: 'DEGRADED',
        message: 'High latency detected',
        timestamp: new Date().toISOString(),
      }),
    });

    registry.register({
      name: 'EventBus',
      check: async () => ({ status: 'READY', timestamp: new Date().toISOString() }),
    });

    const report = await registry.evaluate();
    expect(report.status).toBe('DEGRADED');
    expect(report.components['Database'].status).toBe('DEGRADED');
    expect(report.components['EventBus'].status).toBe('READY');
  });

  it('Should aggregate to FAILED when at least one component is failed', async () => {
    registry.register({
      name: 'Database',
      check: async () => ({
        status: 'FAILED',
        message: 'Database unreachable',
        timestamp: new Date().toISOString(),
      }),
    });

    registry.register({
      name: 'Logger',
      check: async () => ({ status: 'READY', timestamp: new Date().toISOString() }),
    });

    registry.register({
      name: 'TenantResolver',
      check: async () => ({ status: 'DEGRADED', timestamp: new Date().toISOString() }),
    });

    const report = await registry.evaluate();
    expect(report.status).toBe('FAILED');
    expect(report.components['Database'].status).toBe('FAILED');
    expect(report.components['Logger'].status).toBe('READY');
    expect(report.components['TenantResolver'].status).toBe('DEGRADED');
  });

  it('Should safely catch exceptions within check functions and mark as FAILED', async () => {
    registry.register({
      name: 'CrashComponent',
      check: async () => {
        throw new Error('Connection timeout');
      },
    });

    registry.register({
      name: 'Logger',
      check: async () => ({ status: 'READY', timestamp: new Date().toISOString() }),
    });

    const report = await registry.evaluate();
    expect(report.status).toBe('FAILED');
    expect(report.components['CrashComponent'].status).toBe('FAILED');
    expect(report.components['CrashComponent'].message).toBe('Connection timeout');
  });

  it('Should trigger timeout policy and mark check as FAILED if execution is too slow', async () => {
    registry.register({
      name: 'SlowDatabaseCheck',
      check: () => new Promise<HealthResult>((resolve) => {
        // Slow resolve exceeding evaluation timeout (10ms)
        setTimeout(() => {
          resolve({ status: 'READY', timestamp: new Date().toISOString() });
        }, 100);
      }),
    });

    // Run evaluation with a strict 10ms timeout
    const report = await registry.evaluate(10);

    expect(report.status).toBe('FAILED');
    expect(report.components['SlowDatabaseCheck'].status).toBe('FAILED');
    expect(report.components['SlowDatabaseCheck'].message).toContain('timed out');
  });
});
