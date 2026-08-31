/**
 * ProductOptimizationCheckpointDG1220.test.ts — G1-220
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ProductOptimizationCheckpointD } from '../ProductOptimizationCheckpointD';

describe('ProductOptimizationCheckpointD', () => {
  let checkpoint: ProductOptimizationCheckpointD;

  beforeEach(() => {
    checkpoint = new ProductOptimizationCheckpointD();
  });

  // --- runCheckpoint ---

  describe('runCheckpoint()', () => {
    it('returns correct checkpointId', () => {
      const result = checkpoint.runCheckpoint();
      expect(result.checkpointId).toBe('G1-220');
    });

    it('includes timestamp', () => {
      const result = checkpoint.runCheckpoint();
      expect(typeof result.timestamp).toBe('string');
      expect(result.timestamp.length).toBeGreaterThan(0);
    });

    it('runs 9 optimizations', () => {
      const result = checkpoint.runCheckpoint();
      expect(result.optimizationsRun).toBe(9);
    });

    it('applies all 9 optimizations', () => {
      const result = checkpoint.runCheckpoint();
      expect(result.optimizationsApplied).toBe(9);
    });

    it('computes overall score between 0 and 100', () => {
      const result = checkpoint.runCheckpoint();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('computes improvement delta', () => {
      const result = checkpoint.runCheckpoint();
      expect(typeof result.improvementDelta).toBe('number');
    });

    it('returns CONTINUE decision', () => {
      const result = checkpoint.runCheckpoint();
      expect(result.architecturalDecision).toBe('CONTINUE');
    });

    it('includes evidence array', () => {
      const result = checkpoint.runCheckpoint();
      expect(Array.isArray(result.evidence)).toBe(true);
      expect(result.evidence.length).toBe(9);
    });

    it('includes rationale string', () => {
      const result = checkpoint.runCheckpoint();
      expect(typeof result.rationale).toBe('string');
      expect(result.rationale.length).toBeGreaterThan(0);
    });

    it('stores last result', () => {
      checkpoint.runCheckpoint();
      const result = checkpoint.runCheckpoint();
      expect(result.checkpointId).toBe('G1-220');
    });
  });

  // --- validateOptimizationCompleteness ---

  describe('validateOptimizationCompleteness()', () => {
    it('returns PASS', () => {
      const result = checkpoint.validateOptimizationCompleteness();
      expect(result.status).toBe('PASS');
    });

    it('has VALIDATION-COMPLETENESS auditId', () => {
      const result = checkpoint.validateOptimizationCompleteness();
      expect(result.auditId).toBe('VALIDATION-COMPLETENESS');
    });

    it('has score 100', () => {
      const result = checkpoint.validateOptimizationCompleteness();
      expect(result.score).toBe(100);
    });

    it('reports 9/9 applied', () => {
      const result = checkpoint.validateOptimizationCompleteness();
      expect(result.details).toContain('9/9');
    });
  });

  // --- validateScoreImprovement ---

  describe('validateScoreImprovement()', () => {
    it('returns PASS when score >= baseline', () => {
      const result = checkpoint.validateScoreImprovement();
      expect(result.status).toBe('PASS');
    });

    it('has VALIDATION-SCORE-IMPROVEMENT auditId', () => {
      const result = checkpoint.validateScoreImprovement();
      expect(result.auditId).toBe('VALIDATION-SCORE-IMPROVEMENT');
    });

    it('includes score value', () => {
      const result = checkpoint.validateScoreImprovement();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('details mention baseline', () => {
      const result = checkpoint.validateScoreImprovement();
      expect(result.details).toContain('baseline');
    });
  });

  // --- validateNoRegressions ---

  describe('validateNoRegressions()', () => {
    it('returns PASS when no failures', () => {
      const result = checkpoint.validateNoRegressions();
      expect(result.status).toBe('PASS');
    });

    it('has VALIDATION-NO-REGRESSIONS auditId', () => {
      const result = checkpoint.validateNoRegressions();
      expect(result.auditId).toBe('VALIDATION-NO-REGRESSIONS');
    });

    it('has score 100 when no regressions', () => {
      const result = checkpoint.validateNoRegressions();
      expect(result.score).toBe(100);
    });

    it('details mention no regressions', () => {
      const result = checkpoint.validateNoRegressions();
      expect(result.details).toContain('No regressions');
    });
  });

  // --- getOptimizationScore ---

  describe('getOptimizationScore()', () => {
    it('returns a score between 0 and 100', () => {
      const score = checkpoint.getOptimizationScore();
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('returns consistent score across calls', () => {
      const score1 = checkpoint.getOptimizationScore();
      const score2 = checkpoint.getOptimizationScore();
      expect(score1).toBe(score2);
    });

    it('returns a positive score for default state', () => {
      const score = checkpoint.getOptimizationScore();
      expect(score).toBeGreaterThan(0);
    });
  });

  // --- getArchitecturalDecision ---

  describe('getArchitecturalDecision()', () => {
    it('returns CONTINUE', () => {
      const decision = checkpoint.getArchitecturalDecision();
      expect(decision).toBe('CONTINUE');
    });

    it('returns a valid decision type', () => {
      const decision = checkpoint.getArchitecturalDecision();
      expect(['CONTINUE', 'STOP', 'HOLD']).toContain(decision);
    });
  });

  // --- generateCheckpointReport ---

  describe('generateCheckpointReport()', () => {
    it('returns same structure as runCheckpoint', () => {
      const report = checkpoint.generateCheckpointReport();
      expect(report.checkpointId).toBe('G1-220');
      expect(report.optimizationsRun).toBe(9);
      expect(report.optimizationsApplied).toBe(9);
    });

    it('has architectural decision', () => {
      const report = checkpoint.generateCheckpointReport();
      expect(['CONTINUE', 'STOP', 'HOLD']).toContain(report.architecturalDecision);
    });

    it('has evidence with all audit IDs', () => {
      const report = checkpoint.generateCheckpointReport();
      const auditIds = report.evidence.map((e) => e.split(':')[0]);
      expect(auditIds).toContain('G1-211');
      expect(auditIds).toContain('G1-212');
      expect(auditIds).toContain('G1-213');
      expect(auditIds).toContain('G1-214');
      expect(auditIds).toContain('G1-215');
      expect(auditIds).toContain('G1-216');
      expect(auditIds).toContain('G1-217');
      expect(auditIds).toContain('G1-218');
      expect(auditIds).toContain('G1-219');
    });

    it('has non-empty rationale', () => {
      const report = checkpoint.generateCheckpointReport();
      expect(report.rationale.length).toBeGreaterThan(0);
    });

    it('has positive overall score', () => {
      const report = checkpoint.generateCheckpointReport();
      expect(report.overallScore).toBeGreaterThan(0);
    });

    it('has timestamp in ISO format', () => {
      const report = checkpoint.generateCheckpointReport();
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    it('stores result for subsequent calls', () => {
      checkpoint.generateCheckpointReport();
      const score = checkpoint.getOptimizationScore();
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('has matching run and applied counts', () => {
      const report = checkpoint.generateCheckpointReport();
      expect(report.optimizationsRun).toBeGreaterThanOrEqual(report.optimizationsApplied);
    });
  });
});
