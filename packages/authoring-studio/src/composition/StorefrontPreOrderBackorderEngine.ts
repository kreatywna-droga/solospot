/**
 * StorefrontPreOrderBackorderEngine.ts — Sprint G1-121 Pre-Order & Backorder Engine (Night Shift Level 83)
 *
 * Provides pure TypeScript, headless pre-order reservation handling, scheduled release date management,
 * out-of-stock backorder queuing, waitlist priorities, and stock replenishment allocation.
 *
 * External inventory replenishment APIs remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type OrderReservationType = 'PRE_ORDER' | 'BACKORDER';

export type ReservationStatus = 'QUEUED' | 'ALLOCATED' | 'FULFILLED' | 'CANCELED';

/**
 * @deprecated LegacyPreOrderStatus is deprecated. Use ReservationStatus instead. (G1-147 DEPRECATE)
 */
export type LegacyPreOrderStatus = ReservationStatus;


export interface ProductReservationDTO {
  readonly reservationId: string;
  readonly tenantId: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly productId: string;
  readonly quantity: number;
  readonly reservationType: OrderReservationType;
  readonly status: ReservationStatus;
  readonly expectedReleaseTimestampMs?: number;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface PreOrderBackorderEngineStateDTO {
  readonly tenantId: string;
  readonly reservations: Record<string, ProductReservationDTO>; // reservationId -> dto
}

export class StorefrontPreOrderBackorderEngine {
  private readonly tenantId: string;
  private reservations: Map<string, ProductReservationDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Places a pre-order or backorder reservation for a product item.
   */
  public placeReservation(params: {
    reservationId: string;
    orderId: string;
    customerId: string;
    productId: string;
    quantity: number;
    reservationType: OrderReservationType;
    expectedReleaseTimestampMs?: number;
  }): ProductReservationDTO {
    const { reservationId, orderId, customerId, productId, quantity, reservationType } = params;

    if (!reservationId || !orderId || !customerId || !productId || quantity <= 0) {
      throw new Error('Valid reservationId, orderId, customerId, productId, and positive quantity are required');
    }

    const now = Date.now();
    const dto: ProductReservationDTO = {
      reservationId: reservationId.trim(),
      tenantId: this.tenantId,
      orderId: orderId.trim(),
      customerId: customerId.trim(),
      productId: productId.trim(),
      quantity,
      reservationType,
      status: 'QUEUED',
      expectedReleaseTimestampMs: params.expectedReleaseTimestampMs,
      createdAtMs: now,
      updatedAtMs: now
    };

    this.reservations.set(dto.reservationId, dto);
    return dto;
  }

  /**
   * Allocates newly replenished stock to queued backorders/pre-orders in FIFO order.
   */
  public allocateStock(productId: string, availableQuantity: number): ReadonlyArray<ProductReservationDTO> {
    if (!productId || availableQuantity <= 0) {
      throw new Error('Valid productId and positive availableQuantity are required');
    }

    const cleanProdId = productId.trim();
    const queuedReservations = Array.from(this.reservations.values())
      .filter(r => r.productId === cleanProdId && r.status === 'QUEUED')
      .sort((a, b) => a.createdAtMs - b.createdAtMs);

    let remainingStock = availableQuantity;
    const allocated: ProductReservationDTO[] = [];
    const now = Date.now();

    for (const res of queuedReservations) {
      if (remainingStock >= res.quantity) {
        remainingStock -= res.quantity;
        const updated: ProductReservationDTO = {
          ...res,
          status: 'ALLOCATED',
          updatedAtMs: now
        };
        this.reservations.set(res.reservationId, updated);
        allocated.push(updated);
      }
    }

    return allocated;
  }

  /**
   * Cancels a pre-order or backorder reservation (G1-145 RECOVER).
   */
  public cancelReservation(reservationId: string): ProductReservationDTO {
    const res = this.reservations.get(reservationId.trim());
    if (!res) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    if (res.status === 'FULFILLED') {
      throw new Error(`Reservation ${reservationId} has already been fulfilled and cannot be canceled`);
    }

    const updated: ProductReservationDTO = {
      ...res,
      status: 'CANCELED',
      updatedAtMs: Date.now()
    };

    this.reservations.set(res.reservationId, updated);
    return updated;
  }

  /**
   * Updates the estimated restock release date for pre-orders/backorders (G1-161 EXTEND).
   */
  public updateExpectedReleaseDate(reservationId: string, releaseTimestampMs: number): ProductReservationDTO {
    const res = this.reservations.get(reservationId.trim());
    if (!res) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    if (releaseTimestampMs <= Date.now()) {
      throw new Error('releaseTimestampMs must be in the future');
    }

    const updated: ProductReservationDTO = {
      ...res,
      expectedReleaseTimestampMs: releaseTimestampMs,
      updatedAtMs: Date.now()
    };

    this.reservations.set(res.reservationId, updated);
    return updated;
  }

  public getReservation(reservationId: string): ProductReservationDTO | undefined {
    return this.reservations.get(reservationId.trim());
  }



  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): PreOrderBackorderEngineStateDTO {
    const record: Record<string, ProductReservationDTO> = {};
    this.reservations.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      reservations: record
    };
  }

  public importState(state: PreOrderBackorderEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.reservations.clear();
    Object.entries(state.reservations || {}).forEach(([k, v]) => {
      this.reservations.set(k, v);
    });
  }
}
