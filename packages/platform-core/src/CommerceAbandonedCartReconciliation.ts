/**
 * CommerceAbandonedCartReconciliation — G1-196
 *
 * Validates recovery flow integrity for abandoned carts:
 *   - Detects unrecovered carts
 *   - Detects unsent notifications for recoveries
 *   - Detects duplicate recoveries for the same cart
 *   - Validates recovery timing windows
 */

export interface AbandonedCart {
  readonly cartId: string;
  readonly userId: string;
  readonly tenantId: string;
  readonly items: ReadonlyArray<{ readonly productId: string; readonly quantity: number; readonly price: number }>;
  readonly totalAmount: number;
  readonly abandonedAt: string;
  readonly currency: string;
}

export interface CartRecovery {
  readonly recoveryId: string;
  readonly cartId: string;
  readonly tenantId: string;
  readonly recoveredAt: string;
  readonly recoveryType: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  readonly discountOffered: number;
  readonly status: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
}

export interface RecoveryNotification {
  readonly notificationId: string;
  readonly recoveryId: string;
  readonly channel: 'EMAIL' | 'SMS' | 'PUSH' | 'IN_APP';
  readonly sentAt: string;
  readonly deliveredAt: string | null;
  readonly status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED' | 'BOUNCED';
}

export interface ReconciliationIssue {
  readonly issueType: 'UNRECOVERED_CART' | 'UNSENT_NOTIFICATION' | 'DUPLICATE_RECOVERY' | 'TIMING_VIOLATION';
  readonly cartId: string;
  readonly recoveryId: string | null;
  readonly message: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ReconciliationReport {
  readonly timestamp: string;
  readonly totalAbandonedCarts: number;
  readonly totalRecoveries: number;
  readonly totalNotifications: number;
  readonly issues: ReadonlyArray<ReconciliationIssue>;
  readonly recoveredCount: number;
  readonly unrecoveredCount: number;
  readonly unsentNotificationCount: number;
  readonly duplicateRecoveryCount: number;
  readonly timingViolationCount: number;
  readonly integrityScore: number;
}

const RECOVERY_WINDOW_MS = 72 * 60 * 60 * 1000; // 72 hours

export class AbandonedCartRecoveryReconciler {
  auditAbandonedCartRecovery(
    abandonedCarts: ReadonlyArray<AbandonedCart>,
    recoveries: ReadonlyArray<CartRecovery>,
    notifications: ReadonlyArray<RecoveryNotification>,
  ): ReconciliationReport {
    const unrecovered = this.detectUnrecoveredCarts(abandonedCarts, recoveries);
    const unsent = this.detectUnsentNotifications(recoveries, notifications);
    const duplicates = this.detectDuplicateRecoveries(abandonedCarts, recoveries);
    const timingIssues: ReconciliationIssue[] = [];

    for (const cart of abandonedCarts) {
      const cartRecoveries = recoveries.filter(r => r.cartId === cart.cartId);
      for (const rec of cartRecoveries) {
        const timing = this.validateRecoveryTiming(cart, rec);
        if (timing) timingIssues.push(timing);
      }
    }

    const allIssues = [...unrecovered, ...unsent, ...duplicates, ...timingIssues];
    const uniqueCartIds = new Set(abandonedCarts.map(c => c.cartId));
    const recoveredCartIds = new Set(recoveries.filter(r => r.status !== 'FAILED').map(r => r.cartId));

    return {
      timestamp: new Date().toISOString(),
      totalAbandonedCarts: abandonedCarts.length,
      totalRecoveries: recoveries.length,
      totalNotifications: notifications.length,
      issues: allIssues,
      recoveredCount: recoveredCartIds.size,
      unrecoveredCount: unrecovered.length,
      unsentNotificationCount: unsent.length,
      duplicateRecoveryCount: duplicates.length,
      timingViolationCount: timingIssues.length,
      integrityScore: this.calculateIntegrityScore(uniqueCartIds.size, unrecovered.length, unsent.length, duplicates.length, timingIssues.length),
    };
  }

  detectUnrecoveredCarts(
    abandonedCarts: ReadonlyArray<AbandonedCart>,
    recoveries: ReadonlyArray<CartRecovery>,
  ): ReconciliationIssue[] {
    const recoveryCartIds = new Set(recoveries.map(r => r.cartId));
    const issues: ReconciliationIssue[] = [];

    for (const cart of abandonedCarts) {
      if (!recoveryCartIds.has(cart.cartId)) {
        issues.push({
          issueType: 'UNRECOVERED_CART',
          cartId: cart.cartId,
          recoveryId: null,
          message: `Cart ${cart.cartId} was abandoned but has no recovery attempt`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  detectUnsentNotifications(
    recoveries: ReadonlyArray<CartRecovery>,
    notifications: ReadonlyArray<RecoveryNotification>,
  ): ReconciliationIssue[] {
    const sentRecoveryIds = new Set(
      notifications
        .filter(n => n.status === 'SENT' || n.status === 'DELIVERED')
        .map(n => n.recoveryId),
    );
    const issues: ReconciliationIssue[] = [];

    for (const rec of recoveries) {
      if (rec.status === 'SENT' && !sentRecoveryIds.has(rec.recoveryId)) {
        issues.push({
          issueType: 'UNSENT_NOTIFICATION',
          cartId: rec.cartId,
          recoveryId: rec.recoveryId,
          message: `Recovery ${rec.recoveryId} was sent but no corresponding notification was delivered`,
          severity: 'MEDIUM',
        });
      }
    }

    return issues;
  }

  detectDuplicateRecoveries(
    abandonedCarts: ReadonlyArray<AbandonedCart>,
    recoveries: ReadonlyArray<CartRecovery>,
  ): ReconciliationIssue[] {
    const cartRecoveryMap = new Map<string, CartRecovery[]>();
    for (const rec of recoveries) {
      const list = cartRecoveryMap.get(rec.cartId) ?? [];
      list.push(rec);
      cartRecoveryMap.set(rec.cartId, list);
    }

    const issues: ReconciliationIssue[] = [];
    for (const [cartId, recs] of cartRecoveryMap) {
      if (recs.length > 1) {
        issues.push({
          issueType: 'DUPLICATE_RECOVERY',
          cartId,
          recoveryId: recs[0].recoveryId,
          message: `Cart ${cartId} has ${recs.length} recovery attempts (possible duplicate)`,
          severity: 'MEDIUM',
        });
      }
    }

    return issues;
  }

  validateRecoveryTiming(
    abandonedCart: AbandonedCart,
    recovery: CartRecovery,
  ): ReconciliationIssue | null {
    const abandonedTime = new Date(abandonedCart.abandonedAt).getTime();
    const recoveryTime = new Date(recovery.recoveredAt).getTime();
    const delta = recoveryTime - abandonedTime;

    if (delta < 0) {
      return {
        issueType: 'TIMING_VIOLATION',
        cartId: abandonedCart.cartId,
        recoveryId: recovery.recoveryId,
        message: `Recovery ${recovery.recoveryId} timestamp is before cart abandonment`,
        severity: 'HIGH',
      };
    }

    if (delta > RECOVERY_WINDOW_MS) {
      return {
        issueType: 'TIMING_VIOLATION',
        cartId: abandonedCart.cartId,
        recoveryId: recovery.recoveryId,
        message: `Recovery ${recovery.recoveryId} exceeds ${RECOVERY_WINDOW_MS / 3600000}h window (was ${(delta / 3600000).toFixed(1)}h)`,
        severity: 'LOW',
      };
    }

    return null;
  }

  generateReconciliationReport(
    abandonedCarts: ReadonlyArray<AbandonedCart>,
    recoveries: ReadonlyArray<CartRecovery>,
    notifications: ReadonlyArray<RecoveryNotification>,
  ): ReconciliationReport {
    return this.auditAbandonedCartRecovery(abandonedCarts, recoveries, notifications);
  }

  private calculateIntegrityScore(
    totalCarts: number,
    unrecovered: number,
    unsent: number,
    duplicates: number,
    timingViolations: number,
  ): number {
    if (totalCarts === 0) return 100;
    const penalty = (unrecovered * 10) + (unsent * 5) + (duplicates * 5) + (timingViolations * 3);
    return Math.max(0, Math.min(100, 100 - penalty));
  }
}
