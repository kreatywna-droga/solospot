/**
 * CommerceCheckoutPaymentAuditG1191.test.ts — G1-191 Checkout → Payment Consistency Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CheckoutPaymentConsistencyAuditor,
  Checkout,
  Payment,
  CheckoutLineItem,
} from '../CommerceCheckoutPaymentAudit';

function makeCheckout(overrides: Partial<Checkout> = {}): Checkout {
  return {
    checkoutId: 'checkout-1',
    tenantId: 'tenant-1',
    customerId: 'cust-1',
    totalAmount: 100,
    currency: 'USD',
    status: 'COMPLETED',
    createdAt: '2025-01-01T00:00:00Z',
    lineItems: [
      { productId: 'prod-1', quantity: 1, unitPrice: 100, totalPrice: 100 },
    ],
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    paymentId: 'pay-1',
    checkoutId: 'checkout-1',
    tenantId: 'tenant-1',
    amount: 100,
    currency: 'USD',
    status: 'SUCCEEDED',
    createdAt: '2025-01-01T00:01:00Z',
    method: 'card',
    ...overrides,
  };
}

describe('CheckoutPaymentConsistencyAuditor', () => {
  let auditor: CheckoutPaymentConsistencyAuditor;

  beforeEach(() => {
    auditor = new CheckoutPaymentConsistencyAuditor();
  });

  describe('auditCheckoutToPaymentFlow()', () => {
    it('returns consistent for matching checkout and payment', () => {
      const checkout = makeCheckout();
      const payment = makePayment();
      const result = auditor.auditCheckoutToPaymentFlow(checkout, payment);
      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('detects checkout ID mismatch', () => {
      const checkout = makeCheckout({ checkoutId: 'checkout-1' });
      const payment = makePayment({ checkoutId: 'checkout-2' });
      const result = auditor.auditCheckoutToPaymentFlow(checkout, payment);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'CHECKOUT_ID_MISMATCH')).toBe(true);
    });

    it('detects currency mismatch', () => {
      const checkout = makeCheckout({ currency: 'USD' });
      const payment = makePayment({ currency: 'EUR' });
      const result = auditor.auditCheckoutToPaymentFlow(checkout, payment);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'CURRENCY_MISMATCH')).toBe(true);
    });

    it('detects amount mismatch beyond tolerance', () => {
      const checkout = makeCheckout({ totalAmount: 100 });
      const payment = makePayment({ amount: 90 });
      const result = auditor.auditCheckoutToPaymentFlow(checkout, payment);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'AMOUNT_MISMATCH')).toBe(true);
    });

    it('passes amount within tolerance', () => {
      const checkout = makeCheckout({ totalAmount: 100 });
      const payment = makePayment({ amount: 100.005 });
      const result = auditor.auditCheckoutToPaymentFlow(checkout, payment);
      expect(result.consistent).toBe(true);
    });

    it('reports multiple issues at once', () => {
      const checkout = makeCheckout({ checkoutId: 'c-1', currency: 'USD', totalAmount: 100 });
      const payment = makePayment({ checkoutId: 'c-2', currency: 'EUR', amount: 50 });
      const result = auditor.auditCheckoutToPaymentFlow(checkout, payment);
      expect(result.consistent).toBe(false);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('detectMissingPaymentForCheckout()', () => {
    it('returns no issues when all completed checkouts have payments', () => {
      const checkouts = [makeCheckout({ checkoutId: 'c-1' }), makeCheckout({ checkoutId: 'c-2' })];
      const payments = [
        makePayment({ checkoutId: 'c-1', paymentId: 'p-1' }),
        makePayment({ checkoutId: 'c-2', paymentId: 'p-2' }),
      ];
      const issues = auditor.detectMissingPaymentForCheckout(checkouts, payments);
      expect(issues).toHaveLength(0);
    });

    it('detects completed checkout without payment', () => {
      const checkouts = [makeCheckout({ checkoutId: 'c-1', status: 'COMPLETED' })];
      const payments: Payment[] = [];
      const issues = auditor.detectMissingPaymentForCheckout(checkouts, payments);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('MISSING_PAYMENT');
    });

    it('ignores non-completed checkouts', () => {
      const checkouts = [makeCheckout({ checkoutId: 'c-1', status: 'PENDING' })];
      const payments: Payment[] = [];
      const issues = auditor.detectMissingPaymentForCheckout(checkouts, payments);
      expect(issues).toHaveLength(0);
    });

    it('ignores abandoned checkouts', () => {
      const checkouts = [makeCheckout({ checkoutId: 'c-1', status: 'ABANDONED' })];
      const payments: Payment[] = [];
      const issues = auditor.detectMissingPaymentForCheckout(checkouts, payments);
      expect(issues).toHaveLength(0);
    });

    it('handles multiple missing payments', () => {
      const checkouts = [
        makeCheckout({ checkoutId: 'c-1', status: 'COMPLETED' }),
        makeCheckout({ checkoutId: 'c-2', status: 'COMPLETED' }),
        makeCheckout({ checkoutId: 'c-3', status: 'COMPLETED' }),
      ];
      const payments = [makePayment({ checkoutId: 'c-1' })];
      const issues = auditor.detectMissingPaymentForCheckout(checkouts, payments);
      expect(issues).toHaveLength(2);
    });
  });

  describe('detectOrphanedPayments()', () => {
    it('returns no issues when all payments have checkouts', () => {
      const checkouts = [makeCheckout({ checkoutId: 'c-1' })];
      const payments = [makePayment({ checkoutId: 'c-1' })];
      const issues = auditor.detectOrphanedPayments(checkouts, payments);
      expect(issues).toHaveLength(0);
    });

    it('detects payment without matching checkout', () => {
      const checkouts: Checkout[] = [];
      const payments = [makePayment({ checkoutId: 'c-999' })];
      const issues = auditor.detectOrphanedPayments(checkouts, payments);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('ORPHANED_PAYMENT');
    });

    it('detects multiple orphaned payments', () => {
      const checkouts: Checkout[] = [];
      const payments = [
        makePayment({ checkoutId: 'c-1', paymentId: 'p-1' }),
        makePayment({ checkoutId: 'c-2', paymentId: 'p-2' }),
      ];
      const issues = auditor.detectOrphanedPayments(checkouts, payments);
      expect(issues).toHaveLength(2);
    });

    it('handles empty payments list', () => {
      const checkouts = [makeCheckout()];
      const issues = auditor.detectOrphanedPayments(checkouts, []);
      expect(issues).toHaveLength(0);
    });
  });

  describe('validateCurrencyConsistency()', () => {
    it('returns true for matching currencies', () => {
      const checkout = makeCheckout({ currency: 'USD' });
      const payment = makePayment({ currency: 'USD' });
      expect(auditor.validateCurrencyConsistency(checkout, payment)).toBe(true);
    });

    it('returns false for mismatched currencies', () => {
      const checkout = makeCheckout({ currency: 'USD' });
      const payment = makePayment({ currency: 'GBP' });
      expect(auditor.validateCurrencyConsistency(checkout, payment)).toBe(false);
    });

    it('handles case-sensitive currency codes', () => {
      const checkout = makeCheckout({ currency: 'usd' });
      const payment = makePayment({ currency: 'USD' });
      expect(auditor.validateCurrencyConsistency(checkout, payment)).toBe(false);
    });
  });

  describe('validateAmountConsistency()', () => {
    it('returns true for exact match', () => {
      const checkout = makeCheckout({ totalAmount: 50 });
      const payment = makePayment({ amount: 50 });
      expect(auditor.validateAmountConsistency(checkout, payment)).toBe(true);
    });

    it('returns true within default tolerance', () => {
      const checkout = makeCheckout({ totalAmount: 100 });
      const payment = makePayment({ amount: 100.005 });
      expect(auditor.validateAmountConsistency(checkout, payment)).toBe(true);
    });

    it('returns false beyond default tolerance', () => {
      const checkout = makeCheckout({ totalAmount: 100 });
      const payment = makePayment({ amount: 101 });
      expect(auditor.validateAmountConsistency(checkout, payment)).toBe(false);
    });

    it('respects custom tolerance', () => {
      auditor.setAmountTolerance(1.0);
      const checkout = makeCheckout({ totalAmount: 100 });
      const payment = makePayment({ amount: 100.5 });
      expect(auditor.validateAmountConsistency(checkout, payment)).toBe(true);
    });

    it('returns false when payment is less than checkout', () => {
      const checkout = makeCheckout({ totalAmount: 100 });
      const payment = makePayment({ amount: 95 });
      expect(auditor.validateAmountConsistency(checkout, payment)).toBe(false);
    });
  });

  describe('setAmountTolerance / getAmountTolerance()', () => {
    it('returns default tolerance of 0.01', () => {
      expect(auditor.getAmountTolerance()).toBe(0.01);
    });

    it('updates tolerance', () => {
      auditor.setAmountTolerance(0.5);
      expect(auditor.getAmountTolerance()).toBe(0.5);
    });
  });

  describe('generateAuditReport()', () => {
    it('returns empty report for empty inputs', () => {
      const report = auditor.generateAuditReport([], []);
      expect(report.totalCheckouts).toBe(0);
      expect(report.totalPayments).toBe(0);
      expect(report.healthScore).toBe(100);
    });

    it('reports matched count correctly', () => {
      const checkouts = [makeCheckout({ checkoutId: 'c-1' })];
      const payments = [makePayment({ checkoutId: 'c-1' })];
      const report = auditor.generateAuditReport(checkouts, payments);
      expect(report.matchedCount).toBe(1);
      expect(report.unmatchedCheckouts).toBe(0);
    });

    it('reports unmatched checkouts', () => {
      const checkouts = [
        makeCheckout({ checkoutId: 'c-1' }),
        makeCheckout({ checkoutId: 'c-2' }),
      ];
      const payments = [makePayment({ checkoutId: 'c-1' })];
      const report = auditor.generateAuditReport(checkouts, payments);
      expect(report.unmatchedCheckouts).toBe(1);
    });

    it('reports orphaned payments', () => {
      const checkouts: Checkout[] = [];
      const payments = [makePayment({ checkoutId: 'c-999' })];
      const report = auditor.generateAuditReport(checkouts, payments);
      expect(report.orphanedPayments).toBe(1);
    });

    it('includes issues in report', () => {
      const checkouts = [makeCheckout({ checkoutId: 'c-1', currency: 'USD', totalAmount: 100 })];
      const payments = [makePayment({ checkoutId: 'c-1', currency: 'EUR', amount: 50 })];
      const report = auditor.generateAuditReport(checkouts, payments);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('generates a timestamp', () => {
      const report = auditor.generateAuditReport([], []);
      expect(report.timestamp).toBeTruthy();
      expect(new Date(report.timestamp).getTime()).not.toBeNaN();
    });

    it('calculates health score with penalties', () => {
      const checkouts = [makeCheckout({ checkoutId: 'c-1' })];
      const payments: Payment[] = [];
      const report = auditor.generateAuditReport(checkouts, payments);
      expect(report.healthScore).toBeLessThan(100);
    });

    it('health score is clamped to 0', () => {
      const checkouts = Array.from({ length: 50 }, (_, i) =>
        makeCheckout({ checkoutId: `c-${i}`, status: 'COMPLETED' }),
      );
      const payments: Payment[] = [];
      const report = auditor.generateAuditReport(checkouts, payments);
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
    });
  });
});
