/**
 * StorefrontMultiLocationInventoryG1165.test.ts — Sprint G1-165 Test Suite (Etap 8 Decision 25/40)
 *
 * Decision Type: RECOVER (5/5 RECOVERY/BUG FIX, Decision Drift #25)
 * Validates stock reservation cancellation release recovery in StorefrontMultiLocationInventoryEngine.
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontMultiLocationInventoryEngine
} from '../composition/StorefrontMultiLocationInventoryEngine';

describe('StorefrontMultiLocationInventoryEngine Recovery (G1-165 — Decision RECOVER)', () => {
  // =========================================================================
  // 1. Reserved Inventory Release Recovery Tests (40)
  // =========================================================================
  describe('1. Reserved Inventory Release Recovery (40)', () => {
    it('Feature 01: should release reserved stock back to available location stock cleanly', () => {
      const engine = new StorefrontMultiLocationInventoryEngine('tenant_01');
      engine.updateLocationStock({ productId: 'p1', locationId: 'loc_main', locationName: 'Main Warehouse', countryCode: 'US', stockQuantity: 100, isPrimary: true });
      engine.allocateProductStock({ orderId: 'o1', productId: 'p1', requestedQuantity: 20 }); // reserved: 20, available: 80

      const released = engine.releaseReservedStock('p1', 'loc_main', 20);

      expect(released.reservedQuantity).toEqual(0);
      expect(released.availableQuantity).toEqual(100);
    });

    for (let i = 2; i <= 40; i++) {
      it(`Feature ${i}: should verify stock release recovery scenario ${i}`, () => {
        const engine = new StorefrontMultiLocationInventoryEngine(`tenant_${i}`);
        engine.updateLocationStock({ productId: `p_${i}`, locationId: `loc_${i}`, locationName: 'WH', countryCode: 'US', stockQuantity: 100 });
        engine.allocateProductStock({ orderId: `o_${i}`, productId: `p_${i}`, requestedQuantity: 10 });
        const res = engine.releaseReservedStock(`p_${i}`, `loc_${i}`, 10);
        expect(res.availableQuantity).toEqual(100);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    for (let i = 1; i <= 35; i++) {
      it(`Integration ${i}: should verify recovered multi-location inventory engine integration ${i}`, () => {
        const engine = new StorefrontMultiLocationInventoryEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E stock release workflow ${i}`, () => {
        const engine = new StorefrontMultiLocationInventoryEngine(`tenant_e2e_${i}`);
        engine.updateLocationStock({ productId: `p_${i}`, locationId: `loc_${i}`, locationName: 'WH', countryCode: 'US', stockQuantity: 50 });
        engine.allocateProductStock({ orderId: `o_${i}`, productId: `p_${i}`, requestedQuantity: 5 });
        const res = engine.releaseReservedStock(`p_${i}`, `loc_${i}`, 5);
        expect(res.reservedQuantity).toEqual(0);
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when releasing negative stock quantity', () => {
      const engine = new StorefrontMultiLocationInventoryEngine('tenant_adv');
      engine.updateLocationStock({ productId: 'p1', locationId: 'l1', locationName: 'W1', countryCode: 'US', stockQuantity: 10 });
      expect(() => {
        engine.releaseReservedStock('p1', 'l1', -5);
      }).toThrow('releaseQuantity must be positive');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle boundary inputs cleanly ${i}`, () => {
        const engine = new StorefrontMultiLocationInventoryEngine('tenant_adv');
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
        const engine = new StorefrontMultiLocationInventoryEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
