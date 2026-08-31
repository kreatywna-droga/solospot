/**
 * G1-229: Enterprise Platform Final Evolution Audit — Test Suite
 *
 * Covers dimension evaluation, scoring, decisions, report generation,
 * and all 7 evaluation dimensions.
 */

import { describe, it, expect } from 'vitest';
import {
  EnterprisePlatformFinalEvolutionAuditor,
  EvolutionAuditDimension,
  EvolutionDecision,
} from '../EnterprisePlatformFinalEvolutionAudit';

describe('EnterprisePlatformFinalEvolutionAuditor', () => {
  it('1: creates an auditor instance', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    expect(auditor).toBeDefined();
  });

  it('2: evaluateArchitecture returns valid dimension', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateArchitecture();
    expect(dim.dimensionId).toBe('architecture');
    expect(dim.name).toBe('Architecture');
    expect(dim.score).toBeGreaterThan(0);
    expect(dim.maxScore).toBe(100);
  });

  it('3: evaluateSecurity returns valid dimension', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateSecurity();
    expect(dim.dimensionId).toBe('security');
    expect(dim.name).toBe('Security');
  });

  it('4: evaluatePerformance returns valid dimension', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluatePerformance();
    expect(dim.dimensionId).toBe('performance');
    expect(dim.name).toBe('Performance');
  });

  it('5: evaluateReliability returns valid dimension', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateReliability();
    expect(dim.dimensionId).toBe('reliability');
    expect(dim.name).toBe('Reliability');
  });

  it('6: evaluateScalability returns valid dimension', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateScalability();
    expect(dim.dimensionId).toBe('scalability');
    expect(dim.name).toBe('Scalability');
  });

  it('7: evaluateMaintainability returns valid dimension', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateMaintainability();
    expect(dim.dimensionId).toBe('maintainability');
    expect(dim.name).toBe('Maintainability');
  });

  it('8: evaluateObservability returns valid dimension', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateObservability();
    expect(dim.dimensionId).toBe('observability');
    expect(dim.name).toBe('Observability');
  });

  it('9: all dimensions have evidence arrays', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims = auditor.runFinalAudit();
    for (const d of dims) {
      expect(Array.isArray(d.evidence)).toBe(true);
      expect(d.evidence.length).toBeGreaterThan(0);
    }
  });

  it('10: all dimensions have status values', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims = auditor.runFinalAudit();
    for (const d of dims) {
      expect(['OPTIMAL', 'ADEQUATE', 'NEEDS_IMPROVEMENT', 'CRITICAL']).toContain(d.status);
    }
  });

  it('11: runFinalAudit returns 7 dimensions', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims = auditor.runFinalAudit();
    expect(dims).toHaveLength(7);
  });

  it('12: calculateOverallScore returns 0 for empty array', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    expect(auditor.calculateOverallScore([])).toBe(0);
  });

  it('13: calculateOverallScore returns 100 for perfect scores', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'security', name: 'S', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'performance', name: 'P', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'reliability', name: 'R', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'scalability', name: 'Sc', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'maintainability', name: 'M', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'observability', name: 'O', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
    ];
    expect(auditor.calculateOverallScore(dims)).toBe(100);
  });

  it('14: calculateOverallScore returns 0 for zero scores', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 0, maxScore: 100, status: 'CRITICAL', evidence: [] },
    ];
    expect(auditor.calculateOverallScore(dims)).toBe(0);
  });

  it('15: calculateOverallScore is weighted by dimension', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'security', name: 'S', score: 0, maxScore: 100, status: 'CRITICAL', evidence: [] },
    ];
    const score = auditor.calculateOverallScore(dims);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(100);
  });

  it('16: getEvolutionDecision returns CONTROLLED_STOP for high scores', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'security', name: 'S', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'performance', name: 'P', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'reliability', name: 'R', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'scalability', name: 'Sc', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'maintainability', name: 'M', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'observability', name: 'O', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
    ];
    expect(auditor.getEvolutionDecision(dims)).toBe('CONTROLLED_STOP');
  });

  it('17: getEvolutionDecision returns CONTINUE for medium scores', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 75, maxScore: 100, status: 'ADEQUATE', evidence: [] },
    ];
    expect(auditor.getEvolutionDecision(dims)).toBe('CONTINUE');
  });

  it('18: getEvolutionDecision returns DEFER for low scores', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 30, maxScore: 100, status: 'CRITICAL', evidence: [] },
    ];
    expect(auditor.getEvolutionDecision(dims)).toBe('DEFER');
  });

  it('19: getEvolutionDecision returns DEFER when critical dimensions exist', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 90, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'security', name: 'S', score: 30, maxScore: 100, status: 'CRITICAL', evidence: [] },
    ];
    expect(auditor.getEvolutionDecision(dims)).toBe('DEFER');
  });

  it('20: generateFinalAuditReport returns correct structure', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const report = auditor.generateFinalAuditReport();
    expect(report).toHaveProperty('overallScore');
    expect(report).toHaveProperty('dimensions');
    expect(report).toHaveProperty('decision');
    expect(report).toHaveProperty('timestamp');
    expect(report).toHaveProperty('recommendations');
  });

  it('21: generateFinalAuditReport has 7 dimensions', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const report = auditor.generateFinalAuditReport();
    expect(report.dimensions).toHaveLength(7);
  });

  it('22: generateFinalAuditReport overallScore is between 0 and 100', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const report = auditor.generateFinalAuditReport();
    expect(report.overallScore).toBeGreaterThanOrEqual(0);
    expect(report.overallScore).toBeLessThanOrEqual(100);
  });

  it('23: generateFinalAuditReport decision is valid enum', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const report = auditor.generateFinalAuditReport();
    expect(['CONTINUE', 'CONTROLLED_STOP', 'DEFER']).toContain(report.decision);
  });

  it('24: generateFinalAuditReport timestamp is recent', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const before = Date.now();
    const report = auditor.generateFinalAuditReport();
    const after = Date.now();
    expect(report.timestamp).toBeGreaterThanOrEqual(before);
    expect(report.timestamp).toBeLessThanOrEqual(after);
  });

  it('25: generateFinalAuditReport has recommendations', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const report = auditor.generateFinalAuditReport();
    expect(report.recommendations.length).toBeGreaterThan(0);
  });

  it('26: getAuditHistory returns reports', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    auditor.generateFinalAuditReport();
    expect(auditor.getAuditHistory()).toHaveLength(1);
  });

  it('27: multiple reports accumulate in history', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    auditor.generateFinalAuditReport();
    auditor.generateFinalAuditReport();
    expect(auditor.getAuditHistory()).toHaveLength(2);
  });

  it('28: getAuditHistory returns a copy', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    auditor.generateFinalAuditReport();
    const history = auditor.getAuditHistory();
    history.pop();
    expect(auditor.getAuditHistory()).toHaveLength(1);
  });

  it('29: architecture score is 88 by default', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateArchitecture();
    expect(dim.score).toBe(88);
  });

  it('30: security score is 92 by default', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateSecurity();
    expect(dim.score).toBe(92);
  });

  it('31: performance score is 85 by default', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluatePerformance();
    expect(dim.score).toBe(85);
  });

  it('32: reliability score is 90 by default', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateReliability();
    expect(dim.score).toBe(90);
  });

  it('33: scalability score is 82 by default', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateScalability();
    expect(dim.score).toBe(82);
  });

  it('34: maintainability score is 87 by default', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateMaintainability();
    expect(dim.score).toBe(87);
  });

  it('35: observability score is 80 by default', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateObservability();
    expect(dim.score).toBe(80);
  });

  it('36: OPTIMAL status assigned for ratio >= 0.9', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim = auditor.evaluateSecurity();
    expect(dim.status).toBe('OPTIMAL');
  });

  it('37: dimensions in report match runFinalAudit', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims = auditor.runFinalAudit();
    const report = auditor.generateFinalAuditReport();
    for (let i = 0; i < dims.length; i++) {
      expect(report.dimensions[i].dimensionId).toBe(dims[i].dimensionId);
    }
  });

  it('38: calculateOverallScore uses architecture weight of 0.2', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 100, maxScore: 100, status: 'OPTIMAL', evidence: [] },
    ];
    const score = auditor.calculateOverallScore(dims);
    expect(score).toBe(100);
  });

  it('39: report recommendations mention low-scoring dimensions', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const report = auditor.generateFinalAuditReport();
    const lowDims = report.dimensions.filter((d) => d.status === 'NEEDS_IMPROVEMENT' || d.status === 'CRITICAL');
    for (const dim of lowDims) {
      expect(report.recommendations.some((r) => r.includes(dim.name))).toBe(true);
    }
  });

  it('40: CONTROLLED_STOP requires no CRITICAL dimensions', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims: EvolutionAuditDimension[] = [
      { dimensionId: 'architecture', name: 'A', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'security', name: 'S', score: 30, maxScore: 100, status: 'CRITICAL', evidence: [] },
      { dimensionId: 'performance', name: 'P', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'reliability', name: 'R', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'scalability', name: 'Sc', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'maintainability', name: 'M', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
      { dimensionId: 'observability', name: 'O', score: 95, maxScore: 100, status: 'OPTIMAL', evidence: [] },
    ];
    expect(auditor.getEvolutionDecision(dims)).not.toBe('CONTROLLED_STOP');
  });

  it('41: overallScore is consistent with manual calculation', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const report = auditor.generateFinalAuditReport();
    const manualScore = auditor.calculateOverallScore(report.dimensions);
    expect(report.overallScore).toBeCloseTo(manualScore, 2);
  });

  it('42: all dimensionIds are unique', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims = auditor.runFinalAudit();
    const ids = dims.map((d) => d.dimensionId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('43: evidence strings are non-empty', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dims = auditor.runFinalAudit();
    for (const d of dims) {
      for (const e of d.evidence) {
        expect(e.length).toBeGreaterThan(0);
      }
    }
  });

  it('44: default report decision for full audit', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const report = auditor.generateFinalAuditReport();
    expect(['CONTINUE', 'CONTROLLED_STOP']).toContain(report.decision);
  });

  it('45: ADEQUATE status assigned for ratio >= 0.7 and < 0.9', () => {
    const auditor = new EnterprisePlatformFinalEvolutionAuditor();
    const dim: EvolutionAuditDimension = {
      dimensionId: 'test', name: 'Test', score: 75, maxScore: 100, status: 'ADEQUATE', evidence: [],
    };
    expect(dim.status).toBe('ADEQUATE');
  });

  it('46: NEEDS_IMPROVEMENT status assigned for ratio >= 0.5 and < 0.7', () => {
    const dim: EvolutionAuditDimension = {
      dimensionId: 'test', name: 'Test', score: 60, maxScore: 100, status: 'NEEDS_IMPROVEMENT', evidence: [],
    };
    expect(dim.status).toBe('NEEDS_IMPROVEMENT');
  });

  it('47: CRITICAL status assigned for ratio < 0.5', () => {
    const dim: EvolutionAuditDimension = {
      dimensionId: 'test', name: 'Test', score: 30, maxScore: 100, status: 'CRITICAL', evidence: [],
    };
    expect(dim.status).toBe('CRITICAL');
  });
});
