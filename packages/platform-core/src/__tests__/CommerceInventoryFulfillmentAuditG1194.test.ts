/**
 * CommerceInventoryFulfillmentAuditG1194.test.ts — G1-194 Inventory → Fulfillment Consistency Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InventoryFulfillmentConsistencyAuditor,
  InventoryItem,
  Fulfillment,
  FulfillmentItem,
} from '../CommerceInventoryFulfillmentAudit';

function makeInventory(overrides: Partial<InventoryItem> = {}): InventoryItem {
  return {
    productId: 'prod-1',
    tenantId: 'tenant-1',
    sku: 'SKU-1',
    currentStock: 50,
    reservedStock: 5,
    allocatedStock: 10,
    totalSold: 10,
    lastUpdatedAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

function makeFulfillment(overrides: Partial<Fulfillment> = {}): Fulfillment {
  return {
    fulfillmentId: 'ful-1',
    orderId: 'order-1',
    tenantId: 'tenant-1',
    status: 'ALLOCATED',
    items: [
      { productId: 'prod-1', quantity: 2, allocatedAt: '2025-01-01T00:00:00Z' },
    ],
    createdAt: '2025-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('InventoryFulfillmentConsistencyAuditor', () => {
  let auditor: InventoryFulfillmentConsistencyAuditor;

  beforeEach(() => {
    auditor = new InventoryFulfillmentConsistencyAuditor();
  });

  describe('auditInventoryToFulfillment()', () => {
    it('returns consistent when allocation matches fulfillment', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 5 })];
      const fulfillments = [makeFulfillment({ items: [{ productId: 'p-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const result = auditor.auditInventoryToFulfillment(inventory, fulfillments);
      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('detects missing inventory for fulfillment', () => {
      const inventory: InventoryItem[] = [];
      const fulfillments = [makeFulfillment({ items: [{ productId: 'p-99', quantity: 1, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const result = auditor.auditInventoryToFulfillment(inventory, fulfillments);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'MISSING_INVENTORY')).toBe(true);
    });

    it('detects allocation mismatch', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 2 })];
      const fulfillments = [makeFulfillment({ items: [{ productId: 'p-1', quantity: 10, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const result = auditor.auditInventoryToFulfillment(inventory, fulfillments);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'ALLOCATION_MISMATCH')).toBe(true);
    });

    it('ignores cancelled fulfillments', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 0 })];
      const fulfillments = [makeFulfillment({ status: 'CANCELLED', items: [{ productId: 'p-1', quantity: 10, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const result = auditor.auditInventoryToFulfillment(inventory, fulfillments);
      expect(result.consistent).toBe(true);
    });

    it('handles multiple products', () => {
      const inventory = [
        makeInventory({ productId: 'p-1', allocatedStock: 3 }),
        makeInventory({ productId: 'p-2', allocatedStock: 5 }),
      ];
      const fulfillments = [makeFulfillment({
        items: [
          { productId: 'p-1', quantity: 3, allocatedAt: '2025-01-01T00:00:00Z' },
          { productId: 'p-2', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' },
        ],
      })];
      const result = auditor.auditInventoryToFulfillment(inventory, fulfillments);
      expect(result.consistent).toBe(true);
    });
  });

  describe('detectUnfulfilledAllocations()', () => {
    it('returns no issues when allocated items are shipped', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 5 })];
      const fulfillments = [makeFulfillment({ status: 'SHIPPED', items: [{ productId: 'p-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const issues = auditor.detectUnfulfilledAllocations(inventory, fulfillments);
      expect(issues).toHaveLength(0);
    });

    it('detects allocated but not shipped', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 5 })];
      const fulfillments: Fulfillment[] = [];
      const issues = auditor.detectUnfulfilledAllocations(inventory, fulfillments);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('UNFULFILLED_ALLOCATION');
    });

    it('ignores inventory with zero allocation', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 0 })];
      const fulfillments: Fulfillment[] = [];
      const issues = auditor.detectUnfulfilledAllocations(inventory, fulfillments);
      expect(issues).toHaveLength(0);
    });

    it('considers DELIVERED as shipped', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 5 })];
      const fulfillments = [makeFulfillment({ status: 'DELIVERED', items: [{ productId: 'p-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const issues = auditor.detectUnfulfilledAllocations(inventory, fulfillments);
      expect(issues).toHaveLength(0);
    });

    it('handles multiple unfulfilled allocations', () => {
      const inventory = [
        makeInventory({ productId: 'p-1', allocatedStock: 3 }),
        makeInventory({ productId: 'p-2', allocatedStock: 5 }),
      ];
      const fulfillments: Fulfillment[] = [];
      const issues = auditor.detectUnfulfilledAllocations(inventory, fulfillments);
      expect(issues).toHaveLength(2);
    });
  });

  describe('detectFulfillmentWithoutAllocation()', () => {
    it('returns no issues when shipped items have allocation', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 5 })];
      const fulfillments = [makeFulfillment({ status: 'SHIPPED', items: [{ productId: 'p-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const issues = auditor.detectFulfillmentWithoutAllocation(fulfillments, inventory);
      expect(issues).toHaveLength(0);
    });

    it('detects shipped without allocation', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 0 })];
      const fulfillments = [makeFulfillment({ status: 'SHIPPED', items: [{ productId: 'p-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const issues = auditor.detectFulfillmentWithoutAllocation(fulfillments, inventory);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('FULFILLMENT_NO_ALLOCATION');
    });

    it('ignores pending fulfillments', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 0 })];
      const fulfillments = [makeFulfillment({ status: 'PENDING', items: [{ productId: 'p-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const issues = auditor.detectFulfillmentWithoutAllocation(fulfillments, inventory);
      expect(issues).toHaveLength(0);
    });

    it('ignores cancelled fulfillments', () => {
      const inventory = [makeInventory({ productId: 'p-1', allocatedStock: 0 })];
      const fulfillments = [makeFulfillment({ status: 'CANCELLED', items: [{ productId: 'p-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const issues = auditor.detectFulfillmentWithoutAllocation(fulfillments, inventory);
      expect(issues).toHaveLength(0);
    });

    it('detects missing inventory record', () => {
      const inventory: InventoryItem[] = [];
      const fulfillments = [makeFulfillment({ status: 'SHIPPED', items: [{ productId: 'p-99', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] })];
      const issues = auditor.detectFulfillmentWithoutAllocation(fulfillments, inventory);
      expect(issues).toHaveLength(1);
    });
  });

  describe('validateQuantityConsistency()', () => {
    it('returns consistent when quantities match', () => {
      const inventory = makeInventory({ allocatedStock: 5, currentStock: 10 });
      const fulfillment = makeFulfillment({ items: [{ productId: 'prod-1', quantity: 3, allocatedAt: '2025-01-01T00:00:00Z' }] });
      const result = auditor.validateQuantityConsistency(inventory, fulfillment);
      expect(result.consistent).toBe(true);
    });

    it('detects quantity exceeds allocation', () => {
      const inventory = makeInventory({ allocatedStock: 2 });
      const fulfillment = makeFulfillment({ items: [{ productId: 'prod-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] });
      const result = auditor.validateQuantityConsistency(inventory, fulfillment);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'QUANTITY_MISMATCH')).toBe(true);
    });

    it('detects quantity exceeds available stock', () => {
      const inventory = makeInventory({ allocatedStock: 10, currentStock: 1, reservedStock: 0 });
      const fulfillment = makeFulfillment({ items: [{ productId: 'prod-1', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] });
      const result = auditor.validateQuantityConsistency(inventory, fulfillment);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'QUANTITY_EXCEEDS_STOCK')).toBe(true);
    });

    it('ignores different product IDs', () => {
      const inventory = makeInventory({ productId: 'p-1', allocatedStock: 1 });
      const fulfillment = makeFulfillment({ items: [{ productId: 'p-2', quantity: 5, allocatedAt: '2025-01-01T00:00:00Z' }] });
      const result = auditor.validateQuantityConsistency(inventory, fulfillment);
      expect(result.consistent).toBe(true);
    });

    it('handles multiple items in fulfillment', () => {
      const inventory = makeInventory({ allocatedStock: 1 });
      const fulfillment = makeFulfillment({
        items: [
          { productId: 'prod-1', quantity: 1, allocatedAt: '2025-01-01T00:00:00Z' },
          { productId: 'prod-1', quantity: 10, allocatedAt: '2025-01-01T00:00:00Z' },
        ],
      });
      const result = auditor.validateQuantityConsistency(inventory, fulfillment);
      expect(result.consistent).toBe(false);
    });
  });

  describe('generateAuditReport()', () => {
    it('returns empty report for empty inputs', () => {
      const report = auditor.generateAuditReport([], []);
      expect(report.totalInventoryItems).toBe(0);
      expect(report.totalFulfillments).toBe(0);
      expect(report.healthScore).toBe(100);
    });

    it('reports unfulfilled allocations count', () => {
      const inventory = [makeInventory({ allocatedStock: 5 })];
      const fulfillments: Fulfillment[] = [];
      const report = auditor.generateAuditReport(inventory, fulfillments);
      expect(report.unfulfilledAllocations).toBe(1);
    });

    it('reports fulfillments without allocation count', () => {
      const inventory = [makeInventory({ allocatedStock: 0 })];
      const fulfillments = [makeFulfillment({ status: 'SHIPPED' })];
      const report = auditor.generateAuditReport(inventory, fulfillments);
      expect(report.fulfillmentWithoutAllocation).toBe(1);
    });

    it('includes issues in report', () => {
      const inventory = [makeInventory({ allocatedStock: 0 })];
      const fulfillments = [makeFulfillment({ status: 'SHIPPED' })];
      const report = auditor.generateAuditReport(inventory, fulfillments);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('generates a timestamp', () => {
      const report = auditor.generateAuditReport([], []);
      expect(report.timestamp).toBeTruthy();
      expect(new Date(report.timestamp).getTime()).not.toBeNaN();
    });

    it('health score is clamped to 0', () => {
      const inventory = Array.from({ length: 50 }, (_, i) => makeInventory({ productId: `p-${i}`, allocatedStock: 100 }));
      const fulfillments: Fulfillment[] = [];
      const report = auditor.generateAuditReport(inventory, fulfillments);
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
    });
  });
});
