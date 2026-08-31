/**
 * AutonomousMerchantExperienceOptimizationG1217.test.ts — G1-217
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AutonomousMerchantExperienceOptimizer,
  type MerchantExperienceMetric,
} from '../AutonomousMerchantExperienceOptimization';

describe('AutonomousMerchantExperienceOptimizer', () => {
  let optimizer: AutonomousMerchantExperienceOptimizer;
  let sampleMetrics: MerchantExperienceMetric[];

  beforeEach(() => {
    optimizer = new AutonomousMerchantExperienceOptimizer();
    sampleMetrics = [
      { metricId: 'mx1', area: 'DASHBOARD', satisfactionScore: 85, usabilityScore: 80, improvementSuggestion: 'Add quick actions' },
      { metricId: 'mx2', area: 'INVENTORY', satisfactionScore: 60, usabilityScore: 55, improvementSuggestion: 'Bulk edit tools' },
      { metricId: 'mx3', area: 'ORDERS', satisfactionScore: 75, usabilityScore: 70, improvementSuggestion: 'Filter improvements' },
      { metricId: 'mx4', area: 'ANALYTICS', satisfactionScore: 40, usabilityScore: 50, improvementSuggestion: 'Simplify dashboards' },
      { metricId: 'mx5', area: 'SUPPORT', satisfactionScore: 90, usabilityScore: 85, improvementSuggestion: 'Add chat widget' },
    ];
  });

  describe('evaluateMerchantExperience()', () => {
    it('returns total metrics count', () => {
      const result = optimizer.evaluateMerchantExperience(sampleMetrics);
      expect(result.totalMetrics).toBe(5);
    });

    it('computes average satisfaction', () => {
      const result = optimizer.evaluateMerchantExperience(sampleMetrics);
      expect(result.averageSatisfaction).toBeCloseTo(70);
    });

    it('computes average usability', () => {
      const result = optimizer.evaluateMerchantExperience(sampleMetrics);
      expect(result.averageUsability).toBeCloseTo(68);
    });

    it('builds area scores map', () => {
      const result = optimizer.evaluateMerchantExperience(sampleMetrics);
      expect(result.areaScores.get('DASHBOARD')).toBeCloseTo(82.5);
    });

    it('handles empty metrics', () => {
      const result = optimizer.evaluateMerchantExperience([]);
      expect(result.totalMetrics).toBe(0);
      expect(result.averageSatisfaction).toBe(0);
      expect(result.averageUsability).toBe(0);
      expect(result.areaScores.size).toBe(0);
    });

    it('handles single metric', () => {
      const single: MerchantExperienceMetric[] = [
        { metricId: 's', area: 'DASHBOARD', satisfactionScore: 50, usabilityScore: 60, improvementSuggestion: 'X' },
      ];
      const result = optimizer.evaluateMerchantExperience(single);
      expect(result.totalMetrics).toBe(1);
      expect(result.areaScores.get('DASHBOARD')).toBe(55);
    });
  });

  describe('identifyPainPoints()', () => {
    it('returns metrics below threshold', () => {
      const result = optimizer.identifyPainPoints(sampleMetrics);
      expect(result.length).toBeGreaterThan(0);
    });

    it('sorts by satisfaction ascending', () => {
      const result = optimizer.identifyPainPoints(sampleMetrics);
      expect(result[0].satisfactionScore).toBeLessThanOrEqual(result[1].satisfactionScore);
    });

    it('excludes high-scoring metrics', () => {
      const result = optimizer.identifyPainPoints(sampleMetrics);
      const areas = result.map((r) => r.area);
      expect(areas).not.toContain('SUPPORT');
    });

    it('includes INVENTORY as pain point', () => {
      const result = optimizer.identifyPainPoints(sampleMetrics);
      const areas = result.map((r) => r.area);
      expect(areas).toContain('INVENTORY');
    });

    it('includes ANALYTICS as pain point', () => {
      const result = optimizer.identifyPainPoints(sampleMetrics);
      const areas = result.map((r) => r.area);
      expect(areas).toContain('ANALYTICS');
    });

    it('returns empty for all high scores', () => {
      const highMetrics: MerchantExperienceMetric[] = [
        { metricId: 'h', area: 'DASHBOARD', satisfactionScore: 95, usabilityScore: 90, improvementSuggestion: 'None' },
      ];
      const result = optimizer.identifyPainPoints(highMetrics);
      expect(result).toHaveLength(0);
    });

    it('returns empty for empty input', () => {
      const result = optimizer.identifyPainPoints([]);
      expect(result).toHaveLength(0);
    });

    it('identifies metrics where only satisfaction is low', () => {
      const metrics: MerchantExperienceMetric[] = [
        { metricId: 'low', area: 'DASHBOARD', satisfactionScore: 60, usabilityScore: 90, improvementSuggestion: 'Improve' },
      ];
      const result = optimizer.identifyPainPoints(metrics);
      expect(result).toHaveLength(1);
    });

    it('identifies metrics where only usability is low', () => {
      const metrics: MerchantExperienceMetric[] = [
        { metricId: 'low2', area: 'ORDERS', satisfactionScore: 90, usabilityScore: 60, improvementSuggestion: 'Improve' },
      ];
      const result = optimizer.identifyPainPoints(metrics);
      expect(result).toHaveLength(1);
    });
  });

  describe('suggestUXImprovements()', () => {
    it('suggests improvements for pain points', () => {
      const result = optimizer.suggestUXImprovements(sampleMetrics);
      expect(result.length).toBeGreaterThan(0);
    });

    it('includes suggestion string', () => {
      const result = optimizer.suggestUXImprovements(sampleMetrics);
      for (const imp of result) {
        expect(typeof imp.suggestion).toBe('string');
        expect(imp.suggestion.length).toBeGreaterThan(0);
      }
    });

    it('includes estimated impact', () => {
      const result = optimizer.suggestUXImprovements(sampleMetrics);
      for (const imp of result) {
        expect(imp.estimatedImpact).toBeGreaterThanOrEqual(0);
      }
    });

    it('excludes high-scoring areas', () => {
      const result = optimizer.suggestUXImprovements(sampleMetrics);
      const areas = result.map((r) => r.area);
      expect(areas).not.toContain('SUPPORT');
    });

    it('returns empty for all high scores', () => {
      const metrics: MerchantExperienceMetric[] = [
        { metricId: 'x', area: 'DASHBOARD', satisfactionScore: 95, usabilityScore: 95, improvementSuggestion: 'None' },
      ];
      const result = optimizer.suggestUXImprovements(metrics);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateExperienceImpact()', () => {
    it('calculates satisfaction gain', () => {
      const result = optimizer.calculateExperienceImpact(sampleMetrics[1]);
      expect(result.estimatedSatisfactionGain).toBeCloseTo(10);
    });

    it('returns current satisfaction', () => {
      const result = optimizer.calculateExperienceImpact(sampleMetrics[0]);
      expect(result.currentSatisfaction).toBe(85);
    });

    it('returns correct metricId', () => {
      const result = optimizer.calculateExperienceImpact(sampleMetrics[2]);
      expect(result.metricId).toBe('mx3');
    });

    it('returns correct area', () => {
      const result = optimizer.calculateExperienceImpact(sampleMetrics[3]);
      expect(result.area).toBe('ANALYTICS');
    });

    it('returns zero gain for max satisfaction', () => {
      const metric: MerchantExperienceMetric = {
        metricId: 'max', area: 'DASHBOARD', satisfactionScore: 100, usabilityScore: 100, improvementSuggestion: 'None',
      };
      const result = optimizer.calculateExperienceImpact(metric);
      expect(result.estimatedSatisfactionGain).toBe(0);
    });
  });

  describe('prioritizeImprovements()', () => {
    it('returns all metrics prioritized', () => {
      const result = optimizer.prioritizeImprovements(sampleMetrics);
      expect(result).toHaveLength(5);
    });

    it('sorts by priority score descending', () => {
      const result = optimizer.prioritizeImprovements(sampleMetrics);
      expect(result[0].priorityScore).toBeGreaterThanOrEqual(result[1].priorityScore);
    });

    it('ANALYTICS has highest priority', () => {
      const result = optimizer.prioritizeImprovements(sampleMetrics);
      expect(result[0].area).toBe('ANALYTICS');
    });

    it('includes suggestion', () => {
      const result = optimizer.prioritizeImprovements(sampleMetrics);
      for (const p of result) {
        expect(typeof p.suggestion).toBe('string');
      }
    });

    it('handles empty array', () => {
      const result = optimizer.prioritizeImprovements([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('generateMerchantUXReport()', () => {
    it('generates report with correct reportId', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report.reportId).toBe('G1-217');
    });

    it('includes timestamp', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(typeof report.timestamp).toBe('string');
      expect(report.timestamp.length).toBeGreaterThan(0);
    });

    it('reports correct metrics count', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report.metricsEvaluated).toBe(5);
    });

    it('includes pain points', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report.painPoints.length).toBeGreaterThan(0);
    });

    it('includes improvements', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report.improvements.length).toBeGreaterThan(0);
    });

    it('includes experience impacts', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report.experienceImpacts).toHaveLength(5);
    });

    it('includes prioritized list', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report.prioritized.length).toBe(5);
    });

    it('computes overall UX score', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report.overallUXScore).toBeGreaterThanOrEqual(0);
      expect(report.overallUXScore).toBeLessThanOrEqual(100);
    });

    it('defaults to 100 for empty metrics', () => {
      const report = optimizer.generateMerchantUXReport([]);
      expect(report.overallUXScore).toBe(100);
    });

    it('stores last report reference', () => {
      const report = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report.reportId).toBe('G1-217');
      const report2 = optimizer.generateMerchantUXReport(sampleMetrics);
      expect(report2.reportId).toBe('G1-217');
    });
  });
});
