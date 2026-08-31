/**
 * G1-224: Critical Path Performance Audit — Test Suite
 *
 * Covers path registration, bottleneck identification, SLO validation,
 * performance improvements, scoring, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  CriticalPathPerformanceAuditor,
  CriticalPathMetric,
} from '../CriticalPathPerformanceAudit';

describe('CriticalPathPerformanceAuditor', () => {
  const makePath = (
    id: string,
    name: string = 'Path',
    stages: string[] = ['auth', 'db', 'render'],
    avgLatency: number = 100,
    p95: number = 200,
    p99: number = 300,
    throughput: number = 500,
    errorRate: number = 0.001,
  ): CriticalPathMetric => ({
    pathId: id,
    pathName: name,
    stages,
    avgLatencyMs: avgLatency,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
    throughputPerSecond: throughput,
    errorRate,
  });

  it('1: creates an auditor instance', () => {
    const a = new CriticalPathPerformanceAuditor();
    expect(a).toBeDefined();
  });

  it('2: registerCriticalPath stores a path', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1'));
    const report = a.generatePerformanceReport();
    expect(report.totalPaths).toBe(1);
  });

  it('3: registerCriticalPath overwrites duplicate id', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1', 'Fast', ['a'], 50));
    a.registerCriticalPath(makePath('p1', 'Slow', ['b'], 500));
    const report = a.generatePerformanceReport();
    expect(report.totalPaths).toBe(1);
  });

  it('4: identifyBottlenecks returns bottlenecks sorted by latency', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [
      makePath('p1', 'Fast', ['a', 'b'], 100),
      makePath('p2', 'Slow', ['a', 'b'], 500),
    ];
    const bottlenecks = a.identifyBottlenecks(paths);
    expect(bottlenecks[0].pathId).toBe('p2');
    expect(bottlenecks[1].pathId).toBe('p1');
  });

  it('5: identifyBottlenecks includes stageLatencyMs', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a', 'b'], 200)];
    const bottlenecks = a.identifyBottlenecks(paths);
    expect(bottlenecks[0].stageLatencyMs).toBe(100);
  });

  it('6: identifyBottlenecks with single stage', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['auth'], 150)];
    const bottlenecks = a.identifyBottlenecks(paths);
    expect(bottlenecks[0].stageLatencyMs).toBe(150);
  });

  it('7: validateSloCompliance returns compliant for within target', () => {
    const a = new CriticalPathPerformanceAuditor();
    const path = makePath('p1', 'Path', ['a'], 100);
    const result = a.validateSloCompliance(path, 200);
    expect(result.compliant).toBe(true);
    expect(result.marginMs).toBe(100);
  });

  it('8: validateSloCompliance returns non-compliant for exceeding target', () => {
    const a = new CriticalPathPerformanceAuditor();
    const path = makePath('p1', 'Path', ['a'], 300);
    const result = a.validateSloCompliance(path, 200);
    expect(result.compliant).toBe(false);
    expect(result.marginMs).toBe(-100);
  });

  it('9: validateSloCompliance returns compliant for exact target', () => {
    const a = new CriticalPathPerformanceAuditor();
    const path = makePath('p1', 'Path', ['a'], 200);
    const result = a.validateSloCompliance(path, 200);
    expect(result.compliant).toBe(true);
    expect(result.marginMs).toBe(0);
  });

  it('10: validateSloCompliance includes pathId', () => {
    const a = new CriticalPathPerformanceAuditor();
    const path = makePath('p1', 'Path', ['a'], 100);
    const result = a.validateSloCompliance(path, 200);
    expect(result.pathId).toBe('p1');
  });

  it('11: getPathsBelowSlo returns paths exceeding target', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [
      makePath('p1', 'Fast', ['a'], 100),
      makePath('p2', 'Slow', ['a'], 500),
      makePath('p3', 'Medium', ['a'], 300),
    ];
    const below = a.getPathsBelowSlo(paths, 200);
    expect(below).toHaveLength(2);
    expect(below.map((p) => p.pathId)).toContain('p2');
    expect(below.map((p) => p.pathId)).toContain('p3');
  });

  it('12: getPathsBelowSlo returns empty when all compliant', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Fast', ['a'], 100)];
    expect(a.getPathsBelowSlo(paths, 200)).toHaveLength(0);
  });

  it('13: suggestPerformanceImprovements for high tail latency', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 100, 500, 1000)];
    const suggestions = a.suggestPerformanceImprovements(paths);
    expect(suggestions[0].suggestions.some((s) => s.includes('tail latency'))).toBe(true);
  });

  it('14: suggestPerformanceImprovements for high error rate', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 100, 200, 300, 500, 0.05)];
    const suggestions = a.suggestPerformanceImprovements(paths);
    expect(suggestions[0].suggestions.some((s) => s.includes('error handling'))).toBe(true);
  });

  it('15: suggestPerformanceImprovements for low throughput', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 100, 200, 300, 50)];
    const suggestions = a.suggestPerformanceImprovements(paths);
    expect(suggestions[0].suggestions.some((s) => s.includes('throughput'))).toBe(true);
  });

  it('16: suggestPerformanceImprovements for many stages', () => {
    const a = new CriticalPathPerformanceAuditor();
    const stages = ['a', 'b', 'c', 'd', 'e', 'f'];
    const paths = [makePath('p1', 'Path', stages, 100, 200, 300, 500)];
    const suggestions = a.suggestPerformanceImprovements(paths);
    expect(suggestions[0].suggestions.some((s) => s.includes('parallelizing'))).toBe(true);
  });

  it('17: suggestPerformanceImprovements for good performance', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 50, 60, 70, 1000, 0.001)];
    const suggestions = a.suggestPerformanceImprovements(paths);
    expect(suggestions[0].suggestions.some((s) => s.includes('acceptable'))).toBe(true);
  });

  it('18: suggestPerformanceImprovements includes targetLatencyMs', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 100)];
    const suggestions = a.suggestPerformanceImprovements(paths);
    expect(suggestions[0].targetLatencyMs).toBe(70);
  });

  it('19: calculatePerformanceScore returns 100 for empty paths', () => {
    const a = new CriticalPathPerformanceAuditor();
    expect(a.calculatePerformanceScore([])).toBe(100);
  });

  it('20: calculatePerformanceScore returns 100 for perfect paths', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 50, 60, 70, 1000, 0.001)];
    expect(a.calculatePerformanceScore(paths)).toBe(100);
  });

  it('21: calculatePerformanceScore penalizes high latency', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 1500, 2000, 3000, 100, 0.001)];
    expect(a.calculatePerformanceScore(paths)).toBeLessThan(100);
  });

  it('22: calculatePerformanceScore penalizes high error rate', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 50, 60, 70, 1000, 0.1)];
    expect(a.calculatePerformanceScore(paths)).toBeLessThan(100);
  });

  it('23: calculatePerformanceScore penalizes high p99 variance', () => {
    const a = new CriticalPathPerformanceAuditor();
    const paths = [makePath('p1', 'Path', ['a'], 100, 150, 500, 1000, 0.001)];
    expect(a.calculatePerformanceScore(paths)).toBeLessThan(100);
  });

  it('24: generatePerformanceReport totalPaths', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1'));
    a.registerCriticalPath(makePath('p2'));
    const report = a.generatePerformanceReport();
    expect(report.totalPaths).toBe(2);
  });

  it('25: generatePerformanceReport averageLatencyMs', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1', 'P1', ['a'], 100));
    a.registerCriticalPath(makePath('p2', 'P2', ['a'], 300));
    const report = a.generatePerformanceReport();
    expect(report.averageLatencyMs).toBe(200);
  });

  it('26: generatePerformanceReport averageP95Ms', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1', 'P1', ['a'], 100, 200));
    a.registerCriticalPath(makePath('p2', 'P2', ['a'], 100, 400));
    const report = a.generatePerformanceReport();
    expect(report.averageP95Ms).toBe(300);
  });

  it('27: generatePerformanceReport averageP99Ms', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1', 'P1', ['a'], 100, 200, 300));
    a.registerCriticalPath(makePath('p2', 'P2', ['a'], 100, 200, 500));
    const report = a.generatePerformanceReport();
    expect(report.averageP99Ms).toBe(400);
  });

  it('28: generatePerformanceReport averageThroughput', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1', 'P1', ['a'], 100, 200, 300, 500));
    a.registerCriticalPath(makePath('p2', 'P2', ['a'], 100, 200, 300, 1000));
    const report = a.generatePerformanceReport();
    expect(report.averageThroughput).toBe(750);
  });

  it('29: generatePerformanceReport averageErrorRate', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1', 'P1', ['a'], 100, 200, 300, 500, 0.01));
    a.registerCriticalPath(makePath('p2', 'P2', ['a'], 100, 200, 300, 500, 0.03));
    const report = a.generatePerformanceReport();
    expect(report.averageErrorRate).toBe(0.02);
  });

  it('30: generatePerformanceReport performanceScore', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1', 'P1', ['a'], 50, 60, 70, 1000, 0.001));
    const report = a.generatePerformanceReport();
    expect(report.performanceScore).toBe(100);
  });

  it('31: generatePerformanceReport bottlenecks', () => {
    const a = new CriticalPathPerformanceAuditor();
    a.registerCriticalPath(makePath('p1', 'P1', ['a', 'b'], 100));
    a.registerCriticalPath(makePath('p2', 'P2', ['a', 'b'], 500));
    const report = a.generatePerformanceReport();
    expect(report.bottlenecks).toHaveLength(2);
    expect(report.bottlenecks[0].pathId).toBe('p2');
  });

  it('32: empty report has zero totals', () => {
    const a = new CriticalPathPerformanceAuditor();
    const report = a.generatePerformanceReport();
    expect(report.totalPaths).toBe(0);
    expect(report.averageLatencyMs).toBe(0);
    expect(report.averageP95Ms).toBe(0);
    expect(report.averageP99Ms).toBe(0);
    expect(report.averageThroughput).toBe(0);
    expect(report.averageErrorRate).toBe(0);
    expect(report.performanceScore).toBe(100);
    expect(report.bottlenecks).toHaveLength(0);
  });
});
