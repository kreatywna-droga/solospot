/**
 * AutonomousCommerceOptimizationG1216.test.ts — G1-216 Autonomous Commerce Optimization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AutonomousCommerceOptimizer,
  type CommerceOptimizationMetric,
} from '../AutonomousCommerceOptimization';

describe('AutonomousCommerceOptimizer', () => {
  let optimizer: AutonomousCommerceOptimizer;
  let sampleMetrics: CommerceOptimizationMetric[];

  beforeEach(() => {
    optimizer = new AutonomousCommerceOptimizer();
    sampleMetrics = [
      { metricId: 'm1', funnelStage: 'DISCOVERY', conversionRate: 0.8, dropOffRate: 0.2, optimizationAction: 'Improve headlines' },
      { metricId: 'm2', funnelStage: 'CONSIDERATION', conversionRate: 0.6, dropOffRate: 0.4, optimizationAction: 'Enhance PDP' },
      { metricId: 'm3', funnelStage: 'CHECKOUT', conversionRate: 0.5, dropOffRate: 0.5, optimizationAction: 'Simplify form' },
      { metricId: 'm4', funnelStage: 'PAYMENT', conversionRate: 0.9, dropOffRate: 0.1, optimizationAction: 'Add trust badges' },
      { metricId: 'm5', funnelStage: 'FULFILLMENT', conversionRate: 0.95, dropOffRate: 0.05, optimizationAction: 'Show delivery ETA' },
    ];
  });

  // --- analyzeFunnelMetrics ---

  describe('analyzeFunnelMetrics()', () => {
    it('returns total metrics count', () => {
      const result = optimizer.analyzeFunnelMetrics(sampleMetrics);
      expect(result.totalMetrics).toBe(5);
    });

    it('computes average conversion rate', () => {
      const result = optimizer.analyzeFunnelMetrics(sampleMetrics);
      expect(result.averageConversionRate).toBeCloseTo(0.75);
    });

    it('computes average drop-off rate', () => {
      const result = optimizer.analyzeFunnelMetrics(sampleMetrics);
      expect(result.averageDropOffRate).toBeCloseTo(0.25);
    });

    it('builds stage breakdown map', () => {
      const result = optimizer.analyzeFunnelMetrics(sampleMetrics);
      expect(result.stageBreakdown.get('DISCOVERY')).toBe(1);
      expect(result.stageBreakdown.get('CHECKOUT')).toBe(1);
    });

    it('handles empty metrics array', () => {
      const result = optimizer.analyzeFunnelMetrics([]);
      expect(result.totalMetrics).toBe(0);
      expect(result.averageConversionRate).toBe(0);
      expect(result.averageDropOffRate).toBe(0);
      expect(result.stageBreakdown.size).toBe(0);
    });

    it('aggregates same-stage metrics', () => {
      const metrics: CommerceOptimizationMetric[] = [
        { metricId: 'a', funnelStage: 'DISCOVERY', conversionRate: 0.5, dropOffRate: 0.3, optimizationAction: 'A' },
        { metricId: 'b', funnelStage: 'DISCOVERY', conversionRate: 0.7, dropOffRate: 0.1, optimizationAction: 'B' },
      ];
      const result = optimizer.analyzeFunnelMetrics(metrics);
      expect(result.stageBreakdown.get('DISCOVERY')).toBe(2);
    });
  });

  // --- identifyDropOffPoints ---

  describe('identifyDropOffPoints()', () => {
    it('returns all drop-off points', () => {
      const result = optimizer.identifyDropOffPoints(sampleMetrics);
      expect(result).toHaveLength(5);
    });

    it('sorts by drop-off rate descending', () => {
      const result = optimizer.identifyDropOffPoints(sampleMetrics);
      expect(result[0].dropOffRate).toBeGreaterThanOrEqual(result[1].dropOffRate);
    });

    it('classifies CRITICAL severity for high drop-off', () => {
      const result = optimizer.identifyDropOffPoints(sampleMetrics);
      const critical = result.find((r) => r.stage === 'CHECKOUT');
      expect(critical?.severity).toBe('CRITICAL');
    });

    it('classifies LOW severity for low drop-off', () => {
      const result = optimizer.identifyDropOffPoints(sampleMetrics);
      const low = result.find((r) => r.stage === 'FULFILLMENT');
      expect(low?.severity).toBe('LOW');
    });

    it('classifies HIGH severity', () => {
      const metrics: CommerceOptimizationMetric[] = [
        { metricId: 'x', funnelStage: 'DISCOVERY', conversionRate: 0.5, dropOffRate: 0.35, optimizationAction: 'X' },
      ];
      const result = optimizer.identifyDropOffPoints(metrics);
      expect(result[0].severity).toBe('HIGH');
    });

    it('classifies MEDIUM severity', () => {
      const metrics: CommerceOptimizationMetric[] = [
        { metricId: 'x', funnelStage: 'DISCOVERY', conversionRate: 0.5, dropOffRate: 0.2, optimizationAction: 'X' },
      ];
      const result = optimizer.identifyDropOffPoints(metrics);
      expect(result[0].severity).toBe('MEDIUM');
    });

    it('returns empty array for no metrics', () => {
      const result = optimizer.identifyDropOffPoints([]);
      expect(result).toHaveLength(0);
    });

    it('includes metricId in each result', () => {
      const result = optimizer.identifyDropOffPoints(sampleMetrics);
      expect(result[0].metricId).toBeTruthy();
    });
  });

  // --- suggestFunnelOptimizations ---

  describe('suggestFunnelOptimizations()', () => {
    it('suggests optimizations for high drop-off stages', () => {
      const result = optimizer.suggestFunnelOptimizations(sampleMetrics);
      expect(result.length).toBeGreaterThan(0);
    });

    it('excludes low drop-off stages', () => {
      const result = optimizer.suggestFunnelOptimizations(sampleMetrics);
      const stages = result.map((r) => r.stage);
      expect(stages).not.toContain('FULFILLMENT');
    });

    it('includes suggested test string', () => {
      const result = optimizer.suggestFunnelOptimizations(sampleMetrics);
      for (const opt of result) {
        expect(typeof opt.suggestedTest).toBe('string');
        expect(opt.suggestedTest.length).toBeGreaterThan(0);
      }
    });

    it('includes estimated lift', () => {
      const result = optimizer.suggestFunnelOptimizations(sampleMetrics);
      for (const opt of result) {
        expect(opt.estimatedLift).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns empty for all low drop-off metrics', () => {
      const metrics: CommerceOptimizationMetric[] = [
        { metricId: 'a', funnelStage: 'DISCOVERY', conversionRate: 0.9, dropOffRate: 0.05, optimizationAction: 'A' },
      ];
      const result = optimizer.suggestFunnelOptimizations(metrics);
      expect(result).toHaveLength(0);
    });
  });

  // --- calculateRevenueImpact ---

  describe('calculateRevenueImpact()', () => {
    it('calculates revenue gain', () => {
      const metric = sampleMetrics[0];
      const result = optimizer.calculateRevenueImpact(metric, 0.1);
      expect(result.estimatedRevenueGain).toBeCloseTo(80);
    });

    it('returns current rate', () => {
      const result = optimizer.calculateRevenueImpact(sampleMetrics[0], 0.1);
      expect(result.currentRate).toBe(0.8);
    });

    it('returns improvement value', () => {
      const result = optimizer.calculateRevenueImpact(sampleMetrics[0], 0.15);
      expect(result.improvement).toBe(0.15);
    });

    it('returns metricId', () => {
      const result = optimizer.calculateRevenueImpact(sampleMetrics[2], 0.05);
      expect(result.metricId).toBe('m3');
    });

    it('returns zero gain for zero improvement', () => {
      const result = optimizer.calculateRevenueImpact(sampleMetrics[0], 0);
      expect(result.estimatedRevenueGain).toBe(0);
    });
  });

  // --- prioritizeOptimizations ---

  describe('prioritizeOptimizations()', () => {
    it('returns all metrics prioritized', () => {
      const result = optimizer.prioritizeOptimizations(sampleMetrics);
      expect(result).toHaveLength(5);
    });

    it('sorts by priority score descending', () => {
      const result = optimizer.prioritizeOptimizations(sampleMetrics);
      expect(result[0].priorityScore).toBeGreaterThanOrEqual(result[1].priorityScore);
    });

    it('highest drop-off has highest priority', () => {
      const result = optimizer.prioritizeOptimizations(sampleMetrics);
      expect(result[0].stage).toBe('CHECKOUT');
    });

    it('includes action string', () => {
      const result = optimizer.prioritizeOptimizations(sampleMetrics);
      for (const p of result) {
        expect(typeof p.action).toBe('string');
      }
    });

    it('handles empty array', () => {
      const result = optimizer.prioritizeOptimizations([]);
      expect(result).toHaveLength(0);
    });
  });

  // --- generateCommerceOptimizationReport ---

  describe('generateCommerceOptimizationReport()', () => {
    it('generates report with correct reportId', () => {
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(report.reportId).toBe('G1-216');
    });

    it('includes timestamp', () => {
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(typeof report.timestamp).toBe('string');
      expect(report.timestamp.length).toBeGreaterThan(0);
    });

    it('reports correct metrics count', () => {
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(report.metricsAnalyzed).toBe(5);
    });

    it('includes drop-off points', () => {
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(report.dropOffPoints.length).toBeGreaterThan(0);
    });

    it('includes optimizations', () => {
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(report.optimizations.length).toBeGreaterThan(0);
    });

    it('includes revenue impacts', () => {
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(report.revenueImpacts).toHaveLength(5);
    });

    it('includes prioritized list', () => {
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(report.prioritized.length).toBe(5);
    });

    it('computes optimization score', () => {
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(report.overallOptimizationScore).toBeGreaterThanOrEqual(0);
      expect(report.overallOptimizationScore).toBeLessThanOrEqual(100);
    });

    it('defaults to 100 score for empty metrics', () => {
      const report = optimizer.generateCommerceOptimizationReport([]);
      expect(report.overallOptimizationScore).toBe(100);
    });

    it('stores last report', () => {
      optimizer.generateCommerceOptimizationReport(sampleMetrics);
      // second call overwrites
      const report = optimizer.generateCommerceOptimizationReport(sampleMetrics);
      expect(report.reportId).toBe('G1-216');
    });
  });
});
