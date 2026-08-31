/**
 * CommercePaymentOrderAudit — G1-192
 *
 * Audits consistency between Payment and Order records.
 * Validates that payments match orders, detects unpaid/overpaid orders,
 * and checks status mapping consistency.
 */

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

export interface Payment {
  readonly paymentId: string;
  readonly orderId: string;
  readonly tenantId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly createdAt: string;
  readonly method: string;
}

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';

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

// ---------------------------------------------------------------------------
// Audit Result Types
// ---------------------------------------------------------------------------

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ConsistencyIssue {
  readonly issueId: string;
  readonly issueType: string;
  readonly orderId?: string;
  readonly paymentId?: string;
  readonly message: string;
  readonly severity: AuditSeverity;
}

export interface PaymentOrderAuditReport {
  readonly timestamp: string;
  readonly totalPayments: number;
  readonly totalOrders: number;
  readonly matchedCount: number;
  readonly unpaidOrders: number;
  readonly overpaidOrders: number;
  readonly issues: ReadonlyArray<ConsistencyIssue>;
  readonly healthScore: number;
}

// ---------------------------------------------------------------------------
// Payment Order Consistency Auditor
// ---------------------------------------------------------------------------

export class PaymentOrderConsistencyAuditor {
  private _amountTolerance = 0.01;

  setAmountTolerance(tolerance: number): void {
    this._amountTolerance = tolerance;
  }

  getAmountTolerance(): number {
    return this._amountTolerance;
  }

  /**
   * Validates that payments match their orders.
   */
  auditPaymentToOrderFlow(
    payments: ReadonlyArray<Payment>,
    orders: ReadonlyArray<Order>,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];
    const orderMap = new Map<string, Order>();
    for (const o of orders) {
      orderMap.set(o.orderId, o);
    }

    for (const payment of payments) {
      const order = orderMap.get(payment.orderId);
      if (!order) {
        issues.push({
          issueId: `NO-ORDER-${payment.paymentId}`,
          issueType: 'MISSING_ORDER',
          paymentId: payment.paymentId,
          message: `Payment ${payment.paymentId} references non-existent order ${payment.orderId}`,
          severity: 'HIGH',
        });
        continue;
      }

      const statusOk = this.validatePaymentStatusMapping(payment, order);
      if (!statusOk) {
        issues.push({
          issueId: `STATUS-${payment.paymentId}-${order.orderId}`,
          issueType: 'STATUS_MISMATCH',
          paymentId: payment.paymentId,
          orderId: order.orderId,
          message: `Payment status ${payment.status} inconsistent with order status ${order.status}`,
          severity: 'MEDIUM',
        });
      }
    }

    return { consistent: issues.length === 0, issues };
  }

  // Overload for the report method signature
  auditPaymentToOrderFlowWithArrays(
    payments: ReadonlyArray<Payment>,
    orders: ReadonlyArray<Order>,
  ): { consistent: boolean; issues: ConsistencyIssue[] } {
    const issues: ConsistencyIssue[] = [];
    const orderMap = new Map<string, Order>();
    for (const o of orders) {
      orderMap.set(o.orderId, o);
    }

    for (const payment of payments) {
      const order = orderMap.get(payment.orderId);
      if (!order) {
        issues.push({
          issueId: `NO-ORDER-${payment.paymentId}`,
          issueType: 'MISSING_ORDER',
          paymentId: payment.paymentId,
          message: `Payment ${payment.paymentId} references non-existent order ${payment.orderId}`,
          severity: 'HIGH',
        });
        continue;
      }

      const statusOk = this.validatePaymentStatusMapping(payment, order);
      if (!statusOk) {
        issues.push({
          issueId: `STATUS-${payment.paymentId}-${order.orderId}`,
          issueType: 'STATUS_MISMATCH',
          paymentId: payment.paymentId,
          orderId: order.orderId,
          message: `Payment status ${payment.status} inconsistent with order status ${order.status}`,
          severity: 'MEDIUM',
        });
      }
    }

    return { consistent: issues.length === 0, issues };
  }

  /**
   * Finds orders without any successful payment.
   */
  detectUnpaidOrders(
    payments: ReadonlyArray<Payment>,
    orders: ReadonlyArray<Order>,
  ): ConsistencyIssue[] {
    const successfulPaymentsByOrder = new Map<string, Payment[]>();
    for (const payment of payments) {
      if (payment.status === 'SUCCEEDED' || payment.status === 'PARTIALLY_REFUNDED') {
        const existing = successfulPaymentsByOrder.get(payment.orderId) ?? [];
        existing.push(payment);
        successfulPaymentsByOrder.set(payment.orderId, existing);
      }
    }

    const issues: ConsistencyIssue[] = [];
    for (const order of orders) {
      if (order.status === 'CANCELLED') continue;
      const orderPayments = successfulPaymentsByOrder.get(order.orderId) ?? [];
      const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid < order.totalAmount - this._amountTolerance) {
        issues.push({
          issueId: `UNPAID-${order.orderId}`,
          issueType: 'UNPAID_ORDER',
          orderId: order.orderId,
          message: `Order ${order.orderId} has paid ${totalPaid} of ${order.totalAmount}`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  /**
   * Finds orders where total payments exceed order total.
   */
  detectOverpaidOrders(
    payments: ReadonlyArray<Payment>,
    orders: ReadonlyArray<Order>,
  ): ConsistencyIssue[] {
    const successfulPaymentsByOrder = new Map<string, Payment[]>();
    for (const payment of payments) {
      if (payment.status === 'SUCCEEDED') {
        const existing = successfulPaymentsByOrder.get(payment.orderId) ?? [];
        existing.push(payment);
        successfulPaymentsByOrder.set(payment.orderId, existing);
      }
    }

    const issues: ConsistencyIssue[] = [];
    for (const order of orders) {
      const orderPayments = successfulPaymentsByOrder.get(order.orderId) ?? [];
      const totalPaid = orderPayments.reduce((sum, p) => sum + p.amount, 0);

      if (totalPaid > order.totalAmount + this._amountTolerance) {
        issues.push({
          issueId: `OVERPAID-${order.orderId}`,
          issueType: 'OVERPAID_ORDER',
          orderId: order.orderId,
          message: `Order ${order.orderId} overpaid: paid ${totalPaid} of ${order.totalAmount}`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  /**
   * Validates payment status is consistent with order status.
   */
  validatePaymentStatusMapping(payment: Payment, order: Order): boolean {
    const validMappings: Record<PaymentStatus, OrderStatus[]> = {
      PENDING: ['PENDING', 'CONFIRMED'],
      SUCCEEDED: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
      FAILED: ['PENDING', 'CANCELLED'],
      REFUNDED: ['REFUNDED', 'CANCELLED'],
      PARTIALLY_REFUNDED: ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED'],
    };

    const allowed = validMappings[payment.status];
    return allowed.includes(order.status);
  }

  /**
   * Generates a full audit report.
   */
  generateAuditReport(
    payments: ReadonlyArray<Payment>,
    orders: ReadonlyArray<Order>,
  ): PaymentOrderAuditReport {
    const issues: ConsistencyIssue[] = [];

    const flowResult = this.auditPaymentToOrderFlowWithArrays(payments, orders);
    issues.push(...flowResult.issues);

    const unpaidIssues = this.detectUnpaidOrders(payments, orders);
    issues.push(...unpaidIssues);

    const overpaidIssues = this.detectOverpaidOrders(payments, orders);
    issues.push(...overpaidIssues);

    const orderIdsWithPayment = new Set(
      payments
        .filter(p => p.status === 'SUCCEEDED')
        .map(p => p.orderId),
    );

    const matchedCount = orders.filter(o => orderIdsWithPayment.has(o.orderId)).length;
    const unpaidOrders = unpaidIssues.length;
    const overpaidOrders = overpaidIssues.length;

    const healthScore = this.calculateHealthScore(orders.length, issues);

    return {
      timestamp: new Date().toISOString(),
      totalPayments: payments.length,
      totalOrders: orders.length,
      matchedCount,
      unpaidOrders,
      overpaidOrders,
      issues,
      healthScore,
    };
  }

  private calculateHealthScore(totalOrders: number, issues: ReadonlyArray<ConsistencyIssue>): number {
    if (totalOrders === 0) return 100;

    let score = 100;
    score -= issues.filter(i => i.severity === 'HIGH').length * 5;
    score -= issues.filter(i => i.severity === 'MEDIUM').length * 2;
    score -= issues.filter(i => i.severity === 'LOW').length * 1;

    return Math.max(0, Math.min(100, score));
  }
}
