/**
 * CommerceMerchantCustomerSyncAuditG1198.test.ts — G1-198
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MerchantCustomerOrderSyncAuditor,
  MerchantOrder,
  CustomerOrder,
} from '../CommerceMerchantCustomerSyncAudit';

function makeMerchantOrder(overrides: Partial<MerchantOrder> = {}): MerchantOrder {
  return {
    orderId: 'order-1',
    merchantId: 'merchant-1',
    customerId: 'customer-1',
    tenantId: 'tenant-1',
    items: [{ productId: 'p1', quantity: 1, price: 100 }],
    totalAmount: 100,
    status: 'CREATED',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
    currency: 'USD',
    ...overrides,
  };
}

function makeCustomerOrder(overrides: Partial<CustomerOrder> = {}): CustomerOrder {
  return {
    orderId: 'order-1',
    customerId: 'customer-1',
    tenantId: 'tenant-1',
    items: [{ productId: 'p1', quantity: 1, price: 100 }],
    totalAmount: 100,
    status: 'PLACED',
    createdAt: '2025-01-01T10:00:00Z',
    updatedAt: '2025-01-01T10:00:00Z',
    currency: 'USD',
    visibleToCustomer: true,
    ...overrides,
  };
}

describe('MerchantCustomerOrderSyncAuditor', () => {
  let auditor: MerchantCustomerOrderSyncAuditor;

  beforeEach(() => {
    auditor = new MerchantCustomerOrderSyncAuditor();
  });

  // --- auditMerchantToCustomerSync ---

  describe('auditMerchantToCustomerSync()', () => {
    it('returns a report with timestamp', () => {
      const report = auditor.auditMerchantToCustomerSync([], []);
      expect(report.timestamp).toBeDefined();
    });

    it('returns zero counts for empty inputs', () => {
      const report = auditor.auditMerchantToCustomerSync([], []);
      expect(report.totalMerchantOrders).toBe(0);
      expect(report.totalCustomerOrders).toBe(0);
    });

    it('counts merchant orders correctly', () => {
      const report = auditor.auditMerchantToCustomerSync(
        [makeMerchantOrder(), makeMerchantOrder({ orderId: 'o2' })],
        [],
      );
      expect(report.totalMerchantOrders).toBe(2);
    });

    it('counts customer orders correctly', () => {
      const report = auditor.auditMerchantToCustomerSync(
        [],
        [makeCustomerOrder(), makeCustomerOrder({ orderId: 'o2' })],
      );
      expect(report.totalCustomerOrders).toBe(2);
    });

    it('detects missing customer orders', () => {
      const report = auditor.auditMerchantToCustomerSync([makeMerchantOrder()], []);
      expect(report.missingCustomerOrderCount).toBe(1);
    });

    it('sync score 100 when fully synced', () => {
      const report = auditor.auditMerchantToCustomerSync(
        [makeMerchantOrder()],
        [makeCustomerOrder()],
      );
      expect(report.syncScore).toBe(100);
    });

    it('reduces score for missing orders', () => {
      const report = auditor.auditMerchantToCustomerSync([makeMerchantOrder()], []);
      expect(report.syncScore).toBeLessThan(100);
    });

    it('returns issues array', () => {
      const report = auditor.auditMerchantToCustomerSync([], []);
      expect(Array.isArray(report.issues)).toBe(true);
    });

    it('syncedCount increments for matching orders', () => {
      const report = auditor.auditMerchantToCustomerSync(
        [makeMerchantOrder()],
        [makeCustomerOrder()],
      );
      expect(report.syncedCount).toBe(1);
    });
  });

  // --- detectDesynchronizedOrders ---

  describe('detectDesynchronizedOrders()', () => {
    it('returns empty when orders match', () => {
      const issues = auditor.detectDesynchronizedOrders(
        [makeMerchantOrder()],
        [makeCustomerOrder()],
      );
      expect(issues.length).toBe(0);
    });

    it('detects amount mismatch', () => {
      const issues = auditor.detectDesynchronizedOrders(
        [makeMerchantOrder({ totalAmount: 100 })],
        [makeCustomerOrder({ totalAmount: 200 })],
      );
      expect(issues.length).toBe(1);
      expect(issues[0].issueType).toBe('DESYNCHRONIZED');
    });

    it('marks amount mismatch as HIGH severity', () => {
      const issues = auditor.detectDesynchronizedOrders(
        [makeMerchantOrder({ totalAmount: 100 })],
        [makeCustomerOrder({ totalAmount: 200 })],
      );
      expect(issues[0].severity).toBe('HIGH');
    });

    it('returns empty for empty inputs', () => {
      const issues = auditor.detectDesynchronizedOrders([], []);
      expect(issues.length).toBe(0);
    });

    it('skips orders not in customer view', () => {
      const issues = auditor.detectDesynchronizedOrders(
        [makeMerchantOrder({ orderId: 'o1' })],
        [],
      );
      expect(issues.length).toBe(0);
    });

    it('detects status mismatch via validateStatusSynchronization', () => {
      const issues = auditor.detectDesynchronizedOrders(
        [makeMerchantOrder({ status: 'CONFIRMED' })],
        [makeCustomerOrder({ status: 'PLACED' })],
      );
      expect(issues.some(i => i.issueType === 'STATUS_MISMATCH')).toBe(true);
    });

    it('detects timestamp drift via validateTimestampConsistency', () => {
      const issues = auditor.detectDesynchronizedOrders(
        [makeMerchantOrder({ updatedAt: '2025-01-01T10:00:00Z' })],
        [makeCustomerOrder({ updatedAt: '2025-01-01T10:05:00Z' })],
      );
      expect(issues.some(i => i.issueType === 'TIMESTAMP_DRIFT')).toBe(true);
    });
  });

  // --- detectMissingCustomerOrders ---

  describe('detectMissingCustomerOrders()', () => {
    it('returns empty when all merchant orders have customer counterparts', () => {
      const issues = auditor.detectMissingCustomerOrders(
        [makeMerchantOrder()],
        [makeCustomerOrder()],
      );
      expect(issues.length).toBe(0);
    });

    it('detects missing customer order', () => {
      const issues = auditor.detectMissingCustomerOrders(
        [makeMerchantOrder({ orderId: 'o1' })],
        [],
      );
      expect(issues.length).toBe(1);
      expect(issues[0].issueType).toBe('MISSING_CUSTOMER_ORDER');
    });

    it('marks missing as HIGH severity', () => {
      const issues = auditor.detectMissingCustomerOrders(
        [makeMerchantOrder()],
        [],
      );
      expect(issues[0].severity).toBe('HIGH');
    });

    it('detects multiple missing orders', () => {
      const issues = auditor.detectMissingCustomerOrders(
        [makeMerchantOrder({ orderId: 'o1' }), makeMerchantOrder({ orderId: 'o2' })],
        [],
      );
      expect(issues.length).toBe(2);
    });

    it('returns empty for empty inputs', () => {
      const issues = auditor.detectMissingCustomerOrders([], []);
      expect(issues.length).toBe(0);
    });

    it('includes orderId in issue', () => {
      const issues = auditor.detectMissingCustomerOrders(
        [makeMerchantOrder({ orderId: 'missing-1' })],
        [],
      );
      expect(issues[0].orderId).toBe('missing-1');
    });

    it('does not flag orders that exist in customer view', () => {
      const issues = auditor.detectMissingCustomerOrders(
        [makeMerchantOrder({ orderId: 'o1' })],
        [makeCustomerOrder({ orderId: 'o1' })],
      );
      expect(issues.length).toBe(0);
    });
  });

  // --- validateStatusSynchronization ---

  describe('validateStatusSynchronization()', () => {
    it('returns null when statuses map correctly', () => {
      const issue = auditor.validateStatusSynchronization(
        makeMerchantOrder({ status: 'CONFIRMED' }),
        makeCustomerOrder({ status: 'CONFIRMED' }),
      );
      expect(issue).toBeNull();
    });

    it('detects CREATED → PLACED mapping mismatch', () => {
      const issue = auditor.validateStatusSynchronization(
        makeMerchantOrder({ status: 'CREATED' }),
        makeCustomerOrder({ status: 'CONFIRMED' }),
      );
      expect(issue).not.toBeNull();
      expect(issue!.issueType).toBe('STATUS_MISMATCH');
    });

    it('marks status mismatch as MEDIUM severity', () => {
      const issue = auditor.validateStatusSynchronization(
        makeMerchantOrder({ status: 'CREATED' }),
        makeCustomerOrder({ status: 'CONFIRMED' }),
      );
      expect(issue!.severity).toBe('MEDIUM');
    });

    it('validates SHIPPED → SHIPPED mapping', () => {
      const issue = auditor.validateStatusSynchronization(
        makeMerchantOrder({ status: 'SHIPPED' }),
        makeCustomerOrder({ status: 'SHIPPED' }),
      );
      expect(issue).toBeNull();
    });

    it('validates DELIVERED → DELIVERED mapping', () => {
      const issue = auditor.validateStatusSynchronization(
        makeMerchantOrder({ status: 'DELIVERED' }),
        makeCustomerOrder({ status: 'DELIVERED' }),
      );
      expect(issue).toBeNull();
    });

    it('validates CANCELLED → CANCELLED mapping', () => {
      const issue = auditor.validateStatusSynchronization(
        makeMerchantOrder({ status: 'CANCELLED' }),
        makeCustomerOrder({ status: 'CANCELLED' }),
      );
      expect(issue).toBeNull();
    });

    it('validates REFUNDED → REFUNDED mapping', () => {
      const issue = auditor.validateStatusSynchronization(
        makeMerchantOrder({ status: 'REFUNDED' }),
        makeCustomerOrder({ status: 'REFUNDED' }),
      );
      expect(issue).toBeNull();
    });

    it('returns null for unknown merchant status', () => {
      const issue = auditor.validateStatusSynchronization(
        makeMerchantOrder({ status: 'PROCESSING' as MerchantOrder['status'] }),
        makeCustomerOrder({ status: 'PROCESSING' }),
      );
      expect(issue).toBeNull();
    });
  });

  // --- validateTimestampConsistency ---

  describe('validateTimestampConsistency()', () => {
    it('returns null when timestamps are within tolerance', () => {
      const issue = auditor.validateTimestampConsistency(
        makeMerchantOrder({ updatedAt: '2025-01-01T10:00:00Z' }),
        makeCustomerOrder({ updatedAt: '2025-01-01T10:00:30Z' }),
      );
      expect(issue).toBeNull();
    });

    it('detects timestamp drift beyond tolerance', () => {
      const issue = auditor.validateTimestampConsistency(
        makeMerchantOrder({ updatedAt: '2025-01-01T10:00:00Z' }),
        makeCustomerOrder({ updatedAt: '2025-01-01T10:05:00Z' }),
      );
      expect(issue).not.toBeNull();
      expect(issue!.issueType).toBe('TIMESTAMP_DRIFT');
    });

    it('marks drift as LOW severity', () => {
      const issue = auditor.validateTimestampConsistency(
        makeMerchantOrder({ updatedAt: '2025-01-01T10:00:00Z' }),
        makeCustomerOrder({ updatedAt: '2025-01-01T10:05:00Z' }),
      );
      expect(issue!.severity).toBe('LOW');
    });

    it('returns null for exact same timestamps', () => {
      const issue = auditor.validateTimestampConsistency(
        makeMerchantOrder({ updatedAt: '2025-01-01T10:00:00Z' }),
        makeCustomerOrder({ updatedAt: '2025-01-01T10:00:00Z' }),
      );
      expect(issue).toBeNull();
    });

    it('returns null within 60s tolerance', () => {
      const issue = auditor.validateTimestampConsistency(
        makeMerchantOrder({ updatedAt: '2025-01-01T10:00:00Z' }),
        makeCustomerOrder({ updatedAt: '2025-01-01T10:01:00Z' }),
      );
      expect(issue).toBeNull();
    });
  });

  // --- generateSyncReport ---

  describe('generateSyncReport()', () => {
    it('delegates to auditMerchantToCustomerSync', () => {
      const report = auditor.generateSyncReport(
        [makeMerchantOrder()],
        [makeCustomerOrder()],
      );
      expect(report.syncedCount).toBe(1);
      expect(report.syncScore).toBe(100);
    });

    it('returns zero counts for empty inputs', () => {
      const report = auditor.generateSyncReport([], []);
      expect(report.totalMerchantOrders).toBe(0);
      expect(report.missingCustomerOrderCount).toBe(0);
    });
  });
});
