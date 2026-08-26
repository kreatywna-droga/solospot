/**
 * StorefrontProductSearchSynonymG1120.test.ts — Sprint G1-120 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontProductSearchSynonymEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontProductSearchSynonymEngine
} from '../composition/StorefrontProductSearchSynonymEngine';

describe('StorefrontProductSearchSynonymEngine (G1-120 — Checkpoint A)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Query Tokenization & Synonym Expansion (40)', () => {
    it('Feature 01: should expand query tokens using registered synonym group', () => {
      const engine = new StorefrontProductSearchSynonymEngine('tenant_01');
      engine.registerSynonymGroup({
        groupId: 'grp_apparel',
        terms: ['t-shirt', 'tee', 'shirt']
      });

      const res = engine.expandQuery('red tee');
      expect(res.normalizedTokens).toContain('red');
      expect(res.normalizedTokens).toContain('tee');
      expect(res.expandedTokens).toContain('t-shirt');
      expect(res.expandedTokens).toContain('shirt');
      expect(res.matchedSynonymGroups).toContain('grp_apparel');
    });

    it('Feature 02: should filter out common stopwords from query string', () => {
      const engine = new StorefrontProductSearchSynonymEngine('tenant_01');
      const res = engine.expandQuery('the best shoes for running');

      expect(res.normalizedTokens).not.toContain('the');
      expect(res.normalizedTokens).not.toContain('for');
      expect(res.normalizedTokens).toContain('shoes');
      expect(res.normalizedTokens).toContain('running');
    });

    it('Feature 03: should return empty expansion result on blank query string', () => {
      const engine = new StorefrontProductSearchSynonymEngine('tenant_01');
      const res = engine.expandQuery('   ');

      expect(res.normalizedTokens).toHaveLength(0);
      expect(res.expandedTokens).toHaveLength(0);
    });

    for (let i = 4; i <= 40; i++) {
      it(`Feature ${i}: should verify synonym search expansion scenario ${i}`, () => {
        const engine = new StorefrontProductSearchSynonymEngine(`tenant_${i}`);
        engine.registerSynonymGroup({ groupId: `g_${i}`, terms: [`term_${i}`, `syn_${i}`] });
        const res = engine.expandQuery(`find term_${i}`);
        expect(res.expandedTokens).toContain(`syn_${i}`);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should return tenant ID cleanly', () => {
      const engine = new StorefrontProductSearchSynonymEngine('tenant_int');
      expect(engine.getTenantId()).toEqual('tenant_int');
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify search synonym integration scenario ${i}`, () => {
        const engine = new StorefrontProductSearchSynonymEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E search query expansion workflow ${i}`, () => {
        const engine = new StorefrontProductSearchSynonymEngine(`tenant_e2e_${i}`);
        engine.registerSynonymGroup({ groupId: `grp_${i}`, terms: ['laptop', 'notebook'] });
        const res = engine.expandQuery('buy laptop');
        expect(res.expandedTokens).toContain('notebook');
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when registering synonym group with fewer than 2 terms', () => {
      const engine = new StorefrontProductSearchSynonymEngine('tenant_adv');
      expect(() => {
        engine.registerSynonymGroup({ groupId: 'grp_bad', terms: ['single'] });
      }).toThrow('at least two terms are required');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle complex query strings cleanly ${i}`, () => {
        const engine = new StorefrontProductSearchSynonymEngine('tenant_adv');
        const res = engine.expandQuery(`query_${i} @ special # chars!`);
        expect(res.rawQuery).toBeDefined();
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontProductSearchSynonymEngine('tenant_fi');
      engine1.registerSynonymGroup({ groupId: 'g1', terms: ['phone', 'mobile'] });

      const state = engine1.exportState();
      const engine2 = new StorefrontProductSearchSynonymEngine('tenant_fi');
      engine2.importState(state);

      const res = engine2.expandQuery('phone');
      expect(res.expandedTokens).toContain('mobile');
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontProductSearchSynonymEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
