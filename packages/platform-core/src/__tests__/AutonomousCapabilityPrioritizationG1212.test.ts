/**
 * G1-212: Autonomous Capability Prioritization — Test Suite
 *
 * Covers registration, scoring, ranking, deprioritization, and reporting.
 */

import { describe, it, expect } from 'vitest';
import {
  AutonomousCapabilityPrioritizer,
  CapabilityRegistration,
  CapabilityPriority,
} from '../AutonomousCapabilityPrioritization';

describe('AutonomousCapabilityPrioritizer', () => {
  const makeCapability = (overrides: Partial<CapabilityRegistration> = {}): CapabilityRegistration => ({
    capabilityId: `cap-${Math.random().toString(36).slice(2, 8)}`,
    businessValue: 7,
    technicalDebt: 5,
    riskLevel: 3,
    implementationComplexity: 4,
    ...overrides,
  });

  it('1: creates a prioritizer instance', () => {
    const p = new AutonomousCapabilityPrioritizer();
    expect(p).toBeDefined();
  });

  it('2: registerCapability returns a CapabilityPriority', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const cap = makeCapability({ capabilityId: 'c1' });
    const result = p.registerCapability(cap);
    expect(result.capabilityId).toBe('c1');
    expect(result).toHaveProperty('priorityScore');
  });

  it('3: registerCapability stores the capability', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1' }));
    expect(p.getAllCapabilities()).toHaveLength(1);
  });

  it('4: calculatePriorityScore returns a number', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const score = p.calculatePriorityScore(makeCapability());
    expect(typeof score).toBe('number');
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('5: higher business value yields higher priority score', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const low = p.calculatePriorityScore(makeCapability({ businessValue: 2 }));
    const high = p.calculatePriorityScore(makeCapability({ businessValue: 9 }));
    expect(high).toBeGreaterThan(low);
  });

  it('6: higher technical debt yields higher priority score', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const low = p.calculatePriorityScore(makeCapability({ technicalDebt: 1 }));
    const high = p.calculatePriorityScore(makeCapability({ technicalDebt: 9 }));
    expect(high).toBeGreaterThan(low);
  });

  it('7: higher risk yields higher priority score', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const low = p.calculatePriorityScore(makeCapability({ riskLevel: 1 }));
    const high = p.calculatePriorityScore(makeCapability({ riskLevel: 9 }));
    expect(high).toBeGreaterThan(low);
  });

  it('8: higher complexity yields lower priority score', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const simple = p.calculatePriorityScore(makeCapability({ implementationComplexity: 2 }));
    const complex = p.calculatePriorityScore(makeCapability({ implementationComplexity: 8 }));
    expect(simple).toBeGreaterThan(complex);
  });

  it('9: rankCapabilities returns sorted array', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const caps = [
      makeCapability({ capabilityId: 'low', businessValue: 1 }),
      makeCapability({ capabilityId: 'high', businessValue: 9 }),
      makeCapability({ capabilityId: 'mid', businessValue: 5 }),
    ];
    const priorities = caps.map((c) => ({ ...c, priorityScore: p.calculatePriorityScore(c) }));
    const ranked = p.rankCapabilities(priorities);
    expect(ranked[0].capabilityId).toBe('high');
    expect(ranked[2].capabilityId).toBe('low');
  });

  it('10: rankCapabilities does not mutate input', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const caps = [
      makeCapability({ capabilityId: 'a', businessValue: 9 }),
      makeCapability({ capabilityId: 'b', businessValue: 1 }),
    ];
    const priorities = caps.map((c) => ({ ...c, priorityScore: p.calculatePriorityScore(c) }));
    const original = [...priorities];
    p.rankCapabilities(priorities);
    expect(priorities).toEqual(original);
  });

  it('11: getTopNOptimizationTargets returns top N', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const caps = Array.from({ length: 10 }, (_, i) =>
      makeCapability({ capabilityId: `c${i}`, businessValue: i }),
    );
    const priorities = caps.map((c) => ({ ...c, priorityScore: p.calculatePriorityScore(c) }));
    const top3 = p.getTopNOptimizationTargets(priorities, 3);
    expect(top3).toHaveLength(3);
    expect(top3[0].businessValue).toBe(9);
  });

  it('12: getTopNOptimizationTargets returns all if n > length', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const caps = [
      makeCapability({ capabilityId: 'a' }),
      makeCapability({ capabilityId: 'b' }),
    ];
    const priorities = caps.map((c) => ({ ...c, priorityScore: p.calculatePriorityScore(c) }));
    const result = p.getTopNOptimizationTargets(priorities, 10);
    expect(result).toHaveLength(2);
  });

  it('13: deprioritize removes capability', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1' }));
    const removed = p.deprioritize('c1', 'No longer relevant');
    expect(removed).toBe(true);
    expect(p.getAllCapabilities()).toHaveLength(0);
  });

  it('14: deprioritize records reason', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1' }));
    p.deprioritize('c1', 'Outdated');
    const records = p.getDeprioritized();
    expect(records).toHaveLength(1);
    expect(records[0].reason).toBe('Outdated');
  });

  it('15: deprioritize returns false for unknown id', () => {
    const p = new AutonomousCapabilityPrioritizer();
    expect(p.deprioritize('unknown', 'reason')).toBe(false);
  });

  it('16: deprioritize records timestamp', () => {
    const before = Date.now();
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1' }));
    p.deprioritize('c1', 'reason');
    const record = p.getDeprioritized()[0];
    expect(record.timestamp).toBeGreaterThanOrEqual(before);
  });

  it('17: generatePrioritizationReport returns total capabilities', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1' }));
    p.registerCapability(makeCapability({ capabilityId: 'c2' }));
    const report = p.generatePrioritizationReport();
    expect(report.totalCapabilities).toBe(2);
  });

  it('18: generatePrioritizationReport includes ranked list', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'a', businessValue: 3 }));
    p.registerCapability(makeCapability({ capabilityId: 'b', businessValue: 8 }));
    const report = p.generatePrioritizationReport();
    expect(report.rankedCapabilities[0].capabilityId).toBe('b');
  });

  it('19: generatePrioritizationReport includes deprioritized count', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1' }));
    p.deprioritize('c1', 'reason');
    const report = p.generatePrioritizationReport();
    expect(report.deprioritizedCount).toBe(1);
  });

  it('20: generatePrioritizationReport includes top target', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'a', businessValue: 5 }));
    p.registerCapability(makeCapability({ capabilityId: 'b', businessValue: 9 }));
    const report = p.generatePrioritizationReport();
    expect(report.topTarget?.capabilityId).toBe('b');
  });

  it('21: generatePrioritizationReport includes weights', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const report = p.generatePrioritizationReport();
    expect(report.weights).toHaveProperty('businessValueWeight');
    expect(report.weights).toHaveProperty('technicalDebtWeight');
  });

  it('22: custom weights affect scoring', () => {
    const defaultP = new AutonomousCapabilityPrioritizer();
    const customP = new AutonomousCapabilityPrioritizer({
      businessValueWeight: 0.8,
      technicalDebtWeight: 0.1,
      riskLevelWeight: 0.05,
      complexityPenaltyWeight: 0.05,
    });
    const cap = makeCapability({ businessValue: 9, technicalDebt: 1, riskLevel: 1, implementationComplexity: 1 });
    const defaultScore = defaultP.calculatePriorityScore(cap);
    const customScore = customP.calculatePriorityScore(cap);
    expect(customScore).toBeGreaterThan(defaultScore);
  });

  it('23: registerCapability overwrites existing with same id', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1', businessValue: 3 }));
    p.registerCapability(makeCapability({ capabilityId: 'c1', businessValue: 8 }));
    const caps = p.getAllCapabilities();
    expect(caps).toHaveLength(1);
    expect(caps[0].businessValue).toBe(8);
  });

  it('24: getTopNOptimizationTargets with n=0 returns empty', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const caps = [makeCapability()];
    const priorities = caps.map((c) => ({ ...c, priorityScore: p.calculatePriorityScore(c) }));
    const result = p.getTopNOptimizationTargets(priorities, 0);
    expect(result).toHaveLength(0);
  });

  it('25: rankCapabilities with empty array returns empty', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const ranked = p.rankCapabilities([]);
    expect(ranked).toHaveLength(0);
  });

  it('26: getAllCapabilities returns copy of internal state', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1' }));
    const caps = p.getAllCapabilities();
    caps.pop();
    expect(p.getAllCapabilities()).toHaveLength(1);
  });

  it('27: priorityScore uses default weights', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const cap = makeCapability({ businessValue: 10, technicalDebt: 10, riskLevel: 10, implementationComplexity: 0 });
    const score = p.calculatePriorityScore(cap);
    expect(score).toBeCloseTo(10, 1);
  });

  it('28: generatePrioritizationReport with empty capabilities', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const report = p.generatePrioritizationReport();
    expect(report.totalCapabilities).toBe(0);
    expect(report.rankedCapabilities).toHaveLength(0);
    expect(report.topTarget).toBeUndefined();
  });

  it('29: deprioritize only once for same id', () => {
    const p = new AutonomousCapabilityPrioritizer();
    p.registerCapability(makeCapability({ capabilityId: 'c1' }));
    p.deprioritize('c1', 'first');
    const result = p.deprioritize('c1', 'second');
    expect(result).toBe(false);
    expect(p.getDeprioritized()).toHaveLength(1);
  });

  it('30: multiple capabilities with same score maintain stable order', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const caps = Array.from({ length: 5 }, (_, i) =>
      makeCapability({ capabilityId: `c${i}`, businessValue: 5, technicalDebt: 5, riskLevel: 5, implementationComplexity: 5 }),
    );
    const priorities = caps.map((c) => ({ ...c, priorityScore: p.calculatePriorityScore(c) }));
    const ranked = p.rankCapabilities(priorities);
    expect(ranked).toHaveLength(5);
    for (const r of ranked) {
      expect(r.priorityScore).toBe(priorities[0].priorityScore);
    }
  });

  it('31: priority score formula correctness', () => {
    const p = new AutonomousCapabilityPrioritizer();
    const cap = makeCapability({ businessValue: 8, technicalDebt: 6, riskLevel: 4, implementationComplexity: 3 });
    const expected =
      8 * 0.4 + 6 * 0.3 + 4 * 0.2 + (10 - 3) * 0.1;
    expect(p.calculatePriorityScore(cap)).toBeCloseTo(expected, 5);
  });
});
