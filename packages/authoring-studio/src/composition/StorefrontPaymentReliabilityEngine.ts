/**
 * StorefrontPaymentReliabilityEngine.ts — Sprint G1-91 Payment Lifecycle Reliability (Night Shift Level 53)
 *
 * Provides pure TypeScript, headless payment lifecycle reliability management.
 * Handles idempotency protection, duplicate payment prevention, retry state management,
 * payment failure recovery, and status reconciliation.
 *
 * External payment gateways remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'RECONCILED' | 'REFUNDED';

export type PaymentRetryState = 'INITIAL' | 'RETRYABLE' | 'EXHAUSTED' | 'CANCELLED';

export interface PaymentAttemptDTO {
  readonly paymentId: string;
  readonly orderId: string;
  readonly tenantId: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: PaymentStatus;
  readonly idempotencyKey: string;
  readonly attemptCount: number;
  readonly maxAttempts: number;
  readonly retryState: PaymentRetryState;
  readonly failureReason?: string;
  readonly createdAt: number;
  readonly updatedAt: number;
}

export interface PaymentIdempotencyRecordDTO {
  readonly idempotencyKey: string;
  readonly paymentId: string;
  readonly tenantId: string;
  readonly status: PaymentStatus;
  readonly payloadHash: string;
  readonly createdAt: number;
}

export interface PaymentReconciliationItemDTO {
  readonly paymentId: string;
  readonly expectedStatus: PaymentStatus;
  readonly actualStatus: PaymentStatus;
  readonly resolvedStatus: PaymentStatus;
  readonly actionTaken: 'NO_ACTION' | 'STATUS_UPDATED' | 'FAILURE_RECORDED' | 'MANUAL_REVIEW_REQUIRED';
}

export interface PaymentReconciliationResultDTO {
  readonly tenantId: string;
  readonly timestamp: number;
  readonly totalChecked: number;
  readonly reconciledCount: number;
  readonly mismatchedCount: number;
  readonly items: ReadonlyArray<PaymentReconciliationItemDTO>;
}

export interface PaymentReliabilityEngineStateDTO {
  readonly tenantId: string;
  readonly attempts: Record<string, PaymentAttemptDTO>;
  readonly idempotencyRegistry: Record<string, PaymentIdempotencyRecordDTO>;
}

export class StorefrontPaymentReliabilityEngine {
  private readonly tenantId: string;
  private attempts: Map<string, PaymentAttemptDTO> = new Map();
  private idempotencyRegistry: Map<string, PaymentIdempotencyRecordDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Processes a new payment attempt with idempotency key validation to prevent duplicate charges.
   */
  public processPaymentAttempt(
    params: {
      orderId: string;
      amount: number;
      currency: string;
      idempotencyKey: string;
      maxAttempts?: number;
    }
  ): { status: 'NEW' | 'DUPLICATE_IGNORED' | 'EXISTING_RECORD'; attempt: PaymentAttemptDTO } {
    if (!params.orderId || !params.idempotencyKey || params.amount <= 0) {
      throw new Error('Invalid payment parameters: orderId, idempotencyKey, and positive amount are required');
    }

    const payloadHash = `${params.orderId}:${params.amount}:${params.currency}`;
    const existingIdempotency = this.idempotencyRegistry.get(params.idempotencyKey);

    if (existingIdempotency) {
      if (existingIdempotency.payloadHash !== payloadHash) {
        throw new Error('Idempotency key collision with mismatched payload data');
      }
      const existingAttempt = this.attempts.get(existingIdempotency.paymentId);
      if (existingAttempt) {
        return {
          status: existingAttempt.status === 'SUCCESS' ? 'DUPLICATE_IGNORED' : 'EXISTING_RECORD',
          attempt: existingAttempt
        };
      }
    }

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();

    const newAttempt: PaymentAttemptDTO = {
      paymentId,
      orderId: params.orderId,
      tenantId: this.tenantId,
      amount: params.amount,
      currency: params.currency.toUpperCase(),
      status: 'PENDING',
      idempotencyKey: params.idempotencyKey,
      attemptCount: 1,
      maxAttempts: params.maxAttempts ?? 3,
      retryState: 'INITIAL',
      createdAt: now,
      updatedAt: now
    };

    const idempotencyRecord: PaymentIdempotencyRecordDTO = {
      idempotencyKey: params.idempotencyKey,
      paymentId,
      tenantId: this.tenantId,
      status: 'PENDING',
      payloadHash,
      createdAt: now
    };

    this.attempts.set(paymentId, newAttempt);
    this.idempotencyRegistry.set(params.idempotencyKey, idempotencyRecord);

    return { status: 'NEW', attempt: newAttempt };
  }

  /**
   * Updates payment status upon gateway response.
   */
  public updatePaymentStatus(paymentId: string, status: PaymentStatus, failureReason?: string): PaymentAttemptDTO {
    const existing = this.attempts.get(paymentId);
    if (!existing) {
      throw new Error(`Payment attempt not found: ${paymentId}`);
    }

    if (existing.status === 'SUCCESS' && status !== 'REFUNDED') {
      throw new Error(`Cannot transition successful payment ${paymentId} to status ${status}`);
    }

    let retryState = existing.retryState;
    if (status === 'FAILED') {
      if (existing.attemptCount >= existing.maxAttempts) {
        retryState = 'EXHAUSTED';
      } else {
        retryState = 'RETRYABLE';
      }
    } else if (status === 'SUCCESS') {
      retryState = 'INITIAL';
    }

    const updated: PaymentAttemptDTO = {
      ...existing,
      status,
      retryState,
      failureReason: failureReason ?? existing.failureReason,
      updatedAt: Date.now()
    };

    this.attempts.set(paymentId, updated);

    // Update idempotency record status
    const idempotencyRecord = this.idempotencyRegistry.get(existing.idempotencyKey);
    if (idempotencyRecord) {
      this.idempotencyRegistry.set(existing.idempotencyKey, {
        ...idempotencyRecord,
        status
      });
    }

    return updated;
  }

  /**
   * Retries a failed payment if attempts are remaining.
   */
  public retryPaymentAttempt(paymentId: string): PaymentAttemptDTO {
    const existing = this.attempts.get(paymentId);
    if (!existing) {
      throw new Error(`Payment attempt not found: ${paymentId}`);
    }

    if (existing.status === 'SUCCESS') {
      throw new Error(`Payment ${paymentId} already succeeded; retry forbidden`);
    }

    if (existing.retryState === 'EXHAUSTED') {
      throw new Error(`Payment ${paymentId} retry attempts exhausted (${existing.attemptCount}/${existing.maxAttempts})`);
    }

    const updatedCount = existing.attemptCount + 1;
    const retryState: PaymentRetryState = updatedCount >= existing.maxAttempts ? 'EXHAUSTED' : 'RETRYABLE';

    const retried: PaymentAttemptDTO = {
      ...existing,
      attemptCount: updatedCount,
      status: 'PROCESSING',
      retryState,
      updatedAt: Date.now()
    };

    this.attempts.set(paymentId, retried);
    return retried;
  }

  /**
   * Reconciles internal payment states with external gateway status records.
   */
  public reconcilePaymentStatuses(externalStatusMap: Record<string, PaymentStatus>): PaymentReconciliationResultDTO {
    const items: PaymentReconciliationItemDTO[] = [];
    let reconciledCount = 0;
    let mismatchedCount = 0;

    for (const [paymentId, externalStatus] of Object.entries(externalStatusMap)) {
      const existing = this.attempts.get(paymentId);
      if (!existing) {
        mismatchedCount++;
        items.push({
          paymentId,
          expectedStatus: externalStatus,
          actualStatus: 'PENDING',
          resolvedStatus: externalStatus,
          actionTaken: 'MANUAL_REVIEW_REQUIRED'
        });
        continue;
      }

      if (existing.status === externalStatus) {
        reconciledCount++;
        items.push({
          paymentId,
          expectedStatus: externalStatus,
          actualStatus: existing.status,
          resolvedStatus: existing.status,
          actionTaken: 'NO_ACTION'
        });
      } else {
        mismatchedCount++;
        const resolvedStatus = externalStatus;
        this.updatePaymentStatus(paymentId, resolvedStatus, 'Status reconciled from payment gateway boundary');
        items.push({
          paymentId,
          expectedStatus: externalStatus,
          actualStatus: existing.status,
          resolvedStatus,
          actionTaken: 'STATUS_UPDATED'
        });
      }
    }

    return {
      tenantId: this.tenantId,
      timestamp: Date.now(),
      totalChecked: Object.keys(externalStatusMap).length,
      reconciledCount,
      mismatchedCount,
      items
    };
  }

  public getPayment(paymentId: string): PaymentAttemptDTO | undefined {
    return this.attempts.get(paymentId);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): PaymentReliabilityEngineStateDTO {
    const attemptsRecord: Record<string, PaymentAttemptDTO> = {};
    this.attempts.forEach((val, key) => {
      attemptsRecord[key] = val;
    });

    const idempotencyRecord: Record<string, PaymentIdempotencyRecordDTO> = {};
    this.idempotencyRegistry.forEach((val, key) => {
      idempotencyRecord[key] = val;
    });

    return {
      tenantId: this.tenantId,
      attempts: attemptsRecord,
      idempotencyRegistry: idempotencyRecord
    };
  }

  public importState(state: PaymentReliabilityEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.attempts.clear();
    this.idempotencyRegistry.clear();

    Object.entries(state.attempts || {}).forEach(([k, v]) => {
      this.attempts.set(k, v);
    });
    Object.entries(state.idempotencyRegistry || {}).forEach(([k, v]) => {
      this.idempotencyRegistry.set(k, v);
    });
  }
}
