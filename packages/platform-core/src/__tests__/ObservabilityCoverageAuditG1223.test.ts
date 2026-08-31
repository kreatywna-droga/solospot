/**
 * G1-223: Observability Coverage Audit — Test Suite
 *
 * Covers component registration, coverage scoring, threshold filtering,
 * improvement suggestions, aggregate scoring, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  ObservabilityCoverageAuditor,
  ObservabilityCoverage,
} from '../ObservabilityCoverageAudit';

describe('ObservabilityCoverageAuditor', () => {
  const makeCoverage = (
    id: string,
    metrics: boolean = true,
    tracing: boolean = true,
    logging: boolean = true,
    alerting: boolean = true,
  ): ObservabilityCoverage => {
    let score = 0;
    if (metrics) score += 25;
    if (tracing) score += 25;
    if (logging) score += 25;
    if (alerting) score += 25;
    return {
      componentId: id,
      hasMetrics: metrics,
      hasTracing: tracing,
      hasLogging: logging,
      hasAlerting: alerting,
      coverageScore: score,
    };
  };

  it('1: creates an auditor instance', () => {
    const a = new ObservabilityCoverageAuditor();
    expect(a).toBeDefined();
  });

  it('2: registerComponent stores a component', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1'));
    const report = a.generateObservabilityReport();
    expect(report.totalComponents).toBe(1);
  });

  it('3: registerComponent overwrites duplicate id', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, false, false, false));
    a.registerComponent('comp1', makeCoverage('comp1', false, true, false, false));
    const report = a.generateObservabilityReport();
    expect(report.totalComponents).toBe(1);
  });

  it('4: calculateCoverageScore returns 100 for fully covered', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, true, true, true));
    expect(a.calculateCoverageScore('comp1')).toBe(100);
  });

  it('5: calculateCoverageScore returns 0 for no coverage', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', false, false, false, false));
    expect(a.calculateCoverageScore('comp1')).toBe(0);
  });

  it('6: calculateCoverageScore returns 25 for metrics only', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, false, false, false));
    expect(a.calculateCoverageScore('comp1')).toBe(25);
  });

  it('7: calculateCoverageScore returns 0 for unknown component', () => {
    const a = new ObservabilityCoverageAuditor();
    expect(a.calculateCoverageScore('unknown')).toBe(0);
  });

  it('8: getUndercoveredComponents filters below threshold', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, false, false, false));
    a.registerComponent('comp2', makeCoverage('comp2', true, true, true, true));
    const result = a.getUndercoveredComponents(50);
    expect(result).toHaveLength(1);
    expect(result[0].componentId).toBe('comp1');
  });

  it('9: getUndercoveredComponents returns empty when all above threshold', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, true, true, true));
    expect(a.getUndercoveredComponents(50)).toHaveLength(0);
  });

  it('10: getUndercoveredComponents returns empty for empty matrix', () => {
    const a = new ObservabilityCoverageAuditor();
    expect(a.getUndercoveredComponents(50)).toHaveLength(0);
  });

  it('11: suggestObservabilityImprovements identifies missing metrics', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [makeCoverage('comp1', false, true, true, true)];
    const suggestions = a.suggestObservabilityImprovements(coverage);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].missingCapabilities).toContain('metrics');
  });

  it('12: suggestObservabilityImprovements identifies missing tracing', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [makeCoverage('comp1', true, false, true, true)];
    const suggestions = a.suggestObservabilityImprovements(coverage);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].missingCapabilities).toContain('tracing');
  });

  it('13: suggestObservabilityImprovements identifies missing logging', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [makeCoverage('comp1', true, true, false, true)];
    const suggestions = a.suggestObservabilityImprovements(coverage);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].missingCapabilities).toContain('logging');
  });

  it('14: suggestObservabilityImprovements identifies missing alerting', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [makeCoverage('comp1', true, true, true, false)];
    const suggestions = a.suggestObservabilityImprovements(coverage);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].missingCapabilities).toContain('alerting');
  });

  it('15: suggestObservabilityImprovements returns empty for fully covered', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [makeCoverage('comp1', true, true, true, true)];
    expect(a.suggestObservabilityImprovements(coverage)).toHaveLength(0);
  });

  it('16: suggestObservabilityImprovements sets HIGH priority for 3+ missing', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [makeCoverage('comp1', false, false, false, true)];
    const suggestions = a.suggestObservabilityImprovements(coverage);
    expect(suggestions[0].priority).toBe('HIGH');
  });

  it('17: suggestObservabilityImprovements sets MEDIUM priority for 2 missing', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [makeCoverage('comp1', false, false, true, true)];
    const suggestions = a.suggestObservabilityImprovements(coverage);
    expect(suggestions[0].priority).toBe('MEDIUM');
  });

  it('18: suggestObservabilityImprovements sets LOW priority for 1 missing', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [makeCoverage('comp1', false, true, true, true)];
    const suggestions = a.suggestObservabilityImprovements(coverage);
    expect(suggestions[0].priority).toBe('LOW');
  });

  it('19: calculateAggregateCoverage returns average score', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [
      makeCoverage('comp1', true, true, true, true),
      makeCoverage('comp2', false, false, false, false),
    ];
    expect(a.calculateAggregateCoverage(coverage)).toBe(50);
  });

  it('20: calculateAggregateCoverage returns 0 for empty array', () => {
    const a = new ObservabilityCoverageAuditor();
    expect(a.calculateAggregateCoverage([])).toBe(0);
  });

  it('21: calculateAggregateCoverage returns 100 for all fully covered', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [
      makeCoverage('comp1', true, true, true, true),
      makeCoverage('comp2', true, true, true, true),
    ];
    expect(a.calculateAggregateCoverage(coverage)).toBe(100);
  });

  it('22: generateObservabilityReport totalComponents', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1'));
    a.registerComponent('comp2', makeCoverage('comp2'));
    const report = a.generateObservabilityReport();
    expect(report.totalComponents).toBe(2);
  });

  it('23: generateObservabilityReport fullyCovered count', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, true, true, true));
    a.registerComponent('comp2', makeCoverage('comp2', true, false, false, false));
    const report = a.generateObservabilityReport();
    expect(report.fullyCovered).toBe(1);
  });

  it('24: generateObservabilityReport uncovered count', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', false, false, false, false));
    a.registerComponent('comp2', makeCoverage('comp2', true, true, true, true));
    const report = a.generateObservabilityReport();
    expect(report.uncovered).toBe(1);
  });

  it('25: generateObservabilityReport partiallyCovered count', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, true, false, false));
    a.registerComponent('comp2', makeCoverage('comp2', true, true, true, true));
    a.registerComponent('comp3', makeCoverage('comp3', false, false, false, false));
    const report = a.generateObservabilityReport();
    expect(report.partiallyCovered).toBe(1);
  });

  it('26: generateObservabilityReport aggregateScore', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, true, true, true));
    a.registerComponent('comp2', makeCoverage('comp2', false, false, false, false));
    const report = a.generateObservabilityReport();
    expect(report.aggregateScore).toBe(50);
  });

  it('27: generateObservabilityReport improvements', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, false, false, false));
    const report = a.generateObservabilityReport();
    expect(report.improvements.length).toBeGreaterThanOrEqual(1);
  });

  it('28: empty report has zero totals', () => {
    const a = new ObservabilityCoverageAuditor();
    const report = a.generateObservabilityReport();
    expect(report.totalComponents).toBe(0);
    expect(report.fullyCovered).toBe(0);
    expect(report.partiallyCovered).toBe(0);
    expect(report.uncovered).toBe(0);
    expect(report.aggregateScore).toBe(0);
    expect(report.improvements).toHaveLength(0);
  });

  it('29: multiple components with mixed coverage', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, true, true, true));
    a.registerComponent('comp2', makeCoverage('comp2', true, true, false, false));
    a.registerComponent('comp3', makeCoverage('comp3', false, false, false, false));
    const report = a.generateObservabilityReport();
    expect(report.fullyCovered).toBe(1);
    expect(report.partiallyCovered).toBe(1);
    expect(report.uncovered).toBe(1);
  });

  it('30: suggestObservabilityImprovements with multiple components', () => {
    const a = new ObservabilityCoverageAuditor();
    const coverage = [
      makeCoverage('comp1', false, true, true, true),
      makeCoverage('comp2', true, false, true, true),
    ];
    const suggestions = a.suggestObservabilityImprovements(coverage);
    expect(suggestions).toHaveLength(2);
  });

  it('31: calculateCoverageScore with partial coverage', () => {
    const a = new ObservabilityCoverageAuditor();
    a.registerComponent('comp1', makeCoverage('comp1', true, true, false, false));
    expect(a.calculateCoverageScore('comp1')).toBe(50);
  });
});
