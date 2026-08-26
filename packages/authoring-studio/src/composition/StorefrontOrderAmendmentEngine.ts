/**
 * StorefrontOrderAmendmentEngine.ts — Sprint G1-128 Post-Order Item Amendment Engine (Night Shift Level 90)
 *
 * Provides pure TypeScript, headless post-purchase order item substitution, quantity modification,
 * shipping address update prior to fulfillment dispatch, and price delta calculation (ADDITIONAL_CHARGE vs REFUND_DUE).
 *
 * External payment adjustment gateways (Stripe additional charge / partial refund) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type DeltaFinancialAction = 'NO_CHANGE' | 'ADDITIONAL_CHARGE_REQUIRED' | 'REFUND_DUE';

export interface AmendedLineItemDTO {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface OrderAmendmentResultDTO {
  readonly amendmentId: string;
  readonly tenantId: string;
  readonly orderId: string;
  readonly originalTotal: number;
  readonly amendedTotal: number;
  readonly priceDeltaAmount: number; // positive = additional cost, negative = refund
  readonly financialAction: DeltaFinancialAction;
  readonly items: ReadonlyArray<AmendedLineItemDTO>;
  readonly shippingAddressUpdated: boolean;
  readonly amendedAtMs: number;
}

export interface OrderAmendmentEngineStateDTO {
  readonly tenantId: string;
  readonly amendments: Record<string, OrderAmendmentResultDTO>; // amendmentId -> result
}

export class StorefrontOrderAmendmentEngine {
  private readonly tenantId: string;
  private amendments: Map<string, OrderAmendmentResultDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Applies post-purchase item substitutions or shipping address corrections before fulfillment.
   */
  public applyOrderAmendment(params: {
    amendmentId: string;
    orderId: string;
    originalTotal: number;
    updatedItems: ReadonlyArray<AmendedLineItemDTO>;
    newShippingAddress?: string;
    isOrderFulfilled?: boolean;
  }): OrderAmendmentResultDTO {
    const { amendmentId, orderId, originalTotal, updatedItems } = params;

    if (!amendmentId || !orderId || typeof originalTotal !== 'number' || originalTotal < 0 || !updatedItems || updatedItems.length === 0) {
      throw new Error('Valid amendmentId, orderId, non-negative originalTotal, and at least one updated item are required');
    }

    if (params.isOrderFulfilled) {
      throw new Error(`Order ${orderId} has already been fulfilled and cannot be amended`);
    }

    let amendedTotal = 0;
    updatedItems.forEach(item => {
      if (item.quantity <= 0 || item.unitPrice < 0) {
        throw new Error(`Invalid item quantity or price for product ${item.productId}`);
      }
      amendedTotal += item.quantity * item.unitPrice;
    });

    amendedTotal = Math.round(amendedTotal * 100) / 100;
    const priceDeltaAmount = Math.round((amendedTotal - originalTotal) * 100) / 100;

    let financialAction: DeltaFinancialAction = 'NO_CHANGE';
    if (priceDeltaAmount > 0) {
      financialAction = 'ADDITIONAL_CHARGE_REQUIRED';
    } else if (priceDeltaAmount < 0) {
      financialAction = 'REFUND_DUE';
    }

    const now = Date.now();
    const dto: OrderAmendmentResultDTO = {
      amendmentId: amendmentId.trim(),
      tenantId: this.tenantId,
      orderId: orderId.trim(),
      originalTotal,
      amendedTotal,
      priceDeltaAmount,
      financialAction,
      items: [...updatedItems],
      shippingAddressUpdated: Boolean(params.newShippingAddress),
      amendedAtMs: now
    };

    this.amendments.set(dto.amendmentId, dto);
    return dto;
  }

  public getAmendment(amendmentId: string): OrderAmendmentResultDTO | undefined {
    return this.amendments.get(amendmentId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): OrderAmendmentEngineStateDTO {
    const record: Record<string, OrderAmendmentResultDTO> = {};
    this.amendments.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      amendments: record
    };
  }

  public importState(state: OrderAmendmentEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.amendments.clear();
    Object.entries(state.amendments || {}).forEach(([k, v]) => {
      this.amendments.set(k, v);
    });
  }
}
