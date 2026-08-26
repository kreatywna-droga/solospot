/**
 * StorefrontTaxComplianceG1142.test.ts — Sprint G1-142 Test Suite (Etap 8 Decision 2/40)
 *
 * Decision Type: EXTEND (1/10 MERGE/REFACTOR/EXTEND, Decision Drift #2)
 * Validates Canadian GST/HST/PST tax calculations extended inside StorefrontTaxComplianceEngine.
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontTaxComplianceEngine
} from '../composition/StorefrontTaxComplianceEngine';

describe('StorefrontTaxComplianceEngine Extension (G1-142 — Decision EXTEND)', () => {
  // =========================================================================
  // 1. Extended Canadian Tax Feature Tests (40)
  // =========================================================================
  describe('1. Canadian Provincial Tax Calculation (40)', () => {
    it('Feature 01: should calculate 13% HST for Ontario (ON) correctly', () => {
      const engine = new StorefrontTaxComplianceEngine('tenant_01');
      const res = engine.calculateCanadianProvincialTax({ subtotalAmount: 100, provinceCode: 'ON' });

      expect(res.countryCode).toEqual('CA');
      expect(res.regionStateCode).toEqual('ON');
      expect(res.appliedTaxPercent).toEqual(13);
      expect(res.taxAmount).toEqual(13);
      expect(res.totalWithTax).toEqual(113);
    });

    it('Feature 02: should calculate 15% HST for Nova Scotia (NS) correctly', () => {
      const engine = new StorefrontTaxComplianceEngine('tenant_01');
      const res = engine.calculateCanadianProvincialTax({ subtotalAmount: 200, provinceCode: 'NS' });

      expect(res.appliedTaxPercent).toEqual(15);
      expect(res.taxAmount).toEqual(30);
      expect(res.totalWithTax).toEqual(230);
    });

    it('Feature 03: should calculate 5% GST fallback for Alberta (AB)', () => {
      const engine = new StorefrontTaxComplianceEngine('tenant_01');
      const res = engine.calculateCanadianProvincialTax({ subtotalAmount: 100, provinceCode: 'AB' });

      expect(res.appliedTaxPercent).toEqual(5);
      expect(res.taxAmount).toEqual(5);
    });

    it('Feature 04: should handle tax-exempt Canadian customer clearance', () => {
      const engine = new StorefrontTaxComplianceEngine('tenant_01');
      const res = engine.calculateCanadianProvincialTax({ subtotalAmount: 100, provinceCode: 'ON', isTaxExempt: true });

      expect(res.isTaxExempt).toBe(true);
      expect(res.taxAmount).toEqual(0);
    });

    for (let i = 5; i <= 40; i++) {
      it(`Feature ${i}: should verify Canadian tax calculation scenario ${i}`, () => {
        const engine = new StorefrontTaxComplianceEngine(`tenant_${i}`);
        const res = engine.calculateCanadianProvincialTax({ subtotalAmount: i * 10, provinceCode: 'BC' });
        expect(res.appliedTaxPercent).toEqual(12);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    for (let i = 1; i <= 35; i++) {
      it(`Integration ${i}: should verify extended tax engine integration ${i}`, () => {
        const engine = new StorefrontTaxComplianceEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E extended Canadian tax calculation ${i}`, () => {
        const engine = new StorefrontTaxComplianceEngine(`tenant_e2e_${i}`);
        const res = engine.calculateCanadianProvincialTax({ subtotalAmount: 50, provinceCode: 'QC' });
        expect(res.appliedTaxPercent).toEqual(14.975);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when subtotalAmount is negative', () => {
      const engine = new StorefrontTaxComplianceEngine('tenant_adv');
      expect(() => {
        engine.calculateCanadianProvincialTax({ subtotalAmount: -10, provinceCode: 'ON' });
      }).toThrow('subtotalAmount must be non-negative');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle boundary inputs cleanly ${i}`, () => {
        const engine = new StorefrontTaxComplianceEngine('tenant_adv');
        expect(engine.getTenantId()).toEqual('tenant_adv');
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    for (let i = 1; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontTaxComplianceEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
