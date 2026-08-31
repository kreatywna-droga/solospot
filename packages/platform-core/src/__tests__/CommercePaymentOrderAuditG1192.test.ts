/**
 * CommercePaymentOrderAuditG1192.test.ts — G1-192 Payment → Order Consistency Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  PaymentOrderConsistencyAuditor,
  Payment,
  Order,
  OrderLineItem,
} from '../CommercePaymentOrderAudit';

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    paymentId: 'pay-1',
    orderId: 'order-1',
    tenantId: 'tenant-1',
    amount: 100,
    currency: 'USD',
    status: 'SUCCEEDED',
    createdAt: '2025-01-01T00:00:00Z',
    method: 'card',
    ...overrides,
  };
}

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderId: 'order-1',
    tenantId: 'tenant-1',
    customerId: 'cust-1',
    totalAmount: 100,
    currency: 'USD',
    status: 'CONFIRMED',
    createdAt: '2025-01-01T00:00:00Z',
    lineItems: [
      { productId: 'prod-1', quantity: 1, unitPrice: 100, totalPrice: 100 },
    ],
    ...overrides,
  };
}

describe('PaymentOrderConsistencyAuditor', () => {
  let auditor: PaymentOrderConsistencyAuditor;

  beforeEach(() => {
    auditor = new PaymentOrderConsistencyAuditor();
  });

  describe('auditPaymentToOrderFlow()', () => {
    it('returns consistent for matching payment and order', () => {
      const payment = makePayment();
      const order = makeOrder();
      const result = auditor.auditPaymentToOrderFlowWithArrays([payment], [order]);
      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('detects payment referencing non-existent order', () => {
      const payment = makePayment({ orderId: 'order-999' });
      const order = makeOrder({ orderId: 'order-1' });
      const result = auditor.auditPaymentToOrderFlowWithArrays([payment], [order]);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'MISSING_ORDER')).toBe(true);
    });

    it('detects status mismatch', () => {
      const payment = makePayment({ status: 'SUCCEEDED' });
      const order = makeOrder({ status: 'PENDING' });
      const result = auditor.auditPaymentToOrderFlowWithArrays([payment], [order]);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'STATUS_MISMATCH')).toBe(true);
    });

    it('allows valid status mapping', () => {
      const payment = makePayment({ status: 'SUCCEEDED' });
      const order = makeOrder({ status: 'PROCESSING' });
      const result = auditor.auditPaymentToOrderFlowWithArrays([payment], [order]);
      expect(result.consistent).toBe(true);
    });

    it('handles multiple payments', () => {
      const payments = [
        makePayment({ paymentId: 'p-1', orderId: 'o-1' }),
        makePayment({ paymentId: 'p-2', orderId: 'o-2' }),
      ];
      const orders = [
        makeOrder({ orderId: 'o-1' }),
        makeOrder({ orderId: 'o-2' }),
      ];
      const result = auditor.auditPaymentToOrderFlowWithArrays(payments, orders);
      expect(result.consistent).toBe(true);
    });
  });

  describe('detectUnpaidOrders()', () => {
    it('returns no issues for paid orders', () => {
      const payments = [makePayment({ orderId: 'o-1', amount: 100 })];
      const orders = [makeOrder({ orderId: 'o-1', totalAmount: 100 })];
      const issues = auditor.detectUnpaidOrders(payments, orders);
      expect(issues).toHaveLength(0);
    });

    it('detects unpaid order', () => {
      const payments: Payment[] = [];
      const orders = [makeOrder({ orderId: 'o-1', totalAmount: 100 })];
      const issues = auditor.detectUnpaidOrders(payments, orders);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('UNPAID_ORDER');
    });

    it('detects partially paid order', () => {
      const payments = [makePayment({ orderId: 'o-1', amount: 50 })];
      const orders = [makeOrder({ orderId: 'o-1', totalAmount: 100 })];
      const issues = auditor.detectUnpaidOrders(payments, orders);
      expect(issues).toHaveLength(1);
    });

    it('ignores cancelled orders', () => {
      const payments: Payment[] = [];
      const orders = [makeOrder({ orderId: 'o-1', status: 'CANCELLED' })];
      const issues = auditor.detectUnpaidOrders(payments, orders);
      expect(issues).toHaveLength(0);
    });

    it('handles multiple unpaid orders', () => {
      const payments: Payment[] = [];
      const orders = [
        makeOrder({ orderId: 'o-1' }),
        makeOrder({ orderId: 'o-2' }),
        makeOrder({ orderId: 'o-3' }),
      ];
      const issues = auditor.detectUnpaidOrders(payments, orders);
      expect(issues).toHaveLength(3);
    });

    it('sums multiple payments for same order', () => {
      const payments = [
        makePayment({ paymentId: 'p-1', orderId: 'o-1', amount: 60 }),
        makePayment({ paymentId: 'p-2', orderId: 'o-1', amount: 40 }),
      ];
      const orders = [makeOrder({ orderId: 'o-1', totalAmount: 100 })];
      const issues = auditor.detectUnpaidOrders(payments, orders);
      expect(issues).toHaveLength(0);
    });
  });

  describe('detectOverpaidOrders()', () => {
    it('returns no issues for correctly paid orders', () => {
      const payments = [makePayment({ orderId: 'o-1', amount: 100 })];
      const orders = [makeOrder({ orderId: 'o-1', totalAmount: 100 })];
      const issues = auditor.detectOverpaidOrders(payments, orders);
      expect(issues).toHaveLength(0);
    });

    it('detects overpaid order', () => {
      const payments = [makePayment({ orderId: 'o-1', amount: 150 })];
      const orders = [makeOrder({ orderId: 'o-1', totalAmount: 100 })];
      const issues = auditor.detectOverpaidOrders(payments, orders);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('OVERPAID_ORDER');
    });

    it('handles multiple overpaid orders', () => {
      const payments = [
        makePayment({ paymentId: 'p-1', orderId: 'o-1', amount: 200 }),
        makePayment({ paymentId: 'p-2', orderId: 'o-2', amount: 300 }),
      ];
      const orders = [
        makeOrder({ orderId: 'o-1', totalAmount: 100 }),
        makeOrder({ orderId: 'o-2', totalAmount: 100 }),
      ];
      const issues = auditor.detectOverpaidOrders(payments, orders);
      expect(issues).toHaveLength(2);
    });

    it('ignores failed payments', () => {
      const payments = [makePayment({ orderId: 'o-1', amount: 200, status: 'FAILED' })];
      const orders = [makeOrder({ orderId: 'o-1', totalAmount: 100 })];
      const issues = auditor.detectOverpaidOrders(payments, orders);
      expect(issues).toHaveLength(0);
    });
  });

  describe('validatePaymentStatusMapping()', () => {
    it('SUCCEEDED maps to CONFIRMED', () => {
      const payment = makePayment({ status: 'SUCCEEDED' });
      const order = makeOrder({ status: 'CONFIRMED' });
      expect(auditor.validatePaymentStatusMapping(payment, order)).toBe(true);
    });

    it('SUCCEEDED maps to PROCESSING', () => {
      const payment = makePayment({ status: 'SUCCEEDED' });
      const order = makeOrder({ status: 'PROCESSING' });
      expect(auditor.validatePaymentStatusMapping(payment, order)).toBe(true);
    });

    it('PENDING maps to PENDING', () => {
      const payment = makePayment({ status: 'PENDING' });
      const order = makeOrder({ status: 'PENDING' });
      expect(auditor.validatePaymentStatusMapping(payment, order)).toBe(true);
    });

    it('FAILED maps to PENDING', () => {
      const payment = makePayment({ status: 'FAILED' });
      const order = makeOrder({ status: 'PENDING' });
      expect(auditor.validatePaymentStatusMapping(payment, order)).toBe(true);
    });

    it('REFUNDED maps to CANCELLED', () => {
      const payment = makePayment({ status: 'REFUNDED' });
      const order = makeOrder({ status: 'CANCELLED' });
      expect(auditor.validatePaymentStatusMapping(payment, order)).toBe(true);
    });

    it('SUCCEEDED does not map to PENDING', () => {
      const payment = makePayment({ status: 'SUCCEEDED' });
      const order = makeOrder({ status: 'PENDING' });
      expect(auditor.validatePaymentStatusMapping(payment, order)).toBe(false);
    });

    it('PENDING does not map to SHIPPED', () => {
      const payment = makePayment({ status: 'PENDING' });
      const order = makeOrder({ status: 'SHIPPED' });
      expect(auditor.validatePaymentStatusMapping(payment, order)).toBe(false);
    });
  });

  describe('setAmountTolerance / getAmountTolerance()', () => {
    it('returns default tolerance', () => {
      expect(auditor.getAmountTolerance()).toBe(0.01);
    });

    it('updates tolerance', () => {
      auditor.setAmountTolerance(5.0);
      expect(auditor.getAmountTolerance()).toBe(5.0);
    });
  });

  describe('generateAuditReport()', () => {
    it('returns empty report for empty inputs', () => {
      const report = auditor.generateAuditReport([], []);
      expect(report.totalPayments).toBe(0);
      expect(report.totalOrders).toBe(0);
      expect(report.healthScore).toBe(100);
    });

    it('reports matched count correctly', () => {
      const payments = [makePayment({ orderId: 'o-1' })];
      const orders = [makeOrder({ orderId: 'o-1' })];
      const report = auditor.generateAuditReport(payments, orders);
      expect(report.matchedCount).toBe(1);
    });

    it('reports unpaid orders', () => {
      const payments: Payment[] = [];
      const orders = [makeOrder({ orderId: 'o-1' })];
      const report = auditor.generateAuditReport(payments, orders);
      expect(report.unpaidOrders).toBe(1);
    });

    it('reports overpaid orders', () => {
      const payments = [makePayment({ orderId: 'o-1', amount: 200 })];
      const orders = [makeOrder({ orderId: 'o-1', totalAmount: 100 })];
      const report = auditor.generateAuditReport(payments, orders);
      expect(report.overpaidOrders).toBe(1);
    });

    it('includes issues in report', () => {
      const payments: Payment[] = [];
      const orders = [makeOrder({ orderId: 'o-1' })];
      const report = auditor.generateAuditReport(payments, orders);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('generates a timestamp', () => {
      const report = auditor.generateAuditReport([], []);
      expect(report.timestamp).toBeTruthy();
      expect(new Date(report.timestamp).getTime()).not.toBeNaN();
    });

    it('health score is clamped to 0', () => {
      const payments: Payment[] = [];
      const orders = Array.from({ length: 50 }, (_, i) => makeOrder({ orderId: `o-${i}` }));
      const report = auditor.generateAuditReport(payments, orders);
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
    });
  });
});
