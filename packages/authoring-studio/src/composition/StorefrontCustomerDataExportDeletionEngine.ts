/**
 * StorefrontCustomerDataExportDeletionEngine.ts — Sprint G1-104 Customer Data Lifecycle & GDPR Engine (Night Shift Level 66)
 *
 * Provides pure TypeScript, headless customer data export (Right to Portability) and dependency-aware data deletion
 * (Right to be Forgotten) workflows while preserving legally mandated order/tax retention locks.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type DataRequestType = 'EXPORT' | 'DELETE';

export type RequestStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED_LEGAL_RETENTION_LOCK';

export interface DataExportPayloadDTO {
  readonly customerId: string;
  readonly tenantId: string;
  readonly profileDataJson: string;
  readonly addressesJson: string;
  readonly orderHistorySummaryJson: string;
  readonly consentHistoryJson: string;
  readonly exportedAtMs: number;
}

export interface DataLifecycleRequestDTO {
  readonly requestId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly requestType: DataRequestType;
  readonly status: RequestStatus;
  readonly exportPayload?: DataExportPayloadDTO;
  readonly deletedDomains?: ReadonlyArray<string>;
  readonly retainedDomains?: ReadonlyArray<string>;
  readonly rejectionReason?: string;
  readonly requestedAtMs: number;
  readonly completedAtMs?: number;
}

export interface CustomerDataExportDeletionEngineStateDTO {
  readonly tenantId: string;
  readonly retentionWindowDays: number;
  readonly requests: Record<string, DataLifecycleRequestDTO>;
}

export class StorefrontCustomerDataExportDeletionEngine {
  private readonly tenantId: string;
  private readonly retentionWindowDays: number;
  private requests: Map<string, DataLifecycleRequestDTO> = new Map(); // requestId -> DataLifecycleRequestDTO

  constructor(tenantId = 'default_tenant', retentionWindowDays = 365 * 7) {
    this.tenantId = tenantId;
    this.retentionWindowDays = retentionWindowDays;
  }

  /**
   * Submits a customer data export request under GDPR Right to Portability.
   */
  public submitExportRequest(
    customerId: string,
    customerData: {
      profileDataJson: string;
      addressesJson: string;
      orderHistorySummaryJson: string;
      consentHistoryJson: string;
    }
  ): DataLifecycleRequestDTO {
    if (!customerId) {
      throw new Error('customerId is required for data export request');
    }

    const now = Date.now();
    const requestId = `req_exp_${now}_${Math.random().toString(36).substring(2, 7)}`;

    const exportPayload: DataExportPayloadDTO = {
      customerId: customerId.trim(),
      tenantId: this.tenantId,
      profileDataJson: customerData.profileDataJson,
      addressesJson: customerData.addressesJson,
      orderHistorySummaryJson: customerData.orderHistorySummaryJson,
      consentHistoryJson: customerData.consentHistoryJson,
      exportedAtMs: now
    };

    const request: DataLifecycleRequestDTO = {
      requestId,
      tenantId: this.tenantId,
      customerId: customerId.trim(),
      requestType: 'EXPORT',
      status: 'COMPLETED',
      exportPayload,
      requestedAtMs: now,
      completedAtMs: now
    };

    this.requests.set(requestId, request);
    return request;
  }

  /**
   * Submits a customer data deletion request under GDPR Right to be Forgotten.
   * Evaluates active orders and legal tax retention locks before executing deletion.
   */
  public submitDeletionRequest(
    customerId: string,
    options?: { hasActiveUnfulfilledOrders?: boolean; hasRecentLegalTaxOrders?: boolean }
  ): DataLifecycleRequestDTO {
    if (!customerId) {
      throw new Error('customerId is required for data deletion request');
    }

    const now = Date.now();
    const requestId = `req_del_${now}_${Math.random().toString(36).substring(2, 7)}`;

    if (options?.hasActiveUnfulfilledOrders) {
      const rejected: DataLifecycleRequestDTO = {
        requestId,
        tenantId: this.tenantId,
        customerId: customerId.trim(),
        requestType: 'DELETE',
        status: 'REJECTED_LEGAL_RETENTION_LOCK',
        rejectionReason: 'Cannot delete customer profile with active unfulfilled orders',
        requestedAtMs: now,
        completedAtMs: now
      };
      this.requests.set(requestId, rejected);
      return rejected;
    }

    // Dependency-aware soft deletion: profile & cart erased, financial order records retained anonymously for tax compliance
    const deletedDomains = ['PROFILE_DATA', 'SAVED_ADDRESSES', 'SAVED_CARTS', 'COMMUNICATION_PREFERENCES'];
    const retainedDomains = options?.hasRecentLegalTaxOrders ? ['ANONYMIZED_TAX_INVOICES', 'ANONYMIZED_ORDER_RECORDS'] : [];

    const request: DataLifecycleRequestDTO = {
      requestId,
      tenantId: this.tenantId,
      customerId: customerId.trim(),
      requestType: 'DELETE',
      status: 'COMPLETED',
      deletedDomains,
      retainedDomains,
      requestedAtMs: now,
      completedAtMs: now
    };

    this.requests.set(requestId, request);
    return request;
  }

  public getRequest(requestId: string): DataLifecycleRequestDTO | undefined {
    return this.requests.get(requestId);
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CustomerDataExportDeletionEngineStateDTO {
    const record: Record<string, DataLifecycleRequestDTO> = {};
    this.requests.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      retentionWindowDays: this.retentionWindowDays,
      requests: record
    };
  }

  public importState(state: CustomerDataExportDeletionEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.requests.clear();
    Object.entries(state.requests || {}).forEach(([k, v]) => {
      this.requests.set(k, v);
    });
  }
}
