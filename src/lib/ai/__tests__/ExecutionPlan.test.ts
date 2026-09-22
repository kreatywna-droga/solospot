/**
 * ExecutionPlan.test.ts — Unit tests for execution state tracking
 */
import { describe, it, expect } from 'vitest';
import { ExecutionPlanManager } from '../ExecutionPlan';

describe('ExecutionPlanManager', () => {
  describe('createPlan', () => {
    it('creates plan for INSERT_SECTION', () => {
      const plan = ExecutionPlanManager.createPlan('INSERT_SECTION', 'Dodaj testimonials', ['testimonials']);
      expect(plan.intent).toBe('INSERT_SECTION');
      expect(plan.steps.length).toBe(5);
      expect(plan.steps[0].action).toBe('CLASSIFY_INTENT');
      expect(plan.steps[0].status).toBe('DONE');
      expect(plan.steps[1].action).toBe('SEARCH_LIBRARY');
      expect(plan.steps[1].status).toBe('PENDING');
      expect(plan.steps[3].action).toBe('INSERT_SECTION');
    });

    it('creates plan for INSERT_EXPERIENCE', () => {
      const plan = ExecutionPlanManager.createPlan('INSERT_EXPERIENCE', 'Dodaj parallax', []);
      expect(plan.steps.length).toBe(6);
      expect(plan.steps[2].action).toBe('SELECT_EXPERIENCE');
    });

    it('creates plan for CHAT', () => {
      const plan = ExecutionPlanManager.createPlan('CHAT', 'Cześć', []);
      expect(plan.steps.length).toBe(2);
    });

    it('creates plan for UNDO', () => {
      const plan = ExecutionPlanManager.createPlan('UNDO', 'cofnij', []);
      expect(plan.steps[1].action).toBe('UNDO');
    });

    it('creates plan for REDO', () => {
      const plan = ExecutionPlanManager.createPlan('REDO', 'ponów', []);
      expect(plan.steps[1].action).toBe('REDO');
    });
  });

  describe('advancePlan', () => {
    it('advances to next step', () => {
      let plan = ExecutionPlanManager.createPlan('INSERT_SECTION', 'test', ['testimonials']);
      expect(plan.currentStepIndex).toBe(0);

      plan = ExecutionPlanManager.advancePlan(plan, { searched: true });
      expect(plan.currentStepIndex).toBe(1);
      expect(plan.steps[0].status).toBe('DONE');
      expect(plan.steps[0].result).toEqual({ searched: true });
    });

    it('marks plan as DONE when all steps complete', () => {
      let plan = ExecutionPlanManager.createPlan('CHAT', 'test', []);
      plan = ExecutionPlanManager.advancePlan(plan);
      expect(plan.status).toBe('DONE');
    });

    it('does not mutate original plan', () => {
      const original = ExecutionPlanManager.createPlan('INSERT_SECTION', 'test', ['testimonials']);
      const originalSteps = [...original.steps];
      ExecutionPlanManager.advancePlan(original);
      expect(original.steps).toEqual(originalSteps);
      expect(original.currentStepIndex).toBe(0);
    });
  });

  describe('failPlan', () => {
    it('marks plan as FAILED', () => {
      const plan = ExecutionPlanManager.createPlan('INSERT_SECTION', 'test', []);
      const failed = ExecutionPlanManager.failPlan(plan, 'Model error');
      expect(failed.status).toBe('FAILED');
      expect(failed.steps[0].error).toBe('Model error');
    });

    it('does not mutate original plan', () => {
      const original = ExecutionPlanManager.createPlan('INSERT_SECTION', 'test', []);
      ExecutionPlanManager.failPlan(original, 'error');
      expect(original.status).toBe('PLANNING');
    });
  });

  describe('getCurrentStep', () => {
    it('returns current step', () => {
      const plan = ExecutionPlanManager.createPlan('INSERT_SECTION', 'test', []);
      const step = ExecutionPlanManager.getCurrentStep(plan);
      expect(step?.action).toBe('CLASSIFY_INTENT');
      expect(step?.status).toBe('DONE');
    });
  });

  describe('addStep', () => {
    it('adds step at end', () => {
      const plan = ExecutionPlanManager.createPlan('CHAT', 'test', []);
      const updated = ExecutionPlanManager.addStep(plan, {
        action: 'VERIFY',
        status: 'PENDING',
      });
      expect(updated.steps.length).toBe(3);
      expect(updated.steps[2].action).toBe('VERIFY');
    });

    it('adds step after specific index', () => {
      const plan = ExecutionPlanManager.createPlan('INSERT_SECTION', 'test', []);
      const updated = ExecutionPlanManager.addStep(plan, {
        action: 'REFINE',
        status: 'PENDING',
      }, 1);
      expect(updated.steps[2].action).toBe('REFINE');
    });
  });
});
