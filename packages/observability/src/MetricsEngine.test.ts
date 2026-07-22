import { describe, it, expect } from 'vitest';
import { MetricsEngine } from './MetricsEngine';
import { MetricType } from './ObservabilityDomain';

describe('MetricsEngine', () => {
  const engine = new MetricsEngine();

  it('should record metrics', () => {
    engine.record(MetricType.REQUEST_COUNT, 1, { endpoint: '/api/test' });
    engine.record(MetricType.REQUEST_COUNT, 2, { endpoint: '/api/test' });

    const metrics = engine.getMetrics(MetricType.REQUEST_COUNT);
    expect(metrics.length).toBe(2);
  });

  it('should calculate summary', () => {
    engine.record(MetricType.REQUEST_DURATION, 100);
    engine.record(MetricType.REQUEST_DURATION, 200);
    engine.record(MetricType.REQUEST_DURATION, 300);

    const summary = engine.getSummary(MetricType.REQUEST_DURATION);
    expect(summary.avg).toBe(200);
    expect(summary.min).toBe(100);
    expect(summary.max).toBe(300);
  });

  it('should filter metrics by time', () => {
    const startTime = new Date().toISOString();
    const beforeTime = new Date(Date.now() - 1000).toISOString(); // in the past
    engine.record(MetricType.ERROR_COUNT, 1);

    const filtered = engine.getMetrics(MetricType.ERROR_COUNT, beforeTime);
    expect(filtered.length).toBeGreaterThan(0);
  });
});