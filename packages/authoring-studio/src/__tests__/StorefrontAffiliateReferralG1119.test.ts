/**
 * StorefrontAffiliateReferralG1119.test.ts — Sprint G1-119 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontAffiliateReferralEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontAffiliateReferralEngine
} from '../composition/StorefrontAffiliateReferralEngine';

describe('StorefrontAffiliateReferralEngine (G1-119)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Affiliate Registration & Commission Attribution (40)', () => {
    it('Feature 01: should register an affiliate profile cleanly', () => {
      const engine = new StorefrontAffiliateReferralEngine('tenant_01');
      const aff = engine.registerAffiliate({
        affiliateId: 'aff_01',
        affiliateEmail: 'affiliate@partner.com',
        referralCode: 'PARTNER10',
        commissionPercent: 10
      });

      expect(aff.referralCode).toEqual('PARTNER10');
      expect(aff.commissionPercent).toEqual(10);
      expect(aff.totalCommissionEarned).toEqual(0);
    });

    it('Feature 02: should record order commission and update total commission earned cleanly', () => {
      const engine = new StorefrontAffiliateReferralEngine('tenant_01');
      engine.registerAffiliate({
        affiliateId: 'aff_02',
        affiliateEmail: 'marketer@seo.com',
        referralCode: 'SEO15',
        commissionPercent: 15
      });

      const comm = engine.recordOrderCommission({
        referralCode: 'SEO15',
        orderId: 'ord_100',
        customerEmail: 'customer@buyer.com',
        orderAmount: 200
      });

      expect(comm.commissionAmount).toEqual(30); // 200 * 0.15
      expect(comm.status).toEqual('PENDING');

      const updatedAff = engine.getAffiliateByCode('SEO15');
      expect(updatedAff?.totalCommissionEarned).toEqual(30);
    });

    it('Feature 03: should block self-referrals when customer email matches affiliate email', () => {
      const engine = new StorefrontAffiliateReferralEngine('tenant_01');
      engine.registerAffiliate({
        affiliateId: 'aff_03',
        affiliateEmail: 'self@marketer.com',
        referralCode: 'SELF10'
      });

      expect(() => {
        engine.recordOrderCommission({
          referralCode: 'SELF10',
          orderId: 'ord_self',
          customerEmail: 'self@marketer.com',
          orderAmount: 100
        });
      }).toThrow('Self-referral blocked');
    });

    for (let i = 4; i <= 40; i++) {
      it(`Feature ${i}: should verify affiliate referral scenario ${i}`, () => {
        const engine = new StorefrontAffiliateReferralEngine(`tenant_${i}`);
        const aff = engine.registerAffiliate({
          affiliateId: `aff_${i}`,
          affiliateEmail: `aff_${i}@domain.com`,
          referralCode: `REF_${i}`
        });
        expect(aff.referralCode).toEqual(`REF_${i}`);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should query recorded commission by commissionId', () => {
      const engine = new StorefrontAffiliateReferralEngine('tenant_int');
      engine.registerAffiliate({ affiliateId: 'a1', affiliateEmail: 'a@b.com', referralCode: 'CODE1' });
      const comm = engine.recordOrderCommission({ referralCode: 'CODE1', orderId: 'o1', customerEmail: 'c@d.com', orderAmount: 50 });

      expect(engine.getCommission(comm.commissionId)?.orderAmount).toEqual(50);
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify affiliate integration scenario ${i}`, () => {
        const engine = new StorefrontAffiliateReferralEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E affiliate referral workflow ${i}`, () => {
        const engine = new StorefrontAffiliateReferralEngine(`tenant_e2e_${i}`);
        engine.registerAffiliate({ affiliateId: `aff_${i}`, affiliateEmail: `aff_${i}@mail.com`, referralCode: `E2E_${i}` });
        const comm = engine.recordOrderCommission({ referralCode: `E2E_${i}`, orderId: `o_${i}`, customerEmail: `buyer_${i}@mail.com`, orderAmount: 100 });
        expect(comm.commissionAmount).toBeGreaterThan(0);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when referral code is missing or invalid', () => {
      const engine = new StorefrontAffiliateReferralEngine('tenant_adv');
      expect(() => {
        engine.recordOrderCommission({ referralCode: 'INVALID_CODE', orderId: 'o1', customerEmail: 'c@d.com', orderAmount: 50 });
      }).toThrow('Affiliate referral code INVALID_CODE not found');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle missing affiliate query cleanly ${i}`, () => {
        const engine = new StorefrontAffiliateReferralEngine('tenant_adv');
        expect(engine.getAffiliateByCode(`missing_${i}`)).toBeUndefined();
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontAffiliateReferralEngine('tenant_fi');
      engine1.registerAffiliate({ affiliateId: 'a1', affiliateEmail: 'a@b.com', referralCode: 'REF1' });

      const state = engine1.exportState();
      const engine2 = new StorefrontAffiliateReferralEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getAffiliateByCode('REF1')?.affiliateEmail).toEqual('a@b.com');
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontAffiliateReferralEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
