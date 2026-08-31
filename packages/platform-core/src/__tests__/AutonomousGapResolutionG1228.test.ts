/**
 * G1-228: Autonomous Gap Resolution — Test Suite
 *
 * Covers plan creation, execution, prioritization, completion tracking,
 * progress calculation, and report generation.
 */

import { describe, it, expect } from 'vitest';
import {
  AutonomousGapResolver,
  GapResolutionPlan,
  GapInput,
} from '../AutonomousGapResolution';

describe('AutonomousGapResolver', () => {
  const sampleGap: GapInput = {
    gapId: 'gap-1',
    description: 'Infrastructure gap',
    steps: ['Step 1', 'Step 2', 'Step 3'],
    effortHours: 16,
    priority: 'P0',
  };

  const lowPriorityGap: GapInput = {
    gapId: 'gap-2',
    description: 'Minor gap',
    steps: ['Simple fix'],
    effortHours: 4,
    priority: 'P2',
  };

  it('1: creates a resolver instance', () => {
    const resolver = new AutonomousGapResolver();
    expect(resolver).toBeDefined();
  });

  it('2: createResolutionPlan returns a plan', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan(sampleGap);
    expect(plan).toHaveProperty('planId');
    expect(plan).toHaveProperty('gapId');
    expect(plan).toHaveProperty('resolutionSteps');
    expect(plan).toHaveProperty('estimatedEffortHours');
    expect(plan).toHaveProperty('priority');
    expect(plan).toHaveProperty('status');
  });

  it('3: createResolutionPlan sets status to PLANNED', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan(sampleGap);
    expect(plan.status).toBe('PLANNED');
  });

  it('4: createResolutionPlan assigns unique planId', () => {
    const resolver = new AutonomousGapResolver();
    const p1 = resolver.createResolutionPlan(sampleGap);
    const p2 = resolver.createResolutionPlan(lowPriorityGap);
    expect(p1.planId).not.toBe(p2.planId);
  });

  it('5: createResolutionPlan stores resolution steps', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan(sampleGap);
    expect(plan.resolutionSteps).toHaveLength(3);
  });

  it('6: createResolutionPlan clamps effort to non-negative', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan({ ...sampleGap, effortHours: -5 });
    expect(plan.estimatedEffortHours).toBe(0);
  });

  it('7: executeResolutionPlan marks as COMPLETED', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan(sampleGap);
    const executed = resolver.executeResolutionPlan(plan.planId);
    expect(executed?.status).toBe('COMPLETED');
  });

  it('8: executeResolutionPlan returns null for invalid planId', () => {
    const resolver = new AutonomousGapResolver();
    const result = resolver.executeResolutionPlan('nonexistent');
    expect(result).toBeNull();
  });

  it('9: executeResolutionPlan returns the plan object', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan(sampleGap);
    const executed = resolver.executeResolutionPlan(plan.planId);
    expect(executed?.planId).toBe(plan.planId);
  });

  it('10: prioritizePlans sorts by priority then effort', () => {
    const resolver = new AutonomousGapResolver();
    const p1 = resolver.createResolutionPlan(lowPriorityGap);
    const p2 = resolver.createResolutionPlan(sampleGap);
    const prioritized = resolver.prioritizePlans([p1, p2]);
    expect(prioritized[0].priority).toBe('P0');
  });

  it('11: prioritizePlans sorts P0 before P1', () => {
    const resolver = new AutonomousGapResolver();
    const p1 = resolver.createResolutionPlan({ ...sampleGap, priority: 'P1' });
    const p2 = resolver.createResolutionPlan({ ...sampleGap, priority: 'P0' });
    const prioritized = resolver.prioritizePlans([p1, p2]);
    expect(prioritized[0].priority).toBe('P0');
  });

  it('12: prioritizePlans sorts same priority by effort ascending', () => {
    const resolver = new AutonomousGapResolver();
    const p1 = resolver.createResolutionPlan({ ...sampleGap, priority: 'P1', effortHours: 20 });
    const p2 = resolver.createResolutionPlan({ ...sampleGap, priority: 'P1', effortHours: 5 });
    const prioritized = resolver.prioritizePlans([p1, p2]);
    expect(prioritized[0].estimatedEffortHours).toBe(5);
  });

  it('13: getCompletedResolutions returns only completed', () => {
    const resolver = new AutonomousGapResolver();
    const p1 = resolver.createResolutionPlan(sampleGap);
    const p2 = resolver.createResolutionPlan(lowPriorityGap);
    resolver.executeResolutionPlan(p1.planId);
    const completed = resolver.getCompletedResolutions();
    expect(completed).toHaveLength(1);
    expect(completed[0].planId).toBe(p1.planId);
  });

  it('14: getCompletedResolutions returns empty when none completed', () => {
    const resolver = new AutonomousGapResolver();
    resolver.createResolutionPlan(sampleGap);
    expect(resolver.getCompletedResolutions()).toHaveLength(0);
  });

  it('15: calculateResolutionProgress returns 0 for empty', () => {
    const resolver = new AutonomousGapResolver();
    expect(resolver.calculateResolutionProgress([])).toBe(0);
  });

  it('16: calculateResolutionProgress returns 100 when all completed', () => {
    const resolver = new AutonomousGapResolver();
    const p1 = resolver.createResolutionPlan(sampleGap);
    const p2 = resolver.createResolutionPlan(lowPriorityGap);
    resolver.executeResolutionPlan(p1.planId);
    resolver.executeResolutionPlan(p2.planId);
    const plans = resolver.getAllPlans();
    expect(resolver.calculateResolutionProgress(plans)).toBe(100);
  });

  it('17: calculateResolutionProgress returns 50 for half completed', () => {
    const resolver = new AutonomousGapResolver();
    const p1 = resolver.createResolutionPlan(sampleGap);
    resolver.createResolutionPlan(lowPriorityGap);
    resolver.executeResolutionPlan(p1.planId);
    const plans = resolver.getAllPlans();
    expect(resolver.calculateResolutionProgress(plans)).toBe(50);
  });

  it('18: calculateResolutionProgress returns 0 when none completed', () => {
    const resolver = new AutonomousGapResolver();
    resolver.createResolutionPlan(sampleGap);
    resolver.createResolutionPlan(lowPriorityGap);
    const plans = resolver.getAllPlans();
    expect(resolver.calculateResolutionProgress(plans)).toBe(0);
  });

  it('19: generateResolutionReport returns correct structure', () => {
    const resolver = new AutonomousGapResolver();
    const report = resolver.generateResolutionReport();
    expect(report).toHaveProperty('totalPlans');
    expect(report).toHaveProperty('completedPlans');
    expect(report).toHaveProperty('inProgressPlans');
    expect(report).toHaveProperty('plannedPlans');
    expect(report).toHaveProperty('resolutionProgress');
    expect(report).toHaveProperty('plans');
    expect(report).toHaveProperty('timestamp');
  });

  it('20: generateResolutionReport totalPlans is correct', () => {
    const resolver = new AutonomousGapResolver();
    resolver.createResolutionPlan(sampleGap);
    resolver.createResolutionPlan(lowPriorityGap);
    const report = resolver.generateResolutionReport();
    expect(report.totalPlans).toBe(2);
  });

  it('21: generateResolutionReport counts completed correctly', () => {
    const resolver = new AutonomousGapResolver();
    const p1 = resolver.createResolutionPlan(sampleGap);
    resolver.createResolutionPlan(lowPriorityGap);
    resolver.executeResolutionPlan(p1.planId);
    const report = resolver.generateResolutionReport();
    expect(report.completedPlans).toBe(1);
    expect(report.plannedPlans).toBe(1);
  });

  it('22: generateResolutionReport timestamp is recent', () => {
    const resolver = new AutonomousGapResolver();
    const before = Date.now();
    const report = resolver.generateResolutionReport();
    const after = Date.now();
    expect(report.timestamp).toBeGreaterThanOrEqual(before);
    expect(report.timestamp).toBeLessThanOrEqual(after);
  });

  it('23: getReportHistory returns reports', () => {
    const resolver = new AutonomousGapResolver();
    resolver.generateResolutionReport();
    expect(resolver.getReportHistory()).toHaveLength(1);
  });

  it('24: multiple reports accumulate in history', () => {
    const resolver = new AutonomousGapResolver();
    resolver.generateResolutionReport();
    resolver.generateResolutionReport();
    expect(resolver.getReportHistory()).toHaveLength(2);
  });

  it('25: getReportHistory returns a copy', () => {
    const resolver = new AutonomousGapResolver();
    resolver.generateResolutionReport();
    const history = resolver.getReportHistory();
    history.pop();
    expect(resolver.getReportHistory()).toHaveLength(1);
  });

  it('26: getPlanById returns the correct plan', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan(sampleGap);
    const found = resolver.getPlanById(plan.planId);
    expect(found?.planId).toBe(plan.planId);
  });

  it('27: getPlanById returns undefined for unknown id', () => {
    const resolver = new AutonomousGapResolver();
    expect(resolver.getPlanById('unknown')).toBeUndefined();
  });

  it('28: getAllPlans returns all created plans', () => {
    const resolver = new AutonomousGapResolver();
    resolver.createResolutionPlan(sampleGap);
    resolver.createResolutionPlan(lowPriorityGap);
    resolver.createResolutionPlan(sampleGap);
    expect(resolver.getAllPlans()).toHaveLength(3);
  });

  it('29: resolutionSteps are stored by reference copy', () => {
    const resolver = new AutonomousGapResolver();
    const steps = ['A', 'B'];
    const plan = resolver.createResolutionPlan({ ...sampleGap, steps });
    steps.push('C');
    expect(plan.resolutionSteps).toHaveLength(2);
  });

  it('30: plan status mutates on execute', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan(sampleGap);
    expect(plan.status).toBe('PLANNED');
    resolver.executeResolutionPlan(plan.planId);
    expect(plan.status).toBe('COMPLETED');
  });

  it('31: prioritizePlans handles empty array', () => {
    const resolver = new AutonomousGapResolver();
    const result = resolver.prioritizePlans([]);
    expect(result).toHaveLength(0);
  });

  it('32: planId format includes plan prefix', () => {
    const resolver = new AutonomousGapResolver();
    const plan = resolver.createResolutionPlan(sampleGap);
    expect(plan.planId).toMatch(/^plan-/);
  });
});
