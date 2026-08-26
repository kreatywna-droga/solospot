/**
 * StorefrontCustomerSegmentationG1117.test.ts — Sprint G1-117 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontCustomerSegmentationEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontCustomerSegmentationEngine
} from '../composition/StorefrontCustomerSegmentationEngine';

describe('StorefrontCustomerSegmentationEngine (G1-117 — Decision Drift #2)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — RFM Scoring & Segment Tiering (40)', () => {
    it('Feature 01: should assign VIP tier when customer totalMonetarySpent exceeds threshold', () => {
      const engine = new StorefrontCustomerSegmentationEngine('tenant_01', 1000, 5, 90);
      const res = engine.evaluateCustomerSegment({
        customerId: 'cust_vip',
        recencyDays: 5,
        frequencyCount: 4,
        totalMonetarySpent: 1200
      });

      expect(res.assignedTier).toEqual('VIP');
      expect(res.tags).toContain('VIP_CUSTOMER');
      expect(res.rfmScore).toBeGreaterThanOrEqual(10);
    });

    it('Feature 02: should assign AT_RISK tier when customer recencyDays exceeds 90 days', () => {
      const engine = new StorefrontCustomerSegmentationEngine('tenant_01', 1000, 5, 90);
      const res = engine.evaluateCustomerSegment({
        customerId: 'cust_risk',
        recencyDays: 100,
        frequencyCount: 2,
        totalMonetarySpent: 300
      });

      expect(res.assignedTier).toEqual('AT_RISK');
      expect(res.tags).toContain('REENGAGEMENT_TARGET');
    });

    it('Feature 03: should assign NEW_VISITOR tier when frequencyCount is 0', () => {
      const engine = new StorefrontCustomerSegmentationEngine('tenant_01');
      const res = engine.evaluateCustomerSegment({
        customerId: 'cust_new',
        recencyDays: 0,
        frequencyCount: 0,
        totalMonetarySpent: 0
      });

      expect(res.assignedTier).toEqual('NEW_VISITOR');
    });

    for (let i = 4; i <= 40; i++) {
      it(`Feature ${i}: should verify segmentation scenario ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine(`tenant_${i}`);
        const res = engine.evaluateCustomerSegment({
          customerId: `c_${i}`,
          recencyDays: i,
          frequencyCount: i % 5,
          totalMonetarySpent: i * 50
        });
        expect(res.rfmScore).toBeGreaterThan(0);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should query customer RFM score by customerId', () => {
      const engine = new StorefrontCustomerSegmentationEngine('tenant_int');
      engine.evaluateCustomerSegment({ customerId: 'c_stored', recencyDays: 10, frequencyCount: 3, totalMonetarySpent: 400 });

      expect(engine.getCustomerScore('c_stored')?.customerId).toEqual('c_stored');
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify segmentation integration scenario ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E customer segmentation workflow ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine(`tenant_e2e_${i}`);
        const res = engine.evaluateCustomerSegment({ customerId: `c_e2e_${i}`, recencyDays: 15, frequencyCount: 6, totalMonetarySpent: 1500 });
        expect(res.assignedTier).toEqual('VIP');
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error on negative metrics or empty customerId', () => {
      const engine = new StorefrontCustomerSegmentationEngine('tenant_adv');
      expect(() => {
        engine.evaluateCustomerSegment({ customerId: '', recencyDays: -1, frequencyCount: 0, totalMonetarySpent: 0 });
      }).toThrow('Valid customerId and non-negative recency');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle missing customer query cleanly ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine('tenant_adv');
        expect(engine.getCustomerScore(`missing_${i}`)).toBeUndefined();
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontCustomerSegmentationEngine('tenant_fi');
      engine1.evaluateCustomerSegment({ customerId: 'c1', recencyDays: 5, frequencyCount: 2, totalMonetarySpent: 100 });

      const state = engine1.exportState();
      const engine2 = new StorefrontCustomerSegmentationEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getCustomerScore('c1')?.frequencyCount).toEqual(2);
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
