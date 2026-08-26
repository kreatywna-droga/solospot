/**
 * StorefrontOrderConsistencyEngine.ts — Sprint G1-93 Order Consistency & Reconciliation Engine (Night Shift Level 55)
 *
 * Provides pure TypeScript, headless cross-domain reconciliation between order state, payment lifecycle, and inventory reservations.
 * Prevents invalid states such as (PAYMENT_SUCCESS + INVENTORY_FAILURE + ORDER_UNCHANGED).
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type OrderState = 'DRAFT' | 'PENDING_PAYMENT' | 'PAID' | 'FULFILLED' | 'CANCELLED' | 'REFUNDED';
export type PaymentState = 'UNPAID' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED';
export type InventoryState = 'AVAILABLE' | 'RESERVED' | 'ALLOCATION_FAILED' | 'RELEASED';

export type OrderConsistencyStatus =
  | 'CONSISTENT'
  | 'INCONSISTENT_PAYMENT_WITHOUT_ORDER_UPDATE'
  | 'INCONSISTENT_PAYMENT_SUCCESS_INVENTORY_FAILURE'
  | 'INCONSISTENT_ORDER_PAID_PAYMENT_UNPAID'
  | 'INCONSISTENT_INVENTORY_RESERVED_ORDER_CANCELLED'
  | 'CRITICAL_CROSS_DOMAIN_DESYNC';

export type RecommendedCompensationAction =
  | 'NO_ACTION'
  | 'MARK_ORDER_PAID'
  | 'TRIGGER_AUTOMATIC_REFUND'
  | 'RELEASE_INVENTORY_RESERVATION'
  | 'BACKORDER_ALLOCATION'
  | 'FLAG_FOR_MANUAL_AUDIT';

export interface OrderConsistencyAuditDTO {
  readonly orderId: string;
  readonly tenantId: string;
  readonly orderState: OrderState;
  readonly paymentState: PaymentState;
  readonly inventoryState: InventoryState;
  readonly consistencyStatus: OrderConsistencyStatus;
  readonly requiresCompensation: boolean;
  readonly recommendedAction: RecommendedCompensationAction;
  readonly auditedAtMs: number;
}

export interface CompensationResultDTO {
  readonly orderId: string;
  readonly tenantId: string;
  readonly actionExecuted: RecommendedCompensationAction;
  readonly newOrderState: OrderState;
  readonly newPaymentState: PaymentState;
  readonly newInventoryState: InventoryState;
  readonly resolved: boolean;
  readonly executedAtMs: number;
}

export interface OrderConsistencyEngineStateDTO {
  readonly tenantId: string;
  readonly audits: Record<string, OrderConsistencyAuditDTO>;
  readonly compensations: Record<string, CompensationResultDTO>;
}

export class StorefrontOrderConsistencyEngine {
  private readonly tenantId: string;
  private audits: Map<string, OrderConsistencyAuditDTO> = new Map();
  private compensations: Map<string, CompensationResultDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Performs an audit across order, payment, and inventory domain states for a given order.
   */
  public auditOrderConsistency(params: {
    orderId: string;
    orderState: OrderState;
    paymentState: PaymentState;
    inventoryState: InventoryState;
  }): OrderConsistencyAuditDTO {
    const { orderId, orderState, paymentState, inventoryState } = params;

    if (!orderId) {
      throw new Error('Invalid order consistency audit parameters: orderId is required');
    }

    let consistencyStatus: OrderConsistencyStatus = 'CONSISTENT';
    let requiresCompensation = false;
    let recommendedAction: RecommendedCompensationAction = 'NO_ACTION';

    // Condition 1: Payment Succeeded but Inventory Allocation Failed
    if (paymentState === 'PAID' && inventoryState === 'ALLOCATION_FAILED') {
      consistencyStatus = 'INCONSISTENT_PAYMENT_SUCCESS_INVENTORY_FAILURE';
      requiresCompensation = true;
      recommendedAction = 'TRIGGER_AUTOMATIC_REFUND';
    }
    // Condition 2: Payment Succeeded but Order is still DRAFT or PENDING_PAYMENT
    else if (paymentState === 'PAID' && (orderState === 'DRAFT' || orderState === 'PENDING_PAYMENT')) {
      consistencyStatus = 'INCONSISTENT_PAYMENT_WITHOUT_ORDER_UPDATE';
      requiresCompensation = true;
      recommendedAction = 'MARK_ORDER_PAID';
    }
    // Condition 3: Order marked PAID but Payment is UNPAID or FAILED
    else if (orderState === 'PAID' && (paymentState === 'UNPAID' || paymentState === 'FAILED')) {
      consistencyStatus = 'INCONSISTENT_ORDER_PAID_PAYMENT_UNPAID';
      requiresCompensation = true;
      recommendedAction = 'FLAG_FOR_MANUAL_AUDIT';
    }
    // Condition 4: Inventory Reserved for a CANCELLED order
    else if (orderState === 'CANCELLED' && inventoryState === 'RESERVED') {
      consistencyStatus = 'INCONSISTENT_INVENTORY_RESERVED_ORDER_CANCELLED';
      requiresCompensation = true;
      recommendedAction = 'RELEASE_INVENTORY_RESERVATION';
    }

    const audit: OrderConsistencyAuditDTO = {
      orderId,
      tenantId: this.tenantId,
      orderState,
      paymentState,
      inventoryState,
      consistencyStatus,
      requiresCompensation,
      recommendedAction,
      auditedAtMs: Date.now()
    };

    this.audits.set(orderId, audit);
    return audit;
  }

  /**
   * Executes compensation workflows to resolve detected cross-domain inconsistencies.
   */
  public executeCompensation(orderId: string): CompensationResultDTO {
    const audit = this.audits.get(orderId);
    if (!audit) {
      throw new Error(`No consistency audit record found for order ${orderId}`);
    }

    if (!audit.requiresCompensation) {
      return {
        orderId,
        tenantId: this.tenantId,
        actionExecuted: 'NO_ACTION',
        newOrderState: audit.orderState,
        newPaymentState: audit.paymentState,
        newInventoryState: audit.inventoryState,
        resolved: true,
        executedAtMs: Date.now()
      };
    }

    let newOrderState = audit.orderState;
    let newPaymentState = audit.paymentState;
    let newInventoryState = audit.inventoryState;

    switch (audit.recommendedAction) {
      case 'TRIGGER_AUTOMATIC_REFUND':
        newOrderState = 'REFUNDED';
        newPaymentState = 'REFUNDED';
        break;
      case 'MARK_ORDER_PAID':
        newOrderState = 'PAID';
        break;
      case 'RELEASE_INVENTORY_RESERVATION':
        newInventoryState = 'RELEASED';
        break;
      case 'FLAG_FOR_MANUAL_AUDIT':
        // Flagged without state mutation
        break;
      default:
        break;
    }

    const compensation: CompensationResultDTO = {
      orderId,
      tenantId: this.tenantId,
      actionExecuted: audit.recommendedAction,
      newOrderState,
      newPaymentState,
      newInventoryState,
      resolved: true,
      executedAtMs: Date.now()
    };

    this.compensations.set(orderId, compensation);

    // Update audit record to CONSISTENT after compensation
    this.audits.set(orderId, {
      ...audit,
      orderState: newOrderState,
      paymentState: newPaymentState,
      inventoryState: newInventoryState,
      consistencyStatus: 'CONSISTENT',
      requiresCompensation: false,
      recommendedAction: 'NO_ACTION'
    });

    return compensation;
  }

  public getAudit(orderId: string): OrderConsistencyAuditDTO | undefined {
    return this.audits.get(orderId);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): OrderConsistencyEngineStateDTO {
    const auditsRecord: Record<string, OrderConsistencyAuditDTO> = {};
    this.audits.forEach((val, key) => {
      auditsRecord[key] = val;
    });

    const compensationsRecord: Record<string, CompensationResultDTO> = {};
    this.compensations.forEach((val, key) => {
      compensationsRecord[key] = val;
    });

    return {
      tenantId: this.tenantId,
      audits: auditsRecord,
      compensations: compensationsRecord
    };
  }

  public importState(state: OrderConsistencyEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.audits.clear();
    this.compensations.clear();

    Object.entries(state.audits || {}).forEach(([k, v]) => {
      this.audits.set(k, v);
    });
    Object.entries(state.compensations || {}).forEach(([k, v]) => {
      this.compensations.set(k, v);
    });
  }
}
