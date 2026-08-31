/**
 * CommerceTaxInvoiceAuditG1197.test.ts — G1-197 Tax Checkout Invoice Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TaxCheckoutInvoiceAuditor,
  TaxCalculation,
  Checkout,
  Invoice,
} from '../CommerceTaxInvoiceAudit';

function makeTaxCalc(overrides: Partial<TaxCalculation> = {}): TaxCalculation {
  return {
    calculationId: 'tax-1',
    checkoutId: 'checkout-1',
    jurisdiction: 'US-CA',
    taxRate: 0.08,
    taxAmount: 8,
    taxableAmount: 100,
    calculatedAt: '2025-01-01T10:00:00Z',
    ...overrides,
  };
}

function makeCheckout(overrides: Partial<Checkout> = {}): Checkout {
  return {
    checkoutId: 'checkout-1',
    tenantId: 'tenant-1',
    userId: 'user-1',
    items: [{ productId: 'p1', quantity: 1, price: 100 }],
    subtotal: 100,
    taxAmount: 8,
    totalAmount: 108,
    currency: 'USD',
    jurisdiction: 'US-CA',
    status: 'COMPLETED',
    completedAt: '2025-01-01T10:01:00Z',
    ...overrides,
  };
}

function makeInvoice(overrides: Partial<Invoice> = {}): Invoice {
  return {
    invoiceId: 'inv-1',
    checkoutId: 'checkout-1',
    tenantId: 'tenant-1',
    subtotal: 100,
    taxAmount: 8,
    totalAmount: 108,
    currency: 'USD',
    status: 'ISSUED',
    issuedAt: '2025-01-01T10:02:00Z',
    ...overrides,
  };
}

describe('TaxCheckoutInvoiceAuditor', () => {
  let auditor: TaxCheckoutInvoiceAuditor;

  beforeEach(() => {
    auditor = new TaxCheckoutInvoiceAuditor();
  });

  // --- auditTaxToCheckout ---

  describe('auditTaxToCheckout()', () => {
    it('returns empty when tax matches checkout', () => {
      const issues = auditor.auditTaxToCheckout([makeTaxCalc()], [makeCheckout()]);
      expect(issues.length).toBe(0);
    });

    it('detects tax amount mismatch', () => {
      const issues = auditor.auditTaxToCheckout(
        [makeTaxCalc({ taxAmount: 10 })],
        [makeCheckout({ taxAmount: 8 })],
      );
      expect(issues.length).toBe(1);
      expect(issues[0].issueType).toBe('TAX_MISMATCH');
    });

    it('detects tax for non-existent checkout', () => {
      const issues = auditor.auditTaxToCheckout(
        [makeTaxCalc({ checkoutId: 'missing' })],
        [makeCheckout()],
      );
      expect(issues.length).toBe(1);
      expect(issues[0].issueType).toBe('MISSING_TAX');
    });

    it('marks MISSING_TAX as HIGH severity', () => {
      const issues = auditor.auditTaxToCheckout(
        [makeTaxCalc({ checkoutId: 'missing' })],
        [],
      );
      expect(issues[0].severity).toBe('HIGH');
    });

    it('marks TAX_MISMATCH as HIGH severity', () => {
      const issues = auditor.auditTaxToCheckout(
        [makeTaxCalc({ taxAmount: 20 })],
        [makeCheckout({ taxAmount: 8 })],
      );
      expect(issues[0].severity).toBe('HIGH');
    });

    it('allows small cent tolerance', () => {
      const issues = auditor.auditTaxToCheckout(
        [makeTaxCalc({ taxAmount: 8.005 })],
        [makeCheckout({ taxAmount: 8 })],
      );
      expect(issues.length).toBe(0);
    });

    it('returns empty for empty inputs', () => {
      const issues = auditor.auditTaxToCheckout([], []);
      expect(issues.length).toBe(0);
    });

    it('detects multiple mismatches', () => {
      const taxes = [
        makeTaxCalc({ calculationId: 't1', checkoutId: 'c1', taxAmount: 15 }),
        makeTaxCalc({ calculationId: 't2', checkoutId: 'c2', taxAmount: 20 }),
      ];
      const checkouts = [
        makeCheckout({ checkoutId: 'c1', taxAmount: 10 }),
        makeCheckout({ checkoutId: 'c2', taxAmount: 5 }),
      ];
      const issues = auditor.auditTaxToCheckout(taxes, checkouts);
      expect(issues.length).toBe(2);
    });
  });

  // --- auditCheckoutToInvoice ---

  describe('auditCheckoutToInvoice()', () => {
    it('returns empty when invoice matches checkout', () => {
      const issues = auditor.auditCheckoutToInvoice([makeCheckout()], [makeInvoice()]);
      expect(issues.length).toBe(0);
    });

    it('detects total amount mismatch', () => {
      const issues = auditor.auditCheckoutToInvoice(
        [makeCheckout({ totalAmount: 108 })],
        [makeInvoice({ totalAmount: 120 })],
      );
      expect(issues.length).toBeGreaterThanOrEqual(1);
      expect(issues.some(i => i.issueType === 'INVOICE_MISMATCH')).toBe(true);
    });

    it('detects missing invoice for completed checkout', () => {
      const issues = auditor.auditCheckoutToInvoice([makeCheckout()], []);
      expect(issues.length).toBe(1);
      expect(issues[0].issueType).toBe('MISSING_INVOICE');
    });

    it('ignores non-completed checkouts', () => {
      const issues = auditor.auditCheckoutToInvoice(
        [makeCheckout({ status: 'PENDING' })],
        [],
      );
      expect(issues.length).toBe(0);
    });

    it('detects tax amount mismatch on invoice', () => {
      const issues = auditor.auditCheckoutToInvoice(
        [makeCheckout({ taxAmount: 8 })],
        [makeInvoice({ taxAmount: 12, totalAmount: 112 })],
      );
      expect(issues.some(i => i.message.includes('tax mismatch'))).toBe(true);
    });

    it('marks MISSING_INVOICE as HIGH severity', () => {
      const issues = auditor.auditCheckoutToInvoice([makeCheckout()], []);
      expect(issues[0].severity).toBe('HIGH');
    });

    it('returns empty for empty inputs', () => {
      const issues = auditor.auditCheckoutToInvoice([], []);
      expect(issues.length).toBe(0);
    });

    it('handles multiple checkouts', () => {
      const checkouts = [
        makeCheckout({ checkoutId: 'c1' }),
        makeCheckout({ checkoutId: 'c2' }),
      ];
      const invoices = [makeInvoice({ checkoutId: 'c1' })];
      const issues = auditor.auditCheckoutToInvoice(checkouts, invoices);
      expect(issues.some(i => i.checkoutId === 'c2')).toBe(true);
    });
  });

  // --- detectTaxMismatches ---

  describe('detectTaxMismatches()', () => {
    it('returns empty when amounts match', () => {
      const issues = auditor.detectTaxMismatches([makeTaxCalc()], [makeCheckout()]);
      expect(issues.length).toBe(0);
    });

    it('detects discrepancy', () => {
      const issues = auditor.detectTaxMismatches(
        [makeTaxCalc({ taxAmount: 15 })],
        [makeCheckout({ taxAmount: 8 })],
      );
      expect(issues.length).toBe(1);
    });

    it('returns empty for empty inputs', () => {
      const issues = auditor.detectTaxMismatches([], []);
      expect(issues.length).toBe(0);
    });
  });

  // --- detectInvoiceMismatches ---

  describe('detectInvoiceMismatches()', () => {
    it('returns empty when amounts match', () => {
      const issues = auditor.detectInvoiceMismatches([makeCheckout()], [makeInvoice()]);
      expect(issues.length).toBe(0);
    });

    it('detects discrepancy', () => {
      const issues = auditor.detectInvoiceMismatches(
        [makeCheckout({ totalAmount: 108 })],
        [makeInvoice({ totalAmount: 150 })],
      );
      expect(issues.length).toBe(1);
    });

    it('returns empty for empty inputs', () => {
      const issues = auditor.detectInvoiceMismatches([], []);
      expect(issues.length).toBe(0);
    });
  });

  // --- validateTaxJurisdiction ---

  describe('validateTaxJurisdiction()', () => {
    it('returns null when jurisdictions match', () => {
      const issue = auditor.validateTaxJurisdiction(makeTaxCalc(), makeCheckout());
      expect(issue).toBeNull();
    });

    it('detects jurisdiction mismatch', () => {
      const issue = auditor.validateTaxJurisdiction(
        makeTaxCalc({ jurisdiction: 'US-NY' }),
        makeCheckout({ jurisdiction: 'US-CA' }),
      );
      expect(issue).not.toBeNull();
      expect(issue!.issueType).toBe('JURISDICTION_MISMATCH');
    });

    it('marks jurisdiction mismatch as MEDIUM severity', () => {
      const issue = auditor.validateTaxJurisdiction(
        makeTaxCalc({ jurisdiction: 'US-NY' }),
        makeCheckout({ jurisdiction: 'US-CA' }),
      );
      expect(issue!.severity).toBe('MEDIUM');
    });

    it('includes both jurisdictions in message', () => {
      const issue = auditor.validateTaxJurisdiction(
        makeTaxCalc({ jurisdiction: 'US-NY' }),
        makeCheckout({ jurisdiction: 'US-CA' }),
      );
      expect(issue!.message).toContain('US-NY');
      expect(issue!.message).toContain('US-CA');
    });
  });

  // --- generateAuditReport ---

  describe('generateAuditReport()', () => {
    it('returns a valid report structure', () => {
      const report = auditor.generateAuditReport([], [], []);
      expect(report.timestamp).toBeDefined();
      expect(report.totalTaxCalculations).toBe(0);
      expect(report.integrityScore).toBe(100);
    });

    it('counts all entities', () => {
      const report = auditor.generateAuditReport(
        [makeTaxCalc()],
        [makeCheckout()],
        [makeInvoice()],
      );
      expect(report.totalTaxCalculations).toBe(1);
      expect(report.totalCheckouts).toBe(1);
      expect(report.totalInvoices).toBe(1);
    });

    it('reduces score for mismatches', () => {
      const report = auditor.generateAuditReport(
        [makeTaxCalc({ taxAmount: 50 })],
        [makeCheckout({ taxAmount: 8 })],
        [makeInvoice()],
      );
      expect(report.integrityScore).toBeLessThan(100);
    });

    it('issues array is populated on mismatches', () => {
      const report = auditor.generateAuditReport(
        [makeTaxCalc({ taxAmount: 50 })],
        [makeCheckout({ taxAmount: 8 })],
        [],
      );
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('reports 100 score when all match', () => {
      const report = auditor.generateAuditReport(
        [makeTaxCalc()],
        [makeCheckout()],
        [makeInvoice()],
      );
      expect(report.integrityScore).toBe(100);
    });

    it('tracks tax match and mismatch counts', () => {
      const report = auditor.generateAuditReport(
        [makeTaxCalc({ taxAmount: 10 }), makeTaxCalc({ calculationId: 't2', checkoutId: 'c2', taxAmount: 50 })],
        [makeCheckout({ taxAmount: 10 }), makeCheckout({ checkoutId: 'c2', taxAmount: 5 })],
        [],
      );
      expect(report.taxMatchCount).toBe(1);
      expect(report.taxMismatchCount).toBe(1);
    });

    it('tracks invoice match and mismatch counts', () => {
      const report = auditor.generateAuditReport(
        [],
        [makeCheckout()],
        [makeInvoice({ totalAmount: 999 })],
      );
      expect(report.invoiceMismatchCount).toBeGreaterThanOrEqual(1);
    });
  });
});
