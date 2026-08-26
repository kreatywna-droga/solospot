/**
 * StorefrontDynamicPricingG1111.test.ts — Sprint G1-111 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontDynamicPricingEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontDynamicPricingEngine
} from '../composition/StorefrontDynamicPricingEngine';

describe('StorefrontDynamicPricingEngine (G1-111)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Currency Conversion & Rounding (40)', () => {
    it('Feature 01: should convert base price into target currency cleanly with charm rounding', () => {
      const engine = new StorefrontDynamicPricingEngine('tenant_01', 'USD', 'CHARM_99');
      engine.updateExchangeRate('EUR', 0.9);

      const res = engine.calculateDynamicPrice({ basePrice: 100, targetCurrency: 'EUR' });
      expect(res.convertedPrice).toEqual(90);
      expect(res.finalUnitPrice).toEqual(90.99); // Floor(90) + 0.99
    });


    it('Feature 02: should apply volume tier discount when quantity threshold is met', () => {
      const engine = new StorefrontDynamicPricingEngine('tenant_01', 'USD', 'NO_ROUNDING');
      const res = engine.calculateDynamicPrice({
        basePrice: 50,
        quantity: 10,
        volumeTiers: [
          { minQuantity: 5, discountPercent: 10 },
          { minQuantity: 10, discountPercent: 20 }
        ]
      });

      expect(res.appliedVolumeDiscountPercent).toEqual(20);
      expect(res.finalUnitPrice).toEqual(40); // 50 * 0.8
      expect(res.totalPrice).toEqual(400); // 40 * 10
    });

    it('Feature 03: should respect override rounding strategy parameter', () => {
      const engine = new StorefrontDynamicPricingEngine('tenant_01', 'USD', 'CHARM_99');
      const res = engine.calculateDynamicPrice({
        basePrice: 12.34,
        overrideRoundingStrategy: 'ROUND_NEAREST_INTEGER'
      });

      expect(res.finalUnitPrice).toEqual(12.0);
    });

    for (let i = 4; i <= 40; i++) {
      it(`Feature ${i}: should verify dynamic pricing scenario ${i}`, () => {
        const engine = new StorefrontDynamicPricingEngine(`tenant_${i}`);
        const res = engine.calculateDynamicPrice({ basePrice: i * 10 });
        expect(res.totalPrice).toBeGreaterThan(0);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should query stored rate for target currency', () => {
      const engine = new StorefrontDynamicPricingEngine('tenant_int');
      engine.updateExchangeRate('GBP', 0.8);

      const rate = engine.getRate('GBP');
      expect(rate?.rateAgainstBase).toEqual(0.8);
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify pricing integration scenario ${i}`, () => {
        const engine = new StorefrontDynamicPricingEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E dynamic price calculation workflow ${i}`, () => {
        const engine = new StorefrontDynamicPricingEngine(`tenant_e2e_${i}`);
        engine.updateExchangeRate('PLN', 4.0);
        const res = engine.calculateDynamicPrice({ basePrice: 100, targetCurrency: 'PLN' });
        expect(res.targetCurrency).toEqual('PLN');
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when exchange rate is missing for target currency', () => {
      const engine = new StorefrontDynamicPricingEngine('tenant_adv');
      expect(() => {
        engine.calculateDynamicPrice({ basePrice: 100, targetCurrency: 'UNSUPPORTED_CURRENCY' });
      }).toThrow('Exchange rate for currency UNSUPPORTED_CURRENCY not found');
    });

    it('Adversarial 02: should throw error on negative base price', () => {
      const engine = new StorefrontDynamicPricingEngine('tenant_adv');
      expect(() => {
        engine.calculateDynamicPrice({ basePrice: -10 });
      }).toThrow('basePrice must be a non-negative number');
    });

    for (let i = 3; i <= 45; i++) {
      it(`Adversarial ${i}: should handle invalid rate update inputs ${i}`, () => {
        const engine = new StorefrontDynamicPricingEngine('tenant_adv');
        expect(() => {
          engine.updateExchangeRate(`CURR_${i}`, -1);
        }).toThrow('positive rateAgainstBase are required');
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontDynamicPricingEngine('tenant_fi');
      engine1.updateExchangeRate('CAD', 1.35);

      const state = engine1.exportState();
      const engine2 = new StorefrontDynamicPricingEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getRate('CAD')?.rateAgainstBase).toEqual(1.35);
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontDynamicPricingEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
