/**
 * StorefrontCustomerConsentPrivacyEngine.ts — Sprint G1-155 GDPR/CCPA Privacy Consent Engine (Night Shift Level 104)
 *
 * Provides pure TypeScript, headless cookie consent management, category opt-in/opt-outs,
 * consent version auditing, and GDPR Right-to-be-Forgotten data deletion request tracking.
 *
 * External CMP platforms (OneTrust, Cookiebot) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type CookieCategory = 'NECESSARY' | 'ANALYTICS' | 'MARKETING' | 'PREFERENCES';

export type DeletionRequestStatus = 'REQUESTED' | 'PROCESSING' | 'COMPLETED' | 'REJECTED';

export interface CustomerPrivacyConsentDTO {
  readonly customerId: string;
  readonly tenantId: string;
  readonly ipCountryCode: string;
  readonly grantedCategories: ReadonlyArray<CookieCategory>;
  readonly consentPolicyVersion: string;
  readonly updatedAtMs: number;
}

export interface DataDeletionRequestDTO {
  readonly requestId: string;
  readonly tenantId: string;
  readonly customerId: string;
  readonly customerEmail: string;
  readonly status: DeletionRequestStatus;
  readonly requestedAtMs: number;
  readonly completedAtMs?: number;
}

export interface CustomerConsentPrivacyEngineStateDTO {
  readonly tenantId: string;
  readonly consents: Record<string, CustomerPrivacyConsentDTO>; // customerId -> consent
  readonly deletionRequests: Record<string, DataDeletionRequestDTO>; // requestId -> dto
}

export class StorefrontCustomerConsentPrivacyEngine {
  private readonly tenantId: string;
  private consents: Map<string, CustomerPrivacyConsentDTO> = new Map();
  private deletionRequests: Map<string, DataDeletionRequestDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Registers or updates a customer's privacy consent choices.
   */
  public updateConsent(params: {
    customerId: string;
    ipCountryCode: string;
    grantedCategories: ReadonlyArray<CookieCategory>;
    consentPolicyVersion?: string;
  }): CustomerPrivacyConsentDTO {
    const { customerId, ipCountryCode, grantedCategories } = params;

    if (!customerId || !ipCountryCode || !grantedCategories) {
      throw new Error('customerId, ipCountryCode, and grantedCategories are required');
    }

    const now = Date.now();
    // Always include NECESSARY
    const categoriesSet = new Set<CookieCategory>(['NECESSARY', ...grantedCategories]);

    const dto: CustomerPrivacyConsentDTO = {
      customerId: customerId.trim(),
      tenantId: this.tenantId,
      ipCountryCode: ipCountryCode.trim().toUpperCase(),
      grantedCategories: Array.from(categoriesSet),
      consentPolicyVersion: params.consentPolicyVersion ?? 'v1.0',
      updatedAtMs: now
    };

    this.consents.set(dto.customerId, dto);
    return dto;
  }

  /**
   * Submits a GDPR Right-to-be-Forgotten data erasure request.
   */
  public submitDataDeletionRequest(params: {
    requestId: string;
    customerId: string;
    customerEmail: string;
  }): DataDeletionRequestDTO {
    const { requestId, customerId, customerEmail } = params;

    if (!requestId || !customerId || !customerEmail) {
      throw new Error('requestId, customerId, and customerEmail are required');
    }

    const now = Date.now();
    const dto: DataDeletionRequestDTO = {
      requestId: requestId.trim(),
      tenantId: this.tenantId,
      customerId: customerId.trim(),
      customerEmail: customerEmail.trim(),
      status: 'REQUESTED',
      requestedAtMs: now
    };

    this.deletionRequests.set(dto.requestId, dto);
    return dto;
  }

  public getConsent(customerId: string): CustomerPrivacyConsentDTO | undefined {
    return this.consents.get(customerId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CustomerConsentPrivacyEngineStateDTO {
    const cRec: Record<string, CustomerPrivacyConsentDTO> = {};
    this.consents.forEach((val, key) => { cRec[key] = val; });

    const dRec: Record<string, DataDeletionRequestDTO> = {};
    this.deletionRequests.forEach((val, key) => { dRec[key] = val; });

    return {
      tenantId: this.tenantId,
      consents: cRec,
      deletionRequests: dRec
    };
  }

  public importState(state: CustomerConsentPrivacyEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.consents.clear();
    Object.entries(state.consents || {}).forEach(([k, v]) => { this.consents.set(k, v); });

    this.deletionRequests.clear();
    Object.entries(state.deletionRequests || {}).forEach(([k, v]) => { this.deletionRequests.set(k, v); });
  }
}
