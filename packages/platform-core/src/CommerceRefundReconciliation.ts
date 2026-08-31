/**
 * CommerceRefundReconciliation — G1-195
 *
 * Audits consistency across Refund → Payment → Inventory chain.
 * Validates refunds reference valid payments, stock was restored,
 * detects orphaned refunds, missing inventory restores, and amount issues.
 */

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export interface Refund {
  readonly refundId: string;
  readonly paymentId: string;
  readonly orderId: string;
  readonly tenantId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: RefundStatus;
  readonly reason: string;
  readonly createdAt: string;
  readonly items: ReadonlyArray<RefundItem>;
}

export type RefundStatus = 'PENDING' | 'APPROVED' | 'PROCESSED' | 'DENIED' | 'CANCELLED';

export interface RefundItem {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface Payment {
  readonly paymentId: string;
  readonly orderId: string;
  readonly tenantId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly createdAt: string;
}

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

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
  readonly refundId?: string;
  readonly paymentId?: string;
  readonly productId?: string;
  readonly message: string;
  readonly severity: AuditSeverity;
}

export interface ReconciliationReport {
  readonly timestamp: string;
  readonly totalRefunds: number;
  readonly totalPayments: number;
  readonly totalInventoryItems: number;
  readonly orphanedRefunds: number;
  readonly missingRestores: number;
  readonly invalidAmounts: number;
  readonly issues: ReadonlyArray<ConsistencyIssue>;
  readonly healthScore: number;
}

// ---------------------------------------------------------------------------
// Refund Payment Inventory Reconciler
// ---------------------------------------------------------------------------

export class RefundPaymentInventoryReconciler {
  /**
   * Validates that refunds reference valid payments.
   */
  auditRefundToPayment(
    refunds: ReadonlyArray<Refund>,
    payments: ReadonlyArray<Payment>,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];
    const paymentMap = new Map<string, Payment>();
    for (const payment of payments) {
      paymentMap.set(payment.paymentId, payment);
    }

    for (const refund of refunds) {
      const payment = paymentMap.get(refund.paymentId);
      if (!payment) {
        issues.push({
          issueId: `NO-PAYMENT-${refund.refundId}`,
          issueType: 'ORPHANED_REFUND',
          refundId: refund.refundId,
          paymentId: refund.paymentId,
          message: `Refund ${refund.refundId} references non-existent payment ${refund.paymentId}`,
          severity: 'HIGH',
        });
        continue;
      }

      if (refund.currency !== payment.currency) {
        issues.push({
          issueId: `CURRENCY-${refund.refundId}`,
          issueType: 'CURRENCY_MISMATCH',
          refundId: refund.refundId,
          paymentId: refund.paymentId,
          message: `Refund ${refund.refundId} currency ${refund.currency} != payment currency ${payment.currency}`,
          severity: 'HIGH',
        });
      }

      if (!this.validateRefundAmount(refund, payment)) {
        issues.push({
          issueId: `AMOUNT-${refund.refundId}`,
          issueType: 'REFUND_EXCEEDS_PAYMENT',
          refundId: refund.refundId,
          paymentId: refund.paymentId,
          message: `Refund ${refund.refundId} amount ${refund.amount} exceeds payment amount ${payment.amount}`,
          severity: 'HIGH',
        });
      }
    }

    return { consistent: issues.length === 0, issues };
  }

  /**
   * Validates that stock was restored after refunds.
   */
  auditRefundToInventory(
    refunds: ReadonlyArray<Refund>,
    inventory: ReadonlyArray<InventoryItem>,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];
    const inventoryMap = new Map<string, InventoryItem>();
    for (const item of inventory) {
      inventoryMap.set(item.productId, item);
    }

    const processedRefunds = refunds.filter(
      r => r.status === 'PROCESSED' || r.status === 'APPROVED',
    );

    for (const refund of processedRefunds) {
      for (const item of refund.items) {
        const inv = inventoryMap.get(item.productId);
        if (!inv) {
          issues.push({
            issueId: `NO-INV-${refund.refundId}-${item.productId}`,
            issueType: 'MISSING_INVENTORY',
            refundId: refund.refundId,
            productId: item.productId,
            message: `Refund ${refund.refundId}: product ${item.productId} has no inventory record for restore`,
            severity: 'HIGH',
          });
          continue;
        }

        if (this.detectMissingInventoryRestore(refunds, inventory).some(
          i => i.refundId === refund.refundId && i.productId === item.productId,
        )) {
          issues.push({
            issueId: `NO-RESTORE-${refund.refundId}-${item.productId}`,
            issueType: 'MISSING_STOCK_RESTORE',
            refundId: refund.refundId,
            productId: item.productId,
            message: `Refund ${refund.refundId}: product ${item.productId} stock not restored`,
            severity: 'HIGH',
          });
        }
      }
    }

    return { consistent: issues.length === 0, issues };
  }

  /**
   * Finds refunds without a valid payment reference.
   */
  detectOrphanedRefunds(
    refunds: ReadonlyArray<Refund>,
    payments: ReadonlyArray<Payment>,
  ): ConsistencyIssue[] {
    const paymentIds = new Set(payments.map(p => p.paymentId));
    const issues: ConsistencyIssue[] = [];

    for (const refund of refunds) {
      if (!paymentIds.has(refund.paymentId)) {
        issues.push({
          issueId: `ORPHAN-${refund.refundId}`,
          issueType: 'ORPHANED_REFUND',
          refundId: refund.refundId,
          paymentId: refund.paymentId,
          message: `Refund ${refund.refundId} references non-existent payment ${refund.paymentId}`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  /**
   * Finds refunds that should have restored inventory but didn't.
   */
  detectMissingInventoryRestore(
    refunds: ReadonlyArray<Refund>,
    inventory: ReadonlyArray<InventoryItem>,
  ): ConsistencyIssue[] {
    const issues: ConsistencyIssue[] = [];
    const inventoryMap = new Map<string, InventoryItem>();
    for (const item of inventory) {
      inventoryMap.set(item.productId, item);
    }

    const processedRefunds = refunds.filter(
      r => r.status === 'PROCESSED' || r.status === 'APPROVED',
    );

    for (const refund of processedRefunds) {
      for (const item of refund.items) {
        const inv = inventoryMap.get(item.productId);
        if (inv && inv.currentStock <= 0) {
          issues.push({
            issueId: `MISSING-RESTORE-${refund.refundId}-${item.productId}`,
            issueType: 'MISSING_STOCK_RESTORE',
            refundId: refund.refundId,
            productId: item.productId,
            message: `Refund ${refund.refundId}: product ${item.productId} has zero/negative stock after refund`,
            severity: 'HIGH',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Validates refund amount does not exceed original payment.
   */
  validateRefundAmount(refund: Refund, payment: Payment): boolean {
    return refund.amount <= payment.amount;
  }

  /**
   * Generates a full reconciliation report.
   */
  generateReconciliationReport(
    refunds: ReadonlyArray<Refund>,
    payments: ReadonlyArray<Payment>,
    inventory: ReadonlyArray<InventoryItem>,
  ): ReconciliationReport {
    const issues: ConsistencyIssue[] = [];

    const paymentResult = this.auditRefundToPayment(refunds, payments);
    issues.push(...paymentResult.issues);

    const inventoryResult = this.auditRefundToInventory(refunds, inventory);
    issues.push(...inventoryResult.issues);

    const orphanedIssues = this.detectOrphanedRefunds(refunds, payments);
    issues.push(...orphanedIssues);

    const missingRestoreIssues = this.detectMissingInventoryRestore(refunds, inventory);
    issues.push(...missingRestoreIssues);

    const paymentMap = new Map<string, Payment>();
    for (const p of payments) {
      paymentMap.set(p.paymentId, p);
    }

    let invalidAmounts = 0;
    for (const refund of refunds) {
      const payment = paymentMap.get(refund.paymentId);
      if (payment && !this.validateRefundAmount(refund, payment)) {
        invalidAmounts++;
      }
    }

    const healthScore = this.calculateHealthScore(
      refunds.length + payments.length + inventory.length,
      issues,
    );

    return {
      timestamp: new Date().toISOString(),
      totalRefunds: refunds.length,
      totalPayments: payments.length,
      totalInventoryItems: inventory.length,
      orphanedRefunds: orphanedIssues.length,
      missingRestores: missingRestoreIssues.length,
      invalidAmounts,
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
