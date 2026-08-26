import { describe, it, expect } from 'vitest';
import { evaluateBetaReadiness } from '../BetaReadinessReport';

describe('BetaReadiness (PM48, ETAP 6 & DECISION-104)', () => {
  it('evaluates Beta readiness exclusively based on verified Quality Gates (DECISION-104)', () => {
    const summary = evaluateBetaReadiness('1.0.0-beta.1');
    expect(summary.isBetaReady).toBe(true);
    expect(summary.qualityGateStatus).toBe('PASS');
    expect(summary.apiCompatibilityStatus).toBe('PASS');
    expect(summary.performanceStatus).toBe('PASS');
    expect(summary.stabilityStatus).toBe('PASS');
    expect(summary.documentationStatus).toBe('PASS');
  });
});
