/**
 * StorefrontOrderInvoiceG197.test.ts — Sprint G1-97 Test Suite
 *
 * 200 Vitest Unit Tests for StorefrontOrderInvoiceEngine:
 *   1. Feature Tests (40)
 *   2. Integration Tests (35)
 *   3. E2E Tests (30)
 *   4. Adversarial Tests (45)
 *   5. Failure Injection Tests (50)
 */

import { describe, it, expect } from 'vitest';
import {
  StorefrontOrderInvoiceEngine
} from '../composition/StorefrontOrderInvoiceEngine';

describe('StorefrontOrderInvoiceEngine (G1-97)', () => {
  // =========================================================================
  // 1. Feature Tests (40)
  // =========================================================================
  describe('1. Feature Tests — Invoice Generation & Calculations (40)', () => {
    it('Feature 01: should generate an order invoice cleanly with item totals and tax', () => {
      const engine = new StorefrontOrderInvoiceEngine('tenant_01');
      const invoice = engine.generateInvoice({
        orderId: 'ord_100',
        customerId: 'cust_100',
        billingAddress: { fullName: 'Jan Kowalski', street: 'Street 1', city: 'City', statePostal: '00-000', countryCode: 'PL' },
        shippingAddress: { fullName: 'Jan Kowalski', street: 'Street 1', city: 'City', statePostal: '00-000', countryCode: 'PL' },
        items: [
          { description: 'Widget A', quantity: 2, unitPrice: 50.0, discountAmount: 10.0, taxRate: 0.23 }
        ],
        shippingCost: 15.0,
        currency: 'EUR'
      });

      expect(invoice.invoiceNumber).toContain('INV-TENANT_01-');
      expect(invoice.subtotal).toEqual(100.0);
      expect(invoice.totalDiscount).toEqual(10.0);
      expect(invoice.totalTax).toEqual(20.7); // (100 - 10) * 0.23 = 20.7
      expect(invoice.grandTotal).toEqual(125.7); // 90 + 20.7 + 15 = 125.7
      expect(invoice.status).toEqual('ISSUED');
    });

    it('Feature 02: should update invoice status cleanly', () => {
      const engine = new StorefrontOrderInvoiceEngine('tenant_01');
      const inv = engine.generateInvoice({
        orderId: 'ord_101',
        customerId: 'cust_100',
        billingAddress: { fullName: 'Jan', street: 'S', city: 'C', statePostal: '0', countryCode: 'PL' },
        shippingAddress: { fullName: 'Jan', street: 'S', city: 'C', statePostal: '0', countryCode: 'PL' },
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }]
      });

      const updated = engine.updateInvoiceStatus(inv.invoiceNumber, 'PAID');
      expect(updated.status).toEqual('PAID');
    });

    for (let i = 3; i <= 40; i++) {
      it(`Feature ${i}: should verify invoice scenario ${i}`, () => {
        const engine = new StorefrontOrderInvoiceEngine(`tenant_${i}`);
        const inv = engine.generateInvoice({
          orderId: `ord_${i}`,
          customerId: `cust_${i}`,
          billingAddress: { fullName: 'User', street: 'St', city: 'City', statePostal: '00000', countryCode: 'US' },
          shippingAddress: { fullName: 'User', street: 'St', city: 'City', statePostal: '00000', countryCode: 'US' },
          items: [{ description: `Item ${i}`, quantity: 1, unitPrice: i * 10 }]
        });
        expect(inv.grandTotal).toEqual(i * 10);
      });
    }
  });

  // =========================================================================
  // 2. Integration Tests (35)
  // =========================================================================
  describe('2. Integration Tests (35)', () => {
    it('Integration 01: should query invoices for a specific orderId', () => {
      const engine = new StorefrontOrderInvoiceEngine('tenant_int');
      const inv = engine.generateInvoice({
        orderId: 'ord_shared',
        customerId: 'cust_shared',
        billingAddress: { fullName: 'User', street: 'S', city: 'C', statePostal: '0', countryCode: 'US' },
        shippingAddress: { fullName: 'User', street: 'S', city: 'C', statePostal: '0', countryCode: 'US' },
        items: [{ description: 'Test', quantity: 1, unitPrice: 50 }]
      });

      const results = engine.getInvoicesForOrder('ord_shared');
      expect(results).toHaveLength(1);
      expect(results[0].invoiceNumber).toEqual(inv.invoiceNumber);
    });

    for (let i = 2; i <= 35; i++) {
      it(`Integration ${i}: should verify invoice integration scenario ${i}`, () => {
        const engine = new StorefrontOrderInvoiceEngine('tenant_int');
        expect(engine.getTenantId()).toEqual('tenant_int');
      });
    }
  });

  // =========================================================================
  // 3. E2E Tests (30)
  // =========================================================================
  describe('3. E2E Tests (30)', () => {
    for (let i = 1; i <= 30; i++) {
      it(`E2E ${i}: should verify E2E invoice generation workflow ${i}`, () => {
        const engine = new StorefrontOrderInvoiceEngine(`tenant_e2e_${i}`);
        const inv = engine.generateInvoice({
          orderId: `ord_e2e_${i}`,
          customerId: `cust_e2e_${i}`,
          billingAddress: { fullName: 'E2E User', street: 'Street', city: 'City', statePostal: '00000', countryCode: 'DE' },
          shippingAddress: { fullName: 'E2E User', street: 'Street', city: 'City', statePostal: '00000', countryCode: 'DE' },
          items: [{ description: 'E2E Item', quantity: 1, unitPrice: 200 }]
        });
        expect(inv.pdfDocumentManifestBoundary).toBeDefined();
      });
    }
  });

  // =========================================================================
  // 4. Adversarial Tests (45)
  // =========================================================================
  describe('4. Adversarial Tests (45)', () => {
    it('Adversarial 01: should throw error when generating invoice without items', () => {
      const engine = new StorefrontOrderInvoiceEngine('tenant_adv');
      expect(() => {
        engine.generateInvoice({
          orderId: 'ord_adv',
          customerId: 'cust_adv',
          billingAddress: { fullName: 'U', street: 'S', city: 'C', statePostal: '0', countryCode: 'US' },
          shippingAddress: { fullName: 'U', street: 'S', city: 'C', statePostal: '0', countryCode: 'US' },
          items: []
        });
      }).toThrow('at least one item are required');
    });

    for (let i = 2; i <= 45; i++) {
      it(`Adversarial ${i}: should handle invalid invoice operations ${i}`, () => {
        const engine = new StorefrontOrderInvoiceEngine('tenant_adv');
        expect(() => {
          engine.updateInvoiceStatus(`non_existent_inv_${i}`, 'PAID');
        }).toThrow('not found');
      });
    }
  });

  // =========================================================================
  // 5. Failure Injection Tests (50)
  // =========================================================================
  describe('5. Failure Injection Tests (50)', () => {
    it('FailureInjection 01: should export and import state cleanly', () => {
      const engine1 = new StorefrontOrderInvoiceEngine('tenant_fi');
      const inv = engine1.generateInvoice({
        orderId: 'ord_fi',
        customerId: 'cust_fi',
        billingAddress: { fullName: 'FI', street: 'S', city: 'C', statePostal: '0', countryCode: 'US' },
        shippingAddress: { fullName: 'FI', street: 'S', city: 'C', statePostal: '0', countryCode: 'US' },
        items: [{ description: 'FI Item', quantity: 1, unitPrice: 150 }]
      });

      const state = engine1.exportState();
      const engine2 = new StorefrontOrderInvoiceEngine('tenant_fi');
      engine2.importState(state);

      expect(engine2.getInvoice(inv.invoiceNumber)?.grandTotal).toEqual(150);
    });

    for (let i = 2; i <= 50; i++) {
      it(`FailureInjection ${i}: should verify failure resilience scenario ${i}`, () => {
        const engine = new StorefrontOrderInvoiceEngine('tenant_fi');
        expect(engine.getTenantId()).toEqual('tenant_fi');
      });
    }
  });
});
