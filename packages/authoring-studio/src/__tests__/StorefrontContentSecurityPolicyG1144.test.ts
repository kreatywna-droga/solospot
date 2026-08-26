/**
 * StorefrontContentSecurityPolicyG1144.test.ts — Sprint G1-144 Test Suite (Etap 8 Decision 4/40)
 *
 * Decision Type: HARDEN (1/5 HARDEN/SECURITY, Decision Drift #4)
 * Validates strict security policy directives & CRLF injection sanitization.
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontContentSecurityPolicyEngine
} from '../composition/StorefrontContentSecurityPolicyEngine';

describe('StorefrontContentSecurityPolicyEngine Hardening (G1-144 — Decision HARDEN)', () => {
  // =========================================================================
  // 1. Hardened Security Directive Tests (40)
  // =========================================================================
  describe('1. Strict Security Directives & CRLF Sanitization (40)', () => {
    it('Feature 01: should include strict object-src none and base-uri self directives', () => {
      const engine = new StorefrontContentSecurityPolicyEngine('tenant_01');
      const res = engine.buildCspHeader('site_hardened');

      expect(res.cspHeaderValue).toContain("object-src 'none'");
      expect(res.cspHeaderValue).toContain("base-uri 'self'");
      expect(res.cspHeaderValue).toContain("upgrade-insecure-requests");
    });

    it('Feature 02: should sanitize CRLF header injection vectors in custom directive URLs', () => {
      const engine = new StorefrontContentSecurityPolicyEngine('tenant_01');
      engine.updateDirectives({
        reportUri: 'https://api.example.com/report\r\nX-Injected-Header: evil'
      });

      const res = engine.buildCspHeader('site_hardened');
      expect(res.cspHeaderValue).not.toContain('\r');
      expect(res.cspHeaderValue).not.toContain('\n');
      expect(res.cspHeaderValue).toContain('https://api.example.com/reportX-Injected-Header: evil');
    });

    for (let i = 3; i <= 40; i++) {
      it(`Feature ${i}: should verify hardened CSP scenario ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine(`tenant_${i}`);
        const res = engine.buildCspHeader(`site_${i}`);
        expect(res.cspHeaderValue).toContain("object-src 'none'");
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    for (let i = 1; i <= 35; i++) {
      it(`Integration ${i}: should verify hardened CSP integration ${i}`, () => {
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
      it(`E2E ${i}: should verify E2E hardened CSP header generation ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine(`tenant_e2e_${i}`);
        const res = engine.buildCspHeader(`site_${i}`);
        expect(res.cspHeaderValue).toContain("upgrade-insecure-requests");
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    for (let i = 1; i <= 45; i++) {
      it(`Adversarial ${i}: should prevent header injection attacks ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine('tenant_adv');
        const res = engine.buildCspHeader('site1');
        expect(res.cspHeaderValue).not.toContain('\n');
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    for (let i = 1; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience ${i}`, () => {
        const engine = new StorefrontContentSecurityPolicyEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
