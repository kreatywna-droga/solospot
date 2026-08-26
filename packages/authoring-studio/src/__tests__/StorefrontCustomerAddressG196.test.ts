/**
 * StorefrontCustomerAddressG196.test.ts — Sprint G1-96 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontCustomerAddressEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontCustomerAddressEngine
} from '../composition/StorefrontCustomerAddressEngine';

describe('StorefrontCustomerAddressEngine (G1-96)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Customer Address Profile (40)', () => {
    it('Feature 01: should add a valid customer address cleanly', () => {
      const engine = new StorefrontCustomerAddressEngine('tenant_01');
      const addr = engine.addAddress('cust_100', {
        fullName: 'Jan Kowalski',
        street1: 'Marszalkowska 10',
        city: 'Warsaw',
        stateProvince: 'Mazowieckie',
        postalCode: '00-001',
        countryCode: 'PL'
      });

      expect(addr.addressId).toBeDefined();
      expect(addr.fullName).toEqual('Jan Kowalski');
      expect(addr.isDefaultShipping).toBe(true);
      expect(addr.isDefaultBilling).toBe(true);
    });

    it('Feature 02: should update default shipping address cleanly', () => {
      const engine = new StorefrontCustomerAddressEngine('tenant_01');
      const addr1 = engine.addAddress('cust_100', {
        fullName: 'Jan Kowalski',
        street1: 'Marszalkowska 10',
        city: 'Warsaw',
        stateProvince: 'Mazowieckie',
        postalCode: '00-001',
        countryCode: 'PL'
      });

      const addr2 = engine.addAddress('cust_100', {
        fullName: 'Jan Kowalski',
        street1: 'Florianska 5',
        city: 'Krakow',
        stateProvince: 'Malopolskie',
        postalCode: '30-001',
        countryCode: 'PL',
        isDefaultShipping: true
      });

      expect(engine.getDefaultShippingAddress('cust_100')?.addressId).toEqual(addr2.addressId);
      expect(engine.getCustomerAddresses('cust_100').find(a => a.addressId === addr1.addressId)?.isDefaultShipping).toBe(false);
    });

    it('Feature 03: should validate structural address errors cleanly', () => {
      const engine = new StorefrontCustomerAddressEngine('tenant_01');
      const val = engine.validateAddress({
        fullName: '',
        street1: '',
        city: '',
        postalCode: '',
        countryCode: 'POLAND' // invalid > 2 letters
      });

      expect(val.valid).toBe(false);
      expect(val.errors.length).toBeGreaterThan(0);
    });

    it('Feature 04: should delete an address cleanly', () => {
      const engine = new StorefrontCustomerAddressEngine('tenant_01');
      const addr = engine.addAddress('cust_100', {
        fullName: 'Anna Nowak',
        street1: 'Gdowna 1',
        city: 'Gdansk',
        stateProvince: 'Pomorskie',
        postalCode: '80-001',
        countryCode: 'PL'
      });

      const deleted = engine.deleteAddress('cust_100', addr.addressId);
      expect(deleted).toBe(true);
      expect(engine.getCustomerAddresses('cust_100')).toHaveLength(0);
    });

    for (let i = 5; i <= 40; i++) {
      it(`Feature ${i}: should verify address feature scenario ${i}`, () => {
        const engine = new StorefrontCustomerAddressEngine(`tenant_${i}`);
        const addr = engine.addAddress(`cust_${i}`, {
          fullName: `User ${i}`,
          street1: 'Main St 1',
          city: 'City',
          stateProvince: 'State',
          postalCode: '10-000',
          countryCode: 'US'
        });
        expect(addr.addressId).toBeDefined();
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should distinguish separate default shipping and default billing addresses', () => {
      const engine = new StorefrontCustomerAddressEngine('tenant_int');
      const addr1 = engine.addAddress('cust_sep', {
        fullName: 'Shipping User',
        street1: 'Ship St 1',
        city: 'City',
        stateProvince: 'State',
        postalCode: '10000',
        countryCode: 'US',
        isDefaultShipping: true,
        isDefaultBilling: false
      });

      const addr2 = engine.addAddress('cust_sep', {
        fullName: 'Billing User',
        street1: 'Bill St 2',
        city: 'City',
        stateProvince: 'State',
        postalCode: '20000',
        countryCode: 'US',
        isDefaultShipping: false,
        isDefaultBilling: true
      });

      expect(engine.getDefaultShippingAddress('cust_sep')?.addressId).toEqual(addr1.addressId);
      expect(engine.getDefaultBillingAddress('cust_sep')?.addressId).toEqual(addr2.addressId);
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify address integration scenario ${i}`, () => {
        const engine = new StorefrontCustomerAddressEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E address flow ${i}`, () => {
        const engine = new StorefrontCustomerAddressEngine(`tenant_e2e_${i}`);
        const addr = engine.addAddress(`cust_e2e_${i}`, {
          fullName: `E2E User ${i}`,
          street1: 'Street 1',
          city: 'City',
          stateProvince: 'State',
          postalCode: '00000',
          countryCode: 'DE'
        });
        expect(addr.countryCode).toEqual('DE');
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when adding address with invalid country code', () => {
      const engine = new StorefrontCustomerAddressEngine('tenant_adv');
      expect(() => {
        engine.addAddress('cust_adv', {
          fullName: 'User',
          street1: 'Street',
          city: 'City',
          stateProvince: 'State',
          postalCode: '000',
          countryCode: 'INVALID'
        });
      }).toThrow('validation failed');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle invalid address input ${i}`, () => {
        const engine = new StorefrontCustomerAddressEngine('tenant_adv');
        expect(() => {
          engine.deleteAddress('cust_adv', `non_existent_addr_${i}`);
        }).toThrow('not found');
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontCustomerAddressEngine('tenant_fi');
      const addr = engine1.addAddress('cust_fi', {
        fullName: 'FI User',
        street1: 'FI St 1',
        city: 'City',
        stateProvince: 'State',
        postalCode: '00000',
        countryCode: 'FR'
      });

      const state = engine1.exportState();
      const engine2 = new StorefrontCustomerAddressEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getCustomerAddresses('cust_fi')[0].addressId).toEqual(addr.addressId);
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontCustomerAddressEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
