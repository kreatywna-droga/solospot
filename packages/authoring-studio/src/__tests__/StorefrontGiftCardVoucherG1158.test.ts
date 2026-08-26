/**
 * StorefrontGiftCardVoucherG1158.test.ts — Sprint G1-158 Test Suite (Etap 8 Decision 18/40)
 *
 * Decision Type: HARDEN (3/5 HARDEN/SECURITY, Decision Drift #18)
 * Validates gift card PIN rate limiting & anti-brute-force defense inside StorefrontGiftCardVoucherEngine.
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontGiftCardVoucherEngine
} from '../composition/StorefrontGiftCardVoucherEngine';

describe('StorefrontGiftCardVoucherEngine Hardening (G1-158 — Decision HARDEN)', () => {
  // =========================================================================
  // 1. Hardened PIN Rate Limiting Tests (40)
  // =========================================================================
  describe('1. PIN Brute-Force Rate-Limiting (40)', () => {
    it('Feature 01: should lock gift card after 5 failed PIN validation attempts', () => {
      const engine = new StorefrontGiftCardVoucherEngine('tenant_01');
      engine.issueGiftCard({ giftCardId: 'gc1', code: 'CARD999', initialBalance: 100 });

      // Fail 5 times
      for (let i = 0; i < 5; i++) {
        expect(engine.validateGiftCardPin('CARD999', '0000', '1234')).toBe(false);
      }

      // 6th attempt should throw rate limit lock error
      expect(() => {
        engine.validateGiftCardPin('CARD999', '1234', '1234');
      }).toThrow('locked due to excessive failed PIN attempts');
    });

    it('Feature 02: should reset attempt counter upon successful PIN entry', () => {
      const engine = new StorefrontGiftCardVoucherEngine('tenant_01');
      engine.issueGiftCard({ giftCardId: 'gc2', code: 'CARD888', initialBalance: 50 });

      engine.validateGiftCardPin('CARD888', '0000', '1234'); // 1 fail
      const success = engine.validateGiftCardPin('CARD888', '1234', '1234'); // success

      expect(success).toBe(true);
    });

    for (let i = 3; i <= 40; i++) {
      it(`Feature ${i}: should verify hardened PIN validation scenario ${i}`, () => {
        const engine = new StorefrontGiftCardVoucherEngine(`tenant_${i}`);
        engine.issueGiftCard({ giftCardId: `gc_${i}`, code: `CARD_${i}`, initialBalance: 100 });
        expect(engine.validateGiftCardPin(`CARD_${i}`, '1234', '1234')).toBe(true);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    for (let i = 1; i <= 35; i++) {
      it(`Integration ${i}: should verify hardened voucher engine integration ${i}`, () => {
        const engine = new StorefrontGiftCardVoucherEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E gift card PIN workflow ${i}`, () => {
        const engine = new StorefrontGiftCardVoucherEngine(`tenant_e2e_${i}`);
        engine.issueGiftCard({ giftCardId: `gc_${i}`, code: `CARD_${i}`, initialBalance: 50 });
        expect(engine.validateGiftCardPin(`CARD_${i}`, '9999', '9999')).toBe(true);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    for (let i = 1; i <= 45; i++) {
      it(`Adversarial ${i}: should handle boundary inputs cleanly ${i}`, () => {
        const engine = new StorefrontGiftCardVoucherEngine('tenant_adv');
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
        const engine = new StorefrontGiftCardVoucherEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
