/**
 * CommerceCheckoutPaymentAudit — G1-191
 *
 * Audits consistency between Checkout and Payment records.
 * Validates that checkout totals match payment amounts, detects missing payments,
 * orphaned payments, and currency/amount mismatches.
 */

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export interface Checkout {
  readonly checkoutId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly totalAmount: number;
  readonly currency: string;
  readonly status: CheckoutStatus;
  readonly createdAt: string;
  readonly lineItems: ReadonlyArray<CheckoutLineItem>;
}

export type CheckoutStatus = 'PENDING' | 'COMPLETED' | 'ABANDONED' | 'CANCELLED';

export interface CheckoutLineItem {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly totalPrice: number;
}

export interface Payment {
  readonly paymentId: string;
  readonly checkoutId: string;
  readonly tenantId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly createdAt: string;
  readonly method: string;
}

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

// ---------------------------------------------------------------------------
// Audit Result Types
// ---------------------------------------------------------------------------

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConsistencyIssue {
  readonly issueId: string;
  readonly issueType: string;
  readonly checkoutId?: string;
  readonly paymentId?: string;
  readonly message: string;
  readonly severity: AuditSeverity;
}

export interface CheckoutPaymentAuditReport {
  readonly timestamp: string;
  readonly totalCheckouts: number;
  readonly totalPayments: number;
  readonly matchedCount: number;
  readonly unmatchedCheckouts: number;
  readonly orphanedPayments: number;
  readonly issues: ReadonlyArray<ConsistencyIssue>;
  readonly healthScore: number;
}

// ---------------------------------------------------------------------------
// Checkout Payment Consistency Auditor
// ---------------------------------------------------------------------------

export class CheckoutPaymentConsistencyAuditor {
  private _amountTolerance = 0.01;

  setAmountTolerance(tolerance: number): void {
    this._amountTolerance = tolerance;
  }

  getAmountTolerance(): number {
    return this._amountTolerance;
  }

  /**
   * Validates that a checkout's total matches a payment's amount.
   */
  auditCheckoutToPaymentFlow(
    checkout: Checkout,
    payment: Payment,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];

    if (checkout.checkoutId !== payment.checkoutId) {
      issues.push({
        issueId: `MISMATCH-${checkout.checkoutId}-${payment.paymentId}`,
        issueType: 'CHECKOUT_ID_MISMATCH',
        checkoutId: checkout.checkoutId,
        paymentId: payment.paymentId,
        message: `Payment ${payment.paymentId} references checkout ${payment.checkoutId}, expected ${checkout.checkoutId}`,
        severity: 'HIGH',
      });
    }

    if (!this.validateCurrencyConsistency(checkout, payment)) {
      issues.push({
        issueId: `CURRENCY-${checkout.checkoutId}-${payment.paymentId}`,
        issueType: 'CURRENCY_MISMATCH',
        checkoutId: checkout.checkoutId,
        paymentId: payment.paymentId,
        message: `Currency mismatch: checkout=${checkout.currency}, payment=${payment.currency}`,
        severity: 'HIGH',
      });
    }

    if (!this.validateAmountConsistency(checkout, payment)) {
      issues.push({
        issueId: `AMOUNT-${checkout.checkoutId}-${payment.paymentId}`,
        issueType: 'AMOUNT_MISMATCH',
        checkoutId: checkout.checkoutId,
        paymentId: payment.paymentId,
        message: `Amount mismatch: checkout=${checkout.totalAmount}, payment=${payment.amount}, tolerance=${this._amountTolerance}`,
        severity: 'HIGH',
      });
    }

    return { consistent: issues.length === 0, issues };
  }

  /**
   * Finds checkouts that have no matching payment.
   */
  detectMissingPaymentForCheckout(
    checkouts: ReadonlyArray<Checkout>,
    payments: ReadonlyArray<Payment>,
  ): ConsistencyIssue[] {
    const paymentCheckoutIds = new Set(payments.map(p => p.checkoutId));
    const issues: ConsistencyIssue[] = [];

    for (const checkout of checkouts) {
      if (checkout.status === 'COMPLETED' && !paymentCheckoutIds.has(checkout.checkoutId)) {
        issues.push({
          issueId: `MISSING-PAY-${checkout.checkoutId}`,
          issueType: 'MISSING_PAYMENT',
          checkoutId: checkout.checkoutId,
          message: `Completed checkout ${checkout.checkoutId} has no matching payment`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  /**
   * Finds payments that have no matching checkout.
   */
  detectOrphanedPayments(
    checkouts: ReadonlyArray<Checkout>,
    payments: ReadonlyArray<Payment>,
  ): ConsistencyIssue[] {
    const checkoutIds = new Set(checkouts.map(c => c.checkoutId));
    const issues: ConsistencyIssue[] = [];

    for (const payment of payments) {
      if (!checkoutIds.has(payment.checkoutId)) {
        issues.push({
          issueId: `ORPHAN-${payment.paymentId}`,
          issueType: 'ORPHANED_PAYMENT',
          paymentId: payment.paymentId,
          message: `Payment ${payment.paymentId} references non-existent checkout ${payment.checkoutId}`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  /**
   * Checks if currencies match between checkout and payment.
   */
  validateCurrencyConsistency(checkout: Checkout, payment: Payment): boolean {
    return checkout.currency === payment.currency;
  }

  /**
   * Checks if amounts are within tolerance.
   */
  validateAmountConsistency(checkout: Checkout, payment: Payment): boolean {
    return Math.abs(checkout.totalAmount - payment.amount) <= this._amountTolerance;
  }

  /**
   * Generates a full consistency audit report.
   */
  generateAuditReport(
    checkouts: ReadonlyArray<Checkout>,
    payments: ReadonlyArray<Payment>,
  ): CheckoutPaymentAuditReport {
    const issues: ConsistencyIssue[] = [];

    const missingPaymentIssues = this.detectMissingPaymentForCheckout(checkouts, payments);
    issues.push(...missingPaymentIssues);

    const orphanedPaymentIssues = this.detectOrphanedPayments(checkouts, payments);
    issues.push(...orphanedPaymentIssues);

    const paymentByCheckout = new Map<string, Payment[]>();
    for (const payment of payments) {
      const existing = paymentByCheckout.get(payment.checkoutId) ?? [];
      existing.push(payment);
      paymentByCheckout.set(payment.checkoutId, existing);
    }

    let matchedCount = 0;
    for (const checkout of checkouts) {
      const checkoutPayments = paymentByCheckout.get(checkout.checkoutId) ?? [];
      for (const payment of checkoutPayments) {
        const result = this.auditCheckoutToPaymentFlow(checkout, payment);
        issues.push(...result.issues);
        if (result.consistent) matchedCount++;
      }
    }

    const unmatchedCheckouts = checkouts.filter(
      c => !paymentByCheckout.has(c.checkoutId),
    ).length;

    const checkoutIds = new Set(checkouts.map(c => c.checkoutId));
    const orphanedPayments = payments.filter(
      p => !checkoutIds.has(p.checkoutId),
    ).length;

    const healthScore = this.calculateHealthScore(
      checkouts.length,
      payments.length,
      issues,
    );

    return {
      timestamp: new Date().toISOString(),
      totalCheckouts: checkouts.length,
      totalPayments: payments.length,
      matchedCount,
      unmatchedCheckouts,
      orphanedPayments,
      issues,
      healthScore,
    };
  }

  private calculateHealthScore(
    totalCheckouts: number,
    totalPayments: number,
    issues: ReadonlyArray<ConsistencyIssue>,
  ): number {
    if (totalCheckouts === 0 && totalPayments === 0) return 100;

    let score = 100;
    const highIssues = issues.filter(i => i.severity === 'HIGH').length;
    const mediumIssues = issues.filter(i => i.severity === 'MEDIUM').length;
    const lowIssues = issues.filter(i => i.severity === 'LOW').length;

    score -= highIssues * 5;
    score -= mediumIssues * 2;
    score -= lowIssues * 1;

    return Math.max(0, Math.min(100, score));
  }
}
