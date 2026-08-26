import { describe, it, expect } from 'vitest';
import { validateReleaseCandidateReadiness } from '../ReleaseCandidateValidator';
import { createPerformanceBaselineReport } from '../PerformanceBaseline';

describe('ReleaseCandidate (PM47, ETAP 5, ETAP 6 & DECISION-103)', () => {
  it('validates release candidate readiness across all quality gates (DECISION-103)', () => {
    const rcReport = validateReleaseCandidateReadiness('RC1');
    expect(rcReport.isRCReady).toBe(true);
    expect(rcReport.releaseCandidateTag).toBe('RC1');
    expect(rcReport.gates).toHaveLength(5);
  });

  it('generates performance baseline metrics report', () => {
    const perfReport = createPerformanceBaselineReport('RC1');
    expect(perfReport.metrics.length).toBeGreaterThan(0);
    expect(perfReport.studioVersion).toBe('RC1');
  });
});
