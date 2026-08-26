import { describe, it, expect } from 'vitest';
import { computeStudioCodeMetrics } from '../CodeMetrics';

describe('CodeMetrics (Sprint S1, ETAP 3)', () => {
  it('computes code quality, package statistics, and dependency metrics', () => {
    const report = computeStudioCodeMetrics();
    expect(report.packageStats).toHaveLength(2);
    expect(report.moduleMetrics.length).toBeGreaterThan(10);
    expect(report.dependencyMetrics.circularDependencyCount).toBe(0);
  });
});
