/**
 * CommerceMerchantCustomerSyncAudit — G1-198
 *
 * Validates merchant ↔ customer order synchronization:
 *   - Orders match between merchant and customer views
 *   - Status mapping correctness
 *   - Timestamp consistency
 */

export interface MerchantOrder {
  readonly orderId: string;
  readonly merchantId: string;
  readonly customerId: string;
  readonly tenantId: string;
  readonly items: ReadonlyArray<{ readonly productId: string; readonly quantity: number; readonly price: number }>;
  readonly totalAmount: number;
  readonly status: 'CREATED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly currency: string;
}

export interface CustomerOrder {
  readonly orderId: string;
  readonly customerId: string;
  readonly tenantId: string;
  readonly items: ReadonlyArray<{ readonly productId: string; readonly quantity: number; readonly price: number }>;
  readonly totalAmount: number;
  readonly status: 'PLACED' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly currency: string;
  readonly visibleToCustomer: boolean;
}

export interface SyncIssue {
  readonly issueType: 'DESYNCHRONIZED' | 'MISSING_CUSTOMER_ORDER' | 'STATUS_MISMATCH' | 'TIMESTAMP_DRIFT';
  readonly orderId: string;
  readonly message: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SyncReport {
  readonly timestamp: string;
  readonly totalMerchantOrders: number;
  readonly totalCustomerOrders: number;
  readonly issues: ReadonlyArray<SyncIssue>;
  readonly syncedCount: number;
  readonly desynchronizedCount: number;
  readonly missingCustomerOrderCount: number;
  readonly statusMismatchCount: number;
  readonly timestampDriftCount: number;
  readonly syncScore: number;
}

const STATUS_MAP: Record<string, string> = {
  CREATED: 'PLACED',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  REFUNDED: 'REFUNDED',
};

const TIMESTAMP_TOLERANCE_MS = 60_000; // 1 minute

export class MerchantCustomerOrderSyncAuditor {
  auditMerchantToCustomerSync(
    merchantOrders: ReadonlyArray<MerchantOrder>,
    customerOrders: ReadonlyArray<CustomerOrder>,
  ): SyncReport {
    const missing = this.detectMissingCustomerOrders(merchantOrders, customerOrders);
    const desync = this.detectDesynchronizedOrders(merchantOrders, customerOrders);
    const allIssues = [...missing, ...desync];

    const customerOrderMap = new Map(customerOrders.map(o => [o.orderId, o]));
    let statusMismatchCount = 0;
    let timestampDriftCount = 0;
    let syncedCount = 0;

    for (const mo of merchantOrders) {
      const co = customerOrderMap.get(mo.orderId);
      if (!co) continue;

      const statusIssue = this.validateStatusSynchronization(mo, co);
      if (statusIssue) statusMismatchCount++;

      const timeIssue = this.validateTimestampConsistency(mo, co);
      if (timeIssue) timestampDriftCount++;

      if (!statusIssue && !timeIssue) syncedCount++;
    }

    const total = merchantOrders.length;
    const penalty = (missing.length * 15) + (desync.length * 10) + (statusMismatchCount * 5) + (timestampDriftCount * 2);
    const syncScore = total === 0 ? 100 : Math.max(0, Math.min(100, 100 - penalty));

    return {
      timestamp: new Date().toISOString(),
      totalMerchantOrders: merchantOrders.length,
      totalCustomerOrders: customerOrders.length,
      issues: allIssues,
      syncedCount,
      desynchronizedCount: desync.length,
      missingCustomerOrderCount: missing.length,
      statusMismatchCount,
      timestampDriftCount,
      syncScore,
    };
  }

  detectDesynchronizedOrders(
    merchantOrders: ReadonlyArray<MerchantOrder>,
    customerOrders: ReadonlyArray<CustomerOrder>,
  ): SyncIssue[] {
    const customerOrderMap = new Map(customerOrders.map(o => [o.orderId, o]));
    const issues: SyncIssue[] = [];

    for (const mo of merchantOrders) {
      const co = customerOrderMap.get(mo.orderId);
      if (!co) continue;

      if (mo.totalAmount !== co.totalAmount) {
        issues.push({
          issueType: 'DESYNCHRONIZED',
          orderId: mo.orderId,
          message: `Order ${mo.orderId} amount differs: merchant=${mo.totalAmount}, customer=${co.totalAmount}`,
          severity: 'HIGH',
        });
        continue;
      }

      const statusIssue = this.validateStatusSynchronization(mo, co);
      if (statusIssue) {
        issues.push(statusIssue);
      }

      const timeIssue = this.validateTimestampConsistency(mo, co);
      if (timeIssue) {
        issues.push(timeIssue);
      }
    }

    return issues;
  }

  detectMissingCustomerOrders(
    merchantOrders: ReadonlyArray<MerchantOrder>,
    customerOrders: ReadonlyArray<CustomerOrder>,
  ): SyncIssue[] {
    const customerOrderIds = new Set(customerOrders.map(o => o.orderId));
    const issues: SyncIssue[] = [];

    for (const mo of merchantOrders) {
      if (!customerOrderIds.has(mo.orderId)) {
        issues.push({
          issueType: 'MISSING_CUSTOMER_ORDER',
          orderId: mo.orderId,
          message: `Merchant order ${mo.orderId} is not visible to customer`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  validateStatusSynchronization(
    merchantOrder: MerchantOrder,
    customerOrder: CustomerOrder,
  ): SyncIssue | null {
    const expectedCustomerStatus = STATUS_MAP[merchantOrder.status];
    if (expectedCustomerStatus && expectedCustomerStatus !== customerOrder.status) {
      return {
        issueType: 'STATUS_MISMATCH',
        orderId: merchantOrder.orderId,
        message: `Status mismatch: merchant=${merchantOrder.status}, customer=${customerOrder.status} (expected ${expectedCustomerStatus})`,
        severity: 'MEDIUM',
      };
    }
    return null;
  }

  validateTimestampConsistency(
    merchantOrder: MerchantOrder,
    customerOrder: CustomerOrder,
  ): SyncIssue | null {
    const merchantTime = new Date(merchantOrder.updatedAt).getTime();
    const customerTime = new Date(customerOrder.updatedAt).getTime();
    const drift = Math.abs(merchantTime - customerTime);

    if (drift > TIMESTAMP_TOLERANCE_MS) {
      return {
        issueType: 'TIMESTAMP_DRIFT',
        orderId: merchantOrder.orderId,
        message: `Timestamp drift: ${drift}ms (tolerance: ${TIMESTAMP_TOLERANCE_MS}ms)`,
        severity: 'LOW',
      };
    }
    return null;
  }

  generateSyncReport(
    merchantOrders: ReadonlyArray<MerchantOrder>,
    customerOrders: ReadonlyArray<CustomerOrder>,
  ): SyncReport {
    return this.auditMerchantToCustomerSync(merchantOrders, customerOrders);
  }
}
