/**
 * G1-215: Autonomous Runtime Optimization — Test Suite
 *
 * Covers profiling, bottleneck detection, optimization suggestions,
 * impact calculation, trend analysis, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  AutonomousRuntimeOptimizer,
  RuntimePerformanceProfile,
  PerformanceTrend,
} from '../AutonomousRuntimeOptimization';

describe('AutonomousRuntimeOptimizer', () => {
  it('1: creates an optimizer instance', () => {
    const o = new AutonomousRuntimeOptimizer();
    expect(o).toBeDefined();
  });

  it('2: profileComponent returns a RuntimePerformanceProfile', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profile = o.profileComponent('comp1', 100, 1024);
    expect(profile.component).toBe('comp1');
    expect(profile.avgExecutionTimeMs).toBe(100);
    expect(profile.memoryUsageBytes).toBe(1024);
    expect(profile.callFrequency).toBe(1);
  });

  it('3: profileComponent stores the profile', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 100, 1024);
    expect(o.getAllProfiles()).toHaveLength(1);
  });

  it('4: profileComponent averages execution time over calls', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 100, 1024);
    const p2 = o.profileComponent('comp1', 200, 2048);
    expect(p2.avgExecutionTimeMs).toBe(150);
    expect(p2.callFrequency).toBe(2);
  });

  it('5: profileComponent tracks max memory usage', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 100, 1024);
    const p2 = o.profileComponent('comp1', 100, 4096);
    expect(p2.memoryUsageBytes).toBe(4096);
  });

  it('6: profileComponent tracks optimizationPotential', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profile = o.profileComponent('comp1', 500, 512 * 1024);
    expect(profile.optimizationPotential).toBeGreaterThan(0);
  });

  it('7: identifyBottlenecks returns profiles above threshold', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profiles = [
      o.profileComponent('slow', 800, 1024 * 1024),
      o.profileComponent('fast', 10, 100),
    ];
    const bottlenecks = o.identifyBottlenecks(profiles, 50);
    expect(bottlenecks.some((b) => b.component === 'slow')).toBe(true);
  });

  it('8: identifyBottlenecks returns empty for low potential', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profiles = [
      o.profileComponent('fast', 1, 10),
    ];
    const bottlenecks = o.identifyBottlenecks(profiles, 90);
    expect(bottlenecks).toHaveLength(0);
  });

  it('9: identifyBottlenecks sorts by optimizationPotential descending', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profiles = [
      o.profileComponent('a', 600, 600 * 1024),
      o.profileComponent('b', 900, 900 * 1024),
    ];
    const bottlenecks = o.identifyBottlenecks(profiles, 0);
    if (bottlenecks.length >= 2) {
      expect(bottlenecks[0].optimizationPotential).toBeGreaterThanOrEqual(
        bottlenecks[1].optimizationPotential,
      );
    }
  });

  it('10: suggestOptimizations suggests memoization for slow components', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profiles = [o.profileComponent('slow', 600, 1024)];
    const suggestions = o.suggestOptimizations(profiles);
    expect(suggestions.some((s) => s.component === 'slow')).toBe(true);
  });

  it('11: suggestOptimizations suggests memory optimization for large memory', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profiles = [o.profileComponent('hungry', 100, 1024 * 1024)];
    const suggestions = o.suggestOptimizations(profiles);
    expect(suggestions.some((s) => s.component === 'hungry')).toBe(true);
  });

  it('12: suggestOptimizations suggests throttling for frequent expensive calls', () => {
    const o = new AutonomousRuntimeOptimizer();
    for (let i = 0; i < 150; i++) {
      o.profileComponent('chatty', 150, 1024);
    }
    const profiles = o.getAllProfiles();
    const suggestions = o.suggestOptimizations(profiles);
    expect(suggestions.some((s) => s.component === 'chatty')).toBe(true);
  });

  it('13: suggestOptimizations returns empty for optimal components', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profiles = [o.profileComponent('optimal', 10, 100)];
    const suggestions = o.suggestOptimizations(profiles);
    expect(suggestions).toHaveLength(0);
  });

  it('14: suggestOptimizations sorts by estimatedImprovement descending', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profiles = [
      o.profileComponent('a', 600, 1024 * 1024),
      o.profileComponent('b', 1000, 2 * 1024 * 1024),
    ];
    const suggestions = o.suggestOptimizations(profiles);
    if (suggestions.length >= 2) {
      expect(suggestions[0].estimatedImprovement).toBeGreaterThanOrEqual(
        suggestions[1].estimatedImprovement,
      );
    }
  });

  it('15: calculateOptimizationImpact returns valid impact', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profile = o.profileComponent('comp1', 500, 512 * 1024);
    const impact = o.calculateOptimizationImpact(profile);
    expect(impact.currentScore).toBeGreaterThan(0);
    expect(impact.potentialScore).toBeLessThanOrEqual(impact.currentScore);
    expect(impact.improvementPercent).toBeGreaterThanOrEqual(0);
    expect(impact.improvementPercent).toBeLessThanOrEqual(100);
  });

  it('16: calculateOptimizationImpact improvementPercent is correct', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profile = o.profileComponent('comp1', 500, 512 * 1024);
    const impact = o.calculateOptimizationImpact(profile);
    const expected =
      impact.currentScore > 0
        ? ((impact.currentScore - impact.potentialScore) / impact.currentScore) * 100
        : 0;
    expect(impact.improvementPercent).toBeCloseTo(expected, 1);
  });

  it('17: getPerformanceTrend returns STABLE for single snapshot', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 100, 1024);
    expect(o.getPerformanceTrend('comp1')).toBe('STABLE');
  });

  it('18: getPerformanceTrend returns IMPROVING when times decrease', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 200, 1024);
    o.profileComponent('comp1', 100, 1024);
    expect(o.getPerformanceTrend('comp1')).toBe('IMPROVING');
  });

  it('19: getPerformanceTrend returns DEGRADING when times increase', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 100, 1024);
    o.profileComponent('comp1', 300, 1024);
    expect(o.getPerformanceTrend('comp1')).toBe('DEGRADING');
  });

  it('20: getPerformanceTrend returns STABLE for no change', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 100, 1024);
    o.profileComponent('comp1', 100, 1024);
    expect(o.getPerformanceTrend('comp1')).toBe('STABLE');
  });

  it('21: getPerformanceTrend returns STABLE for unknown component', () => {
    const o = new AutonomousRuntimeOptimizer();
    expect(o.getPerformanceTrend('unknown')).toBe('STABLE');
  });

  it('22: generateOptimizationReport includes totalProfiles', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('a', 100, 1024);
    o.profileComponent('b', 200, 2048);
    const report = o.generateOptimizationReport();
    expect(report.totalProfiles).toBe(2);
  });

  it('23: generateOptimizationReport includes bottleneckCount', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('slow', 800, 1024 * 1024);
    o.profileComponent('fast', 10, 100);
    const report = o.generateOptimizationReport();
    expect(report.bottleneckCount).toBeGreaterThanOrEqual(0);
  });

  it('24: generateOptimizationReport includes suggestions', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('slow', 600, 1024);
    const report = o.generateOptimizationReport();
    expect(Array.isArray(report.suggestions)).toBe(true);
  });

  it('25: generateOptimizationReport includes bottlenecks', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('slow', 800, 1024 * 1024);
    const report = o.generateOptimizationReport();
    expect(Array.isArray(report.bottlenecks)).toBe(true);
  });

  it('26: generateOptimizationReport includes trends', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 100, 1024);
    const report = o.generateOptimizationReport();
    expect(report.trends).toHaveProperty('comp1');
  });

  it('27: generateOptimizationReport with empty optimizer', () => {
    const o = new AutonomousRuntimeOptimizer();
    const report = o.generateOptimizationReport();
    expect(report.totalProfiles).toBe(0);
    expect(report.bottleneckCount).toBe(0);
    expect(report.suggestions).toHaveLength(0);
    expect(report.bottlenecks).toHaveLength(0);
  });

  it('28: getAllProfiles returns copy', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('comp1', 100, 1024);
    const profiles = o.getAllProfiles();
    profiles.pop();
    expect(o.getAllProfiles()).toHaveLength(1);
  });

  it('29: profileComponent with zero execution time', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profile = o.profileComponent('comp1', 0, 0);
    expect(profile.avgExecutionTimeMs).toBe(0);
    expect(profile.memoryUsageBytes).toBe(0);
  });

  it('30: profileComponent generates unique profileIds', () => {
    const o = new AutonomousRuntimeOptimizer();
    const p1 = o.profileComponent('comp1', 100, 1024);
    const p2 = o.profileComponent('comp1', 200, 2048);
    expect(p1.profileId).not.toBe(p2.profileId);
  });

  it('31: calculateOptimizationImpact with zero execution time', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profile = o.profileComponent('comp1', 0, 0);
    const impact = o.calculateOptimizationImpact(profile);
    expect(impact.improvementPercent).toBe(0);
  });

  it('32: multiple components tracked independently', () => {
    const o = new AutonomousRuntimeOptimizer();
    o.profileComponent('a', 100, 100);
    o.profileComponent('b', 200, 200);
    expect(o.getAllProfiles()).toHaveLength(2);
  });

  it('33: getPerformanceTrend with many snapshots is stable when consistent', () => {
    const o = new AutonomousRuntimeOptimizer();
    for (let i = 0; i < 10; i++) {
      o.profileComponent('comp1', 100, 1024);
    }
    expect(o.getPerformanceTrend('comp1')).toBe('STABLE');
  });

  it('34: suggestOptimizations suggestion has issue and suggestion fields', () => {
    const o = new AutonomousRuntimeOptimizer();
    const profiles = [o.profileComponent('slow', 600, 1024)];
    const suggestions = o.suggestOptimizations(profiles);
    for (const s of suggestions) {
      expect(typeof s.issue).toBe('string');
      expect(typeof s.suggestion).toBe('string');
      expect(s.issue.length).toBeGreaterThan(0);
      expect(s.suggestion.length).toBeGreaterThan(0);
    }
  });

  it('35: identifyBottlenecks with empty array returns empty', () => {
    const o = new AutonomousRuntimeOptimizer();
    expect(o.identifyBottlenecks([])).toHaveLength(0);
  });
});
