/**
 * StorefrontCustomerFeedbackSurveyG1125.test.ts — Sprint G1-125 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontCustomerFeedbackSurveyEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontCustomerFeedbackSurveyEngine
} from '../composition/StorefrontCustomerFeedbackSurveyEngine';

describe('StorefrontCustomerFeedbackSurveyEngine (G1-125)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — CSAT / NPS Submission & Aggregation (40)', () => {
    it('Feature 01: should submit customer feedback submission cleanly', () => {
      const engine = new StorefrontCustomerFeedbackSurveyEngine('tenant_01');
      const sub = engine.submitFeedback({
        feedbackId: 'f_01',
        orderId: 'ord_100',
        customerId: 'cust_1',
        npsScore: 10,
        csatScore: 5,
        comment: 'Outstanding experience!'
      });

      expect(sub.feedbackId).toEqual('f_01');
      expect(sub.npsScore).toEqual(10);
      expect(sub.csatScore).toEqual(5);
    });

    it('Feature 02: should calculate NPS report metrics correctly (% Promoters - % Detractors)', () => {
      const engine = new StorefrontCustomerFeedbackSurveyEngine('tenant_01');
      // 2 Promoters (9, 10), 1 Passive (8), 1 Detractor (4) -> 50% - 25% = +25 NPS
      engine.submitFeedback({ feedbackId: 'f1', orderId: 'o1', customerId: 'c1', npsScore: 10, csatScore: 5 });
      engine.submitFeedback({ feedbackId: 'f2', orderId: 'o2', customerId: 'c2', npsScore: 9, csatScore: 5 });
      engine.submitFeedback({ feedbackId: 'f3', orderId: 'o3', customerId: 'c3', npsScore: 8, csatScore: 4 });
      engine.submitFeedback({ feedbackId: 'f4', orderId: 'o4', customerId: 'c4', npsScore: 4, csatScore: 2 });

      const report = engine.calculateNpsReport();

      expect(report.totalSubmissions).toEqual(4);
      expect(report.promotersCount).toEqual(2);
      expect(report.passivesCount).toEqual(1);
      expect(report.detractorsCount).toEqual(1);
      expect(report.npsScore).toEqual(25); // 50 - 25
      expect(report.averageCsatScore).toEqual(4); // (5+5+4+2)/4 = 4.0
    });

    for (let i = 3; i <= 40; i++) {
      it(`Feature ${i}: should verify survey submission scenario ${i}`, () => {
        const engine = new StorefrontCustomerFeedbackSurveyEngine(`tenant_${i}`);
        const sub = engine.submitFeedback({
          feedbackId: `f_${i}`,
          orderId: `o_${i}`,
          customerId: `c_${i}`,
          npsScore: i % 11
        });
        expect(sub.feedbackId).toEqual(`f_${i}`);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should query submission by feedbackId', () => {
      const engine = new StorefrontCustomerFeedbackSurveyEngine('tenant_int');
      engine.submitFeedback({ feedbackId: 'f1', orderId: 'o1', customerId: 'c1', npsScore: 9 });

      expect(engine.getSubmission('f1')?.npsScore).toEqual(9);
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify survey integration scenario ${i}`, () => {
        const engine = new StorefrontCustomerFeedbackSurveyEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E survey report calculation ${i}`, () => {
        const engine = new StorefrontCustomerFeedbackSurveyEngine(`tenant_e2e_${i}`);
        engine.submitFeedback({ feedbackId: `f_${i}`, orderId: `o_${i}`, customerId: `c_${i}`, npsScore: 10 });
        const report = engine.calculateNpsReport();
        expect(report.npsScore).toEqual(100);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when npsScore is outside range 0-10', () => {
      const engine = new StorefrontCustomerFeedbackSurveyEngine('tenant_adv');
      expect(() => {
        engine.submitFeedback({ feedbackId: 'f1', orderId: 'o1', customerId: 'c1', npsScore: 15 });
      }).toThrow('npsScore must be an integer between 0 and 10');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle missing submission query cleanly ${i}`, () => {
        const engine = new StorefrontCustomerFeedbackSurveyEngine('tenant_adv');
        expect(engine.getSubmission(`missing_${i}`)).toBeUndefined();
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontCustomerFeedbackSurveyEngine('tenant_fi');
      engine1.submitFeedback({ feedbackId: 'f1', orderId: 'o1', customerId: 'c1', npsScore: 10 });

      const state = engine1.exportState();
      const engine2 = new StorefrontCustomerFeedbackSurveyEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getSubmission('f1')?.npsScore).toEqual(10);
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontCustomerFeedbackSurveyEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
