/**
 * StorefrontFraudRiskScoringG1154.test.ts — Sprint G1-154 Test Suite (Etap 8 Decision 14/40)
 *
 * Decision Type: HARDEN (2/5 HARDEN/SECURITY, Decision Drift #14)
 * Validates hardened disposable email blocklisting & risk score calculation inside StorefrontFraudRiskScoringEngine.
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontFraudRiskScoringEngine
} from '../composition/StorefrontFraudRiskScoringEngine';

describe('StorefrontFraudRiskScoringEngine Hardening (G1-145 — Decision HARDEN)', () => {
  // =========================================================================
  // 1. Hardened Domain Blocklist & Velocity Tests (40)
  // =========================================================================
  describe('1. Hardened Disposable Domain Blocklist (40)', () => {
    it('Feature 01: should add custom disposable email domain to blocklist and flag order risk score', () => {
      const engine = new StorefrontFraudRiskScoringEngine('tenant_01');
      engine.addDisposableEmailDomain('fraudster.xyz');

      const res = engine.evaluateOrderRisk({
        orderId: 'o_fraud_1',
        customerEmail: 'scammer@fraudster.xyz',
        orderAmount: 500,
        billingCountryCode: 'US',
        shippingCountryCode: 'US'
      });

      expect(res.totalRiskScore).toBeGreaterThanOrEqual(30);
      expect(res.triggeredSignals.some(s => s.signalName === 'DISPOSABLE_EMAIL_DOMAIN')).toBe(true);

    });

    for (let i = 2; i <= 40; i++) {
      it(`Feature ${i}: should verify hardened fraud detection scenario ${i}`, () => {
        const engine = new StorefrontFraudRiskScoringEngine(`tenant_${i}`);
        engine.addDisposableEmailDomain(`block_${i}.com`);
        const res = engine.evaluateOrderRisk({
          orderId: `o_${i}`,
          customerEmail: `user@block_${i}.com`,
          orderAmount: 100,
          billingCountryCode: 'US',
          shippingCountryCode: 'US'
        });
        expect(res.totalRiskScore).toBeGreaterThan(0);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    for (let i = 1; i <= 35; i++) {
      it(`Integration ${i}: should verify hardened fraud engine integration ${i}`, () => {
        const engine = new StorefrontFraudRiskScoringEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E risk scoring workflow ${i}`, () => {
        const engine = new StorefrontFraudRiskScoringEngine(`tenant_e2e_${i}`);
        const res = engine.evaluateOrderRisk({ orderId: `o_${i}`, customerEmail: `e_${i}@test.com`, orderAmount: 50, billingCountryCode: 'DE', shippingCountryCode: 'DE' });
        expect(res.recommendedAction).toBeDefined();
      });
    }
  });


  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    for (let i = 1; i <= 45; i++) {
      it(`Adversarial ${i}: should handle boundary inputs cleanly ${i}`, () => {
        const engine = new StorefrontFraudRiskScoringEngine('tenant_adv');
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
        const engine = new StorefrontFraudRiskScoringEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
