import { describe, it, expect } from 'vitest';
import { auditApiCompatibility } from '../ApiCompatibilityReport';

describe('ApiCompatibility (PM48, ETAP 2 & DECISION-105)', () => {
  it('confirms 0 breaking changes across all public studio exports (DECISION-105)', () => {
    const report = auditApiCompatibility();
    expect(report.isFullyCompatible).toBe(true);
    expect(report.breakingChangeCount).toBe(0);
    expect(report.moduleChecks).toHaveLength(10);
  });
});
