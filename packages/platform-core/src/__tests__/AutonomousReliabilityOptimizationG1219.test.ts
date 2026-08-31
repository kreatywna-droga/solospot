/**
 * AutonomousReliabilityOptimizationG1219.test.ts — G1-219
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AutonomousReliabilityOptimizer,
  type ReliabilityMetric,
} from '../AutonomousReliabilityOptimization';

describe('AutonomousReliabilityOptimizer', () => {
  let optimizer: AutonomousReliabilityOptimizer;
  let sampleMetrics: ReliabilityMetric[];

  beforeEach(() => {
    optimizer = new AutonomousReliabilityOptimizer();
    sampleMetrics = [
      { metricId: 'r1', component: 'API Gateway', uptimePercent: 99.95, mtbf: 500, mttr: 5, errorRate: 0.001, reliabilityScore: 98 },
      { metricId: 'r2', component: 'Payment Service', uptimePercent: 98.5, mtbf: 80, mttr: 120, errorRate: 0.05, reliabilityScore: 72 },
      { metricId: 'r3', component: 'Order Processor', uptimePercent: 99.2, mtbf: 200, mttr: 30, errorRate: 0.02, reliabilityScore: 88 },
      { metricId: 'r4', component: 'Notification Service', uptimePercent: 97.0, mtbf: 50, mttr: 180, errorRate: 0.08, reliabilityScore: 60 },
      { metricId: 'r5', component: 'Search Engine', uptimePercent: 99.8, mtbf: 400, mttr: 10, errorRate: 0.005, reliabilityScore: 95 },
    ];
  });

  describe('evaluateComponentReliability()', () => {
    it('returns component name', () => {
      const result = optimizer.evaluateComponentReliability(sampleMetrics[0]);
      expect(result.component).toBe('API Gateway');
    });

    it('classifies EXCELLENT rating for high score', () => {
      const result = optimizer.evaluateComponentReliability(sampleMetrics[0]);
      expect(result.rating).toBe('EXCELLENT');
    });

    it('classifies POOR rating for low score', () => {
      const metric: ReliabilityMetric = {
        metricId: 'poor', component: 'Legacy Service', uptimePercent: 99.1, mtbf: 150, mttr: 40, errorRate: 0.015, reliabilityScore: 75,
      };
      const result = optimizer.evaluateComponentReliability(metric);
      expect(result.rating).toBe('POOR');
    });

    it('classifies GOOD rating', () => {
      const metric: ReliabilityMetric = {
        metricId: 'g', component: 'X', uptimePercent: 99.5, mtbf: 300, mttr: 20, errorRate: 0.005, reliabilityScore: 96,
      };
      const result = optimizer.evaluateComponentReliability(metric);
      expect(result.rating).toBe('GOOD');
    });

    it('classifies FAIR rating', () => {
      const result = optimizer.evaluateComponentReliability(sampleMetrics[2]);
      expect(result.rating).toBe('FAIR');
    });

    it('classifies HEALTHY uptime', () => {
      const result = optimizer.evaluateComponentReliability(sampleMetrics[0]);
      expect(result.uptimeStatus).toBe('HEALTHY');
    });

    it('classifies DEGRADED uptime', () => {
      const result = optimizer.evaluateComponentReliability(sampleMetrics[2]);
      expect(result.uptimeStatus).toBe('DEGRADED');
    });

    it('classifies AT_RISK uptime', () => {
      const result = optimizer.evaluateComponentReliability(sampleMetrics[3]);
      expect(result.uptimeStatus).toBe('AT_RISK');
    });

    it('returns reliability score', () => {
      const result = optimizer.evaluateComponentReliability(sampleMetrics[0]);
      expect(result.score).toBe(98);
    });

    it('classifies CRITICAL rating', () => {
      const metric: ReliabilityMetric = {
        metricId: 'c', component: 'X', uptimePercent: 95, mtbf: 10, mttr: 300, errorRate: 0.2, reliabilityScore: 40,
      };
      const result = optimizer.evaluateComponentReliability(metric);
      expect(result.rating).toBe('CRITICAL');
    });
  });

  describe('identifyReliabilityRisks()', () => {
    it('returns risks for all metrics', () => {
      const result = optimizer.identifyReliabilityRisks(sampleMetrics);
      expect(result).toHaveLength(5);
    });

    it('sorts by risk level (critical first)', () => {
      const result = optimizer.identifyReliabilityRisks(sampleMetrics);
      const levels = result.map((r) => r.riskLevel);
      expect(levels[0]).toBe('CRITICAL');
    });

    it('identifies Notification Service as CRITICAL', () => {
      const result = optimizer.identifyReliabilityRisks(sampleMetrics);
      const notification = result.find((r) => r.component === 'Notification Service');
      expect(notification?.riskLevel).toBe('CRITICAL');
    });

    it('identifies API Gateway as LOW risk', () => {
      const result = optimizer.identifyReliabilityRisks(sampleMetrics);
      const api = result.find((r) => r.component === 'API Gateway');
      expect(api?.riskLevel).toBe('LOW');
    });

    it('includes risk factors', () => {
      const result = optimizer.identifyReliabilityRisks(sampleMetrics);
      for (const r of result) {
        expect(Array.isArray(r.riskFactors)).toBe(true);
      }
    });

    it('Payment Service has risk factors', () => {
      const result = optimizer.identifyReliabilityRisks(sampleMetrics);
      const payment = result.find((r) => r.component === 'Payment Service');
      expect(payment!.riskFactors.length).toBeGreaterThan(0);
    });

    it('returns empty for no metrics', () => {
      const result = optimizer.identifyReliabilityRisks([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('suggestReliabilityImprovements()', () => {
    it('suggests for below-threshold metrics', () => {
      const result = optimizer.suggestReliabilityImprovements(sampleMetrics);
      expect(result.length).toBeGreaterThan(0);
    });

    it('excludes highly reliable components', () => {
      const result = optimizer.suggestReliabilityImprovements(sampleMetrics);
      const components = result.map((r) => r.component);
      expect(components).not.toContain('API Gateway');
    });

    it('includes suggestion string', () => {
      const result = optimizer.suggestReliabilityImprovements(sampleMetrics);
      for (const imp of result) {
        expect(typeof imp.suggestion).toBe('string');
        expect(imp.suggestion.length).toBeGreaterThan(0);
      }
    });

    it('includes estimated uptime gain', () => {
      const result = optimizer.suggestReliabilityImprovements(sampleMetrics);
      for (const imp of result) {
        expect(imp.estimatedUptimeGain).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns empty for all perfect metrics', () => {
      const perfect: ReliabilityMetric[] = [
        { metricId: 'p', component: 'X', uptimePercent: 100, mtbf: 9999, mttr: 0, errorRate: 0, reliabilityScore: 100 },
      ];
      const result = optimizer.suggestReliabilityImprovements(perfect);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateReliabilityImpact()', () => {
    it('calculates uptime gain', () => {
      const result = optimizer.calculateReliabilityImpact(sampleMetrics[1], 0.2);
      expect(result.estimatedUptimeGain).toBeCloseTo(0.3);
    });

    it('returns current uptime', () => {
      const result = optimizer.calculateReliabilityImpact(sampleMetrics[0], 0.1);
      expect(result.currentUptime).toBe(99.95);
    });

    it('returns improvement', () => {
      const result = optimizer.calculateReliabilityImpact(sampleMetrics[2], 0.15);
      expect(result.improvement).toBe(0.15);
    });

    it('returns metricId', () => {
      const result = optimizer.calculateReliabilityImpact(sampleMetrics[3], 0.1);
      expect(result.metricId).toBe('r4');
    });

    it('returns component', () => {
      const result = optimizer.calculateReliabilityImpact(sampleMetrics[4], 0.1);
      expect(result.component).toBe('Search Engine');
    });

    it('returns zero gain for zero improvement', () => {
      const result = optimizer.calculateReliabilityImpact(sampleMetrics[0], 0);
      expect(result.estimatedUptimeGain).toBe(0);
    });
  });

  describe('prioritizeHardening()', () => {
    it('returns all metrics prioritized', () => {
      const result = optimizer.prioritizeHardening(sampleMetrics);
      expect(result).toHaveLength(5);
    });

    it('sorts by priority score descending', () => {
      const result = optimizer.prioritizeHardening(sampleMetrics);
      expect(result[0].priorityScore).toBeGreaterThanOrEqual(result[1].priorityScore);
    });

    it('Notification Service has highest priority', () => {
      const result = optimizer.prioritizeHardening(sampleMetrics);
      expect(result[0].component).toBe('Notification Service');
    });

    it('includes suggestion', () => {
      const result = optimizer.prioritizeHardening(sampleMetrics);
      for (const p of result) {
        expect(typeof p.suggestion).toBe('string');
      }
    });

    it('handles empty array', () => {
      const result = optimizer.prioritizeHardening([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('generateReliabilityReport()', () => {
    it('generates report with correct reportId', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(report.reportId).toBe('G1-219');
    });

    it('includes timestamp', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(typeof report.timestamp).toBe('string');
      expect(report.timestamp.length).toBeGreaterThan(0);
    });

    it('reports correct metrics count', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(report.metricsEvaluated).toBe(5);
    });

    it('includes risks', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(report.risks.length).toBe(5);
    });

    it('includes improvements', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(report.improvements.length).toBeGreaterThan(0);
    });

    it('includes reliability impacts', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(report.reliabilityImpacts).toHaveLength(5);
    });

    it('includes prioritized list', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(report.prioritized.length).toBe(5);
    });

    it('computes overall reliability score', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(report.overallReliabilityScore).toBeGreaterThanOrEqual(0);
      expect(report.overallReliabilityScore).toBeLessThanOrEqual(100);
    });

    it('defaults to 100 for empty metrics', () => {
      const report = optimizer.generateReliabilityReport([]);
      expect(report.overallReliabilityScore).toBe(100);
    });

    it('stores report reference', () => {
      const report = optimizer.generateReliabilityReport(sampleMetrics);
      expect(report.reportId).toBe('G1-219');
    });
  });
});
