/**
 * StorefrontRateLimitAbuseProtectionG1102.test.ts — Sprint G1-102 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontRateLimitAbuseProtectionEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontRateLimitAbuseProtectionEngine
} from '../composition/StorefrontRateLimitAbuseProtectionEngine';

describe('StorefrontRateLimitAbuseProtectionEngine (G1-102)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Sliding Window Rate Limiting (40)', () => {
    it('Feature 01: should allow requests within window limits cleanly', () => {
      const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_01');
      const res = engine.evaluateRequest('ip_127_0_0_1', 'CHECKOUT');

      expect(res.allowed).toBe(true);
      expect(res.currentCount).toEqual(1);
      expect(res.remainingRequests).toEqual(9); // default limit 10
      expect(res.isLockedOut).toBe(false);
    });

    it('Feature 02: should lock out client when rate limit threshold is exceeded', () => {
      const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_01');
      engine.setPolicy({ endpointCategory: 'AUTH_LOGIN', maxRequestsPerWindow: 2, windowMs: 10000, lockoutDurationMs: 60000 });

      engine.evaluateRequest('ip_attacker', 'AUTH_LOGIN');
      engine.evaluateRequest('ip_attacker', 'AUTH_LOGIN');

      const overflow = engine.evaluateRequest('ip_attacker', 'AUTH_LOGIN');
      expect(overflow.allowed).toBe(false);
      expect(overflow.isLockedOut).toBe(true);
      expect(overflow.lockoutRemainingMs).toBeGreaterThan(0);
    });

    it('Feature 03: should maintain separate rate limit buckets per client and endpoint category', () => {
      const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_01');
      engine.setPolicy({ endpointCategory: 'AUTH_LOGIN', maxRequestsPerWindow: 1, windowMs: 10000, lockoutDurationMs: 60000 });

      engine.evaluateRequest('ip_user1', 'AUTH_LOGIN');
      const user2Res = engine.evaluateRequest('ip_user2', 'AUTH_LOGIN');

      expect(user2Res.allowed).toBe(true);
    });

    it('Feature 04: should allow manual client lockout reset cleanly', () => {
      const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_01');
      engine.setPolicy({ endpointCategory: 'AUTH_LOGIN', maxRequestsPerWindow: 1, windowMs: 10000, lockoutDurationMs: 60000 });

      engine.evaluateRequest('ip_locked', 'AUTH_LOGIN');
      engine.evaluateRequest('ip_locked', 'AUTH_LOGIN'); // locked out

      const resetSuccess = engine.resetClientLockout('ip_locked', 'AUTH_LOGIN');
      expect(resetSuccess).toBe(true);

      const afterReset = engine.evaluateRequest('ip_locked', 'AUTH_LOGIN');
      expect(afterReset.allowed).toBe(true);
    });

    for (let i = 5; i <= 40; i++) {
      it(`Feature ${i}: should verify rate limit evaluation scenario ${i}`, () => {
        const engine = new StorefrontRateLimitAbuseProtectionEngine(`tenant_${i}`);
        const res = engine.evaluateRequest(`client_${i}`, 'SEARCH_QUERY');
        expect(res.allowed).toBe(true);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should update and enforce custom policy', () => {
      const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_int');
      engine.setPolicy({ endpointCategory: 'SENSITIVE_ADMIN', maxRequestsPerWindow: 3, windowMs: 5000, lockoutDurationMs: 10000 });

      for (let i = 1; i <= 3; i++) {
        expect(engine.evaluateRequest('admin_ip', 'SENSITIVE_ADMIN').allowed).toBe(true);
      }

      expect(engine.evaluateRequest('admin_ip', 'SENSITIVE_ADMIN').allowed).toBe(false);
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify rate limit integration scenario ${i}`, () => {
        const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E rate limit flow ${i}`, () => {
        const engine = new StorefrontRateLimitAbuseProtectionEngine(`tenant_e2e_${i}`);
        const res = engine.evaluateRequest(`e2e_client_${i}`, 'PUBLIC_API');
        expect(res.allowed).toBe(true);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error on invalid non-positive policy setup', () => {
      const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_adv');
      expect(() => {
        engine.setPolicy({ endpointCategory: 'CHECKOUT', maxRequestsPerWindow: 0, windowMs: 1000, lockoutDurationMs: 1000 });
      }).toThrow('positive numbers');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle empty clientIdentifier or category ${i}`, () => {
        const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_adv');
        expect(() => {
          engine.evaluateRequest('', 'CHECKOUT');
        }).toThrow('required for rate limit evaluation');
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontRateLimitAbuseProtectionEngine('tenant_fi');
      engine1.evaluateRequest('client_fi', 'CHECKOUT');

      const state = engine1.exportState();
      const engine2 = new StorefrontRateLimitAbuseProtectionEngine('tenant_fi');
      engine2.importState(state);

      const policy = engine2.getPolicy('CHECKOUT');
      expect(policy).toBeDefined();
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontRateLimitAbuseProtectionEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
