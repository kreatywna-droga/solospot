/**
 * CommerceOrderInventoryAuditG1193.test.ts — G1-193 Order → Inventory Consistency Audit
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  OrderInventoryConsistencyAuditor,
  Order,
  InventoryItem,
  OrderLineItem,
} from '../CommerceOrderInventoryAudit';

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
      { productId: 'prod-1', quantity: 2, unitPrice: 50, totalPrice: 100 },
    ],
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

describe('OrderInventoryConsistencyAuditor', () => {
  let auditor: OrderInventoryConsistencyAuditor;

  beforeEach(() => {
    auditor = new OrderInventoryConsistencyAuditor();
  });

  describe('auditOrderToInventoryFlow()', () => {
    it('returns consistent when inventory matches orders', () => {
      const orders = [makeOrder({ lineItems: [{ productId: 'p-1', quantity: 2, unitPrice: 50, totalPrice: 100 }] })];
      const inventory = [makeInventory({ productId: 'p-1', totalSold: 2 })];
      const result = auditor.auditOrderToInventoryFlow(orders, inventory);
      expect(result.consistent).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('detects missing inventory for ordered product', () => {
      const orders = [makeOrder({ lineItems: [{ productId: 'p-99', quantity: 1, unitPrice: 10, totalPrice: 10 }] })];
      const inventory: InventoryItem[] = [];
      const result = auditor.auditOrderToInventoryFlow(orders, inventory);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'MISSING_INVENTORY')).toBe(true);
    });

    it('detects stock not decremented', () => {
      const orders = [makeOrder({ lineItems: [{ productId: 'p-1', quantity: 5, unitPrice: 10, totalPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', totalSold: 0 })];
      const result = auditor.auditOrderToInventoryFlow(orders, inventory);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'STOCK_NOT_DECREMENTED')).toBe(true);
    });

    it('ignores cancelled orders', () => {
      const orders = [makeOrder({ status: 'CANCELLED', lineItems: [{ productId: 'p-1', quantity: 5, unitPrice: 10, totalPrice: 50 }] })];
      const inventory = [makeInventory({ productId: 'p-1', totalSold: 0 })];
      const result = auditor.auditOrderToInventoryFlow(orders, inventory);
      expect(result.consistent).toBe(true);
    });

    it('handles multiple products', () => {
      const orders = [makeOrder({
        lineItems: [
          { productId: 'p-1', quantity: 2, unitPrice: 50, totalPrice: 100 },
          { productId: 'p-2', quantity: 3, unitPrice: 20, totalPrice: 60 },
        ],
      })];
      const inventory = [
        makeInventory({ productId: 'p-1', totalSold: 2 }),
        makeInventory({ productId: 'p-2', totalSold: 3 }),
      ];
      const result = auditor.auditOrderToInventoryFlow(orders, inventory);
      expect(result.consistent).toBe(true);
    });
  });

  describe('detectOversoldItems()', () => {
    it('returns no issues when stock is non-negative', () => {
      const orders = [makeOrder()];
      const inventory = [makeInventory({ currentStock: 10 })];
      const issues = auditor.detectOversoldItems(orders, inventory);
      expect(issues).toHaveLength(0);
    });

    it('detects negative stock', () => {
      const orders: Order[] = [];
      const inventory = [makeInventory({ currentStock: -5 })];
      const issues = auditor.detectOversoldItems(orders, inventory);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('OVERSOLD_ITEM');
    });

    it('detects ordered quantity exceeding available stock', () => {
      const orders = [makeOrder({ lineItems: [{ productId: 'p-1', quantity: 100, unitPrice: 1, totalPrice: 100 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 5, reservedStock: 0, totalSold: 0 })];
      const issues = auditor.detectOversoldItems(orders, inventory);
      expect(issues.some(i => i.issueType === 'OVERSOLD_ITEM')).toBe(true);
    });

    it('handles multiple oversold items', () => {
      const orders: Order[] = [];
      const inventory = [
        makeInventory({ productId: 'p-1', currentStock: -1 }),
        makeInventory({ productId: 'p-2', currentStock: -3 }),
      ];
      const issues = auditor.detectOversoldItems(orders, inventory);
      expect(issues).toHaveLength(2);
    });

    it('ignores cancelled orders in calculation', () => {
      const orders = [makeOrder({ status: 'CANCELLED', lineItems: [{ productId: 'p-1', quantity: 100, unitPrice: 1, totalPrice: 100 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 5, reservedStock: 0, totalSold: 0 })];
      const issues = auditor.detectOversoldItems(orders, inventory);
      expect(issues).toHaveLength(0);
    });
  });

  describe('detectPhantomInventory()', () => {
    it('returns no issues for inventory referenced by orders', () => {
      const orders = [makeOrder({ lineItems: [{ productId: 'p-1', quantity: 1, unitPrice: 10, totalPrice: 10 }] })];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 10, totalSold: 5 })];
      const issues = auditor.detectPhantomInventory(orders, inventory);
      expect(issues).toHaveLength(0);
    });

    it('detects inventory with stock but no order history', () => {
      const orders: Order[] = [];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 10, totalSold: 0 })];
      const issues = auditor.detectPhantomInventory(orders, inventory);
      expect(issues).toHaveLength(1);
      expect(issues[0].issueType).toBe('PHANTOM_INVENTORY');
    });

    it('ignores inventory with zero stock', () => {
      const orders: Order[] = [];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 0, totalSold: 0 })];
      const issues = auditor.detectPhantomInventory(orders, inventory);
      expect(issues).toHaveLength(0);
    });

    it('ignores inventory that was sold', () => {
      const orders: Order[] = [];
      const inventory = [makeInventory({ productId: 'p-1', currentStock: 5, totalSold: 10 })];
      const issues = auditor.detectPhantomInventory(orders, inventory);
      expect(issues).toHaveLength(0);
    });

    it('handles multiple phantom items', () => {
      const orders: Order[] = [];
      const inventory = [
        makeInventory({ productId: 'p-1', currentStock: 10, totalSold: 0 }),
        makeInventory({ productId: 'p-2', currentStock: 20, totalSold: 0 }),
      ];
      const issues = auditor.detectPhantomInventory(orders, inventory);
      expect(issues).toHaveLength(2);
    });
  });

  describe('validateReservationConsistency()', () => {
    it('returns consistent when reservation matches order', () => {
      const order = makeOrder({ status: 'PENDING', lineItems: [{ productId: 'p-1', quantity: 2, unitPrice: 50, totalPrice: 100 }] });
      const inventory = [makeInventory({ productId: 'p-1', reservedStock: 5 })];
      const result = auditor.validateReservationConsistency(order, inventory);
      expect(result.consistent).toBe(true);
    });

    it('detects reservation mismatch', () => {
      const order = makeOrder({ status: 'PENDING', lineItems: [{ productId: 'p-1', quantity: 10, unitPrice: 10, totalPrice: 100 }] });
      const inventory = [makeInventory({ productId: 'p-1', reservedStock: 2 })];
      const result = auditor.validateReservationConsistency(order, inventory);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'RESERVATION_MISMATCH')).toBe(true);
    });

    it('detects missing inventory for reservation', () => {
      const order = makeOrder({ lineItems: [{ productId: 'p-99', quantity: 1, unitPrice: 10, totalPrice: 10 }] });
      const inventory: InventoryItem[] = [];
      const result = auditor.validateReservationConsistency(order, inventory);
      expect(result.consistent).toBe(false);
      expect(result.issues.some(i => i.issueType === 'MISSING_INVENTORY')).toBe(true);
    });

    it('checks CONFIRMED orders', () => {
      const order = makeOrder({ status: 'CONFIRMED', lineItems: [{ productId: 'p-1', quantity: 5, unitPrice: 10, totalPrice: 50 }] });
      const inventory = [makeInventory({ productId: 'p-1', reservedStock: 1 })];
      const result = auditor.validateReservationConsistency(order, inventory);
      expect(result.consistent).toBe(false);
    });

    it('does not check reservations for non-pending orders', () => {
      const order = makeOrder({ status: 'SHIPPED', lineItems: [{ productId: 'p-1', quantity: 5, unitPrice: 10, totalPrice: 50 }] });
      const inventory = [makeInventory({ productId: 'p-1', reservedStock: 0 })];
      const result = auditor.validateReservationConsistency(order, inventory);
      expect(result.consistent).toBe(true);
    });
  });

  describe('generateAuditReport()', () => {
    it('returns empty report for empty inputs', () => {
      const report = auditor.generateAuditReport([], []);
      expect(report.totalOrders).toBe(0);
      expect(report.totalInventoryItems).toBe(0);
      expect(report.healthScore).toBe(100);
    });

    it('reports oversold items count', () => {
      const orders: Order[] = [];
      const inventory = [makeInventory({ currentStock: -1 })];
      const report = auditor.generateAuditReport(orders, inventory);
      expect(report.oversoldItems).toBe(1);
    });

    it('reports phantom items count', () => {
      const orders: Order[] = [];
      const inventory = [makeInventory({ currentStock: 10, totalSold: 0 })];
      const report = auditor.generateAuditReport(orders, inventory);
      expect(report.phantomItems).toBe(1);
    });

    it('includes issues in report', () => {
      const orders = [makeOrder()];
      const inventory = [makeInventory({ currentStock: -1 })];
      const report = auditor.generateAuditReport(orders, inventory);
      expect(report.issues.length).toBeGreaterThan(0);
    });

    it('generates a timestamp', () => {
      const report = auditor.generateAuditReport([], []);
      expect(report.timestamp).toBeTruthy();
      expect(new Date(report.timestamp).getTime()).not.toBeNaN();
    });

    it('health score is clamped to 0', () => {
      const orders = Array.from({ length: 50 }, (_, i) => makeOrder({ orderId: `o-${i}` }));
      const inventory = Array.from({ length: 50 }, (_, i) => makeInventory({ productId: `p-${i}`, currentStock: -100 }));
      const report = auditor.generateAuditReport(orders, inventory);
      expect(report.healthScore).toBeGreaterThanOrEqual(0);
    });
  });
});
