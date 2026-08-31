/**
 * G1-227: Production Readiness Gap Analysis — Test Suite
 *
 * Covers gap analysis, full scan, critical detection, prioritization,
 * readiness scoring, and report generation.
 */

import { describe, it, expect } from 'vitest';
import {
  ProductionReadinessGapAnalyzer,
  ReadinessGap,
} from '../ProductionReadinessGapAnalysis';

describe('ProductionReadinessGapAnalyzer', () => {
  it('1: creates an analyzer instance', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    expect(analyzer).toBeDefined();
  });

  it('2: analyzeReadinessGap returns a ReadinessGap', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gap = analyzer.analyzeReadinessGap('INFRASTRUCTURE', 70, 90, 'Test gap');
    expect(gap).toHaveProperty('gapId');
    expect(gap).toHaveProperty('category');
    expect(gap).toHaveProperty('gapDescription');
    expect(gap).toHaveProperty('currentScore');
    expect(gap).toHaveProperty('targetScore');
    expect(gap).toHaveProperty('remediationSteps');
  });

  it('3: analyzeReadinessGap clamps currentScore to 0-100', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gap = analyzer.analyzeReadinessGap('SECURITY', -10, 90, 'Negative');
    expect(gap.currentScore).toBe(0);
  });

  it('4: analyzeReadinessGap clamps targetScore to 0-100', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gap = analyzer.analyzeReadinessGap('SECURITY', 50, 150, 'Over');
    expect(gap.targetScore).toBe(100);
  });

  it('5: analyzeReadinessGap assigns unique gapId', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const g1 = analyzer.analyzeReadinessGap('MONITORING', 60, 80, 'Gap 1');
    const g2 = analyzer.analyzeReadinessGap('MONITORING', 60, 80, 'Gap 2');
    expect(g1.gapId).not.toBe(g2.gapId);
  });

  it('6: analyzeReadinessGap stores remediation steps', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gap = analyzer.analyzeReadinessGap('COMPLIANCE', 70, 90, 'Audit', ['Step 1', 'Step 2']);
    expect(gap.remediationSteps).toHaveLength(2);
  });

  it('7: runFullGapAnalysis returns 6 gaps', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps = analyzer.runFullGapAnalysis();
    expect(gaps).toHaveLength(6);
  });

  it('8: runFullGapAnalysis covers all categories', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps = analyzer.runFullGapAnalysis();
    const categories = gaps.map((g) => g.category);
    expect(categories).toContain('INFRASTRUCTURE');
    expect(categories).toContain('MONITORING');
    expect(categories).toContain('SECURITY');
    expect(categories).toContain('PERFORMANCE');
    expect(categories).toContain('DISASTER_RECOVERY');
    expect(categories).toContain('COMPLIANCE');
  });

  it('9: getCriticalGaps returns gaps with score difference > 30', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'SECURITY', gapDescription: '', currentScore: 50, targetScore: 90, remediationSteps: [] },
      { gapId: 'g2', category: 'MONITORING', gapDescription: '', currentScore: 80, targetScore: 90, remediationSteps: [] },
    ];
    const critical = analyzer.getCriticalGaps(gaps);
    expect(critical).toHaveLength(1);
    expect(critical[0].gapId).toBe('g1');
  });

  it('10: getCriticalGaps returns empty when no critical gaps', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'SECURITY', gapDescription: '', currentScore: 85, targetScore: 90, remediationSteps: [] },
    ];
    expect(analyzer.getCriticalGaps(gaps)).toHaveLength(0);
  });

  it('11: prioritizeGaps sorts by impact/effort descending', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'A', gapDescription: '', currentScore: 80, targetScore: 90, remediationSteps: ['s1', 's2'] },
      { gapId: 'g2', category: 'B', gapDescription: '', currentScore: 50, targetScore: 95, remediationSteps: ['s1'] },
    ];
    const prioritized = analyzer.prioritizeGaps(gaps);
    expect(prioritized[0].gapId).toBe('g2');
  });

  it('12: prioritizeGaps handles equal priorities', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'A', gapDescription: '', currentScore: 60, targetScore: 80, remediationSteps: ['s1'] },
      { gapId: 'g2', category: 'B', gapDescription: '', currentScore: 60, targetScore: 80, remediationSteps: ['s1'] },
    ];
    const prioritized = analyzer.prioritizeGaps(gaps);
    expect(prioritized).toHaveLength(2);
  });

  it('13: calculateReadinessScore returns 100 for empty array', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    expect(analyzer.calculateReadinessScore([])).toBe(100);
  });

  it('14: calculateReadinessScore returns 100 when all targets met', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'A', gapDescription: '', currentScore: 90, targetScore: 90, remediationSteps: [] },
    ];
    expect(analyzer.calculateReadinessScore(gaps)).toBe(100);
  });

  it('15: calculateReadinessScore returns proportion', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'A', gapDescription: '', currentScore: 60, targetScore: 100, remediationSteps: [] },
    ];
    expect(analyzer.calculateReadinessScore(gaps)).toBe(60);
  });

  it('16: calculateReadinessScore averages across multiple gaps', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'A', gapDescription: '', currentScore: 80, targetScore: 100, remediationSteps: [] },
      { gapId: 'g2', category: 'B', gapDescription: '', currentScore: 60, targetScore: 100, remediationSteps: [] },
    ];
    expect(analyzer.calculateReadinessScore(gaps)).toBe(70);
  });

  it('17: generateGapAnalysisReport returns correct structure', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const report = analyzer.generateGapAnalysisReport();
    expect(report).toHaveProperty('totalGaps');
    expect(report).toHaveProperty('criticalGaps');
    expect(report).toHaveProperty('readinessScore');
    expect(report).toHaveProperty('gaps');
    expect(report).toHaveProperty('prioritizedGaps');
    expect(report).toHaveProperty('timestamp');
  });

  it('18: generateGapAnalysisReport totalGaps is 6', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const report = analyzer.generateGapAnalysisReport();
    expect(report.totalGaps).toBe(6);
  });

  it('19: generateGapAnalysisReport readinessScore is between 0 and 100', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const report = analyzer.generateGapAnalysisReport();
    expect(report.readinessScore).toBeGreaterThanOrEqual(0);
    expect(report.readinessScore).toBeLessThanOrEqual(100);
  });

  it('20: generateGapAnalysisReport timestamp is recent', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const before = Date.now();
    const report = analyzer.generateGapAnalysisReport();
    const after = Date.now();
    expect(report.timestamp).toBeGreaterThanOrEqual(before);
    expect(report.timestamp).toBeLessThanOrEqual(after);
  });

  it('21: generateGapAnalysisReport prioritizedGaps are sorted', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const report = analyzer.generateGapAnalysisReport();
    for (let i = 1; i < report.prioritizedGaps.length; i++) {
      const prev = report.prioritizedGaps[i - 1];
      const curr = report.prioritizedGaps[i];
      const prevImpact = (prev.targetScore - prev.currentScore) / (prev.remediationSteps.length || 1);
      const currImpact = (curr.targetScore - curr.currentScore) / (curr.remediationSteps.length || 1);
      expect(prevImpact).toBeGreaterThanOrEqual(currImpact);
    }
  });

  it('22: getGapHistory returns reports', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    analyzer.generateGapAnalysisReport();
    expect(analyzer.getGapHistory()).toHaveLength(1);
  });

  it('23: multiple reports accumulate in history', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    analyzer.generateGapAnalysisReport();
    analyzer.generateGapAnalysisReport();
    expect(analyzer.getGapHistory()).toHaveLength(2);
  });

  it('24: getGapHistory returns a copy', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    analyzer.generateGapAnalysisReport();
    const history = analyzer.getGapHistory();
    history.pop();
    expect(analyzer.getGapHistory()).toHaveLength(1);
  });

  it('25: gapDescription is stored correctly', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gap = analyzer.analyzeReadinessGap('MONITORING', 40, 80, 'Custom description');
    expect(gap.gapDescription).toBe('Custom description');
  });

  it('26: category is stored correctly', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gap = analyzer.analyzeReadinessGap('DISASTER_RECOVERY', 30, 80, 'DR gap');
    expect(gap.category).toBe('DISASTER_RECOVERY');
  });

  it('27: getCriticalGaps returns all gaps when all are critical', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'A', gapDescription: '', currentScore: 10, targetScore: 90, remediationSteps: [] },
      { gapId: 'g2', category: 'B', gapDescription: '', currentScore: 20, targetScore: 100, remediationSteps: [] },
    ];
    expect(analyzer.getCriticalGaps(gaps)).toHaveLength(2);
  });

  it('28: calculateReadinessScore with zero targets returns 100', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gaps: ReadinessGap[] = [
      { gapId: 'g1', category: 'A', gapDescription: '', currentScore: 0, targetScore: 0, remediationSteps: [] },
    ];
    expect(analyzer.calculateReadinessScore(gaps)).toBe(100);
  });

  it('29: gaps in report have remediationSteps arrays', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const report = analyzer.generateGapAnalysisReport();
    for (const gap of report.gaps) {
      expect(Array.isArray(gap.remediationSteps)).toBe(true);
    }
  });

  it('30: analyzeReadinessGap with zero steps defaults to empty array', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const gap = analyzer.analyzeReadinessGap('COMPLIANCE', 50, 80, 'No steps');
    expect(gap.remediationSteps).toHaveLength(0);
  });

  it('31: report gaps all have positive gapId strings', () => {
    const analyzer = new ProductionReadinessGapAnalyzer();
    const report = analyzer.generateGapAnalysisReport();
    for (const gap of report.gaps) {
      expect(gap.gapId.length).toBeGreaterThan(0);
    }
  });
});
