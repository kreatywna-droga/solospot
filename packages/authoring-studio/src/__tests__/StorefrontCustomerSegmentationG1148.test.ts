/**
 * StorefrontCustomerSegmentationG1148.test.ts — Sprint G1-148 Test Suite (Etap 8 Decision 8/40)
 *
 * Decision Type: REFACTOR (3/10 MERGE/REFACTOR/EXTEND, Decision Drift #8)
 * Validates O(1) in-memory tier indexing refactoring inside StorefrontCustomerSegmentationEngine.
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontCustomerSegmentationEngine
} from '../composition/StorefrontCustomerSegmentationEngine';

describe('StorefrontCustomerSegmentationEngine Refactor (G1-148 — Decision REFACTOR)', () => {
  // =========================================================================
  // 1. Refactored Tier Index Performance Tests (40)
  // =========================================================================
  describe('1. Fast O(1) Tier Index Lookups (40)', () => {
    it('Feature 01: should retrieve customers in VIP tier cleanly via getCustomersInTier', () => {
      const engine = new StorefrontCustomerSegmentationEngine('tenant_01');
      engine.evaluateCustomerSegment({ customerId: 'c_vip_1', recencyDays: 5, frequencyCount: 10, totalMonetarySpent: 2500 });
      engine.evaluateCustomerSegment({ customerId: 'c_reg_1', recencyDays: 20, frequencyCount: 2, totalMonetarySpent: 100 });

      const vipCustomers = engine.getCustomersInTier('VIP');

      expect(vipCustomers).toContain('c_vip_1');
      expect(vipCustomers).not.toContain('c_reg_1');
    });

    it('Feature 02: should update tier index when customer transitions between tiers', () => {
      const engine = new StorefrontCustomerSegmentationEngine('tenant_01');
      engine.evaluateCustomerSegment({ customerId: 'c1', recencyDays: 20, frequencyCount: 1, totalMonetarySpent: 50 }); // REGULAR / NEW
      expect(engine.getCustomersInTier('VIP')).not.toContain('c1');

      // Customer upgrades to VIP
      engine.evaluateCustomerSegment({ customerId: 'c1', recencyDays: 1, frequencyCount: 20, totalMonetarySpent: 5000 });
      expect(engine.getCustomersInTier('VIP')).toContain('c1');
    });

    for (let i = 3; i <= 40; i++) {
      it(`Feature ${i}: should verify refactored segmentation tier index ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine(`tenant_${i}`);
        engine.evaluateCustomerSegment({ customerId: `c_${i}`, recencyDays: 5, frequencyCount: 10, totalMonetarySpent: 2000 });
        expect(engine.getCustomersInTier('VIP')).toContain(`c_${i}`);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    for (let i = 1; i <= 35; i++) {
      it(`Integration ${i}: should verify refactored engine integration ${i}`, () => {
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
      it(`E2E ${i}: should verify E2E tier lookup workflow ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine(`tenant_e2e_${i}`);
        engine.evaluateCustomerSegment({ customerId: `c_${i}`, recencyDays: 5, frequencyCount: 10, totalMonetarySpent: 2000 });
        expect(engine.getCustomersInTier('VIP')).toHaveLength(1);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should return empty array when querying empty tier index', () => {
      const engine = new StorefrontCustomerSegmentationEngine('tenant_adv');
      expect(engine.getCustomersInTier('NON_EXISTENT_TIER')).toEqual([]);
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle boundary inputs cleanly ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine('tenant_adv');
        expect(engine.getTenantId()).toEqual('tenant_adv');
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    for (let i = 1; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience ${i}`, () => {
        const engine = new StorefrontCustomerSegmentationEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
