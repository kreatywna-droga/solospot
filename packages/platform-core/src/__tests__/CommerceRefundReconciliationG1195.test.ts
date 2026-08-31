/**
 * CommerceRefundReconciliationG1195.test.ts — G1-195 Refund → Payment → Inventory Reconciliation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RefundPaymentInventoryReconciler,
  Refund,
  Payment,
  InventoryItem,
  RefundItem,
} from '../CommerceRefundReconciliation';

function makeRefund(overrides: Partial<Refund> = {}): Refund {
  return {
    refundId: 'ref-1',
    paymentId: 'pay-1',
    orderId: 'order-1',
    tenantId: 'tenant-1',
    amount: 50,
    currency: 'USD',
    status: 'PROCESSED',
    reason: 'Customer request',
    createdAt: '2025-01-01T00:00:00Z',
    items: [
      { productId: 'prod-1', quantity: 1, unitPrice: 50 },
    ],
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    paymentId: 'pay-1',
    orderId: 'order-1',
    tenantId: 'tenant-1',
    amount: 100,
    currency: 'USD',
    status: 'SUCCEEDED',
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeInventory(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    productId: 'prod-1',
    tenantId: 'tenant-1',
    sku: 'SKU-1',
    currentStock: 50,
    reservedStock: 5,
    totalSold: 10,
    lastUpdatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('RefundPaymentInventoryReconciler', () => {
  let reconciler: RefundPaymentInventoryReconciler;

  beforeEach(() => {
    reconciler = new RefundPaymentInventoryReconciler();
  });

  describe('auditRefundToPayment()', () => {
    it('returns consistent for valid refund referencing payment', () => {
      const refunds = [makeRefund()];
      const payments = [makePayment()];
      const result = reconciler.auditRefundToPayment(refunds, payments);
      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('detects refund referencing non-existent payment', () => {
      const refunds = [makeRefund({ paymentId: 'pay-999' })];
      const payments = [makePayment()];
      const result = reconciler.auditRefundToPayment(refunds, payments);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'ORPHANED_REFUND')).toBe(true);
    });

    it('detects currency mismatch', () => {
      const refunds = [makeRefund({ currency: 'EUR' })];
      const payments = [makePayment({ currency: 'USD' })];
      const result = reconciler.auditRefundToPayment(refunds, payments);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'CURRENCY_MISMATCH')).toBe(true);
    });

    it('detects refund amount exceeds payment', () => {
      const refunds = [makeRefund({ amount: 200 })];
      const payments = [makePayment({ amount: 100 })];
      const result = reconciler.auditRefundToPayment(refunds, payments);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'REFUND_EXCEEDS_PAYMENT')).toBe(true);
    });

    it('allows refund equal to payment', () => {
      const refunds = [makeRefund({ amount: 100 })];
      const payments = [makePayment({ amount: 100 })];
      const result = reconciler.auditRefundToPayment(refunds, payments);
      expect(result.consistent).toBe(true);
    });

    it('handles multiple refunds', () => {
      const refunds = [
        makeRefund({ refundId: 'r-1', paymentId: 'p-1', amount: 30 }),
        makeRefund({ refundId: 'r-2', paymentId: 'p-2', amount: 40 }),
      ];
      const payments = [
        makePayment({ paymentId: 'p-1', amount: 100 }),
        makePayment({ paymentId: 'p-2', amount: 100 }),
      ];
      const result = reconciler.auditRefundToPayment(refunds, payments);
      expect(result.consistent).toBe(true);
    });
  });

  describe('auditRefundToInventory()', () => {
    it('returns consistent when stock is restored', () => {
      const refunds = [makeRefund({ status: 'PROCESSED', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 50 })];
      const result = reconciler.auditRefundToInventory(refunds, inventory);
      expect(result.consistent).toBe(true);
    });

    it('detects missing inventory for refund', () => {
      const refunds = [makeRefund({ status: 'PROCESSED', items: [{ productId: 'p-99', quantity: 1, unitPrice: 50 }] })];
      const inventory: InventoryItem[] = [];
      const result = reconciler.auditRefundToInventory(refunds, inventory);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'MISSING_INVENTORY')).toBe(true);
    });

    it('detects missing stock restore', () => {
      const refunds = [makeRefund({ status: 'PROCESSED', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 0 })];
      const result = reconciler.auditRefundToInventory(refunds, inventory);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'MISSING_STOCK_RESTORE')).toBe(true);
    });

    it('ignores pending refunds', () => {
      const refunds = [makeRefund({ status: 'PENDING', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 0 })];
      const result = reconciler.auditRefundToInventory(refunds, inventory);
      expect(result.consistent).toBe(true);
    });

    it('handles multiple items in refund', () => {
      const refunds = [makeRefund({
        status: 'PROCESSED',
        items: [
          { productId: 'p-1', quantity: 1, unitPrice: 50 },
          { productId: 'p-2', quantity: 1, unitPrice: 30 },
        ],
      })];
      const inventory = [
        makeInventory({ productId: 'p-1', currentStock: 50 }),
        makeInventory({ productId: 'p-2', currentStock: 0 }),
      ];
      const result = reconciler.auditRefundToInventory(refunds, inventory);
      expect(result.consistent).toBe(false);
    });
  });

  describe('detectOrphanedRefunds()', () => {
    it('returns no issues when all refunds have valid payments', () => {
      const refunds = [makeRefund({ paymentId: 'p-1' })];
      const payments = [makePayment({ paymentId: 'p-1' })];
      const issues = reconciler.detectOrphanedRefunds(refunds, payments);
      expect(issues).toHaveLength(0);
    });

    it('detects orphaned refund', () => {
      const refunds = [makeRefund({ paymentId: 'p-999' })];
      const payments = [makePayment({ paymentId: 'p-1' })];
      const issues = reconciler.detectOrphanedRefunds(refunds, payments);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('ORPHANED_REFUND');
    });

    it('handles multiple orphaned refunds', () => {
      const refunds = [
        makeRefund({ refundId: 'r-1', paymentId: 'p-99' }),
        makeRefund({ refundId: 'r-2', paymentId: 'p-98' }),
      ];
      const payments: Payment[] = [];
      const issues = reconciler.detectOrphanedRefunds(refunds, payments);
      expect(issues).toHaveLength(2);
    });

    it('handles empty refunds', () => {
      const payments = [makePayment()];
      const issues = reconciler.detectOrphanedRefunds([], payments);
      expect(issues).toHaveLength(0);
    });

    it('handles empty payments', () => {
      const refunds = [makeRefund()];
      const issues = reconciler.detectOrphanedRefunds(refunds, []);
      expect(issues).toHaveLength(1);
    });
  });

  describe('detectMissingInventoryRestore()', () => {
    it('returns no issues when stock is restored', () => {
      const refunds = [makeRefund({ status: 'PROCESSED', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 50 })];
      const issues = reconciler.detectMissingInventoryRestore(refunds, inventory);
      expect(issues).toHaveLength(0);
    });

    it('detects zero stock after refund', () => {
      const refunds = [makeRefund({ status: 'PROCESSED', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 0 })];
      const issues = reconciler.detectMissingInventoryRestore(refunds, inventory);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('MISSING_STOCK_RESTORE');
    });

    it('detects negative stock after refund', () => {
      const refunds = [makeRefund({ status: 'PROCESSED', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: -1 })];
      const issues = reconciler.detectMissingInventoryRestore(refunds, inventory);
      expect(issues).toHaveLength(1);
    });

    it('ignores pending refunds', () => {
      const refunds = [makeRefund({ status: 'PENDING', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 0 })];
      const issues = reconciler.detectMissingInventoryRestore(refunds, inventory);
      expect(issues).toHaveLength(0);
    });

    it('handles APPROVED status', () => {
      const refunds = [makeRefund({ status: 'APPROVED', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 0 })];
      const issues = reconciler.detectMissingInventoryRestore(refunds, inventory);
      expect(issues).toHaveLength(1);
    });

    it('handles multiple products', () => {
      const refunds = [makeRefund({
        status: 'PROCESSED',
        items: [
          { productId: 'p-1', quantity: 1, unitPrice: 50 },
          { productId: 'p-2', quantity: 1, unitPrice: 30 },
        ],
      })];
      const inventory = [
        makeInventory({ productId: 'p-1', currentStock: 50 }),
        makeInventory({ productId: 'p-2', currentStock: 0 }),
      ];
      const issues = reconciler.detectMissingInventoryRestore(refunds, inventory);
      expect(issues).toHaveLength(1);
    });
  });

  describe('validateRefundAmount()', () => {
    it('returns true when refund <= payment', () => {
      const refund = makeRefund({ amount: 50 });
      const payment = makePayment({ amount: 100 });
      expect(reconciler.validateRefundAmount(refund, payment)).toBe(true);
    });

    it('returns true when refund equals payment', () => {
      const refund = makeRefund({ amount: 100 });
      const payment = makePayment({ amount: 100 });
      expect(reconciler.validateRefundAmount(refund, payment)).toBe(true);
    });

    it('returns false when refund exceeds payment', () => {
      const refund = makeRefund({ amount: 150 });
      const payment = makePayment({ amount: 100 });
      expect(reconciler.validateRefundAmount(refund, payment)).toBe(false);
    });

    it('handles zero refund amount', () => {
      const refund = makeRefund({ amount: 0 });
      const payment = makePayment({ amount: 100 });
      expect(reconciler.validateRefundAmount(refund, payment)).toBe(true);
    });
  });

  describe('generateReconciliationReport()', () => {
    it('returns empty report for empty inputs', () => {
      const report = reconciler.generateReconciliationReport([], [], []);
      expect(report.totalRefunds).toBe(0);
      expect(report.totalPayments).toBe(0);
      expect(report.totalInventoryItems).toBe(0);
      expect(report.healthScore).toBe(100);
    });

    it('reports orphaned refunds count', () => {
      const refunds = [makeRefund({ paymentId: 'p-999' })];
      const payments = [makePayment({ paymentId: 'p-1' })];
      const report = reconciler.generateReconciliationReport(refunds, payments, []);
      expect(report.orphanedRefunds).toBe(1);
    });

    it('reports missing restores count', () => {
      const refunds = [makeRefund({ status: 'PROCESSED', items: [{ productId: 'p-1', quantity: 1, unitPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 0 })];
      const report = reconciler.generateReconciliationReport(refunds, [], inventory);
      expect(report.missingRestores).toBe(1);
    });

    it('reports invalid amounts count', () => {
      const refunds = [makeRefund({ amount: 200 })];
      const payments = [makePayment({ amount: 100 })];
      const report = reconciler.generateReconciliationReport(refunds, payments, []);
      expect(report.invalidAmounts).toBe(1);
    });

    it('includes issues in report', () => {
      const refunds = [makeRefund({ paymentId: 'p-999' })];
      const report = reconciler.generateReconciliationReport(refunds, [], []);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('generates a timestamp', () => {
      const report = reconciler.generateReconciliationReport([], [], []);
      expect(report.timestamp).toBeTruthy();
      expect(new Date(report.timestamp).getTime()).not.toBeNaN();
    });

    it('health score is clamped to 0', () => {
      const refunds = Array.from({ length: 50 }, (_, i) =>
        makeRefund({ refundId: `r-${i}`, paymentId: `p-${i}`, amount: 200 }),
      );
      const payments = Array.from({ length: 50 }, (_, i) =>
        makePayment({ paymentId: `p-${i}`, amount: 100 }),
      );
      const report = reconciler.generateReconciliationReport(refunds, payments, []);
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
    });
  });
});
