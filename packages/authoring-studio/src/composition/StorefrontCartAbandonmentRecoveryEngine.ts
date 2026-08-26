/**
 * StorefrontCartAbandonmentRecoveryEngine.ts — Sprint G1-146 Cart Abandonment Recovery Engine (Night Shift Level 103)
 *
 * Provides pure TypeScript, headless abandoned cart detection, recovery token generation,
 * expiring incentive discount evaluation (e.g. 10% off within 24h), and recovery state machine
 * (ABANDONED, INCENTIVE_OFFERED, RECOVERY_CLICKED, RECOVERED, EXPIRED).
 *
 * External marketing automation APIs (Klaviyo, Omnisend) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type AbandonmentStatus = 'ABANDONED' | 'INCENTIVE_OFFERED' | 'RECOVERY_CLICKED' | 'RECOVERED' | 'EXPIRED';

export interface AbandonedCartItemDTO {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
}

export interface CartAbandonmentRecordDTO {
  readonly recoveryId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly customerEmail: string;
  readonly items: ReadonlyArray<AbandonedCartItemDTO>;
  readonly cartTotal: number;
  readonly recoveryToken: string;
  readonly incentiveDiscountPercent: number; // e.g. 10 for 10% off
  readonly status: AbandonmentStatus;
  readonly expiresAtMs: number;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface CartAbandonmentRecoveryEngineStateDTO {
  readonly tenantId: string;
  readonly records: Record<string, CartAbandonmentRecordDTO>; // recoveryId -> record
}

export class StorefrontCartAbandonmentRecoveryEngine {
  private readonly tenantId: string;
  private records: Map<string, CartAbandonmentRecordDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers an abandoned shopping cart and generates a recovery token.
   */
  public registerAbandonedCart(params: {
    recoveryId: string;
    sessionId: string;
    customerEmail: string;
    items: ReadonlyArray<AbandonedCartItemDTO>;
    incentiveDiscountPercent?: number;
    validityHours?: number;
  }): CartAbandonmentRecordDTO {
    const { recoveryId, sessionId, customerEmail, items } = params;

    if (!recoveryId || !sessionId || !customerEmail || !items || items.length === 0) {
      throw new Error('recoveryId, sessionId, customerEmail, and at least one item are required');
    }

    let cartTotal = 0;
    items.forEach(i => {
      if (i.quantity <= 0 || i.unitPrice < 0) {
        throw new Error(`Invalid item quantity or price for product ${i.productId}`);
      }
      cartTotal += i.quantity * i.unitPrice;
    });

    const now = Date.now();
    const validityHours = params.validityHours ?? 48; // 48h default
    const expiresAtMs = now + validityHours * 3600000;
    const recoveryToken = `rec_${now}_${Math.random().toString(36).substring(2, 10)}`;

    const dto: CartAbandonmentRecordDTO = {
      recoveryId: recoveryId.trim(),
      tenantId: this.tenantId,
      sessionId: sessionId.trim(),
      customerEmail: customerEmail.trim(),
      items: [...items],
      cartTotal: Math.round(cartTotal * 100) / 100,
      recoveryToken,
      incentiveDiscountPercent: params.incentiveDiscountPercent ?? 10,
      status: 'ABANDONED',
      expiresAtMs,
      createdAtMs: now,
      updatedAtMs: now
    };

    this.records.set(dto.recoveryId, dto);
    return dto;
  }

  /**
   * Evaluates recovery token link and converts status to RECOVERED when checkout is completed.
   */
  public redeemRecoveryToken(token: string): CartAbandonmentRecordDTO {
    const cleanToken = token.trim();
    const record = Array.from(this.records.values()).find(r => r.recoveryToken === cleanToken);

    if (!record) {
      throw new Error(`Recovery token ${token} invalid or not found`);
    }

    const now = Date.now();
    if (now > record.expiresAtMs) {
      const expired: CartAbandonmentRecordDTO = { ...record, status: 'EXPIRED', updatedAtMs: now };
      this.records.set(record.recoveryId, expired);
      throw new Error(`Recovery token ${token} has expired`);
    }

    if (record.status === 'RECOVERED') {
      throw new Error(`Recovery token ${token} has already been redeemed`);
    }

    const updated: CartAbandonmentRecordDTO = {
      ...record,
      status: 'RECOVERED',
      updatedAtMs: now
    };

    this.records.set(record.recoveryId, updated);
    return updated;
  }

  /**
   * Purges expired recovery token records from in-memory map to prevent memory leaks (G1-176 REFACTOR).
   */
  public purgeExpiredRecoveryTokens(): number {
    const now = Date.now();
    let purgedCount = 0;

    for (const [key, record] of this.records.entries()) {
      if (record.status === 'EXPIRED' || (record.status === 'ABANDONED' && now > record.expiresAtMs)) {
        this.records.delete(key);
        purgedCount++;
      }
    }

    return purgedCount;
  }

  public getRecord(recoveryId: string): CartAbandonmentRecordDTO | undefined {
    return this.records.get(recoveryId.trim());
  }


  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CartAbandonmentRecoveryEngineStateDTO {
    const record: Record<string, CartAbandonmentRecordDTO> = {};
    this.records.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      records: record
    };
  }

  public importState(state: CartAbandonmentRecoveryEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.records.clear();
    Object.entries(state.records || {}).forEach(([k, v]) => {
      this.records.set(k, v);
    });
  }
}
