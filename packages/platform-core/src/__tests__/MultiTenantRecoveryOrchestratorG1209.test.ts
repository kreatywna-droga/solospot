/**
 * MultiTenantRecoveryOrchestratorG1209.test.ts — G1-209 Multi-Tenant Recovery Orchestrator
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MultiTenantRecoveryOrchestrator,
  TenantRecoveryPlan,
} from '../MultiTenantRecoveryOrchestrator';

describe('MultiTenantRecoveryOrchestrator', () => {
  let orchestrator: MultiTenantRecoveryOrchestrator;

  beforeEach(() => {
    orchestrator = new MultiTenantRecoveryOrchestrator();
  });

  // ── createRecoveryPlan ──

  describe('createRecoveryPlan()', () => {
    it('creates a recovery plan', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'db-failure');
      expect(plan.tenantId).toBe('t1');
      expect(plan.failureScenario).toBe('db-failure');
    });

    it('generates unique planId', () => {
      const p1 = orchestrator.createRecoveryPlan('t1', 'a');
      const p2 = orchestrator.createRecoveryPlan('t1', 'a');
      expect(p1.planId).not.toBe(p2.planId);
    });

    it('uses default recovery steps when none provided', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x');
      expect(plan.recoverySteps).toEqual(['assess', 'isolate', 'restore', 'verify']);
    });

    it('uses default estimatedRto of 300000', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x');
      expect(plan.estimatedRto).toBe(300000);
    });

    it('uses default priority MEDIUM', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x');
      expect(plan.priority).toBe('MEDIUM');
    });

    it('accepts custom options', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x', {
        steps: ['a', 'b'],
        estimatedRto: 60000,
        priority: 'CRITICAL',
      });
      expect(plan.recoverySteps).toEqual(['a', 'b']);
      expect(plan.estimatedRto).toBe(60000);
      expect(plan.priority).toBe('CRITICAL');
    });

    it('throws on empty tenantId', () => {
      expect(() => orchestrator.createRecoveryPlan('', 'x')).toThrow('tenantId must be a non-empty string');
    });

    it('throws on empty scenario', () => {
      expect(() => orchestrator.createRecoveryPlan('t1', '')).toThrow('scenario must be a non-empty string');
    });

    it('throws on whitespace-only tenantId', () => {
      expect(() => orchestrator.createRecoveryPlan('  ', 'x')).toThrow('tenantId must be a non-empty string');
    });

    it('initializes with PENDING status', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x');
      expect(plan.status).toBe('PENDING');
    });

    it('initializes completedSteps as empty array', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x');
      expect(plan.completedSteps).toEqual([]);
    });

    it('trims whitespace from tenantId and scenario', () => {
      const plan = orchestrator.createRecoveryPlan('  t1  ', '  db-down  ');
      expect(plan.tenantId).toBe('t1');
      expect(plan.failureScenario).toBe('db-down');
    });
  });

  // ── executeRecoveryPlan ──

  describe('executeRecoveryPlan()', () => {
    it('executes a plan and sets status to COMPLETED', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x');
      const result = orchestrator.executeRecoveryPlan(plan.planId);
      expect(result).toBeDefined();
      expect(result!.status).toBe('COMPLETED');
    });

    it('marks all steps as completed', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x', { steps: ['a', 'b', 'c'] });
      const result = orchestrator.executeRecoveryPlan(plan.planId);
      expect(result!.completedSteps).toEqual(['a', 'b', 'c']);
    });

    it('sets executedAtMs', () => {
      const before = Date.now();
      const plan = orchestrator.createRecoveryPlan('t1', 'x');
      orchestrator.executeRecoveryPlan(plan.planId);
      const result = orchestrator.getPlan(plan.planId);
      expect(result!.executedAtMs).toBeGreaterThanOrEqual(before);
    });

    it('returns undefined for unknown planId', () => {
      const result = orchestrator.executeRecoveryPlan('rp-fake');
      expect(result).toBeUndefined();
    });

    it('preserves tenantId and scenario', () => {
      const plan = orchestrator.createRecoveryPlan('t5', 'network outage');
      const result = orchestrator.executeRecoveryPlan(plan.planId);
      expect(result!.tenantId).toBe('t5');
      expect(result!.failureScenario).toBe('network outage');
    });
  });

  // ── prioritizeRecoveryPlans ──

  describe('prioritizeRecoveryPlans()', () => {
    it('sorts by priority descending', () => {
      const p1 = orchestrator.createRecoveryPlan('t1', 'a', { priority: 'LOW' });
      const p2 = orchestrator.createRecoveryPlan('t2', 'b', { priority: 'CRITICAL' });
      const p3 = orchestrator.createRecoveryPlan('t3', 'c', { priority: 'MEDIUM' });

      const sorted = orchestrator.prioritizeRecoveryPlans();
      expect(sorted[0].priority).toBe('CRITICAL');
      expect(sorted[1].priority).toBe('MEDIUM');
      expect(sorted[2].priority).toBe('LOW');
    });

    it('sorts by RTO when same priority', () => {
      const p1 = orchestrator.createRecoveryPlan('t1', 'a', { priority: 'HIGH', estimatedRto: 600000 });
      const p2 = orchestrator.createRecoveryPlan('t2', 'b', { priority: 'HIGH', estimatedRto: 100000 });

      const sorted = orchestrator.prioritizeRecoveryPlans();
      expect(sorted[0].planId).toBe(p2.planId);
      expect(sorted[1].planId).toBe(p1.planId);
    });

    it('returns empty array when no plans', () => {
      const sorted = orchestrator.prioritizeRecoveryPlans();
      expect(sorted).toHaveLength(0);
    });

    it('sorts all priority levels correctly', () => {
      orchestrator.createRecoveryPlan('t1', 'a', { priority: 'LOW' });
      orchestrator.createRecoveryPlan('t2', 'b', { priority: 'CRITICAL' });
      orchestrator.createRecoveryPlan('t3', 'c', { priority: 'HIGH' });
      orchestrator.createRecoveryPlan('t4', 'd', { priority: 'MEDIUM' });

      const sorted = orchestrator.prioritizeRecoveryPlans();
      expect(sorted.map((p) => p.priority)).toEqual(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']);
    });

    it('accepts external array', () => {
      const plans: TenantRecoveryPlan[] = [
        { planId: 'p1', tenantId: 't1', failureScenario: 'a', recoverySteps: [], estimatedRto: 100, priority: 'LOW', status: 'PENDING', completedSteps: [] },
        { planId: 'p2', tenantId: 't2', failureScenario: 'b', recoverySteps: [], estimatedRto: 100, priority: 'CRITICAL', status: 'PENDING', completedSteps: [] },
      ];
      const sorted = orchestrator.prioritizeRecoveryPlans(plans);
      expect(sorted[0].priority).toBe('CRITICAL');
    });
  });

  // ── getRecoveryStatus ──

  describe('getRecoveryStatus()', () => {
    it('returns empty array when no plans', () => {
      expect(orchestrator.getRecoveryStatus()).toHaveLength(0);
    });

    it('returns status for all plans', () => {
      orchestrator.createRecoveryPlan('t1', 'a');
      orchestrator.createRecoveryPlan('t2', 'b');
      const status = orchestrator.getRecoveryStatus();
      expect(status).toHaveLength(2);
    });

    it('includes completedSteps count', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'a', { steps: ['x', 'y'] });
      orchestrator.executeRecoveryPlan(plan.planId);
      const status = orchestrator.getRecoveryStatus();
      expect(status[0].completedSteps).toBe(2);
      expect(status[0].totalSteps).toBe(2);
    });

    it('defaults status to PENDING', () => {
      orchestrator.createRecoveryPlan('t1', 'a');
      const status = orchestrator.getRecoveryStatus();
      expect(status[0].status).toBe('PENDING');
    });

    it('shows COMPLETED status after execution', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'a');
      orchestrator.executeRecoveryPlan(plan.planId);
      const status = orchestrator.getRecoveryStatus();
      expect(status[0].status).toBe('COMPLETED');
    });
  });

  // ── validateRecoveryCompleteness ──

  describe('validateRecoveryCompleteness()', () => {
    it('returns true for completed plan with all steps', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'a');
      orchestrator.executeRecoveryPlan(plan.planId);
      expect(orchestrator.validateRecoveryCompleteness(plan.planId)).toBe(true);
    });

    it('returns false for pending plan', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'a');
      expect(orchestrator.validateRecoveryCompleteness(plan.planId)).toBe(false);
    });

    it('returns false for unknown planId', () => {
      expect(orchestrator.validateRecoveryCompleteness('rp-fake')).toBe(false);
    });

    it('returns false for plan with partial steps', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'a', { steps: ['a', 'b', 'c'] });
      // Manually set to COMPLETED but incomplete steps
      const idx = (orchestrator as any).plans.findIndex((p: any) => p.planId === plan.planId);
      (orchestrator as any).plans[idx].status = 'COMPLETED';
      (orchestrator as any).plans[idx].completedSteps = ['a'];
      expect(orchestrator.validateRecoveryCompleteness(plan.planId)).toBe(false);
    });
  });

  // ── generateRecoveryReport ──

  describe('generateRecoveryReport()', () => {
    it('generates report with no plans', () => {
      const report = orchestrator.generateRecoveryReport();
      expect(report.totalPlans).toBe(0);
      expect(report.recoveryValid).toBe(true);
    });

    it('reports pending plans as violations', () => {
      orchestrator.createRecoveryPlan('t1', 'a');
      const report = orchestrator.generateRecoveryReport();
      expect(report.pendingPlans).toBe(1);
      expect(report.violations.length).toBeGreaterThan(0);
    });

    it('reports completed plans', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'a');
      orchestrator.executeRecoveryPlan(plan.planId);
      const report = orchestrator.generateRecoveryReport();
      expect(report.completedPlans).toBe(1);
      expect(report.pendingPlans).toBe(0);
      expect(report.recoveryValid).toBe(true);
    });

    it('generates execution order based on priority', () => {
      orchestrator.createRecoveryPlan('t1', 'a', { priority: 'LOW' });
      orchestrator.createRecoveryPlan('t2', 'b', { priority: 'CRITICAL' });
      const report = orchestrator.generateRecoveryReport();
      expect(report.executionOrder).toHaveLength(2);
    });

    it('includes generatedAtMs timestamp', () => {
      const before = Date.now();
      const report = orchestrator.generateRecoveryReport();
      const after = Date.now();
      expect(report.generatedAtMs).toBeGreaterThanOrEqual(before);
      expect(report.generatedAtMs).toBeLessThanOrEqual(after);
    });

    it('reports allStepsCompleted correctly', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'a');
      orchestrator.executeRecoveryPlan(plan.planId);
      const report = orchestrator.generateRecoveryReport();
      expect(report.allStepsCompleted).toBe(true);
    });

    it('reports allStepsCompleted false when plans pending', () => {
      orchestrator.createRecoveryPlan('t1', 'a');
      const report = orchestrator.generateRecoveryReport();
      expect(report.allStepsCompleted).toBe(false);
    });
  });

  // ── edge cases ──

  describe('edge cases', () => {
    it('handles many plans across tenants', () => {
      for (let i = 0; i < 30; i++) {
        orchestrator.createRecoveryPlan(`t${i % 5}`, `scenario-${i}`, {
          priority: (['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const)[i % 4],
        });
      }
      const report = orchestrator.generateRecoveryReport();
      expect(report.totalPlans).toBe(30);
    });

    it('clear removes all plans', () => {
      orchestrator.createRecoveryPlan('t1', 'a');
      orchestrator.createRecoveryPlan('t2', 'b');
      orchestrator.clear();
      expect(orchestrator.getPlans()).toHaveLength(0);
    });

    it('getPlan returns correct plan', () => {
      const plan = orchestrator.createRecoveryPlan('t1', 'x');
      expect(orchestrator.getPlan(plan.planId)?.tenantId).toBe('t1');
    });

    it('getPlan returns undefined for unknown id', () => {
      expect(orchestrator.getPlan('rp-fake')).toBeUndefined();
    });
  });
});
