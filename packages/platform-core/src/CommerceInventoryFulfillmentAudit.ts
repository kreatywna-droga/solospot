/**
 * CommerceInventoryFulfillmentAudit — G1-194
 *
 * Audits consistency between Inventory and Fulfillment records.
 * Validates stock allocated for fulfillment, detects unfulfilled allocations,
 * fulfillments without allocation, and quantity mismatches.
 */

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export interface InventoryItem {
  readonly productId: string;
  readonly tenantId: string;
  readonly sku: string;
  readonly currentStock: number;
  readonly reservedStock: number;
  readonly allocatedStock: number;
  readonly totalSold: number;
  readonly lastUpdatedAt: string;
}

export interface Fulfillment {
  readonly fulfillmentId: string;
  readonly orderId: string;
  readonly tenantId: string;
  readonly status: FulfillmentStatus;
  readonly items: ReadonlyArray<FulfillmentItem>;
  readonly createdAt: string;
  readonly shippedAt?: string;
  readonly deliveredAt?: string;
}

export type FulfillmentStatus = 'PENDING' | 'ALLOCATED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface FulfillmentItem {
  readonly productId: string;
  readonly quantity: number;
  readonly allocatedAt: string;
}

// ---------------------------------------------------------------------------
// Audit Result Types
// ---------------------------------------------------------------------------

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConsistencyIssue {
  readonly issueId: string;
  readonly issueType: string;
  readonly fulfillmentId?: string;
  readonly productId?: string;
  readonly message: string;
  readonly severity: AuditSeverity;
}

export interface InventoryFulfillmentAuditReport {
  readonly timestamp: string;
  readonly totalInventoryItems: number;
  readonly totalFulfillments: number;
  readonly unfulfilledAllocations: number;
  readonly fulfillmentWithoutAllocation: number;
  readonly issues: ReadonlyArray<ConsistencyIssue>;
  readonly healthScore: number;
}

// ---------------------------------------------------------------------------
// Inventory Fulfillment Consistency Auditor
// ---------------------------------------------------------------------------

export class InventoryFulfillmentConsistencyAuditor {
  /**
   * Validates that inventory was properly allocated for fulfillments.
   */
  auditInventoryToFulfillment(
    inventory: ReadonlyArray<InventoryItem>,
    fulfillments: ReadonlyArray<Fulfillment>,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];
    const inventoryMap = new Map<string, InventoryItem>();
    for (const item of inventory) {
      inventoryMap.set(item.productId, item);
    }

    const allocatedByProduct = new Map<string, number>();
    for (const fulfillment of fulfillments) {
      if (fulfillment.status === 'CANCELLED') continue;
      for (const item of fulfillment.items) {
        const current = allocatedByProduct.get(item.productId) ?? 0;
        allocatedByProduct.set(item.productId, current + item.quantity);
      }
    }

    for (const [productId, expectedAllocated] of allocatedByProduct) {
      const item = inventoryMap.get(productId);
      if (!item) {
        issues.push({
          issueId: `NO-INV-${productId}`,
          issueType: 'MISSING_INVENTORY',
          productId,
          message: `Product ${productId} allocated in fulfillments but has no inventory record`,
          severity: 'HIGH',
        });
        continue;
      }

      if (item.allocatedStock < expectedAllocated) {
        issues.push({
          issueId: `UNDER-ALLOC-${productId}`,
          issueType: 'ALLOCATION_MISMATCH',
          productId,
          message: `Product ${productId}: expected allocated ${expectedAllocated}, inventory shows ${item.allocatedStock}`,
          severity: 'HIGH',
        });
      }
    }

    return { consistent: issues.length === 0, issues };
  }

  /**
   * Detects inventory items allocated but not yet shipped.
   */
  detectUnfulfilledAllocations(
    inventory: ReadonlyArray<InventoryItem>,
    fulfillments: ReadonlyArray<Fulfillment>,
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];

    const shippedProducts = new Set<string>();
    for (const fulfillment of fulfillments) {
      if (fulfillment.status === 'SHIPPED' || fulfillment.status === 'DELIVERED') {
        for (const item of fulfillment.items) {
          shippedProducts.add(item.productId);
        }
      }
    }

    for (const item of inventory) {
      if (item.allocatedStock > 0 && !shippedProducts.has(item.productId)) {
        issues.push({
          issueId: `UNFULFILLED-${item.productId}`,
          issueType: 'UNFULFILLED_ALLOCATION',
          productId: item.productId,
          message: `Product ${item.productId} has ${item.allocatedStock} allocated but no shipped fulfillments`,
          severity: 'MEDIUM',
        });
      }
    }

    return issues;
  }

  /**
   * Detects fulfillments that were shipped without a corresponding allocation.
   */
  detectFulfillmentWithoutAllocation(
    fulfillments: ReadonlyArray<Fulfillment>,
    inventory: ReadonlyArray<InventoryItem>,
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const inventoryMap = new Map<string, InventoryItem>();
    for (const item of inventory) {
      inventoryMap.set(item.productId, item);
    }

    for (const fulfillment of fulfillments) {
      if (fulfillment.status === 'CANCELLED') continue;
      if (fulfillment.status === 'SHIPPED' || fulfillment.status === 'DELIVERED') {
        for (const item of fulfillment.items) {
          const inv = inventoryMap.get(item.productId);
          if (!inv || inv.allocatedStock < item.quantity) {
            issues.push({
              issueId: `NO-ALLOC-${fulfillment.fulfillmentId}-${item.productId}`,
              issueType: 'FULFILLMENT_NO_ALLOCATION',
              fulfillmentId: fulfillment.fulfillmentId,
              productId: item.productId,
              message: `Fulfillment ${fulfillment.fulfillmentId}: product ${item.productId} shipped without sufficient allocation`,
              severity: 'HIGH',
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Validates quantity consistency between inventory allocation and fulfillment items.
   */
  validateQuantityConsistency(
    inventory: InventoryItem,
    fulfillment: Fulfillment,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];

    for (const item of fulfillment.items) {
      if (item.productId === inventory.productId) {
        if (item.quantity > inventory.allocatedStock) {
          issues.push({
            issueId: `QTY-${fulfillment.fulfillmentId}-${inventory.productId}`,
            issueType: 'QUANTITY_MISMATCH',
            fulfillmentId: fulfillment.fulfillmentId,
            productId: inventory.productId,
            message: `Fulfillment ${fulfillment.fulfillmentId}: product ${inventory.productId} requests ${item.quantity} but only ${inventory.allocatedStock} allocated`,
            severity: 'HIGH',
          });
        }

        if (item.quantity > inventory.currentStock + inventory.reservedStock) {
          issues.push({
            issueId: `QTY-EXCEED-${fulfillment.fulfillmentId}-${inventory.productId}`,
            issueType: 'QUANTITY_EXCEEDS_STOCK',
            fulfillmentId: fulfillment.fulfillmentId,
            productId: inventory.productId,
            message: `Fulfillment ${fulfillment.fulfillmentId}: product ${inventory.productId} requests ${item.quantity} but available is ${inventory.currentStock + inventory.reservedStock}`,
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
    inventory: ReadonlyArray<InventoryItem>,
    fulfillments: ReadonlyArray<Fulfillment>,
  ): InventoryFulfillmentAuditReport {
    const issues: ConsistencyIssue[] = [];

    const flowResult = this.auditInventoryToFulfillment(inventory, fulfillments);
    issues.push(...flowResult.issues);

    const unfulfilledIssues = this.detectUnfulfilledAllocations(inventory, fulfillments);
    issues.push(...unfulfilledIssues);

    const noAllocIssues = this.detectFulfillmentWithoutAllocation(fulfillments, inventory);
    issues.push(...noAllocIssues);

    const healthScore = this.calculateHealthScore(inventory.length + fulfillments.length, issues);

    return {
      timestamp: new Date().toISOString(),
      totalInventoryItems: inventory.length,
      totalFulfillments: fulfillments.length,
      unfulfilledAllocations: unfulfilledIssues.length,
      fulfillmentWithoutAllocation: noAllocIssues.length,
      issues,
      healthScore,
    };
  }

  private calculateHealthScore(totalEntities: number, issues: ReadonlyArray<ConsistencyIssue>): number {
    if (totalEntities === 0) return 100;

    let score = 100;
    score -= issues.filter(i => i.severity === 'HIGH').length * 5;
    score -= issues.filter(i => i.severity === 'MEDIUM').length * 2;
    score -= issues.filter(i => i.severity === 'LOW').length * 1;

    return Math.max(0, Math.min(100, score));
  }
}
