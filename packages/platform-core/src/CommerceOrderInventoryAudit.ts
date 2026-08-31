/**
 * CommerceOrderInventoryAudit — G1-193
 *
 * Audits consistency between Order and Inventory records.
 * Validates stock was decremented, detects oversold items, phantom inventory,
 * and reservation consistency.
 */

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export interface Order {
  readonly orderId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly totalAmount: number;
  readonly currency: string;
  readonly status: OrderStatus;
  readonly createdAt: string;
  readonly lineItems: ReadonlyArray<OrderLineItem>;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';

export interface OrderLineItem {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

export interface InventoryItem {
  readonly productId: string;
  readonly tenantId: string;
  readonly sku: string;
  readonly currentStock: number;
  readonly reservedStock: number;
  readonly totalSold: number;
  readonly lastUpdatedAt: string;
}

// ---------------------------------------------------------------------------
// Audit Result Types
// ---------------------------------------------------------------------------

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConsistencyIssue {
  readonly issueId: string;
  readonly issueType: string;
  readonly orderId?: string;
  readonly productId?: string;
  readonly message: string;
  readonly severity: AuditSeverity;
}

export interface OrderInventoryAuditReport {
  readonly timestamp: string;
  readonly totalOrders: number;
  readonly totalInventoryItems: number;
  readonly oversoldItems: number;
  readonly phantomItems: number;
  readonly issues: ReadonlyArray<ConsistencyIssue>;
  readonly healthScore: number;
}

// ---------------------------------------------------------------------------
// Order Inventory Consistency Auditor
// ---------------------------------------------------------------------------

export class OrderInventoryConsistencyAuditor {
  /**
   * Validates that inventory was properly decremented when orders were placed.
   */
  auditOrderToInventoryFlow(
    orders: ReadonlyArray<Order>,
    inventory: ReadonlyArray<InventoryItem>,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];
    const inventoryMap = new Map<string, InventoryItem>();
    for (const item of inventory) {
      inventoryMap.set(item.productId, item);
    }

    const soldByProduct = new Map<string, number>();
    for (const order of orders) {
      if (order.status === 'CANCELLED') continue;
      for (const lineItem of order.lineItems) {
        const current = soldByProduct.get(lineItem.productId) ?? 0;
        soldByProduct.set(lineItem.productId, current + lineItem.quantity);
      }
    }

    for (const [productId, expectedSold] of soldByProduct) {
      const item = inventoryMap.get(productId);
      if (!item) {
        issues.push({
          issueId: `NO-INVENTORY-${productId}`,
          issueType: 'MISSING_INVENTORY',
          productId,
          message: `Product ${productId} sold in orders but has no inventory record`,
          severity: 'HIGH',
        });
        continue;
      }

      if (item.totalSold < expectedSold) {
        issues.push({
          issueId: `UNDERSOLD-${productId}`,
          issueType: 'STOCK_NOT_DECREMENTED',
          productId,
          message: `Product ${productId} expected sold ${expectedSold}, inventory shows ${item.totalSold}`,
          severity: 'HIGH',
        });
      }
    }

    return { consistent: issues.length === 0, issues };
  }

  /**
   * Detects items where current stock is negative.
   */
  detectOversoldItems(
    orders: ReadonlyArray<Order>,
    inventory: ReadonlyArray<InventoryItem>,
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    for (const item of inventory) {
      if (item.currentStock < 0) {
        issues.push({
          issueId: `OVERSOLD-${item.productId}`,
          issueType: 'OVERSOLD_ITEM',
          productId: item.productId,
          message: `Product ${item.productId} has negative stock: ${item.currentStock}`,
          severity: 'HIGH',
        });
      }
    }

    const inventoryMap = new Map<string, InventoryItem>();
    for (const item of inventory) {
      inventoryMap.set(item.productId, item);
    }

    const soldByProduct = new Map<string, number>();
    for (const order of orders) {
      if (order.status === 'CANCELLED') continue;
      for (const lineItem of order.lineItems) {
        const current = soldByProduct.get(lineItem.productId) ?? 0;
        soldByProduct.set(lineItem.productId, current + lineItem.quantity);
      }
    }

    for (const [productId, totalOrdered] of soldByProduct) {
      const item = inventoryMap.get(productId);
      if (item && item.currentStock < 0) {
        continue; // Already flagged above
      }
      if (item && totalOrdered > (item.currentStock + item.reservedStock + item.totalSold)) {
        issues.push({
          issueId: `OVERSOLD-CALC-${productId}`,
          issueType: 'OVERSOLD_ITEM',
          productId,
          message: `Product ${productId}: ordered ${totalOrdered} exceeds available stock`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  /**
   * Detects inventory items that show stock but were never referenced by orders.
   */
  detectPhantomInventory(
    orders: ReadonlyArray<Order>,
    inventory: ReadonlyArray<InventoryItem>,
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    const orderedProductIds = new Set<string>();
    for (const order of orders) {
      for (const lineItem of order.lineItems) {
        orderedProductIds.add(lineItem.productId);
      }
    }

    for (const item of inventory) {
      if (item.currentStock > 0 && !orderedProductIds.has(item.productId) && item.totalSold === 0) {
        issues.push({
          issueId: `PHANTOM-${item.productId}`,
          issueType: 'PHANTOM_INVENTORY',
          productId: item.productId,
          message: `Product ${item.productId} has stock ${item.currentStock} but no order history`,
          severity: 'MEDIUM',
        });
      }
    }

    return issues;
  }

  /**
   * Validates that reserved stock matches pending/processing orders for a product.
   */
  validateReservationConsistency(
    order: Order,
    inventory: ReadonlyArray<InventoryItem>,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];
    const inventoryMap = new Map<string, InventoryItem>();
    for (const item of inventory) {
      inventoryMap.set(item.productId, item);
    }

    for (const lineItem of order.lineItems) {
      const item = inventoryMap.get(lineItem.productId);
      if (!item) {
        issues.push({
          issueId: `RES-NO-INV-${order.orderId}-${lineItem.productId}`,
          issueType: 'MISSING_INVENTORY',
          orderId: order.orderId,
          productId: lineItem.productId,
          message: `Order ${order.orderId} references product ${lineItem.productId} with no inventory`,
          severity: 'HIGH',
        });
        continue;
      }

      if (order.status === 'PENDING' || order.status === 'CONFIRMED') {
        if (item.reservedStock < lineItem.quantity) {
          issues.push({
            issueId: `RES-MISMATCH-${order.orderId}-${lineItem.productId}`,
            issueType: 'RESERVATION_MISMATCH',
            orderId: order.orderId,
            productId: lineItem.productId,
            message: `Product ${lineItem.productId}: reserved ${item.reservedStock} < ordered ${lineItem.quantity}`,
            severity: 'MEDIUM',
          });
        }
      }
    }

    return { consistent: issues.length === 0, issues };
  }

  /**
   * Generates a full audit report.
   */
  generateAuditReport(
    orders: ReadonlyArray<Order>,
    inventory: ReadonlyArray<InventoryItem>,
  ): OrderInventoryAuditReport {
    const issues: ConsistencyIssue[] = [];

    const flowResult = this.auditOrderToInventoryFlow(orders, inventory);
    issues.push(...flowResult.issues);

    const oversoldIssues = this.detectOversoldItems(orders, inventory);
    issues.push(...oversoldIssues);

    const phantomIssues = this.detectPhantomInventory(orders, inventory);
    issues.push(...phantomIssues);

    const healthScore = this.calculateHealthScore(inventory.length, issues);

    return {
      timestamp: new Date().toISOString(),
      totalOrders: orders.length,
      totalInventoryItems: inventory.length,
      oversoldItems: oversoldIssues.length,
      phantomItems: phantomIssues.length,
      issues,
      healthScore,
    };
  }

  private calculateHealthScore(totalItems: number, issues: ReadonlyArray<ConsistencyIssue>): number {
    if (totalItems === 0) return 100;

    let score = 100;
    score -= issues.filter(i => i.severity === 'HIGH').length * 5;
    score -= issues.filter(i => i.severity === 'MEDIUM').length * 2;
    score -= issues.filter(i => i.severity === 'LOW').length * 1;

    return Math.max(0, Math.min(100, score));
  }
}
