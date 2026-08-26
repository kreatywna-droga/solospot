/**
 * StorefrontRmaReturnOrchestratorEngine.ts — Sprint G1-136 RMA Return Authorization Engine (Night Shift Level 98)
 *
 * Provides pure TypeScript, headless Return Merchandise Authorization (RMA) submission,
 * return reason classification, inspection state machine (REQUESTED, APPROVED, RECEIVED, INSPECTED, REFUNDED, REJECTED),
 * return shipping tracking, and store credit / refund calculation.
 *
 * External carrier return label APIs (EasyPost / ShipEngine Return APIs) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type ReturnReasonCategory = 'WRONG_SIZE' | 'DEFECTIVE' | 'NOT_AS_DESCRIBED' | 'CHANGED_MIND' | 'DAMAGED_IN_TRANSIT';

export type RmaStatus = 'REQUESTED' | 'APPROVED' | 'RECEIVED' | 'INSPECTED' | 'REFUNDED' | 'REJECTED';

export interface RmaReturnItemDTO {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly returnReason: ReturnReasonCategory;
}

export interface RmaAuthorizationRequestDTO {
  readonly rmaId: string;
  readonly tenantId: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly returnItems: ReadonlyArray<RmaReturnItemDTO>;
  readonly status: RmaStatus;
  readonly expectedRefundTotal: number;
  readonly returnTrackingNumber?: string;
  readonly requestedAtMs: number;
  readonly updatedAtMs: number;
}

export interface RmaReturnOrchestratorEngineStateDTO {
  readonly tenantId: string;
  readonly returnWindowDays: number;
  readonly rmaRequests: Record<string, RmaAuthorizationRequestDTO>; // rmaId -> dto
}

export class StorefrontRmaReturnOrchestratorEngine {
  private readonly tenantId: string;
  private returnWindowDays: number;
  private rmaRequests: Map<string, RmaAuthorizationRequestDTO> = new Map();

  constructor(tenantId = 'default_tenant', returnWindowDays = 30) {
    this.tenantId = tenantId;
    this.returnWindowDays = returnWindowDays;
  }

  /**
   * Submits a customer RMA return authorization request.
   */
  public requestRmaAuthorization(params: {
    rmaId: string;
    orderId: string;
    customerId: string;
    orderDeliveredAtMs: number;
    returnItems: ReadonlyArray<RmaReturnItemDTO>;
  }): RmaAuthorizationRequestDTO {
    const { rmaId, orderId, customerId, orderDeliveredAtMs, returnItems } = params;

    if (!rmaId || !orderId || !customerId || !returnItems || returnItems.length === 0) {
      throw new Error('rmaId, orderId, customerId, and at least one return item are required');
    }

    const now = Date.now();
    const returnWindowMs = this.returnWindowDays * 86400000;

    if (now - orderDeliveredAtMs > returnWindowMs) {
      throw new Error(`Order ${orderId} exceeds the ${this.returnWindowDays}-day return policy window`);
    }

    let expectedRefundTotal = 0;
    returnItems.forEach(item => {
      if (item.quantity <= 0 || item.unitPrice < 0) {
        throw new Error(`Invalid item quantity or unit price for return item ${item.productId}`);
      }
      expectedRefundTotal += item.quantity * item.unitPrice;
    });

    const dto: RmaAuthorizationRequestDTO = {
      rmaId: rmaId.trim(),
      tenantId: this.tenantId,
      orderId: orderId.trim(),
      customerId: customerId.trim(),
      returnItems: [...returnItems],
      status: 'REQUESTED',
      expectedRefundTotal: Math.round(expectedRefundTotal * 100) / 100,
      requestedAtMs: now,
      updatedAtMs: now
    };

    this.rmaRequests.set(dto.rmaId, dto);
    return dto;
  }

  /**
   * Updates RMA inspection status state machine.
   */
  public updateRmaStatus(params: {
    rmaId: string;
    newStatus: RmaStatus;
    returnTrackingNumber?: string;
  }): RmaAuthorizationRequestDTO {
    const { rmaId, newStatus } = params;

    const rma = this.rmaRequests.get(rmaId.trim());
    if (!rma) {
      throw new Error(`RMA request ${rmaId} not found`);
    }

    const now = Date.now();
    const updated: RmaAuthorizationRequestDTO = {
      ...rma,
      status: newStatus,
      returnTrackingNumber: params.returnTrackingNumber ? params.returnTrackingNumber.trim() : rma.returnTrackingNumber,
      updatedAtMs: now
    };

    this.rmaRequests.set(rma.rmaId, updated);
    return updated;
  }

  public getRma(rmaId: string): RmaAuthorizationRequestDTO | undefined {
    return this.rmaRequests.get(rmaId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): RmaReturnOrchestratorEngineStateDTO {
    const record: Record<string, RmaAuthorizationRequestDTO> = {};
    this.rmaRequests.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      returnWindowDays: this.returnWindowDays,
      rmaRequests: record
    };
  }

  public importState(state: RmaReturnOrchestratorEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.returnWindowDays = state.returnWindowDays;
    this.rmaRequests.clear();
    Object.entries(state.rmaRequests || {}).forEach(([k, v]) => {
      this.rmaRequests.set(k, v);
    });
  }
}
