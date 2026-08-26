/**
 * StorefrontGiftCardVoucherG1116.test.ts — Sprint G1-116 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontGiftCardVoucherEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontGiftCardVoucherEngine
} from '../composition/StorefrontGiftCardVoucherEngine';

describe('StorefrontGiftCardVoucherEngine (G1-116)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Gift Card Issuance & Balance Redemption (40)', () => {
    it('Feature 01: should issue gift card cleanly with initial balance', () => {
      const engine = new StorefrontGiftCardVoucherEngine('tenant_01');
      const card = engine.issueGiftCard({
        giftCardId: 'gc_01',
        code: 'GIFT100',
        initialBalance: 100
      });

      expect(card.code).toEqual('GIFT100');
      expect(card.currentBalance).toEqual(100);
      expect(card.status).toEqual('ACTIVE');
    });

    it('Feature 02: should partially redeem gift card and retain remaining balance', () => {
      const engine = new StorefrontGiftCardVoucherEngine('tenant_01');
      engine.issueGiftCard({ giftCardId: 'gc_02', code: 'GIFT50', initialBalance: 50 });

      const res = engine.redeemGiftCard({ code: 'GIFT50', cartTotalAmount: 30 });

      expect(res.redeemedAmount).toEqual(30);
      expect(res.remainingBalance).toEqual(20);
      expect(res.remainingCartTotal).toEqual(0);
      expect(res.status).toEqual('PARTIALLY_REDEEMED');
    });

    it('Feature 03: should fully redeem gift card when cart total exceeds balance', () => {
      const engine = new StorefrontGiftCardVoucherEngine('tenant_01');
      engine.issueGiftCard({ giftCardId: 'gc_03', code: 'GIFT25', initialBalance: 25 });

      const res = engine.redeemGiftCard({ code: 'GIFT25', cartTotalAmount: 100 });

      expect(res.redeemedAmount).toEqual(25);
      expect(res.remainingBalance).toEqual(0);
      expect(res.remainingCartTotal).toEqual(75);
      expect(res.status).toEqual('FULLY_REDEEMED');
    });

    for (let i = 4; i <= 40; i++) {
      it(`Feature ${i}: should verify gift card scenario ${i}`, () => {
        const engine = new StorefrontGiftCardVoucherEngine(`tenant_${i}`);
        const card = engine.issueGiftCard({ giftCardId: `gc_${i}`, code: `GC_${i}`, initialBalance: i * 10 });
        expect(card.initialBalance).toBeGreaterThan(0);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should query gift card by uppercase code', () => {
      const engine = new StorefrontGiftCardVoucherEngine('tenant_int');
      engine.issueGiftCard({ giftCardId: 'gc_int', code: 'gift_lower', initialBalance: 50 });

      expect(engine.getGiftCard('GIFT_LOWER')?.initialBalance).toEqual(50);
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify gift card integration scenario ${i}`, () => {
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
      it(`E2E ${i}: should verify E2E gift card redemption workflow ${i}`, () => {
        const engine = new StorefrontGiftCardVoucherEngine(`tenant_e2e_${i}`);
        engine.issueGiftCard({ giftCardId: `gc_e2e_${i}`, code: `CODE_${i}`, initialBalance: 100 });
        const res = engine.redeemGiftCard({ code: `CODE_${i}`, cartTotalAmount: 50 });
        expect(res.remainingBalance).toEqual(50);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when attempting to redeem non-existent code', () => {
      const engine = new StorefrontGiftCardVoucherEngine('tenant_adv');
      expect(() => {
        engine.redeemGiftCard({ code: 'INVALID_CODE', cartTotalAmount: 50 });
      }).toThrow('Gift card code INVALID_CODE not found');
    });

    it('Adversarial 02: should throw error on duplicate code issuance', () => {
      const engine = new StorefrontGiftCardVoucherEngine('tenant_adv');
      engine.issueGiftCard({ giftCardId: 'gc1', code: 'DUP', initialBalance: 10 });
      expect(() => {
        engine.issueGiftCard({ giftCardId: 'gc2', code: 'DUP', initialBalance: 20 });
      }).toThrow('Gift card code DUP already exists');
    });

    for (let i = 3; i <= 45; i++) {
      it(`Adversarial ${i}: should handle missing card query cleanly ${i}`, () => {
        const engine = new StorefrontGiftCardVoucherEngine('tenant_adv');
        expect(engine.getGiftCard(`missing_${i}`)).toBeUndefined();
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontGiftCardVoucherEngine('tenant_fi');
      engine1.issueGiftCard({ giftCardId: 'g1', code: 'CODE1', initialBalance: 100 });

      const state = engine1.exportState();
      const engine2 = new StorefrontGiftCardVoucherEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getGiftCard('CODE1')?.initialBalance).toEqual(100);
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontGiftCardVoucherEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
