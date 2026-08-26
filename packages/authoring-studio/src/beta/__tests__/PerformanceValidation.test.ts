import { describe, it, expect } from 'vitest';
import { validateStudioPerformance } from '../PerformanceValidation';

describe('PerformanceValidation (PM48, ETAP 3)', () => {
  it('validates pipeline performance thresholds', () => {
    const report = validateStudioPerformance();
    expect(report.isPerformancePassing).toBe(true);
    expect(report.checks.every((c) => c.isWithinThreshold)).toBe(true);
  });
});
