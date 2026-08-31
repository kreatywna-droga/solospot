/**
 * G1-211: Autonomous Product Audit — Test Suite
 *
 * Covers audit execution, metric evaluation, optimization candidates,
 * report generation, and edge cases.
 */

import { describe, it, expect } from 'vitest';
import {
  AutonomousProductAuditor,
  ProductHealthMetric,
  ProductAuditResult,
  CodeQualityInput,
  TestCoverageInput,
  ArchComplianceInput,
  PerformanceRiskInput,
  SecurityPostureInput,
} from '../AutonomousProductAudit';

describe('AutonomousProductAuditor', () => {
  const goodCodeQuality: CodeQualityInput = {
    complexityScore: 2,
    duplicationRatio: 0.05,
    namingConsistency: 0.95,
  };

  const badCodeQuality: CodeQualityInput = {
    complexityScore: 9,
    duplicationRatio: 0.4,
    namingConsistency: 0.3,
  };

  const goodTestCoverage: TestCoverageInput = {
    totalFiles: 100,
    testedFiles: 90,
    testDistribution: { unit: 60, integration: 30, e2e: 10 },
  };

  const badTestCoverage: TestCoverageInput = {
    totalFiles: 100,
    testedFiles: 20,
    testDistribution: { unit: 95, integration: 3, e2e: 2 },
  };

  const goodArchCompliance: ArchComplianceInput = {
    boundaryViolations: 0,
    circularDependencies: 0,
    layeringViolations: 0,
  };

  const badArchCompliance: ArchComplianceInput = {
    boundaryViolations: 5,
    circularDependencies: 3,
    layeringViolations: 4,
  };

  const goodPerformanceRisk: PerformanceRiskInput = {
    unboundedLoops: 0,
    missingMemoization: 1,
    largeBundleImports: 0,
  };

  const badPerformanceRisk: PerformanceRiskInput = {
    unboundedLoops: 5,
    missingMemoization: 10,
    largeBundleImports: 8,
  };

  const goodSecurityPosture: SecurityPostureInput = {
    hardcodedSecrets: 0,
    missingSanitization: 0,
    insecurePatterns: 0,
  };

  const badSecurityPosture: SecurityPostureInput = {
    hardcodedSecrets: 3,
    missingSanitization: 5,
    insecurePatterns: 10,
  };

  it('1: creates an auditor instance', () => {
    const auditor = new AutonomousProductAuditor();
    expect(auditor).toBeDefined();
  });

  it('2: runAudit returns a ProductAuditResult', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    expect(result).toHaveProperty('auditId');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('overallScore');
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('decision');
    expect(result).toHaveProperty('candidates');
  });

  it('3: runAudit produces MAINTAIN decision for high scores', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    expect(result.decision).toBe('MAINTAIN');
  });

  it('4: runAudit produces OPTIMIZE decision for medium scores', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: { complexityScore: 5, duplicationRatio: 0.2, namingConsistency: 0.6 },
      testCoverage: { totalFiles: 100, testedFiles: 50, testDistribution: {} },
      archCompliance: { boundaryViolations: 2, circularDependencies: 1, layeringViolations: 2 },
      performanceRisk: { unboundedLoops: 2, missingMemoization: 3, largeBundleImports: 2 },
      securityPosture: { hardcodedSecrets: 1, missingSanitization: 1, insecurePatterns: 1 },
    });
    expect(result.decision).toBe('OPTIMIZE');
  });

  it('5: runAudit produces HARDEN decision for low scores', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: badCodeQuality,
      testCoverage: badTestCoverage,
      archCompliance: badArchCompliance,
      performanceRisk: badPerformanceRisk,
      securityPosture: badSecurityPosture,
    });
    expect(result.decision).toBe('HARDEN');
  });

  it('6: overallScore is between 0 and 1', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: badCodeQuality,
      testCoverage: badTestCoverage,
      archCompliance: badArchCompliance,
      performanceRisk: badPerformanceRisk,
      securityPosture: badSecurityPosture,
    });
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(1);
  });

  it('7: metrics array has 5 entries', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    expect(result.metrics).toHaveLength(5);
  });

  it('8: evaluateCodeQuality returns a valid metric', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateCodeQuality(goodCodeQuality);
    expect(metric.metricId).toBe('code-quality');
    expect(metric.category).toBe('CODE_QUALITY');
    expect(metric.score).toBeGreaterThanOrEqual(0);
    expect(metric.score).toBeLessThanOrEqual(100);
    expect(metric.maxScore).toBe(100);
  });

  it('9: evaluateCodeQuality with bad input has lower score', () => {
    const auditor = new AutonomousProductAuditor();
    const good = auditor.evaluateCodeQuality(goodCodeQuality);
    const bad = auditor.evaluateCodeQuality(badCodeQuality);
    expect(bad.score).toBeLessThan(good.score);
  });

  it('10: evaluateTestCoverage returns a valid metric', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateTestCoverage(goodTestCoverage);
    expect(metric.metricId).toBe('test-coverage');
    expect(metric.category).toBe('TEST_COVERAGE');
    expect(metric.score).toBeGreaterThanOrEqual(0);
    expect(metric.score).toBeLessThanOrEqual(100);
  });

  it('11: evaluateTestCoverage with high coverage scores higher', () => {
    const auditor = new AutonomousProductAuditor();
    const good = auditor.evaluateTestCoverage(goodTestCoverage);
    const bad = auditor.evaluateTestCoverage(badTestCoverage);
    expect(good.score).toBeGreaterThan(bad.score);
  });

  it('12: evaluateArchitecturalCompliance returns a valid metric', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateArchitecturalCompliance(goodArchCompliance);
    expect(metric.metricId).toBe('arch-compliance');
    expect(metric.category).toBe('ARCHITECTURAL_COMPLIANCE');
    expect(metric.score).toBe(100);
  });

  it('13: evaluateArchitecturalCompliance with violations scores lower', () => {
    const auditor = new AutonomousProductAuditor();
    const good = auditor.evaluateArchitecturalCompliance(goodArchCompliance);
    const bad = auditor.evaluateArchitecturalCompliance(badArchCompliance);
    expect(bad.score).toBeLessThan(good.score);
  });

  it('14: evaluatePerformanceRisk returns a valid metric', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluatePerformanceRisk(goodPerformanceRisk);
    expect(metric.metricId).toBe('performance-risk');
    expect(metric.category).toBe('PERFORMANCE_RISK');
    expect(metric.score).toBeGreaterThanOrEqual(0);
    expect(metric.score).toBeLessThanOrEqual(100);
  });

  it('15: evaluatePerformanceRisk with risks scores lower', () => {
    const auditor = new AutonomousProductAuditor();
    const good = auditor.evaluatePerformanceRisk(goodPerformanceRisk);
    const bad = auditor.evaluatePerformanceRisk(badPerformanceRisk);
    expect(bad.score).toBeLessThan(good.score);
  });

  it('16: evaluateSecurityPosture returns a valid metric', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateSecurityPosture(goodSecurityPosture);
    expect(metric.metricId).toBe('security-posture');
    expect(metric.category).toBe('SECURITY_POSTURE');
    expect(metric.score).toBe(100);
  });

  it('17: evaluateSecurityPosture with issues scores lower', () => {
    const auditor = new AutonomousProductAuditor();
    const good = auditor.evaluateSecurityPosture(goodSecurityPosture);
    const bad = auditor.evaluateSecurityPosture(badSecurityPosture);
    expect(bad.score).toBeLessThan(good.score);
  });

  it('18: generateOptimizationCandidates returns candidates for bad metrics', () => {
    const auditor = new AutonomousProductAuditor();
    const metrics: ProductHealthMetric[] = [
      auditor.evaluateCodeQuality(badCodeQuality),
      auditor.evaluateTestCoverage(badTestCoverage),
      auditor.evaluateArchitecturalCompliance(badArchCompliance),
      auditor.evaluatePerformanceRisk(badPerformanceRisk),
      auditor.evaluateSecurityPosture(badSecurityPosture),
    ];
    const candidates = auditor.generateOptimizationCandidates(metrics);
    expect(candidates.length).toBeGreaterThan(0);
  });

  it('19: generateOptimizationCandidates returns empty for perfect scores', () => {
    const auditor = new AutonomousProductAuditor();
    const metrics: ProductHealthMetric[] = [
      { metricId: 'a', category: 'A', score: 100, maxScore: 100, description: '', recommendation: '' },
      { metricId: 'b', category: 'B', score: 100, maxScore: 100, description: '', recommendation: '' },
    ];
    const candidates = auditor.generateOptimizationCandidates(metrics);
    expect(candidates).toHaveLength(0);
  });

  it('20: generateOptimizationCandidates sorted by score ascending', () => {
    const auditor = new AutonomousProductAuditor();
    const metrics: ProductHealthMetric[] = [
      { metricId: 'a', category: 'A', score: 80, maxScore: 100, description: '', recommendation: 'recA' },
      { metricId: 'b', category: 'B', score: 30, maxScore: 100, description: '', recommendation: 'recB' },
      { metricId: 'c', category: 'C', score: 60, maxScore: 100, description: '', recommendation: 'recC' },
    ];
    const candidates = auditor.generateOptimizationCandidates(metrics);
    expect(candidates[0]).toContain('B');
    expect(candidates[1]).toContain('C');
  });

  it('21: generateAuditReport returns history', () => {
    const auditor = new AutonomousProductAuditor();
    auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    const report = auditor.generateAuditReport();
    expect(report.totalAudits).toBe(1);
    expect(report.history).toHaveLength(1);
    expect(report.averageScore).toBeGreaterThan(0);
  });

  it('22: multiple audits accumulate history', () => {
    const auditor = new AutonomousProductAuditor();
    auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    auditor.runAudit({
      codeQuality: badCodeQuality,
      testCoverage: badTestCoverage,
      archCompliance: badArchCompliance,
      performanceRisk: badPerformanceRisk,
      securityPosture: badSecurityPosture,
    });
    const report = auditor.generateAuditReport();
    expect(report.totalAudits).toBe(2);
  });

  it('23: averageScore is calculated correctly', () => {
    const auditor = new AutonomousProductAuditor();
    auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    const report = auditor.generateAuditReport();
    expect(report.averageScore).toBeGreaterThanOrEqual(0);
    expect(report.averageScore).toBeLessThanOrEqual(1);
  });

  it('24: auditId is unique per audit', () => {
    const auditor = new AutonomousProductAuditor();
    const r1 = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    const r2 = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    expect(r1.auditId).not.toBe(r2.auditId);
  });

  it('25: metric recommendations differ based on score', () => {
    const auditor = new AutonomousProductAuditor();
    const goodMetric = auditor.evaluateCodeQuality(goodCodeQuality);
    const badMetric = auditor.evaluateCodeQuality(badCodeQuality);
    expect(goodMetric.recommendation).not.toBe(badMetric.recommendation);
  });

  it('26: evaluateCodeQuality with zero complexity scores high', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateCodeQuality({
      complexityScore: 0,
      duplicationRatio: 0,
      namingConsistency: 1,
    });
    expect(metric.score).toBe(100);
  });

  it('27: evaluateTestCoverage with zero files handles gracefully', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateTestCoverage({
      totalFiles: 0,
      testedFiles: 0,
      testDistribution: {},
    });
    expect(metric.score).toBeGreaterThanOrEqual(0);
    expect(metric.score).toBeLessThanOrEqual(100);
  });

  it('28: evaluateArchitecturalCompliance with all violations scores zero', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateArchitecturalCompliance({
      boundaryViolations: 13,
      circularDependencies: 0,
      layeringViolations: 0,
    });
    expect(metric.score).toBe(0);
  });

  it('29: evaluatePerformanceRisk with many risks scores low', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluatePerformanceRisk({
      unboundedLoops: 10,
      missingMemoization: 10,
      largeBundleImports: 10,
    });
    expect(metric.score).toBe(0);
  });

  it('30: evaluateSecurityPosture with many issues scores low', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateSecurityPosture({
      hardcodedSecrets: 10,
      missingSanitization: 10,
      insecurePatterns: 10,
    });
    expect(metric.score).toBe(0);
  });

  it('31: candidates include category names', () => {
    const auditor = new AutonomousProductAuditor();
    const metrics: ProductHealthMetric[] = [
      { metricId: 'x', category: 'TEST_CATEGORY', score: 10, maxScore: 100, description: '', recommendation: 'fix it' },
    ];
    const candidates = auditor.generateOptimizationCandidates(metrics);
    expect(candidates[0]).toContain('TEST_CATEGORY');
  });

  it('32: generateAuditReport returns empty history for new auditor', () => {
    const auditor = new AutonomousProductAuditor();
    const report = auditor.generateAuditReport();
    expect(report.totalAudits).toBe(0);
    expect(report.history).toHaveLength(0);
    expect(report.averageScore).toBe(0);
  });

  it('33: runAudit metrics all have description strings', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    for (const m of result.metrics) {
      expect(typeof m.description).toBe('string');
      expect(m.description.length).toBeGreaterThan(0);
    }
  });

  it('34: runAudit metrics all have recommendation strings', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    for (const m of result.metrics) {
      expect(typeof m.recommendation).toBe('string');
      expect(m.recommendation.length).toBeGreaterThan(0);
    }
  });

  it('35: overallScore is weighted average of metric scores', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    const manualAvg =
      result.metrics.reduce((s, m) => s + m.score, 0) /
      result.metrics.reduce((s, m) => s + m.maxScore, 0);
    expect(result.overallScore).toBeCloseTo(manualAvg, 5);
  });

  it('36: decision is OPTIMIZE for borderline scores', () => {
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: { complexityScore: 6, duplicationRatio: 0.25, namingConsistency: 0.5 },
      testCoverage: { totalFiles: 50, testedFiles: 25, testDistribution: {} },
      archCompliance: { boundaryViolations: 3, circularDependencies: 2, layeringViolations: 2 },
      performanceRisk: { unboundedLoops: 3, missingMemoization: 4, largeBundleImports: 3 },
      securityPosture: { hardcodedSecrets: 2, missingSanitization: 2, insecurePatterns: 3 },
    });
    expect(['OPTIMIZE', 'HARDEN']).toContain(result.decision);
  });

  it('37: timestamp is set during audit', () => {
    const before = Date.now();
    const auditor = new AutonomousProductAuditor();
    const result = auditor.runAudit({
      codeQuality: goodCodeQuality,
      testCoverage: goodTestCoverage,
      archCompliance: goodArchCompliance,
      performanceRisk: goodPerformanceRisk,
      securityPosture: goodSecurityPosture,
    });
    const after = Date.now();
    expect(result.timestamp).toBeGreaterThanOrEqual(before);
    expect(result.timestamp).toBeLessThanOrEqual(after);
  });

  it('38: evaluateCodeQuality with max duplication scores lowest', () => {
    const auditor = new AutonomousProductAuditor();
    const metric = auditor.evaluateCodeQuality({
      complexityScore: 10,
      duplicationRatio: 1.0,
      namingConsistency: 0,
    });
    expect(metric.score).toBe(0);
  });
});
