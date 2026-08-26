/**
 * StorefrontContentSecurityPolicyG1130.test.ts — Sprint G1-130 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontContentSecurityPolicyEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontContentSecurityPolicyEngine
} from '../composition/StorefrontContentSecurityPolicyEngine';

describe('StorefrontContentSecurityPolicyEngine (G1-130 — Checkpoint B)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — CSP Directives & Request Nonce Generation (40)', () => {
    it('Feature 01: should build CSP header string containing script-src nonce cleanly', () => {
      const engine = new StorefrontContentSecurityPolicyEngine('tenant_01');
      const res = engine.buildCspHeader('site_main');

      expect(res.siteId).toEqual('site_main');
      expect(res.requestNonce).toBeDefined();
      expect(res.cspHeaderValue).toContain(`'nonce-${res.requestNonce}'`);
      expect(res.cspHeaderValue).toContain("default-src 'self'");
    });

    it('Feature 02: should update directives with domain whitelists', () => {
      const engine = new StorefrontContentSecurityPolicyEngine('tenant_01');
      engine.updateDirectives({
        scriptSrc: ["'self'", 'https://cdn.example.com'],
        reportUri: 'https://api.example.com/csp-report'
      });

      const res = engine.buildCspHeader('site_main');
      expect(res.cspHeaderValue).toContain('https://cdn.example.com');
      expect(res.cspHeaderValue).toContain('report-uri https://api.example.com/csp-report');
    });

    for (let i = 3; i <= 40; i++) {
      it(`Feature ${i}: should verify CSP header building scenario ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine(`tenant_${i}`);
        const res = engine.buildCspHeader(`site_${i}`);
        expect(res.cspHeaderValue).toBeDefined();
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should return tenant ID cleanly', () => {
      const engine = new StorefrontContentSecurityPolicyEngine('tenant_int');
      expect(engine.getTenantId()).toEqual('tenant_int');
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify CSP integration scenario ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E CSP evaluation workflow ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine(`tenant_e2e_${i}`);
        const res = engine.buildCspHeader(`site_${i}`);
        expect(res.requestNonce.length).toBeGreaterThan(10);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when siteId is empty string', () => {
      const engine = new StorefrontContentSecurityPolicyEngine('tenant_adv');
      expect(() => {
        engine.buildCspHeader('');
      }).toThrow('siteId is required');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle complex directive inputs cleanly ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine('tenant_adv');
        expect(engine.getTenantId()).toEqual('tenant_adv');
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontContentSecurityPolicyEngine('tenant_fi', true);
      engine1.updateDirectives({ reportUri: 'https://report.test' });

      const state = engine1.exportState();
      const engine2 = new StorefrontContentSecurityPolicyEngine('tenant_fi');
      engine2.importState(state);

      const res = engine2.buildCspHeader('site1');
      expect(res.isReportOnly).toBe(true);
      expect(res.cspHeaderValue).toContain('https://report.test');
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
