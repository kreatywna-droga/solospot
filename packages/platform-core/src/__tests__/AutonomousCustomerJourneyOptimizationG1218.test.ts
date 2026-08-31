/**
 * AutonomousCustomerJourneyOptimizationG1218.test.ts — G1-218
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AutonomousCustomerJourneyOptimizer,
  type CustomerJourneyStage,
} from '../AutonomousCustomerJourneyOptimization';

describe('AutonomousCustomerJourneyOptimizer', () => {
  let optimizer: AutonomousCustomerJourneyOptimizer;
  let sampleStages: CustomerJourneyStage[];

  beforeEach(() => {
    optimizer = new AutonomousCustomerJourneyOptimizer();
    sampleStages = [
      { stageId: 's1', stageName: 'AWARENESS', conversionRate: 0.8, averageTimeMs: 5000, dropOffRate: 0.2 },
      { stageId: 's2', stageName: 'CONSIDERATION', conversionRate: 0.6, averageTimeMs: 15000, dropOffRate: 0.4 },
      { stageId: 's3', stageName: 'PURCHASE', conversionRate: 0.5, averageTimeMs: 8000, dropOffRate: 0.5 },
      { stageId: 's4', stageName: 'POST_PURCHASE', conversionRate: 0.9, averageTimeMs: 3000, dropOffRate: 0.1 },
      { stageId: 's5', stageName: 'RETENTION', conversionRate: 0.7, averageTimeMs: 10000, dropOffRate: 0.3 },
    ];
  });

  describe('mapCustomerJourney()', () => {
    it('returns total stages', () => {
      const result = optimizer.mapCustomerJourney(sampleStages);
      expect(result.totalStages).toBe(5);
    });

    it('computes overall conversion (product)', () => {
      const result = optimizer.mapCustomerJourney(sampleStages);
      expect(result.overallConversion).toBeCloseTo(0.1512);
    });

    it('computes average time', () => {
      const result = optimizer.mapCustomerJourney(sampleStages);
      expect(result.averageTimeMs).toBeCloseTo(8200);
    });

    it('computes overall drop-off', () => {
      const result = optimizer.mapCustomerJourney(sampleStages);
      expect(result.overallDropOff).toBeCloseTo(0.3);
    });

    it('handles empty stages', () => {
      const result = optimizer.mapCustomerJourney([]);
      expect(result.totalStages).toBe(0);
      expect(result.overallConversion).toBe(0);
      expect(result.averageTimeMs).toBe(0);
      expect(result.overallDropOff).toBe(0);
    });

    it('handles single stage', () => {
      const single: CustomerJourneyStage[] = [
        { stageId: 's', stageName: 'AWARENESS', conversionRate: 0.5, averageTimeMs: 2000, dropOffRate: 0.1 },
      ];
      const result = optimizer.mapCustomerJourney(single);
      expect(result.totalStages).toBe(1);
      expect(result.overallConversion).toBe(0.5);
    });
  });

  describe('identifyFrictionPoints()', () => {
    it('returns all stages as friction points', () => {
      const result = optimizer.identifyFrictionPoints(sampleStages);
      expect(result).toHaveLength(5);
    });

    it('sorts by friction score descending', () => {
      const result = optimizer.identifyFrictionPoints(sampleStages);
      expect(result[0].frictionScore).toBeGreaterThanOrEqual(result[1].frictionScore);
    });

    it('highest friction stage comes first', () => {
      const result = optimizer.identifyFrictionPoints(sampleStages);
      expect(result[0].frictionScore).toBeGreaterThanOrEqual(result[1].frictionScore);
    });

    it('includes stageId', () => {
      const result = optimizer.identifyFrictionPoints(sampleStages);
      expect(result[0].stageId).toBeTruthy();
    });

    it('includes averageTimeMs', () => {
      const result = optimizer.identifyFrictionPoints(sampleStages);
      expect(result[0].averageTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('returns empty for empty input', () => {
      const result = optimizer.identifyFrictionPoints([]);
      expect(result).toHaveLength(0);
    });

    it('accounts for time in friction score', () => {
      const stages: CustomerJourneyStage[] = [
        { stageId: 'a', stageName: 'AWARENESS', conversionRate: 0.5, averageTimeMs: 50000, dropOffRate: 0.1 },
        { stageId: 'b', stageName: 'CONSIDERATION', conversionRate: 0.5, averageTimeMs: 1000, dropOffRate: 0.1 },
      ];
      const result = optimizer.identifyFrictionPoints(stages);
      expect(result[0].stageId).toBe('a');
    });
  });

  describe('suggestJourneyOptimizations()', () => {
    it('suggests for high drop-off stages', () => {
      const result = optimizer.suggestJourneyOptimizations(sampleStages);
      expect(result.length).toBeGreaterThan(0);
    });

    it('excludes low drop-off stages', () => {
      const result = optimizer.suggestJourneyOptimizations(sampleStages);
      const names = result.map((r) => r.stageName);
      expect(names).not.toContain('POST_PURCHASE');
    });

    it('includes suggestion string', () => {
      const result = optimizer.suggestJourneyOptimizations(sampleStages);
      for (const opt of result) {
        expect(typeof opt.suggestion).toBe('string');
        expect(opt.suggestion.length).toBeGreaterThan(0);
      }
    });

    it('includes estimated conversion lift', () => {
      const result = optimizer.suggestJourneyOptimizations(sampleStages);
      for (const opt of result) {
        expect(opt.estimatedConversionLift).toBeGreaterThanOrEqual(0);
      }
    });

    it('returns empty for all low drop-off', () => {
      const stages: CustomerJourneyStage[] = [
        { stageId: 'x', stageName: 'AWARENESS', conversionRate: 0.9, averageTimeMs: 2000, dropOffRate: 0.05 },
      ];
      const result = optimizer.suggestJourneyOptimizations(stages);
      expect(result).toHaveLength(0);
    });
  });

  describe('calculateLifetimeValueImpact()', () => {
    it('calculates CLV gain', () => {
      const result = optimizer.calculateLifetimeValueImpact(sampleStages[0], 0.1);
      expect(result.estimatedCLVGain).toBeCloseTo(400);
    });

    it('returns current conversion', () => {
      const result = optimizer.calculateLifetimeValueImpact(sampleStages[1], 0.1);
      expect(result.currentConversion).toBe(0.6);
    });

    it('returns improvement', () => {
      const result = optimizer.calculateLifetimeValueImpact(sampleStages[2], 0.2);
      expect(result.improvement).toBe(0.2);
    });

    it('returns stageId', () => {
      const result = optimizer.calculateLifetimeValueImpact(sampleStages[3], 0.05);
      expect(result.stageId).toBe('s4');
    });

    it('returns stageName', () => {
      const result = optimizer.calculateLifetimeValueImpact(sampleStages[4], 0.05);
      expect(result.stageName).toBe('RETENTION');
    });

    it('returns zero gain for zero improvement', () => {
      const result = optimizer.calculateLifetimeValueImpact(sampleStages[0], 0);
      expect(result.estimatedCLVGain).toBe(0);
    });
  });

  describe('prioritizeJourneyOptimizations()', () => {
    it('returns all stages prioritized', () => {
      const result = optimizer.prioritizeJourneyOptimizations(sampleStages);
      expect(result).toHaveLength(5);
    });

    it('sorts by priority score descending', () => {
      const result = optimizer.prioritizeJourneyOptimizations(sampleStages);
      expect(result[0].priorityScore).toBeGreaterThanOrEqual(result[1].priorityScore);
    });

    it('highest priority for worst stage', () => {
      const result = optimizer.prioritizeJourneyOptimizations(sampleStages);
      expect(result[0].stageName).toBe('CONSIDERATION');
    });

    it('includes suggestion', () => {
      const result = optimizer.prioritizeJourneyOptimizations(sampleStages);
      for (const p of result) {
        expect(typeof p.suggestion).toBe('string');
      }
    });

    it('handles empty array', () => {
      const result = optimizer.prioritizeJourneyOptimizations([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('generateJourneyOptimizationReport()', () => {
    it('generates report with correct reportId', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(report.reportId).toBe('G1-218');
    });

    it('includes timestamp', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(typeof report.timestamp).toBe('string');
      expect(report.timestamp.length).toBeGreaterThan(0);
    });

    it('reports correct stages count', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(report.stagesMapped).toBe(5);
    });

    it('includes friction points', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(report.frictionPoints.length).toBeGreaterThan(0);
    });

    it('includes optimizations', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(report.optimizations.length).toBeGreaterThan(0);
    });

    it('includes lifetime value impacts', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(report.lifetimeValueImpacts).toHaveLength(5);
    });

    it('includes prioritized list', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(report.prioritized.length).toBe(5);
    });

    it('computes overall journey score', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(report.overallJourneyScore).toBeGreaterThanOrEqual(0);
      expect(report.overallJourneyScore).toBeLessThanOrEqual(100);
    });

    it('defaults to 100 for empty stages', () => {
      const report = optimizer.generateJourneyOptimizationReport([]);
      expect(report.overallJourneyScore).toBe(100);
    });

    it('stores report reference', () => {
      const report = optimizer.generateJourneyOptimizationReport(sampleStages);
      expect(report.reportId).toBe('G1-218');
    });
  });
});
