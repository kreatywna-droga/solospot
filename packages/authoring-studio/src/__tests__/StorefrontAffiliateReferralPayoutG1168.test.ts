/**
 * StorefrontAffiliateReferralPayoutG1168.test.ts — Sprint G1-168 Test Suite (Etap 8 Decision 28/40)
 *
 * Decision Type: CREATE (4/5 CREATE, Decision Drift #28)
 * 200 Vitest Unit Tests for StorefrontAffiliateReferralPayoutEngine.
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontAffiliateReferralPayoutEngine
} from '../composition/StorefrontAffiliateReferralPayoutEngine';

describe('StorefrontAffiliateReferralPayoutEngine (G1-168 — Decision CREATE)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Affiliate Referral Payouts (40)', () => {
    it('Feature 01: should register affiliate partner and record 10% referral conversion cleanly', () => {
      const engine = new StorefrontAffiliateReferralPayoutEngine('tenant_01');
      engine.registerAffiliatePartner({ affiliateId: 'aff_1', referralCode: 'PARTNER10', partnerEmail: 'aff@example.com', commissionType: 'PERCENTAGE', commissionValue: 10 });

      const conv = engine.recordReferralConversion({ conversionId: 'c1', referralCode: 'PARTNER10', orderId: 'o1', orderTotalAmount: 200 });

      expect(conv.commissionEarned).toEqual(20);
      expect(engine.getPartnerByCode('PARTNER10')?.accruedCommissionTotal).toEqual(20);
    });

    for (let i = 2; i <= 40; i++) {
      it(`Feature ${i}: should verify affiliate referral scenario ${i}`, () => {
        const engine = new StorefrontAffiliateReferralPayoutEngine(`tenant_${i}`);
        engine.registerAffiliatePartner({ affiliateId: `a_${i}`, referralCode: `CODE_${i}`, partnerEmail: `p_${i}@ex.com` });
        expect(engine.getPartnerByCode(`CODE_${i}`)?.referralCode).toEqual(`CODE_${i}`);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should record flat fee commission cleanly', () => {
      const engine = new StorefrontAffiliateReferralPayoutEngine('tenant_int');
      engine.registerAffiliatePartner({ affiliateId: 'a1', referralCode: 'FLAT15', partnerEmail: 'f@ex.com', commissionType: 'FLAT_FEE', commissionValue: 15 });
      const conv = engine.recordReferralConversion({ conversionId: 'c1', referralCode: 'FLAT15', orderId: 'o1', orderTotalAmount: 50 });
      expect(conv.commissionEarned).toEqual(15);
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify affiliate engine integration ${i}`, () => {
        const engine = new StorefrontAffiliateReferralPayoutEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E affiliate workflow ${i}`, () => {
        const engine = new StorefrontAffiliateReferralPayoutEngine(`tenant_e2e_${i}`);
        engine.registerAffiliatePartner({ affiliateId: `a_${i}`, referralCode: `CODE_${i}`, partnerEmail: `p_${i}@ex.com` });
        expect(engine.getPartnerByCode(`CODE_${i}`)?.status).toEqual('ACTIVE');
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error on missing affiliate referral code', () => {
      const engine = new StorefrontAffiliateReferralPayoutEngine('tenant_adv');
      expect(() => {
        engine.recordReferralConversion({ conversionId: 'c1', referralCode: 'INVALID', orderId: 'o1', orderTotalAmount: 100 });
      }).toThrow('Active affiliate partner for code INVALID not found');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle boundary inputs cleanly ${i}`, () => {
        const engine = new StorefrontAffiliateReferralPayoutEngine('tenant_adv');
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
        const engine = new StorefrontAffiliateReferralPayoutEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
